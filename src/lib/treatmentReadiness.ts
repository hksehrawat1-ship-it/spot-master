/**
 * Step 4 — Collect Treatment-Changing Information.
 * Permanent principle: the stain name starts the assessment.
 * The treatment-changing conditions determine what is safe.
 *
 * NO product, chemical quantity, contact time, temperature, rinsing or
 * neutralization guidance is produced in this file.
 */

import type { GateStatus, RiskLevel, UserRoleKey } from "@/lib/fabricSafety";

export const READINESS_VERSION = "readiness-v1";

/* ------------------------------------------------------------------ */
/* Option lists (translation-ready plain language)                     */
/* ------------------------------------------------------------------ */

export const STAIN_AGE_OPTIONS = [
  "Happened within the last hour", "Happened today", "1–3 days old", "4–7 days old",
  "More than one week old", "More than one month old", "Old or recurring buildup", "Not known",
] as const;

const AGED_VALUES = ["More than one week old", "More than one month old", "Old or recurring buildup"];

export const CONDITION_OPTIONS = [
  "Still wet", "Damp", "Dried", "Hardened", "Crusty", "Sticky", "Oily", "Waxy",
  "Powdery", "Has a surface layer", "Has soaked through", "Has spread",
  "Has formed a ring", "Appears faded", "Appears darker", "Texture has changed", "Not sure",
] as const;

export const HEAT_OPTIONS = [
  "No", "Ironed", "Steamed", "Tumble-dried", "Dried in strong sunlight",
  "Washed in hot water", "Pressed professionally", "Exposed to a heater or flame", "Not known",
] as const;

export const HEAT_RESULT_OPTIONS = [
  "No visible change", "Stain became darker", "Stain became lighter", "Stain spread",
  "Stain hardened", "Ring appeared", "Fabric became shiny", "Texture changed",
  "Fabric melted or scorched", "Not sure",
] as const;

export const CLEANING_PROCESS_OPTIONS = [
  "No", "Hand washed", "Machine washed", "Professionally laundered",
  "Professionally wet-cleaned", "Spot-cleaned only", "More than one process", "Not known",
] as const;

/** Solvent-specific options are shown only to professional contexts. */
export const CLEANING_PROCESS_PRO_OPTIONS = [
  "Dry-cleaned in perchloroethylene", "Dry-cleaned in hydrocarbon solvent",
  "Dry-cleaned in silicone solvent", "Dry-cleaned, solvent not known",
] as const;

export const QUICK_DRYCLEAN_OPTION = "Dry-cleaned, solvent not known";

export const CLEANING_OUTCOME_OPTIONS = [
  "Stain was reduced", "Stain remained unchanged", "Stain spread", "Colour changed",
  "A ring formed", "Texture changed", "Heat was applied afterwards", "Not sure",
] as const;

export const APPLIED_PRODUCT_OPTIONS = [
  "Nothing", "Water", "Detergent", "Soap", "Domestic stain remover", "Bleach",
  "Oxygen bleach", "Chlorine bleach", "Vinegar or another acid",
  "Ammonia or alkaline cleaner", "Alcohol-based product", "Solvent-based product",
  "Professional spotting product", "Unknown chemical", "Multiple products", "Not known",
] as const;

const REAL_PRODUCTS = APPLIED_PRODUCT_OPTIONS.filter(
  (p) => !["Nothing", "Water", "Not known"].includes(p),
);

export const BLEACH_PRODUCTS = ["Bleach", "Oxygen bleach", "Chlorine bleach"];

export const TREATMENT_RESULT_OPTIONS = [
  "Stain removed", "Stain reduced", "No change", "Stain spread", "Stain became darker",
  "Stain became lighter", "Colour bled", "Garment colour was removed", "Ring formed",
  "Fabric became rough", "Fabric became weak", "Surface peeled", "Decoration loosened",
  "Strong odour remains", "Not sure",
] as const;

/** Any of these stops further treatment assessment. */
export const STOP_RESULTS = [
  "Colour bled", "Garment colour was removed", "Fabric became weak", "Surface peeled", "Decoration loosened",
];

export const SIZE_OPTIONS = [
  "Pinpoint", "Smaller than a coin", "Palm-sized", "Larger than a palm",
  "Large garment area", "Multiple separate areas", "Widespread contamination",
] as const;

export const PENETRATION_OPTIONS = [
  "Surface only", "Soaked through one layer", "Reached lining",
  "Reached padding or interlining", "Entered seams", "Entered decoration", "Not sure",
] as const;

