/** STEP 13 — role-aware three-kit (n-kit) comparison screen. */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMappings } from "@/store/useMappings";
import { useProducts } from "@/store/useProducts";
import { useComparisons } from "@/store/useComparisons";
import { TREATMENT_STAGES } from "@/data/treatmentStages";
import { TEXTILE_KEYS, COLOUR_TARGET_KEYS, PROCESS_KEYS } from "@/data/professionalProducts";
import type { TextileKey, ColourTargetKey, ProcessKey } from "@/data/professionalProducts";
import {
  INITIAL_KIT_STATUS, RANK_LABEL, SELECTION_LABEL, COMPARISON_TABLE_COLUMNS,
  COMPARABILITY_LABEL, CHECKLIST_LABEL, DOMESTIC_PUBLIC_STATEMENT,
} from "@/data/kitComparison";
import type { EvidenceChecklistKey } from "@/data/kitComparison";
import {
  buildComparison, comparisonRows, comparisonAudience, quickProfessionalView,
  universalTechnicalView, emptyContext,
} from "@/lib/comparisonEngine";
import { ArrowLeft, ShieldAlert, Scale, Info } from "lucide-react";

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-medium transition ${
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/40 text-muted-foreground"
  }`;

const ROLES = ["domestic_user", "laundry_employee", "professional_spotter", "technical_reviewer"] as const;

export default function KitComparison() {
  const mappingStore = useMappings();
  const productStore = useProducts();
  const comparisonStore = useComparisons();

  const [role, setRole] = useState<(typeof ROLES)[number]>("professional_spotter");
  const [stage, setStage] = useState(5);
  const [textile, setTextile] = useState<TextileKey>("cotton");
  const [colour, setColour] = useState<ColourTargetKey>("white");
  const [process, setProcess] = useState<ProcessKey>("hand_spotting");
  const [country, setCountry] = useState("IN");
  const [technical, setTechnical] = useState(false);

  const mappings = useMemo(() => mappingStore.mappings(), [mappingStore.mappingOverrides, mappingStore.customMappings]);
  const products = useMemo(
    () => Object.fromEntries(productStore.products().map((p) => [p.key, p])),
    [productStore.productOverrides, productStore.customProducts],
  );

  const audience = comparisonAudience(role, role === "technical_reviewer");

  const result = useMemo(() => {
    const ctx = emptyContext({
      comparisonId: comparisonStore.nextComparisonId(),
      stainKey: "coffee",
      stageNumber: stage,
      textile, colour, process, country,
      role: role as never,
      riskLevel: "green",
      ppeAvailable: ["protective_gloves"],
      ventilationAvailable: true,
    });
    const built = buildComparison(ctx, {
      mappings,
      products,
      docs: productStore.documents(),
      trials: comparisonStore.trials,
      prices: comparisonStore.prices,
      sustainability: comparisonStore.sustainability,
    });
    return universalTechnicalView(built);
  }, [mappings, products, stage, textile, colour, process, country, role, comparisonStore.trials, comparisonStore.prices]);

  const rows = comparisonRows(result);
  const quick = quickProfessionalView(result);

  if (audience === "domestic") {
    return (
      <div className="space-y-4 p-4">
        <Link to="/stain-master" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Card className="space-y-3 p-5">
          <h1 className="text-lg font-semibold">Professional product comparison</h1>
          <p className="text-sm text-muted-foreground">{DOMESTIC_PUBLIC_STATEMENT}</p>
          <p className="text-xs text-muted-foreground">
            Professional kit comparisons, product ranking and PPE-dependent procedures are not shown in domestic mode.
          </p>
        </Card>
        <RolePicker role={role} setRole={setRole} />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      <Link to="/stain-master" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Kit comparison</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Products are compared only under the case conditions recorded below. Brands are never compared in the abstract.
      </p>

      <RolePicker role={role} setRole={setRole} />

      <Card className="space-y-3 p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Case context</p>
        <Picker label="Stage" value={String(stage)} options={TREATMENT_STAGES.map((s) => ({ v: String(s.stageNumber), l: `${s.stageNumber}` }))} onChange={(v) => setStage(Number(v))} />
        <Picker label="Fabric" value={textile} options={TEXTILE_KEYS.map((k) => ({ v: k, l: k.replace(/_/g, " ") }))} onChange={(v) => setTextile(v as TextileKey)} />
        <Picker label="Colour" value={colour} options={COLOUR_TARGET_KEYS.map((k) => ({ v: k, l: k }))} onChange={(v) => setColour(v as ColourTargetKey)} />
        <Picker label="Process" value={process} options={PROCESS_KEYS.map((k) => ({ v: k, l: k.replace(/_/g, " ") }))} onChange={(v) => setProcess(v as ProcessKey)} />
        <Picker label="Country" value={country} options={[{ v: "IN", l: "IN" }, { v: "DE", l: "DE" }, { v: "unspecified", l: "unspecified" }]} onChange={setCountry} />
      </Card>

      <Card className="space-y-2 border-primary/40 p-4">
        <p className="text-sm font-semibold">{result.headline}</p>
        <p className="text-xs text-muted-foreground">{result.comparability.message}</p>
        {!result.ranked && result.noRankReason && (
          <p className="text-xs text-muted-foreground">Ranking unavailable — missing: {result.noRankReason}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Comparison {result.comparisonId} · status {result.status.replace(/_/g, " ")} · {result.engineVersion}
        </p>
      </Card>

      {/* Quick professional comparison (§25) */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Quick professional comparison</p>
        <p className="text-xs text-muted-foreground">{quick.action}</p>
        {quick.cards.length === 0 && (
          <Card className="p-4 text-sm text-muted-foreground">
            No product mapping exists for this treatment stage.
          </Card>
        )}
        {quick.cards.map((c, i) => {
          const entry = result.entries[i];
          return (
            <Card key={c.product} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{c.product}</p>
                  <p className="text-xs text-muted-foreground">{c.company}</p>
                </div>
                <Badge variant={entry.selection === "included" ? "default" : "secondary"}>
                  {SELECTION_LABEL[entry.selection]}
                </Badge>
              </div>
              {/* Critical restrictions are never hidden behind a disclosure (§24). */}
              {rows[i].criticalWarnings.map((w) => (
                <p key={w} className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {w}
                </p>
              ))}
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <Field k="Testing" v={c.testingRequired} />
                <Field k="Main restriction" v={c.mainRestriction} />
                <Field k="Required process" v={c.requiredProcess} />
                <Field k="PPE" v={c.ppe} />
                <Field k="Evidence" v={c.evidenceStatus} />
                <Field k="Decision" v={c.decision} />
                <Field k="Cost per use" v={rows[i].costPerUse} />
                <Field k="Rank" v={c.rank ? RANK_LABEL[entry.rank] : "Not shown — ranking unsupported"} />
              </dl>
              <Button variant="outline" size="sm" onClick={() => setTechnical((t) => !t)}>
                Compare details
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Technical comparison (§26) */}
      {technical && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Technical comparison</p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[880px] text-left text-xs">
              <thead className="bg-muted/50">
                <tr>{COMPARISON_TABLE_COLUMNS.map((c) => <th key={c} className="p-2 font-semibold">{c}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.kitProduct} className="border-t align-top">
                    <td className="p-2">{r.company}</td>
                    <td className="p-2">{r.kitProduct}</td>
                    <td className="p-2">{r.stage}</td>
                    <td className="p-2">{r.targetStain}</td>
                    <td className="p-2">{r.fabricRestrictions}</td>
                    <td className="p-2">{r.processRequirement}</td>
                    <td className="p-2">{r.ppe}</td>
                    <td className="p-2">{r.costPerUse}</td>
                    <td className="p-2">{r.advantages}</td>
                    <td className="p-2">{r.limitations}</td>
                    <td className="p-2">{RANK_LABEL[r.finalRank as never] ?? r.finalRank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.entries.map((e) => (
            <Card key={e.productKey} className="space-y-2 p-4 text-xs">
              <p className="text-sm font-semibold">{e.dimensions.productName} — evidence completeness</p>
              <p className="text-muted-foreground">{e.dimensions.verificationCompleteness}</p>
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {(Object.keys(e.checklist) as EvidenceChecklistKey[]).map((k) => (
                  <li key={k} className={e.checklist[k] ? "text-emerald-600" : "text-muted-foreground"}>
                    {e.checklist[k] ? "✓" : "•"} {CHECKLIST_LABEL[k]}
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground">Cost formula: {e.cost.formula}</p>
              <p className="text-muted-foreground">Rank logic: {e.rankEligible ? "Rank eligible" : e.rankEligibilityFailures.join(" ")}</p>
            </Card>
          ))}

          <Card className="space-y-2 p-4 text-xs">
            <p className="text-sm font-semibold">Comparability gate</p>
            {result.comparability.checks.map((c) => (
              <p key={c.key} className={c.passed ? "text-emerald-600" : "text-muted-foreground"}>
                {c.passed ? "✓" : "✗"} {COMPARABILITY_LABEL[c.key]} — {c.note}
              </p>
            ))}
          </Card>
        </div>
      )}

      <Card className="space-y-3 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold"><Info className="h-4 w-4" /> Kit status</p>
        {INITIAL_KIT_STATUS.map((k) => (
          <div key={k.companyKey} className="space-y-1 border-t pt-2 first:border-0 first:pt-0">
            <p className="text-sm font-medium capitalize">{k.companyKey.replace(/_/g, " ")}</p>
            <p className="text-xs text-muted-foreground">{k.summary}</p>
            <ul className="list-disc pl-4 text-xs text-muted-foreground">
              {k.unresolved.map((u) => <li key={u}>{u}</li>)}
            </ul>
            <Badge variant="secondary">{k.rankable ? "Rankable" : "Unranked"}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}

function RolePicker({ role, setRole }: { role: string; setRole: (r: never) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ROLES.map((r) => (
        <button key={r} className={chip(role === r)} onClick={() => setRole(r as never)}>
          {r.replace(/_/g, " ")}
        </button>
      ))}
    </div>
  );
}

function Picker({
  label, value, options, onChange,
}: { label: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o.v} className={chip(value === o.v)} onClick={() => onChange(o.v)}>{o.l}</button>
        ))}
      </div>
    </div>
  );
}

const Field = ({ k, v }: { k: string; v: string }) => (
  <div>
    <dt className="text-muted-foreground">{k}</dt>
    <dd className="font-medium">{v}</dd>
  </div>
);
