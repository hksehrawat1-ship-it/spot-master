import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Sparkles, SkipForward, Bookmark, AlertTriangle, Beaker, Lightbulb, FlaskConical, Home as HomeIcon, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useApp, type StainEntry } from "@/store/useApp";
import { toast } from "sonner";

type Fabric = "Cotton" | "Polyester" | "Wool" | "Silk" | "Denim" | "Mixed";
type Color = "White" | "Light" | "Dark" | "Bright";
type Nature =
  | "Combination" | "Oily" | "Water" | "Dye" | "Protein" | "Particulate"
  | "Pigment" | "Transfer" | "Oxidizable" | "HeatSet" | "Reducible" | "Chemical";
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
  { id: "Bright", swatch: "bg-gradient-to-br from-[hsl(0_85%_55%)] via-[hsl(45_95%_55%)] to-[hsl(200_85%_55%)]", label: "Mix Colour" },
];

const NATURES: { id: Nature; emoji: string; label: string }[] = [
  { id: "Combination", emoji: "🧬", label: "Combination" },
  { id: "Oily", emoji: "🛢️", label: "Oil / Grease" },
  { id: "Water", emoji: "💧", label: "Water-Based" },
  { id: "Dye", emoji: "🍷", label: "Dye / Tannin" },
  { id: "Protein", emoji: "🩸", label: "Protein" },
  { id: "Particulate", emoji: "🪨", label: "Particulate" },
  { id: "Pigment", emoji: "🎨", label: "Pigment / Paint" },
  { id: "Transfer", emoji: "👕", label: "Dye Transfer" },
  { id: "Oxidizable", emoji: "🍋", label: "Oxidizable" },
  { id: "HeatSet", emoji: "🔥", label: "Heat-Set / Aged" },
  { id: "Reducible", emoji: "🔩", label: "Reducible (Metal/Rust)" },
  { id: "Chemical", emoji: "⚗️", label: "Chemical Damage" },
];

const CONDITIONS: { id: Condition; emoji: string; label: string }[] = [
  { id: "Fresh", emoji: "💧", label: "Fresh" },
  { id: "Old", emoji: "⏳", label: "Old" },
  { id: "Washed", emoji: "🫧", label: "Washed already" },
  { id: "Heat", emoji: "🔥", label: "Ironed / heat exposed" },
];

// Common stain names mapped to their underlying nature(s)
const STAIN_NAMES: { name: string; emoji: string; natures: Nature[] }[] = [
  { name: "Tea / Coffee", emoji: "☕", natures: ["Dye"] },
  { name: "Curry / Turmeric", emoji: "🍛", natures: ["Combination", "Oily", "Dye"] },
  { name: "Blood", emoji: "🩸", natures: ["Protein"] },
  { name: "Egg / Milk", emoji: "🥚", natures: ["Protein"] },
  { name: "Sweat", emoji: "💦", natures: ["Protein", "Oily"] },
  { name: "Wine / Juice", emoji: "🍷", natures: ["Dye"] },
  { name: "Ink / Pen", emoji: "🖊️", natures: ["Pigment"] },
  { name: "Paint", emoji: "🎨", natures: ["Pigment"] },
  { name: "Oil / Ghee", emoji: "🛢️", natures: ["Oily"] },
  { name: "Lipstick / Makeup", emoji: "💄", natures: ["Oily", "Pigment"] },
  { name: "Mud / Clay", emoji: "🪨", natures: ["Particulate"] },
  { name: "Grass", emoji: "🌿", natures: ["Dye", "Protein"] },
  { name: "Rust", emoji: "🔩", natures: ["Reducible"] },
  { name: "Colour Bleed", emoji: "👕", natures: ["Transfer"] },
  { name: "Yellowing / Aged", emoji: "🍋", natures: ["Oxidizable"] },
  { name: "Bleach Damage", emoji: "⚗️", natures: ["Chemical"] },
];

type Diagnosis = Omit<StainEntry, "id" | "updatedAt">;