export const BUILDUP_OPTIONS = [
  "Light mark", "Moderate deposit", "Heavy deposit", "Thick or layered buildup",
  "Repeated accumulation", "Not sure",
] as const;

export const COMPONENT_OPTIONS = [
  "Plain fabric", "Seam", "Hem", "Lining", "Fusible interlining", "Padding", "Print",
  "Embroidery", "Beads", "Sequins", "Metallic thread", "Glued decoration", "Coating",
  "Lamination", "Leather or suede trim", "Elastic", "Multiple components", "Not sure",
] as const;

/** Sensitivity boundary — the most sensitive affected component governs safety. */
const COMPONENT_SENSITIVITY: Record<string, number> = {
  "Plain fabric": 0, Seam: 1, Hem: 1, Lining: 2, Elastic: 2, Print: 2,
  "Fusible interlining": 3, Padding: 3, Embroidery: 3, "Multiple components": 3,
  Beads: 4, Sequins: 4, "Metallic thread": 4, "Glued decoration": 4,
  Coating: 4, Lamination: 4, "Leather or suede trim": 4, "Not sure": 2,
};

export const COLOUR_GROUP_OPTIONS = ["White", "Light", "Dark", "Bright", "Multicoloured", "Not sure"] as const;

export const COLOURFASTNESS_OPTIONS = ["Untested", "Passed", "Failed", "Inconclusive"] as const;

export const CAPABILITY_CONTEXTS: { key: UserRoleKey | "technical_reviewer"; label: string; professional: boolean }[] = [
  { key: "domestic_user", label: "Domestic user", professional: false },
  { key: "laundry_employee", label: "Laundry counter employee", professional: true },
  { key: "dry_cleaner", label: "Laundry or dry-cleaning operator", professional: true },
  { key: "professional_spotter", label: "Professional spotter", professional: true },
  { key: "trainer", label: "Trainer", professional: true },
  { key: "learner", label: "Learner", professional: false },
  { key: "technical_reviewer", label: "Technical reviewer", professional: true },
];

export const isProfessionalContext = (c: string | null) =>
  CAPABILITY_CONTEXTS.find((x) => x.key === c)?.professional ?? false;

export const DOMESTIC_EQUIPMENT = [
  "Sink", "Clean white cloths", "Laundry detergent", "Washing machine",
  "Hand-washing facility", "None", "Other",
] as const;

export const PROFESSIONAL_EQUIPMENT = [
  "Spotting table", "Vacuum", "Controlled steam gun", "Air gun", "Water gun",
  "Soft spotting brush", "Bone or approved spotting spatula", "Wet-cleaning machine",
  "Laundry washer", "Perchloroethylene machine", "Hydrocarbon machine",
  "Silicone-solvent machine", "Other professional system", "Suitable ventilation",
  "Chemical-resistant gloves", "Eye protection", "Not known",
] as const;

export const PPE_ITEMS = ["Chemical-resistant gloves", "Eye protection", "Suitable ventilation"];

export const PRODUCT_KITS = [
  "Seitz seven-bottle system", "STAS kit", "Clean Craft nine-bottle system", "Other or custom kit",
] as const;

export const COUNTRIES = ["India", "United Arab Emirates", "United Kingdom", "United States", "Germany", "Australia", "Other"] as const;

export const LANGUAGES = ["English", "हिन्दी (Hindi)", "Other"] as const;

export const TEST_FEASIBILITY_OPTIONS = ["Yes", "No", "Not sure", "Professional test already completed"] as const;

/* ------------------------------------------------------------------ */
/* Records                                                             */
/* ------------------------------------------------------------------ */

export type AppliedProductRecord = {
  id: string;
  productType: string;      // one of APPLIED_PRODUCT_OPTIONS
  name: string;
  company: string;
  productPhoto?: string;
  labelPhoto?: string;
  amount: string;           // user-reported, unverified
  diluted: "Yes" | "No" | "Not known" | "";
  dilution: string;         // unverified
  contactTimeMinutes: number | null;
  rinsed: "Yes" | "No" | "Not known" | "";
  neutralized: "Yes" | "No" | "Not known" | "";
  heatAfter: "Yes" | "No" | "Not known" | "";
  observedResult: string;
  reportedUnverified: true;
};

export type InventoryItem = {
  id: string;
  productName: string;
  company: string;
  kit: string;
  bottleSize: string;
  country: string;
  labelAvailable: boolean;
  sdsAvailable: boolean;
  tdsAvailable: boolean;
  expiryOrReview: string;
  organizationApproved: boolean;
  verificationStatus: "unverified" | "pending_review" | "verified" | "insufficient_information" | "disputed";
};

