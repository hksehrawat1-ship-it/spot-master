/** STEP 12 §23, §34 — Domestic result screen and household-material selection. */

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShieldCheck, ShieldAlert, FlaskConical, Hand, Thermometer, Info, ClipboardList, AlertTriangle,
} from "lucide-react";
import {
  HOUSEHOLD_PRODUCTS, MATERIAL_CLASSES, MATERIAL_CLASS_LABEL, MATERIAL_CLASS_NOTE,
  UNVERIFIED_FOOD_CANDIDATES, UNVERIFIED_FOOD_LABEL, PROHIBITED_DOMESTIC_PRACTICES,
} from "@/data/householdProducts";
import { EXPECTED_OUTCOME_LABEL, STOP_MESSAGE } from "@/data/domesticTreatments";
import { emptyDomesticCase, foodIngredientWarning, type DomesticCase } from "@/lib/domesticEngine";
import { useDomestic } from "@/store/useDomestic";

const FABRICS = ["cotton", "linen", "polyester", "wool", "silk", "viscose", "leather", "suede", "coated", "unknown_material"] as const;
const COLOURS = ["white", "light", "dark", "bright", "multicoloured", "printed", "unknown_stability"] as const;
const STAINS = [
  { key: "water_soluble_residue", label: "Fresh water-soluble residue" },
  { key: "beverage_tea_coffee_fresh", label: "Fresh tea or coffee" },
  { key: "cooking_oil_fresh", label: "Fresh cooking oil" },
  { key: "particulate_mud", label: "Dried mud or particulate soil" },
  { key: "dye_transfer", label: "Dye transfer" },
];

