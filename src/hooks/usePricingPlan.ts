import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FALLBACK_PLAN, PLAN_CODE, type PricingPlan } from "@/config/pricing";

/** Reads the single authoritative pricing record. */
export function usePricingPlan() {
  const [plan, setPlan] = useState<PricingPlan>(FALLBACK_PLAN);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("pricing_plans")
          .select("*")
          .eq("plan_code", PLAN_CODE)
          .eq("is_active", true)
          .maybeSingle();
        if (error) throw error;
        if (cancelled) return;
        if (data) {
          setPlan({
            planCode: data.plan_code,
            planName: data.plan_name,
            listPriceMinor: Number(data.list_price_minor),
            offerPriceMinor: Number(data.offer_price_minor),
            currency: data.currency,
            accessPeriodDays: data.access_period_days,
            taxRatePercent: Number(data.tax_rate_percent),
            taxLabel: data.tax_label,
          });
        }
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

  return { plan, loading, unavailable };
}
