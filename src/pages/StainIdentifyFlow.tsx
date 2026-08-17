/**
 * Step 3 — Stain Identification Flow.
 * Identification only. No treatment guidance, products or chemical procedures.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Camera, HelpCircle, ArrowLeft, ArrowRight, AlertTriangle, ShieldAlert,
  Info, Check, X, Bookmark, Clock, Flame, Star,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import PhotoCapture from "@/components/PhotoCapture";
import {
  AGE_OPTIONS, COLOUR_OPTIONS, TEXTURE_OPTIONS, SHAPE_OPTIONS, ODOUR_OPTIONS,
  LOCATION_OPTIONS, PREVIOUS_TREATMENT_OPTIONS, PRODUCT_USED_OPTIONS, HAZARD_OPTIONS,
  DAMAGE_OPTIONS, PHOTO_KINDS, GATE_PLAIN, RESTRICTED_GATES, searchStains,
  type IdAnswers, type PhotoKind,
} from "@/lib/stainId";
import {
  ID_CATEGORIES, SOURCE_GROUPS, STAIN_BY_ID, STAIN_RECORDS, COMMON_STAIN_IDS,
  CATEGORY_LABEL, type IdCategoryKey, type SourceKey,
} from "@/data/stainKnowledge";
import { useStainId } from "@/store/useStainId";
import { useFabricCheck } from "@/store/useFabricCheck";
import { useApp } from "@/store/useApp";
import StainMasterPaywall from "@/components/StainMasterPaywall";
import type { GateStatus, RiskLevel } from "@/lib/fabricSafety";

/* ------------------------- small building blocks ------------------------- */