function predict(natures: Nature[], color: Color | null, condition: Condition | null): Diagnosis {
  const has = (n: Nature) => natures.includes(n);
  const colored = color === "Dark" || color === "Bright";
  const oldStain = condition === "Old" || condition === "Heat" || condition === "Washed";

  // base difficulty + removability adjusted later
  let difficulty: Diagnosis["difficulty"] = "Easy";
  let removability = 90;

  let name = "General Stain";
  let category = "Water-Based";
  let pro: Diagnosis["pro"] = {
    chemical: "Clean Craft Universal Detergent",
    type: "Mild Alkali",
    dilution: "1:50 in warm water",
    steps: ["Pre-treat the stain", "Soak for 20 min", "Agitate gently", "Rinse and wash normally"],
    temperature: "30–40 °C",
    time: "20–30 min",
  };
  let alternative = {
    whenToUse: "If primary chemical is unavailable, or for delicate fabrics.",
    steps: ["Use mild liquid detergent", "Soak 30 min in lukewarm water", "Hand-wash gently", "Air-dry"],
  };
  let diy = {
    items: ["Dish soap", "Warm water", "Soft brush"],
    steps: ["Mix 1 tsp dish soap in 1 cup warm water", "Apply, dab gently", "Wait 10 min", "Rinse"],
  };
  let doNotDo = ["Do not rub aggressively", "Do not use hot water on unknown stains"];
  let proTips = {
    bestTime: "Treat within 30 minutes for best removal.",
    whenToSend: "If the stain remains after 2 cycles, send to a professional cleaner.",
  };
  let expert: Diagnosis["expert"] = {
    ph: "8–9 (mild alkaline)",
    why: "Surfactants lift oils and lift soil from fibers via micelle action.",
    fiberReaction: "Safe for most fibers at neutral-to-mild alkaline pH.",
    chemistry: "Anionic surfactant + builder; emulsifies and suspends soil.",
  };

  if (has("Combination") || (has("Oily") && has("Dye"))) {
    name = "Combination (Oil + Dye – e.g. Curry)"; category = "Combination";
    difficulty = "Hard"; removability = 75;
    pro = {
      chemical: "Seitz Combo-Spotter + Clean Craft Oxy Plus",
      type: "Solvent + Oxidizer",
      dilution: "Spotter neat; Oxy 1:30 in warm water",
      steps: ["Apply solvent spotter to oil ring", "Tamp with brush, blot", "Soak in Oxy 1:30 for 30 min", "Wash at 40 °C with enzyme detergent"],
      temperature: "40 °C",
      time: "30–45 min",
    };
    alternative = { whenToUse: "Coloured fabrics where oxidizer may bleed.", steps: ["Use solvent spotter only", "Follow with enzyme + dish soap", "Warm wash 30 °C"] };
    diy = { items: ["Dish soap", "Baking soda", "White vinegar"], steps: ["Dab dish soap on oil", "Sprinkle baking soda 10 min", "Spray vinegar, rinse", "Wash normally"] };
    doNotDo = ["No hot water before oil is lifted", colored ? "No chlorine bleach (will fade colour)" : "No iron until clean", "Do not rub — spreads dye"];
    expert = { ph: "9–10", why: "Solvent breaks oil bond; oxidizer cleaves dye chromophores.", fiberReaction: "Safe on cotton/poly; test on wool/silk.", chemistry: "Hydrocarbon solvent + sodium percarbonate releases H₂O₂." };
  } else if (has("Chemical")) {
    name = "Chemical Damage"; category = "Chemical"; difficulty = "Risky"; removability = 15;
    pro = { chemical: "Neutraliser (mild acid for alkali burn / soda for acid burn)", type: "pH Neutraliser", dilution: "1:100 cool water", steps: ["Identify the agent", "Neutralise with opposite pH", "Rinse thoroughly", "Assess fiber damage"], temperature: "Cool", time: "10 min" };
    alternative = { whenToUse: "When agent is unknown.", steps: ["Cool-water flush 5 min", "Mild detergent wash", "Air-dry", "Inspect fibres"] };
    diy = { items: ["Cool water", "Mild soap"], steps: ["Flush stain area", "Mild soap rinse", "Pat dry"] };
    doNotDo = ["No bleach", "No heat", "Do not stretch — fibres are weakened"];
    expert = { ph: "Match opposite of damaging agent", why: "Neutralisation halts further fibre attack.", fiberReaction: "Cellulose hydrolyses with acid; protein dissolves with strong alkali.", chemistry: "Acid–base neutralisation produces salt + water." };
  } else if (has("Reducible")) {
    name = "Rust / Metal Stain"; category = "Reducible"; difficulty = "Hard"; removability = 70;
    pro = { chemical: "Seitz Rust-Off (Oxalic Acid)", type: "Reducing Acid", dilution: "Apply neat, 2–3 min", steps: ["Apply to rust spot", "Wait 2 min", "Flush with cool water", "Wash with detergent"], temperature: "Cool", time: "5–10 min" };
    alternative = { whenToUse: "Coloured or delicate fabrics.", steps: ["Lemon juice + salt paste", "Sun-dry 1 hour", "Rinse", "Wash"] };
    diy = { items: ["Lemon", "Salt", "Sunlight"], steps: ["Squeeze lemon on rust", "Sprinkle salt", "Sun-dry 30 min", "Rinse and wash"] };
    doNotDo = ["No chlorine bleach (sets rust permanently)", "No hot water"];
    expert = { ph: "1–2 (acidic)", why: "Reduces Fe³⁺ to soluble Fe²⁺ which rinses away.", fiberReaction: "Safe on cotton/poly; risky on wool/silk.", chemistry: "Oxalic acid chelates iron into a water-soluble complex." };
  } else if (has("HeatSet")) {
    name = "Heat-Set / Aged Stain"; category = "Heat-Set"; difficulty = "Hard"; removability = 55;
    pro = { chemical: "Clean Craft Oxy Plus + Enzyme Booster", type: "Oxidizer + Enzyme", dilution: "1:25 warm water", steps: ["Pre-soak 1 hr", "Brush gently", "Wash 50 °C", "Repeat if needed"], temperature: "50 °C", time: "1–2 hrs" };
    alternative = { whenToUse: "Delicate fabrics.", steps: ["Cool oxygen soak overnight", "Rinse", "Repeat soak"] };
    diy = { items: ["Baking soda", "White vinegar", "Hot water (whites only)"], steps: ["Soak whites in baking soda + hot water", "Vinegar rinse", "Sun-dry"] };
    doNotDo = ["No further ironing until lifted", "No bleach on coloured fabrics"];
    expert = { ph: "10", why: "Oxidiser breaks aged chromophores; enzyme digests organic matrix.", fiberReaction: "Test on wool/silk.", chemistry: "Sodium percarbonate + protease enzyme." };
  } else if (has("Oxidizable")) {
    name = "Oxidizable Stain (fruit, wine, tea)"; category = "Oxidizable"; difficulty = "Medium"; removability = 80;
    pro = { chemical: "Clean Craft Oxy Plus", type: "Oxidizer", dilution: "1:30 warm water", steps: ["Cold flush", "Apply Oxy paste", "Soak 30 min", "Wash warm"], temperature: "30–40 °C", time: "30 min" };
    alternative = { whenToUse: "Coloured fabrics.", steps: ["Colour-safe oxygen soak 1 hr", "Wash 30 °C"] };
    diy = { items: ["Lemon", "Sunlight", "Dish soap"], steps: ["Lemon on white fabric", "Sun-dry 1 hr", "Rinse"] };
    doNotDo = ["No hot water before oxidising", "No iron until lifted"];
    expert = { ph: "9–10", why: "H₂O₂ oxidises dye chromophores into colourless fragments.", fiberReaction: "Safe on cotton; test on silk/wool.", chemistry: "Sodium percarbonate → Na₂CO₃ + H₂O₂." };
  } else if (has("Pigment")) {
    name = "Pigment / Paint Stain"; category = "Pigment"; difficulty = "Hard"; removability = 60;
    pro = { chemical: "Seitz POG (Paint-Oil-Grease)", type: "Solvent", dilution: "Neat", steps: ["Scrape excess", "Apply POG from back", "Tamp + blot", "Wash with detergent"], temperature: "Warm", time: "15 min" };
    alternative = { whenToUse: "Water-based paint (latex/acrylic).", steps: ["Flush cool water immediately", "Dish soap pre-treat", "Wash"] };
    diy = { items: ["Turpentine (oil paint)", "IPA (acrylic)", "Dish soap"], steps: ["Apply solvent from back", "Blot with cloth", "Dish soap, wash"] };
    doNotDo = ["Don't let it dry", "Do not iron"];
    expert = { ph: "Neutral", why: "Solvents dissolve binder so pigment can be flushed.", fiberReaction: "Test acetone-style solvents on synthetics — may melt.", chemistry: "Non-polar solvent dissolves resin binder." };
  } else if (has("Oily")) {
    name = "Oil / Grease Stain"; category = "Oil / Grease"; difficulty = "Medium"; removability = 85;
    pro = { chemical: "Clean Craft Degreaser HD", type: "Solvent / Surfactant", dilution: "1:20 warm water", steps: ["Blot, dust talc 10 min", "Brush off", "Apply degreaser", "Hot wash 50 °C"], temperature: "50 °C", time: "15–20 min" };
    alternative = { whenToUse: "Delicate fabrics that can't take 50 °C.", steps: ["Dish soap pre-treat", "Warm wash 30 °C", "Repeat if needed"] };
    diy = { items: ["Dish soap", "Cornstarch / talc"], steps: ["Sprinkle talc, wait 10 min", "Brush off", "Dish soap pre-treat", "Wash warm"] };
    doNotDo = ["Don't iron — sets oil", "Don't tumble-dry until lifted"];
    expert = { ph: "9", why: "Surfactants emulsify oil into water-soluble micelles.", fiberReaction: "Safe on cotton/poly; lower temp on wool/silk.", chemistry: "Linear alkylbenzene sulfonate + builder." };
  } else if (has("Protein")) {
    name = "Protein Stain (blood / sweat)"; category = "Protein"; difficulty = "Medium"; removability = 80;
    pro = { chemical: "Clean Craft Enzyme Pro", type: "Enzyme (Protease)", dilution: "1:40 cool water", steps: ["COLD rinse", "Soak in enzyme 30 min", "Cool wash 30 °C"], temperature: "≤ 30 °C", time: "30 min" };
    alternative = { whenToUse: "If enzyme detergent unavailable.", steps: ["Cold soak with salt water 30 min", "Rinse", "Mild detergent wash"] };
    diy = { items: ["Cold water", "Salt", "Bar soap"], steps: ["Cold rinse from back", "Salt paste 10 min", "Bar soap rub", "Cold wash"] };
    doNotDo = ["No hot water (cooks protein)", "No bleach on colours"];
    expert = { ph: "7–9", why: "Protease enzymes hydrolyse peptide bonds.", fiberReaction: "Avoid on wool/silk (protein fibres).", chemistry: "Subtilisin-class proteases at neutral pH." };
  } else if (has("Dye")) {
    name = "Tannin / Dye Stain"; category = "Dye / Tannin"; difficulty = "Medium"; removability = 75;
    pro = { chemical: "Seitz Tannin Spotter + Oxy", type: "Acidic Spotter + Oxidizer", dilution: "Spotter neat; Oxy 1:30", steps: ["Apply tannin spotter", "Blot", "Oxy soak 30 min", "Warm wash"], temperature: "40 °C", time: "30–45 min" };
    alternative = { whenToUse: "On colours.", steps: ["White vinegar + detergent dab", "Cool soak 30 min", "Wash"] };
    diy = { items: ["White vinegar", "Detergent"], steps: ["Vinegar dab", "Detergent rub", "Soak 20 min", "Wash"] };
    doNotDo = ["No alkali soap first (sets tannin)", "No hot water"];
    expert = { ph: "4–5 (acidic spotter)", why: "Acidic spotter loosens tannin bond before oxidiser cleaves chromophore.", fiberReaction: "Safe on most fibres.", chemistry: "Citric acid + percarbonate sequence." };
  } else if (has("Particulate")) {
    name = "Particulate (mud / dust)"; category = "Particulate"; difficulty = "Easy"; removability = 95;
    pro = { chemical: "Clean Craft Universal Detergent", type: "Surfactant", dilution: "1:50 warm water", steps: ["Let dry, brush solids", "Pre-soak 15 min", "Normal wash"], temperature: "30–40 °C", time: "15 min" };
    alternative = { whenToUse: "Heavy clay.", steps: ["Beat dry, brush", "Soak overnight in detergent", "Wash"] };
    diy = { items: ["Soft brush", "Detergent"], steps: ["Dry, brush off", "Detergent paste", "Wash normally"] };
    doNotDo = ["Don't wet mud first — drives it in", "Don't rub when wet"];
    expert = { ph: "9", why: "Surfactant suspends particulate so rinse can carry it away.", fiberReaction: "Safe on all fibres.", chemistry: "Anionic surfactant + sequestrant." };
  } else if (has("Transfer")) {
    name = "Dye Transfer / Colour Bleeding"; category = "Dye Transfer"; difficulty = "Hard"; removability = 65;
    pro = { chemical: "Colour-Run Remover", type: "Reducer", dilution: "Per pack instructions", steps: ["Soak ASAP — before drying", "Hot wash", "Repeat if traces remain"], temperature: "60 °C (whites) / 40 °C (colours)", time: "30 min" };
    alternative = { whenToUse: "When dried.", steps: ["Oxygen bleach soak overnight", "Wash hot", "Repeat"] };
    diy = { items: ["Oxygen bleach", "Hot water (whites)"], steps: ["Hot oxy soak", "Wash hot", "Sun-dry"] };
    doNotDo = ["Don't tumble-dry until lifted", "No iron"];
    expert = { ph: "10", why: "Reducer breaks dye–fibre bond before re-deposition.", fiberReaction: "Test on wool/silk.", chemistry: "Sodium hydrosulfite reduction." };
  } else if (has("Water")) {
    name = "Water-Based Stain"; category = "Water-Based"; difficulty = "Easy"; removability = 92;
    // defaults already set
  }

  if (oldStain) { removability -= 15; if (difficulty === "Easy") difficulty = "Medium"; }
  if (condition === "Heat") { removability -= 10; }
  removability = Math.max(10, Math.min(98, removability));

  return { name, category, difficulty, removability, pro, alternative, diy, doNotDo, proTips, expert };
}

