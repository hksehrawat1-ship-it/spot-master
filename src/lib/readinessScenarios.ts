/** Step 4 required test scenarios. Identification/condition only — no treatment content. */
import {
  emptyReadinessAnswers,
  evaluateReadiness,
  type ReadinessAnswers,
  type ReadinessContext,
  type ReadinessStatus,
} from "@/lib/treatmentReadiness";
import type { RiskLevel } from "@/lib/fabricSafety";

const baseContext = (over: Partial<ReadinessContext> = {}): ReadinessContext => ({
  riskBefore: "green",
  gateBefore: "proceed",
  fabricConfidence: "high",
  garmentType: "Shirt",
  suspectedMaterial: "Cotton",
  colourGroupKnown: "Light",
  constructionKnown: [],
  existingDamage: [],
  suspectedStain: "Coffee",
  alternativeStains: [],
  stainConfidence: 9,
  stainAgeKnown: "Happened today",
  previousTreatmentKnown: ["Nothing"],
  hazardStop: false,
  damageRoute: false,
  role: "domestic_user",
  ...over,
});

/** A fully answered, low-risk baseline so scenarios test one variable at a time. */
const baseAnswers = (over: Partial<ReadinessAnswers> = {}): ReadinessAnswers => ({
  ...emptyReadinessAnswers(),
  summaryConfirmed: "yes",
  stainAge: "Happened today",
  condition: ["Damp"],
  heatExposure: ["No"],
  cleaningProcess: ["No"],
  appliedProducts: ["Nothing"],
  size: "Smaller than a coin",
  penetration: ["Surface only"],
  buildup: "Light mark",
  components: ["Plain fabric"],
  colourGroup: "Light",
  colourfastness: "Passed",
  capabilityContext: "domestic_user",
  equipment: ["Sink", "Clean white cloths", "Laundry detergent"],
  country: "India",
  language: "English",
  testFeasible: "Yes",
  ...over,
});

export type ReadinessScenario = {
  name: string;
  answers: ReadinessAnswers;
  context: ReadinessContext;
  expect: { status: ReadinessStatus; minRisk?: RiskLevel };
};

