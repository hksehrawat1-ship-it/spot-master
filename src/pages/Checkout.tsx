import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ReceiptText, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { usePricingPlan } from "@/hooks/usePricingPlan";
import { useEntitlement } from "@/hooks/useEntitlement";
import {
  accessPeriodLabel,
  formatMoney,
  netFromInclusive,
  savingsMinor,
  savingsPercent,
  taxFromInclusive,
} from "@/config/pricing";
import { providerForCurrency } from "@/config/payments";
import StatusNotice from "@/components/system/StatusNotice";
import type { PricingPlan } from "@/config/pricing";

type Coupon = { code: string; discount_type: string; discount_value_minor: number; discount_percent: number | null };

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { monthly, annual, unavailable } = usePricingPlan();
  const { state: access, refresh } = useEntitlement();

  const [planChoice, setPlanChoice] = useState<"monthly" | "annual">("annual");
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [checking, setChecking] = useState(false);
  const [placing, setPlacing] = useState(false);

  const plan: PricingPlan = planChoice === "monthly" ? monthly : annual;

  const amounts = useMemo(() => {
    // Tax-inclusive: the offer price IS what the customer pays.
    const base = plan.offerPriceMinor;
    let discount = 0;
    if (coupon) {
      discount =
        coupon.discount_type === "percent" && coupon.discount_percent
          ? Math.round((base * coupon.discount_percent) / 100)
          : coupon.discount_value_minor;
    }
    const total = Math.max(0, base - discount);
    const tax = taxFromInclusive(total, plan.taxRatePercent);
    const net = netFromInclusive(total, plan.taxRatePercent);
    return { base, discount, net, tax, total };
  }, [plan, coupon]);

  const provider = providerForCurrency(plan.currency);

  const applyCoupon = async () => {
    const entered = code.trim().toUpperCase();
    if (!entered) return;
    setChecking(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("code, discount_type, discount_value_minor, discount_percent, valid_until, is_active")
      .eq("code", entered)
      .eq("is_active", true)
      .maybeSingle();
    setChecking(false);
    if (error) return toast.error("We could not check that code just now.");
    if (!data || (data.valid_until && new Date(data.valid_until) < new Date()))
      return toast.error("That code is not valid.");
    setCoupon(data as Coupon);
    toast.success("Coupon applied.");
  };

  const placeOrder = async () => {
    if (!user) return navigate("/sign-in", { state: { from: "/checkout" } });
    setPlacing(true);
    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      plan_code: plan.planCode,
      currency: plan.currency,
      list_price_minor: plan.listPriceMinor,
      offer_price_minor: plan.offerPriceMinor,
      discount_minor: amounts.discount,
      tax_minor: amounts.tax,
      total_minor: amounts.total,
      coupon_code: coupon?.code ?? null,
      provider,
      status: "awaiting_payment",
    } as never);
    setPlacing(false);
    if (error) return toast.error("We could not start this order. Please try again.");
    toast.success("Order recorded. Complete payment to activate access.");
    await refresh();
  };

  if (access === "active") {
    return (
      <div className="sm-container max-w-2xl py-10">
        <h1>Your access is active</h1>
        <StatusNotice tone="proceed" className="mt-6" title="No payment is needed right now">
          You already have professional access on this account.
        </StatusNotice>
        <Link to="/home" className="sm-btn-primary mt-6">
          Go to your workspace
        </Link>
      </div>
    );
  }

  const annualDiscount = savingsPercent(annual);

  return (
    <div className="sm-container max-w-2xl py-10">
      <h1>Checkout</h1>
      <p className="mt-2 text-muted-foreground">Stain Master · Founding price, taxes included</p>

      {unavailable && (
        <StatusNotice tone="caution" className="mt-6" title="Live pricing could not be confirmed">
          The amounts below may not be current. Please retry before paying.
        </StatusNotice>
      )}

      {/* Plan selector */}
      <section className="sm-card mt-6" aria-labelledby="plan">
        <h2 id="plan" className="text-lg">
          Choose your plan
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <PlanOption
            selected={planChoice === "monthly"}
            onSelect={() => setPlanChoice("monthly")}
            title="Monthly"
            price={formatMoney(monthly.offerPriceMinor, monthly.currency)}
            per="/ month"
            note={`${monthly.taxLabel} included · ${accessPeriodLabel(monthly)}`}
          />
          <PlanOption
            selected={planChoice === "annual"}
            onSelect={() => setPlanChoice("annual")}
            title="Annual (Founding)"
            price={formatMoney(annual.offerPriceMinor, annual.currency)}
            per="/ year"
            note={`Save ${annualDiscount}% · ${annual.taxLabel} included`}
            badge={`Best value · save ${annualDiscount}%`}
            strike={formatMoney(annual.listPriceMinor, annual.currency)}
          />
        </div>
      </section>

      <section className="sm-card mt-4" aria-labelledby="summary">
        <h2 id="summary" className="text-lg">
          Order summary
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Plan" value={plan.planName} />
          <Row label="List price" value={formatMoney(plan.listPriceMinor, plan.currency)} strike />
          <Row label="Offer price" value={formatMoney(amounts.base, plan.currency)} />
          <Row label="You save" value={formatMoney(savingsMinor(plan), plan.currency)} tone="proceed" />
          {amounts.discount > 0 && (
            <Row label={`Coupon ${coupon?.code}`} value={`− ${formatMoney(amounts.discount, plan.currency)}`} />
          )}
          <Row
            label={`${plan.taxLabel} included${plan.taxRatePercent ? ` (${plan.taxRatePercent}%)` : ""}`}
            value={formatMoney(amounts.tax, plan.currency)}
          />
          <div className="flex items-baseline justify-between border-t border-border pt-3 text-base font-semibold text-navy">
            <dt>Total payable</dt>
            <dd>{formatMoney(amounts.total, plan.currency)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-muted-foreground">{accessPeriodLabel(plan)} from the day payment is verified.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Founding price is guaranteed for the first 12 months. Renewals are at the then-current price — no lifetime
          price protection.
        </p>
      </section>

      <section className="sm-card mt-4" aria-labelledby="coupon">
        <h2 id="coupon" className="text-lg">
          Coupon code
        </h2>
        <div className="mt-3 flex gap-2">
          <label htmlFor="coupon-code" className="sr-only">
            Coupon code
          </label>
          <input
            id="coupon-code"
            className="sm-field flex-1"
            value={code}
            maxLength={32}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Optional"
          />
          <button type="button" className="sm-btn-secondary" disabled={checking} onClick={() => void applyCoupon()}>
            {checking ? "Checking…" : "Apply"}
          </button>
        </div>
      </section>

      <StatusNotice tone="caution" className="mt-4" title="Payment provider not yet connected">
        This account is set up for {provider === "cashfree" ? "Cashfree (India)" : "Stripe (international)"}, but the
        provider credentials have not been supplied yet, so no card or UPI payment can be taken. Place the order below
        and our team will contact you to complete payment.
      </StatusNotice>

      <button type="button" onClick={() => void placeOrder()} disabled={placing} className="sm-btn-primary mt-6 w-full">
        <Lock aria-hidden className="h-4 w-4" /> {placing ? "Recording your order…" : "Place order"}
      </button>

      <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
        <ReceiptText aria-hidden className="mt-0.5 h-4 w-4 flex-none" />
        A {plan.taxLabel} invoice is issued once payment is verified. See the{" "}
        <Link to="/legal/refund" className="text-primary underline">
          refund policy
        </Link>
        .
      </p>
    </div>
  );
}

