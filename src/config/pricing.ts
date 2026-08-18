/**
 * Single source of truth for Stain Master pricing.
 *
 * The authoritative record lives in the `pricing_plans` table; this file only
 * describes the plan code and a display fallback used before the record loads.
 * No other source file may restate a price.
 */

export const PLAN_CODE = "professional_access";

export type PricingPlan = {
  planCode: string;
  planName: string;
  /** Minor units (paise for INR). */
  listPriceMinor: number;
  offerPriceMinor: number;
  currency: string;
  accessPeriodDays: number;
  taxRatePercent: number;
  taxLabel: string;
};

/** Display fallback only. Never used to compute a payable amount. */
export const FALLBACK_PLAN: PricingPlan = {
  planCode: PLAN_CODE,
  planName: "Stain Master Professional Access",
  listPriceMinor: 1_800_000,
  offerPriceMinor: 800_000,
  currency: "INR",
  accessPeriodDays: 365,
  taxRatePercent: 18,
  taxLabel: "GST",
};

export function minorToMajor(minor: number): number {
  return minor / 100;
}

export function formatMoney(minor: number, currency = "INR", locale = "en-IN"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minorToMajor(minor));
}

export function savingsMinor(plan: PricingPlan): number {
  return Math.max(0, plan.listPriceMinor - plan.offerPriceMinor);
}

/** Per-day value statement is only honest for a one-year plan. */
export function perDayStatement(plan: PricingPlan): string | null {
  if (plan.accessPeriodDays < 360 || plan.accessPeriodDays > 370) return null;
  const perDay = Math.round(minorToMajor(plan.offerPriceMinor) / plan.accessPeriodDays);
  return `Professional guidance for approximately ${formatMoney(
    perDay * 100,
    plan.currency,
  )} per day—helping you protect garments, reduce costly mistakes and build customer trust.`;
}

export function accessPeriodLabel(plan: PricingPlan): string {
  if (plan.accessPeriodDays % 365 === 0) {
    const years = plan.accessPeriodDays / 365;
    return years === 1 ? "1 year of access" : `${years} years of access`;
  }
  return `${plan.accessPeriodDays} days of access`;
}