function Why({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
        aria-expanded={open}
      >
        <Info className="h-3.5 w-3.5" aria-hidden /> Why are we asking?
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
            className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
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
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={total} aria-label="Progress">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(step / total) * 100}%` }} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question {step} of {total}</p>
      <h2 className="text-xl font-bold leading-tight">{title}</h2>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

const RISK_TEXT: Record<RiskLevel, string> = {
  green: "Green — lower risk",
  amber: "Amber — test first",
  red: "Red — professional handling",
  black: "Black — do not treat yet",
};

/* --------------------------------- page --------------------------------- */

type Stage =
  | "entry" | "search" | "source" | "category" | "photos"
  | "q_source" | "q_age" | "q_colour" | "q_texture" | "q_shape" | "q_odour" | "q_location"
  | "q_previous" | "q_hazard" | "q_damage" | "result";

const QUESTION_STAGES: Stage[] = [
  "q_source", "q_age", "q_colour", "q_texture", "q_shape", "q_odour",
  "q_location", "q_previous", "q_hazard", "q_damage",
];

export default function StainIdentifyFlow() {
  const navigate = useNavigate();
  const unlocked = useApp((s) => s.stainMasterUnlocked);
  const [paywall, setPaywall] = useState(!unlocked);

  const assessments = useFabricCheck((s) => s.assessments);
  const latest = useMemo(
    () => assessments.find((a) => a.state === "completed" && a.result) ?? null,
    [assessments],
  );
  const riskBefore: RiskLevel = latest?.adminOverride?.riskLevel ?? latest?.result?.riskLevel ?? "amber";
  const gateBefore: GateStatus = latest?.adminOverride?.gate ?? latest?.result?.gate ?? "proceed_with_testing";
  const restricted = RESTRICTED_GATES.includes(gateBefore);

  const { cases, currentId, start, patch, complete, confirmCandidate, rejectCandidate, notSureCandidate, logSearch, searchLog, savedStainIds, toggleSaved, track, resume } = useStainId();
  const current = cases.find((c) => c.id === currentId) ?? null;
  const [stage, setStage] = useState<Stage>("entry");
  const [query, setQuery] = useState("");
  const [expert, setExpert] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const a: IdAnswers | null = current?.answers ?? null;

  const ensureCase = (route: IdAnswers["entryRoute"]) => {
    const id = current && current.state === "in_progress" ? current.id : start({ owner: "guest", fabricAssessmentId: latest?.id ?? null, riskBefore, gateBefore });
    resume(id);
    useStainId.getState().patch(id, { entryRoute: route });
    track("step3_entry_route", route ?? undefined);
    return id;
  };

  const set = (p: Partial<IdAnswers>, note?: string) => {
    if (!current) return;
    patch(current.id, p, note);
  };

  const goNextQuestion = () => {
    const i = QUESTION_STAGES.indexOf(stage);
    if (i >= 0 && i < QUESTION_STAGES.length - 1) setStage(QUESTION_STAGES[i + 1]);
    else finish();
  };
  const goPrevQuestion = () => {
    const i = QUESTION_STAGES.indexOf(stage);
    if (i > 0) setStage(QUESTION_STAGES[i - 1]);
    else setStage("entry");
  };

  const finish = () => {
    if (!current) return;
    try {
      complete(current.id);
      setStage("result");
      setError(null);
    } catch {
      setError("We could not finish the assessment. Your answers have been kept — please try again.");
    }
  };

  const hits = useMemo(() => searchStains(query), [query]);

  if (!unlocked) {
    return (
      <div className="px-4 pb-28 pt-6">
        <StainMasterPaywall open={paywall} onOpenChange={setPaywall} />
        <Card className="p-5 text-sm text-muted-foreground">
          Stain identification is part of Stain Master.
          <Button className="mt-3 w-full" onClick={() => setPaywall(true)}>Unlock Stain Master</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 pb-28 pt-4">
      {/* Prerequisite gate banner */}
      <Card className={`p-4 ${restricted ? "border-destructive/40 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
        <div className="flex items-start gap-2">
          {restricted ? <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden /> : <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />}
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              Garment check: {latest ? RISK_TEXT[riskBefore] : "not completed yet"}
            </p>
            <p className="text-xs text-muted-foreground">
              {latest ? GATE_PLAIN[gateBefore] : "Complete the Fabric Safety Check first so identification is recorded against a garment decision."}
            </p>
            {!latest && (
              <Link to="/fabric-check" className="inline-block text-xs font-semibold text-primary underline">
                Go to the Fabric Safety Check
              </Link>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}

      {/* ------------------------------ ENTRY ------------------------------ */}
      {stage === "entry" && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold leading-tight">What caused the stain?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Search for the stain, upload photographs, or answer a few simple questions. If you do not know, choose “Unknown stain.”
            </p>
          </div>

          <div className="grid gap-3">
            {[
              { key: "search", icon: <Search className="h-5 w-5 text-[#4285F4]" />, title: "Search by Stain Name", sub: "Everyday names, local names and spellings" },
              { key: "source", icon: <HelpCircle className="h-5 w-5 text-[#34A853]" />, title: "Browse by Source", sub: "Food, drinks, cosmetics, machinery and more" },
              { key: "photo", icon: <Camera className="h-5 w-5 text-[#FBBC05]" />, title: "Upload Stain Photos", sub: "Photos suggest possibilities, they do not prove them" },
              { key: "unknown", icon: <AlertTriangle className="h-5 w-5 text-[#EA4335]" />, title: "I Don’t Know", sub: "Answer simple observation questions instead" },
            ].map((r) => (
              <button
                key={r.key}
                onClick={() => {
                  ensureCase(r.key === "photo" ? "photo" : (r.key as IdAnswers["entryRoute"]));
                  setStage(r.key === "photo" ? "photos" : r.key === "search" ? "search" : r.key === "source" ? "source" : "q_source");
                }}
                className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-elevated"
              >
                <span className="rounded-full bg-muted p-2.5">{r.icon}</span>
                <span className="flex-1">
                  <span className="block text-base font-semibold">{r.title}</span>
                  <span className="block text-xs text-muted-foreground">{r.sub}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
              </button>
            ))}
          </div>

          <button
            onClick={() => setStage("category")}
            className="w-full rounded-xl border border-border bg-card p-3 text-left text-sm font-semibold shadow-soft hover:border-primary"
          >
            Browse by stain category
            <span className="block text-xs font-normal text-muted-foreground">12 professional categories with plain-language examples</span>
          </button>

          {/* Quick access */}
          <div className="grid grid-cols-1 gap-3">
            <Card className="p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden /> Recent searches
              </p>
              {searchLog.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">No searches yet.</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {searchLog.slice(0, 8).map((s, i) => (
                    <button key={`${s.term}-${i}`} onClick={() => { ensureCase("search"); setQuery(s.term); setStage("search"); }} className="rounded-full bg-muted px-3 py-1.5 text-xs">
                      {s.term}
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Bookmark className="h-3.5 w-3.5" aria-hidden /> Saved assessments
              </p>
              {cases.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">Nothing saved yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {cases.slice(0, 5).map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => { resume(c.id); setStage(c.result ? "result" : "q_source"); }}
                        className="w-full rounded-lg border border-border p-2 text-left text-sm hover:border-primary"
                      >
                        <span className="font-medium">{c.result?.headline ?? "In progress"}</span>
                        <span className="block text-xs text-muted-foreground">{c.id} · {new Date(c.updatedAt).toLocaleString()}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Star className="h-3.5 w-3.5" aria-hidden /> Common stains
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {COMMON_STAIN_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => { const cid = ensureCase("search"); useStainId.getState().patch(cid, { selectedStainId: id }); setStage("q_source"); }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary"
                  >
                    {STAIN_BY_ID[id].icon} {STAIN_BY_ID[id].name}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="border-[#EA4335]/30 bg-[#EA4335]/5 p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-[#EA4335]">
                <Flame className="h-4 w-4" aria-hidden /> Urgent first response
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                If the mark may involve a chemical, fuel, battery fluid, blood or sewage, do not touch, smell, brush, steam or mix anything.
                Isolate the garment and continue here to document it safely.
              </p>
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={() => { const cid = ensureCase("unknown"); useStainId.getState().patch(cid, { sourceKnown: "no" }); setStage("q_hazard"); }}
              >
                Start hazard screening
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* ------------------------------ SEARCH ----------------------------- */}
      {stage === "search" && (
        <div className="space-y-4">
          <BackBar onBack={() => setStage("entry")} />
          <h2 className="text-xl font-bold">Search by stain name</h2>
          <p className="text-sm text-muted-foreground">Try “blood”, “haldi”, “chai”, “grease”, “mehndi”, “ballpoint pen”. Spelling mistakes are fine.</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (e.target.value.trim().length >= 2) { const r = searchStains(e.target.value); logSearch(e.target.value.trim(), r.length); } }}
              placeholder="Search a stain name"
              aria-label="Search a stain name"
              className="h-12 rounded-full border-2 pl-10 text-base"
            />
          </div>

          {query.trim().length >= 2 && hits.length === 0 && (
            <Card className="p-4 text-sm">
              <p className="font-medium">No match for “{query}”.</p>
              <p className="mt-1 text-muted-foreground">Check the spelling, try a local name, or continue without naming the stain.</p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setStage("source")}>Browse by source</Button>
                <Button size="sm" onClick={() => { set({ sourceKnown: "no" }); setStage("q_age"); }}>I’m not sure</Button>
              </div>
            </Card>
          )}

          <div className="space-y-3">
            {hits.map((h) => (
              <Card key={h.record.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden>{h.record.icon}</span>
                  <div className="flex-1">
                    <p className="text-base font-bold">{h.record.name}</p>
                    {(h.record.alt.length > 0 || h.record.local.length > 0) && (
                      <p className="text-xs text-muted-foreground">Also called: {[...h.record.alt, ...h.record.local].join(", ")}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">Typical sources: {h.record.typicalSources}</p>
                    <Badge variant="secondary" className="mt-2 text-[10px]">{CATEGORY_LABEL[h.record.category]}</Badge>
                    <p className="mt-1 text-sm">{h.record.plain}</p>
                  </div>
                  <button aria-label={`Save ${h.record.name}`} onClick={() => toggleSaved(h.record.id)} className="p-1">
                    <Bookmark className={`h-4 w-4 ${savedStainIds.includes(h.record.id) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  </button>
                </div>
                <Button
                  className="mt-3 w-full"
                  onClick={() => {
                    set({ selectedStainId: h.record.id, localNameUsed: h.matchedTerm, searchTerms: [...(a?.searchTerms ?? []), query.trim()] });
                    setStage("q_source");
                  }}
                >
                  Check if this matches
                </Button>
              </Card>
            ))}
          </div>

          {hits.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { set({ selectedStainId: null }); setStage("q_source"); }}>None of these</Button>
              <Button variant="outline" className="flex-1" onClick={() => { set({ selectedStainId: null, sourceKnown: "no" }); setStage("q_age"); }}>I’m not sure</Button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------ SOURCE ----------------------------- */}
      {stage === "source" && (
        <div className="space-y-4">
          <BackBar onBack={() => setStage("entry")} />
          <h2 className="text-xl font-bold">Where did it come from?</h2>
          <p className="text-sm text-muted-foreground">Source groups help you navigate. They are not the technical stain category.</p>
          <div className="grid grid-cols-2 gap-3">
            {SOURCE_GROUPS.map((s) => (
              <button
                key={s.key}
                onClick={() => { set({ selectedSource: s.key as SourceKey }); setStage("q_source"); }}
                className="min-h-20 rounded-xl border border-border bg-card p-3 text-left shadow-soft hover:border-primary"
              >
                <span className="text-2xl" aria-hidden>{s.icon}</span>
                <span className="mt-1 block text-[13px] font-semibold leading-tight">{s.label}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {STAIN_RECORDS.filter((r) => r.sources.includes(s.key)).length} stains
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------- CATEGORY ---------------------------- */}
      {stage === "category" && (
        <div className="space-y-4">
          <BackBar onBack={() => setStage("entry")} />
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Stain categories</h2>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Technical mode
              <Switch checked={expert} onCheckedChange={setExpert} aria-label="Technical mode" />
            </label>
          </div>
          <div className="space-y-3">
            {ID_CATEGORIES.filter((c) => expert || !c.technical).map((c) => (
              <button
                key={c.key}
                onClick={() => { ensureCase("category"); useStainId.getState().patch(useStainId.getState().currentId!, { selectedCategory: c.key as IdCategoryKey }); setStage("q_source"); }}
                className="w-full rounded-xl border border-border bg-card p-4 text-left shadow-soft hover:border-primary"
              >
                <span className="block text-base font-semibold">{c.label}</span>
                <span className="block text-xs text-muted-foreground">{c.subtitle}</span>
                <span className="mt-1 block text-xs text-muted-foreground">Examples: {c.examples}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------ PHOTOS ----------------------------- */}
      {stage === "photos" && a && (
        <div className="space-y-4">
          <BackBar onBack={() => setStage("entry")} />
          <h2 className="text-xl font-bold">Photographs of the stain</h2>
          <Card className="border-primary/30 bg-primary/5 p-3 text-xs">
            Photo analysis can suggest likely stains, but different substances can look identical. We will ask questions before assigning confidence.
          </Card>
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            <li>Use neutral lighting. Avoid coloured lighting and filters.</li>
            <li>Keep the stain in focus and include the complete edge.</li>
            <li>Include an unaffected area for colour comparison.</li>
            <li>Do not wet or treat the stain before photographing it.</li>
            <li>Do not touch an unknown chemical or biological stain, or handle a container if it is unsafe.</li>
          </ul>
          <div className="space-y-3">
            {PHOTO_KINDS.map((p) => {
              const existing = a.photos.find((x) => x.kind === p.key);
              return (
                <PhotoCapture
                  key={p.key}
                  label={p.label}
                  hint={p.hint}
                  value={existing?.dataUrl}
                  onChange={(dataUrl) =>
                    set({ photos: [...a.photos.filter((x) => x.kind !== p.key), { kind: p.key as PhotoKind, dataUrl, capturedAt: Date.now() }] })
                  }
                  onRemove={() => set({ photos: a.photos.filter((x) => x.kind !== p.key) })}
                />
              );
            })}
          </div>
          {a.photos.length > 0 && !a.photos.some((p) => p.kind === "comparison") && (
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground" role="status">
              Image quality note: please include an unaffected area for colour comparison if you can.
            </p>
          )}
          <Textarea
            placeholder="Describe what you see (optional)"
            aria-label="Describe what you see"
            onChange={(e) => set({ photos: a.photos.map((p, i) => (i === 0 ? { ...p, description: e.target.value } : p)) })}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStage("q_source")}>Continue without a photograph</Button>
            <Button className="flex-1" onClick={() => setStage("q_source")}>Continue</Button>
          </div>
        </div>
      )}

      {/* ---------------------------- QUESTIONS ---------------------------- */}
      {QUESTION_STAGES.includes(stage) && a && (
        <div className="space-y-5">
          <BackBar onBack={goPrevQuestion} />
          {stage === "q_source" && (
            <>
              <StepHeader step={1} total={10} title="Do you know what caused the mark?" />
              <Chips
                name="Source known"
                multi={false}
                options={["Yes", "I have an idea", "No"]}
                value={a.sourceKnown === "yes" ? ["Yes"] : a.sourceKnown === "idea" ? ["I have an idea"] : a.sourceKnown === "no" ? ["No"] : []}
                onChange={(v) => set({ sourceKnown: v[0] === "Yes" ? "yes" : v[0] === "I have an idea" ? "idea" : "no" })}
              />
              {a.selectedStainId && (
                <p className="text-sm text-muted-foreground">Selected stain name: <strong>{STAIN_BY_ID[a.selectedStainId]?.name}</strong></p>
              )}
              {(a.sourceKnown === "yes" || a.sourceKnown === "idea") && !a.selectedStainId && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setStage("search")}>Search a name</Button>
                  <Button variant="outline" size="sm" onClick={() => setStage("source")}>Choose a source</Button>
                </div>
              )}
              <Why text="Knowing the source is the single strongest piece of evidence. Without it, we keep confidence low." />
            </>
          )}
          {stage === "q_age" && (
            <>
              <StepHeader step={2} total={10} title="When did it happen?" />
              <Chips name="Age" multi={false} options={AGE_OPTIONS} value={a.age ? [a.age] : []} onChange={(v) => set({ age: v[0] })} />
              <Why text="Age changes how a mark looks and behaves, and helps rule possibilities in or out." />
            </>
          )}
          {stage === "q_colour" && (
            <>
              <StepHeader step={3} total={10} title="What colour is the mark?" hint="Select all that apply." />
              <Chips name="Colour" options={COLOUR_OPTIONS} value={a.colours} onChange={(v) => set({ colours: v })} />
            </>
          )}
          {stage === "q_texture" && (
            <>
              <StepHeader step={4} total={10} title="How does it look or feel?" hint="Select all that apply." />
              <Chips name="Physical character" options={TEXTURE_OPTIONS} value={a.textures} onChange={(v) => set({ textures: v })} />
            </>
          )}
          {stage === "q_shape" && (
            <>
              <StepHeader step={5} total={10} title="What shape or pattern is it?" hint="Select all that apply." />
              <Chips name="Shape" options={SHAPE_OPTIONS} value={a.shapes} onChange={(v) => set({ shapes: v })} />
            </>
          )}
          {stage === "q_odour" && (
            <>
              <StepHeader
                step={6}
                total={10}
                title="Without bringing the garment close to your face, is there an odour you already notice?"
              />
              <Card className="border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                Do not deliberately smell an unknown chemical, solvent, bodily fluid or contaminated garment.
              </Card>
              <Chips name="Odour" multi={false} options={ODOUR_OPTIONS} value={a.odour ? [a.odour] : []} onChange={(v) => set({ odour: v[0] })} />
            </>
          )}
          {stage === "q_location" && (
            <>
              <StepHeader step={7} total={10} title="Where is the mark on the garment?" hint="Select all that apply." />
              <Chips name="Location" options={LOCATION_OPTIONS} value={a.locations} onChange={(v) => set({ locations: v })} />
              <Why text="Position supports probability — for example collar or underarm build-up — but it never confirms identity on its own." />
            </>
          )}
          {stage === "q_previous" && (
            <>
              <StepHeader step={8} total={10} title="What has already happened to the stain?" hint="Select all that apply." />
              <Chips name="Previous treatment" options={PREVIOUS_TREATMENT_OPTIONS} value={a.previousTreatment} onChange={(v) => set({ previousTreatment: v })} />
              {a.previousTreatment.some((p) => PRODUCT_USED_OPTIONS.includes(p)) && (
                <Card className="space-y-3 p-4">
                  <p className="text-sm font-semibold">About the product used</p>
                  <Input placeholder="Product name" aria-label="Product name" value={a.product?.name ?? ""} onChange={(e) => set({ product: { ...(a.product ?? { name: "", appliedAt: "", rinsed: "", result: "" }), name: e.target.value } })} />
                  <Input placeholder="Approximate time applied" aria-label="Approximate time applied" value={a.product?.appliedAt ?? ""} onChange={(e) => set({ product: { ...(a.product ?? { name: "", appliedAt: "", rinsed: "", result: "" }), appliedAt: e.target.value } })} />
                  <Chips name="Rinsed" multi={false} options={["Rinsed", "Not rinsed", "Not sure"]} value={a.product?.rinsed ? [a.product.rinsed] : []} onChange={(v) => set({ product: { ...(a.product ?? { name: "", appliedAt: "", rinsed: "", result: "" }), rinsed: v[0] } })} />
                  <Textarea placeholder="What happened afterwards?" aria-label="Result observed" value={a.product?.result ?? ""} onChange={(e) => set({ product: { ...(a.product ?? { name: "", appliedAt: "", rinsed: "", result: "" }), result: e.target.value } })} />
                  <PhotoCapture label="Product photograph" value={a.product?.productPhoto} onChange={(d) => set({ product: { ...(a.product ?? { name: "", appliedAt: "", rinsed: "", result: "" }), productPhoto: d } })} onRemove={() => set({ product: { ...(a.product ?? { name: "", appliedAt: "", rinsed: "", result: "" }), productPhoto: undefined } })} />
                  <PhotoCapture label="Label photograph" value={a.product?.labelPhoto} onChange={(d) => set({ product: { ...(a.product ?? { name: "", appliedAt: "", rinsed: "", result: "" }), labelPhoto: d } })} onRemove={() => set({ product: { ...(a.product ?? { name: "", appliedAt: "", rinsed: "", result: "" }), labelPhoto: undefined } })} />
                  <p className="text-xs text-muted-foreground">We record what you tell us. We do not assume the chemistry of any product.</p>
                </Card>
              )}
            </>
          )}
          {stage === "q_hazard" && (
            <>
              <StepHeader step={9} total={10} title="Could the mark involve any of these?" hint="Safety screening comes before stain matching." />
              <Chips name="Hazards" options={HAZARD_OPTIONS} value={a.hazards} onChange={(v) => set({ hazards: v })} />
              <Card className="border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                Do not touch, smell, brush, steam or mix chemicals. If in doubt, isolate the garment.
              </Card>
            </>
          )}
          {stage === "q_damage" && (
            <>
              <StepHeader
                step={10}
                total={10}
                title="Does the area look lighter, rougher, thinner, melted, cracked or permanently changed?"
                hint="Select all that apply."
              />
              <Chips name="Damage" options={DAMAGE_OPTIONS} value={a.damage} onChange={(v) => set({ damage: v })} />
              <Why text="Bleach spots, acid damage, scorch marks and missing dye are not stains and cannot be removed as stains." />
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={goPrevQuestion}>Back</Button>
            <Button className="flex-1" onClick={goNextQuestion}>
              {stage === "q_damage" ? "See result" : "Next"}
            </Button>
          </div>
          <button className="w-full text-center text-xs text-muted-foreground underline" onClick={finish}>
            Skip the rest and see the result
          </button>
        </div>
      )}

      {/* ------------------------------ RESULT ----------------------------- */}
      {stage === "result" && current?.result && a && (
        <ResultView
          caseId={current.id}
          answers={a}
          result={current.result}
          confirmedStainId={current.confirmedStainId}
          rejected={current.rejectedStainIds}
          onConfirm={(id) => confirmCandidate(current.id, id)}
          onReject={(id) => rejectCandidate(current.id, id)}
          onNotSure={(id) => notSureCandidate(current.id, id)}
          onMoreQuestions={() => setStage("q_source")}
          onRestart={() => { setStage("entry"); navigate("/stain-id"); }}
        />
      )}
    </div>
  );
}

function BackBar({ onBack }: { onBack: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="-ml-2 h-9 text-primary" onClick={onBack}>
      <ArrowLeft className="h-4 w-4" aria-hidden /> Back
    </Button>
  );
}

/* -------------------------------- result -------------------------------- */

function ResultView({
  caseId, answers, result, confirmedStainId, rejected, onConfirm, onReject, onNotSure, onMoreQuestions, onRestart,
}: {
  caseId: string;
  answers: IdAnswers;
  result: NonNullable<ReturnType<typeof useStainId.getState>["cases"][number]["result"]>;
  confirmedStainId: string | null;
  rejected: string[];
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onNotSure: (id: string) => void;
  onMoreQuestions: () => void;
  onRestart: () => void;
}) {
  const summary: [string, string][] = [
    ["Known or suspected source", answers.selectedStainId ? STAIN_BY_ID[answers.selectedStainId]?.name ?? "Not known" : answers.selectedSource ? "Source group selected" : "Not known"],
    ["Stain age", answers.age ?? "Not recorded"],
    ["Appearance", answers.colours.join(", ") || "Not recorded"],
    ["Physical character", answers.textures.join(", ") || "Not recorded"],
    ["Location", answers.locations.join(", ") || "Not recorded"],
    ["Previous treatment", answers.previousTreatment.join(", ") || "Not recorded"],
    ["Fabric risk from the garment check", RISK_TEXT[result.riskBefore]],
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stain identification result</p>
        <h1 className="text-2xl font-bold leading-tight">{result.headline}</h1>
        <p className="text-xs text-muted-foreground">Case {caseId} · rules {result.rulesVersion}</p>
      </div>

      {result.hazardStop && (
        <Card className="border-destructive bg-destructive/10 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-destructive">
            <ShieldAlert className="h-4 w-4" aria-hidden /> Stop — possible hazard
          </p>
          <p className="mt-1 text-sm">Isolate the garment. A professional or hazardous-material assessment is required. Do not touch, smell, brush, steam or mix chemicals.</p>
          <ul className="mt-2 list-disc pl-5 text-xs">{result.hazardReasons.map((h) => <li key={h}>{h}</li>)}</ul>
        </Card>
      )}

      {result.damageRoute && (
        <Card className="border-[#EA4335]/40 bg-[#EA4335]/5 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-[#EA4335]">
            <AlertTriangle className="h-4 w-4" aria-hidden /> Possible fabric damage
          </p>
          <p className="mt-1 text-sm">Colour loss, scorching and fibre damage cannot be removed as stains. This case is routed to damage diagnosis.</p>
          <ul className="mt-2 list-disc pl-5 text-xs">{result.damageReasons.map((d) => <li key={d}>{d}</li>)}</ul>
        </Card>
      )}

      {result.biologicalPrecautions && (
        <Card className="border-amber-500/40 bg-amber-500/5 p-3 text-xs">
          Biological material may be present. Handle with gloves, keep the garment separate, and wash hands after handling.
        </Card>
      )}

      {result.documentationOnly && (
        <Card className="border-destructive/40 bg-destructive/5 p-3 text-sm">
          {GATE_PLAIN[result.gateAfter]} You can document this mark, but treatment guidance is not available for this garment.
        </Card>
      )}

      <Card className="p-4">
        <p className="text-sm font-semibold">Case summary</p>
        <dl className="mt-2 space-y-1.5 text-sm">
          {summary.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="p-4">
        <p className="text-sm font-semibold">Stain-identification confidence: {result.confidence}/10</p>
        <p className="mt-1 text-xs text-muted-foreground">{result.confidenceReason}</p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={`Confidence ${result.confidence} out of 10`}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${result.confidence * 10}%` }} />
        </div>
        {result.uncertainty.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
            {result.uncertainty.map((u) => <li key={u}>{u}</li>)}
          </ul>
        )}
      </Card>

      {result.candidates.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {result.candidates.length === 1 ? "Likely possibility" : `Top ${result.candidates.length} possibilities`}
          </p>
          {result.candidates.map((c) => {
            const isRejected = rejected.includes(c.stainId);
            const isConfirmed = confirmedStainId === c.stainId;
            return (
              <Card key={c.stainId} className={`p-4 ${isRejected ? "opacity-50" : ""} ${isConfirmed ? "border-primary" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden>{c.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {c.rank === 1 ? "First possibility" : c.rank === 2 ? "Second possibility" : "Third possibility"}
                    </p>
                    <p className="text-base font-bold">{c.name}</p>
                    {c.altName && <p className="text-xs text-muted-foreground">Also called: {c.altName}</p>}
                    <Badge variant="secondary" className="mt-1 text-[10px]">{c.categoryLabel}</Badge>
                    {c.secondary.length > 0 && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Other components: {c.secondary.map((s) => CATEGORY_LABEL[s]).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div>
                    <p className="font-semibold">Why it may match</p>
                    <ul className="list-disc pl-4 text-muted-foreground">{c.why.slice(0, 4).map((w) => <li key={w}>{w}</li>)}</ul>
                  </div>
                  <div>
                    <p className="font-semibold">Why it may not match</p>
                    <ul className="list-disc pl-4 text-muted-foreground">{c.whyNot.slice(0, 3).map((w) => <li key={w}>{w}</li>)}</ul>
                  </div>
                  {c.missingEvidence.length > 0 && (
                    <p className="text-muted-foreground">Missing evidence: {c.missingEvidence.join(", ")}.</p>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Button size="sm" variant={isConfirmed ? "default" : "outline"} onClick={() => onConfirm(c.stainId)}>
                    <Check className="mr-1 h-3.5 w-3.5" aria-hidden /> Confirm
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onReject(c.stainId)}>
                    <X className="mr-1 h-3.5 w-3.5" aria-hidden /> Reject
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onNotSure(c.stainId)}>Not sure</Button>
                </div>
              </Card>
            );
          })}
          <Button variant="outline" className="w-full" onClick={() => { result.candidates.forEach((c) => onReject(c.stainId)); }}>
            None of these / Unknown stain
          </Button>
        </div>
      )}

      <Card className="p-4">
        <p className="text-sm font-semibold">Risk interaction with the garment check</p>
        <p className="mt-1 text-sm">{RISK_TEXT[result.riskBefore]} → <strong>{RISK_TEXT[result.riskAfter]}</strong></p>
        <p className="mt-1 text-xs text-muted-foreground">{result.riskRule}. Step 3 can raise the garment risk but never lowers it.</p>
      </Card>

      <Card className="border-primary/30 bg-primary/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next action</p>
        <p className="text-lg font-bold">{result.nextAction}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Treatment guidance, products and procedures are not part of this step.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {result.nextAction === "Answer More Questions" && (
            <Button onClick={onMoreQuestions}>Answer more questions</Button>
          )}
          <Button variant="outline" onClick={onRestart}>Start another identification</Button>
        </div>
      </Card>
    </div>
  );
}
