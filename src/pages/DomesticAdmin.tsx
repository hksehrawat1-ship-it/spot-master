/** STEP 12 §31 — Administrator domestic-treatment editor, monitoring and test console. */

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayCircle, ShieldAlert, ShieldCheck, FileWarning } from "lucide-react";
import {
  WORKFLOW_LABEL, APPROVAL_WORKFLOW, MIGRATION_LABEL, EVIDENCE_TYPE_LABEL,
  REJECTED_EVIDENCE_LABEL, DOMESTIC_WORKFLOW_STATUSES, type DomesticWorkflowStatus,
} from "@/data/domesticTreatments";
import { HOUSEHOLD_PRODUCTS, HOUSEHOLD_TYPE_LABEL } from "@/data/householdProducts";
import { validateForPublication, REVIEW_TRIGGER_LABEL, REVIEW_TRIGGERS, DOMESTIC_ENGINE_VERSION } from "@/lib/domesticEngine";
import { runDomesticScenarios } from "@/lib/domesticScenarios";
import { useDomestic } from "@/store/useDomestic";

const tone: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-700",
  approved: "bg-emerald-500/10 text-emerald-700",
  suspended: "bg-destructive/15 text-destructive",
  rejected: "bg-destructive/15 text-destructive",
  needs_review: "bg-amber-500/15 text-amber-700",
};

