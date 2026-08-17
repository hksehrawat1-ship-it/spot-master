import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, Info, Layers, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import {
  CASE_ADDITION_PRESETS, DAMAGE_INDICATORS, MODE_LABEL, USER_CONFIRMATION_OPTIONS,
  classify, modeForRole, type ClassifyInput, type UserConfirmation,
} from "@/lib/classification";
import { presentForRole } from "@/lib/classificationScenarios";
import {
  CATEGORY_BY_KEY, COMPONENT_LABEL, DAMAGE_LABEL, DAMAGE_PLAIN, EVIDENCE_LABEL,
  PRIMARY_CATEGORIES, RELEVANCE_LABEL, SOURCE_TYPE_LABEL, TAG_LABEL,
  type PrimaryCategoryKey,
} from "@/data/taxonomy";
import { PUBLISHED_STAINS } from "@/data/stainClassifications";
import { useClassification } from "@/store/useClassification";
import { useReadiness } from "@/store/useReadiness";
import type { UserRoleKey } from "@/lib/fabricSafety";

const RISK_STYLE: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  amber: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  red: "bg-destructive/10 text-destructive",
  black: "bg-foreground text-background",
};

export default function StainClassify() {
  const navigate = useNavigate();
  const readinessCases = useReadiness((s) => s.cases);
  const createCase = useClassification((s) => s.create);

  const latest = readinessCases[0] ?? null;

  const [role, setRole] = useState<UserRoleKey>((latest?.context?.role as UserRoleKey) ?? "domestic_user");
  const [isReviewer, setIsReviewer] = useState(false);
  const [libraryKey, setLibraryKey] = useState<string>("");
  const [query, setQuery] = useState("");
  const [additions, setAdditions] = useState<string[]>([]);
  const [damageIndicators, setDamageIndicators] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<UserConfirmation | undefined>();
  const [correctionPrimary, setCorrectionPrimary] = useState<PrimaryCategoryKey | "">("");
  const [correctionNote, setCorrectionNote] = useState("");

  const mode = modeForRole(role, isReviewer);

  const options = useMemo(() => {
    const all = PUBLISHED_STAINS();
    const q = query.trim().toLowerCase();
    if (!q) return all.slice(0, 12);
    return all
      .filter((s) =>
        [s.name, ...s.alt, ...s.local].some((n) => n.toLowerCase().includes(q)))
      .slice(0, 20);
  }, [query]);

  const answers = latest?.answers ?? null;

  const input: ClassifyInput = useMemo(
    () => ({
      libraryKey: libraryKey || null,
      additions,
      damageIndicators,
      conditionTags: [],
      heatExposed: Boolean(answers?.heatExposure.some((h) => h !== "No" && h !== "Not known")),
      heatSetPossible: Boolean(latest?.result?.heatSetSuspected),
      previousChemicalUnknown: Boolean(
        answers?.appliedProducts.some((p) => /unknown|not sure|unlabelled/i.test(p)),
      ),
      chemicalMixing: answers?.mixing === "Yes" || answers?.mixing === "Possibly",
      dyeTransferring: answers?.dyeTransferring === "Yes",
      crossesColours: answers?.stainCrossesColours === "Yes",
      affectedComponent: latest?.result?.mostSensitiveComponent,
      riskBefore: (latest?.result?.riskAfter as ClassifyInput["riskBefore"]) ?? "green",
      readiness: latest?.result?.status ?? null,
      role,
      confirmation,
      correctionPrimary: correctionPrimary || null,
      correctionNote,
    }),
    [libraryKey, additions, damageIndicators, latest, answers, role, confirmation, correctionPrimary, correctionNote],
  );

  const result = useMemo(() => classify(input), [input]);
  const view = presentForRole(result, role, isReviewer);

  const toggle = (list: string[], set: (v: string[]) => void, key: string) =>
    set(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  const save = () => {
    const id = createCase(input, {
      readinessCaseId: latest?.id ?? null,
      identificationId: latest?.input?.identificationId ?? null,
    });
    toast.success("Classification saved", { description: `Case ${id}` });
    navigate("/admin/classification");
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Classify this case</h1>
        <p className="text-sm text-muted-foreground">
          Step 5 records what the stain is made of. It does not choose products or methods.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{MODE_LABEL[mode]}</Badge>
          {latest && <Badge variant="outline">Linked to readiness case {latest.id}</Badge>}
        </div>
      </header>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Who is handling this case?</p>
        <select
          className="w-full rounded-lg border bg-background p-2 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRoleKey)}
          aria-label="User role"
        >
          <option value="domestic_user">Home user</option>
          <option value="laundry_employee">Laundry employee</option>
          <option value="dry_cleaner">Dry cleaner</option>
          <option value="professional_spotter">Professional spotter</option>
          <option value="trainer">Trainer</option>
          <option value="learner">Learner</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isReviewer} onChange={(e) => setIsReviewer(e.target.checked)} />
          I am a technical reviewer for this case
        </label>
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Which stain was identified?</p>
        <Input
          placeholder="Search the stain library"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search the stain library"
        />
        <div className="flex flex-wrap gap-1.5">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => setLibraryKey(o.key === libraryKey ? "" : o.key)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                libraryKey === o.key ? "border-primary bg-primary text-primary-foreground" : "bg-background"
              }`}
            >
              {o.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Leave this empty if the stain is genuinely unknown. Unknown is a valid answer.
        </p>
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Anything added to this specific stain?</p>
        <div className="flex flex-wrap gap-1.5">
          {CASE_ADDITION_PRESETS.map((a) => (
            <button
              key={a.key}
              onClick={() => toggle(additions, setAdditions, a.key)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                additions.includes(a.key) ? "border-primary bg-primary/10" : "bg-background"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          These apply to this case only. The stain library record is never changed.
        </p>
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Is anything visibly wrong with the fabric itself?</p>
        <div className="flex flex-wrap gap-1.5">
          {DAMAGE_INDICATORS.map((d) => (
            <button
              key={d.key}
              onClick={() => toggle(damageIndicators, setDamageIndicators, d.key)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                damageIndicators.includes(d.key) ? "border-destructive bg-destructive/10" : "bg-background"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Fabric damage is recorded separately from stain chemistry.
        </p>
      </Card>

      {/* ------------------------- Result ------------------------- */}
      <Card className="space-y-4 p-4">
        <div className="flex items-start gap-2">
          <Layers className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
          <div>
            <p className="text-lg font-bold">
              {result.damageOnly ? "Fabric damage diagnosis" : result.primaryCategoryName}
            </p>
            <p className="text-sm">{view.plain}</p>
          </div>
        </div>

        {!result.damageOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${RISK_STYLE[result.riskAfter]}`}>
              Risk {result.riskAfter}
            </span>
            {view.showTechnical && (
              <Badge variant="outline">Category confidence {result.primaryConfidence}/10</Badge>
            )}
            {view.showEvidence && <Badge variant="outline">{EVIDENCE_LABEL[result.evidence]}</Badge>}
          </div>
        )}

        {result.damageKeys.length > 0 && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <ShieldAlert className="h-4 w-4" aria-hidden /> Damage diagnosis
            </p>
            <ul className="mt-1 space-y-1 text-sm">
              {result.damageKeys.map((d) => (
                <li key={d}>
                  <span className="font-medium">{DAMAGE_LABEL[d]}</span> — {DAMAGE_PLAIN[d]}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted-foreground">
              Damage confidence {result.damageConfidence}/10. Damage is not a stain and is not treated as one.
            </p>
          </div>
        )}

        {result.components.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What it is made of
            </p>
            <div className="mt-1 space-y-1">
              {result.components.map((c) => (
                <div key={`${c.key}-${c.origin}`} className="flex items-center justify-between gap-2 text-sm">
                  <span>{COMPONENT_LABEL[c.key]}</span>
                  <span className="text-xs text-muted-foreground">
                    {RELEVANCE_LABEL[c.relevance]}
                    {view.showTechnical ? ` · ${c.confidence}/10 · ${c.origin}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {result.sources.map((s) => (
              <Badge key={s} variant="secondary">{SOURCE_TYPE_LABEL[s]}</Badge>
            ))}
          </div>
        )}

        {(result.conditionTags.length > 0 || result.riskTags.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {[...result.conditionTags, ...result.riskTags].map((t) => (
              <Badge key={t} variant="outline">{TAG_LABEL[t] ?? t}</Badge>
            ))}
          </div>
        )}

        {result.unresolvedQuestions.length > 0 && (
          <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/40">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4" aria-hidden /> Still unresolved
            </p>
            <ul className="mt-1 list-disc pl-5 text-sm text-amber-900/90 dark:text-amber-200/90">
              {result.unresolvedQuestions.map((q) => <li key={q}>{q}</li>)}
            </ul>
          </div>
        )}

        <div className="rounded-xl bg-muted p-3 text-sm">
          <p className="font-semibold">Next action</p>
          <p>{result.nextAction}</p>
          <p className="mt-1 text-xs text-muted-foreground">{result.riskExplanation}</p>
        </div>

        {view.showTechnical && result.technicalNotes && (
          <details className="rounded-xl border p-3">
            <summary className="cursor-pointer text-sm font-semibold">Technical detail</summary>
            <dl className="mt-2 space-y-1 text-sm">
              {Object.entries(result.technicalNotes).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="w-28 shrink-0 text-xs uppercase text-muted-foreground">{k}</dt>
                  <dd className="flex-1">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              {result.rules.map((r) => <p key={r}>• {r}</p>)}
            </div>
          </details>
        )}

        {view.showTechnical && (
          <p className="text-xs text-muted-foreground">
            Taxonomy {result.taxonomyVersion} · Engine {result.engineVersion}
          </p>
        )}
      </Card>

      {/* --------------------- User confirmation --------------------- */}
      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Does this match what you see?</p>
        <div className="flex flex-wrap gap-1.5">
          {USER_CONFIRMATION_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setConfirmation(o.key)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                confirmation === o.key ? "border-primary bg-primary text-primary-foreground" : "bg-background"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {confirmation === "no" && (
          <div className="space-y-2">
            <select
              className="w-full rounded-lg border bg-background p-2 text-sm"
              value={correctionPrimary}
              onChange={(e) => setCorrectionPrimary(e.target.value as PrimaryCategoryKey | "")}
              aria-label="Suggested category"
            >
              <option value="">What do you think it is?</option>
              {PRIMARY_CATEGORIES.filter((c) => !c.technicalOnly || view.showTechnical).map((c) => (
                <option key={c.key} value={c.key}>{c.name}</option>
              ))}
            </select>
            <Textarea
              placeholder="Why do you think so? This is recorded for review."
              value={correctionNote}
              onChange={(e) => setCorrectionNote(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A disagreement is recorded and lowers confidence. It never silently overwrites the library.
            </p>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} className="flex-1">
          <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden /> Save classification
        </Button>
        <Link to="/stain-categories" className="flex-1">
          <Button variant="outline" className="w-full">
            Browse categories <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Button>
        </Link>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Classification never lowers a risk level set earlier, and never unblocks a case that was stopped in an
        earlier step. Product and method selection happen in later steps.
      </p>

      {result.blocked && (
        <Card className="border-destructive bg-destructive/5 p-4">
          <p className="text-sm font-semibold text-destructive">{result.blockReason}</p>
          <p className="text-sm">
            {CATEGORY_BY_KEY[result.primaryCategory ?? "combination_unknown"].name} has been recorded for
            documentation only.
          </p>
        </Card>
      )}
    </div>
  );
}
