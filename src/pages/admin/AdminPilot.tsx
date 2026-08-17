import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DOMESTIC_CANDIDATES, DOMESTIC_FALLBACK, LEGAL_NOTICES, MONITORING_SIGNALS,
  NO_LABEL_GARMENTS, OPEN_REVIEW_ITEMS, PHASE_DEFINITIONS, PILOT_CATEGORY_META,
  PILOT_CATEGORIES, PILOT_CORE_RECORDS, PILOT_DIAGNOSTIC_RECORDS, PILOT_PRINCIPLE,
  PILOT_STATUS_LABEL, SUPPORT_ROUTES, FEEDBACK_REASONS, SUPPORTED_BROWSERS, DEVICE_MATRIX,
} from "@/data/pilotLibrary";
import {
  ACCESSIBILITY_RESULTS, CONTROLLED_TESTS, PERFORMANCE_RESULTS, SAFETY_FAILURE_RESULTS,
  SECURITY_RESULTS, UAT_PARTICIPANTS, USABILITY_RESULTS,
} from "@/data/pilotTesting";
import {
  categoryCounts, colloquialClarification, kitSummary, pilotCompletionReport, productReport,
  publishedCoreRecords, publishedDiagnosticRecords, publishedDomesticMethods, releaseGate,
  searchPilot,
} from "@/lib/pilotEngine";
import { PILOT_SCENARIOS } from "@/lib/pilotScenarios";

const toneFor = (ok: boolean) =>
  ok ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
     : "bg-amber-500/10 text-amber-700 border-amber-500/30";

