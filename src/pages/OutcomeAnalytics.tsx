/** STEP 14 — role-aware outcome metrics with sample-size and comparability controls. */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BarChart3 } from "lucide-react";
import {
  MINIMUM_PUBLISHABLE_SAMPLE, OUTCOME_COMPARABILITY_LABEL, PRIVACY_NOTE, RAW_REPORT_NOTE,
  EVIDENCE_STAGE_LABEL,
} from "@/data/outcomes";
import {
  assessOutcome, computeMetrics, outcomeComparability, visibleOutcomes, canViewAnalytics,
} from "@/lib/outcomeEngine";
import { useOutcomes } from "@/store/useOutcomes";
import { useApp } from "@/store/useApp";
import { runOutcomeScenarios } from "@/lib/outcomeScenarios";

export default function OutcomeAnalytics() {
  const store = useOutcomes();
  const user = useApp((s) => s.user);
  const role = user?.role === "admin" ? "technical_reviewer" : "professional_spotter";
  const [org, setOrg] = useState("org_alpha");
  const [scenarios, setScenarios] = useState<ReturnType<typeof runOutcomeScenarios> | null>(null);

  const records = useMemo(
    () => visibleOutcomes({ role, userId: user?.email ?? "demo", organizationKey: org, isReviewer: role === "technical_reviewer" }, store.records),
    [store.records, role, user?.email, org],
  );

  const metrics = useMemo(
    () => computeMetrics(records, (r) => assessOutcome(r).classification.classification),
    [records],
  );
  const comparability = useMemo(() => (records.length ? outcomeComparability(records) : null), [records]);

  if (!canViewAnalytics(role)) {
    return <div className="p-4 text-sm text-muted-foreground">Outcome analytics are not available for this role.</div>;
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Admin
      </Link>
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Outcome analytics</h1>
      </div>
      <p className="text-xs text-muted-foreground">{PRIVACY_NOTE}</p>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Scope</p>
        <Input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Organization key" />
        <p className="text-xs text-muted-foreground">
          {records.length} visible record(s) · sample {metrics.sampleSize} · quality {metrics.dataQuality}
          {" "}· minimum publishable sample {MINIMUM_PUBLISHABLE_SAMPLE}
        </p>
        {metrics.warnings.map((w) => <p key={w} className="text-xs text-destructive">{w}</p>)}
      </Card>

      {metrics.aggregated ? (
        <Card className="space-y-2 p-4">
          <p className="text-sm font-semibold">Performance</p>
          <p className="text-xs text-muted-foreground">{metrics.conditions} · {metrics.dateRange}</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(metrics.rates).map(([k, v]) => (
              <div key={k} className="rounded-md border border-border p-2">
                <p className="text-[11px] text-muted-foreground">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</p>
                <p className="text-sm font-semibold">{v}{k.endsWith("Rate") ? "%" : ""}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Product versions: {metrics.productVersions.join(", ")}</p>
        </Card>
      ) : (
        <Card className="p-4 text-xs text-muted-foreground">
          Aggregated performance is withheld: {metrics.warnings[0] ?? "no comparable live records available."}
        </Card>
      )}

      {comparability && (
        <Card className="space-y-1 p-4">
          <p className="text-sm font-semibold">Comparability checks</p>
          {comparability.checks.map((c) => (
            <p key={c.key} className="text-xs">
              <Badge variant={c.passed ? "secondary" : "destructive"} className="mr-2">{c.passed ? "ok" : "differs"}</Badge>
              {OUTCOME_COMPARABILITY_LABEL[c.key]}
            </p>
          ))}
        </Card>
      )}

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Evidence stages</p>
        <p className="text-xs text-muted-foreground">{RAW_REPORT_NOTE}</p>
        {records.slice(0, 12).map((r) => (
          <p key={r.outcomeId} className="text-xs">
            {r.outcomeId} — {EVIDENCE_STAGE_LABEL[r.evidenceStage]}
            {r.superseded ? " · superseded" : ""}
          </p>
        ))}
        {records.length === 0 && <p className="text-xs text-muted-foreground">No outcome records yet.</p>}
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Technical acceptance scenarios</p>
        <Button size="sm" variant="outline" onClick={() => setScenarios(runOutcomeScenarios())}>Run scenarios</Button>
        {scenarios && (
          <>
            <p className="text-xs">{scenarios.passed}/{scenarios.total} passed</p>
            {scenarios.results.filter((r) => !r.pass).map((r) => (
              <p key={r.id} className="text-xs text-destructive">{r.id} — {r.title}</p>
            ))}
          </>
        )}
      </Card>
    </div>
  );
}