export type CompletedTest = {
  testType: string;
  location: string;
  medium: string;
  procedureSource: string;
  colourTransfer: string;
  textureResult: string;
  ringFormation: string;
  distortion: string;
  decision: string;
  operator: string;
  date: string;
  photo?: string;
};

export type ReadinessAnswers = {
  summaryConfirmed: "yes" | "edit_garment" | "edit_stain" | "not_sure" | null;
  stainAge: string | null;
  ageIsApproximate: boolean;
  condition: string[];
  heatExposure: string[];
  heatResult: string[];
  cleaningProcess: string[];
  cleaningAttempts: number | null;
  cleaningOutcome: string[];
  appliedProducts: string[];
  productRecords: AppliedProductRecord[];
  mixing: "No" | "Yes" | "Possibly" | "Not known" | null;
  mixingProducts: string;
  mixingReaction: string[];
  treatmentResult: string[];
  size: string | null;
  penetration: string[];
  buildup: string | null;
  components: string[];
  colourGroup: string | null;
  stainCrossesColours: "Yes" | "No" | "Not sure" | null;
  hasPrint: "Yes" | "No" | "Not sure" | null;
  dyeTransferring: "Yes" | "No" | "Not sure" | null;
  colourChangedAfterTreatment: "Yes" | "No" | "Not sure" | null;
  colourfastness: "Untested" | "Passed" | "Failed" | "Inconclusive";
  capabilityContext: string | null;
  trainingCompleted: "Yes" | "No" | "Partly" | "Not sure" | null;
  supervisionAvailable: "Yes" | "No" | "Not sure" | null;
  experienceLevel: string | null;
  permittedProfessionalProducts: boolean;
  canRunTests: boolean;
  canDocumentResults: boolean;
  equipment: string[];
  kits: string[];
  inventory: InventoryItem[];
  country: string | null;
  language: string | null;
  productMarketCountry: string | null;
  organizationLocation: string | null;
  testFeasible: string | null;
  completedTest: CompletedTest | null;
};

export const emptyReadinessAnswers = (): ReadinessAnswers => ({
  summaryConfirmed: null,
  stainAge: null,
  ageIsApproximate: true,
  condition: [],
  heatExposure: [],
  heatResult: [],
  cleaningProcess: [],
  cleaningAttempts: null,
  cleaningOutcome: [],
  appliedProducts: [],
  productRecords: [],
  mixing: null,
  mixingProducts: "",
  mixingReaction: [],
  treatmentResult: [],
  size: null,
  penetration: [],
  buildup: null,
  components: [],
  colourGroup: null,
  stainCrossesColours: null,
  hasPrint: null,
  dyeTransferring: null,
  colourChangedAfterTreatment: null,
  colourfastness: "Untested",
  capabilityContext: null,
  trainingCompleted: null,
  supervisionAvailable: null,
  experienceLevel: null,
  permittedProfessionalProducts: false,
  canRunTests: false,
  canDocumentResults: false,
  equipment: [],
  kits: [],
  inventory: [],
  country: null,
  language: null,
  productMarketCountry: null,
  organizationLocation: null,
  testFeasible: null,
  completedTest: null,
});

/* ------------------------------------------------------------------ */
/* Context carried in from Steps 2 and 3                               */
/* ------------------------------------------------------------------ */

export type ReadinessContext = {
  riskBefore: RiskLevel;
  gateBefore: GateStatus;
  fabricConfidence: string;
  garmentType: string;
  suspectedMaterial: string | null;
  colourGroupKnown: string | null;
  constructionKnown: string[];
  existingDamage: string[];
  suspectedStain: string | null;
  alternativeStains: string[];
  stainConfidence: number;
  stainAgeKnown: string | null;
  previousTreatmentKnown: string[];
  hazardStop: boolean;
  damageRoute: boolean;
  role: string;
};

/* ------------------------------------------------------------------ */
/* Adaptive question plan                                              */
/* ------------------------------------------------------------------ */

export type QuestionKey =
  | "summary" | "age" | "condition" | "heat" | "heat_result" | "cleaning"
  | "cleaning_detail" | "products" | "product_detail" | "mixing" | "mixing_detail"
  | "result" | "size" | "penetration" | "components" | "colour" | "capability"
  | "equipment" | "inventory" | "country" | "test";

