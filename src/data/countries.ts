/** ISO country list with dialling codes and national-number length rules. */

export type Country = {
  code: string;
  name: string;
  dial: string;
  /** Accepted national-number lengths (digits, excluding the dialling code). */
  lengths: number[];
  flag: string;
};

export const COUNTRIES: Country[] = [
  { code: "IN", name: "India", dial: "+91", lengths: [10], flag: "🇮🇳" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", lengths: [9], flag: "🇦🇪" },
  { code: "AU", name: "Australia", dial: "+61", lengths: [9], flag: "🇦🇺" },
  { code: "BD", name: "Bangladesh", dial: "+880", lengths: [10], flag: "🇧🇩" },
  { code: "BR", name: "Brazil", dial: "+55", lengths: [10, 11], flag: "🇧🇷" },
  { code: "CA", name: "Canada", dial: "+1", lengths: [10], flag: "🇨🇦" },
  { code: "CH", name: "Switzerland", dial: "+41", lengths: [9], flag: "🇨🇭" },
  { code: "DE", name: "Germany", dial: "+49", lengths: [10, 11], flag: "🇩🇪" },
  { code: "DK", name: "Denmark", dial: "+45", lengths: [8], flag: "🇩🇰" },
  { code: "EG", name: "Egypt", dial: "+20", lengths: [10], flag: "🇪🇬" },
  { code: "ES", name: "Spain", dial: "+34", lengths: [9], flag: "🇪🇸" },
  { code: "FR", name: "France", dial: "+33", lengths: [9], flag: "🇫🇷" },
  { code: "GB", name: "United Kingdom", dial: "+44", lengths: [10], flag: "🇬🇧" },
  { code: "ID", name: "Indonesia", dial: "+62", lengths: [9, 10, 11], flag: "🇮🇩" },
  { code: "IE", name: "Ireland", dial: "+353", lengths: [9], flag: "🇮🇪" },
  { code: "IT", name: "Italy", dial: "+39", lengths: [9, 10], flag: "🇮🇹" },
  { code: "JP", name: "Japan", dial: "+81", lengths: [10], flag: "🇯🇵" },
  { code: "KE", name: "Kenya", dial: "+254", lengths: [9], flag: "🇰🇪" },
  { code: "KW", name: "Kuwait", dial: "+965", lengths: [8], flag: "🇰🇼" },
  { code: "LK", name: "Sri Lanka", dial: "+94", lengths: [9], flag: "🇱🇰" },
  { code: "MY", name: "Malaysia", dial: "+60", lengths: [9, 10], flag: "🇲🇾" },
  { code: "NG", name: "Nigeria", dial: "+234", lengths: [10], flag: "🇳🇬" },
  { code: "NL", name: "Netherlands", dial: "+31", lengths: [9], flag: "🇳🇱" },
  { code: "NP", name: "Nepal", dial: "+977", lengths: [10], flag: "🇳🇵" },
  { code: "NZ", name: "New Zealand", dial: "+64", lengths: [8, 9], flag: "🇳🇿" },
  { code: "OM", name: "Oman", dial: "+968", lengths: [8], flag: "🇴🇲" },
  { code: "PH", name: "Philippines", dial: "+63", lengths: [10], flag: "🇵🇭" },
  { code: "PK", name: "Pakistan", dial: "+92", lengths: [10], flag: "🇵🇰" },
  { code: "PL", name: "Poland", dial: "+48", lengths: [9], flag: "🇵🇱" },
  { code: "PT", name: "Portugal", dial: "+351", lengths: [9], flag: "🇵🇹" },
  { code: "QA", name: "Qatar", dial: "+974", lengths: [8], flag: "🇶🇦" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", lengths: [9], flag: "🇸🇦" },
  { code: "SE", name: "Sweden", dial: "+46", lengths: [7, 8, 9], flag: "🇸🇪" },
  { code: "SG", name: "Singapore", dial: "+65", lengths: [8], flag: "🇸🇬" },
  { code: "TH", name: "Thailand", dial: "+66", lengths: [9], flag: "🇹🇭" },
  { code: "TR", name: "Türkiye", dial: "+90", lengths: [10], flag: "🇹🇷" },
  { code: "US", name: "United States", dial: "+1", lengths: [10], flag: "🇺🇸" },
  { code: "VN", name: "Vietnam", dial: "+84", lengths: [9, 10], flag: "🇻🇳" },
  { code: "ZA", name: "South Africa", dial: "+27", lengths: [9], flag: "🇿🇦" },
];

export function findCountry(code: string | null | undefined): Country | undefined {
  if (!code) return undefined;
  return COUNTRIES.find((c) => c.code === code);
}

export function validateNationalNumber(country: Country, digits: string): string | null {
  const clean = digits.replace(/\D/g, "");
  if (!clean) return "Please enter your mobile number.";
  if (!country.lengths.includes(clean.length)) {
    const expected = country.lengths.join(" or ");
    return `A ${country.name} mobile number has ${expected} digits.`;
  }
  return null;
}

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "AUD", "SGD"] as const;
export const MEASUREMENT_UNITS = [
  { value: "metric", label: "Metric (ml, g, °C)" },
  { value: "imperial", label: "Imperial (fl oz, oz, °F)" },
] as const;
