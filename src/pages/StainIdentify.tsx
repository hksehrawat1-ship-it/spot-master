import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Sparkles, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Fabric = "Cotton" | "Polyester" | "Wool" | "Silk" | "Denim" | "Mixed";
type Color = "White" | "Light" | "Dark" | "Bright";
type Nature = "Oily" | "Colored" | "Body" | "Solid" | "Transfer";
type Condition = "Fresh" | "Old" | "Washed" | "Heat";

const FABRICS: { id: Fabric; emoji: string; label: string }[] = [
  { id: "Cotton", emoji: "🧵", label: "Cotton" },
  { id: "Polyester", emoji: "🧶", label: "Polyester" },
  { id: "Wool", emoji: "🐑", label: "Wool" },
  { id: "Silk", emoji: "🎀", label: "Silk" },
  { id: "Denim", emoji: "👖", label: "Denim" },
  { id: "Mixed", emoji: "🧺", label: "Mixed" },
];

const COLORS: { id: Color; swatch: string; label: string }[] = [
  { id: "White", swatch: "bg-white border-2 border-border", label: "White" },
  { id: "Light", swatch: "bg-[hsl(45_50%_85%)]", label: "Light" },
  { id: "Dark", swatch: "bg-[hsl(220_25%_20%)]", label: "Dark" },
  { id: "Bright", swatch: "bg-gradient-to-br from-[hsl(0_85%_55%)] via-[hsl(45_95%_55%)] to-[hsl(200_85%_55%)]", label: "Bright" },
];

const NATURES: { id: Nature; emoji: string; label: string }[] = [
  { id: "Oily", emoji: "🛢️", label: "Oily / Greasy" },
  { id: "Colored", emoji: "🎨", label: "Colored" },
  { id: "Body", emoji: "🩸", label: "From body (blood/sweat)" },
  { id: "Solid", emoji: "🪨", label: "Solid (mud/dust)" },
  { id: "Transfer", emoji: "👕", label: "From another cloth" },
];

const CONDITIONS: { id: Condition; emoji: string; label: string }[] = [
  { id: "Fresh", emoji: "💧", label: "Fresh" },
  { id: "Old", emoji: "⏳", label: "Old" },
  { id: "Washed", emoji: "🫧", label: "Washed already" },
  { id: "Heat", emoji: "🔥", label: "Ironed / heat exposed" },
];

function predict(natures: Nature[]): { title: string; treatment: string } {
  const has = (n: Nature) => natures.includes(n);
  if (has("Oily") && has("Colored"))
    return {
      title: "Combination (Oil + Dye – e.g. Curry)",
      treatment:
        "Pre-treat with dish soap to break the oil, then apply a colour-safe oxygen bleach paste. Soak 30 min, agitate, rinse warm.",
    };
  if (has("Oily")) return { title: "Oil / Grease stain", treatment: "Apply dish soap or degreaser, work in, soak 15 min, wash hot." };
  if (has("Body")) return { title: "Protein stain (blood / sweat)", treatment: "Rinse with COLD water, apply enzyme detergent, soak 30 min, wash cool." };
  if (has("Colored")) return { title: "Tannin / Dye stain", treatment: "Blot, apply white vinegar + detergent, soak in oxygen bleach, wash warm." };
  if (has("Solid")) return { title: "Particulate (mud / dust)", treatment: "Let dry, brush off solids, pre-soak with detergent, wash normally." };
  if (has("Transfer")) return { title: "Dye transfer", treatment: "Use a colour-run remover or oxygen bleach soak before fabric dries." };
  return { title: "General stain", treatment: "Pre-treat with detergent, soak 20 min, wash at the warmest safe temperature." };
}

