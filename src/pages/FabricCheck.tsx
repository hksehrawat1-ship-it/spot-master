import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck, ArrowLeft, ArrowRight, Save, Camera, ScanLine, HelpCircle, FolderOpen,
  AlertTriangle, CheckCircle2, Info, XCircle, FlaskConical, Search, Pencil, ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import PhotoCapture from "@/components/PhotoCapture";
import { useApp } from "@/store/useApp";
import { useFabricCheck, type Assessment } from "@/store/useFabricCheck";
import {
  BLACK_SAFETY_MESSAGE, CLEANING_HISTORY, COLOUR_FLAGS, COLOUR_OPTIONS, CONSTRUCTION_OPTIONS,
  DAMAGE_OPTIONS, FABRIC_APPEARANCE, GARMENT_TYPES, HISTORY_FOLLOWUPS, IMPORTANCE_OPTIONS,
  PRODUCT_INSTRUCTION_FALLBACK, PROFESSIONAL_TESTS, USER_ROLES, canRunProfessionalTests,
  evaluateFabricSafety, riskWord, type FabricAnswers, type LabelRoute, type UserRoleKey,
} from "@/lib/fabricSafety";

const RISK_STYLE: Record<string, { chip: string; icon: typeof Info; word: string }> = {
  green: { chip: "bg-success/15 text-success border-success/30", icon: CheckCircle2, word: "Green" },
  amber: { chip: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: AlertTriangle, word: "Amber" },
  red: { chip: "bg-destructive/15 text-destructive border-destructive/30", icon: ShieldAlert, word: "Red" },
  black: { chip: "bg-foreground/10 text-foreground border-foreground/30", icon: XCircle, word: "Black" },
};

