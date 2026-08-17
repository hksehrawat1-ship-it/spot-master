import { useRef, useState } from "react";
import {
  Camera,
  Sparkles,
  Loader2,
  X,
  AlertTriangle,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type AiResult = {
  name: string;
  category: string;
  confidence: number;
  why: string;
  professional: string;
  diy: string;
  doNot: string;
};

const FABRICS = ["Cotton", "Silk", "Wool", "Polyester", "Denim", "Linen", "Blend", "Not sure"];
const COLORS = ["White", "Light", "Dark", "Bright / Dyed", "Mixed / Print"];
const AGES = ["Fresh (< 1 hr)", "Few hours", "Days old", "Washed already", "Ironed / heat-set"];

type Step = "photo" | "details" | "results";

export default function AiStainDetective() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("photo");
  const [image, setImage] = useState<string | null>(null);
  const [fabric, setFabric] = useState("");
  const [color, setColor] = useState("");
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AiResult[]>([]);

  const reset = () => {
    setStep("photo");
    setImage(null);
    setFabric("");
    setColor("");
    setAge("");
    setNotes("");
    setResults([]);
  };

  const onPick = (file?: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Please use a photo smaller than 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(String(reader.result));
      setStep("details");
    };
    reader.readAsDataURL(file);
  };

  const analyse = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const payload = { image, fabric, color, age, notes };
      // Primary: secure server function on OpenAI's Responses API (key stays server-side).
      let { data, error } = await supabase.functions.invoke("openai-stain", { body: payload });
      if (error || data?.error) {
        const fallback = await supabase.functions.invoke("analyze-stain", { body: payload });
        if (!fallback.error && !fallback.data?.error) {
          data = fallback.data;
          error = null;
        }
      }
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const list: AiResult[] = data?.results ?? [];
      if (!list.length) throw new Error("Could not read the stain. Try a clearer, closer photo.");
      setResults(list);
      setStep("results");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-elevated"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-foreground">AI Stain Detective</span>
          <span className="block text-xs text-muted-foreground">
            Upload a photo, answer 3 quick questions, get the 3 most likely stains
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </button>
    );
  }

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-[15px] font-semibold">AI Stain Detective</h2>
        </div>
        <div className="flex items-center gap-1">
          {step !== "photo" && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setOpen(false);
              reset();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Step 1 - photo */}
      {step === "photo" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Step 1 of 3 — take or upload a clear, close photo of the stain.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary"
          >
            <Camera className="h-7 w-7 text-primary" />
            <span className="text-sm font-semibold">Take / upload photo</span>
            <span className="text-xs text-muted-foreground">JPG or PNG, up to 8 MB</span>
          </button>
        </div>
      )}

      {/* Step 2 - details */}
      {step === "details" && (
        <div className="space-y-4">
          {image && (
            <img
              src={image}
              alt="Uploaded stain photo for AI analysis"
              className="h-40 w-full rounded-xl object-cover"
            />
          )}
          <p className="text-sm text-muted-foreground">Step 2 of 3 — a few details sharpen the result.</p>

          <Chips label="Fabric" options={FABRICS} value={fabric} onChange={setFabric} />
          <Chips label="Garment colour" options={COLORS} value={color} onChange={setColor} />
          <Chips label="Condition" options={AGES} value={age} onChange={setAge} />

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Anything else? (optional)
            </p>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. smells oily, happened at a wedding dinner"
              className="h-11 rounded-xl"
            />
          </div>

          <Button onClick={analyse} disabled={loading} className="h-11 w-full rounded-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analysing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Deduct the stain
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step 3 - results */}
      {step === "results" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Step 3 of 3 — top 3 likely stains, most likely first.
          </p>
          {results.map((r, i) => (
            <Card key={i} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold">
                  {i + 1}. {r.name}
                </h3>
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {Math.round(Number(r.confidence) || 0)}% match
                </Badge>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{r.category}</p>
              {r.why && <p className="text-sm text-muted-foreground">{r.why}</p>}
              {r.professional && (
                <Block title="Professional method" tone="success" text={r.professional} />
              )}
              {r.diy && <Block title="DIY method" tone="muted" text={r.diy} />}
              {r.doNot && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{r.doNot}</span>
                </div>
              )}
            </Card>
          ))}
          <Button variant="outline" onClick={reset} className="h-11 w-full rounded-full">
            <RotateCcw className="h-4 w-4" /> Analyse another stain
          </Button>
        </div>
      )}
    </Card>
  );
}

function Chips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(value === o ? "" : o)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              value === o
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Block({ title, text, tone }: { title: string; text: string; tone: "success" | "muted" }) {
  return (
    <div className={`rounded-lg p-3 ${tone === "success" ? "bg-success/10" : "bg-muted"}`}>
      <p
        className={`text-[11px] font-semibold uppercase tracking-wider ${
          tone === "success" ? "text-success" : "text-muted-foreground"
        }`}
      >
        {title}
      </p>
      <p className="mt-1 text-sm text-foreground">{text}</p>
    </div>
  );
}
