/**
 * Mapping matrix — read-only overview of canonical guidance mappings.
 * The stain library never depends on this data; an empty matrix is a valid state.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccess } from "@/auth/useAccess";
import { useGuidanceMappings } from "@/hooks/useGuidanceMappings";
import { ArrowLeft, Grid3X3 } from "lucide-react";

export default function MappingMatrix() {
  const access = useAccess();
  const isMaintainer = access.productDrafts;
  const mappings = useGuidanceMappings({ includeDrafts: isMaintainer });
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (mappings.data ?? []).filter((m) =>
      !q
        ? true
        : [m.stain_records?.canonical_name, m.stain_records?.stable_id, m.professional_products?.product_name, m.country]
            .join(" ")
            .toLowerCase()
            .includes(q),
    );
  }, [mappings.data, query]);

  const approved = rows.filter((m) => ["approved", "published"].includes(m.approval_status)).length;

  return (
    <div className="pb-24">
      <div className="space-y-2 bg-gradient-to-br from-primary/15 to-accent/10 p-4">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Product library
        </Link>
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Guidance mapping matrix</h1>
            <p className="text-xs text-muted-foreground">
              {approved} approved of {rows.length} readable mappings
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <Input placeholder="Search by stain, product or country" value={query} onChange={(e) => setQuery(e.target.value)} />

        {mappings.isLoading && <p className="text-sm text-muted-foreground">Loading mappings…</p>}

        {!mappings.isLoading && rows.length === 0 && (
          <Card className="border-amber-500/40 bg-amber-500/5 p-3 text-sm text-muted-foreground">
            No approved product guidance is available yet. Stain identification, safety rules and treatment stages
            continue to work without product mappings.
          </Card>
        )}

        <ul className="space-y-2">
          {rows.map((m) => (
            <li key={m.id}>
              <Card className="space-y-1 p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{m.stain_records?.canonical_name ?? m.stain_record_id}</span>
                  <Badge variant={["approved", "published"].includes(m.approval_status) ? "default" : "secondary"}>
                    {m.approval_status}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {m.stain_records?.stable_id} ·{" "}
                  {m.professional_products?.display_name ?? m.professional_products?.product_name} ·{" "}
                  {m.product_versions?.version_ref} · {m.country}
                </p>
                <p className="text-muted-foreground">
                  {m.decision} · evidence {m.evidence_level}
                  {m.mandatory_hidden_test ? " · hidden test required" : ""}
                </p>
              </Card>
            </li>
          ))}
        </ul>

        {isMaintainer && (
          <Button asChild variant="outline" className="w-full rounded-full">
            <Link to="/admin/mapping-editor">Open mapping editor</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