export default function StainIdentify() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [fabric, setFabric] = useState<Fabric | null>(null);
  const [color, setColor] = useState<Color | null>(null);
  const [natures, setNatures] = useState<Nature[]>([]);
  const [condition, setCondition] = useState<Condition | null>(null);

  const totalSteps = 4;
  const progress = ((step + 1) / (totalSteps + 1)) * 100;

  const result = useMemo(() => predict(natures), [natures]);

  const toggleNature = (n: Nature) =>
    setNatures((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  const canNext =
    (step === 0) ||
    (step === 1 && !!color) ||
    (step === 2 && natures.length > 0) ||
    (step === 3 && !!condition);

  const back = () => (step === 0 ? navigate(-1) : setStep((s) => s - 1));
  const next = () => setStep((s) => Math.min(s + 1, totalSteps));

  return (
    <div className="space-y-5 px-4 pb-28 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={back} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Step {Math.min(step + 1, totalSteps)} of {totalSteps}
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step 0 — Fabric */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight">What's the fabric?</h1>
            <p className="text-sm text-muted-foreground">Optional — helps fine-tune the treatment.</p>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {FABRICS.map((f) => (
              <OptionCard
                key={f.id}
                emoji={f.emoji}
                label={f.label}
                selected={fabric === f.id}
                onClick={() => setFabric(fabric === f.id ? null : f.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 1 — Color */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight">Garment color</h1>
            <p className="text-sm text-muted-foreground">Pick the closest match.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setColor(c.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 bg-card p-4 transition-all",
                  color === c.id ? "border-primary shadow-elevated" : "border-border hover:border-primary/50",
                )}
              >
                <span className={cn("h-14 w-14 rounded-full shadow-soft", c.swatch)} />
                <span className="text-sm font-semibold">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Nature (multi) */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight">Stain nature</h1>
            <p className="text-sm text-muted-foreground">Tap all that apply.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {NATURES.map((n) => {
              const sel = natures.includes(n.id);
              return (
                <button
                  key={n.id}
                  onClick={() => toggleNature(n.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-all",
                    sel
                      ? "border-primary bg-primary text-primary-foreground shadow-elevated"
                      : "border-border bg-card hover:border-primary/50",
                  )}
                >
                  <span>{n.emoji}</span>
                  <span>{n.label}</span>
                  {sel && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3 — Condition */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight">Stain condition</h1>
            <p className="text-sm text-muted-foreground">How fresh is the stain?</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {CONDITIONS.map((c) => (
              <OptionCard
                key={c.id}
                emoji={c.emoji}
                label={c.label}
                selected={condition === c.id}
                onClick={() => setCondition(c.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 4 — Result */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-5 text-primary-foreground shadow-elevated">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
              <Sparkles className="h-4 w-4" /> Identified
            </div>
            <h1 className="mt-1 text-xl font-bold leading-tight">Likely Stain Type</h1>
            <p className="mt-2 text-2xl font-extrabold leading-tight">➡️ {result.title}</p>
          </div>

          <Card className="space-y-2 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-success">Treatment</p>
            <p className="text-sm">{result.treatment}</p>
          </Card>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {fabric && <Chip label={`Fabric: ${fabric}`} />}
            {color && <Chip label={`Color: ${color}`} />}
            {condition && <Chip label={`Condition: ${condition}`} />}
            {natures.length > 0 && <Chip label={`Nature: ${natures.join(", ")}`} />}
          </div>

          <Button
            size="lg"
            className="h-12 w-full rounded-xl text-base font-semibold"
            onClick={() => navigate("/stain-master")}
          >
            👉 View Treatment
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setStep(0)}>
            Start over
          </Button>
        </div>
      )}

      {/* Footer nav */}
      {step < totalSteps && (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center gap-2">
            {step === 0 && (
              <Button variant="outline" className="flex-1" onClick={next}>
                <SkipForward className="h-4 w-4" /> Skip
              </Button>
            )}
            <Button
              size="lg"
              disabled={!canNext}
              onClick={next}
              className="flex-1 rounded-xl text-base font-semibold"
            >
              {step === totalSteps - 1 ? "Identify" : "Next"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function OptionCard({
  emoji,
  label,
  selected,
  onClick,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border-2 bg-card p-4 transition-all",
        selected ? "border-primary shadow-elevated" : "border-border hover:border-primary/50",
      )}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px]">
      {label}
    </span>
  );
}