export default function DomesticAdmin() {
  const store = useDomestic();
  const all = store.treatments();
  const [selected, setSelected] = useState<string | null>(all[0]?.domesticTreatmentId ?? null);
  const [justification, setJustification] = useState("");
  const [newName, setNewName] = useState("");
  const [newStain, setNewStain] = useState("");
  const [results, setResults] = useState<ReturnType<typeof runDomesticScenarios> | null>(null);

  const t = all.find((x) => x.domesticTreatmentId === selected) ?? null;
  const issues = useMemo(() => (t ? validateForPublication(t) : []), [t]);
  const monitoring = t ? store.monitoring(t.domesticTreatmentId) : null;
  const passCount = results?.filter((r) => r.pass).length ?? 0;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-24">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Domestic treatments</h1>
        <p className="text-sm text-muted-foreground">
          {all.length} records · {DOMESTIC_ENGINE_VERSION} · only Published methods are actionable
        </p>
      </header>

      <Tabs defaultValue="records">
        <TabsList className="flex-wrap">
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="products">Household products</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="migration">Migration audit</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="tests">Scenarios</TabsTrigger>
        </TabsList>

        {/* Records + editor */}
        <TabsContent value="records" className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-3">
            <Card className="space-y-2 p-3">
              <p className="text-xs font-semibold">Create candidate method</p>
              <Input placeholder="Treatment name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Stain key" value={newStain} onChange={(e) => setNewStain(e.target.value)} />
              <Button size="sm" disabled={!newName || !newStain}
                onClick={() => {
                  const id = store.createDraft({ treatmentName: newName, stainKey: newStain }, "admin");
                  setSelected(id); setNewName(""); setNewStain("");
                }}>
                Create draft
              </Button>
            </Card>
            <div className="space-y-2">
              {all.map((x) => (
                <button key={x.domesticTreatmentId} onClick={() => setSelected(x.domesticTreatmentId)}
                  className={`w-full rounded-lg border p-3 text-left text-sm ${selected === x.domesticTreatmentId ? "border-primary" : "border-border"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs">{x.domesticTreatmentId}</span>
                    <Badge className={tone[x.status] ?? ""}>{WORKFLOW_LABEL[x.status]}</Badge>
                  </div>
                  <p className="mt-1 font-medium">{x.treatmentName}</p>
                  <p className="text-xs text-muted-foreground">{x.stainKey} · v{x.version}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {t ? (
              <>
                <Card className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">{t.treatmentName}</h2>
                      <p className="text-xs text-muted-foreground">{t.domesticTreatmentId} · v{t.version} · {t.stainKey}{t.stainVariant ? ` · ${t.stainVariant}` : ""}</p>
                    </div>
                    <Badge className={tone[t.status] ?? ""}>{WORKFLOW_LABEL[t.status]}</Badge>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <Field k="Eligible fabrics" v={t.eligibleFabrics.join(", ") || "—"} />
                    <Field k="Prohibited fabrics" v={t.prohibitedFabrics.join(", ") || "—"} />
                    <Field k="Eligible colours" v={t.eligibleColours.join(", ") || "—"} />
                    <Field k="Prohibited constructions" v={t.prohibitedConstructions.join(", ") || "—"} />
                    <Field k="Countries" v={t.eligibleCountries.join(", ") || "—"} />
                    <Field k="Maximum risk" v={t.maximumRiskLevel} />
                    <Field k="Household product" v={t.householdProductKey ?? "None"} />
                    <Field k="Maximum attempts" v={t.maximumAttempts === null ? "Not defined — cannot publish" : String(t.maximumAttempts)} />
                    <Field k="Technical reviewer" v={t.technicalReviewer ?? "—"} />
                    <Field k="Safety reviewer" v={t.safetyReviewer ?? "—"} />
                    <Field k="Last reviewed" v={t.lastReviewedDate ?? "—"} />
                    <Field k="Next review" v={t.nextReviewDate ?? "—"} />
                  </div>
                  {t.internalNote && (
                    <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">Internal note: {t.internalNote}</p>
                  )}
                </Card>

                <Card className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    {issues.length ? <ShieldAlert className="h-4 w-4 text-destructive" /> : <ShieldCheck className="h-4 w-4 text-emerald-600" />}
                    <h3 className="text-sm font-semibold">Publication validation</h3>
                  </div>
                  {issues.length ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
                      {issues.map((i, n) => <li key={`${i.field}-${n}`}>{i.field}: {i.message}</li>)}
                    </ul>
                  ) : <p className="text-sm text-emerald-700">All required fields are present.</p>}
                </Card>

                <Card className="space-y-3 p-4">
                  <h3 className="text-sm font-semibold">Change status</h3>
                  <Textarea placeholder="Justification (required)" value={justification} onChange={(e) => setJustification(e.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    {DOMESTIC_WORKFLOW_STATUSES.map((s) => (
                      <Button key={s} size="sm" variant={s === t.status ? "default" : "outline"} disabled={!justification.trim()}
                        onClick={() => {
                          const r = store.setStatus(t.domesticTreatmentId, s as DomesticWorkflowStatus, justification, "admin");
                          if (!r.ok) alert(r.message);
                          setJustification("");
                        }}>
                        {WORKFLOW_LABEL[s]}
                      </Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {REVIEW_TRIGGERS.map((r) => (
                      <Button key={r} size="sm" variant="ghost" className="text-xs"
                        onClick={() => store.flagForReview(t.domesticTreatmentId, r, "admin")}>
                        Flag: {REVIEW_TRIGGER_LABEL[r]}
                      </Button>
                    ))}
                  </div>
                </Card>

                <Card className="space-y-2 p-4">
                  <h3 className="text-sm font-semibold">Evidence</h3>
                  {t.evidence.length ? t.evidence.map((e) => (
                    <div key={e.id} className="rounded-md border p-2 text-xs">
                      <p className="font-medium">{e.claim}</p>
                      <p className="text-muted-foreground">{e.source} · {EVIDENCE_TYPE_LABEL[e.sourceType]} · {e.verification} · {e.repeatability ?? "repeatability not stated"}</p>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No evidence attached.</p>}
                  <p className="pt-2 text-xs text-muted-foreground">
                    Never accepted as evidence: {Object.values(REJECTED_EVIDENCE_LABEL).join(", ")}.
                  </p>
                </Card>

                <Card className="space-y-2 p-4">
                  <h3 className="text-sm font-semibold">Revision history</h3>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {t.revisions.map((r, n) => <li key={n}>v{r.version} · {r.at} · {r.by} · {WORKFLOW_LABEL[r.status]} — {r.summary}</li>)}
                  </ul>
                </Card>
              </>
            ) : <Card className="p-4 text-sm text-muted-foreground">Select a record.</Card>}
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-3">
          {HOUSEHOLD_PRODUCTS.map((p) => (
            <Card key={p.key} className="space-y-1 p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{p.brand} — {p.productName}</p>
                <Badge variant={p.verification === "verified" ? "default" : "outline"}>{p.verification}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {p.productId} · {HOUSEHOLD_TYPE_LABEL[p.productType]} · {p.country} · label {p.labelVersion ?? "not recorded"}
              </p>
              <div className="grid gap-1 pt-1 text-xs sm:grid-cols-2">
                <Field k="Quantity" v={p.quantity ?? "Not recorded"} />
                <Field k="Dilution" v={p.dilution ?? "Not recorded"} />
                <Field k="Contact time" v={p.contactTime ?? "Not recorded"} />
                <Field k="Temperature" v={p.temperature ?? "Not recorded"} />
                <Field k="Fabric restrictions" v={p.fabricRestrictions.join(", ") || "—"} />
                <Field k="Incompatibilities" v={p.incompatibilities.join(", ") || "—"} />
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="workflow">
          <Card className="space-y-2 p-4">
            <h3 className="text-sm font-semibold">Approval workflow</h3>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              {APPROVAL_WORKFLOW.map((s) => <li key={s.key}>{s.label}</li>)}
            </ol>
            <p className="pt-2 text-xs text-muted-foreground">
              No single content author approves a high-risk method alone: technical review, chemical-safety review and country review are all required before publication.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="migration" className="space-y-3">
          <Card className="space-y-2 p-4">
            <div className="flex items-center gap-2"><FileWarning className="h-4 w-4" /><h3 className="text-sm font-semibold">Existing content review</h3></div>
            {store.migration.map((m) => (
              <div key={m.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{m.sourceLocation}</p>
                  <Badge variant={m.publiclyVisible ? "default" : "outline"}>{MIGRATION_LABEL[m.classification]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{m.originalContent}</p>
                {m.rejectionReason && <p className="mt-1 text-xs text-destructive">{m.rejectionReason}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {m.publiclyVisible ? "Publicly visible" : "Restricted audit record only"} · {m.reviewer} · {m.reviewedAt}
                </p>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-3">
          <Card className="space-y-2 p-4 text-sm">
            <h3 className="text-sm font-semibold">Outcome monitoring{t ? ` — ${t.domesticTreatmentId}` : ""}</h3>
            {monitoring ? (
              <div className="grid gap-1 sm:grid-cols-2">
                <Field k="Reported attempts" v={String(monitoring.attempts)} />
                <Field k="Removed" v={String(monitoring.removed)} />
                <Field k="Reduced" v={String(monitoring.reduced)} />
                <Field k="Failures" v={String(monitoring.failures)} />
                <Field k="Damage reports" v={String(monitoring.damageReports)} />
                <Field k="Suspension recommended" v={monitoring.suspensionRecommended ? "Yes" : "No"} />
              </div>
            ) : <p className="text-muted-foreground">Select a record.</p>}
            <p className="text-xs text-muted-foreground">
              User feedback is monitoring evidence, not proof. Methods are never modified automatically from feedback.
            </p>
          </Card>
          <Card className="space-y-2 p-4 text-sm">
            <h3 className="text-sm font-semibold">Adverse events</h3>
            {store.adverse.length ? store.adverse.map((a) => (
              <div key={a.id} className="rounded-md border p-2 text-xs">
                <p className="font-medium">{a.damageType} · {a.domesticTreatmentId}</p>
                <p className="text-muted-foreground">{a.observations} · case {a.caseId} · {a.reviewStatus}</p>
              </div>
            )) : <p className="text-muted-foreground">No adverse events recorded.</p>}
            <p className="text-xs text-muted-foreground">Blocked cases: {store.blockedCases.join(", ") || "none"}</p>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-3">
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Required test scenarios</h3>
              <Button size="sm" onClick={() => setResults(runDomesticScenarios())}>
                <PlayCircle className="mr-1 h-4 w-4" /> Run
              </Button>
            </div>
            {results && (
              <>
                <p className="text-sm">{passCount}/{results.length} passing</p>
                <div className="space-y-1">
                  {results.map((r) => (
                    <div key={r.id} className={`rounded-md border p-2 text-xs ${r.pass ? "border-emerald-500/40" : "border-destructive/60"}`}>
                      <p className="font-medium">{r.id} · {r.title} — {r.pass ? "PASS" : "FAIL"}</p>
                      <p className="text-muted-foreground">{r.detail}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/50 py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