export type PlannedQuestion = { key: QuestionKey; title: string; why: string; prefilled?: string };

/** Builds the adaptive question list; already-known answers become confirmations or are skipped. */
export function planQuestions(a: ReadinessAnswers, ctx: ReadinessContext): PlannedQuestion[] {
  const q: PlannedQuestion[] = [
    { key: "summary", title: "Is this information correct?", why: "Everything in this step is judged against the garment and stain already recorded." },
  ];

  q.push({
    key: "age",
    title: ctx.stainAgeKnown ? "Please confirm how old the stain is" : "How old is the stain?",
    why: "Age changes how firmly the stain is held in the fibres and how cautious later steps must be.",
    prefilled: ctx.stainAgeKnown ?? undefined,
  });

  q.push({ key: "condition", title: "What is the stain like right now?", why: "Age and current condition are different things and are recorded separately." });

  q.push({ key: "heat", title: "Has the stained area been exposed to heat?", why: "Heat can set some stains permanently and can damage the fibre itself." });
  if (a.heatExposure.some((h) => h !== "No" && h !== "Not known"))
    q.push({ key: "heat_result", title: "What happened after heat exposure?", why: "Shine, melting, scorching or texture change means fibre damage, not a stain." });

  q.push({ key: "cleaning", title: "Has the garment been cleaned since the stain occurred?", why: "Cleaning can reduce, fix or spread a stain, and it changes what is safe next." });
  if (a.cleaningProcess.some((c) => c !== "No" && c !== "Not known"))
    q.push({ key: "cleaning_detail", title: "What happened during those cleaning attempts?", why: "Repeated attempts and rings change the difficulty and the risk." });

  const priorTreatmentKnownNone =
    ctx.previousTreatmentKnown.length === 1 && ctx.previousTreatmentKnown[0] === "Nothing";
  if (!priorTreatmentKnownNone)
    q.push({ key: "products", title: "Was anything applied directly to the stain?", why: "Products already used decide what may never be used afterwards." });

  if (a.appliedProducts.some((p) => REAL_PRODUCTS.includes(p as (typeof REAL_PRODUCTS)[number])))
    q.push({ key: "product_detail", title: "Tell us about each product that was used", why: "We record this as case history only. Nothing here is treated as a verified instruction." });

  if (a.appliedProducts.filter((p) => REAL_PRODUCTS.includes(p as (typeof REAL_PRODUCTS)[number])).length >= 1)
    q.push({ key: "mixing", title: "Were two or more products used without fully rinsing between them?", why: "Mixed chemicals can react on the garment and can be hazardous." });
  if (a.mixing === "Yes" || a.mixing === "Possibly" || a.mixing === "Not known")
    q.push({ key: "mixing_detail", title: "What was involved, and what did you observe?", why: "We need to know whether a reaction may already have taken place." });

  if (
    a.appliedProducts.some((p) => p !== "Nothing") ||
    a.cleaningProcess.some((c) => c !== "No")
  )
    q.push({ key: "result", title: "What changed after the previous attempt?", why: "Colour loss, weakening or peeling stops treatment assessment immediately." });

  q.push({ key: "size", title: "How large is the stain?", why: "Large or widespread contamination needs professional handling." });
  q.push({ key: "penetration", title: "How deep has it gone?", why: "A stain that has reached lining or padding cannot be treated as a surface mark." });
  q.push({ key: "components", title: "What does the stain touch?", why: "The most sensitive part the stain touches sets the safety boundary." });

  if (!ctx.colourGroupKnown || a.colourGroup)
    q.push({ key: "colour", title: "Colour and dye risk", why: "Dye stability decides whether any wet treatment can be considered later." });

  q.push({ key: "capability", title: "Who is working on this garment?", why: "Guidance is limited to what the working context can carry out safely." });
  q.push({ key: "equipment", title: "What is available to work with?", why: "Available equipment changes the routes that can be considered later." });

  if (isProfessionalContext(a.capabilityContext))
    q.push({ key: "inventory", title: "Approved product inventory", why: "Availability and verification are recorded separately — availability alone never unlocks guidance." });

  q.push({ key: "country", title: "Country and language", why: "Documentation, warnings and units differ between countries." });
  q.push({ key: "test", title: "Can the garment be tested in a hidden area?", why: "A hidden-area test reduces uncertainty for the tested condition only." });

  return q;
}

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

export type ReadinessStatus =
  | "ready_for_classification"
  | "more_information_required"
  | "compatibility_test_required"
  | "professional_only"
  | "specialist_referral_required"
  | "blocked_previous_chemical"
  | "blocked_existing_damage"
  | "blocked_possible_hazard";

