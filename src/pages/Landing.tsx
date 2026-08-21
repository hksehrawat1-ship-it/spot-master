import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FlaskConical,
  Microscope,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePricingPlan } from "@/hooks/usePricingPlan";
import { accessPeriodLabel, formatMoney, perDayStatement, savingsMinor, savingsPercent, shortPrice } from "@/config/pricing";
import StatusNotice from "@/components/system/StatusNotice";

const BENEFITS = [
  {
    icon: Search,
    title: "Choose the stain",
    body: "Search common stains or browse clear stain categories.",
  },
  {
    icon: FlaskConical,
    title: "Choose your spotting kit",
    body: "Your selection is saved for future product-specific guidance. No product recommendation is shown until its mapping is approved.",
  },
  {
    icon: ShieldCheck,
    title: "Protect the garment",
    body: "Use fabric checks, concealed-area testing and clear stop conditions before treatment.",
  },
];

const LEVELS = [
  {
    icon: Store,
    title: "Retail Spotting",
    body: "Simple daily guidance for retail dry cleaners and wet-cleaning operators.",
  },
  {
    icon: ClipboardCheck,
    title: "Professional Spotting",
    body: "Detailed garment assessment, treatment stages and verified product instructions.",
  },
  {
    icon: Microscope,
    title: "Master Spotter",
    body: "Advanced diagnosis, technical evidence, chemistry pathways and product-transition controls.",
  },
];

const STEPS = [
  "Create your account",
  "Choose your working level and spotting kit",
  "Enter the stain and garment information",
  "Follow the verified safety-first pathway",
];

const FALLBACK_KITS = ["Seitz", "STAS", "Clean Craft", "Basic / domestic products"];

const PLAN_FEATURES = [
  "Full stain library with safety-first pathways",
  "Fabric checks and concealed-area testing",
  "Verified treatment stages and stop conditions",
  "Save cases, stains and treatment history",
];

