/** STEP 9 §38 — technical acceptance scenarios for the safety engine. */

import { emptySafetyCase } from "@/data/safetyRules";
import type { SafetyCase } from "@/data/safetyRules";
import { evaluateSafety } from "@/lib/safetyEngine";
import type { SafetyEvaluation } from "@/lib/safetyEngine";

export type Scenario = {
  id: string;
  title: string;
  build: () => SafetyCase;
  expect: (e: SafetyEvaluation) => boolean;
  expectation: string;
};

const c = (over: Partial<SafetyCase>) => () => emptySafetyCase(over);
const pro: Partial<SafetyCase> = {
  role: "professional_spotter",
  training: ["general_professional_use", "trained_spotter_required"],
  ppeAvailable: ["protective_gloves", "eye_protection"],
  ventilation: "local_exhaust",
  equipmentAvailable: ["spotting_table", "water_flushing"],
};

export const SCENARIOS: Scenario[] = [
  { id: "S01", title: "Unknown fabric, unknown stain", build: c({ stainConfidence: 0 }),
    expectation: "Blocked pending identification", expect: (e) => e.blocked },
  { id: "S02", title: "Unknown fabric with risk group", build: c({ ...pro, fabricRiskGroup: "group_b", stainConfidence: 8, stainCategory: "oil_grease" }),
    expectation: "Test required", expect: (e) => e.testRequired },
  { id: "S03", title: "Silk with protein stain", build: c({ ...pro, textile: "silk", fabricConfidence: "high", stainCategory: "protein", stainConfidence: 9, colour: "light" }),
    expectation: "Heat blocked and professional only", expect: (e) => e.heatBlocked && e.outcome === "professional_only" },
  { id: "S04", title: "Bleach plus acid history", build: c({ ...pro, previousChemicals: ["chlorine_bleach", "acid"] }),
    expectation: "Hazard referral", expect: (e) => e.hazardReferral },
  { id: "S05", title: "Bleach plus ammonia history", build: c({ ...pro, previousChemicals: ["chlorine_bleach", "ammonia"] }),
    expectation: "Hazard referral", expect: (e) => e.hazardReferral },
  { id: "S06", title: "Oxidizer plus reducer", build: c({ ...pro, previousChemicals: ["oxygen_bleach", "rust_remover"] }),
    expectation: "Blocked", expect: (e) => e.blocked },
  { id: "S07", title: "Unknown previous product", build: c({ ...pro, previousChemicals: ["unknown_product"], stainConfidence: 9 }),
    expectation: "Blocked, more information required", expect: (e) => e.blocked && e.moreInformationRequired },
  { id: "S08", title: "Two unrinsed products", build: c({ ...pro, unrinsedProductCount: 2, previousRinsed: "no", stainConfidence: 9 }),
    expectation: "Blocked, rinse required", expect: (e) => e.blocked && e.rinseRequired },
  { id: "S09", title: "Existing colour loss", build: c({ ...pro, existingDamage: ["colour_loss"], stainConfidence: 9 }),
    expectation: "Blocked existing damage", expect: (e) => e.blocked && e.gateStatus === "blocked_existing_damage" },
  { id: "S10", title: "Fibre damage present", build: c({ ...pro, existingDamage: ["fibre_damage"], stainConfidence: 9 }),
    expectation: "Blocked, black risk", expect: (e) => e.blocked && e.riskLevel === "black" },
  { id: "S11", title: "Melted surface", build: c({ ...pro, existingDamage: ["melting"], stainConfidence: 9 }),
    expectation: "Blocked and heat blocked", expect: (e) => e.blocked && e.heatBlocked },
  { id: "S12", title: "Do not clean label", build: c({ ...pro, labelStatus: "available", labelProhibitions: ["do_not_clean"], stainConfidence: 9 }),
    expectation: "Blocked", expect: (e) => e.blocked },
  { id: "S13", title: "Do not bleach label with bleach stage", build: c({ ...pro, labelStatus: "available", labelProhibitions: ["do_not_bleach"], treatmentStage: 13, stainConfidence: 9, inspectionCompleted: true }),
    expectation: "Blocked product", expect: (e) => e.productEligibility === "ineligible" },
  { id: "S14", title: "Unreadable label", build: c({ ...pro, labelStatus: "unclear", stainConfidence: 9 }),
    expectation: "More information required", expect: (e) => e.moreInformationRequired },
  { id: "S15", title: "Conflicting label", build: c({ ...pro, labelStatus: "conflicting", stainConfidence: 9 }),
    expectation: "Professional only", expect: (e) => e.outcome === "professional_only" || e.blocked },
  { id: "S16", title: "Dry-clean label is not product permission", build: c({ ...pro, labelStatus: "available", labelPermissions: ["dry_clean"], stainConfidence: 9, product: { productKey: "p1" } }),
    expectation: "Warning issued", expect: (e) => e.warnings.length > 0 },
  { id: "S17", title: "Active dye bleeding", build: c({ ...pro, colourStability: "active_bleeding", stainConfidence: 9 }),
    expectation: "Blocked", expect: (e) => e.blocked },
  { id: "S18", title: "Failed colour test", build: c({ ...pro, testResult: "failed", stainConfidence: 9 }),
    expectation: "Product ineligible", expect: (e) => e.productEligibility === "ineligible" },
  { id: "S19", title: "Multicoloured print untested", build: c({ ...pro, colour: "multicoloured", stainConfidence: 9, textile: "cotton", fabricConfidence: "high" }),
    expectation: "Test required", expect: (e) => e.testRequired },
  { id: "S20", title: "No hidden test area", build: c({ ...pro, hiddenTestAreaAvailable: false, stainConfidence: 9 }),
    expectation: "Professional only", expect: (e) => e.gateStatus !== "proceed" },
  { id: "S21", title: "Glued stones in stain area", build: c({ ...pro, construction: ["glued_stones"], stainConfidence: 9 }),
    expectation: "Blocked, specialist", expect: (e) => e.blocked },
  { id: "S22", title: "Metallic thread", build: c({ ...pro, construction: ["metallic_thread"], stainConfidence: 9, textile: "silk" }),
    expectation: "Professional only", expect: (e) => e.outcome === "professional_only" || e.blocked },
  { id: "S23", title: "Leather item", build: c({ ...pro, textile: "leather", fabricConfidence: "high", stainConfidence: 9 }),
    expectation: "Specialist route", expect: (e) => e.gateStatus === "specialist_material_route" || e.blocked },
  { id: "S24", title: "Coated fabric", build: c({ ...pro, textile: "coated_fabric", fabricConfidence: "high", stainConfidence: 9 }),
    expectation: "Professional only", expect: (e) => e.outcome === "professional_only" || e.blocked },
  { id: "S25", title: "Acetate garment", build: c({ ...pro, textile: "acetate", fabricConfidence: "high", stainConfidence: 9 }),
    expectation: "Professional only with testing", expect: (e) => e.testRequired || e.outcome === "professional_only" },
  { id: "S26", title: "Heat already applied", build: c({ ...pro, heatExposure: "ironed", stainConfidence: 9, textile: "cotton", fabricConfidence: "high" }),
    expectation: "Heat blocked", expect: (e) => e.heatBlocked },
  { id: "S27", title: "Unknown heat history", build: c({ ...pro, heatExposure: "unknown", stainConfidence: 9 }),
    expectation: "Heat blocked, more info", expect: (e) => e.heatBlocked && e.moreInformationRequired },
  { id: "S28", title: "Protein stain with steam product instruction", build: c({ ...pro, stainCategory: "protein", stainConfidence: 9, product: { productKey: "steam-first" } }),
    expectation: "Heat still blocked", expect: (e) => e.heatBlocked },
  { id: "S29", title: "Domestic user with professional product", build: c({ role: "domestic_user", stainConfidence: 9, product: { productKey: "pro-1" } }),
    expectation: "Professional only", expect: (e) => !e.domesticAllowed },
  { id: "S30", title: "Domestic user, low stain confidence", build: c({ role: "domestic_user", stainConfidence: 5, textile: "cotton", fabricConfidence: "high", colour: "white" }),
    expectation: "Domestic not recommended", expect: (e) => !e.domesticAllowed },
  { id: "S31", title: "Missing PPE for hazardous product", build: c({ ...pro, ppeAvailable: [], stainConfidence: 9, product: { productKey: "p", requiredPpe: ["eye_protection"] } }),
    expectation: "Product ineligible", expect: (e) => e.productEligibility === "ineligible" },
  { id: "S32", title: "Ventilation unknown", build: c({ ...pro, ventilation: "unknown", stainConfidence: 9, product: { productKey: "p" } }),
    expectation: "Product blocked", expect: (e) => e.productEligibility !== "eligible" },
  { id: "S33", title: "Missing training", build: c({ ...pro, training: [], stainConfidence: 9, product: { productKey: "p", requiredTraining: ["trained_spotter_required"] } }),
    expectation: "Blocked", expect: (e) => e.blocked || e.productEligibility === "ineligible" },
  { id: "S34", title: "Missing SDS", build: c({ ...pro, stainConfidence: 9, product: { productKey: "p", labelCurrent: true, tdsCurrent: true } }),
    expectation: "Product blocked, insufficient documentation", expect: (e) => e.productEligibility !== "eligible" },
  { id: "S35", title: "Country mismatch", build: c({ ...pro, userCountry: "IN", stainConfidence: 9, product: { productKey: "p", countryMatch: false } }),
    expectation: "More information required", expect: (e) => e.moreInformationRequired },
  { id: "S36", title: "Product prohibits this textile", build: c({ ...pro, textile: "silk", fabricConfidence: "high", stainConfidence: 9, product: { productKey: "p", prohibitedTextiles: ["silk"], claimsAllTextiles: true } }),
    expectation: "Product ineligible despite all-textile claim", expect: (e) => e.productEligibility === "ineligible" },
  { id: "S37", title: "Unknown solvent system", build: c({ ...pro, process: "unknown_solvent", stainConfidence: 9 }),
    expectation: "Product blocked", expect: (e) => e.productEligibility !== "eligible" },
  { id: "S38", title: "Machine entry prohibited", build: c({ ...pro, stainConfidence: 9, product: { productKey: "p", machineEntryProhibited: true } }),
    expectation: "Next stage blocked, rinse required", expect: (e) => e.nextStageBlocked && e.rinseRequired },
  { id: "S39", title: "Inspection finds colour loss", build: c({ ...pro, inspectionFindings: ["colour_loss"], stainConfidence: 9 }),
    expectation: "Blocked, repetition blocked", expect: (e) => e.blocked && e.repetitionBlocked },
  { id: "S40", title: "Three failed attempts", build: c({ ...pro, attemptCount: 3, stainConfidence: 9 }),
    expectation: "Escalate to professional, no repetition", expect: (e) => e.repetitionBlocked || e.outcome === "professional_only" },
  { id: "S41", title: "AI suggestion cannot lift a block", build: c({ ...pro, stainConfidence: 2, aiSuggestion: "Use bleach" }),
    expectation: "Still blocked", expect: (e) => e.blocked },
  { id: "S42", title: "Clean professional case", build: c({ ...pro, textile: "cotton", fabricConfidence: "high", colour: "white", colourStability: "passed", testResult: "passed", stainCategory: "oil_grease", stainComponents: ["oil"], stainConfidence: 9, heatExposure: "none", labelStatus: "available", labelPermissions: ["wash"], currentRisk: "green", hiddenTestAreaAvailable: true, inspectionCompleted: true }),
    expectation: "Proceeds without blocks", expect: (e) => !e.blocked && !e.hazardReferral },
];

export type ScenarioResult = {
  id: string; title: string; expectation: string; pass: boolean;
  outcome: string; determining?: string; risk: string;
};

export const runSafetyScenarios = (): ScenarioResult[] =>
  SCENARIOS.map((s) => {
    const e = evaluateSafety(s.build(), { });
    return {
      id: s.id,
      title: s.title,
      expectation: s.expectation,
      pass: s.expect(e),
      outcome: e.outcome,
      determining: e.determiningRule?.ruleId,
      risk: e.riskLevel,
    };
  });
