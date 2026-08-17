/** STEP 9 — Safety Rules Engine administration and test console. */

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CATEGORY_LABEL, SEVERITY_LABEL, BAND_LABEL, EFFECT_LABEL, RULE_CATEGORIES,
  NON_OVERRIDABLE_REASONS, RULESET_VERSION,
} from "@/data/safetyRules";
import type { RuleCategory } from "@/data/safetyRules";
import { useSafety } from "@/store/useSafety";
import { ENGINE_VERSION, OUTCOME_LABEL } from "@/lib/safetyEngine";
import { SCENARIOS, runSafetyScenarios } from "@/lib/safetyScenarios";
import { ShieldAlert, ShieldCheck, RotateCcw, PlayCircle } from "lucide-react";

const severityTone: Record<string, string> = {
  information: "bg-muted text-muted-foreground",
  caution: "bg-amber-500/15 text-amber-600",
  test_required: "bg-sky-500/15 text-sky-600",
  professional_only: "bg-orange-500/15 text-orange-600",
  stop: "bg-destructive/15 text-destructive",
  hazard_referral: "bg-destructive text-destructive-foreground",
};

export default function SafetyAdmin() {
  const { rules, updateRule, rollbackRule, audit, evaluations, overrides, revokeOverride } = useSafety();
  const all = rules();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RuleCategory | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const [results, setResults] = useState<ReturnType<typeof runSafetyScenarios> | null>(null);

  const filtered = useMemo(
    () =>
      all.filter(
        (r) =>
          (category === "all" || r.category === category) &&
          (query.trim() === "" ||
            `${r.ruleId} ${r.name} ${r.plainTitle} ${r.warning}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [all, category, query],
  );

  const rule = all.find((r) => r.ruleId === selected) ?? null;
  const passCount = results?.filter((r) => r.pass).length ?? 0;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-24">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Safety Rules Engine</h1>
        <p className="text-sm text-muted-foreground">
          {all.length} rules · {ENGINE_VERSION} · {RULESET_VERSION}
        </p>
      </header>

      <Tabs defaultValue="rules">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="console">Test console</TabsTrigger>
          <TabsTrigger value="history">Evaluations</TabsTrigger>
          <TabsTrigger value="overrides">Overrides</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* ---------------- Rules ---------------- */}
        <TabsContent value="rules" className="space-y-4 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="Search rules" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value as RuleCategory | "all")}
            >
              <option value="all">All categories</option>
              {RULE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              {filtered.map((r) => (
                <button
                  key={r.ruleId}
                  onClick={() => setSelected(r.ruleId)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selected === r.ruleId ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{r.ruleId}</span>
                    <Badge className={severityTone[r.severity]}>{SEVERITY_LABEL[r.severity]}</Badge>
                  </div>
                  <p className="mt-1 text-sm font-semibold">{r.plainTitle}</p>
                  <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[r.category]} · {BAND_LABEL[r.band]}</p>
                </button>
              ))}
              {filtered.length === 0 && <p className="text-sm text-muted-foreground">No rules match.</p>}
            </div>

            <div>
              {rule ? (
                <Card className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold">{rule.name}</h2>
                      <p className="font-mono text-xs text-muted-foreground">
                        {rule.ruleId} · v{rule.version} · {rule.status}
                      </p>
                    </div>
                    {rule.overridable ? (
                      <Badge variant="outline"><ShieldCheck className="mr-1 h-3 w-3" />Overridable</Badge>
                    ) : (
                      <Badge className="bg-destructive text-destructive-foreground">
                        <ShieldAlert className="mr-1 h-3 w-3" />Never overridable
                      </Badge>
                    )}
                  </div>

                  <section className="space-y-1 text-sm">
                    <p><span className="font-medium">Plain warning:</span> {rule.warning}</p>
                    {rule.requiredAction && <p><span className="font-medium">Required action:</span> {rule.requiredAction}</p>}
                    {rule.stopCondition && <p><span className="font-medium">Stop condition:</span> {rule.stopCondition}</p>}
                    <p className="text-muted-foreground">{rule.technicalDescription}</p>
                  </section>

                  <section className="space-y-1 text-xs text-muted-foreground">
                    <p><span className="font-medium text-foreground">Trigger:</span> {rule.triggerDescription}</p>
                    <p><span className="font-medium text-foreground">Required data:</span> {rule.requiredData.join(", ")}</p>
                    <p><span className="font-medium text-foreground">Effects:</span> {rule.effects.map((e) => EFFECT_LABEL[e]).join("; ")}</p>
                    <p><span className="font-medium text-foreground">Evidence:</span> {rule.evidenceSource}</p>
                    <p><span className="font-medium text-foreground">Countries:</span> {rule.countries.join(", ")} · <span className="font-medium text-foreground">Roles:</span> {rule.roles === "all" ? "all" : rule.roles.join(", ")}</p>
                    <p><span className="font-medium text-foreground">Effective:</span> {rule.effectiveDate}{rule.reviewDate ? ` · Review ${rule.reviewDate}` : ""}</p>
                  </section>

                  <div className="space-y-2 border-t pt-3">
                    <Textarea
                      placeholder="Justification for any change (required)"
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={justification.trim().length < 10}
                        onClick={() => {
                          updateRule(rule.ruleId, { status: rule.status === "active" ? "under_review" : "active" }, justification, "technical_reviewer");
                          setJustification("");
                        }}
                      >
                        {rule.status === "active" ? "Send to review" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={justification.trim().length < 10}
                        onClick={() => { rollbackRule(rule.ruleId, justification, "technical_reviewer"); setJustification(""); }}
                      >
                        <RotateCcw className="mr-1 h-4 w-4" />Roll back to published version
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-4 text-sm text-muted-foreground">Select a rule to see its detail.</Card>
              )}
            </div>
          </div>

          <Card className="p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Never overridable, whatever the authority:</p>
            <p>{NON_OVERRIDABLE_REASONS.join(" · ")}</p>
          </Card>
        </TabsContent>

        {/* ---------------- Test console ---------------- */}
        <TabsContent value="console" className="space-y-3 pt-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => setResults(runSafetyScenarios())}>
              <PlayCircle className="mr-1 h-4 w-4" />Run {SCENARIOS.length} scenarios
            </Button>
            {results && (
              <span className="text-sm font-medium">
                {passCount}/{results.length} passed
              </span>
            )}
          </div>
          <div className="space-y-2">
            {results?.map((r) => (
              <Card key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <div>
                  <p className="font-medium">{r.id} · {r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Expected: {r.expectation} · Outcome: {OUTCOME_LABEL[r.outcome as keyof typeof OUTCOME_LABEL]} · Risk: {r.risk}
                    {r.determining ? ` · ${r.determining}` : ""}
                  </p>
                </div>
                <Badge className={r.pass ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/15 text-destructive"}>
                  {r.pass ? "Pass" : "Fail"}
                </Badge>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ---------------- Evaluations ---------------- */}
        <TabsContent value="history" className="space-y-2 pt-4">
          {evaluations.length === 0 && <p className="text-sm text-muted-foreground">No evaluations recorded yet.</p>}
          {evaluations.slice(0, 50).map((e) => (
            <Card key={e.evaluationId} className="space-y-1 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">{e.caseId} v{e.caseVersion}</span>
                <Badge>{OUTCOME_LABEL[e.outcome]}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(e.evaluatedAt).toLocaleString()} · {e.engineVersion} · {e.rulesetVersion} · risk {e.riskLevel}
              </p>
              <p className="text-xs">Fired: {e.firedRules.map((f) => f.ruleId).join(", ") || "none"}</p>
              {e.determiningRule && <p className="text-xs font-medium">Determined by {e.determiningRule.ruleId} — {e.determiningRule.plainTitle}</p>}
            </Card>
          ))}
        </TabsContent>

        {/* ---------------- Overrides ---------------- */}
        <TabsContent value="overrides" className="space-y-2 pt-4">
          {overrides.length === 0 && <p className="text-sm text-muted-foreground">No overrides recorded.</p>}
          {overrides.map((o) => (
            <Card key={o.overrideId} className="flex items-start justify-between gap-3 p-3 text-sm">
              <div>
                <p className="font-medium">{o.ruleId} · case {o.caseId}</p>
                <p className="text-xs text-muted-foreground">
                  {o.approvedBy} · {new Date(o.approvedAt).toLocaleString()}{o.expiresAt ? ` · expires ${o.expiresAt}` : ""}
                </p>
                <p className="text-xs">{o.reason}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => revokeOverride(o.overrideId)}>Revoke</Button>
            </Card>
          ))}
        </TabsContent>

        {/* ---------------- Audit ---------------- */}
        <TabsContent value="audit" className="space-y-2 pt-4">
          {audit.length === 0 && <p className="text-sm text-muted-foreground">No rule changes recorded.</p>}
          {audit.map((a) => (
            <Card key={a.id} className="p-3 text-sm">
              <p className="font-medium">{a.ruleId} · {a.action}{a.field ? ` · ${a.field}` : ""}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(a.at).toLocaleString()} · {a.changedBy}
                {a.previousValue !== undefined ? ` · ${a.previousValue} → ${a.newValue}` : ""}
              </p>
              <p className="text-xs">{a.justification}</p>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </main>
  );
}
