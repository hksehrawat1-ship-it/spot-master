import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { usePricingPlan } from "@/hooks/usePricingPlan";
import { useEntitlement } from "@/hooks/useEntitlement";
import { accessPeriodLabel, formatMoney, savingsMinor } from "@/config/pricing";
import { providerForCurrency } from "@/config/payments";
import StatusNotice from "@/components/system/StatusNotice";

type Coupon = { code: string; discount_type: string; discount_value_minor: number; discount_percent: number | null };

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, unavailable } = usePricingPlan();
  const { state: access, refresh } = useEntitlement();

  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [checking, setChecking] = useState(false);
  const [placing, setPlacing] = useState(false);

  const amounts = useMemo(() => {
    const base = plan.offerPriceMinor;
    let discount = 0;
    if (coupon) {
      discount =
        coupon.discount_type === "percent" && coupon.discount_percent
          ? Math.round((base * coupon.discount_percent) / 100)
          : coupon.discount_value_minor;
    }
    const net = Math.max(0, base - discount);
    const tax = Math.round((net * plan.taxRatePercent) / 100);
    return { base, discount, net, tax, total: net + tax };
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

  return (
    <div className="sm-container max-w-2xl py-10">
      <h1>Checkout</h1>
      <p className="mt-2 text-muted-foreground">{plan.planName}</p>

      {unavailable && (
        <StatusNotice tone="caution" className="mt-6" title="Live pricing could not be confirmed">
          The amounts below may not be current. Please retry before paying.
        </StatusNotice>
      )}

      <section className="sm-card mt-6" aria-labelledby="summary">
        <h2 id="summary" className="text-lg">
          Order summary
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="List price" value={formatMoney(plan.listPriceMinor, plan.currency)} strike />
          <Row label="Offer price" value={formatMoney(amounts.base, plan.currency)} />
          <Row label="You save" value={formatMoney(savingsMinor(plan), plan.currency)} tone="proceed" />
          {amounts.discount > 0 && (
            <Row label={`Coupon ${coupon?.code}`} value={`− ${formatMoney(amounts.discount, plan.currency)}`} />
          )}
          <Row
            label={`${plan.taxLabel} (${plan.taxRatePercent}%)`}
            value={formatMoney(amounts.tax, plan.currency)}
          />
          <div className="flex items-baseline justify-between border-t border-border pt-3 text-base font-semibold text-navy">
            <dt>Total payable</dt>
            <dd>{formatMoney(amounts.total, plan.currency)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-muted-foreground">{accessPeriodLabel(plan)} from the day payment is verified.</p>
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
