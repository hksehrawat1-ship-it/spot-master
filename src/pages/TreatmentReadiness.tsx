/**
 * Step 4 — Collect Treatment-Changing Information.
 * Adaptive questionnaire only. No products, quantities, contact times,
 * temperatures, rinsing or neutralization guidance is shown anywhere here.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, AlertTriangle, ShieldAlert, Info, Check, Save,
  ClipboardList, Beaker, Thermometer, Package, Globe, Wrench, Layers,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useFabricCheck } from "@/store/useFabricCheck";
import { useStainId } from "@/store/useStainId";
import { useReadiness } from "@/store/useReadiness";
import StainMasterPaywall from "@/components/StainMasterPaywall";
import { useApp } from "@/store/useApp";
import { riskWord, type GateStatus, type RiskLevel } from "@/lib/fabricSafety";
import { STAIN_BY_ID } from "@/data/stainKnowledge";
import {
  APPLIED_PRODUCT_OPTIONS, BUILDUP_OPTIONS, CAPABILITY_CONTEXTS, CLEANING_OUTCOME_OPTIONS,
  CLEANING_PROCESS_OPTIONS, CLEANING_PROCESS_PRO_OPTIONS, COLOUR_GROUP_OPTIONS,
  COLOURFASTNESS_OPTIONS, COMPONENT_OPTIONS, CONDITION_OPTIONS, COUNTRIES, DOMESTIC_EQUIPMENT,
  HEAT_OPTIONS, HEAT_RESULT_OPTIONS, LANGUAGES, PENETRATION_OPTIONS, PRODUCT_KITS,
  PROFESSIONAL_EQUIPMENT, SIZE_OPTIONS, STAIN_AGE_OPTIONS, STATUS_LABEL,
  TEST_FEASIBILITY_OPTIONS, TREATMENT_RESULT_OPTIONS, evaluateReadiness, isProfessionalContext,
  planQuestions, validateAnswers,
  type AppliedProductRecord, type InventoryItem, type ReadinessAnswers, type ReadinessContext,
  type ReadinessResult,
} from "@/lib/treatmentReadiness";

/* --------------------------- building blocks --------------------------- */

function Why({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
      >
        <Info className="h-3.5 w-3.5" aria-hidden /> Why this matters
      </button>
      {open && <p className="mt-1 rounded-lg bg-muted p-2 text-xs text-muted-foreground">{text}</p>}
    </div>
  );
}

