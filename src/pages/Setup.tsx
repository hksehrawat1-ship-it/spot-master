import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useProfile, type WorkingLevel } from "@/hooks/useProfile";
import { LoadingState } from "@/components/system/StatusStates";
import StatusNotice from "@/components/system/StatusNotice";

const LEVELS: { value: WorkingLevel; title: string; body: string }[] = [
  { value: "retail", title: "Retail Spotting", body: "Simple daily guidance for counter and shop-floor work." },
  {
    value: "professional",
    title: "Professional Spotting",
    body: "Detailed assessment, treatment stages and verified product instructions.",
  },
  { value: "master", title: "Master Spotter", body: "Advanced diagnosis, chemistry pathways and evidence records." },
];

const KITS = ["Seitz", "STAS", "Clean Craft", "Kreussler", "Other professional kit", "Basic / domestic products"];
const UNITS = ["Millilitres and grams", "Ounces"];

const TOTAL_STEPS = 4;

export default function Setup() {
  const navigate = useNavigate();
  const { profile, loading, unavailable, save } = useProfile();

  const [step, setStep] = useState(1);
  const [level, setLevel] = useState<WorkingLevel>("retail");
  const [kits, setKits] = useState<string[]>([]);
  const [units, setUnits] = useState(UNITS[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setStep(Math.min(Math.max(profile.setup_step || 1, 1), TOTAL_STEPS));
    if (profile.working_level) setLevel(profile.working_level);
    if (profile.preferred_kits?.length) setKits(profile.preferred_kits);
    if (profile.measurement_units) setUnits(profile.measurement_units);
  }, [profile]);

  if (loading) return <LoadingState label="Loading your workspace…" />;

  if (unavailable) {
    return (
      <div className="sm-container max-w-xl py-10">
        <StatusNotice tone="stop" title="We could not confirm your workspace">
          Please check your connection and reload before continuing.
        </StatusNotice>
      </div>
    );
  }

  const persist = async (patch: Record<string, unknown>) => {
    setBusy(true);
    const res = await save(patch as never);
    setBusy(false);
    if (res.error) {
      toast.error(res.error);
      return false;
    }
    return true;
  };

  const next = async () => {
    if (step === 1 && !(await persist({ working_level: level, setup_step: 2 }))) return;
    if (step === 2) {
      if (kits.length === 0) return toast.error("Select at least one spotting kit.");
      if (!(await persist({ preferred_kits: kits, setup_step: 3 }))) return;
    }
    if (step === 3 && !(await persist({ measurement_units: units, setup_step: 4 }))) return;
    if (step === TOTAL_STEPS) {
      if (!(await persist({ setup_step: TOTAL_STEPS, setup_completed_at: new Date().toISOString() }))) return;
      toast.success("Workspace ready.");
      navigate("/home", { replace: true });
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  return (
    <div className="sm-container max-w-2xl py-10">
      <p className="sm-eyebrow">
        Step {step} of {TOTAL_STEPS}
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>

      {step === 1 && (
        <section className="mt-6">
          <h1>Choose your working level</h1>
          <p className="mt-2 text-muted-foreground">You can change this at any time from your account.</p>
          <div className="mt-5 space-y-3">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLevel(l.value)}
                aria-pressed={level === l.value}
                className={`sm-card-button ${level === l.value ? "border-primary ring-2 ring-primary/25" : ""}`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-semibold text-navy">{l.title}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{l.body}</span>
                  </span>
                  {level === l.value && <Check aria-hidden className="h-5 w-5 flex-none text-primary" />}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-6">
          <h1>Which spotting kits do you use?</h1>
          <p className="mt-2 text-muted-foreground">
            Guidance is limited to verified products from the kits you select.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {KITS.map((kit) => {
              const on = kits.includes(kit);
              return (
                <button
                  key={kit}
                  type="button"
                  onClick={() => setKits((k) => (on ? k.filter((x) => x !== kit) : [...k, kit]))}
                  aria-pressed={on}
                  className={`sm-card-button ${on ? "border-primary ring-2 ring-primary/25" : ""}`}
                >
                  <span className="flex items-center justify-between gap-3 font-medium">
                    {kit}
                    {on && <Check aria-hidden className="h-5 w-5 text-primary" />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-6">
          <h1>Measurement units</h1>
          <p className="mt-2 text-muted-foreground">Used when quantities are shown in treatment instructions.</p>
          <div className="mt-5 space-y-3">
            {UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnits(u)}
                aria-pressed={units === u}
                className={`sm-card-button ${units === u ? "border-primary ring-2 ring-primary/25" : ""}`}
              >
                <span className="flex items-center justify-between gap-3 font-medium">
                  {u}
                  {units === u && <Check aria-hidden className="h-5 w-5 text-primary" />}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="mt-6">
          <h1>Before you start</h1>
          <StatusNotice tone="stop" className="mt-4" title="Fabric safety takes priority over stain removal">
            Always test in a concealed area first and stop treatment at the first sign of colour loss or fibre damage.
          </StatusNotice>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Working level: {LEVELS.find((l) => l.value === level)?.title}</li>
            <li>Spotting kits: {kits.join(", ") || "None selected"}</li>
            <li>Units: {units}</li>
          </ul>
        </section>
      )}

      <div className="mt-8 flex gap-3">
        {step > 1 && (
          <button type="button" className="sm-btn-secondary" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft aria-hidden className="h-4 w-4" /> Back
          </button>
        )}
        <button type="button" className="sm-btn-primary flex-1" disabled={busy} onClick={() => void next()}>
          {step === TOTAL_STEPS ? "Enter my workspace" : "Continue"} <ArrowRight aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