export const STATUS_LABEL: Record<ReadinessStatus, string> = {
  ready_for_classification: "Ready for Technical Classification",
  more_information_required: "More Information Required",
  compatibility_test_required: "Compatibility Test Required",
  professional_only: "Professional Handling Only",
  specialist_referral_required: "Specialist Referral Required",
  blocked_previous_chemical: "Treatment Assessment Blocked — previous chemical use",
  blocked_existing_damage: "Treatment Assessment Blocked — existing damage",
  blocked_possible_hazard: "Treatment Assessment Blocked — possible hazard",
};

export type RiskEvent = { at: number; from: RiskLevel; to: RiskLevel; rule: string; version: string };

export type ReadinessResult = {
  status: ReadinessStatus;
  statusLabel: string;
  statusReason: string;
  riskBefore: RiskLevel;
  riskAfter: RiskLevel;
  riskEvents: RiskEvent[];
  riskExplanation: string;
  factors: string[];
  blockers: string[];
  missingAnswers: string[];
  mostSensitiveComponent: string;
  heatSetSuspected: boolean;
  domesticChemicalBlocked: boolean;
  verifiedProductsAvailable: number;
  unverifiedProductsAvailable: number;
  countryDocumentMismatch: boolean;
  nextAction: string;
  version: string;
};

const ORDER: RiskLevel[] = ["green", "amber", "red", "black"];
const higher = (a: RiskLevel, b: RiskLevel) => (ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b);

