import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  FALLBACK_ANNUAL,
  FALLBACK_INTL_ANNUAL,
  FALLBACK_MONTHLY,
  INTL_ANNUAL_PLAN_CODE,
  MONTHLY_PLAN_CODE,
  PLAN_CODE,
  type PricingPlan,
} from "@/config/pricing";

type PlanRow = {
  plan_code: string;
  plan_name: string;
  list_price_minor: number;
  offer_price_minor: number;
  currency: string;
  access_period_days: number;
  tax_rate_percent: number;
  tax_label: string;
  tax_inclusive: boolean;
};

function toPlan(r: PlanRow): PricingPlan {
  return {
    planCode: r.plan_code,
    planName: r.plan_name,
    listPriceMinor: Number(r.list_price_minor),
    offerPriceMinor: Number(r.offer_price_minor),
    currency: r.currency,
    accessPeriodDays: r.access_period_days,
    taxRatePercent: Number(r.tax_rate_percent),
    taxLabel: r.tax_label,
    taxInclusive: Boolean(r.tax_inclusive),
  };
}

/** Reads the authoritative monthly, annual (INR) and international annual plans. */
export function usePricingPlan() {
  const [monthly, setMonthly] = useState<PricingPlan>(FALLBACK_MONTHLY);
  const [annual, setAnnual] = useState<PricingPlan>(FALLBACK_ANNUAL);
  const [intlAnnual, setIntlAnnual] = useState<PricingPlan>(FALLBACK_INTL_ANNUAL);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("pricing_plans")
          .select(
            "plan_code, plan_name, list_price_minor, offer_price_minor, currency, access_period_days, tax_rate_percent, tax_label, tax_inclusive",
          )
          .eq("is_active", true);
        if (error) throw error;
        if (cancelled) return;
        const byCode = new Map((data ?? []).map((r) => [r.plan_code, toPlan(r as PlanRow)]));
        if (byCode.get(MONTHLY_PLAN_CODE)) setMonthly(byCode.get(MONTHLY_PLAN_CODE)!);
        if (byCode.get(PLAN_CODE)) setAnnual(byCode.get(PLAN_CODE)!);
        if (byCode.get(INTL_ANNUAL_PLAN_CODE)) setIntlAnnual(byCode.get(INTL_ANNUAL_PLAN_CODE)!);
        setUnavailable(false);
      } catch {
        if (!cancelled) setUnavailable(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { monthly, annual, intlAnnual, loading, unavailable };
}