function Chips({
  options, value, onChange, multi = true, name,
}: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void; multi?: boolean; name: string }) {
  return (
    <div role={multi ? "group" : "radiogroup"} aria-label={name} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={on}
            onClick={() => onChange(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : [o])}
            className={`min-h-11 max-w-full break-words rounded-full border px-4 py-2 text-left text-sm font-medium transition-colors ${
              on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary"
            }`}
          >
            {on && <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

function StepHeader({ step, total, title, hint }: { step: number; total: number; title: string; hint?: string }) {
  return (
    <div className="space-y-2">
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label="Assessment progress"
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(step / total) * 100}%` }} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Question {step} of {total}
      </p>
      <h2 className="text-xl font-bold leading-tight">{title}</h2>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

const RISK_TONE: Record<RiskLevel, string> = {
  green: "bg-emerald-50 text-emerald-800 border-emerald-200",
  amber: "bg-amber-50 text-amber-900 border-amber-200",
  red: "bg-red-50 text-red-800 border-red-200",
  black: "bg-neutral-900 text-white border-neutral-900",
};

function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${RISK_TONE[level]}`}>
      <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
      {level.toUpperCase()} — {riskWord(level)}
    </span>
  );
}

/* ------------------------------- page ---------------------------------- */

export default function TreatmentReadiness() {
  const navigate = useNavigate();
  const unlocked = useApp((s) => s.stainMasterUnlocked);
  const assessments = useFabricCheck((s) => s.assessments);
  const idCases = useStainId((s) => s.cases);
  const { cases, currentId, start, patch, complete, track, resume, clearCurrent } = useReadiness();

  const fabric = useMemo(
    () => assessments.find((a) => a.state === "completed" && a.result) ?? null,
    [assessments],
  );
  const identification = useMemo(
    () => idCases.find((c) => c.state === "completed" && c.result) ?? null,
    [idCases],
  );

  const context: ReadinessContext = useMemo(() => {
    const fr = fabric?.result ?? null;
    const ir = identification?.result ?? null;
    const confirmed = identification?.confirmedStainId ?? ir?.candidates[0]?.stainId ?? null;
    return {
      riskBefore: (ir?.riskAfter ?? fabric?.adminOverride?.riskLevel ?? fr?.riskLevel ?? "amber") as RiskLevel,
      gateBefore: (ir?.gateAfter ?? fabric?.adminOverride?.gate ?? fr?.gate ?? "blocked_pending_identification") as GateStatus,
      fabricConfidence: fr?.confidence ?? "unknown",
      garmentType: fabric?.answers.garmentType || "Not recorded",
      suspectedMaterial: fr?.suspectedMaterialFamily ?? null,
      colourGroupKnown: fabric?.answers.colours?.[0] ?? null,
      constructionKnown: fabric?.answers.construction ?? [],
      existingDamage: fabric?.answers.damage ?? [],
      suspectedStain: confirmed ? (STAIN_BY_ID[confirmed]?.name ?? confirmed) : null,
      alternativeStains: (ir?.candidates ?? []).slice(1).map((c) => c.name),
      stainConfidence: ir?.confidence ?? 0,
      stainAgeKnown: identification?.answers.age ?? null,
      previousTreatmentKnown: identification?.answers.previousTreatment ?? [],
      hazardStop: ir?.hazardStop ?? false,
      damageRoute: ir?.damageRoute ?? false,
      role: fabric?.answers.role ?? "domestic_user",
    };
  }, [fabric, identification]);

  const current = cases.find((c) => c.id === currentId) ?? null;
  const [stage, setStage] = useState<"entry" | "questions" | "result">("entry");
  const [index, setIndex] = useState(0);
  const [paywall, setPaywall] = useState(false);

  if (!unlocked) {
    return (
      <div className="px-4 pb-28 pt-6">
        <StainMasterPaywall open={paywall} onOpenChange={setPaywall} />
        <Card className="p-5 text-sm text-muted-foreground">
          Treatment readiness is part of Stain Master.
          <Button className="mt-3 w-full" onClick={() => setPaywall(true)}>Unlock Stain Master</Button>
        </Card>
      </div>
    );
  }

  const a: ReadinessAnswers | null = current?.answers ?? null;
  const questions = a ? planQuestions(a, current!.context) : [];
  const q = questions[index];

  const set = (p: Partial<ReadinessAnswers>, note?: string) => {
    if (!current) return;
    patch(current.id, p, note);
  };

  const begin = () => {
    const id =
      current && current.state === "in_progress"
        ? current.id
        : start({
            owner: "guest",
            fabricAssessmentId: fabric?.id ?? null,
            identificationId: identification?.id ?? null,
            context,
            // Reuse Steps 2 and 3 — never ask these again from scratch.
            seed: {
              stainAge: context.stainAgeKnown,
              colourGroup: context.colourGroupKnown,
              capabilityContext: context.role,
              components: context.constructionKnown.length ? [] : [],
            },
          });
    if (!current || current.state !== "in_progress") resume(id);
    track("readiness_started", "entry");
    setIndex(0);
    setStage("questions");
  };

  const next = () => {
    if (!current) return;
    const errs = validateAnswers(current.answers);
    if (errs.length) { toast.error(errs[0]); return; }
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      track("question_answered", q?.key);
    } else {
      complete(current.id);
      track("readiness_completed");
      setStage("result");
    }
  };

  const back = () => (index === 0 ? setStage("entry") : setIndex(index - 1));

  /* ------------------------------ entry ------------------------------ */
  if (stage === "entry" || !a) {
    const missingSteps = !fabric || !identification;
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
        <Link to="/stain-id" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">A few details can change the safest treatment.</h1>
          <p className="text-sm text-muted-foreground">
            We’ll check the stain’s condition, previous treatment and available cleaning method before suggesting any action.
          </p>
        </div>

        {missingSteps && (
          <Card className="border-amber-200 bg-amber-50 p-4">
            <p className="flex items-start gap-2 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                {!fabric && "The Fabric Safety Check (Step 2) has not been completed. "}
                {!identification && "The Stain Identification (Step 3) has not been completed. "}
                You can still continue, but the assessment will stay cautious until those are done.
              </span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {!fabric && <Button size="sm" variant="outline" onClick={() => navigate("/fabric-check")}>Fabric Safety Check</Button>}
              {!identification && <Button size="sm" variant="outline" onClick={() => navigate("/stain-id")}>Identify the Stain</Button>}
            </div>
          </Card>
        )}

        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge level={context.riskBefore} />
            <Badge variant="secondary">Fabric confidence: {context.fabricConfidence}</Badge>
          </div>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Suspected stain</dt><dd className="font-medium">{context.suspectedStain ?? "Unknown"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Identification confidence</dt><dd className="font-medium">{context.stainConfidence}/10</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Garment</dt><dd className="font-medium">{context.garmentType}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Approximate time</dt><dd className="font-medium">3–5 minutes</dd></div>
          </dl>
        </Card>

        <Button className="w-full" size="lg" onClick={begin}>
          Continue Assessment <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => navigate("/stain-id")}>Review Earlier Answers</Button>
          <Button variant="outline" onClick={() => { clearCurrent(); toast.success("Progress saved"); navigate("/stain-master"); }}>
            <Save className="mr-1 h-4 w-4" aria-hidden /> Save and Exit
          </Button>
        </div>

        {cases.length > 0 && (
          <Card className="p-4">
            <p className="mb-2 text-sm font-semibold">Saved assessments</p>
            <ul className="space-y-2">
              {cases.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <button
                    className="flex w-full items-center justify-between rounded-lg border p-2 text-left text-sm hover:border-primary"
                    onClick={() => { resume(c.id); setIndex(0); setStage(c.result ? "result" : "questions"); }}
                  >
                    <span>{c.context.suspectedStain ?? "Unknown stain"} · {c.context.garmentType}</span>
                    <span className="text-xs text-muted-foreground">{c.result ? STATUS_LABEL[c.result.status] : "In progress"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  /* ----------------------------- result ------------------------------ */
  if (stage === "result" && current?.result) {
    return <ResultView result={current.result} ctx={current.context} answers={a} onEdit={() => { setIndex(0); setStage("questions"); }} />;
  }

  /* ---------------------------- questions ---------------------------- */
  const professional = isProfessionalContext(a.capabilityContext);
  const liveRisk = evaluateReadiness(a, current!.context).riskAfter;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
      <button onClick={back} className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back
      </button>

      <StepHeader step={index + 1} total={questions.length} title={q.title} />

      <Card className="space-y-4 p-4">
        {q.key === "summary" && (
          <div className="space-y-3">
            <dl className="grid gap-2 text-sm">
              <Row k="Garment type" v={current!.context.garmentType} />
              <Row k="Known or suspected fabric" v={current!.context.suspectedMaterial ?? "Not established"} />
              <Row k="Fabric confidence" v={current!.context.fabricConfidence} />
              <Row k="Colour" v={current!.context.colourGroupKnown ?? "Not recorded"} />
              <Row k="Decorations or coatings" v={current!.context.constructionKnown.join(", ") || "None recorded"} />
              <Row k="Existing damage" v={current!.context.existingDamage.join(", ") || "None recorded"} />
              <Row k="Suspected stain" v={current!.context.suspectedStain ?? "Unknown"} />
              <Row k="Alternative possibilities" v={current!.context.alternativeStains.join(", ") || "None"} />
              <Row k="Identification confidence" v={`${current!.context.stainConfidence}/10`} />
              <Row k="Current risk" v={current!.context.riskBefore} />
              <Row k="Treatment gate" v={current!.context.gateBefore.replace(/_/g, " ")} />
            </dl>
            <Chips
              name="Summary confirmation"
              multi={false}
              options={["Yes", "Edit Garment Information", "Edit Stain Information", "I’m Not Sure"]}
              value={
                a.summaryConfirmed === "yes" ? ["Yes"]
                  : a.summaryConfirmed === "edit_garment" ? ["Edit Garment Information"]
                    : a.summaryConfirmed === "edit_stain" ? ["Edit Stain Information"]
                      : a.summaryConfirmed === "not_sure" ? ["I’m Not Sure"] : []
              }
              onChange={(v) => {
                const map: Record<string, ReadinessAnswers["summaryConfirmed"]> = {
                  Yes: "yes", "Edit Garment Information": "edit_garment", "Edit Stain Information": "edit_stain", "I’m Not Sure": "not_sure",
                };
                set({ summaryConfirmed: map[v[0]] });
                if (v[0] === "Edit Garment Information") navigate("/fabric-check");
                if (v[0] === "Edit Stain Information") navigate("/stain-id");
              }}
            />
          </div>
        )}

        {q.key === "age" && (
          <>
            {q.prefilled && (
              <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">
                Recorded earlier as “{q.prefilled}”. Confirm or change it.
              </p>
            )}
            <Chips name="Stain age" multi={false} options={STAIN_AGE_OPTIONS} value={a.stainAge ? [a.stainAge] : []} onChange={(v) => set({ stainAge: v[0], ageIsApproximate: true })} />
            <p className="text-xs text-muted-foreground">Recorded as an approximate value — we do not show false precision.</p>
          </>
        )}

        {q.key === "condition" && <Chips name="Current condition" options={CONDITION_OPTIONS} value={a.condition} onChange={(v) => set({ condition: v })} />}

        {q.key === "heat" && (
          <div className="space-y-3">
            <Thermometer className="h-5 w-5 text-muted-foreground" aria-hidden />
            <Chips name="Heat exposure" options={HEAT_OPTIONS} value={a.heatExposure} onChange={(v) => set({ heatExposure: v })} />
          </div>
        )}

        {q.key === "heat_result" && <Chips name="After heat" options={HEAT_RESULT_OPTIONS} value={a.heatResult} onChange={(v) => set({ heatResult: v })} />}

        {q.key === "cleaning" && (
          <Chips
            name="Previous cleaning"
            options={professional ? [...CLEANING_PROCESS_OPTIONS, ...CLEANING_PROCESS_PRO_OPTIONS] : [...CLEANING_PROCESS_OPTIONS, "Dry-cleaned, solvent not known"]}
            value={a.cleaningProcess}
            onChange={(v) => set({ cleaningProcess: v })}
          />
        )}

        {q.key === "cleaning_detail" && (
          <div className="space-y-3">
            <label className="block text-sm font-medium" htmlFor="attempts">How many cleaning attempts?</label>
            <Input
              id="attempts" type="number" min={0} inputMode="numeric"
              value={a.cleaningAttempts ?? ""}
              onChange={(e) => set({ cleaningAttempts: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
            />
            <Chips name="Cleaning outcome" options={CLEANING_OUTCOME_OPTIONS} value={a.cleaningOutcome} onChange={(v) => set({ cleaningOutcome: v })} />
          </div>
        )}

        {q.key === "products" && <Chips name="Applied products" options={APPLIED_PRODUCT_OPTIONS} value={a.appliedProducts} onChange={(v) => set({ appliedProducts: v })} />}

        {q.key === "product_detail" && <ProductRecords answers={a} set={set} />}

        {q.key === "mixing" && (
          <div className="space-y-3">
            <Chips
              name="Chemical mixing" multi={false} options={["No", "Yes", "Possibly", "Not known"]}
              value={a.mixing ? [a.mixing] : []}
              onChange={(v) => set({ mixing: v[0] as ReadinessAnswers["mixing"] })}
            />
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mr-1 inline h-4 w-4" aria-hidden />
              Do not add another chemical until the previous products and their compatibility have been assessed.
            </p>
          </div>
        )}

        {q.key === "mixing_detail" && (
          <div className="space-y-3">
            <label className="block text-sm font-medium" htmlFor="mixprod">Which products were involved?</label>
            <Textarea id="mixprod" value={a.mixingProducts} onChange={(e) => set({ mixingProducts: e.target.value })} />
            <Chips
              name="Observed reaction"
              options={["Heat", "Odour", "Bubbling", "Colour change", "Fabric damage", "None of these", "Not sure"]}
              value={a.mixingReaction}
              onChange={(v) => set({ mixingReaction: v })}
            />
            <p className="text-xs text-muted-foreground">Never smell the garment or recreate the mixture to check.</p>
          </div>
        )}

        {q.key === "result" && <Chips name="Previous treatment result" options={TREATMENT_RESULT_OPTIONS} value={a.treatmentResult} onChange={(v) => set({ treatmentResult: v })} />}

        {q.key === "size" && (
          <div className="space-y-3">
            <Chips name="Size" multi={false} options={SIZE_OPTIONS} value={a.size ? [a.size] : []} onChange={(v) => set({ size: v[0] })} />
            <p className="text-sm font-medium">Quantity or buildup</p>
            <Chips name="Buildup" multi={false} options={BUILDUP_OPTIONS} value={a.buildup ? [a.buildup] : []} onChange={(v) => set({ buildup: v[0] })} />
          </div>
        )}

        {q.key === "penetration" && <Chips name="Penetration" options={PENETRATION_OPTIONS} value={a.penetration} onChange={(v) => set({ penetration: v })} />}

        {q.key === "components" && (
          <div className="space-y-3">
            <Layers className="h-5 w-5 text-muted-foreground" aria-hidden />
            <Chips name="Affected components" options={COMPONENT_OPTIONS} value={a.components} onChange={(v) => set({ components: v })} />
            <p className="text-xs text-muted-foreground">The most sensitive part the stain touches sets the safety boundary for later steps.</p>
          </div>
        )}

        {q.key === "colour" && (
          <div className="space-y-4">
            <Field label="Colour group">
              <Chips name="Colour group" multi={false} options={COLOUR_GROUP_OPTIONS} value={a.colourGroup ? [a.colourGroup] : []} onChange={(v) => set({ colourGroup: v[0] })} />
            </Field>
            <YesNo label="Does the stain cross more than one colour?" value={a.stainCrossesColours} onChange={(v) => set({ stainCrossesColours: v })} />
            <YesNo label="Is there a print?" value={a.hasPrint} onChange={(v) => set({ hasPrint: v })} />
            <YesNo label="Is dye already transferring?" value={a.dyeTransferring} onChange={(v) => set({ dyeTransferring: v })} />
            <YesNo label="Has colour changed after previous treatment?" value={a.colourChangedAfterTreatment} onChange={(v) => set({ colourChangedAfterTreatment: v })} />
            <Field label="Colourfastness status">
              <Chips name="Colourfastness" multi={false} options={COLOURFASTNESS_OPTIONS} value={[a.colourfastness]} onChange={(v) => set({ colourfastness: v[0] as ReadinessAnswers["colourfastness"] })} />
            </Field>
            <p className="text-xs text-muted-foreground">Colour is never marked safe simply because no bleeding is visible.</p>
          </div>
        )}

        {q.key === "capability" && (
          <div className="space-y-4">
            <Chips
              name="Working context" multi={false}
              options={CAPABILITY_CONTEXTS.map((c) => c.label)}
              value={CAPABILITY_CONTEXTS.filter((c) => c.key === a.capabilityContext).map((c) => c.label)}
              onChange={(v) => set({ capabilityContext: CAPABILITY_CONTEXTS.find((c) => c.label === v[0])?.key ?? null })}
            />
            <p className="text-xs text-muted-foreground">
              Your role comes from your account. Roles and permissions cannot be upgraded from this screen.
            </p>
            {isProfessionalContext(a.capabilityContext) && (
              <div className="space-y-3">
                <YesNo label="Training completed?" value={a.trainingCompleted === "Partly" ? null : (a.trainingCompleted as "Yes" | "No" | "Not sure" | null)} onChange={(v) => set({ trainingCompleted: v })} />
                <YesNo label="Supervision available?" value={a.supervisionAvailable} onChange={(v) => set({ supervisionAvailable: v })} />
                <Field label="Experience level">
                  <Chips name="Experience" multi={false} options={["Under 1 year", "1–3 years", "3–10 years", "More than 10 years"]} value={a.experienceLevel ? [a.experienceLevel] : []} onChange={(v) => set({ experienceLevel: v[0] })} />
                </Field>
                <Toggle label="Can perform compatibility tests" value={a.canRunTests} onChange={(v) => set({ canRunTests: v })} />
                <Toggle label="Can document results" value={a.canDocumentResults} onChange={(v) => set({ canDocumentResults: v })} />
              </div>
            )}
          </div>
        )}

        {q.key === "equipment" && (
          <div className="space-y-3">
            <Wrench className="h-5 w-5 text-muted-foreground" aria-hidden />
            <Chips
              name="Equipment"
              options={isProfessionalContext(a.capabilityContext) ? PROFESSIONAL_EQUIPMENT : DOMESTIC_EQUIPMENT}
              value={a.equipment}
              onChange={(v) => set({ equipment: v })}
            />
            <p className="text-xs text-muted-foreground">Having equipment does not by itself prove training to use it.</p>
          </div>
        )}

        {q.key === "inventory" && <Inventory answers={a} set={set} />}

        {q.key === "country" && (
          <div className="space-y-4">
            <Globe className="h-5 w-5 text-muted-foreground" aria-hidden />
            <Field label="Country of treatment">
              <Chips name="Country" multi={false} options={COUNTRIES} value={a.country ? [a.country] : []} onChange={(v) => set({ country: v[0] })} />
            </Field>
            <Field label="Preferred language">
              <Chips name="Language" multi={false} options={LANGUAGES} value={a.language ? [a.language] : []} onChange={(v) => set({ language: v[0] })} />
            </Field>
            <Field label="Product-market country (if different)">
              <Chips name="Product market" multi={false} options={COUNTRIES} value={a.productMarketCountry ? [a.productMarketCountry] : []} onChange={(v) => set({ productMarketCountry: v[0] })} />
            </Field>
            <Input placeholder="Organization location (optional)" value={a.organizationLocation ?? ""} onChange={(e) => set({ organizationLocation: e.target.value })} aria-label="Organization location" />
          </div>
        )}

        {q.key === "test" && (
          <div className="space-y-3">
            <Beaker className="h-5 w-5 text-muted-foreground" aria-hidden />
            <Chips name="Test feasibility" multi={false} options={TEST_FEASIBILITY_OPTIONS} value={a.testFeasible ? [a.testFeasible] : []} onChange={(v) => set({ testFeasible: v[0] })} />
            {a.testFeasible === "Professional test already completed" && <CompletedTestForm answers={a} set={set} />}
            <p className="text-xs text-muted-foreground">
              A hidden-area test reduces uncertainty only for the tested condition. It does not prove that every product or stage is safe.
            </p>
          </div>
        )}

        <Why text={q.why} />
      </Card>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Current risk: <strong>{liveRisk.toUpperCase()}</strong></span>
        <Button onClick={next} size="lg">
          {index + 1 === questions.length ? "See readiness result" : "Next"} <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

/* ----------------------------- sub-forms ------------------------------- */

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}

function YesNo({
  label, value, onChange,
}: { label: string; value: "Yes" | "No" | "Not sure" | null; onChange: (v: "Yes" | "No" | "Not sure") => void }) {
  return (
    <Field label={label}>
      <Chips name={label} multi={false} options={["Yes", "No", "Not sure"]} value={value ? [value] : []} onChange={(v) => onChange(v[0] as "Yes" | "No" | "Not sure")} />
    </Field>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 text-sm font-medium">
      <span>{label}</span>
      <Switch checked={value} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}

function ProductRecords({ answers, set }: { answers: ReadinessAnswers; set: (p: Partial<ReadinessAnswers>) => void }) {
  const add = () => {
    const rec: AppliedProductRecord = {
      id: `${Date.now()}`, productType: "", name: "", company: "", amount: "", diluted: "",
      dilution: "", contactTimeMinutes: null, rinsed: "", neutralized: "", heatAfter: "",
      observedResult: "", reportedUnverified: true,
    };
    set({ productRecords: [...answers.productRecords, rec] });
  };
  const upd = (id: string, p: Partial<AppliedProductRecord>) =>
    set({ productRecords: answers.productRecords.map((r) => (r.id === id ? { ...r, ...p } : r)) });

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">
        Everything entered here is recorded as user-reported case history and is marked unverified. It is never shown as an instruction.
      </p>
      {answers.productRecords.map((r, i) => (
        <Card key={r.id} className="space-y-3 p-3">
          <p className="text-sm font-semibold">Product {i + 1}</p>
          <Input placeholder="Product name" value={r.name} onChange={(e) => upd(r.id, { name: e.target.value })} aria-label={`Product ${i + 1} name`} />
          <Input placeholder="Company" value={r.company} onChange={(e) => upd(r.id, { company: e.target.value })} aria-label={`Product ${i + 1} company`} />
          <Input placeholder="Approximate amount" value={r.amount} onChange={(e) => upd(r.id, { amount: e.target.value })} aria-label={`Product ${i + 1} amount`} />
          <Field label="Was it diluted?">
            <Chips name={`Diluted ${i}`} multi={false} options={["Yes", "No", "Not known"]} value={r.diluted ? [r.diluted] : []} onChange={(v) => upd(r.id, { diluted: v[0] as AppliedProductRecord["diluted"] })} />
          </Field>
          {r.diluted === "Yes" && <Input placeholder="Dilution, if known (recorded unverified)" value={r.dilution} onChange={(e) => upd(r.id, { dilution: e.target.value })} aria-label="Dilution" />}
          <Input
            type="number" min={0} placeholder="Approximate contact time (minutes)"
            value={r.contactTimeMinutes ?? ""}
            onChange={(e) => upd(r.id, { contactTimeMinutes: e.target.value === "" ? null : Number(e.target.value) })}
            aria-label="Contact time in minutes"
          />
          <Field label="Rinsed?"><Chips name={`Rinsed ${i}`} multi={false} options={["Yes", "No", "Not known"]} value={r.rinsed ? [r.rinsed] : []} onChange={(v) => upd(r.id, { rinsed: v[0] as AppliedProductRecord["rinsed"] })} /></Field>
          <Field label="Neutralized?"><Chips name={`Neutralized ${i}`} multi={false} options={["Yes", "No", "Not known"]} value={r.neutralized ? [r.neutralized] : []} onChange={(v) => upd(r.id, { neutralized: v[0] as AppliedProductRecord["neutralized"] })} /></Field>
          <Field label="Heat or steam afterwards?"><Chips name={`Heat ${i}`} multi={false} options={["Yes", "No", "Not known"]} value={r.heatAfter ? [r.heatAfter] : []} onChange={(v) => upd(r.id, { heatAfter: v[0] as AppliedProductRecord["heatAfter"] })} /></Field>
          <Textarea placeholder="Observed result" value={r.observedResult} onChange={(e) => upd(r.id, { observedResult: e.target.value })} aria-label="Observed result" />
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full">
        <Package className="mr-1 h-4 w-4" aria-hidden /> Add a product used
      </Button>
    </div>
  );
}

function Inventory({ answers, set }: { answers: ReadinessAnswers; set: (p: Partial<ReadinessAnswers>) => void }) {
  const [filter, setFilter] = useState("");
  const add = () => {
    const item: InventoryItem = {
      id: `${Date.now()}`, productName: "", company: "", kit: answers.kits[0] ?? "Other or custom kit",
      bottleSize: "", country: answers.country ?? "", labelAvailable: false, sdsAvailable: false,
      tdsAvailable: false, expiryOrReview: "", organizationApproved: false, verificationStatus: "unverified",
    };
    set({ inventory: [...answers.inventory, item] });
  };
  const upd = (id: string, p: Partial<InventoryItem>) =>
    set({ inventory: answers.inventory.map((r) => (r.id === id ? { ...r, ...p } : r)) });

  const shown = answers.inventory.filter((i) => i.productName.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4">
      <Field label="Kits in use">
        <Chips name="Kits" options={PRODUCT_KITS} value={answers.kits} onChange={(v) => set({ kits: v })} />
      </Field>
      <Input placeholder="Search your inventory" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Search inventory" />
      {shown.map((it, i) => (
        <Card key={it.id} className="space-y-3 p-3">
          <Input placeholder="Product name" value={it.productName} onChange={(e) => upd(it.id, { productName: e.target.value })} aria-label={`Inventory ${i + 1} product name`} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Company" value={it.company} onChange={(e) => upd(it.id, { company: e.target.value })} aria-label="Company" />
            <Input placeholder="Bottle size" value={it.bottleSize} onChange={(e) => upd(it.id, { bottleSize: e.target.value })} aria-label="Bottle size" />
          </div>
          <Field label="Country of the documentation">
            <Chips name={`Country ${i}`} multi={false} options={COUNTRIES} value={it.country ? [it.country] : []} onChange={(v) => upd(it.id, { country: v[0] })} />
          </Field>
          <Toggle label="Label available" value={it.labelAvailable} onChange={(v) => upd(it.id, { labelAvailable: v })} />
          <Toggle label="SDS available" value={it.sdsAvailable} onChange={(v) => upd(it.id, { sdsAvailable: v })} />
          <Toggle label="TDS available" value={it.tdsAvailable} onChange={(v) => upd(it.id, { tdsAvailable: v })} />
          <Toggle label="Approved by the organization" value={it.organizationApproved} onChange={(v) => upd(it.id, { organizationApproved: v })} />
          <Input placeholder="Expiry or review status" value={it.expiryOrReview} onChange={(e) => upd(it.id, { expiryOrReview: e.target.value })} aria-label="Expiry or review" />
          <p className="text-xs text-muted-foreground">
            Verification status: <strong>{it.verificationStatus.replace(/_/g, " ")}</strong> — availability alone never makes a product eligible for guidance.
          </p>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full">
        <Package className="mr-1 h-4 w-4" aria-hidden /> Add an available product
      </Button>
    </div>
  );
}

function CompletedTestForm({ answers, set }: { answers: ReadinessAnswers; set: (p: Partial<ReadinessAnswers>) => void }) {
  const t = answers.completedTest ?? {
    testType: "", location: "", medium: "", procedureSource: "", colourTransfer: "",
    textureResult: "", ringFormation: "", distortion: "", decision: "", operator: "", date: "",
  };
  const upd = (p: Partial<typeof t>) => set({ completedTest: { ...t, ...p } });
  return (
    <Card className="space-y-3 p-3">
      <Input placeholder="Test type" value={t.testType} onChange={(e) => upd({ testType: e.target.value })} aria-label="Test type" />
      <Input placeholder="Test location on the garment" value={t.location} onChange={(e) => upd({ location: e.target.value })} aria-label="Test location" />
      <Input placeholder="Product or medium used" value={t.medium} onChange={(e) => upd({ medium: e.target.value })} aria-label="Medium" />
      <Input placeholder="Source of the test procedure" value={t.procedureSource} onChange={(e) => upd({ procedureSource: e.target.value })} aria-label="Procedure source" />
      <Field label="Colour transfer">
        <Chips name="Colour transfer" multi={false} options={["No transfer", "Colour transferred", "Not sure"]} value={t.colourTransfer ? [t.colourTransfer] : []} onChange={(v) => upd({ colourTransfer: v[0] })} />
      </Field>
      <Input placeholder="Texture result" value={t.textureResult} onChange={(e) => upd({ textureResult: e.target.value })} aria-label="Texture result" />
      <Input placeholder="Ring formation" value={t.ringFormation} onChange={(e) => upd({ ringFormation: e.target.value })} aria-label="Ring formation" />
      <Input placeholder="Distortion" value={t.distortion} onChange={(e) => upd({ distortion: e.target.value })} aria-label="Distortion" />
      <Input placeholder="Final decision" value={t.decision} onChange={(e) => upd({ decision: e.target.value })} aria-label="Decision" />
      <Input placeholder="Operator" value={t.operator} onChange={(e) => upd({ operator: e.target.value })} aria-label="Operator" />
      <Input type="date" value={t.date} onChange={(e) => upd({ date: e.target.value })} aria-label="Test date" />
    </Card>
  );
}

/* ------------------------------ result --------------------------------- */

function ResultView({
  result, ctx, answers, onEdit,
}: { result: ReadinessResult; ctx: ReadinessContext; answers: ReadinessAnswers; onEdit: () => void }) {
  const blocked = result.status.startsWith("blocked") || result.status === "specialist_referral_required";
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Treatment readiness</h1>

      <Card className="space-y-3 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold"><ClipboardList className="h-4 w-4" aria-hidden /> Case summary</p>
        <dl className="grid gap-2 text-sm">
          <Row k="Garment-risk group" v={`${result.riskAfter.toUpperCase()} — ${riskWord(result.riskAfter)}`} />
          <Row k="Fabric confidence" v={ctx.fabricConfidence} />
          <Row k="Suspected stain" v={ctx.suspectedStain ?? "Unknown"} />
          <Row k="Identification confidence" v={`${ctx.stainConfidence}/10`} />
          <Row k="Stain age" v={answers.stainAge ?? "Not recorded"} />
          <Row k="Condition" v={answers.condition.join(", ") || "Not recorded"} />
          <Row k="Heat exposure" v={answers.heatExposure.join(", ") || "Not recorded"} />
          <Row k="Previous cleaning" v={answers.cleaningProcess.join(", ") || "Not recorded"} />
          <Row k="Previous products" v={answers.appliedProducts.join(", ") || "Not recorded"} />
          <Row k="Affected components" v={answers.components.join(", ") || "Not recorded"} />
          <Row k="Safety boundary component" v={result.mostSensitiveComponent} />
          <Row k="Working context" v={CAPABILITY_CONTEXTS.find((c) => c.key === answers.capabilityContext)?.label ?? "Not recorded"} />
          <Row k="Available equipment" v={answers.equipment.join(", ") || "Not recorded"} />
          <Row k="Verified products available" v={`${result.verifiedProductsAvailable} verified / ${result.unverifiedProductsAvailable} unverified`} />
          <Row k="Country" v={answers.country ?? "Not selected"} />
        </dl>
      </Card>

      {result.factors.length > 0 && (
        <Card className="space-y-2 p-4">
          <p className="text-sm font-semibold">Important treatment-changing factors</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {result.heatSetSuspected && <li className="text-foreground">The stain may be heat-set.</li>}
            {result.factors.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </Card>
      )}

      <Card className={`space-y-2 border p-4 ${RISK_TONE[result.riskAfter]}`}>
        <p className="flex items-center gap-2 text-sm font-bold">
          <ShieldAlert className="h-4 w-4" aria-hidden /> Current risk: {result.riskAfter.toUpperCase()} — {riskWord(result.riskAfter)}
        </p>
        <p className="text-sm">{result.riskExplanation}</p>
        <p className="text-xs opacity-80">Risk before this step: {result.riskBefore.toUpperCase()}. It can be raised here, never lowered.</p>
      </Card>

      <Card className={`space-y-2 p-4 ${blocked ? "border-red-200 bg-red-50" : ""}`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Readiness decision</p>
        <p className="text-lg font-bold">{result.statusLabel}</p>
        <p className="text-sm text-muted-foreground">{result.statusReason}</p>
        {result.blockers.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-800">
            {result.blockers.map((b) => <li key={b}>{b}</li>)}
          </ul>
        )}
        {result.missingAnswers.length > 0 && (
          <p className="text-sm text-muted-foreground">Still needed: {result.missingAnswers.join(", ")}.</p>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Next action</p>
        <p className="text-sm text-muted-foreground">{result.nextAction}</p>
        <div className="grid gap-2">
          {result.status === "more_information_required" && <Button onClick={onEdit}>Answer the remaining questions</Button>}
          {result.status === "ready_for_classification" && (
            <Button disabled title="Technical classification arrives in Step 5">Ready for Technical Classification (Step 5)</Button>
          )}
          {result.status !== "more_information_required" && <Button variant="outline" onClick={onEdit}>Review or change an answer</Button>}
          <Link to="/stain-master"><Button variant="ghost" className="w-full">Back to Stain Master</Button></Link>
        </div>
        <p className="text-xs text-muted-foreground">
          No product, chemical or procedure is recommended at this stage. Treatment routes are built in later steps.
        </p>
      </Card>
    </div>
  );
}
