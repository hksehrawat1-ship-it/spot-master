import { useMemo, useState } from "react";
import { ArrowLeft, ClipboardList, Printer, Star, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import LayerKitBar from "@/components/retail/LayerKitBar";
import ProDecisionCardView from "@/components/professional/ProDecisionCardView";
import {
  BURN_TEST_NOTE, MASTER_ONLY_MESSAGE, OFFLINE_SAFETY_SUMMARY, PREVIOUS_CHEMICAL_QUESTIONS,
  PRO_GARMENT_QUESTIONS, PRO_SCREENS, PRO_STAIN_QUESTIONS, PRO_WORKFLOW, UNKNOWN_FABRIC_TESTS,
} from "@/data/professionalSpotting";
import { STAINS } from "@/data/stains";
import { useVerifiedBasicMethods } from "@/hooks/useSpottingKits";
import { useProductTransitions, useVerifiedProducts } from "@/hooks/useProfessionalProducts";
import { buildDecisionCard, buildProfessionalEscalation, type ProfessionalCase } from "@/lib/professionalEngine";
import { useProfessional } from "@/store/useProfessional";
import { useRetail } from "@/store/useRetail";
import type { ComponentKey } from "@/data/taxonomy";

type Screen = 0 | 1 | 2 | 3 | 4 | 5;

function Choices({
  label, options, value, onSelect,
}: { label: string; options: readonly string[]; value?: string; onSelect: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === o}
            onClick={() => onSelect(o)}
            className={`min-h-[40px] rounded-full border px-3 text-sm ${
              value === o ? "border-primary bg-primary/10 font-semibold" : "border-border bg-card"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function ProfessionalSpotting() {
  const { kit } = useRetail();
  const {
    current, patch, patchGarment, patchStain, patchFabricTest, patchPreviousChemical,
    reset, cases, saveCase, productUse, recordProductUse, favouriteKit, setFavouriteKit,
  } = useProfessional();
  const [screen, setScreen] = useState<Screen>(0);
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState("");
  const [showOffline, setShowOffline] = useState(false);

  const products = useVerifiedProducts(kit.kind === "company" ? kit.companyId : null);
  const transitions = useProductTransitions();
  const basics = useVerifiedBasicMethods(current.stainName);

  const proCase: ProfessionalCase = { ...current, kit };

  const card = useMemo(
    () =>
      buildDecisionCard(proCase, {
        products: products.data ?? [],
        transitions: transitions.data ?? [],
        basicMethods: basics.data ?? [],
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(proCase), products.data, transitions.data, basics.data],
  );

  const matches = query.trim()
    ? STAINS.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  const go = (s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="space-y-4 px-4 pb-32 pt-4">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold leading-tight">Professional Spotting</h1>
            <p className="text-sm text-muted-foreground">
              Show me the verified process and help me control every stage.
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Set current kit as favourite"
            onClick={() => {
              setFavouriteKit(kit);
              toast("Favourite kit saved on this device.");
            }}
          >
            <Star className={`h-4 w-4 ${favouriteKit?.kind === kit.kind ? "fill-current" : ""}`} aria-hidden />
          </Button>
        </div>
        <LayerKitBar />
      </header>

      <nav aria-label="Progress" className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Step {screen + 1} of 6 — {PRO_SCREENS[screen].label}
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${((screen + 1) / 6) * 100}%` }} />
        </div>
      </nav>

      {/* Garment assessment */}
      {screen === 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Garment assessment</h2>
          <p className="text-xs text-muted-foreground">Select Unknown rather than guessing. Unknown never stops the case on its own.</p>
          {PRO_GARMENT_QUESTIONS.map((q) => (
            <Choices
              key={q.key}
              label={q.label}
              options={q.options}
              value={current.garment[q.key]}
              onSelect={(v) => {
                patchGarment(q.key, v);
                if (q.key === "fibre") patch({ fabricKnown: v !== "Unknown", fabric: v });
                if (q.key === "careInstruction") patch({ careLabel: v === "No label" ? "no_label" : v === "Unknown" ? "unreadable" : "available" });
                if (q.key === "colourfastness") {
                  patch({ testResult: v === "Passed" ? "Passed" : v === "Failed" ? "Failed" : current.testResult });
                  if (v === "Failed") patch({ colourfastnessFailures: current.colourfastnessFailures + 1 });
                }
                if (q.key === "existingDamage") patch({ visibleDamage: v === "None" ? "No" : v === "Unknown" ? "Not sure" : "Yes" });
                if (q.key === "trims") patch({ specialConstruction: v === "None" ? "No" : v === "Unknown" ? "Not sure" : "Yes" });
              }}
            />
          ))}
          <Choices
            label="High-value or heritage garment?"
            options={["No", "Yes"]}
            value={current.highValueGarment ? "Yes" : "No"}
            onSelect={(v) => patch({ highValueGarment: v === "Yes" })}
          />

          {(!current.fabricKnown || current.garment.fibre === "Unknown") && (
            <Card className="space-y-4 p-4">
              <div>
                <p className="text-sm font-bold">Unknown-fabric test panel</p>
                <p className="text-xs text-muted-foreground">{BURN_TEST_NOTE}</p>
              </div>
              {UNKNOWN_FABRIC_TESTS.map((t) => (
                <Choices key={t.key} label={t.label} options={t.options} value={current.fabricTests[t.key]} onSelect={(v) => patchFabricTest(t.key, v)} />
              ))}
            </Card>
          )}
        </section>
      )}

      {/* Stain assessment */}
      {screen === 1 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Stain assessment</h2>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search stains"
            placeholder="Search likely stain"
            className="h-12 rounded-xl"
          />
          {matches.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                patch({ stainName: s.name, stainCategory: s.category, stainKnown: true });
                setQuery("");
              }}
              className="min-h-[48px] w-full rounded-xl border border-border bg-card p-3 text-left text-sm font-semibold"
            >
              {s.name}
              <span className="block text-xs font-normal text-muted-foreground">{s.category}</span>
            </button>
          ))}
          <Card className="p-3 text-sm">
            Selected stain: <span className="font-semibold">{current.stainName ?? "Unknown"}</span>
            <Button variant="link" size="sm" onClick={() => patch({ stainName: "Unknown", stainKnown: false })}>
              Set to Unknown
            </Button>
          </Card>
          {PRO_STAIN_QUESTIONS.map((q) => (
            <Choices key={q.key} label={q.label} options={q.options} value={current.stain[q.key]} onSelect={(v) => patchStain(q.key, v)} />
          ))}
          <Choices
            label="Are you uncertain about this case?"
            options={["No", "Yes"]}
            value={current.operatorUncertain ? "Yes" : "No"}
            onSelect={(v) => patch({ operatorUncertain: v === "Yes" })}
          />
          <div>
            <label htmlFor="pro-notes" className="text-sm font-medium">Notes</label>
            <Textarea id="pro-notes" rows={3} value={current.notes} onChange={(e) => patch({ notes: e.target.value })} />
          </div>
        </section>
      )}

      {/* Previous chemicals */}
      {screen === 2 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Previous chemical applications</h2>
          <p className="text-xs text-muted-foreground">
            Incompatible or unverified transitions are blocked before any product is suggested.
          </p>
          {PREVIOUS_CHEMICAL_QUESTIONS.map((q) => (
            <Choices
              key={q.key}
              label={q.label}
              options={q.options}
              value={current.previousChemical[q.key]}
              onSelect={(v) => {
                patchPreviousChemical(q.key, v);
                if (q.key === "product") {
                  patch({
                    previouslyTreated:
                      v === "None" ? "No" : v === "Unknown product" ? "Yes — product unknown" : "Yes — product known",
                  });
                }
                if (q.key === "heat") patch({ heatExposed: v === "Yes" ? "Yes" : v === "No" ? "No" : "Not sure" });
              }}
            />
          ))}
          <div>
            <label htmlFor="prev-key" className="text-sm font-medium">Previous product reference (if known)</label>
            <Input
              id="prev-key"
              value={current.previousProductKey ?? ""}
              onChange={(e) => patch({ previousProductKey: e.target.value })}
              placeholder="Product code from the kit"
            />
          </div>
        </section>
      )}

      {/* Component plan */}
      {screen === 3 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Component plan</h2>
          <Card className="p-4 text-sm">
            <p className="font-semibold">{card.componentPlan.label}</p>
            <p className="text-muted-foreground">{card.componentPlan.message}</p>
          </Card>
          {card.componentPlan.entries.map((e) => (
            <button
              key={e.order}
              onClick={() => patch({ activeComponent: e.component as ComponentKey })}
              aria-pressed={current.activeComponent === e.component}
              className={`w-full rounded-xl border p-3 text-left ${
                current.activeComponent === e.component ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <p className="text-sm font-semibold">Component {e.order}: {e.componentLabel}</p>
              <p className="text-xs text-muted-foreground">Stage {e.stageNumber} — {e.stageLabel} · {e.role}</p>
            </button>
          ))}
          {card.componentPlan.entries.length > 0 && (
            <p className="text-xs text-muted-foreground">Final stage: {card.componentPlan.finalStage}</p>
          )}

          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operator workflow</p>
            <ol className="mt-2 space-y-1 text-sm">
              {PRO_WORKFLOW.map((w, i) => <li key={w.key}>{i + 1}. {w.label}</li>)}
            </ol>
          </Card>

          <Button
            variant="outline"
            className="min-h-[44px] w-full"
            onClick={() => toast(MASTER_ONLY_MESSAGE)}
          >
            Custom chemistry / pH controls (Master Spotter only)
          </Button>
        </section>
      )}

      {/* Decision card */}
      {screen === 4 && (
        <section className="space-y-4">
          <h2 className="sr-only">Decision card</h2>
          <ProDecisionCardView card={card} />
          {card.product && (
            <Button
              variant="outline"
              className="min-h-[44px] w-full"
              onClick={() => {
                recordProductUse({ product: card.product!.productName, component: card.activeComponent?.label });
                toast("Product use recorded.");
              }}
            >
              Record product use
            </Button>
          )}
        </section>
      )}

      {/* Outcome / job card / escalation */}
      {screen === 5 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Outcome, job card and escalation</h2>
          <Card className="space-y-3 p-4">
            <Choices
              label="Outcome"
              options={["Removed", "Reduced", "No change", "Rework required", "Adverse event"]}
              value={current.stain.outcome}
              onSelect={(v) => patchStain("outcome", v)}
            />
            <label htmlFor="supervisor" className="text-sm font-medium">Supervisor notes</label>
            <Textarea id="supervisor" rows={3} value={current.supervisorNotes} onChange={(e) => patch({ supervisorNotes: e.target.value })} />
            <label htmlFor="esc-reason" className="text-sm font-medium">Escalation reason</label>
            <Input id="esc-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button
                className="min-h-[44px] flex-1"
                onClick={() => {
                  saveCase({
                    reference: current.stainName ?? "Unknown stain",
                    status: card.status,
                    productUsed: card.product?.productName ?? null,
                    outcome: current.stain.outcome,
                    rework: current.stain.outcome === "Rework required",
                    adverseEvent: current.stain.outcome === "Adverse event" ? current.notes : undefined,
                  });
                  toast("Case saved to this device.");
                }}
              >
                <ClipboardList className="h-4 w-4" aria-hidden /> Save case
              </Button>
              <Button variant="outline" className="min-h-[44px]" onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden /> Job card
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Master Spotter escalation package
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              The complete case history transfers without re-entry.
            </p>
            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs">
              {JSON.stringify(buildProfessionalEscalation(proCase, card, reason), null, 2)}
            </pre>
          </Card>

          {cases.length > 0 && (
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saved cases</p>
              <ul className="mt-2 space-y-1 text-sm">
                {cases.slice(0, 8).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <span>{c.reference}</span>
                    <Badge variant="outline">{c.outcome ?? c.status}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {productUse.length > 0 && (
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product-use history</p>
              <ul className="mt-2 space-y-1 text-sm">
                {productUse.slice(0, 8).map((p) => (
                  <li key={p.at}>{p.product}{p.component ? ` — ${p.component}` : ""}</li>
                ))}
              </ul>
            </Card>
          )}

          <Button variant="outline" className="min-h-[44px] w-full" onClick={() => { reset(); go(0); }}>
            Start a new case
          </Button>
        </section>
      )}

      {/* Offline safety summary */}
      <Card className="p-4">
        <button
          className="flex w-full items-center gap-2 text-left text-sm font-semibold"
          onClick={() => setShowOffline((v) => !v)}
          aria-expanded={showOffline}
        >
          <WifiOff className="h-4 w-4" aria-hidden /> Offline safety summary
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {OFFLINE_SAFETY_SUMMARY.version} · {OFFLINE_SAFETY_SUMMARY.reviewDate}
          </span>
        </button>
        {showOffline && (
          <ul className="mt-2 space-y-1 text-sm">
            {OFFLINE_SAFETY_SUMMARY.points.map((p) => <li key={p}>• {p}</li>)}
          </ul>
        )}
      </Card>

      {screen < 5 && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-border bg-background/95 p-3 backdrop-blur">
          <div className="flex gap-2">
            {screen > 0 && (
              <Button variant="outline" className="min-h-[48px]" onClick={() => go((screen - 1) as Screen)}>
                <ArrowLeft className="h-4 w-4" aria-hidden /> Back
              </Button>
            )}
            <Button className="min-h-[48px] flex-1" onClick={() => go((screen + 1) as Screen)}>
              {screen === 3 ? "See decision card" : "Continue"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