export const READINESS_SCENARIOS: ReadinessScenario[] = [
  {
    name: "Fresh untreated coffee stain",
    answers: baseAnswers(),
    context: baseContext(),
    expect: { status: "ready_for_classification" },
  },
  {
    name: "Old coffee stain that was ironed",
    answers: baseAnswers({
      stainAge: "More than one week old",
      condition: ["Dried"],
      heatExposure: ["Ironed"],
      heatResult: ["Stain became darker"],
    }),
    context: baseContext(),
    expect: { status: "compatibility_test_required", minRisk: "amber" },
  },
  {
    name: "Blood stain treated with hot water",
    answers: baseAnswers({
      heatExposure: ["Washed in hot water"],
      heatResult: ["Stain became darker"],
      cleaningProcess: ["Hand washed"],
      cleaningAttempts: 1,
      cleaningOutcome: ["Stain remained unchanged"],
      appliedProducts: ["Water"],
      treatmentResult: ["No change"],
    }),
    context: baseContext({ suspectedStain: "Blood", stainAgeKnown: "Happened today" }),
    expect: { status: "compatibility_test_required", minRisk: "amber" },
  },
  {
    name: "Unknown stain previously treated with bleach",
    answers: baseAnswers({
      appliedProducts: ["Bleach"],
      productRecords: [],
      mixing: "No",
      treatmentResult: ["Stain became lighter"],
    }),
    context: baseContext({ suspectedStain: null, stainConfidence: 2 }),
    expect: { status: "professional_only", minRisk: "red" },
  },
  {
    name: "Two household chemicals mixed",
    answers: baseAnswers({
      appliedProducts: ["Bleach", "Vinegar or another acid", "Multiple products"],
      mixing: "Yes",
      mixingReaction: ["None of these"],
      treatmentResult: ["No change"],
    }),
    context: baseContext(),
    expect: { status: "blocked_previous_chemical", minRisk: "red" },
  },
  {
    name: "Oil stain after dry cleaning",
    answers: baseAnswers({
      cleaningProcess: ["Dry-cleaned, solvent not known"],
      cleaningAttempts: 1,
      cleaningOutcome: ["Stain remained unchanged"],
      treatmentResult: ["No change"],
    }),
    context: baseContext({ suspectedStain: "Cooking oil" }),
    expect: { status: "compatibility_test_required", minRisk: "amber" },
  },
  {
    name: "Lipstick stain after repeated rubbing",
    answers: baseAnswers({
      appliedProducts: ["Detergent"],
      cleaningProcess: ["Spot-cleaned only"],
      cleaningAttempts: 3,
      cleaningOutcome: ["Stain spread"],
      condition: ["Has spread"],
      treatmentResult: ["Stain spread"],
    }),
    context: baseContext({ suspectedStain: "Lipstick" }),
    expect: { status: "compatibility_test_required", minRisk: "amber" },
  },
  {
    name: "Dye transfer across two garment colours",
    answers: baseAnswers({
      colourGroup: "Multicoloured",
      stainCrossesColours: "Yes",
      colourfastness: "Untested",
    }),
    context: baseContext({ suspectedStain: "Colour transfer" }),
    expect: { status: "compatibility_test_required", minRisk: "amber" },
  },
  {
    name: "Large stain reaching a lining",
    answers: baseAnswers({
      size: "Large garment area",
      penetration: ["Reached lining"],
      components: ["Lining"],
    }),
    context: baseContext(),
    expect: { status: "professional_only", minRisk: "red" },
  },
  {
    name: "Stain on beads and glued decoration",
    answers: baseAnswers({ components: ["Beads", "Glued decoration"] }),
    context: baseContext(),
    expect: { status: "professional_only", minRisk: "red" },
  },
  {
    name: "Rust-coloured mark on metallic thread",
    answers: baseAnswers({ components: ["Metallic thread"] }),
    context: baseContext({ suspectedStain: "Rust" }),
    expect: { status: "professional_only", minRisk: "red" },
  },
  {
    name: "Unknown product applied with no label",
    answers: baseAnswers({
      appliedProducts: ["Unknown chemical"],
      mixing: "No",
      treatmentResult: ["No change"],
      productRecords: [
        {
          id: "p1", productType: "Unknown chemical", name: "", company: "", amount: "",
          diluted: "Not known", dilution: "", contactTimeMinutes: null, rinsed: "Not known",
          neutralized: "Not known", heatAfter: "Not known", observedResult: "", reportedUnverified: true,
        },
      ],
    }),
    context: baseContext(),
    expect: { status: "professional_only", minRisk: "red" },
  },
  {
    name: "Professional user with full equipment but no SDS",
    answers: baseAnswers({
      capabilityContext: "professional_spotter",
      trainingCompleted: "Yes",
      equipment: ["Spotting table", "Vacuum", "Chemical-resistant gloves", "Eye protection", "Suitable ventilation"],
      inventory: [
        {
          id: "i1", productName: "Kit bottle 3", company: "Seitz", kit: "Seitz seven-bottle system",
          bottleSize: "1 L", country: "India", labelAvailable: true, sdsAvailable: false,
          tdsAvailable: true, expiryOrReview: "2027", organizationApproved: true, verificationStatus: "pending_review",
        },
      ],
    }),
    context: baseContext({ role: "professional_spotter" }),
    expect: { status: "ready_for_classification" },
  },
  {
    name: "Domestic user with industrial product available",
    answers: baseAnswers({
      capabilityContext: "domestic_user",
      inventory: [
        {
          id: "i2", productName: "Industrial degreaser", company: "Unknown", kit: "Other or custom kit",
          bottleSize: "5 L", country: "India", labelAvailable: false, sdsAvailable: false,
          tdsAvailable: false, expiryOrReview: "", organizationApproved: false, verificationStatus: "unverified",
        },
      ],
    }),
    context: baseContext(),
    expect: { status: "professional_only" },
  },
  {
    name: "No hidden test area",
    answers: baseAnswers({ testFeasible: "No", colourfastness: "Untested" }),
    context: baseContext(),
    expect: { status: "professional_only", minRisk: "amber" },
  },
  {
    name: "Existing colour loss",
    answers: baseAnswers({ treatmentResult: ["Garment colour was removed"], appliedProducts: ["Chlorine bleach"] }),
    context: baseContext(),
    expect: { status: "blocked_existing_damage", minRisk: "black" },
  },
  {
    name: "Active fabric peeling",
    answers: baseAnswers({ treatmentResult: ["Surface peeled"], appliedProducts: ["Solvent-based product"], mixing: "No" }),
    context: baseContext(),
    expect: { status: "blocked_existing_damage", minRisk: "black" },
  },
  {
    name: "Red-risk bridal garment",
    answers: baseAnswers({ components: ["Embroidery"] }),
    context: baseContext({ riskBefore: "red", gateBefore: "professional_only", garmentType: "Bridal wear" }),
    expect: { status: "professional_only", minRisk: "red" },
  },
  {
    name: "Black-risk coated garment",
    answers: baseAnswers({ components: ["Coating"] }),
    context: baseContext({ riskBefore: "black", gateBefore: "specialist_material_route" }),
    expect: { status: "specialist_referral_required", minRisk: "black" },
  },
  {
    name: "User changes an earlier answer (recalculated)",
    answers: baseAnswers({ heatExposure: ["Tumble-dried"], stainAge: "1–3 days old" }),
    context: baseContext(),
    expect: { status: "compatibility_test_required", minRisk: "amber" },
  },
  {
    name: "Case with no previous treatment",
    answers: baseAnswers({ appliedProducts: ["Nothing"], cleaningProcess: ["No"] }),
    context: baseContext(),
    expect: { status: "ready_for_classification" },
  },
  {
    name: "Dry-cleaned garment where solvent is unknown",
    answers: baseAnswers({
      cleaningProcess: ["Dry-cleaned, solvent not known"],
      cleaningAttempts: 1,
      cleaningOutcome: ["Not sure"],
      treatmentResult: ["Not sure"],
    }),
    context: baseContext(),
    expect: { status: "compatibility_test_required", minRisk: "amber" },
  },
  {
    name: "Country and SDS version do not match",
    answers: baseAnswers({
      capabilityContext: "dry_cleaner",
      trainingCompleted: "Yes",
      equipment: ["Spotting table", "Chemical-resistant gloves", "Eye protection", "Suitable ventilation"],
      country: "India",
      inventory: [
        {
          id: "i3", productName: "Kit bottle 1", company: "STAS", kit: "STAS kit", bottleSize: "1 L",
          country: "Germany", labelAvailable: true, sdsAvailable: true, tdsAvailable: true,
          expiryOrReview: "2027", organizationApproved: true, verificationStatus: "verified",
        },
      ],
    }),
    context: baseContext({ role: "dry_cleaner" }),
    expect: { status: "compatibility_test_required", minRisk: "amber" },
  },
  {
    name: "AI unavailable — questionnaire still completes",
    answers: baseAnswers(),
    context: baseContext({ stainConfidence: 6 }),
    expect: { status: "ready_for_classification" },
  },
  {
    name: "Incomplete answers are never a safe default",
    answers: { ...baseAnswers(), components: [], country: null },
    context: baseContext(),
    expect: { status: "more_information_required" },
  },
  {
    name: "Hazard carried forward from Step 3",
    answers: baseAnswers(),
    context: baseContext({ hazardStop: true, riskBefore: "black", gateBefore: "blocked_pending_identification" }),
    expect: { status: "blocked_possible_hazard", minRisk: "black" },
  },
];

const ORDER: RiskLevel[] = ["green", "amber", "red", "black"];

export function runReadinessScenarios() {
  return READINESS_SCENARIOS.map((s) => {
    const r = evaluateReadiness(s.answers, s.context);
    const statusOk = r.status === s.expect.status;
    const riskOk = !s.expect.minRisk || ORDER.indexOf(r.riskAfter) >= ORDER.indexOf(s.expect.minRisk);
    const notLowered = ORDER.indexOf(r.riskAfter) >= ORDER.indexOf(s.context.riskBefore);
    return {
      name: s.name,
      expected: s.expect.status,
      actual: r.status,
      risk: `${r.riskBefore} → ${r.riskAfter}`,
      pass: statusOk && riskOk && notLowered,
      result: r,
    };
  });
}
