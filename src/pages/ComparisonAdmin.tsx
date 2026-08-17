/** STEP 13 — comparison administration, evidence entry, approvals and audit. */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useMappings } from "@/store/useMappings";
import { useProducts } from "@/store/useProducts";
import { useComparisons } from "@/store/useComparisons";
import {
  INITIAL_KIT_STATUS, LEGACY_COMPARISON_CLAIMS, COMPARISON_REVIEW_TRIGGERS,
  COMPARISON_TRIGGER_LABEL, COMPARISON_STATUS_LABEL, RANK_PRIORITY,
} from "@/data/kitComparison";
import type { ComparisonReviewTrigger } from "@/data/kitComparison";
import { buildComparison, emptyContext, universalTechnicalView } from "@/lib/comparisonEngine";
import { runComparisonScenarios } from "@/lib/comparisonScenarios";
import { ArrowLeft, ClipboardCheck } from "lucide-react";

export default function ComparisonAdmin() {
  const mappingStore = useMappings();
  const productStore = useProducts();
  const store = useComparisons();
  const [justification, setJustification] = useState("");
  const [scenarioResult, setScenarioResult] = useState<ReturnType<typeof runComparisonScenarios> | null>(null);

  const mappings = useMemo(() => mappingStore.mappings(), [mappingStore.mappingOverrides, mappingStore.customMappings]);
  const products = useMemo(
    () => Object.fromEntries(productStore.products().map((p) => [p.key, p])),
    [productStore.productOverrides, productStore.customProducts],
  );

  const preview = useMemo(() => {
    const ctx = emptyContext({
      comparisonId: store.nextComparisonId(),
      stainKey: "coffee", stageNumber: 5, textile: "cotton", colour: "white",
      process: "hand_spotting", country: "IN", role: "trainer", riskLevel: "green",
    });
    return universalTechnicalView(buildComparison(ctx, {
      mappings, products, docs: productStore.documents(),
      trials: store.trials, prices: store.prices, sustainability: store.sustainability,
    }));
  }, [mappings, products, store.trials, store.prices, store.sustainability]);

  return (
    <div className="space-y-4 p-4 pb-24">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Admin
      </Link>
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Comparison administration</h1>
      </div>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Current preview</p>
        <p className="text-xs text-muted-foreground">{preview.headline}</p>
        <p className="text-xs text-muted-foreground">
          {preview.entries.length} product(s) · status {COMPARISON_STATUS_LABEL[preview.status]} · rank eligible:{" "}
          {preview.entries.filter((e) => e.rankEligible).length}
        </p>
        <Input
          placeholder="Written justification (required to approve a final ranking)"
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              store.saveComparison(preview.snapshot, preview.status, "reviewer");
              toast.success(`Snapshot ${preview.snapshot.comparisonId} stored.`);
            }}
          >
            Save snapshot
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              store.saveComparison(preview.snapshot, preview.status, "reviewer");
              const r = store.setStatus(preview.snapshot.comparisonId, "approved", { by: "reviewer", justification });
              r.ok ? toast.success(r.message) : toast.error(r.message);
            }}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              store.saveComparison(preview.snapshot, "not_comparable", "reviewer");
              toast.success("No-rank result approved and stored.");
            }}
          >
            Approve no-rank result
          </Button>
        </div>
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Ranking hierarchy</p>
        <ol className="list-decimal pl-5 text-xs text-muted-foreground">
          {RANK_PRIORITY.map((p) => <li key={p}>{p}</li>)}
        </ol>
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Initial kit status</p>
        {INITIAL_KIT_STATUS.map((k) => (
          <div key={k.companyKey} className="space-y-1 border-t pt-2 first:border-0 first:pt-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium capitalize">{k.companyKey.replace(/_/g, " ")}</p>
              <Badge variant="secondary">{COMPARISON_STATUS_LABEL[k.status]}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{k.summary}</p>
          </div>
        ))}
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Existing comparison claims without evidence</p>
        {LEGACY_COMPARISON_CLAIMS.map((c) => (
          <div key={c.claim} className="border-t pt-2 text-xs first:border-0 first:pt-0">
            <p className="font-medium">{c.claim}</p>
            <p className="text-muted-foreground">{c.source} — {c.verdict}: {c.reason}</p>
          </div>
        ))}
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Review triggers</p>
        <div className="flex flex-wrap gap-1.5">
          {COMPARISON_REVIEW_TRIGGERS.map((t) => (
            <button
              key={t}
              className="rounded-full border px-3 py-1 text-xs"
              onClick={() => {
                const id = store.comparisons[0]?.comparisonId;
                if (!id) return toast.error("Save a comparison snapshot first.");
                toast.message(store.trigger(id, t as ComparisonReviewTrigger, "reviewer"));
              }}
            >
              {COMPARISON_TRIGGER_LABEL[t]}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Technical acceptance scenarios</p>
        <Button size="sm" variant="outline" onClick={() => setScenarioResult(runComparisonScenarios())}>
          Run scenarios
        </Button>
        {scenarioResult && (
          <>
            <p className="text-xs text-muted-foreground">{scenarioResult.passed}/{scenarioResult.total} passed</p>
            <ul className="max-h-64 space-y-1 overflow-y-auto text-xs">
              {scenarioResult.results.map((r) => (
                <li key={r.id} className={r.pass ? "text-emerald-600" : "text-destructive"}>
                  {r.pass ? "✓" : "✗"} {r.id} — {r.title}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Audit</p>
        {store.audit.length === 0 && <p className="text-xs text-muted-foreground">No comparison actions recorded yet.</p>}
        <ul className="space-y-1 text-xs text-muted-foreground">
          {store.audit.slice(0, 20).map((a) => (
            <li key={a.id}>
              {a.at.slice(0, 19).replace("T", " ")} · {a.user} · {a.action} · {a.reason}
              {a.rankingImpact ? " · ranking impact" : ""}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
