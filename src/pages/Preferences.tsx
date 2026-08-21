import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { useProfile, type WorkingLevel } from "@/hooks/useProfile";
import { useKitCompanies, useCompanyProducts } from "@/hooks/useSpottingKits";
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

const UNITS = ["Millilitres and grams", "Ounces"];

/**
 * Stain Master working preferences. Everything here can be changed at any time
 * and is stored on the operator's server-side profile.
 */
export default function Preferences() {
  const navigate = useNavigate();
  const { profile, loading, unavailable, save } = useProfile();
  const companies = useKitCompanies();

  const [level, setLevel] = useState<WorkingLevel>("retail");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [kits, setKits] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [units, setUnits] = useState(UNITS[0]);
  const [busy, setBusy] = useState(false);

  const productsQuery = useCompanyProducts(companyId);

  useEffect(() => {
    if (!profile) return;
    if (profile.working_level) setLevel(profile.working_level);
    setKits(profile.preferred_kits ?? []);
    setProducts(profile.available_products ?? []);
    if (profile.measurement_units) setUnits(profile.measurement_units);
  }, [profile]);

  useEffect(() => {
    if (companyId || !companies.data?.length) return;
    const preferred = companies.data.find((c) => kits.includes(c.name));
    setCompanyId((preferred ?? companies.data[0]).id);
  }, [companies.data, companyId, kits]);

  const companyName = useMemo(
    () => companies.data?.find((c) => c.id === companyId)?.name ?? null,
    [companies.data, companyId],
  );

  if (loading) return <LoadingState label="Loading your preferences…" />;

  if (unavailable) {
    return (
      <div className="sm-container max-w-xl py-10">
        <StatusNotice tone="stop" title="We could not confirm your workspace">
          Please check your connection and reload before changing preferences.
        </StatusNotice>
      </div>
    );
  }

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  const onSave = async () => {
    setBusy(true);
    const res = await save({
      working_level: level,
      preferred_kits: kits,
      available_products: products,
      measurement_units: units,
    });
    setBusy(false);
    if (res.error) return toast.error(res.error);
    toast.success("Preferences saved.");
    navigate("/home");
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="sm-eyebrow">Stain Master setup</p>
        <h1 className="mt-1">Your working preferences</h1>
        <p className="mt-2 text-muted-foreground">
          Set your working level and the products you actually have on the bench. You can change these at any time.
        </p>
      </header>

      <section aria-labelledby="level">
        <h2 id="level">Working level</h2>
        <div className="mt-4 space-y-3">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setLevel(l.value)}
              aria-pressed={level === l.value}
              className={`sm-action-card w-full text-left ${level === l.value ? "border-primary ring-2 ring-primary/25" : ""}`}
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

      <section aria-labelledby="company">
        <h2 id="company">Which company's products do you use?</h2>
        <p className="mt-2 text-muted-foreground">
          Guidance is limited to verified products from the companies and kits you select.
        </p>

        {companies.isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading companies…</p>}
        {companies.isError && (
          <StatusNotice tone="stop" className="mt-4" title="We could not load the product companies">
            Please reconnect and try again.
          </StatusNotice>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {(companies.data ?? []).map((c) => {
            const selected = kits.includes(c.name);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCompanyId(c.id);
                  setKits((k) => toggle(k, c.name));
                }}
                aria-pressed={selected}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  selected ? "border-primary bg-secondary text-primary" : "border-border text-muted-foreground"
                } ${companyId === c.id ? "ring-2 ring-primary/25" : ""}`}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-navy">
            {companyName ? `${companyName} products you hold` : "Select a company to list its products"}
          </h3>
          {productsQuery.isLoading && <p className="mt-2 text-sm text-muted-foreground">Loading products…</p>}
          {productsQuery.data?.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">No verified products are listed for this company yet.</p>
          )}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(productsQuery.data ?? []).map((p) => {
              const on = products.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProducts((list) => toggle(list, p.id))}
                  aria-pressed={on}
                  className={`sm-action-card text-left ${on ? "border-primary ring-2 ring-primary/25" : ""}`}
                >
                  <span className="flex items-center justify-between gap-3 text-sm font-medium">
                    {p.name}
                    {on && <Check aria-hidden className="h-4 w-4 flex-none text-primary" />}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{products.length} product(s) selected in total.</p>
        </div>
      </section>

      <section aria-labelledby="units">
        <h2 id="units">Measurement units</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {UNITS.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnits(u)}
              aria-pressed={units === u}
              className={`sm-action-card ${units === u ? "border-primary ring-2 ring-primary/25" : ""}`}
            >
              <span className="flex items-center justify-between gap-3 font-medium">
                {u}
                {units === u && <Check aria-hidden className="h-5 w-5 text-primary" />}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="button" className="sm-btn-primary" disabled={busy} onClick={() => void onSave()}>
          <Save aria-hidden className="h-4 w-4" /> Save preferences
        </button>
        <Link to="/home" className="sm-btn-secondary">
          Cancel
        </Link>
      </div>
    </div>
  );
}