export function evaluateReadiness(a: ReadinessAnswers, ctx: ReadinessContext): ReadinessResult {
  const now = Date.now();
  const events: RiskEvent[] = [];
  const factors: string[] = [];
  const blockers: string[] = [];
  let risk = ctx.riskBefore;

  const bump = (to: RiskLevel, rule: string) => {
    const next = higher(risk, to);
    if (next !== risk) {
      events.push({ at: now, from: risk, to: next, rule, version: READINESS_VERSION });
      risk = next;
    } else if (ORDER.indexOf(to) >= ORDER.indexOf(risk)) {
      events.push({ at: now, from: risk, to: risk, rule: `${rule} (already at this level)`, version: READINESS_VERSION });
    }
  };

  /* --- carried-in stops --- */
  if (ctx.hazardStop) { bump("black", "Step 3 hazard stop carried forward"); blockers.push("A possible hazardous substance was reported in identification."); }
  if (ctx.damageRoute) { bump("red", "Step 3 damage route carried forward"); factors.push("Identification suggested fabric damage rather than a removable stain."); }
  if (ctx.existingDamage.length) factors.push(`Existing damage recorded on the garment: ${ctx.existingDamage.join(", ").toLowerCase()}.`);

  /* --- age and condition --- */
  const aged = a.stainAge ? AGED_VALUES.includes(a.stainAge) : false;
  if (aged) { bump("amber", "Aged or recurring stain"); factors.push("The stain is aged or a recurring buildup, so it is likely to be more difficult."); }
  if (a.stainAge === "Not known") factors.push("Stain age is not known, so caution is increased.");
  if (a.condition.includes("Dried") || a.condition.includes("Hardened")) factors.push("The stain has dried or hardened.");
  if (a.condition.includes("Has spread") || a.condition.includes("Has formed a ring")) { bump("amber", "Stain has spread or formed a ring"); factors.push("The mark has spread or formed a ring."); }
  if (a.condition.includes("Texture has changed")) { bump("red", "Texture change reported in the stained area"); factors.push("The texture of the stained area has changed."); }
  if (a.condition.includes("Has soaked through")) factors.push("The stain has soaked through the fabric.");

  /* --- heat --- */
  const heatApplied = a.heatExposure.some((h) => h !== "No" && h !== "Not known");
  const heatSetSuspected =
    heatApplied &&
    (a.heatResult.some((r) => ["Stain became darker", "Stain hardened", "Ring appeared", "Stain spread"].includes(r)) ||
      aged ||
      !!(ctx.suspectedStain && /blood|egg|milk|protein|paint|ink|dye|unknown/i.test(ctx.suspectedStain)));
  if (heatApplied) { bump("amber", "Heat exposure after the stain occurred"); factors.push(`Heat was applied after the stain occurred (${a.heatExposure.filter((h) => h !== "No").join(", ").toLowerCase()}).`); }
  if (heatSetSuspected) factors.push("The stain may be heat-set, which usually reduces what can safely be achieved.");
  const heatDamage = a.heatResult.some((r) => ["Fabric became shiny", "Fabric melted or scorched", "Texture changed"].includes(r));
  if (heatDamage) { bump("black", "Heat damage to the fibre reported"); blockers.push("Shine, melting, scorching or texture change means the fibre itself is damaged."); }

  /* --- previous cleaning --- */
  const cleaned = a.cleaningProcess.some((c) => c !== "No" && c !== "Not known");
  if (cleaned) { bump("amber", "Garment already cleaned after the stain occurred"); factors.push(`The garment has already been cleaned (${a.cleaningProcess.filter((c) => c !== "No").join(", ").toLowerCase()}).`); }
  if (a.cleaningProcess.includes("Dry-cleaned, solvent not known")) factors.push("The dry-cleaning solvent used is not known.");
  if ((a.cleaningAttempts ?? 0) >= 2) { bump("amber", "Two or more previous cleaning attempts"); factors.push(`${a.cleaningAttempts} previous cleaning attempts were reported.`); }
  if (a.cleaningOutcome.includes("Colour changed")) { bump("red", "Colour changed during previous cleaning"); factors.push("Colour changed during a previous cleaning attempt."); }
  if (a.cleaningOutcome.includes("A ring formed")) factors.push("A ring formed during a previous cleaning attempt.");
  if (a.cleaningOutcome.includes("Texture changed")) { bump("red", "Texture changed during previous cleaning"); }

  /* --- previous products --- */
  const usedProducts = a.appliedProducts.filter((p) => REAL_PRODUCTS.includes(p as (typeof REAL_PRODUCTS)[number]));
  if (usedProducts.length) { bump("amber", "A product was already applied to the stain"); factors.push(`Products already applied: ${usedProducts.join(", ").toLowerCase()}.`); }
  if (a.appliedProducts.some((p) => BLEACH_PRODUCTS.includes(p))) { bump("red", "Bleach reported on the garment"); factors.push("Previous bleach use was reported."); }
  if (a.appliedProducts.includes("Unknown chemical") || a.appliedProducts.includes("Not known")) {
    bump("red", "Unknown product previously applied");
    factors.push("An unknown product was previously applied, so its chemistry cannot be assumed.");
  }
  const undocumented = a.productRecords.filter((p) => !p.name.trim() && !p.labelPhoto);
  if (usedProducts.length && undocumented.length === a.productRecords.length && a.productRecords.length > 0)
    factors.push("Product documentation is incomplete for the products already used.");

  /* --- mixing --- */
  const mixingRisk = a.mixing === "Yes" || a.mixing === "Possibly" || a.mixing === "Not known";
  if (mixingRisk) {
    bump("red", "Two or more products may have been mixed without rinsing");
    blockers.push("Products may have been mixed without rinsing between them.");
    factors.push("Do not add another chemical until the previous products and their compatibility have been assessed.");
  }
  const mixingReacted = a.mixingReaction.some((r) => r !== "None of these" && r !== "Not sure");
  if (mixingReacted) { bump("black", "Reaction observed after chemical mixing"); blockers.push("A reaction was observed after chemicals were mixed."); }

  /* --- previous treatment result --- */
  const stopResult = a.treatmentResult.filter((r) => STOP_RESULTS.includes(r));
  if (stopResult.length) { bump("black", `Damage reported after a previous attempt: ${stopResult.join(", ")}`); blockers.push(`Previous treatment caused ${stopResult.join(", ").toLowerCase()}.`); }
  if (a.treatmentResult.includes("Fabric became rough")) { bump("red", "Fabric became rough after a previous attempt"); }
  if (a.treatmentResult.includes("Stain spread") || a.treatmentResult.includes("Stain became darker")) factors.push("The previous attempt made the mark worse.");

  /* --- size and penetration --- */
  if (["Larger than a palm", "Large garment area", "Multiple separate areas", "Widespread contamination"].includes(a.size ?? "")) {
    bump("red", "Large or widespread contamination");
    factors.push("The affected area is large or widespread, which needs professional handling.");
  }
  if (a.penetration.some((p) => ["Reached lining", "Reached padding or interlining", "Entered seams", "Entered decoration"].includes(p))) {
    bump("red", "Stain has penetrated beyond the face fabric");
    factors.push(`The stain has penetrated further than the surface (${a.penetration.join(", ").toLowerCase()}).`);
  }
  if (["Thick or layered buildup", "Repeated accumulation", "Heavy deposit"].includes(a.buildup ?? "")) factors.push("There is a heavy or layered deposit.");

  /* --- components: most sensitive affected component sets the boundary --- */
  const sensitivities = a.components.map((c) => ({ c, s: COMPONENT_SENSITIVITY[c] ?? 2 }));
  const worst = sensitivities.sort((x, y) => y.s - x.s)[0];
  const mostSensitiveComponent = worst?.c ?? "Not recorded";
  if (worst && worst.s >= 4) { bump("red", `Stain touches a sensitive component: ${worst.c}`); factors.push(`The stain touches ${worst.c.toLowerCase()}, which sets the safety boundary.`); }
  else if (worst && worst.s === 3) { bump("amber", `Stain touches ${worst.c}`); factors.push(`The stain touches ${worst.c.toLowerCase()}.`); }

  /* --- colour and dye --- */
  if (a.colourfastness === "Failed") { bump("black", "Colourfastness test failed"); blockers.push("A colourfastness test has already failed."); }
  if (a.colourfastness === "Inconclusive") bump("amber", "Colourfastness test inconclusive");
  if (a.dyeTransferring === "Yes") { bump("black", "Dye is actively transferring"); blockers.push("Dye is already transferring from the garment."); }
  if (a.colourChangedAfterTreatment === "Yes") { bump("red", "Colour changed after an earlier treatment"); factors.push("Colour changed after an earlier treatment."); }
  if (a.stainCrossesColours === "Yes") { bump("amber", "Stain crosses more than one colour"); factors.push("The stain crosses more than one colour."); }
  if (["Bright", "Multicoloured", "Dark"].includes(a.colourGroup ?? "") && a.colourfastness === "Untested")
    factors.push("Dye stability has not been tested on this colour.");

  /* --- capability --- */
  const professional = isProfessionalContext(a.capabilityContext);
  if (!professional) factors.push("The working context is domestic, so professional chemistry and processes are out of scope.");
  if (professional && a.trainingCompleted === "No" && a.supervisionAvailable !== "Yes") {
    bump("red", "Professional context without completed training or supervision");
    factors.push("Training is not complete and no supervision is available.");
  }

  /* --- equipment and PPE --- */
  const hasPPE = PPE_ITEMS.every((p) => a.equipment.includes(p));
  if (professional && !hasPPE) { bump("amber", "Missing PPE or ventilation in a professional context"); factors.push("Protective equipment or ventilation is missing."); }
  if (a.equipment.includes("None")) factors.push("No equipment is available.");

  /* --- inventory --- */
  const verified = a.inventory.filter((i) => i.verificationStatus === "verified" && i.organizationApproved && i.sdsAvailable && i.tdsAvailable).length;
  const unverified = a.inventory.length - verified;
  if (a.inventory.length && verified === 0) factors.push("Products are available, but none are verified with complete documentation.");
  if (unverified > 0) factors.push(`${unverified} available product${unverified > 1 ? "s are" : " is"} recorded as available but not verified.`);
  if (!professional && a.inventory.length > 0) factors.push("Professional products are recorded as present, but the working context is domestic.");

  /* --- country --- */
  const countryDocumentMismatch =
    !!a.country && a.inventory.some((i) => i.country && i.country !== a.country);
  if (countryDocumentMismatch) { bump("amber", "Product documentation is from a different country"); factors.push("Some product documentation comes from a different country than the country of treatment."); }
  if (!a.country) factors.push("Country of treatment has not been selected.");

  /* --- test feasibility --- */
  const noTestArea = a.testFeasible === "No";
  if (noTestArea) { bump("amber", "No hidden test area is available"); factors.push("No hidden area is available for testing."); }
  if (a.testFeasible === "Professional test already completed" && a.completedTest?.colourTransfer === "Colour transferred") {
    bump("black", "Completed test showed colour transfer");
    blockers.push("A completed compatibility test showed colour transfer.");
  }

  /* --- missing answers (never treated as safe defaults) --- */
  const missing: string[] = [];
  if (!a.stainAge) missing.push("Stain age");
  if (!a.condition.length) missing.push("Current stain condition");
  if (!a.heatExposure.length) missing.push("Heat exposure");
  if (!a.cleaningProcess.length) missing.push("Previous cleaning");
  if (!a.appliedProducts.length) missing.push("Previously applied products");
  if (!a.size) missing.push("Stain size");
  if (!a.penetration.length) missing.push("Penetration");
  if (!a.components.length) missing.push("Affected garment components");
  if (!a.capabilityContext) missing.push("Working context");
  if (!a.equipment.length) missing.push("Available equipment");
  if (!a.country) missing.push("Country of treatment");
  if (!a.testFeasible) missing.push("Test feasibility");

  /* --- status --- */
  const restrictedGate: GateStatus[] = ["blocked_pending_identification", "blocked_existing_damage", "specialist_material_route"];
  let status: ReadinessStatus;
  let reason: string;

  if (ctx.hazardStop || mixingReacted || a.appliedProducts.includes("Unknown chemical") && mixingRisk) {
    status = "blocked_possible_hazard";
    reason = "A possible hazardous substance or chemical reaction has been reported. The case can be documented and referred, but treatment assessment cannot continue.";
  } else if (stopResult.length || heatDamage || a.colourfastness === "Failed" || a.dyeTransferring === "Yes" || ctx.gateBefore === "blocked_existing_damage") {
    status = "blocked_existing_damage";
    reason = "Existing or newly caused damage means this case can only be documented and referred.";
  } else if (mixingRisk) {
    status = "blocked_previous_chemical";
    reason = "Products may have been mixed without rinsing. No further chemical treatment may be assessed until the previous products have been reviewed.";
  } else if (ctx.gateBefore === "specialist_material_route" || risk === "black") {
    status = "specialist_referral_required";
    reason = "The garment or the case requires specialist assessment before any treatment route can be considered.";
  } else if (missing.length > 0) {
    status = "more_information_required";
    reason = `Some treatment-changing information is still missing: ${missing.join(", ")}.`;
  } else if (risk === "red" || ctx.gateBefore === "professional_only" || (!professional && a.inventory.length > 0)) {
    status = "professional_only";
    reason = "The recorded conditions mean this garment should be handled professionally.";
  } else if (risk === "amber" || a.colourfastness === "Untested" || a.colourfastness === "Inconclusive") {
    status = a.testFeasible === "No" ? "professional_only" : "compatibility_test_required";
    reason =
      a.testFeasible === "No"
        ? "Testing is required but no hidden area is available, so professional handling is required."
        : "A controlled compatibility test is required before any treatment route can be classified.";
  } else {
    status = "ready_for_classification";
    reason = "The treatment-changing information is complete and no blocking condition was found.";
  }

  // A restricted earlier gate can never be improved here.
  if (restrictedGate.includes(ctx.gateBefore) && status === "ready_for_classification") {
    status = "specialist_referral_required";
    reason = "An earlier step restricted this garment, so Step 4 cannot mark it ready.";
  }

  const nextAction =
    status === "ready_for_classification" ? "Continue to technical classification (Step 5)"
      : status === "more_information_required" ? "Answer the remaining questions"
        : status === "compatibility_test_required" ? "Record a controlled compatibility test before continuing"
          : status === "professional_only" ? "Hand the garment to a trained professional"
            : status === "specialist_referral_required" ? "Refer to a specialist for assessment"
              : "Document the case and refer it — treatment assessment is blocked";

  const riskExplanation =
    events.length === 0
      ? "No Step 4 answer changed the garment risk. The level carried over from the earlier steps."
      : events.filter((e) => e.from !== e.to).map((e) => `${e.rule} raised the risk from ${e.from} to ${e.to}`).join("; ") ||
        `Risk stayed at ${risk} because: ${events.map((e) => e.rule).join("; ")}`;

  return {
    status,
    statusLabel: STATUS_LABEL[status],
    statusReason: reason,
    riskBefore: ctx.riskBefore,
    riskAfter: risk,
    riskEvents: events,
    riskExplanation,
    factors,
    blockers,
    missingAnswers: missing,
    mostSensitiveComponent,
    heatSetSuspected,
    domesticChemicalBlocked: mixingRisk || !professional,
    verifiedProductsAvailable: verified,
    unverifiedProductsAvailable: unverified,
    countryDocumentMismatch,
    nextAction,
    version: READINESS_VERSION,
  };
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export function validateAnswers(a: ReadinessAnswers): string[] {
  const errors: string[] = [];
  a.productRecords.forEach((p, i) => {
    if (p.contactTimeMinutes !== null && p.contactTimeMinutes < 0) errors.push(`Product ${i + 1}: contact time cannot be negative.`);
    if (p.amount && Number(p.amount) < 0) errors.push(`Product ${i + 1}: quantity cannot be negative.`);
  });
  if ((a.cleaningAttempts ?? 0) < 0) errors.push("Cleaning attempts cannot be negative.");
  return errors;
}
