import { useRef, useState } from "react";
import {
  Camera,
  Sparkles,
  Loader2,
  X,
  AlertTriangle,
  ChevronRight,
  RotateCcw,
  ShieldAlert,
  Info,
  History,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type AiProduct = { name: string; type: string; notes: string };

type AiResult = {
  name: string;
  category: string;
  confidence: number;
  confidenceLabel?: string;
  why?: string;
  treatment?: string;
  products?: AiProduct[];
  steps?: string[];
  fabricPrecautions?: string[];
  avoid?: string[];
  consultProfessional?: boolean;
  professionalReason?: string;
  // legacy fallback shape
  professional?: string;
  diy?: string;
  doNot?: string;
};

type AnalysisRun = {
  id: string;
  at: number;
  fabric: string;
  color: string;
  source: string;
  age: string;
  results: AiResult[];
  overallNote: string;
};

const FABRICS = ["Cotton", "Silk", "Wool", "Polyester", "Denim", "Linen", "Blend", "Not sure"];
const COLORS = ["White", "Light", "Dark", "Bright / Dyed", "Mixed / Print"];
const SOURCES = [
  "Food / curry",
  "Oil / grease",
  "Tea / coffee",
  "Blood / protein",
  "Ink / dye",
  "Mud / soil",
  "Paint",
  "Cosmetics",
  "Sweat / deodorant",
  "Unknown",
];
const AGES = ["Fresh (< 1 hr)", "Few hours", "Days old", "Washed already", "Ironed / heat-set"];

const DISCLAIMER =
  "This is AI guidance, not a guaranteed diagnosis. Always test any product on a hidden area (inside seam, hem or pocket facing) first, and stop if colour lifts or the fabric changes.";

const HISTORY_KEY = "stain-master-ai-history";

function loadLocalHistory(): AnalysisRun[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as AnalysisRun[]) : [];
  } catch {
    return [];
  }
}

type Step = "photo" | "details" | "results";

