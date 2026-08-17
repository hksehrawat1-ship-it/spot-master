/** Step 4 reviewer console — condition assessments, risk changes, overrides, analytics, scenarios. */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, ShieldAlert, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useReadiness } from "@/store/useReadiness";
import { runReadinessScenarios } from "@/lib/readinessScenarios";
import { STATUS_LABEL, type ReadinessStatus } from "@/lib/treatmentReadiness";

const STATUSES: ReadinessStatus[] = [
  "ready_for_classification", "more_information_required", "compatibility_test_required",
  "professional_only", "specialist_referral_required", "blocked_previous_chemical",
  "blocked_existing_damage", "blocked_possible_hazard",
];

export default function ReadinessAdmin() {
  const { cases, events, override } = useReadiness();
  const [openId, setOpenId] = useState<string | null>(null);
  const [reviewer, setReviewer] = useState("");
  const [justification, setJustification] = useState("");
  const [newStatus, setNewStatus] = useState<ReadinessStatus>("more_information_required");
  const [scenarios, setScenarios] = useState<ReturnType<typeof runReadinessScenarios> | null>(null);

  const analytics = useMemo(() => {
    const completed = cases.filter((c) => c.result);
    const byStatus = STATUSES.map((s) => ({ s, n: completed.filter((c) => c.result!.status === s).length }));
    const notSure = completed.reduce(
      (n, c) => n + Object.values(c.answers).flat().filter((v) => typeof v === "string" && /not sure|not known/i.test(v)).length,
      0,
    );
    return {
      total: cases.length,
      completed: completed.length,
      heatSet: completed.filter((c) => c.result!.heatSetSuspected).length,
      mixing: completed.filter((c) => c.answers.mixing && c.answers.mixing !== "No").length,
      damage: completed.filter((c) => c.result!.status === "blocked_existing_damage").length,
      missingPPE: completed.filter((c) => c.result!.factors.some((f) => /protective equipment/i.test(f))).length,
      missingDocs: completed.filter((c) => c.result!.unverifiedProductsAvailable > 0).length,
      notSure,
      byStatus,
      abandoned: cases.filter((c) => !c.result).length,
    };
  }, [cases]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(cases, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "treatment-readiness-cases.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Admin
      </Link>
      <h1 className="text-2xl font-bold">Treatment readiness review</h1>

      <Tabs defaultValue="cases">
        <TabsList className="w-full">
          <TabsTrigger value="cases" className="flex-1">Cases</TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
          <TabsTrigger value="scenarios" className="flex-1">Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-3 pt-3">
          <Button variant="outline" onClick={exportJson} className="w-full">
            <Download className="mr-1 h-4 w-4" aria-hidden /> Export structured assessment data
          </Button>
          {cases.length === 0 && <Card className="p-4 text-sm text-muted-foreground">No readiness assessments yet.</Card>}
          {cases.map((c) => (
            <Card key={c.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{c.context.suspectedStain ?? "Unknown stain"} · {c.context.garmentType}</p>
                  <p className="text-xs text-muted-foreground">{c.id} · v{c.version} · {c.assessmentVersion}</p>
                </div>
                <Badge variant={c.result?.status.startsWith("blocked") ? "destructive" : "secondary"}>
                  {c.override ? `${STATUS_LABEL[c.override.status as ReadinessStatus]} (overridden)` : c.result ? STATUS_LABEL[c.result.status] : "In progress"}
                </Badge>
              </div>

              {c.result && (
                <>
                  <p className="text-sm text-muted-foreground">{c.result.statusReason}</p>
                  <p className="text-xs">
                    Risk {c.result.riskBefore} → <strong>{c.result.riskAfter}</strong> · boundary component: {c.result.mostSensitiveComponent}
                  </p>
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">Risk-changing answers ({c.result.riskEvents.length})</summary>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                      {c.result.riskEvents.map((e, i) => <li key={i}>{e.rule} ({e.from} → {e.to})</li>)}
                    </ul>
                  </details>
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">Audit history ({c.audit.length})</summary>
                    <ul className="mt-1 space-y-0.5 pl-1 text-muted-foreground">
                      {c.audit.slice(0, 25).map((x) => (
                        <li key={x.id}>{new Date(x.at).toLocaleString()} · {x.action} · {x.detail ?? ""}{x.previous ? ` (was ${x.previous})` : ""}</li>
                      ))}
                    </ul>
                  </details>
                </>
              )}

              <Button size="sm" variant="outline" onClick={() => setOpenId(openId === c.id ? null : c.id)}>
                <ShieldAlert className="mr-1 h-4 w-4" aria-hidden /> Override status with written justification
              </Button>

              {openId === c.id && (
                <div className="space-y-2 rounded-lg border p-3">
                  <Input placeholder="Reviewer name" value={reviewer} onChange={(e) => setReviewer(e.target.value)} aria-label="Reviewer name" />
                  <select
                    className="min-h-11 w-full rounded-md border bg-background px-3 text-sm"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ReadinessStatus)}
                    aria-label="New status"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                  <Textarea placeholder="Written justification (required)" value={justification} onChange={(e) => setJustification(e.target.value)} aria-label="Justification" />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!reviewer.trim() || justification.trim().length < 10) {
                        toast.error("A reviewer name and a written justification are required.");
                        return;
                      }
                      override(c.id, { by: reviewer, justification, status: newStatus });
                      toast.success("Override recorded. The original decision is preserved.");
                      setOpenId(null);
                      setJustification("");
                    }}
                  >
                    Record override
                  </Button>
                  {c.override && (
                    <p className="text-xs text-muted-foreground">
                      Previous decision preserved: {STATUS_LABEL[c.override.previousStatus as ReadinessStatus] ?? c.override.previousStatus} — {c.override.justification} ({c.override.by})
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-3 pt-3">
          <Card className="space-y-2 p-4 text-sm">
            <Stat k="Assessments started" v={analytics.total} />
            <Stat k="Completed" v={analytics.completed} />
            <Stat k="Abandoned before result" v={analytics.abandoned} />
            <Stat k="Heat-set suspected" v={analytics.heatSet} />
            <Stat k="Chemical-mixing cases" v={analytics.mixing} />
            <Stat k="Existing-damage cases" v={analytics.damage} />
            <Stat k="Missing PPE or ventilation" v={analytics.missingPPE} />
            <Stat k="Missing product documentation" v={analytics.missingDocs} />
            <Stat k="“Not sure / not known” answers" v={analytics.notSure} />
            <Stat k="Recorded events" v={events.length} />
          </Card>
          <Card className="space-y-1 p-4 text-sm">
            <p className="font-semibold">Readiness-status distribution</p>
            {analytics.byStatus.map((b) => <Stat key={b.s} k={STATUS_LABEL[b.s]} v={b.n} />)}
          </Card>
          <p className="text-xs text-muted-foreground">Analytics are descriptive only and never change treatment rules automatically.</p>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-3 pt-3">
          <Button className="w-full" onClick={() => setScenarios(runReadinessScenarios())}>Run required test scenarios</Button>
          {scenarios && (
            <Card className="space-y-2 p-4 text-sm">
              <p className="font-semibold">{scenarios.filter((s) => s.pass).length} / {scenarios.length} passed</p>
              <ul className="space-y-1">
                {scenarios.map((s) => (
                  <li key={s.name} className="flex items-start gap-2">
                    {s.pass ? <Check className="mt-0.5 h-4 w-4 text-emerald-600" aria-hidden /> : <X className="mt-0.5 h-4 w-4 text-red-600" aria-hidden />}
                    <span>
                      <strong>{s.name}</strong> — expected {s.expected}, got {s.actual} · risk {s.risk}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
