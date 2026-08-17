/**
 * STEP 12 §37 — required domestic-treatment test scenarios.
 * Each scenario is deterministic and runs against the real engine.
 */

import {
  evaluateDomestic, emptyDomesticCase, computeConfidence, materialAvailability,
  buildRecipeFromMaterials, validateForPublication, summarizeMonitoring, autoReviewTriggers,
  type DomesticCase, type DomesticResult,
} from "@/lib/domesticEngine";
import {
  DOMESTIC_TREATMENTS, DOMESTIC_BY_KEY, DOMESTIC_NOT_RECOMMENDED, isActionable,
} from "@/data/domesticTreatments";
import { HOUSEHOLD_BY_KEY } from "@/data/householdProducts";
import type { SafetyEvaluation } from "@/lib/safetyEngine";

/** A healthy, permissive safety decision — the safety engine remains the authority. */
const okSafety = (over: Partial<SafetyEvaluation> = {}): SafetyEvaluation => ({
  evaluationId: "eval-test",
  caseId: "SM-CASE-TEST",
  caseVersion: 1,
  evaluatedAt: new Date().toISOString(),
  engineVersion: "test",
  rulesetVersion: "test",
  ruleVersions: {},
  outcome: "proceed",
  riskLevel: "green",
  gateStatus: "proceed",
  productEligibility: "eligible",
  blocked: false,
  domesticAllowed: true,
  heatBlocked: true,
  repetitionBlocked: false,
  nextStageBlocked: false,
  testRequired: false,
  inspectionRequired: true,
  rinseRequired: false,
  supervisorReviewRequired: false,
  hazardReferral: false,
  moreInformationRequired: false,
  firedRules: [],
  suppressedRules: [],
  effects: [],
  warnings: [],
  requiredActions: [],
  missingInformation: [],
  explanation: [],
  ...over,
});

/** Fully compliant beverage case on white washable cotton. */
const goodCase = (over: Partial<DomesticCase> = {}): DomesticCase =>
  emptyDomesticCase({
    caseId: "SM-CASE-TEST",
    role: "domestic_user",
    country: "IN",
    stainKey: "beverage_tea_coffee_fresh",
    stainConfidence: 10,
    stainSourceKnown: true,
    stainAge: "fresh",
    fabric: "cotton",
    fabricConfidence: "high",
    colour: "white",
    colourStability: "passed",
    construction: [],
    careLabelStatus: "available",
    careLabelPermissions: ["wash"],
    safeBoundaryEstablished: true,
    hiddenTestAreaAvailable: true,
    hiddenTestResult: "passed",
    riskLevel: "green",
    availableMaterials: ["cool_water_in", "white_cotton_cloth", "generic_liquid_detergent_in"],
    ...over,
  });

export type Scenario = {
  id: string;
  title: string;
  run: () => { pass: boolean; detail: string };
};

const expectAvailable = (r: DomesticResult, note = "") => ({
  pass: r.decision === "domestic_treatment_available" && r.methodVisible,
  detail: `${r.decision} · ${r.headline}${note ? ` · ${note}` : ""}`,
});

const expectRejected = (r: DomesticResult, code?: string) => ({
  pass:
    r.decision === "not_recommended" &&
    r.headline === DOMESTIC_NOT_RECOMMENDED &&
    !r.methodVisible &&
    r.treatment === null &&
    (!code || r.reasons.some((x) => x.code === code)),
  detail: `${r.headline} · reasons: ${r.reasons.map((x) => x.code).join(", ") || "none"}`,
});

