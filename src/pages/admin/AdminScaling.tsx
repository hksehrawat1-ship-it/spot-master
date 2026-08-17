import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ARCHITECTURE_CAPABILITIES, ARCHITECTURE_INVARIANTS, COUNTRY_PROFILES, EXPANSION_SUBJECTS,
  EXPANSION_SUBJECT_LABEL, GATE_CHECKS, GATE_CHECK_LABEL, GLOSSARY, INTAKE_DECISION_LABEL,
  INTEGRATION_POINTS, METRICS, MONITORS, PIPELINE_ITEMS, PIPELINE_STAGES, REVIEWERS,
  SCALING_PRINCIPLE, TRANSLATION_JOBS, WAVES, COUNT_IS_NOT_SUCCESS, COMPLETENESS_TARGETS,
} from "@/data/scaling";
import {
  architectureReport, backupReport, bottlenecks, capacityReport, migrationReport,
  pipelineCounts, prioritisedIntake, publicStainCountFrozen, scalingReport, systemAudit,
  translationPublishable, countryGate, waveGate,
} from "@/lib/scalingEngine";
import { SCALING_SCENARIOS } from "@/lib/scalingScenarios";

function Pill({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
      ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" : "border-amber-500/30 bg-amber-500/10 text-amber-700"
    }`}>{children}</span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-2 text-sm font-bold">{title}</h2>
      {children}
    </section>
  );
}

/** STEP 18 — Sustainable scaling workspace. */
export default function AdminScaling() {
  const [tab, setTab] = useState("overview");
  const report = useMemo(() => scalingReport(), []);
  const audit = useMemo(() => systemAudit(), []);
  const capacity = useMemo(() => capacityReport(), []);
  const intake = useMemo(() => prioritisedIntake(), []);
  const counts = useMemo(() => pipelineCounts(), []);
  const blocks = useMemo(() => bottlenecks(), []);
  const scenarios = useMemo(() => SCALING_SCENARIOS.map((s) => ({ ...s, result: s.run() })), []);
  const failing = scenarios.filter((s) => !s.result.pass);
  const frozen = publicStainCountFrozen();

  return (
    <AdminShell section="releases" title="Sustainable Scaling">
      <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs italic text-muted-foreground">
        {SCALING_PRINCIPLE} — {COUNT_IS_NOT_SUCCESS}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { v: `${capacity.assigned}/${capacity.capacity}`, l: "Reviews in capacity" },
          { v: `${audit.remediation.length}`, l: "Remediation tasks" },
          { v: `${audit.criticalFailures.length}`, l: "Critical failures" },
          { v: `${scenarios.length - failing.length}/${scenarios.length}`, l: "Scalability tests" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card p-3">
            <p className="text-lg font-extrabold">{s.v}</p>
            <p className="text-[11px] text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-semibold text-amber-800">
        {frozen.reason}
      </p>

      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList className="flex w-full flex-wrap">
          {["overview", "gates", "intake", "pipeline", "capacity", "countries", "language", "architecture", "reliability", "waves", "audit", "tests"].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-3 space-y-3">
          <Section title="Expansion subjects with formal gates">
            <div className="flex flex-wrap gap-1">
              {EXPANSION_SUBJECTS.map((s) => (
                <span key={s} className="rounded-full border border-border px-2 py-0.5 text-[11px]">{EXPANSION_SUBJECT_LABEL[s]}</span>
              ))}
            </div>
          </Section>
          <Section title="Long-term completeness targets">
            <ul className="space-y-1 text-xs text-muted-foreground">
              {COMPLETENESS_TARGETS.map((t) => <li key={t.key}>{t.label} — target {t.target}%</li>)}
            </ul>
          </Section>
          <Section title="Timeless architecture">
            <ul className="space-y-1 text-xs text-muted-foreground">
              {ARCHITECTURE_INVARIANTS.map((i) => <li key={i.key}>• {i.statement}</li>)}
            </ul>
          </Section>
        </TabsContent>

        <TabsContent value="gates" className="mt-3 space-y-3">
          <Section title="Every gate checks twelve conditions">
            <ul className="grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              {GATE_CHECKS.map((c) => <li key={c}>• {GATE_CHECK_LABEL[c]}</li>)}
            </ul>
            <p className="mt-2 text-[11px] font-semibold text-amber-700">
              Evidence, safety completeness and governance status can never be waived.
            </p>
          </Section>
        </TabsContent>

        <TabsContent value="intake" className="mt-3 space-y-3">
          <Section title="Prioritised stain intake">
            <div className="space-y-2">
              {intake.map((r) => (
                <div key={r.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{r.requestedName}</p>
                    <Pill ok={r.decision === "add_canonical_stain"}>{INTAKE_DECISION_LABEL[r.decision]}</Pill>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Score {r.score.toFixed(1)} · demand {r.demand} · evidence {r.evidenceAvailable} · reviewer {r.reviewerAvailable ? "available" : "none"}
                    {r.safetyConcern ? " · safety concern" : ""}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-3 space-y-3">
          <Section title="Content production pipeline">
            <div className="flex flex-wrap gap-1">
              {PIPELINE_STAGES.map((s) => (
                <span key={s} className="rounded-full border border-border px-2 py-0.5 text-[11px]">
                  {s.replace(/_/g, " ")} · {counts[s]}
                </span>
              ))}
            </div>
          </Section>
          <Section title="Bottlenecks">
            {blocks.length === 0 ? <p className="text-xs text-muted-foreground">No bottleneck detected.</p> : (
              <ul className="space-y-1 text-xs text-muted-foreground">
                {blocks.map((b) => <li key={b.stage}>• {b.stage.replace(/_/g, " ")} — {b.count} item(s), oldest {b.oldestDays} days</li>)}
              </ul>
            )}
          </Section>
          <Section title="Work in progress">
            <ul className="space-y-1 text-xs text-muted-foreground">
              {PIPELINE_ITEMS.map((i) => <li key={i.id}>• {i.title} — {i.stage.replace(/_/g, " ")} ({i.owner}, {i.ageDays}d)</li>)}
            </ul>
          </Section>
        </TabsContent>

        <TabsContent value="capacity" className="mt-3 space-y-3">
          <Section title="Reviewer capacity">
            <p className="mb-2 text-xs text-muted-foreground">
              {capacity.assigned} assigned of {capacity.capacity} sustainable slots ({capacity.utilisation}% utilisation) ·
              {" "}{capacity.overdue} overdue · {capacity.highRiskBacklog} high-risk backlog
            </p>
            <div className="space-y-2">
              {REVIEWERS.map((r) => (
                <div key={r.id} className="rounded-xl border border-border p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{r.name}</p>
                    <Pill ok={r.overdue === 0}>{r.overdue} overdue</Pill>
                  </div>
                  <p className="text-muted-foreground">
                    Scopes {r.scopes.join(", ")} · {r.assigned} assigned · avg {r.avgReviewDays}d · expires {r.qualificationExpiry}
                    {r.conflictDeclared ? " · conflict declared" : ""}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="countries" className="mt-3 space-y-3">
          <Section title="Country readiness">
            {COUNTRY_PROFILES.map((c) => {
              const g = countryGate(c.code);
              return (
                <div key={c.code} className="mb-2 rounded-xl border border-border p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{c.name} ({c.code})</p>
                    <Pill ok={g.ready}>{g.ready ? "Ready" : `${g.missing.length} gaps`}</Pill>
                  </div>
                  {g.missing.length > 0 && (
                    <p className="text-muted-foreground">Missing: {g.missing.slice(0, 8).join(", ")}{g.missing.length > 8 ? "…" : ""}</p>
                  )}
                </div>
              );
            })}
          </Section>
        </TabsContent>

        <TabsContent value="language" className="mt-3 space-y-3">
          <Section title="Translation jobs">
            {TRANSLATION_JOBS.map((j) => {
              const p = translationPublishable(j);
              return (
                <div key={j.id} className="mb-2 rounded-xl border border-border p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{j.id} — {j.language.toUpperCase()} / {j.country}</p>
                    <Pill ok={p.publishable}>{p.publishable ? "Publishable" : "Withheld"}</Pill>
                  </div>
                  <p className="text-muted-foreground">Stage {j.stage.replace(/_/g, " ")} · source v{j.sourceVersion} · {p.reason}</p>
                </div>
              );
            })}
          </Section>
          <Section title="Controlled terminology glossary">
            <div className="max-h-72 overflow-y-auto text-xs">
              {GLOSSARY.map((g) => (
                <div key={g.sourceTerm} className="border-b border-border/60 py-1.5">
                  <p className="font-semibold">{g.sourceTerm} → {g.targetTerm}</p>
                  <p className="text-muted-foreground">{g.definition} · Not: {g.prohibitedMistranslations.join(", ")}</p>
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="architecture" className="mt-3 space-y-3">
          <Section title="Scaling capabilities and documented limits">
            <div className="text-xs">
              {ARCHITECTURE_CAPABILITIES.map((c) => (
                <div key={c.key} className="border-b border-border/60 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{c.label}</p>
                    <Pill ok={c.supported}>{c.supported ? "Supported" : "Missing"}</Pill>
                  </div>
                  <p className="text-muted-foreground">{c.mechanism} · Limit: {c.limit}</p>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Integration points">
            <ul className="space-y-1 text-xs text-muted-foreground">
              {INTEGRATION_POINTS.map((p) => (
                <li key={p.key}>• {p.label} — scopes {p.scopes.join(", ")} · {p.enabled ? "enabled" : "disabled by default"} · not publicly exposed</li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        <TabsContent value="reliability" className="mt-3 space-y-3">
          <Section title="Monitoring">
            <ul className="space-y-1 text-xs text-muted-foreground">
              {MONITORS.map((m) => (
                <li key={m.key}>• {m.label} — {m.threshold} {m.failClosed ? "· fails closed" : ""} {m.configured ? "" : "· not configured"}</li>
              ))}
            </ul>
          </Section>
          <Section title="Backup and recovery">
            <p className="mb-1 text-xs text-muted-foreground">
              RPO {report.backups.protectionClaimable ? "24h" : "unverified"} · RTO 4h · restore rehearsal {backupReport().protectionClaimable ? "passed" : "pending"}
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {backupReport().targets.map((b) => <li key={b.key}>• {b.label} — {b.frequency} · restore tested {b.testedOn ?? "never"}</li>)}
            </ul>
          </Section>
          <Section title="Migrations">
            <ul className="space-y-1 text-xs text-muted-foreground">
              {migrationReport().migrations.map((m) => <li key={m.id}>• {m.id} — {m.description} · rollback {m.rollbackTested ? "tested" : "untested"}</li>)}
            </ul>
          </Section>
          <Section title="Metrics (with definitions and sample sizes)">
            <div className="max-h-72 overflow-y-auto text-xs">
              {METRICS.map((m) => (
                <div key={m.key} className="border-b border-border/60 py-1.5">
                  <p className="font-semibold">{m.label}: {m.value === null ? "Not measurable" : `${m.value} ${m.unit}`}</p>
                  <p className="text-muted-foreground">{m.definition} · n={m.sampleSize} · {m.dateRange}</p>
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="waves" className="mt-3 space-y-3">
          {WAVES.map((w) => {
            const g = waveGate(w.key);
            return (
              <Section key={w.key} title={w.label}>
                <ul className="mb-2 space-y-1 text-xs text-muted-foreground">
                  {w.goals.map((goal) => <li key={goal}>• {goal}</li>)}
                </ul>
                <Pill ok={g.canStart}>{g.canStart ? "May start" : "Blocked"}</Pill>
                <span className="ml-2 text-[11px] text-muted-foreground">{g.reason}</span>
              </Section>
            );
          })}
        </TabsContent>

        <TabsContent value="audit" className="mt-3 space-y-3">
          <Section title="Final system-wide quality audit">
            <div className="text-xs">
              {audit.findings.map((f) => (
                <div key={f.area + f.detail} className="border-b border-border/60 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold capitalize">{f.area.replace(/_/g, " ")}</p>
                    <Pill ok={f.pass}>{f.pass ? "Pass" : f.severity}</Pill>
                  </div>
                  <p className="text-muted-foreground">{f.detail}</p>
                  {f.remediation && <p className="text-amber-700">Remediation: {f.remediation}</p>}
                </div>
              ))}
            </div>
          </Section>
          <Section title="Architecture capability gaps">
            <p className="text-xs text-muted-foreground">
              {architectureReport().unsupported.length === 0 ? "No unsupported capability." : architectureReport().unsupported.map((c) => c.label).join(", ")}
            </p>
          </Section>
        </TabsContent>

        <TabsContent value="tests" className="mt-3 space-y-3">
          <Section title={`Scalability tests — ${scenarios.length - failing.length}/${scenarios.length} passing`}>
            <div className="max-h-96 overflow-y-auto text-xs">
              {scenarios.map((s) => (
                <div key={s.id} className="flex items-start justify-between gap-2 border-b border-border/60 py-1.5">
                  <p><span className="font-semibold">{s.id}</span> — {s.title}</p>
                  <Pill ok={s.result.pass}>{s.result.pass ? "Pass" : "Fail"}</Pill>
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