function Chip({ selected, children, onClick, ariaLabel }: { selected: boolean; children: React.ReactNode; onClick: () => void; ariaLabel?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
        selected
          ? "border-primary bg-primary/10 text-primary shadow-soft"
          : "border-border bg-card text-foreground hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

function YesNo({ label, value, onChange }: { label: string; value: boolean | undefined; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
      <span className="text-sm">{label}</span>
      <div className="flex gap-1.5">
        <Button type="button" size="sm" variant={value === true ? "default" : "outline"} onClick={() => onChange(true)} aria-pressed={value === true}>Yes</Button>
        <Button type="button" size="sm" variant={value === false ? "default" : "outline"} onClick={() => onChange(false)} aria-pressed={value === false}>No</Button>
      </div>
    </div>
  );
}

export default function FabricCheck() {
  const navigate = useNavigate();
  const user = useApp((s) => s.user);
  const owner = user?.email ?? "guest";
  const { assessments, currentId, start, resume, clearCurrent, patchAnswers, complete, addTest, removePhoto, track } = useFabricCheck();

  const current = assessments.find((a) => a.id === currentId) ?? null;
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<UserRoleKey>("domestic_user");
  const [garmentSearch, setGarmentSearch] = useState("");

  const saved = assessments.filter((a) => a.owner === owner);

  /* ---------------- Entry ---------------- */
  if (!current) {
    const begin = (route: LabelRoute) => {
      const id = start(owner, role);
      patchAnswers(id, { route, role }, "route selected");
      track("assessment_started", "entry", { route, role });
      setStep(route === "label" ? 1 : 2);
    };

    return (
      <div className="space-y-5 px-4 pb-28 pt-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-5 text-primary-foreground shadow-elevated">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
            <ShieldCheck className="h-4 w-4" /> Fabric Safety Check
          </div>
          <h1 className="mt-1 text-2xl font-bold leading-tight">Check the Garment First</h1>
          <p className="mt-1 text-sm opacity-90">
            Before treating a stain, check the fabric, colour and garment construction.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>Do not apply heat or stain-removal chemicals until the garment has been assessed.</span>
        </div>

        <section aria-labelledby="role-h" className="space-y-2">
          <h2 id="role-h" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Who is checking this garment?</h2>
          <div className="grid grid-cols-2 gap-2">
            {USER_ROLES.map((r) => (
              <Chip key={r.key} selected={role === r.key} onClick={() => setRole(r.key)}>
                <span className="block">{r.label}</span>
                <span className="block text-[11px] font-normal text-muted-foreground">{r.hint}</span>
              </Chip>
            ))}
          </div>
        </section>

        <section aria-labelledby="entry-h" className="space-y-2">
          <h2 id="entry-h" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Start the check</h2>
          <div className="grid gap-2">
            <EntryButton icon={ScanLine} title="Scan Care Label" desc="Photograph the fibre and care-symbol labels" onClick={() => begin("label")} />
            <EntryButton icon={HelpCircle} title="No Care Label" desc="Locally stitched or label removed — this is fine" onClick={() => begin("no_label")} />
            <EntryButton icon={Camera} title="Label Is Unclear" desc="Faded, cut, unreadable or in an unknown language" onClick={() => begin("unclear")} />
          </div>
        </section>

        <section aria-labelledby="saved-h" className="space-y-2">
          <h2 id="saved-h" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Continue a Saved Assessment</h2>
          {saved.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">No saved assessments yet.</Card>
          ) : (
            saved.map((a) => (
              <button
                key={a.id}
                onClick={() => { resume(a.id); setStep(a.state === "completed" ? 99 : 2); }}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left hover:border-primary"
              >
                <FolderOpen className="h-5 w-5 text-primary" aria-hidden />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{a.answers.garmentType || "Untitled garment"} · {a.id}</span>
                  <span className="block text-xs text-muted-foreground">
                    {a.state === "completed" ? `Completed · ${riskWord(a.adminOverride?.riskLevel ?? a.result!.riskLevel)}` : "In progress"} ·{" "}
                    {new Date(a.updatedAt).toLocaleDateString()}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
              </button>
            ))
          )}
        </section>
      </div>
    );
  }

  /* ---------------- Wizard ---------------- */
  const a = current.answers;
  const set = (patch: Partial<FabricAnswers>, note?: string) => patchAnswers(current.id, patch, note);
  const toggle = (key: keyof FabricAnswers, value: string) => {
    const list = (a[key] as string[]) ?? [];
    set({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] } as Partial<FabricAnswers>, `${String(key)}: ${value}`);
  };

  const stages = [
    "Entry", "Care Label", "Garment Type", "Cleaning History", "Fabric Appearance",
    "Colour", "Construction and Decoration", "Existing Damage", "Garment Importance",
    ...(canRunProfessionalTests(a.role) ? ["Professional Tests"] : []),
    "Review Answers",
  ];
  const lastStep = stages.length - 1;
  const showResult = step === 99;
  const stageIndex = Math.min(step, lastStep);
  const pct = showResult ? 100 : Math.round(((stageIndex + 1) / (stages.length + 1)) * 100);

  const next = () => {
    if (step === 1 && a.route !== "label") return setStep(2);
    if (step >= lastStep) {
      const r = complete(current.id);
      track("assessment_completed", "result", { risk: r?.riskLevel ?? "", gate: r?.gate ?? "", confidence: r?.confidence ?? "" });
      return setStep(99);
    }
    track("stage_completed", stages[stageIndex]);
    setStep(step + 1);
  };
  const back = () => {
    if (showResult) return setStep(lastStep);
    if (step === 2 && a.route !== "label") return setStep(0);
    setStep(Math.max(0, step - 1));
  };

  if (showResult) {
    return <ResultScreen assessment={{ ...current, result: current.result ?? evaluateFabricSafety(a) }} onEdit={(s) => setStep(s)} onExit={() => { clearCurrent(); setStep(0); }} onGoStains={() => navigate("/stain-master")} />;
  }

  return (
    <div className="space-y-4 px-4 pb-28 pt-4">
      {/* progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {stageIndex + 1} of {stages.length + 1}: {stages[stageIndex]}</span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} aria-label={`Assessment progress ${pct}%`} />
      </div>

      {step === 0 && (
        <StepShell title="Which route?" hint="You can change this later.">
          <div className="grid gap-2">
            {(["label", "no_label", "unclear"] as LabelRoute[]).map((r) => (
              <Chip key={r} selected={a.route === r} onClick={() => set({ route: r }, "route")}>
                {r === "label" ? "Care label available" : r === "no_label" ? "No care label" : "Label is unclear"}
              </Chip>
            ))}
          </div>
        </StepShell>
      )}

      {step === 1 && a.route === "label" && (
        <StepShell title="Care label photographs" hint="Place the label on a flat surface. Use good lighting. Keep all text and symbols visible. Avoid blur, glare and cropped edges. Photograph both sides when printing appears on both sides.">
          <div className="space-y-2">
            {[
              ["fibre_composition_label", "Fibre-composition label"],
              ["care_symbol_label", "Care-symbol label"],
              ["garment_front", "Front of the garment"],
              ["garment_back", "Back of the garment"],
            ].map(([kind, label]) => (
              <PhotoCapture
                key={kind}
                label={label}
                value={a.photos[kind]}
                onChange={(d) => set({ photos: { ...a.photos, [kind]: d } }, `photo ${kind}`)}
                onRemove={() => removePhoto(current.id, kind)}
              />
            ))}
          </div>

          <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-sm font-semibold">What does the label say?</p>
            <p className="text-xs text-muted-foreground">
              Type what you can read. Nothing is treated as confirmed until you review it below.
            </p>
            {([
              ["fibres", "Fibre names and percentages"],
              ["washing", "Washing restrictions"],
              ["bleaching", "Bleaching restrictions"],
              ["drying", "Drying restrictions"],
              ["ironing", "Ironing temperature"],
              ["professionalCare", "Dry-cleaning / wet-cleaning / professional care"],
              ["warnings", "Manufacturer warnings"],
              ["language", "Label language"],
            ] as const).map(([k, label]) => (
              <div key={k}>
                <label className="text-xs font-medium text-muted-foreground" htmlFor={`lbl-${k}`}>{label}</label>
                <Input
                  id={`lbl-${k}`}
                  value={a.extracted?.[k] ?? ""}
                  onChange={(e) => {
                    const base = a.extracted ?? { fibres: "", washing: "", bleaching: "", drying: "", ironing: "", professionalCare: "", warnings: "", language: "", confidence: 0, unresolved: [] };
                    const nextEx = { ...base, [k]: e.target.value };
                    const filled = (["fibres", "washing", "bleaching", "drying", "ironing"] as const).filter((f) => nextEx[f]?.trim()).length;
                    set({ extracted: { ...nextEx, confidence: Math.round((filled / 5) * 100) } }, "label field");
                  }}
                />
              </div>
            ))}
          </div>

          {a.extracted?.fibres && (
            <Card className="space-y-3 p-4">
              <p className="text-sm font-semibold">The label appears to say:</p>
              <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                {[a.extracted.fibres, a.extracted.professionalCare, a.extracted.bleaching, a.extracted.ironing, a.extracted.washing, a.extracted.drying, a.extracted.warnings]
                  .filter(Boolean)
                  .map((line, i) => <li key={i}>{line}</li>)}
              </ul>
              <p className="text-xs text-muted-foreground">Reading confidence: {a.extracted.confidence}%</p>
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" variant={a.labelConfirmation === "correct" ? "default" : "outline"} onClick={() => set({ labelConfirmation: "correct" }, "label confirmed")}>Correct</Button>
                <Button size="sm" variant={a.labelConfirmation === "edited" ? "default" : "outline"} onClick={() => { set({ labelConfirmation: "edited" }, "label edited"); toast.info("Edit the fields above, then choose Correct."); }}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant={a.labelConfirmation === "cannot_confirm" ? "default" : "outline"} onClick={() => { set({ labelConfirmation: "cannot_confirm", route: "unclear" }, "cannot confirm label"); toast.warning("Moved to the Label Unclear route. Nothing is lost."); }}>
                  Cannot confirm
                </Button>
              </div>
              {(a.extracted.confidence < 60) && (
                <p className="flex items-start gap-1.5 text-xs text-amber-700" role="status">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Reading confidence is low. This case will be treated as Label Unclear.
                </p>
              )}
            </Card>
          )}
        </StepShell>
      )}

      {step === 2 && (
        <StepShell
          title="What kind of garment is it?"
          hint={a.route === "label" ? undefined : "We may not be able to identify the exact fibre, but we can still determine the safest risk group."}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={garmentSearch} onChange={(e) => setGarmentSearch(e.target.value)} placeholder="Search garment type" className="pl-9" aria-label="Search garment type" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {GARMENT_TYPES.filter((g) => g.toLowerCase().includes(garmentSearch.toLowerCase())).map((g) => (
              <Chip key={g} selected={a.garmentType === g} onClick={() => set({ garmentType: g }, "garment type")}>{g}</Chip>
            ))}
          </div>
          {a.garmentType === "Other" && (
            <Input value={a.garmentTypeOther} onChange={(e) => set({ garmentTypeOther: e.target.value })} placeholder="Describe the garment" aria-label="Describe the garment" />
          )}
        </StepShell>
      )}

      {step === 3 && (
        <StepShell title="How has this garment been cleaned successfully before?" hint="Previous cleaning history is supporting evidence only. It never guarantees compatibility.">
          <div className="grid grid-cols-2 gap-2">
            {CLEANING_HISTORY.map((h) => (
              <Chip key={h} selected={a.cleaningHistory.includes(h)} onClick={() => toggle("cleaningHistory", h)}>{h}</Chip>
            ))}
          </div>
          {a.cleaningHistory.some((h) => !["Never cleaned", "Not known"].includes(h)) && (
            <div className="space-y-2 pt-1">
              {HISTORY_FOLLOWUPS.map((f) => (
                <YesNo key={f.key} label={f.label} value={a.historyFollowups[f.key]} onChange={(v) => set({ historyFollowups: { ...a.historyFollowups, [f.key]: v } }, f.key)} />
              ))}
            </div>
          )}
        </StepShell>
      )}

      {step === 4 && (
        <StepShell title="How does the fabric look and feel?" hint="Choose everything that applies. Appearance suggests possibilities — it never confirms a fibre.">
          <div className="grid grid-cols-2 gap-2">
            {FABRIC_APPEARANCE.map((f) => (
              <Chip key={f.key} selected={a.appearance.includes(f.key)} onClick={() => toggle("appearance", f.key)}>
                <span className="mr-1.5" aria-hidden>{f.emoji}</span>{f.key}
              </Chip>
            ))}
          </div>
        </StepShell>
      )}

      {step === 5 && (
        <StepShell title="Which best describes the garment colour?">
          <div className="grid grid-cols-2 gap-2">
            {COLOUR_OPTIONS.map((c) => (
              <Chip key={c} selected={a.colours.includes(c)} onClick={() => toggle("colours", c)}>{c}</Chip>
            ))}
          </div>
          <div className="space-y-2 pt-1">
            {COLOUR_FLAGS.map((f) => (
              <YesNo key={f.key} label={f.label} value={a.colourFlags[f.key]} onChange={(v) => set({ colourFlags: { ...a.colourFlags, [f.key]: v } }, f.key)} />
            ))}
          </div>
        </StepShell>
      )}

      {step === 6 && (
        <StepShell title="Construction and decoration" hint="Select everything you can see.">
          <div className="grid grid-cols-2 gap-2">
            {CONSTRUCTION_OPTIONS.map((c) => (
              <Chip key={c} selected={a.construction.includes(c)} onClick={() => toggle("construction", c)}>{c}</Chip>
            ))}
          </div>
          <YesNo label="Does the stain touch any of these features?" value={a.stainTouchesFeature ?? undefined} onChange={(v) => set({ stainTouchesFeature: v }, "stain touches feature")} />
        </StepShell>
      )}

      {step === 7 && (
        <StepShell title="Is there any existing damage?" hint="Inspect the garment in good light before answering.">
          <div className="grid grid-cols-2 gap-2">
            {DAMAGE_OPTIONS.map((d) => (
              <Chip key={d} selected={a.damage.includes(d)} onClick={() => toggle("damage", d)}>{d}</Chip>
            ))}
          </div>
          {a.damage.some((d) => !["No visible damage", "Not sure"].includes(d)) && (
            <PhotoCapture
              label="Photograph of the existing damage"
              hint="This helps a reviewer confirm the damage."
              value={a.photos.existing_damage}
              onChange={(d) => set({ photos: { ...a.photos, existing_damage: d } }, "damage photo")}
              onRemove={() => removePhoto(current.id, "existing_damage")}
            />
          )}
        </StepShell>
      )}

      {step === 8 && (
        <StepShell title="Would damage to this garment be especially serious?">
          <div className="grid grid-cols-2 gap-2">
            {IMPORTANCE_OPTIONS.map((i) => (
              <Chip key={i} selected={a.importance.includes(i)} onClick={() => toggle("importance", i)}>{i}</Chip>
            ))}
          </div>
        </StepShell>
      )}

      {stages[stageIndex] === "Professional Tests" && (
        <ProfessionalTests assessment={current} onAdd={(t) => addTest(current.id, t)} />
      )}

      {stages[stageIndex] === "Review Answers" && (
        <StepShell title="Review your answers" hint="Tap any section to edit. Nothing is lost when you go back.">
          <ReviewList answers={a} onEdit={setStep} />
        </StepShell>
      )}

      {/* nav */}
      <div className="flex items-center gap-2 pt-2">
        <Button variant="outline" onClick={back} aria-label="Back"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Button className="flex-1" onClick={next}>
          {stages[stageIndex] === "Review Answers" ? "See fabric safety result" : "Continue"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="flex-1" onClick={() => { clearCurrent(); toast.success("Saved. You can continue this assessment later."); setStep(0); }}>
          <Save className="h-4 w-4" /> Save and continue later
        </Button>
        <Button variant="ghost" size="sm" className="flex-1" onClick={() => { clearCurrent(); setStep(0); navigate("/stain-master"); }}>
          Exit safely
        </Button>
      </div>
    </div>
  );
}

function EntryButton({ icon: Icon, title, desc, onClick }: { icon: typeof Camera; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-elevated">
      <span className="rounded-full bg-primary/10 p-2.5"><Icon className="h-5 w-5 text-primary" aria-hidden /></span>
      <span className="flex-1">
        <span className="block text-base font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
    </button>
  );
}

function StepShell({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-lg font-bold leading-tight">{title}</legend>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      {children}
    </fieldset>
  );
}

function ReviewList({ answers, onEdit }: { answers: FabricAnswers; onEdit: (step: number) => void }) {
  const rows: [string, string, number][] = [
    ["Label route", answers.route === "label" ? "Care label available" : answers.route === "no_label" ? "No care label" : "Label unclear", 0],
    ["Care label", answers.extracted?.fibres || "Not recorded", 1],
    ["Garment type", answers.garmentType || "Not answered", 2],
    ["Cleaning history", answers.cleaningHistory.join(", ") || "Not answered", 3],
    ["Fabric appearance", answers.appearance.join(", ") || "Not answered", 4],
    ["Colour", [...answers.colours, ...Object.entries(answers.colourFlags).filter(([, v]) => v).map(([k]) => k)].join(", ") || "Not answered", 5],
    ["Construction", answers.construction.join(", ") || "Not answered", 6],
    ["Existing damage", answers.damage.join(", ") || "Not answered", 7],
    ["Importance", answers.importance.join(", ") || "Not answered", 8],
  ];
  return (
    <div className="space-y-2">
      {rows.map(([label, value, step]) => (
        <button key={label} onClick={() => onEdit(step)} className="flex w-full items-start justify-between gap-3 rounded-xl border border-border bg-card p-3 text-left hover:border-primary">
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            <span className="block text-sm">{value}</span>
          </span>
          <Pencil className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      ))}
    </div>
  );
}

function ProfessionalTests({ assessment, onAdd }: { assessment: Assessment; onAdd: (t: Omit<import("@/store/useFabricCheck").CompatibilityTest, "id" | "performedAt">) => void }) {
  const role = assessment.answers.role;
  const [form, setForm] = useState({
    testType: "", location: "", medium: "", methodSource: "", result: "",
    colourTransfer: "", textureChange: "", distortion: "", ringFormation: "",
    operator: "", decision: "",
  });
  const allowed = PROFESSIONAL_TESTS.filter((t) => t.roles.includes(role));

  return (
    <StepShell title="Professional compatibility tests" hint="Optional. Record only tests you actually performed.">
      <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span>{PRODUCT_INSTRUCTION_FALLBACK} Stain Master does not give quantities, dilutions, contact times or temperatures unless they come from approved manufacturer documentation.</span>
      </div>
      <div className="grid gap-2">
        {allowed.map((t) => (
          <Chip key={t.key} selected={form.testType === t.label} onClick={() => setForm({ ...form, testType: t.label })}>{t.label}</Chip>
        ))}
      </div>
      {form.testType && (
        <div className="space-y-2">
          {([
            ["location", "Test location (e.g. inside seam)"],
            ["medium", "Product or medium used"],
            ["methodSource", "Method source (label, TDS, in-house SOP)"],
            ["result", "Result"],
            ["colourTransfer", "Colour transfer observed"],
            ["textureChange", "Texture change observed"],
            ["distortion", "Distortion observed"],
            ["ringFormation", "Ring formation observed"],
            ["operator", "Operator"],
          ] as const).map(([k, label]) => (
            <div key={k}>
              <label className="text-xs font-medium text-muted-foreground" htmlFor={`t-${k}`}>{label}</label>
              <Input id={`t-${k}`} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <Textarea placeholder="Decision" value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })} aria-label="Decision" />
          <Button
            onClick={() => {
              onAdd(form);
              setForm({ ...form, testType: "", result: "", decision: "" });
              toast.success("Test recorded.");
            }}
          >
            Record test
          </Button>
        </div>
      )}
      {assessment.tests.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recorded tests</p>
          {assessment.tests.map((t) => (
            <Card key={t.id} className="p-3 text-sm">
              <p className="font-semibold">{t.testType}</p>
              <p className="text-xs text-muted-foreground">{new Date(t.performedAt).toLocaleString()} · {t.operator || "Operator not recorded"}</p>
              <p className="text-xs">{t.result}</p>
            </Card>
          ))}
        </div>
      )}
    </StepShell>
  );
}