export default function AiStainDetective() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("photo");
  const [image, setImage] = useState<string | null>(null);
  const [fabric, setFabric] = useState("");
  const [color, setColor] = useState("");
  const [source, setSource] = useState("");
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<AiResult[]>([]);
  const [overallNote, setOverallNote] = useState("");
  const [savedToAccount, setSavedToAccount] = useState(false);
  const [history, setHistory] = useState<AnalysisRun[]>(() => loadLocalHistory());
  const [showHistory, setShowHistory] = useState(false);

  const reset = () => {
    setStep("photo");
    setImage(null);
    setFabric("");
    setColor("");
    setSource("");
    setAge("");
    setNotes("");
    setResults([]);
    setOverallNote("");
    setErrorMsg(null);
    setSavedToAccount(false);
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
      setErrorMsg(null);
      setStep("details");
    };
    reader.onerror = () => toast.error("Could not read that file. Please try another photo.");
    reader.readAsDataURL(file);
  };

  const rememberRun = (list: AiResult[], note: string) => {
    const run: AnalysisRun = {
      id: crypto.randomUUID(),
      at: Date.now(),
      fabric,
      color,
      source,
      age,
      results: list,
      overallNote: note,
    };
    const next = [run, ...history].slice(0, 20);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // storage full or unavailable — history stays in memory for this session
    }
  };

  const analyse = async () => {
    if (!image) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const payload = { image, fabric, color, source, age, notes };
      // Secure server function — the OpenAI key never leaves the backend.
      const { data, error } = await supabase.functions.invoke("openai-stain", { body: payload });
      if (error) throw new Error(error.message || "Analysis failed. Please retry.");
      if (data?.error) throw new Error(data.error);
      const list: AiResult[] = data?.results ?? [];
      if (!list.length) throw new Error("Could not read the stain. Try a clearer, closer photo.");
      const note: string = data?.overallNote ?? "";
      setResults(list);
      setOverallNote(note);
      setSavedToAccount(Boolean(data?.saved));
      rememberRun(list, note);
      setStep("results");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Analysis failed. Please retry.");
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
            Upload a photo, add a few details, get a full treatment plan
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
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Analysis history"
              onClick={() => setShowHistory((v) => !v)}
            >
              <History className="h-4 w-4" />
            </Button>
          )}
          {step !== "photo" && (
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Start over" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Close"
            onClick={() => {
              setOpen(false);
              setShowHistory(false);
              reset();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showHistory && (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent analyses
          </p>
          {history.map((h) => (
            <button
              key={h.id}
              onClick={() => {
                setResults(h.results);
                setOverallNote(h.overallNote);
                setFabric(h.fabric);
                setColor(h.color);
                setSource(h.source);
                setAge(h.age);
                setShowHistory(false);
                setStep("results");
              }}
              className="flex w-full items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-left"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {h.results[0]?.name ?? "Analysis"}
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {new Date(h.at).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}

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
            <span className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 8 MB</span>
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
          <p className="text-sm text-muted-foreground">
            Step 2 of 3 — add what you know. Every detail sharpens the result.
          </p>

          <Chips label="Fabric type" options={FABRICS} value={fabric} onChange={setFabric} />
          <Chips label="Fabric colour" options={COLORS} value={color} onChange={setColor} />
          <Chips label="Stain source" options={SOURCES} value={source} onChange={setSource} />
          <Chips label="Stain age / condition" options={AGES} value={age} onChange={setAge} />

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

          {errorMsg && (
            <div className="space-y-2 rounded-xl bg-destructive/10 p-3">
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-full rounded-full"
                onClick={analyse}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4" /> Retry analysis
              </Button>
            </div>
          )}

          <Button onClick={analyse} disabled={loading} className="h-11 w-full rounded-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analysing photo & details…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Analyse the stain
              </>
            )}
          </Button>
          {loading && (
            <p className="text-center text-xs text-muted-foreground">
              This can take up to a minute. Please keep this screen open.
            </p>
          )}
        </div>
      )}

      {/* Step 3 - results */}
      {step === "results" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Step 3 of 3 — top 3 likely stains, most likely first.
            </p>
            {savedToAccount && (
              <span className="flex shrink-0 items-center gap-1 text-[11px] text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved
              </span>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <span className="text-foreground">{overallNote ? `${overallNote} ${DISCLAIMER}` : DISCLAIMER}</span>
          </div>

          {results.map((r, i) => (
            <Card key={i} className="space-y-2.5 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold">
                  {i + 1}. {r.name}
                </h3>
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {r.confidenceLabel ? `${r.confidenceLabel} · ` : ""}
                  {Math.round(Number(r.confidence) || 0)}%
                </Badge>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{r.category}</p>
              {r.why && <p className="text-sm text-muted-foreground">{r.why}</p>}

              {(r.treatment || r.professional) && (
                <Block title="Recommended treatment" tone="success" text={r.treatment || r.professional!} />
              )}

              {r.products && r.products.length > 0 && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Chemicals / products required
                  </p>
                  <ul className="mt-1.5 space-y-1.5">
                    {r.products.map((p, k) => (
                      <li key={k} className="text-sm">
                        <span className="font-semibold">{p.name}</span>
                        {p.type && <span className="text-muted-foreground"> · {p.type}</span>}
                        {p.notes && <span className="block text-xs text-muted-foreground">{p.notes}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {r.steps && r.steps.length > 0 && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Step-by-step procedure
                  </p>
                  <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-sm">
                    {r.steps.map((s, k) => (
                      <li key={k}>{s}</li>
                    ))}
                  </ol>
                </div>
              )}

              {r.fabricPrecautions && r.fabricPrecautions.length > 0 && (
                <div className="rounded-lg bg-primary/10 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Fabric-specific precautions
                  </p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm">
                    {r.fabricPrecautions.map((s, k) => (
                      <li key={k}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {((r.avoid && r.avoid.length > 0) || r.doNot) && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                    <AlertTriangle className="h-3.5 w-3.5" /> Do not
                  </p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4">
                    {(r.avoid?.length ? r.avoid : [r.doNot!]).map((s, k) => (
                      <li key={k}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {r.consultProfessional && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <span>
                    <span className="font-semibold">Consult a professional. </span>
                    {r.professionalReason || "Confidence is limited for this case."}
                  </span>
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
