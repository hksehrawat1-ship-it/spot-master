/** Administrator review queue for proposed stain aliases. Only approved, active aliases reach public search. */

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type AliasRow = {
  id: string;
  stain_record_id: string;
  alias: string;
  alias_type: string | null;
  language: string;
  region: string | null;
  source_note: string | null;
  review_status: string;
  is_active: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

type Named = { id: string; canonical_name: string; stable_id: string };

export default function AdminAliases() {
  const { toast } = useToast();
  const [rows, setRows] = useState<AliasRow[]>([]);
  const [records, setRecords] = useState<Record<string, Named>>({});
  const [counts, setCounts] = useState({ total: 0, approved: 0, pending: 0, records: 0 });
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("stain_record_aliases")
      .select("id, stain_record_id, alias, alias_type, language, region, source_note, review_status, is_active, reviewed_by, reviewed_at")
      .order("review_status")
      .order("alias")
      .limit(500);
    const list = (data ?? []) as AliasRow[];
    setRows(list);
    setCounts({
      total: list.length,
      approved: list.filter((a) => a.review_status === "approved" && a.is_active).length,
      pending: list.filter((a) => a.review_status !== "approved").length,
      records: new Set(list.map((a) => a.stain_record_id)).size,
    });
    const ids = Array.from(new Set(list.map((a) => a.stain_record_id)));
    if (ids.length) {
      const { data: recs } = await supabase
        .from("stain_records")
        .select("id, canonical_name, stable_id")
        .in("id", ids);
      setRecords(Object.fromEntries(((recs ?? []) as Named[]).map((r) => [r.id, r])));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(alias: AliasRow, status: "approved" | "rejected") {
    setBusy(alias.id);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("stain_record_aliases")
      .update({
        review_status: status,
        is_active: status === "approved",
        reviewed_by: userData?.user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", alias.id);
    setBusy(null);
    if (error) {
      toast({ title: "The alias could not be updated", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "approved" ? "Alias approved" : "Alias rejected", description: alias.alias });
    void load();
  }

  const pending = rows.filter((a) => a.review_status !== "approved");
  const approved = rows.filter((a) => a.review_status === "approved");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 pb-24">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Alias review queue</h1>
        <p className="text-sm text-muted-foreground">
          Only approved, active aliases appear in public search. Spelling variants such as colour/color, mould/mold,
          grey/gray, aluminium/aluminum and sulphur/sulfur are handled automatically and need no alias row.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Alias rows", counts.total],
          ["Approved and active", counts.approved],
          ["Awaiting review", counts.pending],
          ["Stains covered", counts.records],
        ].map(([label, value]) => (
          <Card key={label as string} className="p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </Card>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Awaiting review</h2>
            {pending.length === 0 && <p className="text-sm text-muted-foreground">No alias is waiting for review.</p>}
            {pending.map((a) => (
              <Card key={a.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold break-words">{a.alias}</p>
                    <p className="text-xs text-muted-foreground">
                      {records[a.stain_record_id] ? (
                        <Link to={`/stain/${records[a.stain_record_id].stable_id}`} className="hover:underline">
                          {records[a.stain_record_id].canonical_name}
                        </Link>
                      ) : (
                        "—"
                      )}{" "}
                      · {a.language}
                      {a.region ? ` · ${a.region}` : ""}
                      {a.alias_type ? ` · ${a.alias_type}` : ""}
                    </p>
                    {a.source_note && <p className="mt-1 text-xs text-muted-foreground">Source: {a.source_note}</p>}
                  </div>
                  <Badge variant="secondary" className="shrink-0">{a.review_status}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy === a.id} onClick={() => review(a, "approved")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy === a.id} onClick={() => review(a, "rejected")}>
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Approved aliases</h2>
            <Card className="divide-y">
              {approved.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <span className="min-w-0 break-words">
                    {a.alias}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {records[a.stain_record_id]?.canonical_name ?? "—"} · {a.language}
                      {a.region ? ` · ${a.region}` : ""}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy === a.id}
                    onClick={() => review(a, "rejected")}
                  >
                    Withdraw
                  </Button>
                </div>
              ))}
              {approved.length === 0 && <p className="p-3 text-sm text-muted-foreground">None yet.</p>}
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
