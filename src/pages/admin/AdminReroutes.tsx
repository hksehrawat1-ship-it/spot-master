/** Administrator review queue for stain reroutes that could not be resolved to a category. */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type PendingRow = {
  id: string;
  stable_id: string;
  canonical_name: string;
  reroute_target: string | null;
};

export default function AdminReroutes() {
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [resolved, setResolved] = useState(0);
  const [totalWithTarget, setTotalWithTarget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [pendingRes, totalRes, resolvedRes] = await Promise.all([
        supabase
          .from("stain_records")
          .select("id, stable_id, canonical_name, reroute_target")
          .eq("reroute_pending", true)
          .order("canonical_name"),
        supabase
          .from("stain_records")
          .select("id", { count: "exact", head: true })
          .not("reroute_target", "is", null),
        supabase.from("stain_record_reroutes").select("stain_record_id"),
      ]);
      if (!active) return;
      if (pendingRes.error) setError(pendingRes.error.message);
      setPending((pendingRes.data ?? []) as PendingRow[]);
      setTotalWithTarget(totalRes.count ?? 0);
      setResolved(
        new Set(((resolvedRes.data ?? []) as { stain_record_id: string }[]).map((r) => r.stain_record_id)).size,
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 pb-24">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Reroute review queue</h1>
        <p className="text-sm text-muted-foreground">
          Reroutes that could not be matched confidently to one of the twelve active categories. The original text
          is kept and is never shown to users as a category.
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
              <p className="text-xs text-muted-foreground">Normalised</p>
              <p className="text-xl font-bold">{resolved}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Pending review</p>
              <p className="text-xl font-bold">{pending.length}</p>
            </Card>
          </div>

          <div className="space-y-2">
            {pending.map((p) => (
              <Card key={p.id} className="space-y-1 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/stain/${p.stable_id}`} className="font-semibold hover:underline">
                      {p.canonical_name}
                    </Link>
                    <p className="text-xs text-muted-foreground break-all">{p.stable_id}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">Pending</Badge>
                </div>
                <p className="rounded-md bg-muted p-2 text-xs">
                  Original text: {p.reroute_target ?? "—"}
                </p>
              </Card>
            ))}
            {pending.length === 0 && (
              <p className="text-sm text-muted-foreground">No reroute is waiting for review.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
