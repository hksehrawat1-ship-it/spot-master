/**
 * Single source of truth for Stain Master pricing.
 *
 * The authoritative records live in the `pricing_plans` table; this file only
 * describes the plan codes and display fallbacks used before the records load.
 * No other source file may restate a price.
 *
 * All stored prices are TAX-INCLUSIVE (the `tax_inclusive` column is true).
 * The displayed amount is the amount the customer pays; the tax component is
 * derived for invoice display, never added on top.
 *
 * No lifetime pricing or price-protection is offered. The launch label is a
 * "Founding price" guaranteed for the first 12 months only.
 */

/** Entitlement plan (annual INR). Subscriptions store this plan_code. */
export const PLAN_CODE = "professional_access";
export const MONTHLY_PLAN_CODE = "professional_access_monthly";
export const INTL_ANNUAL_PLAN_CODE = "professional_access_annual_usd";

export type PricingPlan = {
  planCode: string;
  planName: string;
  /** Minor units (paise for INR, cents for USD). Tax-inclusive. */
  listPriceMinor: number;
  offerPriceMinor: number;
  currency: string;
  accessPeriodDays: number;
  taxRatePercent: number;
  taxLabel: string;
  taxInclusive: boolean;
};

/** Display fallback only. Never used to compute a payable amount. */
export const FALLBACK_ANNUAL: PricingPlan = {
  planCode: PLAN_CODE,
  planName: "Stain Master — Annual (Founding)",
  listPriceMinor: 838800,
  offerPriceMinor: 699900,
  currency: "INR",
  accessPeriodDays: 365,
  taxRatePercent: 18,
  taxLabel: "GST",
  taxInclusive: true,
};

export const FALLBACK_MONTHLY: PricingPlan = {
  planCode: MONTHLY_PLAN_CODE,
  planName: "Stain Master — Monthly",
  listPriceMinor: 69900,
  offerPriceMinor: 69900,
  currency: "INR",
  accessPeriodDays: 30,
  taxRatePercent: 18,
  taxLabel: "GST",
  taxInclusive: true,
};

export const FALLBACK_INTL_ANNUAL: PricingPlan = {
  planCode: INTL_ANNUAL_PLAN_CODE,
  planName: "Stain Master — Annual (International)",
  listPriceMinor: 8988,
  offerPriceMinor: 7499,
  currency: "USD",
  accessPeriodDays: 365,
  taxRatePercent: 0,
  taxLabel: "Local taxes",
  taxInclusive: true,
};

export function minorToMajor(minor: number): number {
  return minor / 100;
}

export function formatMoney(minor: number, currency = "INR", locale = "en-IN"): string {
  const loc = currency.toUpperCase() === "USD" ? "en-US" : locale;
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency,
    maximumFractionDigits: currency.toUpperCase() === "USD" ? 2 : 0,
  }).format(minorToMajor(minor));
}

/** Short symbol-only prefix, e.g. "₹699/mo" or "$74.99/yr". */
export function shortPrice(minor: number, currency: string, per: "mo" | "yr"): string {
  const symbol = currency.toUpperCase() === "USD" ? "$" : "₹";
  const value =
    currency.toUpperCase() === "USD"
      ? (minor / 100).toFixed(2).replace(/\.00$/, "")
      : String(Math.round(minor / 100));
  return `${symbol}${value}/${per}`;
}

export function savingsMinor(plan: PricingPlan): number {
  return Math.max(0, plan.listPriceMinor - plan.offerPriceMinor);
}

/** Percentage discount vs the list (monthly-equivalent) price. */
export function savingsPercent(plan: PricingPlan): number {
  if (plan.listPriceMinor <= 0) return 0;
  return Math.round((savingsMinor(plan) / plan.listPriceMinor) * 1000) / 10;
}

/** Per-day value statement is only honest for a ~365-day plan. */
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
  if (plan.accessPeriodDays === 30) return "1 month of access";
  return `${plan.accessPeriodDays} days of access`;
}

/** Net (ex-tax) amount from a tax-inclusive total. */
export function netFromInclusive(totalMinor: number, ratePercent: number): number {
  return Math.round(totalMinor / (1 + ratePercent / 100));
}

/** Tax component of a tax-inclusive total. */
export function taxFromInclusive(totalMinor: number, ratePercent: number): number {
  return Math.max(0, totalMinor - netFromInclusive(totalMinor, ratePercent));
}