function Pill({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toneFor(ok)}`}>{children}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-2 text-sm font-bold">{title}</h2>
      {children}
    </section>
  );
}

/** STEP 17 — Controlled Pilot Library workspace. */
export default function AdminPilot() {
  const [query, setQuery] = useState("");
  const gate = useMemo(() => releaseGate(), []);
  const report = useMemo(() => pilotCompletionReport(), []);
  const counts = useMemo(() => categoryCounts(), []);
  const rows = useMemo(() => productReport(), []);
  const kits = useMemo(() => kitSummary(), []);
  const hits = useMemo(() => searchPilot(query), [query]);
  const clarification = colloquialClarification(query);
  const scenarioResults = useMemo(() => PILOT_SCENARIOS.map((s) => ({ ...s, result: s.run() })), []);
  const failing = scenarioResults.filter((s) => !s.result.pass);

  return (
    <AdminShell section="releases" title="Controlled Pilot Library">
      <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs italic text-muted-foreground">
        {PILOT_PRINCIPLE}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Published stains", `${publishedCoreRecords().length}`],
          ["Diagnostic records", `${publishedDiagnosticRecords().length}`],
          ["Domestic methods", `${publishedDomesticMethods().length}`],
          ["Open evidence gaps", `${OPEN_REVIEW_ITEMS.filter((i) => i.open).length}`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border bg-card p-3">
            <p className="text-lg font-bold">{v}</p>
            <p className="text-[11px] text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="scope" className="mt-4">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          {["scope", "records", "products", "domestic", "journey", "testing", "gate", "report"].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>
          ))}
        </TabsList>

        {/* SCOPE ------------------------------------------------------ */}
        <TabsContent value="scope" className="space-y-3">
          <Section title="Pilot scope">
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>Core stain records: {PILOT_CORE_RECORDS.length} (ceiling 50)</li>
              <li>Non-stain diagnostic records: {PILOT_DIAGNOSTIC_RECORDS.length}</li>
              <li>Country: India · Language: English · Hindi translation-ready</li>
            </ul>
          </Section>
          <Section title="Phased release">
            <div className="space-y-2">
              {PHASE_DEFINITIONS.map((p) => (
                <div key={p.phase} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Entry: {p.entryConditions.join(" · ")}</p>
                  <Pill ok={false}>Explicit release decision required</Pill>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Release statuses">
            <div className="flex flex-wrap gap-1">
              {Object.values(PILOT_STATUS_LABEL).map((s) => (
                <span key={s} className="rounded-full border border-border px-2 py-0.5 text-[11px]">{s}</span>
              ))}
            </div>
          </Section>
        </TabsContent>

        {/* RECORDS ---------------------------------------------------- */}
        <TabsContent value="records" className="space-y-3">
          <Section title="Search preparation">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try haldi, cofee, kajal, SM-PIL-0016, fevicol" aria-label="Search pilot stains" />
            {clarification && <p className="mt-2 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-700">{clarification}</p>}
            <ul className="mt-2 space-y-1 text-xs">
              {hits.slice(0, 10).map((h) => (
                <li key={h.record.stainId} className="flex justify-between gap-2 rounded-lg border border-border px-2 py-1">
                  <span>{h.record.commonName}</span>
                  <span className="text-muted-foreground">{h.matchedOn}: {h.term}</span>
                </li>
              ))}
              {query.length > 1 && hits.length === 0 && <li className="text-muted-foreground">No result — recorded as a search gap.</li>}
            </ul>
          </Section>

          <Section title="Category validation (published counts)">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PILOT_CATEGORIES.map((c) => (
                <div key={c} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-semibold">{PILOT_CATEGORY_META[c].label} · {counts[c]}</p>
                  <p className="text-xs text-muted-foreground">{PILOT_CATEGORY_META[c].plain}</p>
                  <p className="text-[11px] text-muted-foreground">e.g. {PILOT_CATEGORY_META[c].examples.join(", ")}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Pilot records">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr><th className="py-1">ID</th><th>Name</th><th>Category</th><th>Version</th><th>Status</th><th>Reviewed</th></tr>
                </thead>
                <tbody>
                  {[...PILOT_CORE_RECORDS, ...PILOT_DIAGNOSTIC_RECORDS].map((r) => (
                    <tr key={r.stainId} className="border-t border-border">
                      <td className="py-1 font-mono text-[11px]">{r.stainId}</td>
                      <td>{r.commonName}{r.isDiagnostic && <span className="ml-1 text-[10px] text-muted-foreground">(diagnostic)</span>}</td>
                      <td>{PILOT_CATEGORY_META[r.category].label}</td>
                      <td>{r.version}</td>
                      <td><Pill ok={r.status === "published"}>{r.status}</Pill></td>
                      <td>{r.lastReviewed} → {r.nextReview}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </TabsContent>

        {/* PRODUCTS --------------------------------------------------- */}
        <TabsContent value="products" className="space-y-3">
          <Section title="Kit verification summary">
            {kits.map((k) => (
              <div key={k.kit} className="mb-2 rounded-xl border border-border p-3">
                <p className="text-sm font-semibold">{k.kit}</p>
                <p className="text-xs text-muted-foreground">{k.company} · {k.total} products</p>
                <Pill ok={k.actionable === k.total}>{k.status}</Pill>
              </div>
            ))}
          </Section>
          <Section title="Product verification report">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr><th className="py-1">Company</th><th>Kit</th><th>Product</th><th>Version</th><th>Country</th><th>Identity</th><th>Label</th><th>SDS</th><th>TDS</th><th>Mapping</th><th>Safety</th><th>Publication</th><th>Missing</th><th>Reviewer</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.company}-${r.product}`} className="border-t border-border align-top">
                      <td className="py-1">{r.company}</td><td>{r.kit}</td><td>{r.product}</td><td>{r.productVersion}</td>
                      <td>{r.country}</td><td>{r.identity}</td><td>{r.label}</td><td>{r.sds}</td><td>{r.tds}</td>
                      <td>{r.mapping}</td><td>{r.safety}</td>
                      <td><Pill ok={r.publicationEligibility === "actionable"}>{r.publicationEligibility.replace(/_/g, " ")}</Pill></td>
                      <td className="max-w-[220px] text-muted-foreground">{r.missing.join("; ")}</td>
                      <td className="text-muted-foreground">{r.assignedReviewer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <Section title="Known initial review items (open until resolved)">
            <ul className="space-y-1 text-xs">
              {OPEN_REVIEW_ITEMS.map((i) => (
                <li key={i.id} className="flex justify-between gap-2 rounded-lg border border-border px-2 py-1">
                  <span>{i.company} — {i.item}</span>
                  <Pill ok={false}>{i.severity === "safety_critical" ? "Safety critical" : "Documentation"}</Pill>
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        {/* DOMESTIC --------------------------------------------------- */}
        <TabsContent value="domestic" className="space-y-3">
          <Section title="Domestic pilot boundaries">
            <p className="mb-2 text-xs text-muted-foreground">Required fallback everywhere else: “{DOMESTIC_FALLBACK}”</p>
            <ul className="space-y-1 text-xs">
              {DOMESTIC_CANDIDATES.map((c) => (
                <li key={c.candidateId} className="rounded-lg border border-border px-2 py-1">
                  <div className="flex justify-between gap-2">
                    <span>{c.description}</span>
                    <Pill ok={c.approved && c.confidence >= 9}>{c.confidence}/10 {c.approved ? "approved" : "withheld"}</Pill>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Requires: {c.requires.join(" · ")}</p>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Legal and safety notices">
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {LEGAL_NOTICES.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </Section>
        </TabsContent>

        {/* JOURNEY ---------------------------------------------------- */}
        <TabsContent value="journey" className="space-y-3">
          <Section title="No-label pilot garments">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="text-muted-foreground"><tr><th className="py-1">Garment</th><th>Cues (no fibre claim)</th><th>Risk group</th><th>Wet work</th></tr></thead>
                <tbody>
                  {NO_LABEL_GARMENTS.map((g) => (
                    <tr key={g.key} className="border-t border-border">
                      <td className="py-1">{g.label}</td>
                      <td className="text-muted-foreground">{g.cues.join(", ")}</td>
                      <td className="uppercase">{g.riskGroup}</td>
                      <td><Pill ok={g.wetWorkAllowed}>{g.wetWorkAllowed ? "Permitted" : "Blocked"}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <Section title="Feedback and support routes">
            <div className="grid gap-2 sm:grid-cols-2">
              <ul className="space-y-1 text-xs">
                {FEEDBACK_REASONS.map((f) => (
                  <li key={f.key} className="flex justify-between rounded-lg border border-border px-2 py-1">
                    <span>{f.label}</span><span className="text-muted-foreground">{f.priority}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-1 text-xs">
                {SUPPORT_ROUTES.map((r) => (
                  <li key={r.key} className="rounded-lg border border-border px-2 py-1">
                    <span className="font-semibold">{r.label}</span>
                    <p className="text-muted-foreground">{r.owner} · {r.responseTarget}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
          <Section title="Monitoring">
            <ul className="space-y-1 text-xs">
              {MONITORING_SIGNALS.map((s) => (
                <li key={s.key} className="flex justify-between gap-2 rounded-lg border border-border px-2 py-1">
                  <span>{s.label}</span>
                  <span className="text-muted-foreground">{s.owner} · {s.responseTime}</span>
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        {/* TESTING ---------------------------------------------------- */}
        <TabsContent value="testing" className="space-y-3">
          <Section title="Controlled internal tests">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="text-muted-foreground"><tr><th className="py-1">ID</th><th>Stain</th><th>Fabric</th><th>Product</th><th>Method</th><th>Control</th><th>Result</th><th>Damage</th><th>Repeatability</th><th>Decision</th><th>Reviewer</th></tr></thead>
                <tbody>
                  {CONTROLLED_TESTS.map((t) => (
                    <tr key={t.testId} className="border-t border-border align-top">
                      <td className="py-1">{t.testId}</td><td>{t.stain}</td><td>{t.fabric}</td><td>{t.product}</td>
                      <td className="max-w-[180px]">{t.method}</td><td>{t.controlSample ? "Yes" : "No"}</td>
                      <td><Pill ok={t.result === "pass"}>{t.result}</Pill></td>
                      <td>{t.damageObserved ? "Yes" : "No"}</td><td>{t.repeatability}</td>
                      <td className="max-w-[200px] text-muted-foreground">{t.decision}</td><td className="text-muted-foreground">{t.reviewer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <Section title="User acceptance testing">
            <ul className="space-y-1 text-xs">
              {UAT_PARTICIPANTS.map((p) => (
                <li key={p.id} className="rounded-lg border border-border px-2 py-1">
                  <div className="flex justify-between"><span>{p.id} · {p.group}</span><span>{p.tasksCompleted}/{p.tasksAttempted}</span></div>
                  <p className="text-[11px] text-muted-foreground">{p.notes}</p>
                </li>
              ))}
            </ul>
            <div className="mt-2 space-y-1 text-xs">
              {USABILITY_RESULTS.map((u) => (
                <div key={u.key} className="flex justify-between rounded-lg border border-border px-2 py-1">
                  <span>{u.key}</span><span><Pill ok={u.outcome === "pass"}>{u.actual}</Pill></span>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Accessibility, security, safety, performance">
            <div className="grid gap-2 sm:grid-cols-2">
              {[["Accessibility", ACCESSIBILITY_RESULTS.map((a) => [a.key, a.outcome, a.note] as const)],
                ["Security and privacy", SECURITY_RESULTS.map((s) => [s.key, s.outcome, s.note] as const)],
                ["Safe failure", SAFETY_FAILURE_RESULTS.map((s) => [s.key, s.outcome, s.expected] as const)],
                ["Performance", PERFORMANCE_RESULTS.map((p) => [p.key, p.outcome, `${p.actual} (target ${p.target})`] as const)],
              ].map(([title, list]) => (
                <div key={title as string} className="rounded-xl border border-border p-3">
                  <p className="mb-1 text-xs font-bold">{title as string}</p>
                  <ul className="space-y-1 text-[11px]">
                    {(list as readonly (readonly [string, string, string])[]).map(([k, outcome, note]) => (
                      <li key={k} className="flex justify-between gap-2">
                        <span>{k}<span className="block text-muted-foreground">{note}</span></span>
                        <Pill ok={outcome === "pass"}>{outcome}</Pill>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Browser and device policy">
            <ul className="space-y-1 text-xs">
              {SUPPORTED_BROWSERS.map((b) => (
                <li key={b.name} className="flex justify-between rounded-lg border border-border px-2 py-1">
                  <span>{b.name}</span><span className="text-muted-foreground">{b.versions}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-muted-foreground">Devices tested: {DEVICE_MATRIX.join(" · ")}</p>
          </Section>
        </TabsContent>

        {/* GATE ------------------------------------------------------- */}
        <TabsContent value="gate" className="space-y-3">
          <Section title="Pilot release gate">
            <ul className="space-y-1 text-xs">
              {gate.results.map((r) => (
                <li key={r.key} className="flex justify-between gap-2 rounded-lg border border-border px-2 py-1">
                  <span>{r.key}<span className="block text-muted-foreground">{r.detail}</span></span>
                  <Pill ok={r.pass}>{r.pass ? "Pass" : "Blocked"}</Pill>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs font-semibold">{gate.pass ? "Gate passed — phased release may proceed with an explicit decision." : "Gate blocked."}</p>
          </Section>
          <Section title="Acceptance scenarios">
            <p className="text-xs text-muted-foreground">{scenarioResults.length - failing.length}/{scenarioResults.length} scenarios pass.</p>
            <ul className="mt-2 space-y-1 text-[11px]">
              {scenarioResults.map((s) => (
                <li key={s.id} className="flex justify-between gap-2">
                  <span>{s.id} — {s.title}</span>
                  <Pill ok={s.result.pass}>{s.result.pass ? "pass" : "fail"}</Pill>
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        {/* REPORT ----------------------------------------------------- */}
        <TabsContent value="report" className="space-y-3">
          <Section title="Pilot completion report">
            <dl className="space-y-1 text-xs">
              <div><dt className="font-semibold">Published stains</dt><dd className="text-muted-foreground">{report.publishedStains} core + {report.publishedDiagnostics} diagnostic</dd></div>
              <div><dt className="font-semibold">Domestic methods approved</dt><dd className="text-muted-foreground">{report.domesticMethodsApproved.join(" · ")}</dd></div>
              <div><dt className="font-semibold">Professional mappings approved</dt><dd className="text-muted-foreground">{report.professionalMappingsApproved} (product documentation pending)</dd></div>
              <div><dt className="font-semibold">Unresolved documentation gaps</dt><dd className="text-muted-foreground">{report.unresolvedDocumentationGaps}</dd></div>
              <div><dt className="font-semibold">UAT task completion</dt><dd className="text-muted-foreground">{report.uatTaskCompletionRate}% across {report.userGroupsTested.length} groups</dd></div>
              <div><dt className="font-semibold">Adverse outcomes</dt><dd className="text-muted-foreground">{report.adverseOutcomes}</dd></div>
              <div><dt className="font-semibold">Outcome summary</dt><dd className="text-muted-foreground">{report.outcomeSummary}</dd></div>
              <div><dt className="font-semibold">Content changes</dt><dd className="text-muted-foreground">{report.contentChanges}</dd></div>
            </dl>
            <p className="mt-2 text-xs font-semibold">Remaining risks</p>
            <ul className="list-disc pl-4 text-xs text-muted-foreground">{report.remainingRisks.map((r) => <li key={r}>{r}</li>)}</ul>
            <p className="mt-2 rounded-lg bg-primary/5 p-2 text-xs">{report.recommendation}</p>
            <Button
              className="mt-3"
              variant="outline"
              onClick={() => {
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "stain-master-pilot-report.json"; a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export pilot completion report
            </Button>
          </Section>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
