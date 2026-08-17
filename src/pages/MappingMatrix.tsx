/** STEP 8 — professional product-to-stage matrix and cross-company comparison. */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMappings } from "@/store/useMappings";
import { useProducts } from "@/store/useProducts";
import { useApp } from "@/store/useApp";
import { TREATMENT_STAGES } from "@/data/treatmentStages";
import {
  DECISION_LABEL, EVIDENCE_LEVEL_LABEL, MAPPING_STATUS_LABEL, STAS_MAPPING_GAP,
} from "@/data/productMappings";
import type { ProductStageMapping } from "@/data/productMappings";
import {
  compareMappings, visibleMappings, audienceForRole, SAFE_FALLBACK, COMPARISON_DIMENSIONS,
} from "@/lib/mappingEngine";
import { ArrowLeft, Grid3X3, ShieldAlert } from "lucide-react";

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-medium transition ${
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/40 text-muted-foreground"
  }`;

const decisionTone = (d: ProductStageMapping["decision"]) =>
  d === "recommended" || d === "domestic_use_suitable"
    ? "bg-emerald-600 text-white"
    : d === "not_recommended"
      ? "bg-destructive text-destructive-foreground"
      : "bg-muted text-muted-foreground";

export default function MappingMatrix() {
  const store = useMappings();
  const products = useProducts();
  const user = useApp((s) => s.user);
  const isReviewer = user?.role === "admin";
  const audience = audienceForRole(isReviewer ? "technical_reviewer" : "domestic_user", isReviewer);

  const all = useMemo(
    () => store.mappings(),
    [store.mappingOverrides, store.customMappings],
  );
  const productList = useMemo(() => products.products(), [products.productOverrides, products.customProducts]);
  const companies = useMemo(() => products.companies(), [products.companyOverrides, products.customCompanies]);

  const [company, setCompany] = useState<string>("all");
  const [stage, setStage] = useState<number | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);

  const visible = useMemo(() => visibleMappings(all, audience), [all, audience]);

  const rows = visible
    .map((v) => v.mapping)
    .filter((m) => (company === "all" ? true : m.companyKey === company))
    .filter((m) => (stage === "all" ? true : m.stageNumber === stage));

  const nameOf = (key: string) => productList.find((p) => p.key === key)?.displayName ?? key;

  const comparison = useMemo(
    () => (selected.length > 1 ? compareMappings(all.filter((m) => selected.includes(m.mappingId))) : undefined),
    [selected, all],
  );

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  if (audience === "domestic" && rows.length === 0) {
    return (
      <div className="p-4 space-y-4 pb-24">
        <Link to="/stain-master" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Stain Master
        </Link>
        <Card className="p-4 border-amber-500/40 space-y-2">
          <div className="flex items-center gap-2 text-amber-600">
            <ShieldAlert className="h-4 w-4" /><p className="font-semibold text-sm">No products can be shown</p>
          </div>
          <p className="text-sm">{SAFE_FALLBACK}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-primary/15 to-accent/10 p-4 space-y-2">
        <Link to="/stain-master" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Stain Master
        </Link>
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Product-to-stage matrix</h1>
            <p className="text-xs text-muted-foreground">
              Products at the same stage are alternatives, not equivalents.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button className={chip(company === "all")} onClick={() => setCompany("all")}>All companies</button>
          {companies.map((c) => (
            <button key={c.key} className={chip(company === c.key)} onClick={() => setCompany(c.key)}>
              {c.displayName}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={chip(stage === "all")} onClick={() => setStage("all")}>All stages</button>
          {TREATMENT_STAGES.filter((s) => s.actionable).map((s) => (
            <button key={s.stageId} className={chip(stage === s.stageNumber)} onClick={() => setStage(s.stageNumber)}>
              {s.stageNumber}
            </button>
          ))}
        </div>

        <Card className="p-3 border-amber-500/40 text-xs text-muted-foreground">
          <span className="font-semibold text-amber-600">Mapping gap — STAS. </span>
          {STAS_MAPPING_GAP.message}
        </Card>

        <div className="space-y-2">
          {rows.map((m) => (
            <Card key={m.mappingId} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{nameOf(m.productKey)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.mappingId} · Stage {m.stageNumber} · v{m.version} · {m.country}
                  </p>
                </div>
                <Badge className={decisionTone(m.decision)}>{DECISION_LABEL[m.decision]}</Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px]">{MAPPING_STATUS_LABEL[m.status]}</Badge>
                <Badge variant="outline" className="text-[10px]">{EVIDENCE_LEVEL_LABEL[m.evidenceLevel]}</Badge>
                <Badge variant="outline" className="text-[10px]">{m.specificity.replace(/_/g, " ")}</Badge>
              </div>
              {m.flags.length > 0 && (
                <ul className="list-disc pl-5 text-[11px] text-muted-foreground space-y-0.5">
                  {m.flags.slice(0, 3).map((f) => <li key={f}>{f}</li>)}
                </ul>
              )}
              {isReviewer && (
                <div className="flex gap-2">
                  <Button size="sm" variant={selected.includes(m.mappingId) ? "default" : "outline"} onClick={() => toggle(m.mappingId)}>
                    {selected.includes(m.mappingId) ? "In comparison" : "Compare"}
                  </Button>
                  <Link to={`/admin/mapping-editor?mapping=${m.mappingId}`}>
                    <Button size="sm" variant="ghost">Edit</Button>
                  </Link>
                </div>
              )}
            </Card>
          ))}
          {rows.length === 0 && <p className="text-sm text-muted-foreground">No mappings match these filters.</p>}
        </div>

        {comparison && (
          <Card className="p-3 space-y-2 overflow-x-auto">
            <p className="font-semibold text-sm">Cross-company comparison</p>
            <p className="text-[11px] text-muted-foreground">{comparison.warning}</p>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left">
                  <th className="p-1">Dimension</th>
                  {comparison.rows.map((r) => <th key={r.mappingId} className="p-1">{r.productName}</th>)}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DIMENSIONS.map((d) => (
                  <tr key={d} className="border-t border-border">
                    <td className="p-1 font-medium capitalize">{d.replace(/_/g, " ")}</td>
                    {comparison.rows.map((r) => (
                      <td key={r.mappingId + d} className={`p-1 ${r.cells[d]?.comparable ? "" : "text-muted-foreground"}`}>
                        {r.cells[d]?.value ?? "Insufficient Information"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