function PlanOption({
  selected,
  onSelect,
  title,
  price,
  per,
  note,
  badge,
  strike,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  price: string;
  per: string;
  note: string;
  badge?: string;
  strike?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative rounded-[var(--radius)] border p-4 text-left transition-[var(--transition-base)] ${
        selected ? "border-primary bg-secondary shadow-[var(--shadow-card)]" : "border-border bg-surface hover:border-primary/40"
      }`}
    >
      {badge && (
        <span className="absolute -top-2.5 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground shadow-sm">
          <Sparkles aria-hidden className="h-3 w-3" /> {badge}
        </span>
      )}
      <div className="flex items-center gap-2">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
          }`}
        >
          {selected && <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />}
        </span>
        <span className="font-semibold text-navy">{title}</span>
      </div>
      <div className="mt-3 flex items-end gap-1.5">
        {strike && <span className="text-sm text-muted-foreground line-through">{strike}</span>}
        <span className="text-2xl font-bold text-navy">{price}</span>
        <span className="pb-1 text-xs text-muted-foreground">{per}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </button>
  );
}

function Row({
  label,
  value,
  strike,
  tone,
}: {
  label: string;
  value: string;
  strike?: boolean;
  tone?: "proceed";
}) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={[strike ? "line-through text-muted-foreground" : "", tone === "proceed" ? "text-proceed font-medium" : ""].join(" ")}>
        {value}
      </dd>
    </div>
  );
}
