import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Database, History, PlayCircle, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import {
  categoryCounts, checkTaxonomyGovernance, unclassifiedLegacyRecords,
} from "@/lib/classification";
import { runClassificationScenarios, type ScenarioResult } from "@/lib/classificationScenarios";
import {
  CATEGORY_BY_KEY, LEGACY_CATEGORY_MAP, PRIMARY_CATEGORIES, TAXONOMY_VERSION,
  type PrimaryCategoryKey,
} from "@/data/taxonomy";
import { LIBRARY_CLASSIFICATIONS } from "@/data/stainClassifications";
import { STAIN_CATEGORIES } from "@/data/stains";
import { useClassification } from "@/store/useClassification";

export default function ClassificationAdmin() {
  const cases = useClassification((s) => s.cases);
  const overrides = useClassification((s) => s.overrides);
  const overrideLibraryPrimary = useClassification((s) => s.overrideLibraryPrimary);
  const restoreVersion = useClassification((s) => s.restoreVersion);

  const [scenarios, setScenarios] = useState<ScenarioResult[] | null>(null);
  const [overrideKey, setOverrideKey] = useState("");
  const [overridePrimary, setOverridePrimary] = useState<PrimaryCategoryKey | "">("");
  const [justification, setJustification] = useState("");

  const counts = categoryCounts();
  const governance = checkTaxonomyGovernance();
  const legacyPending = useMemo(
    () => unclassifiedLegacyRecords(STAIN_CATEGORIES.map((c) => c.name)),
    [],
  );

  const disagreements = cases.filter((c) => c.input.confirmation === "no");
  const lowConfidence = cases.filter((c) => c.result.primaryConfidence <= 4);
  const unknownCases = cases.filter((c) => c.result.primaryCategory === "combination_unknown");
  const needsReview = LIBRARY_CLASSIFICATIONS.filter((l) => l.needsReview || l.status !== "published");

  const runTests = () => {
    const res = runClassificationScenarios();
    setScenarios(res);
    const failed = res.filter((r) => !r.passed).length;
    if (failed === 0) toast.success(`All ${res.length} classification scenarios passed`);
    else toast.error(`${failed} of ${res.length} scenarios failed`);
  };

  const applyOverride = () => {
    const record = LIBRARY_CLASSIFICATIONS.find((l) => l.key === overrideKey);
    if (!record || !overridePrimary || justification.trim().length < 10) {
      toast.error("Select a stain, a category, and give a justification of at least 10 characters");
      return;
    }
    overrideLibraryPrimary({
      key: overrideKey,
      primary: overridePrimary,
      previousPrimary: record.primary,
      justification: justification.trim(),
      by: "Technical reviewer",
    });
    setJustification("");
    toast.success("Reviewer override recorded");
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Classification governance</h1>
        <p className="text-sm text-muted-foreground">
          Taxonomy {TAXONOMY_VERSION} · {PRIMARY_CATEGORIES.length} permanent categories ·
          {" "}{LIBRARY_CLASSIFICATIONS.length} library records
        </p>
      </header>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="migration">Migration</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
        </TabsList>

        {/* ------------------------- Overview ------------------------- */}
        <TabsContent value="overview" className="space-y-3 pt-3">
          <Card className="p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4" aria-hidden /> Governance checks
            </p>
            {governance.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                No issues. Every published stain has exactly one primary category and no forbidden category
                names are in use.
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {governance.map((g) => (
                  <li key={g.message} className={g.severity === "error" ? "text-destructive" : "text-amber-700 dark:text-amber-300"}>
                    {g.severity === "error" ? "Error" : "Warning"}: {g.message}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3"><p className="text-2xl font-bold">{cases.length}</p><p className="text-xs text-muted-foreground">Classified cases</p></Card>
            <Card className="p-3"><p className="text-2xl font-bold">{unknownCases.length}</p><p className="text-xs text-muted-foreground">Recorded as unknown</p></Card>
            <Card className="p-3"><p className="text-2xl font-bold">{disagreements.length}</p><p className="text-xs text-muted-foreground">User disagreements</p></Card>
            <Card className="p-3"><p className="text-2xl font-bold">{lowConfidence.length}</p><p className="text-xs text-muted-foreground">Low confidence cases</p></Card>
          </div>

          <Card className="p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Database className="h-4 w-4" aria-hidden /> Published stains per category
            </p>
            <div className="mt-2 space-y-1">
              {PRIMARY_CATEGORIES.map((c) => (
                <div key={c.key} className="flex items-center justify-between text-sm">
                  <span>{c.icon} {c.name}</span>
                  <Badge variant={counts[c.key] ? "secondary" : "outline"}>{counts[c.key]}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-2 p-4">
            <p className="text-sm font-semibold">Reviewer override of a library record</p>
            <select
              className="w-full rounded-lg border bg-background p-2 text-sm"
              value={overrideKey}
              onChange={(e) => setOverrideKey(e.target.value)}
              aria-label="Stain record"
            >
              <option value="">Select a stain record</option>
              {LIBRARY_CLASSIFICATIONS.map((l) => (
                <option key={l.key} value={l.key}>{l.name}</option>
              ))}
            </select>
            <select
              className="w-full rounded-lg border bg-background p-2 text-sm"
              value={overridePrimary}
              onChange={(e) => setOverridePrimary(e.target.value as PrimaryCategoryKey)}
              aria-label="New primary category"
            >
              <option value="">New primary category</option>
              {PRIMARY_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
            </select>
            <Textarea
              placeholder="Justification (required, recorded permanently)"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
            <Button size="sm" onClick={applyOverride}>Record override</Button>
            {overrides.length > 0 && (
              <div className="space-y-1 pt-2 text-xs text-muted-foreground">
                {overrides.slice(0, 6).map((o) => (
                  <p key={`${o.key}-${o.at}`}>
                    {new Date(o.at).toLocaleString()} · {o.key}: {o.previousPrimary ?? "damage"} → {o.primary} — {o.justification}
                  </p>
                ))}
              </div>
            )}
          </Card>

          {needsReview.length > 0 && (
            <Card className="p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden /> Records awaiting review
              </p>
              <ul className="mt-1 space-y-1 text-sm">
                {needsReview.map((r) => (
                  <li key={r.key}>
                    {r.name} — {r.status}{r.reviewNote ? `: ${r.reviewNote}` : ""}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </TabsContent>

        {/* --------------------------- Cases --------------------------- */}
        <TabsContent value="cases" className="space-y-3 pt-3">
          {cases.length === 0 && (
            <Card className="p-4 text-sm text-muted-foreground">No classified cases yet.</Card>
          )}
          {cases.map((c) => (
            <Card key={c.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {c.result.damageOnly ? "Damage diagnosis" : c.result.primaryCategoryName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.id} · v{c.version} · {new Date(c.updatedAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline">{c.result.riskAfter}</Badge>
              </div>
              <p className="text-sm">{c.result.plainExplanation}</p>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <Badge variant="secondary">Confidence {c.result.primaryConfidence}/10</Badge>
                <Badge variant="secondary">{c.result.evidence}</Badge>
                {c.input.confirmation === "no" && <Badge variant="destructive">User disagreed</Badge>}
                {c.readinessCaseId && <Badge variant="outline">Readiness {c.readinessCaseId}</Badge>}
              </div>
              {c.versions.length > 1 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    <History className="mr-1 inline h-3 w-3" aria-hidden /> {c.versions.length} versions
                  </summary>
                  <div className="mt-1 space-y-1">
                    {c.versions.map((v) => (
                      <div key={v.version} className="flex items-center justify-between gap-2">
                        <span>
                          v{v.version} · {v.note} · {new Date(v.at).toLocaleString()}
                        </span>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => restoreVersion(c.id, v.version, "Technical reviewer")}
                        >
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* ------------------------- Migration ------------------------- */}
        <TabsContent value="migration" className="space-y-3 pt-3">
          <Card className="p-4">
            <p className="text-sm font-semibold">Legacy category mapping</p>
            <p className="text-xs text-muted-foreground">
              Old categories are mapped, not deleted. Every migrated record keeps its original category.
            </p>
            <div className="mt-2 space-y-2">
              {LEGACY_CATEGORY_MAP.map((m) => (
                <div key={m.legacy} className="rounded-lg border p-2 text-sm">
                  <p className="font-medium">{m.legacy}</p>
                  <p className="text-xs text-muted-foreground">
                    → {m.routedToDamage
                      ? "Damage diagnosis (not a stain category)"
                      : (m.target ? CATEGORY_BY_KEY[m.target].name
                        : m.split.map((t) => CATEGORY_BY_KEY[t].name).join(" or ") || "Chemistry category kept, tags added")}
                    {m.reviewerStatus === "needs_manual_review" ? " · record-level review required" : " · direct mapping"}
                  </p>
                  {m.tagsAdded.length > 0 && (
                    <p className="text-xs text-muted-foreground">Tags added: {m.tagsAdded.join(", ")}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{m.reason}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-semibold">Legacy categories not yet mapped</p>
            {legacyPending.length === 0 ? (
              <p className="mt-1 flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" aria-hidden /> Every legacy category has a mapping rule.
              </p>
            ) : (
              <ul className="mt-1 list-disc pl-5 text-sm">
                {legacyPending.map((n) => <li key={n}>{n}</li>)}
              </ul>
            )}
          </Card>
        </TabsContent>

        {/* --------------------------- Tests --------------------------- */}
        <TabsContent value="tests" className="space-y-3 pt-3">
          <Button onClick={runTests}>
            <PlayCircle className="mr-2 h-4 w-4" aria-hidden /> Run classification scenarios
          </Button>
          {scenarios && (
            <>
              <p className="text-sm text-muted-foreground">
                {scenarios.filter((s) => s.passed).length} of {scenarios.length} passed
              </p>
              <div className="space-y-2">
                {scenarios.map((s) => (
                  <Card key={s.name} className={`p-3 text-sm ${s.passed ? "" : "border-destructive"}`}>
                    <p className="font-medium">
                      {s.passed ? "PASS" : "FAIL"} — {s.name}
                    </p>
                    <p className="text-xs text-muted-foreground">Expected: {s.expected}</p>
                    <p className="text-xs text-muted-foreground">Actual: {s.actual}</p>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