/* ---------------- Result ---------------- */

export function ResultScreen({ assessment, onEdit, onExit, onGoStains }: { assessment: Assessment; onEdit: (step: number) => void; onExit: () => void; onGoStains: () => void }) {
  const a = assessment.answers;
  const r = assessment.result!;
  const risk = assessment.adminOverride?.riskLevel ?? r.riskLevel;
  const gate = assessment.adminOverride?.gate ?? r.gate;
  const style = RISK_STYLE[risk];
  const Icon = style.icon;
  const blocked = gate.startsWith("blocked") || gate === "specialist_material_route";

  const nextAction = useMemo(() => {
    if (gate === "proceed") return "Continue to Stain Identification";
    if (gate === "proceed_with_testing") return "Professional Compatibility Test Required";
    if (gate === "professional_only") return "Experienced Professional Assessment Required";
    return "Do Not Apply Chemicals Yet";
  }, [gate]);

  return (
    <div className="space-y-4 px-4 pb-28 pt-4">
      <h1 className="text-2xl font-bold">Fabric Safety Result</h1>
      <p className="text-xs text-muted-foreground">Assessment {assessment.id} · version {assessment.version} · rules {r.rulesVersion}</p>

      {/* A: fabric understanding */}
      <Card className="space-y-2 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">A. Fabric understanding</h2>
        <dl className="space-y-1 text-sm">
          <Row k="Garment type" v={a.garmentType === "Other" ? a.garmentTypeOther || "Other" : a.garmentType || "Not answered"} />
          <Row k="Label status" v={a.route === "label" ? (a.labelConfirmation === "correct" ? "Label read and confirmed" : "Label present, not confirmed") : a.route === "no_label" ? "No care label" : "Label unclear"} />
          {a.labelConfirmation === "correct" && a.extracted?.fibres && <Row k="Confirmed fibres" v={a.extracted.fibres} />}
          {r.suspectedMaterialFamily && <Row k="Suspected material family" v={r.suspectedMaterialFamily} />}
          <Row k="Colour" v={a.colours.join(", ") || "Not answered"} />
          <Row k="Construction" v={a.construction.join(", ") || "None reported"} />
          <Row k="Previous cleaning" v={a.cleaningHistory.join(", ") || "Not answered"} />
          <Row k="Existing damage" v={a.damage.join(", ") || "Not answered"} />
        </dl>
      </Card>

      {/* B: confidence */}
      <Card className="space-y-1 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">B. Fabric identification confidence</h2>
        <p className="text-lg font-bold capitalize">{r.confidence}</p>
        <p className="text-sm text-muted-foreground">{r.confidenceReason}</p>
        <p className="text-xs text-muted-foreground">Confidence is separate from risk. High confidence does not mean low risk.</p>
      </Card>

      {/* C: risk */}
      <Card className={`space-y-2 border p-4 ${style.chip}`}>
        <h2 className="text-sm font-semibold uppercase tracking-wider opacity-80">C. Garment-damage risk</h2>
        <p className="flex items-center gap-2 text-lg font-bold">
          <Icon className="h-5 w-5" aria-hidden /> {style.word} — {riskWord(risk)}
        </p>
        <p className="text-sm">{assessment.adminOverride?.reason ?? r.riskReason}</p>
        <p className="text-xs opacity-80">Group {r.riskGroup.replace("group_", "").toUpperCase()} · score {r.score}</p>
      </Card>

      {/* D: damage risks */}
      {r.damageRisks.length > 0 && (
        <Card className="space-y-2 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">D. Main damage risks</h2>
          <div className="flex flex-wrap gap-1.5">
            {r.damageRisks.map((d) => <Badge key={d} variant="secondary">{d}</Badge>)}
          </div>
        </Card>
      )}

      {/* explainability */}
      <Card className="space-y-2 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Why this result</h2>
        {r.overrides.length > 0 && (
          <ul className="space-y-1 text-sm">
            {r.overrides.map((o) => (
              <li key={o.key} className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                <span>Mandatory {o.level} rule: {o.label}</span>
              </li>
            ))}
          </ul>
        )}
        <ul className="space-y-1 text-sm text-muted-foreground">
          {r.factors.map((f) => <li key={f.key}>• {f.label} (+{f.weight})</li>)}
          {r.factors.length === 0 && <li>• No risk-increasing condition reported.</li>}
        </ul>
      </Card>

      {/* E: next action */}
      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">E. Next action</h2>
        <p className="text-base font-bold">{nextAction}</p>
        <p className="text-xs text-muted-foreground">Treatment gate: {gate.replace(/_/g, " ")}</p>
        {gate === "proceed" || gate === "proceed_with_testing" || gate === "professional_only" ? (
          <Button className="w-full" onClick={onGoStains}>Continue to Stain Identification <ArrowRight className="h-4 w-4" /></Button>
        ) : (
          <Button className="w-full" variant="outline" disabled>Treatment guidance is blocked</Button>
        )}
        <p className="text-xs text-muted-foreground">No stain-removal product is recommended at this stage.</p>
      </Card>

      {/* F: safety message */}
      {risk === "black" && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{BLACK_SAFETY_MESSAGE}</span>
        </div>
      )}
      {blocked && gate === "specialist_material_route" && (
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
          This material needs a specialist route (leather, suede, fur, coated or laminated). Refer it to a specialist cleaner.
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => onEdit(2)}>Edit answers</Button>
        <Button variant="ghost" className="flex-1" onClick={onExit}>Done</Button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="max-w-[60%] text-right font-medium">{v}</dd>
    </div>
  );
}