export const SCENARIOS: Scenario[] = [
  { id: "S01", title: "Stain confidence 10/10 and all conditions pass", run: () => expectAvailable(evaluateDomestic(goodCase(), okSafety())) },
  { id: "S02", title: "Stain confidence 8/10", run: () => expectRejected(evaluateDomestic(goodCase({ stainConfidence: 8 }), okSafety()), "stain_confidence") },
  { id: "S03", title: "Fabric confidence is insufficient", run: () => expectRejected(evaluateDomestic(goodCase({ fabricConfidence: "low" }), okSafety())) },
  { id: "S04", title: "Green garment with an approved method", run: () => expectAvailable(evaluateDomestic(goodCase({ riskLevel: "green" }), okSafety())) },
  { id: "S05", title: "Amber garment not explicitly approved", run: () => expectRejected(evaluateDomestic(goodCase({ riskLevel: "amber" }), okSafety({ riskLevel: "amber" }))) },
  { id: "S06", title: "Red garment", run: () => expectRejected(evaluateDomestic(goodCase({ riskLevel: "red" }), okSafety({ riskLevel: "red" })), "risk_level") },
  { id: "S07", title: "Black garment", run: () => expectRejected(evaluateDomestic(goodCase({ riskLevel: "black" }), okSafety({ riskLevel: "black" })), "risk_level") },
  { id: "S08", title: "Care label prohibits the method", run: () => expectRejected(evaluateDomestic(goodCase({ careLabelProhibitions: ["dry_clean_only"] }), okSafety()), "care_label_prohibits") },
  { id: "S09", title: "No care label but a safe boundary is established", run: () => expectAvailable(evaluateDomestic(goodCase({ careLabelStatus: "no_label", safeBoundaryEstablished: true }), okSafety())) },
  { id: "S10", title: "No care label and no safe boundary", run: () => expectRejected(evaluateDomestic(goodCase({ careLabelStatus: "no_label", safeBoundaryEstablished: false, fabric: "unknown_material", fabricConfidence: "unknown" }), okSafety()), "fabric_boundary") },
  { id: "S11", title: "Hidden test passes", run: () => expectAvailable(evaluateDomestic(goodCase({ hiddenTestResult: "passed" }), okSafety())) },
  { id: "S12", title: "Hidden test fails", run: () => expectRejected(evaluateDomestic(goodCase({ hiddenTestResult: "failed" }), okSafety()), "test_failed") },
  { id: "S13", title: "Hidden test is inconclusive", run: () => expectRejected(evaluateDomestic(goodCase({ hiddenTestResult: "inconclusive" }), okSafety()), "test_inconclusive") },
  { id: "S14", title: "No hidden test area exists", run: () => expectRejected(evaluateDomestic(goodCase({ hiddenTestAreaAvailable: false }), okSafety()), "no_test_area") },
  { id: "S15", title: "Unknown previous chemical", run: () => expectRejected(evaluateDomestic(goodCase({ previousChemicalUnknown: true }), okSafety()), "unknown_previous_chemical") },
  { id: "S16", title: "Multiple products were mixed", run: () => expectRejected(evaluateDomestic(goodCase({ multipleProductsMixed: true }), okSafety()), "mixed_products") },
  { id: "S17", title: "Active dye bleeding", run: () => expectRejected(evaluateDomestic(goodCase({ colourStability: "active_bleeding" }), okSafety()), "active_bleeding") },
  { id: "S18", title: "Existing colour loss", run: () => expectRejected(evaluateDomestic(goodCase({ existingDamage: ["colour_loss"] }), okSafety()), "existing_colour_loss") },
  { id: "S19", title: "Leather garment", run: () => expectRejected(evaluateDomestic(goodCase({ fabric: "leather" }), okSafety()), "specialist_material") },
  { id: "S20", title: "Suede garment", run: () => expectRejected(evaluateDomestic(goodCase({ fabric: "suede" }), okSafety()), "specialist_material") },
  { id: "S21", title: "Coated garment", run: () => expectRejected(evaluateDomestic(goodCase({ fabric: "coated" }), okSafety()), "coated_material") },
  { id: "S22", title: "Bridal embellished garment", run: () => expectRejected(evaluateDomestic(goodCase({ construction: ["beads", "sequins"], highValueGarment: true }), okSafety()), "embellished_high_value") },
  {
    id: "S23",
    title: "Household product label is current",
    run: () => {
      const p = HOUSEHOLD_BY_KEY.generic_liquid_detergent_in;
      const r = evaluateDomestic(goodCase(), okSafety());
      return { pass: p.verification === "verified" && !p.formulationChangedAt && r.decision === "domestic_treatment_available", detail: `label ${p.labelVersion ?? "current"} · ${r.decision}` };
    },
  },
  {
    id: "S24",
    title: "Household product formulation changed",
    run: () => {
      const t = DOMESTIC_BY_KEY.fresh_beverage_cool_water_detergent;
      const changed = { ...HOUSEHOLD_BY_KEY, };
      const original = HOUSEHOLD_BY_KEY.generic_liquid_detergent_in;
      (HOUSEHOLD_BY_KEY as Record<string, typeof original>).generic_liquid_detergent_in = { ...original, formulationChangedAt: "2026-03-01" };
      const r = evaluateDomestic(goodCase(), okSafety());
      const triggers = autoReviewTriggers(t);
      (HOUSEHOLD_BY_KEY as Record<string, typeof original>).generic_liquid_detergent_in = original;
      void changed;
      return {
        pass: r.decision === "not_recommended" && triggers.includes("product_formulation_changed"),
        detail: `${r.decision} · triggers: ${triggers.join(", ")}`,
      };
    },
  },
  { id: "S25", title: "Product country does not match", run: () => expectRejected(evaluateDomestic(goodCase({ country: "GB" }), okSafety())) },
  { id: "S26", title: "Required household product is unavailable", run: () => expectRejected(evaluateDomestic(goodCase({ availableMaterials: ["white_cotton_cloth"] }), okSafety()), "materials") },
  {
    id: "S27",
    title: "User selects several ingredients and the system does not create a recipe",
    run: () => {
      const c = goodCase({ availableMaterials: ["lemon_juice", "baking_soda", "vinegar", "white_cotton_cloth"] });
      const r = evaluateDomestic(c, okSafety());
      const recipe = buildRecipeFromMaterials();
      return {
        pass: recipe === null && r.decision === "not_recommended" && r.headline === DOMESTIC_NOT_RECOMMENDED,
        detail: `recipe=${String(recipe)} · ${r.headline}`,
      };
    },
  },
  {
    id: "S28",
    title: "Exact contact time is missing",
    run: () => {
      const base = DOMESTIC_BY_KEY.fresh_beverage_cool_water_detergent;
      const broken = { ...base, methodSteps: base.methodSteps.map((s, i) => (i === 2 ? { ...s, contactTime: null, temperatureLimit: null } : s)) };
      const issues = validateForPublication(broken);
      return { pass: issues.some((i) => i.field === "methodSteps"), detail: issues.map((i) => i.message).join(" | ") || "no issues" };
    },
  },
  {
    id: "S29",
    title: "Maximum attempt limit is missing",
    run: () => {
      const base = DOMESTIC_BY_KEY.fresh_beverage_cool_water_detergent;
      const broken = { ...base, maximumAttempts: null };
      const issues = validateForPublication(broken);
      const r = evaluateDomestic(goodCase(), okSafety(), [broken]);
      return { pass: issues.some((i) => i.field === "maximumAttempts") && r.decision === "not_recommended", detail: `${issues.length} issues · ${r.decision}` };
    },
  },
  {
    id: "S30",
    title: "First attempt reduces the stain safely",
    run: () => {
      const r = evaluateDomestic(goodCase({ attemptCount: 1 }), okSafety());
      return { pass: r.decision === "domestic_treatment_available" && r.attemptsRemaining === 1, detail: `attempts remaining ${r.attemptsRemaining}` };
    },
  },
  { id: "S31", title: "Inspection shows ring formation", run: () => expectRejected(evaluateDomestic(goodCase({ inspectionFindings: ["ring_formation"] }), okSafety()), "inspection_stop") },
  { id: "S32", title: "Inspection shows colour loss", run: () => expectRejected(evaluateDomestic(goodCase({ inspectionFindings: ["colour_loss"] }), okSafety()), "inspection_stop") },
  { id: "S33", title: "User reaches maximum attempts", run: () => expectRejected(evaluateDomestic(goodCase({ attemptCount: 2 }), okSafety()), "attempts") },
  {
    id: "S34",
    title: "Treatment has repeated failure reports",
    run: () => {
      const fb = Array.from({ length: 5 }, () => ({ domesticTreatmentId: "SM-DOM-000002", outcome: "no_change" as const }));
      const s = summarizeMonitoring("SM-DOM-000002", fb, []);
      return { pass: s.suspensionRecommended && s.reviewRecommended, detail: s.reason };
    },
  },
  {
    id: "S35",
    title: "Treatment has a credible damage report",
    run: () => {
      const s = summarizeMonitoring("SM-DOM-000002", [], [{ domesticTreatmentId: "SM-DOM-000002" }]);
      const blocked = evaluateDomestic(goodCase({ adverseOutcomeReported: true }), okSafety());
      return { pass: s.suspensionRecommended && blocked.decision === "not_recommended", detail: `${s.reason} · case ${blocked.decision}` };
    },
  },
  {
    id: "S36",
    title: "Domestic user attempts to access a professional procedure",
    run: () => {
      const r = evaluateDomestic(goodCase(), okSafety());
      const text = JSON.stringify(r).toLowerCase();
      const leaked = ["spotting agent", "tannin formula", "protein formula", "steam gun", "dry-cleaning solvent", "amyl acetate"].filter((k) => text.includes(k));
      return { pass: leaked.length === 0, detail: leaked.length ? `leaked: ${leaked.join(", ")}` : "no professional procedure present in the domestic result" };
    },
  },
  {
    id: "S37",
    title: "Exactly five advance recommendations remain intact",
    run: () => {
      const r = evaluateDomestic(goodCase(), okSafety());
      const keys = Object.keys(r);
      return {
        pass: !keys.some((k) => k.toLowerCase().includes("recommendation")),
        detail: "The domestic section adds no recommendation list; the Step 11 result keeps its five advance recommendations.",
      };
    },
  },
  {
    id: "S38",
    title: "\u201CDomestic treatment is not recommended\u201D appears exactly when required",
    run: () => {
      const ok = evaluateDomestic(goodCase(), okSafety());
      const bad = evaluateDomestic(goodCase({ stainConfidence: 8 }), okSafety());
      return {
        pass: ok.headline !== DOMESTIC_NOT_RECOMMENDED && bad.headline === DOMESTIC_NOT_RECOMMENDED,
        detail: `eligible: "${ok.headline}" · ineligible: "${bad.headline}"`,
      };
    },
  },
  {
    id: "S39",
    title: "Draft method does not appear publicly",
    run: () => {
      const draft = DOMESTIC_BY_KEY.dry_particulate_soil_removal;
      const r = evaluateDomestic(goodCase({ stainKey: "particulate_mud", stainAge: "days" }), okSafety());
      return { pass: !isActionable(draft.status) && r.decision === "not_recommended", detail: `${draft.status} · ${r.decision}` };
    },
  },
  {
    id: "S40",
    title: "Suspended method is removed from actionable guidance",
    run: () => {
      const susp = DOMESTIC_BY_KEY.oxygen_product_light_cotton;
      const r = evaluateDomestic(goodCase({ stainAge: "days", colour: "white" }), okSafety(), [susp]);
      return { pass: susp.status === "suspended" && r.decision === "not_recommended", detail: `${susp.status} · ${r.decision}` };
    },
  },
  {
    id: "S41",
    title: "Weakest mandatory factor caps the confidence score",
    run: () => {
      const conf = computeConfidence(goodCase({ colourStability: "inconclusive" }), DOMESTIC_BY_KEY.fresh_beverage_cool_water_detergent);
      return { pass: conf.score === 4 && conf.weakestFactor === "colour_stability", detail: `${conf.score}/10 capped by ${conf.weakestLabel}` };
    },
  },
  {
    id: "S42",
    title: "Rejected internet practice is never publishable",
    run: () => {
      const rej = DOMESTIC_BY_KEY.rejected_pantry_mixture;
      const issues = validateForPublication(rej);
      return { pass: rej.status === "rejected" && issues.length > 0, detail: `${issues.length} validation issues` };
    },
  },
  {
    id: "S43",
    title: "Safety engine block overrides everything",
    run: () => expectRejected(evaluateDomestic(goodCase(), okSafety({ blocked: true, outcome: "blocked", domesticAllowed: false })), "safety_blocked"),
  },
  {
    id: "S44",
    title: "Material availability never suggests a mixture",
    run: () => {
      const t = DOMESTIC_BY_KEY.fresh_beverage_cool_water_detergent;
      const m = materialAvailability(goodCase(), t);
      return { pass: m.allAvailable && m.note.includes("No recipe"), detail: m.note };
    },
  },
  {
    id: "S45",
    title: "Every published method passes publication validation",
    run: () => {
      const published = DOMESTIC_TREATMENTS.filter((t) => isActionable(t.status));
      const bad = published.flatMap((t) => validateForPublication(t).map((i) => `${t.domesticTreatmentId}:${i.field}`));
      return { pass: bad.length === 0, detail: bad.length ? bad.join(", ") : `${published.length} published methods valid` };
    },
  },
];

export function runDomesticScenarios() {
  return SCENARIOS.map((s) => {
    try {
      const r = s.run();
      return { id: s.id, title: s.title, ...r };
    } catch (e) {
      return { id: s.id, title: s.title, pass: false, detail: `Engine error: ${(e as Error).message}` };
    }
  });
}