export default function Landing() {
  const { annual, monthly, intlAnnual } = usePricingPlan();
  const [kits, setKits] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("companies")
          .select("company_name, display_name")
          .limit(24);
        if (error) throw error;
        const names = (data ?? [])
          .map((c) => c.display_name || c.company_name)
          .filter((n): n is string => Boolean(n));
        if (!cancelled) setKits(names.length ? Array.from(new Set(names)) : null);
      } catch {
        if (!cancelled) setKits(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const perDay = perDayStatement(annual);
  const shownKits = kits ?? FALLBACK_KITS;
  const annualDiscount = savingsPercent(annual);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-surface">
        <div className="sm-container grid gap-10 py-12 md:py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="sm-eyebrow inline-flex items-center gap-2">
              <Sparkles aria-hidden className="h-4 w-4" /> For dry cleaners and wet-cleaning professionals
            </span>
            <h1 className="mt-3">Identify the stain. Choose the safer next step.</h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
              Stain Master gives dry cleaners and wet-cleaning professionals simple, safety-first guidance based on
              the stain, garment and spotting kit they use.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-navy">
                <span className="text-lg font-bold text-primary">12</span>
                <span>categories</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-navy">
                <span className="text-lg font-bold text-primary">826</span>
                <span>stain records</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-proceed-surface px-3 py-1.5 text-sm font-bold text-proceed">
                <CheckCircle2 aria-hidden className="h-4 w-4" /> Safety-first stain guidance
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/register" className="sm-btn-primary">
                Start Stain Master <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
              <a href="#pricing" className="sm-btn-secondary">
                See pricing
              </a>
            </div>
          </div>

          <div className="sm-card bg-background p-5">
            <h2 className="text-lg">A dependable working instrument</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "Fabric checks and concealed-area testing before any chemistry",
                "Product-specific guidance will appear only after the selected kit has been verified and mapped",
                "Clear stop conditions when the garment is at risk",
                "Honest states when verified information is not available",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 flex-none text-teal" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="sm-container py-12" aria-labelledby="benefits-heading">
        <h2 id="benefits-heading" className="sr-only">
          What Stain Master does
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="sm-card">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              <h3 className="mt-3">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Working levels */}
      <section id="working-levels" className="border-y border-border bg-surface py-12">
        <div className="sm-container">
          <h2>Working levels</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Choose the level that matches the operator. You can change it at any time.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {LEVELS.map(({ icon: Icon, ...l }) => (
              <article key={l.title} className="sm-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
                  <Icon aria-hidden className="h-5 w-5" />
                </span>
                <h3 className="mt-3">{l.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{l.body}</p>
              </article>
            ))}
          </div>
          <Link to="/register" className="sm-btn-secondary mt-6">
            Explore the working levels
          </Link>
        </div>
      </section>

      {/* Supported kits */}
      <section id="supported-kits" className="sm-container py-12">
        <h2>Spotting kit libraries</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Product libraries being prepared. Manufacturer products are being documented separately. Approved
          stain-to-product guidance is not yet available.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {shownKits.map((name) => (
            <li key={name} className="sm-card text-center font-semibold text-navy">
              {name}
              <span className="mt-1 block text-xs font-medium text-muted-foreground">Library being prepared</span>
            </li>
          ))}
          <li className="sm-card text-center text-sm text-muted-foreground">
            More spotting-kit companies are onboarding.
          </li>
        </ul>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-border bg-surface py-12">
        <div className="sm-container">
          <h2>How it works</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step} className="sm-card">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-navy-foreground">
                  {index + 1}
                </span>
                <p className="mt-3 font-medium">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-border bg-surface py-14">
        <div className="sm-container">
          <div className="mx-auto max-w-3xl text-center">
            <span className="sm-eyebrow inline-flex items-center gap-2 text-proceed">
              <Sparkles aria-hidden className="h-4 w-4" /> Founding price — guaranteed for the first 12 months
            </span>
            <h2 className="mt-3">Simple, safety-first pricing</h2>
            <p className="mt-2 text-muted-foreground">
              Pay monthly or save with the annual plan. All prices include taxes — no lifetime lock-in.
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-2">
            {/* Monthly */}
            <article className="sm-card flex flex-col">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
                  <ClipboardList aria-hidden className="h-4 w-4" />
                </span>
                <h3 className="text-lg">Monthly</h3>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-bold text-navy">
                  {formatMoney(monthly.offerPriceMinor, monthly.currency)}
                </span>
                <span className="pb-1.5 text-sm text-muted-foreground">/ month</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {monthly.taxLabel} included · {accessPeriodLabel(monthly)} per billing cycle
              </p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 flex-none text-teal" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="sm-btn-secondary mt-6 w-full">
                Start monthly
              </Link>
            </article>

            {/* Annual — highlighted */}
            <article className="relative flex flex-col rounded-[var(--radius)] border-2 border-primary bg-background p-4 shadow-[var(--shadow-raised)]">
              <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-sm">
                <Sparkles aria-hidden className="h-3.5 w-3.5" /> Best value · save {annualDiscount}%
              </span>
              <div className="mt-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck aria-hidden className="h-4 w-4" />
                </span>
                <h3 className="text-lg">Annual (Founding)</h3>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-2">
                <span className="text-lg text-muted-foreground line-through">
                  {formatMoney(annual.listPriceMinor, annual.currency)}
                </span>
                <span className="text-4xl font-bold text-navy">
                  {formatMoney(annual.offerPriceMinor, annual.currency)}
                </span>
                <span className="pb-1.5 text-sm text-muted-foreground">/ year</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {annual.taxLabel} included · {accessPeriodLabel(annual)} · you save {formatMoney(savingsMinor(annual), annual.currency)}
              </p>
              {perDay && <p className="mt-3 text-sm text-muted-foreground">{perDay}</p>}
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 flex-none text-proceed" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="sm-btn-primary mt-6 w-full">
                Get Stain Master <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </article>
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground">
            International users:{" "}
            <span className="font-semibold text-navy">
              {shortPrice(intlAnnual.offerPriceMinor, intlAnnual.currency, "yr")}
            </span>{" "}
            plus applicable local taxes. Founding price is guaranteed for the first 12 months; renewals are at the
            then-current price — no lifetime price protection. See our{" "}
            <Link to="/legal/refund" className="text-primary underline">
              refund and cancellation policy
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Safety statement */}
      <section className="sm-container py-14">
        <StatusNotice tone="info" title="Safety statement">
          Stain Master is a decision-support and safety-guidance system. It does not guarantee complete stain removal.
          Fabric safety always takes priority.
        </StatusNotice>
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ClipboardList aria-hidden className="h-4 w-4" />
          Guidance is limited to approved, verified records. Where a record is not yet verified, Stain Master says so.
        </p>
      </section>
    </>
  );
}