export default function DomesticTreatmentPage() {
  const { evaluate } = useDomestic();
  const [c, setC] = useState<DomesticCase>(() =>
    emptyDomesticCase({
      caseId: "SM-CASE-DEMO",
      stainKey: "beverage_tea_coffee_fresh",
      stainConfidence: 10,
      stainSourceKnown: true,
      stainAge: "fresh",
      fabric: "cotton",
      fabricConfidence: "high",
      colour: "white",
      colourStability: "passed",
      careLabelStatus: "available",
      careLabelPermissions: ["wash"],
      safeBoundaryEstablished: true,
      hiddenTestAreaAvailable: true,
      hiddenTestResult: "passed",
      riskLevel: "green",
      availableMaterials: ["cool_water_in", "white_cotton_cloth", "generic_liquid_detergent_in"],
    }),
  );
  const [step, setStep] = useState(0);

  const result = useMemo(() => evaluate(c, undefined, { persist: false }), [c, evaluate]);
  const foodWarning = foodIngredientWarning(c.availableMaterials);
  const set = (patch: Partial<DomesticCase>) => { setC((p) => ({ ...p, ...patch })); setStep(0); };
  const toggleMaterial = (key: string) =>
    set({
      availableMaterials: c.availableMaterials.includes(key)
        ? c.availableMaterials.filter((m) => m !== key)
        : [...c.availableMaterials, key],
    });

  const t = result.treatment;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 p-4 pb-28">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Domestic treatment</h1>
        <p className="text-sm text-muted-foreground">
          Household guidance is offered only from an approved, published method with at least 9/10 confidence.
        </p>
      </header>

      {/* Case controls */}
      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold">Your case</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled label="Stain">
            <Select value={c.stainKey} onValueChange={(v) => set({ stainKey: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STAINS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </Labeled>
          <Labeled label={`Stain identification confidence: ${c.stainConfidence}/10`}>
            <input type="range" min={0} max={10} value={c.stainConfidence} className="w-full"
              onChange={(e) => set({ stainConfidence: Number(e.target.value) })} />
          </Labeled>
          <Labeled label="Fabric">
            <Select value={c.fabric} onValueChange={(v) => set({ fabric: v as DomesticCase["fabric"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FABRICS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </Labeled>
          <Labeled label="Colour">
            <Select value={c.colour} onValueChange={(v) => set({ colour: v as DomesticCase["colour"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COLOURS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </Labeled>
          <Labeled label="Hidden-area test result">
            <Select value={c.hiddenTestResult} onValueChange={(v) => set({ hiddenTestResult: v as DomesticCase["hiddenTestResult"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["not_done", "passed", "failed", "inconclusive"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </Labeled>
          <Labeled label="Country">
            <Select value={c.country} onValueChange={(v) => set({ country: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="IN">India</SelectItem><SelectItem value="GB">United Kingdom</SelectItem></SelectContent>
            </Select>
          </Labeled>
        </div>
      </Card>

      {/* §34 household material selection */}
      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold">What materials do you have?</h2>
        <p className="text-xs text-muted-foreground">{MATERIAL_CLASS_NOTE}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {MATERIAL_CLASSES.map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm">
              <Checkbox checked={c.availableMaterials.includes(m)} onCheckedChange={() => toggleMaterial(m)} />
              {MATERIAL_CLASS_LABEL[m]}
            </label>
          ))}
        </div>
        <Separator />
        <p className="text-xs font-medium">Exact household products available to you</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {HOUSEHOLD_PRODUCTS.filter((p) => p.country === c.country).map((p) => (
            <label key={p.key} className="flex items-start gap-2 text-sm">
              <Checkbox checked={c.availableMaterials.includes(p.key)} onCheckedChange={() => toggleMaterial(p.key)} />
              <span>
                {p.productName}
                <span className="block text-xs text-muted-foreground">{p.productId} · {p.verification}</span>
              </span>
            </label>
          ))}
        </div>
        <Separator />
        <p className="text-xs font-medium">Other things in the house</p>
        <div className="flex flex-wrap gap-2">
          {UNVERIFIED_FOOD_CANDIDATES.map((f) => (
            <button key={f} onClick={() => toggleMaterial(f)}
              className={`rounded-full border px-3 py-1 text-xs ${c.availableMaterials.includes(f) ? "border-amber-500 bg-amber-500/10 text-amber-700" : "border-border"}`}>
              {UNVERIFIED_FOOD_LABEL[f]}
            </button>
          ))}
        </div>
        {foodWarning && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800">
            <p className="font-semibold">{foodWarning.flagged.join(", ")} cannot be used in a published method.</p>
            <p className="mt-1">{foodWarning.message}</p>
            <p className="mt-1">No recipe is created from what you have, and no mixture is ever suggested.</p>
          </div>
        )}
      </Card>

      {/* Result */}
      {result.decision === "not_recommended" ? (
        <Card className="space-y-3 border-destructive/40 p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-bold text-destructive">{result.headline}</h2>
          </div>
          <div>
            <p className="text-sm font-medium">Why</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {result.reasons.map((r) => <li key={r.code}>{r.plain}</li>)}
            </ul>
          </div>
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium">Professional escalation</p>
            <p className="text-muted-foreground">{result.escalation}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            No household or professional chemical method is shown for this case, in any form.
          </p>
        </Card>
      ) : t ? (
        <>
          <Card className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-lg font-bold">Domestic treatment may proceed</h2>
                  <p className="text-sm text-muted-foreground">{t.treatmentName}</p>
                </div>
              </div>
              <Badge className="shrink-0">{result.confidence?.score}/10</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t.domesticTreatmentId} · version {t.version} · last reviewed {t.lastReviewedDate}
            </p>
            <div className="rounded-md bg-muted p-3 text-xs">
              <p className="font-medium">Confidence is capped by the weakest safety factor</p>
              <p className="text-muted-foreground">{result.confidence?.explanation}</p>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                {result.confidence?.breakdown.map((b) => (
                  <div key={b.key} className={`flex justify-between ${b.capping ? "font-semibold" : ""}`}>
                    <span>{b.label}</span><span>{b.value}/10</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Section icon={<Info className="h-4 w-4" />} title="Why this is suitable">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {result.whySuitable.map((w) => <li key={w}>{w}</li>)}
            </ul>
          </Section>

          <Section icon={<AlertTriangle className="h-4 w-4" />} title="Before you start">
            <ul className="list-disc space-y-1 pl-5 text-sm">{result.beforeYouStart.map((b) => <li key={b}>{b}</li>)}</ul>
          </Section>

          <Section icon={<ClipboardList className="h-4 w-4" />} title="Required materials">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {t.requiredMaterials.map((m) => (
                <li key={m.label}>
                  {m.label}
                  {m.exactProductRequired && <span className="text-xs text-muted-foreground"> — the exact product is required</span>}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">{t.productLabelRequirement}</p>
          </Section>

          {t.hiddenAreaTest.required && (
            <Section icon={<FlaskConical className="h-4 w-4" />} title="Hidden-area test">
              <dl className="grid gap-1 text-sm sm:grid-cols-2">
                <Row k="Location" v={t.hiddenAreaTest.location} />
                <Row k="Product" v={t.hiddenAreaTest.product} />
                <Row k="Quantity" v={t.hiddenAreaTest.quantity} />
                <Row k="Dilution" v={t.hiddenAreaTest.dilution} />
                <Row k="Contact time" v={t.hiddenAreaTest.contactTime} />
                <Row k="Technique" v={t.hiddenAreaTest.technique} />
                <Row k="Rinsing" v={t.hiddenAreaTest.rinsing} />
                <Row k="Inspect after" v={t.hiddenAreaTest.dryingOrInspectionTime} />
              </dl>
              <p className="mt-2 text-xs font-medium">Pass only if</p>
              <ul className="list-disc pl-5 text-xs text-muted-foreground">{t.hiddenAreaTest.passConditions.map((p) => <li key={p}>{p}</li>)}</ul>
              <p className="mt-2 text-xs font-medium">Stop if you see any of</p>
              <ul className="list-disc pl-5 text-xs text-muted-foreground">{t.hiddenAreaTest.failConditions.map((p) => <li key={p}>{p}</li>)}</ul>
              <p className="mt-2 text-xs text-muted-foreground">Source: {t.hiddenAreaTest.source}</p>
            </Section>
          )}

          {/* §17 one step at a time */}
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Method — step {step + 1} of {t.methodSteps.length}</h3>
              <Badge variant="outline">Attempt {c.attemptCount + 1} of {t.maximumAttempts}</Badge>
            </div>
            {t.methodSteps[step] && (
              <div className="space-y-2 text-sm">
                <p className="text-base font-semibold">{t.methodSteps[step].action}</p>
                <dl className="grid gap-1 sm:grid-cols-2">
                  <Row k="Material" v={t.methodSteps[step].material} />
                  <Row k="Quantity or dilution" v={t.methodSteps[step].quantityOrDilution} />
                  <Row k="Contact time" v={t.methodSteps[step].contactTime} />
                  <Row k="Temperature limit" v={t.methodSteps[step].temperatureLimit} />
                  <Row k="Technique" v={t.methodSteps[step].technique} />
                  <Row k="Rinsing" v={t.methodSteps[step].rinsing} />
                </dl>
                <div className="rounded-md bg-muted p-2 text-xs">
                  <p><span className="font-medium">Inspect:</span> {t.methodSteps[step].inspectionPoint}</p>
                  <p className="mt-1 text-destructive"><span className="font-medium">Stop:</span> {t.methodSteps[step].stopCondition}</p>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
              <Button size="sm" disabled={step >= t.methodSteps.length - 1} onClick={() => setStep((s) => s + 1)}>Next step</Button>
            </div>
          </Card>

          <Section icon={<Thermometer className="h-4 w-4" />} title="Heat and drying">
            <ul className="list-disc space-y-1 pl-5 text-sm">{result.heatAndDrying.map((h) => <li key={h}>{h}</li>)}</ul>
          </Section>

          <Section icon={<Hand className="h-4 w-4" />} title="Actions to avoid">
            <ul className="list-disc space-y-1 pl-5 text-sm">{t.actionsToAvoid.map((a) => <li key={a}>{a}</li>)}</ul>
          </Section>

          <Section icon={<ShieldAlert className="h-4 w-4 text-destructive" />} title="Stop conditions">
            <ul className="list-disc space-y-1 pl-5 text-sm">{result.stopConditions.map((s) => <li key={s}>{s}</li>)}</ul>
            <p className="mt-2 rounded-md bg-destructive/10 p-2 text-sm font-medium text-destructive">{STOP_MESSAGE}</p>
          </Section>

          <Section icon={<Info className="h-4 w-4" />} title="Expected outcome">
            <p className="text-sm font-medium">{EXPECTED_OUTCOME_LABEL[t.expectedOutcome]}</p>
            <p className="text-sm text-muted-foreground">{t.expectedOutcomeNote}</p>
            <p className="mt-2 text-sm"><span className="font-medium">Maximum attempts:</span> {t.maximumAttempts} · attempts remaining {result.attemptsRemaining}</p>
            <p className="mt-1 text-sm"><span className="font-medium">Escalation:</span> {t.escalationPoint}</p>
          </Section>

          <Section icon={<ClipboardList className="h-4 w-4" />} title="Sources and review">
            <ul className="space-y-1 text-xs text-muted-foreground">
              {result.sources.map((s) => <li key={s.claim}>{s.source} — {s.claim} ({s.type}{s.reviewer ? `, reviewed by ${s.reviewer}` : ""})</li>)}
            </ul>
            <p className="mt-2 text-xs">Last reviewed {result.lastReviewedDate} · next review {t.nextReviewDate}</p>
          </Section>
        </>
      ) : null}

      <Card className="space-y-2 p-4">
        <h3 className="text-sm font-semibold">Never do these at home</h3>
        <ul className="grid list-disc gap-1 pl-5 text-xs text-muted-foreground sm:grid-cols-2">
          {PROHIBITED_DOMESTIC_PRACTICES.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </Card>
    </main>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">{label}</p>{children}</div>;
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="space-y-2 p-4">
      <div className="flex items-center gap-2"><span>{icon}</span><h3 className="text-sm font-semibold">{title}</h3></div>
      {children}
    </Card>
  );
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/50 py-1 text-sm">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right">{v ?? "Not applicable"}</dd>
    </div>
  );
}