export default function StainIdentify() {
  const navigate = useNavigate();
  const { saveStain, addStainHistory, stainMasterUnlocked } = useApp();
  if (!stainMasterUnlocked) {
    navigate("/stain-master", { replace: true });
    return null;
  }
  const [step, setStep] = useState(0);
  const [fabric, setFabric] = useState<Fabric | null>(null);
  const [color, setColor] = useState<Color | null>(null);
  const [natures, setNatures] = useState<Nature[]>([]);
  const [condition, setCondition] = useState<Condition | null>(null);
  const [expert, setExpert] = useState(false);
  const [stainQuery, setStainQuery] = useState("");

  const totalSteps = 4;
  const progress = ((step + 1) / (totalSteps + 1)) * 100;

  const result = useMemo(() => predict(natures, color, condition), [natures, color, condition]);

  const toggleNature = (n: Nature) =>
    setNatures((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  const canNext =
    (step === 0) ||
    (step === 1 && !!color) ||
    (step === 2 && natures.length > 0) ||
    (step === 3 && !!condition && natures.length > 0);

  const back = () => (step === 0 ? navigate(-1) : setStep((s) => s - 1));
  const next = () => {
    const nextStep = Math.min(step + 1, totalSteps);
    setStep(nextStep);
    if (nextStep === totalSteps) {
      addStainHistory({ name: result.name, category: result.category });
    }
  };

  const handleSave = () => {
    saveStain({ name: result.name, category: result.category });
    toast.success("Saved to your stains");
  };

  const diffColor: Record<Diagnosis["difficulty"], string> = {
    Easy: "bg-success/15 text-success border-success/30",
    Medium: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    Hard: "bg-orange-500/15 text-orange-700 border-orange-500/30",
    Risky: "bg-destructive/15 text-destructive border-destructive/30",
  };

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
              <OptionCard key={f.id} emoji={f.emoji} label={f.label} selected={fabric === f.id}
                onClick={() => setFabric(fabric === f.id ? null : f.id)} />
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
              <button key={c.id} onClick={() => setColor(c.id)}
                className={cn("flex flex-col items-center gap-2 rounded-xl border-2 bg-card p-4 transition-all",
                  color === c.id ? "border-primary shadow-elevated" : "border-border hover:border-primary/50")}>
                <span className={cn("h-14 w-14 rounded-full shadow-soft", c.swatch)} />
                <span className="text-sm font-semibold">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Nature */}
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
                <button key={n.id} onClick={() => toggleNature(n.id)}
                  className={cn("inline-flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-all",
                    sel ? "border-primary bg-primary text-primary-foreground shadow-elevated"
                        : "border-border bg-card hover:border-primary/50")}>
                  <span>{n.emoji}</span><span>{n.label}</span>{sel && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3 — Possible Stain Name + Condition */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Section A: Possible Name of Stain */}
          <section className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold leading-tight">Possible name of stain</h1>
              <p className="text-sm text-muted-foreground">
                Tap a stain you recognise — we'll auto-pick its nature for you.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {STAIN_NAMES.map((s) => {
                const sel =
                  s.natures.length > 0 &&
                  s.natures.every((n) => natures.includes(n));
                return (
                  <button
                    key={s.name}
                    onClick={() => setNatures(sel ? [] : s.natures)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border-2 px-3.5 py-2 text-sm font-semibold transition-all",
                      sel
                        ? "border-primary bg-primary text-primary-foreground shadow-elevated"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <span>{s.emoji}</span>
                    <span>{s.name}</span>
                    {sel && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
            {natures.length > 0 && (
              <p className="rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                Selected nature:{" "}
                <span className="font-semibold text-foreground">
                  {natures
                    .map((n) => NATURES.find((x) => x.id === n)?.label ?? n)
                    .join(", ")}
                </span>
              </p>
            )}
          </section>

          <div className="h-px bg-border" />

          {/* Section B: Stain Condition */}
          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-bold leading-tight">Stain condition</h2>
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
          </section>
        </div>
      )}

      {/* Step 4 — RESULT */}
      {step === 4 && (
        <div className="space-y-4">
          {/* Section 1: Diagnosis Card */}
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-5 text-primary-foreground shadow-elevated">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
                <Sparkles className="h-4 w-4" /> Diagnosis
              </div>
              <button onClick={handleSave} className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/25">
                <Bookmark className="h-3.5 w-3.5" /> Save
              </button>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight">{result.name}</h1>
            <p className="mt-1 text-sm opacity-90">Category · {result.category}</p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
                <p className="text-[10px] uppercase tracking-wider opacity-80">Difficulty</p>
                <p className="mt-1 text-base font-bold">{result.difficulty}</p>
              </div>
              <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
                <p className="text-[10px] uppercase tracking-wider opacity-80">Removability</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25">
                    <div className="h-full rounded-full bg-white" style={{ width: `${result.removability}%` }} />
                  </div>
                  <span className="text-sm font-bold">{result.removability}%</span>
                </div>
              </div>
            </div>
            <div className={cn("mt-3 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", diffColor[result.difficulty], "bg-white/90")}>
              {result.difficulty} · {result.removability}% removable
            </div>
          </div>

          {/* Expert Mode Toggle */}
          <Card className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">Expert Mode</p>
                <p className="text-[11px] text-muted-foreground">Show pH, chemistry & fiber reaction</p>
              </div>
            </div>
            <Switch checked={expert} onCheckedChange={setExpert} />
          </Card>

          {/* Section 2: Professional Method */}
          <Section icon={<Beaker className="h-4 w-4" />} title="Recommended Professional Method" tone="primary">
            <KV k="Chemical" v={result.pro.chemical} />
            <KV k="Type" v={result.pro.type} />
            <KV k="Dilution" v={result.pro.dilution} />
            <KV k="Temperature" v={result.pro.temperature} />
            <KV k="Time" v={result.pro.time} />
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Steps</p>
              <ol className="space-y-1.5">
                {result.pro.steps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Section>

          {/* Section 3: Alternative */}
          <Section title="Alternative Method" tone="muted">
            <KV k="When to use" v={result.alternative.whenToUse} />
            <ol className="space-y-1.5">
              {result.alternative.steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm"><span className="text-primary">•</span><span>{s}</span></li>
              ))}
            </ol>
          </Section>

          {/* Section 4: DIY */}
          <Section icon={<HomeIcon className="h-4 w-4" />} title="DIY Method" tone="muted">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Household items</p>
              <div className="flex flex-wrap gap-1.5">
                {result.diy.items.map((it) => (
                  <span key={it} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold">{it}</span>
                ))}
              </div>
            </div>
            <ol className="space-y-1.5">
              {result.diy.steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm"><span className="font-semibold text-primary">{i + 1}.</span><span>{s}</span></li>
              ))}
            </ol>
            <p className="rounded-lg bg-amber-500/10 p-2 text-[11px] font-medium text-amber-800">⚠️ Limited result expected — DIY may not fully remove the stain.</p>
          </Section>

          {/* Section 5: Do NOT Do */}
          <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm font-bold uppercase tracking-wider text-destructive">Do NOT Do</p>
            </div>
            <ul className="space-y-1.5">
              {result.doNotDo.map((d) => (
                <li key={d} className="flex gap-2 text-sm text-destructive"><span>✕</span><span>{d}</span></li>
              ))}
            </ul>
          </div>

          {/* Section 6: Pro Tips */}
          <Section icon={<Lightbulb className="h-4 w-4" />} title="Pro Tips" tone="muted">
            <KV k="Best time" v={result.proTips.bestTime} />
            <KV k="Send to pro" v={result.proTips.whenToSend} />
          </Section>

          {/* Expert Mode Detail */}
          {expert && (
            <Section icon={<FlaskConical className="h-4 w-4" />} title="Expert Mode" tone="primary">
              <KV k="pH" v={result.expert.ph} />
              <KV k="Why this works" v={result.expert.why} />
              <KV k="Fiber reaction" v={result.expert.fiberReaction} />
              <KV k="Chemistry" v={result.expert.chemistry} />
            </Section>
          )}

          {/* Inputs recap */}
          <div className="flex flex-wrap gap-1.5">
            {fabric && <Chip label={`Fabric: ${fabric}`} />}
            {color && <Chip label={`Color: ${color}`} />}
            {condition && <Chip label={`Condition: ${condition}`} />}
            {natures.length > 0 && <Chip label={`Nature: ${natures.join(", ")}`} />}
          </div>

          <Button size="lg" className="h-12 w-full rounded-xl text-base font-semibold" onClick={handleSave}>
            <Bookmark className="h-4 w-4" /> Save Stain
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => { setStep(0); setNatures([]); setColor(null); setCondition(null); setFabric(null); }}>
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
            <Button size="lg" disabled={!canNext} onClick={next}
              className="flex-1 rounded-xl text-base font-semibold">
              {step === totalSteps - 1 ? "Identify" : "Next"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, tone, children }: { icon?: React.ReactNode; title: string; tone: "primary" | "muted"; children: React.ReactNode }) {
  return (
    <Card className={cn("space-y-2.5 p-4", tone === "primary" && "border-primary/30 bg-primary/[0.03]")}>
      <div className="flex items-center gap-2">
        {icon && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</span>}
        <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </Card>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="text-sm">
      <span className="font-semibold text-muted-foreground">{k}: </span>
      <span>{v}</span>
    </div>
  );
}

function OptionCard({ emoji, label, selected, onClick }: { emoji: string; label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("flex flex-col items-center gap-1.5 rounded-xl border-2 bg-card p-4 transition-all",
        selected ? "border-primary shadow-elevated" : "border-border hover:border-primary/50")}>
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px]">{label}</span>
  );
}
