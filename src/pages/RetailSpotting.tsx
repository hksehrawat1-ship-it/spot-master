import { useMemo, useState } from "react";
import { ArrowLeft, ClipboardList, Search } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LayerKitBar from "@/components/retail/LayerKitBar";
import RetailResultCard from "@/components/retail/RetailResultCard";
import {
  COLOUR_OPTIONS, COMMON_FABRICS, CONCEALED_TEST_LOCATIONS, FABRIC_KNOWLEDGE_OPTIONS,
  GARMENT_QUESTIONS, OBSERVATION_QUESTIONS, RETAIL_STEPS, SMELL_WARNING, STAIN_SHORTCUTS, TEST_RESULTS,
} from "@/data/retailSpotting";
import { STAINS } from "@/data/stains";
import { useCompanyProducts, useVerifiedBasicMethods } from "@/hooks/useSpottingKits";
import { buildEscalationSummary, concealedTestRequired, evaluateRetailCase, type RetailCase } from "@/lib/retailEngine";
import { useRetail } from "@/store/useRetail";

type StepIndex = 0 | 1 | 2 | 3 | 4;

export default function RetailSpotting() {
  const { current, patchCase, kit, resetCase, track } = useRetail();
  const [step, setStep] = useState<StepIndex>(0);
  const [query, setQuery] = useState("");
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");

  const products = useCompanyProducts(kit.kind === "company" ? kit.companyId : null);
  const basics = useVerifiedBasicMethods(current.stainName);

  const caseWithKit: RetailCase = { ...current, kit };

  const kitInstruction = useMemo(() => {
    if (kit.kind !== "company") return null;
    const chosen = (products.data ?? []).filter((p) => kit.productIds.includes(p.id));
    return chosen.find((p) => p.record.classification === "production" && p.record.data.steps.length)?.record ?? null;
  }, [kit, products.data]);

  const result = useMemo(
    () => evaluateRetailCase(caseWithKit, { kitInstruction, basicMethods: basics.data ?? [] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(caseWithKit), kitInstruction, basics.data],
  );

  const matches = query.trim()
    ? STAINS.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  const selectStain = (name: string, category?: string) => {
    patchCase({ stainName: name, stainCategory: category, stainKnown: name !== "Unknown mark" });
    track(["stain_selected"]);
    setStep(1);
  };

  const go = (next: StepIndex) => {
    setStep(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="space-y-4 px-4 pb-32 pt-4">
      <header className="space-y-3">
        <div>
          <h1 className="text-xl font-bold leading-tight">Retail Spotting</h1>
          <p className="text-sm text-muted-foreground">
            Simple, safety-first spotting guidance for retail dry cleaning and wet cleaning.
          </p>
        </div>
        <LayerKitBar />
      </header>

      {/* Progress */}
      <nav aria-label="Progress" className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Step {step + 1} of 5 — {RETAIL_STEPS[step].label}
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / 5) * 100}%` }} />
        </div>
      </nav>

      {/* STEP 1 — stain */}
      {step === 0 && (
        <section className="space-y-4" aria-labelledby="step-stain">
          <h2 id="step-stain" className="text-lg font-bold">What caused the stain?</h2>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search stains"
              placeholder="Search stains"
              className="h-12 rounded-xl pl-10"
            />
          </div>

          {matches.length > 0 && (
            <div className="space-y-2">
              {matches.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectStain(s.name, s.category)}
                  className="min-h-[52px] w-full rounded-xl border border-border bg-card p-3 text-left text-sm font-semibold"
                >
                  {s.name}
                  <span className="block text-xs font-normal text-muted-foreground">{s.category}</span>
                </button>
              ))}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Common stains</p>
            <div className="grid grid-cols-2 gap-2">
              {STAIN_SHORTCUTS.map((s) => (
                <button
                  key={s}
                  onClick={() => selectStain(s)}
                  className="min-h-[48px] rounded-xl border border-border bg-card px-3 text-sm font-semibold"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            className="min-h-[48px] w-full"
            onClick={() => {
              patchCase({ stainKnown: false, stainName: "Unknown mark", stainCategory: undefined });
              go(1);
            }}
          >
            I'm not sure
          </Button>

          {!current.stainKnown && (
            <Card className="space-y-4 p-4">
              <p className="text-sm font-semibold">Tell us what you can see</p>
              <p className="rounded-lg bg-amber-500/10 p-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                {SMELL_WARNING}
              </p>
              {OBSERVATION_QUESTIONS.map((q) => (
                <fieldset key={q.key}>
                  <legend className="mb-1.5 text-sm font-medium">{q.label}</legend>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((o) => {
                      const active = current.observations?.[q.key] === o;
                      return (
                        <button
                          key={o}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            patchCase({ observations: { ...(current.observations ?? {}), [q.key]: o } })
                          }
                          className={`min-h-[44px] rounded-full border px-3 text-sm ${
                            active ? "border-primary bg-primary/10 font-semibold" : "border-border bg-card"
                          }`}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </Card>
          )}
        </section>
      )}

      {/* STEP 2 — garment */}
      {step === 1 && (
        <section className="space-y-4" aria-labelledby="step-garment">
          <h2 id="step-garment" className="text-lg font-bold">Garment information</h2>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Do you know the fabric?</legend>
            <div className="flex flex-wrap gap-2">
              {FABRIC_KNOWLEDGE_OPTIONS.map((o) => {
                const active =
                  (o === "Yes" && current.fabricKnown) ||
                  (o === "Not sure" && !current.fabricKnown && current.careLabel !== "no_label") ||
                  (o === "No care label" && current.careLabel === "no_label");
                return (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      patchCase({
                        fabricKnown: o === "Yes",
                        careLabel: o === "No care label" ? "no_label" : current.careLabel,
                      })
                    }
                    className={`min-h-[44px] rounded-full border px-3 text-sm ${
                      active ? "border-primary bg-primary/10 font-semibold" : "border-border bg-card"
                    }`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Unknown fabric is fine — the guidance simply becomes more cautious.
            </p>
          </fieldset>

          {current.fabricKnown && (
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium">Fabric</legend>
              <div className="flex flex-wrap gap-2">
                {COMMON_FABRICS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={current.fabric === f}
                    onClick={() => patchCase({ fabric: f })}
                    className={`min-h-[44px] rounded-full border px-3 text-sm ${
                      current.fabric === f ? "border-primary bg-primary/10 font-semibold" : "border-border bg-card"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Garment colour</legend>
            <div className="flex flex-wrap gap-2">
              {COLOUR_OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={current.colour === o}
                  onClick={() => patchCase({ colour: o })}
                  className={`min-h-[44px] rounded-full border px-3 text-sm ${
                    current.colour === o ? "border-primary bg-primary/10 font-semibold" : "border-border bg-card"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </fieldset>

          {GARMENT_QUESTIONS.map((q) => (
            <fieldset key={q.key}>
              <legend className="mb-1.5 text-sm font-medium">{q.label}</legend>
              <div className="flex flex-wrap gap-2">
                {q.options.map((o) => {
                  const value = garmentValue(current, q.key);
                  return (
                    <button
                      key={o}
                      type="button"
                      aria-pressed={value === o}
                      onClick={() => patchCase(garmentPatch(q.key, o))}
                      className={`min-h-[44px] rounded-full border px-3 text-sm ${
                        value === o ? "border-primary bg-primary/10 font-semibold" : "border-border bg-card"
                      }`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </section>
      )}

      {/* STEP 3 — safety + test */}
      {step === 2 && (
        <section className="space-y-4" aria-labelledby="step-safety">
          <h2 id="step-safety" className="text-lg font-bold">Safety and concealed-area test</h2>
          <Card className="p-4 text-sm">
            {concealedTestRequired(caseWithKit)
              ? "A concealed-area test is required before any treatment on this garment."
              : "No concealed-area test is required for this case, but inspect the garment before you start."}
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Test only here</p>
            <ul className="mt-1 text-sm">
              {CONCEALED_TEST_LOCATIONS.map((l) => (
                <li key={l}>• {l}</li>
              ))}
            </ul>
          </Card>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Record the test result</legend>
            <div className="flex flex-wrap gap-2">
              {["Not tested", ...TEST_RESULTS].map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={current.testResult === o}
                  onClick={() => patchCase({ testResult: o as RetailCase["testResult"] })}
                  className={`min-h-[44px] rounded-full border px-3 text-sm ${
                    current.testResult === o ? "border-primary bg-primary/10 font-semibold" : "border-border bg-card"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </fieldset>
        </section>
      )}

      {/* STEP 4 — guidance */}
      {step === 3 && (
        <section className="space-y-4" aria-labelledby="step-guidance">
          <h2 id="step-guidance" className="sr-only">Guidance</h2>
          <RetailResultCard
            result={result}
            onChangeKit={() => go(2)}
            onDecision={(key) => {
              track([`decision_${key}`]);
              if (key === "reduced") toast("Continue as instructed and inspect after every step.");
              else go(4);
            }}
            onEscalate={() => {
              setEscalationOpen(true);
              go(4);
            }}
          />
        </section>
      )}

      {/* STEP 5 — outcome / escalation */}
      {step === 4 && (
        <section className="space-y-4" aria-labelledby="step-outcome">
          <h2 id="step-outcome" className="text-lg font-bold">Record the outcome</h2>
          <Card className="space-y-3 p-4">
            <label htmlFor="reason" className="text-sm font-medium">
              Reason for escalation or outcome note
            </label>
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Short reason" />
            <label htmlFor="notes" className="text-sm font-medium">Operator notes</label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
            <Button
              className="min-h-[48px] w-full"
              onClick={() => {
                const summary = buildEscalationSummary(caseWithKit, result, reason, notes);
                track(["case_escalated", "treatment_outcome"]);
                setEscalationOpen(true);
                navigator.clipboard?.writeText(JSON.stringify(summary, null, 2)).catch(() => undefined);
                toast("Case summary prepared. Nothing you entered has been lost.");
              }}
            >
              <ClipboardList className="h-4 w-4" aria-hidden /> Build case summary
            </Button>
          </Card>

          {escalationOpen && (
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Case summary</p>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs">
                {JSON.stringify(buildEscalationSummary(caseWithKit, result, reason, notes), null, 2)}
              </pre>
            </Card>
          )}

          <Button
            variant="outline"
            className="min-h-[48px] w-full"
            onClick={() => {
              resetCase();
              setReason("");
              setNotes("");
              setEscalationOpen(false);
              go(0);
            }}
          >
            Start a new case
          </Button>
        </section>
      )}

      {/* Sticky primary action */}
      {step < 4 && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-border bg-background/95 p-3 backdrop-blur">
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" className="min-h-[48px]" onClick={() => go((step - 1) as StepIndex)}>
                <ArrowLeft className="h-4 w-4" aria-hidden /> Back
              </Button>
            )}
            <Button
              className="min-h-[48px] flex-1"
              disabled={step === 0 && !current.stainName}
              onClick={() => go((step + 1) as StepIndex)}
            >
              {step === 2 ? "See guidance" : "Continue"}
            </Button>
          </div>
          {step === 0 && !current.stainName && (
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Choose a stain or "I'm not sure" so the safety checks can run.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function garmentValue(c: RetailCase, key: string): string {
  switch (key) {
    case "careLabel":
      return c.careLabel === "available" ? "Yes" : c.careLabel === "no_label" ? "No label" : "Unreadable";
    case "stainAge":
      return c.stainAge;
    case "heat":
      return c.heatExposed;
    case "treated":
      return c.previouslyTreated;
    case "damage":
      return c.visibleDamage;
    case "bleeding":
      return c.activeColourBleeding;
    case "construction":
      return c.specialConstruction;
    default:
      return "";
  }
}

function garmentPatch(key: string, value: string): Partial<RetailCase> {
  switch (key) {
    case "careLabel":
      return { careLabel: value === "Yes" ? "available" : value === "No label" ? "no_label" : "unreadable" };
    case "stainAge":
      return { stainAge: value as RetailCase["stainAge"] };
    case "heat":
      return { heatExposed: value as RetailCase["heatExposed"] };
    case "treated":
      return { previouslyTreated: value as RetailCase["previouslyTreated"] };
    case "damage":
      return { visibleDamage: value as RetailCase["visibleDamage"] };
    case "bleeding":
      return { activeColourBleeding: value as RetailCase["activeColourBleeding"] };
    case "construction":
      return { specialConstruction: value as RetailCase["specialConstruction"] };
    default:
      return {};
  }
}
