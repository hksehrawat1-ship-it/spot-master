/** Administrator review workflow for stain reroutes that could not be resolved automatically. */

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type CategoryRow = { id: string; category_number: number; canonical_name: string; slug: string };

type PendingRow = {
  id: string;
  stable_id: string;
  canonical_name: string;
  reroute_target: string | null;
  primary_category_id: string;
  searchable_secondary_category_ids: string[] | null;
  source_document_id: string | null;
  source_section: string | null;
};

type SuggestionRow = {
  id: string;
  stain_record_id: string;
  target_category_id: string;
  evidence_note: string | null;
  review_status: string;
};

export default function AdminReroutes() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [docs, setDocs] = useState<Record<string, string>>({});
  const [approvedLinks, setApprovedLinks] = useState(0);
  const [totalWithTarget, setTotalWithTarget] = useState(0);
  const [selection, setSelection] = useState<Record<string, Set<string>>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [catRes, pendingRes, totalRes, approvedRes, docRes] = await Promise.all([
      supabase
        .from("stain_categories")
        .select("id, category_number, canonical_name, slug")
        .eq("is_legacy", false)
        .not("category_number", "is", null)
        .order("category_number"),
      supabase
        .from("stain_records")
        .select(
          "id, stable_id, canonical_name, reroute_target, primary_category_id, searchable_secondary_category_ids, source_document_id, source_section",
        )
        .eq("reroute_pending", true)
        .order("canonical_name"),
      supabase.from("stain_records").select("id", { count: "exact", head: true }).not("reroute_target", "is", null),
      supabase
        .from("stain_record_reroutes")
        .select("id, stain_record_id, target_category_id, evidence_note, review_status")
        .order("sort_order"),
      supabase.from("source_documents").select("id, title"),
    ]);
    if (pendingRes.error) setError(pendingRes.error.message);
    setCategories((catRes.data ?? []) as CategoryRow[]);
    const rows = (pendingRes.data ?? []) as PendingRow[];
    setPending(rows);
    setTotalWithTarget(totalRes.count ?? 0);
    const links = (approvedRes.data ?? []) as SuggestionRow[];
    setApprovedLinks(links.filter((l) => l.review_status === "approved").length);
    setSuggestions(links.filter((l) => l.review_status === "suggested"));
    setDocs(Object.fromEntries(((docRes.data ?? []) as { id: string; title: string }[]).map((d) => [d.id, d.title])));
    setSelection((prev) => {
      const next = { ...prev };
      for (const r of rows) {
        if (!next[r.id]) {
          next[r.id] = new Set(
            links.filter((l) => l.stain_record_id === r.id && l.review_status === "suggested").map((l) => l.target_category_id),
          );
        }
      }
      return next;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (recordId: string, categoryId: string) =>
    setSelection((prev) => {
      const set = new Set(prev[recordId] ?? []);
      set.has(categoryId) ? set.delete(categoryId) : set.add(categoryId);
      return { ...prev, [recordId]: set };
    });

  async function approve(rec: PendingRow) {
    const targets = Array.from(selection[rec.id] ?? []);
    const note = (notes[rec.id] ?? "").trim();
    if (targets.length === 0) {
      toast({ title: "Select at least one target category", variant: "destructive" });
      return;
    }
    if (note.length < 10) {
      toast({ title: "A review note is required", description: "Record why this destination is correct.", variant: "destructive" });
      return;
    }
    setBusy(rec.id);
    const { data: userData } = await supabase.auth.getUser();
    const reviewer = userData?.user?.id ?? null;
    const now = new Date().toISOString();

    const { error: upErr } = await supabase.from("stain_record_reroutes").upsert(
      targets.map((target, i) => ({
        stain_record_id: rec.id,
        target_category_id: target,
        routing_note: rec.reroute_target,
        sort_order: i + 1,
        review_status: "approved",
        is_suggestion: false,
        evidence_note: note,
        reviewed_by: reviewer,
        reviewed_at: now,
      })),
      { onConflict: "stain_record_id,target_category_id" },
    );
    if (upErr) {
      setBusy(null);
      toast({ title: "The reroute could not be saved", description: upErr.message, variant: "destructive" });
      return;
    }

    await supabase.from("stain_records").update({ reroute_pending: false }).eq("id", rec.id);
    await supabase.from("content_audit_log").insert({
      table_name: "stain_record_reroutes",
      record_id: rec.id,
      action: "APPROVE",
      changed_by: reviewer,
      previous_data: { reroute_target: rec.reroute_target, reroute_pending: true },
      new_data: { target_category_ids: targets, review_note: note, reviewed_at: now },
    });
    setBusy(null);
    toast({ title: "Reroute approved", description: rec.canonical_name });
    void load();
  }

  async function reject(rec: PendingRow) {
    const note = (notes[rec.id] ?? "").trim();
    if (note.length < 10) {
      toast({ title: "A review note is required", description: "Record why the suggestion is wrong.", variant: "destructive" });
      return;
    }
    setBusy(rec.id);
    const { data: userData } = await supabase.auth.getUser();
    const reviewer = userData?.user?.id ?? null;
    const now = new Date().toISOString();
    const { error: rejErr } = await supabase
      .from("stain_record_reroutes")
      .update({ review_status: "rejected", evidence_note: note, reviewed_by: reviewer, reviewed_at: now })
      .eq("stain_record_id", rec.id)
      .eq("is_suggestion", true);
    if (rejErr) {
      setBusy(null);
      toast({ title: "The suggestion could not be rejected", description: rejErr.message, variant: "destructive" });
      return;
    }
    await supabase.from("content_audit_log").insert({
      table_name: "stain_record_reroutes",
      record_id: rec.id,
      action: "REJECT",
      changed_by: reviewer,
      previous_data: { reroute_target: rec.reroute_target },
      new_data: { review_note: note, reviewed_at: now },
    });
    setBusy(null);
    toast({ title: "Suggestion rejected", description: `${rec.canonical_name} stays pending.` });
    void load();
  }

  const catName = (id: string) => categories.find((c) => c.id === id)?.canonical_name ?? "—";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 pb-24">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Reroute review queue</h1>
        <p className="text-sm text-muted-foreground">
          Reroutes that could not be matched confidently to one of the twelve active categories. The original text is
          kept and is never shown to users as a category.
        </p>
      </header>

      {error && <p className="text-sm text-destructive">The queue could not be loaded.</p>}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Records with a reroute</p>
              <p className="text-xl font-bold">{totalWithTarget}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Approved category links</p>
              <p className="text-xl font-bold">{approvedLinks}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Pending review</p>
              <p className="text-xl font-bold">{pending.length}</p>
            </Card>
          </div>

          <div className="space-y-3">
            {pending.map((p) => {
              const sugg = suggestions.filter((s) => s.stain_record_id === p.id);
              const chosen = selection[p.id] ?? new Set<string>();
              return (
                <Card key={p.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/stain/${p.stable_id}`} className="font-semibold hover:underline">
                        {p.canonical_name}
                      </Link>
                      <p className="text-xs text-muted-foreground break-all">{p.stable_id}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Primary category: {catName(p.primary_category_id)}
                        {p.searchable_secondary_category_ids?.length
                          ? ` · Secondary: ${p.searchable_secondary_category_ids.map(catName).join(", ")}`
                          : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Source: {(p.source_document_id && docs[p.source_document_id]) || "—"}
                        {p.source_section ? ` · ${p.source_section}` : ""}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">Pending</Badge>
                  </div>

                  <p className="rounded-md bg-muted p-2 text-xs">Original text: {p.reroute_target ?? "—"}</p>

                  {sugg.map((s) => (
                    <div key={s.id} className="rounded-md border border-dashed p-2 text-xs">
                      <p className="font-semibold">
                        Suggested (unapproved): {catName(s.target_category_id)}
                      </p>
                      <p className="mt-0.5 text-muted-foreground">{s.evidence_note}</p>
                    </div>
                  ))}

                  <fieldset className="space-y-2">
                    <legend className="text-xs font-semibold">Target categories</legend>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {categories.map((c) => (
                        <label key={c.id} className="flex items-start gap-2 text-xs">
                          <Checkbox
                            checked={chosen.has(c.id)}
                            onCheckedChange={() => toggle(p.id, c.id)}
                            aria-label={c.canonical_name}
                          />
                          <span>
                            {c.category_number}. {c.canonical_name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <Textarea
                    value={notes[p.id] ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder="Review note (required): state the evidence for this decision."
                    rows={2}
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={busy === p.id} onClick={() => approve(p)}>
                      Approve reroute
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === p.id || sugg.length === 0}
                      onClick={() => reject(p)}
                    >
                      Reject suggestion
                    </Button>
                  </div>
                </Card>
              );
            })}
            {pending.length === 0 && (
              <p className="text-sm text-muted-foreground">No reroute is waiting for review.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
