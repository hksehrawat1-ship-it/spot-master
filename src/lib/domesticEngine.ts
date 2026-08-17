/**
 * STEP 12 — Domestic treatment eligibility, confidence and delivery engine.
 *
 * The centralized Step 9 safety engine remains the authority: this engine can only
 * ever be MORE restrictive. It never re-implements safety logic, never invents
 * quantities, dilutions, contact times, temperatures, attempt limits or
 * neutralization, and never constructs a method from user-selected ingredients.
 */

import {
  DOMESTIC_TREATMENTS,
  DOMESTIC_NOT_RECOMMENDED,
  MIN_DOMESTIC_CONFIDENCE,
  STOP_MESSAGE,
  MANDATORY_STOP_CONDITIONS,
  HEAT_AND_DRYING_RULES,
  EXPECTED_OUTCOME_LABEL,
  CONFIDENCE_FACTORS,
  CONFIDENCE_FACTOR_LABEL,
  isActionable,
  type DomesticTreatment,
  type ConfidenceFactorKey,
  type ConfidenceFactors,
  type ExpectedOutcomeKey,
} from "@/data/domesticTreatments";
import {
  HOUSEHOLD_BY_KEY,
  GENERIC_REQUIREMENTS,
  MATERIAL_CLASS_LABEL,
  PROHIBITED_DOMESTIC_PRACTICES,
  UNVERIFIED_FOOD_LABEL,
  FOOD_INGREDIENT_NOTE,
  containsBannedTerm,
  type MaterialClass,
} from "@/data/householdProducts";
import type { FabricKey, ColourKey, ComponentPartKey } from "@/data/masterStains";
import type { RiskLevel, UserRoleKey } from "@/lib/fabricSafety";
import type { SafetyEvaluation } from "@/lib/safetyEngine";

export const DOMESTIC_ENGINE_VERSION = "domestic-engine-v1.0.0";

/* ------------------------------------------------------------------ */
/* Case input                                                          */
/* ------------------------------------------------------------------ */

export type DomesticCase = {
  caseId: string;
  caseVersion: number;
  role: UserRoleKey;
  country: string;

  /* stain */
  stainKey?: string;
  stainVariant?: string | null;
  stainConfidence: number;                 // 0-10
  stainSourceKnown: boolean;
  stainIsUnknownChemical: boolean;
  stainIsBiologicalHazard: boolean;
  combinationComponents: string[];
  stainAge: "fresh" | "recent" | "days" | "old" | "unknown";
  alteredBeyondScope: boolean;

  /* garment */
  fabric: FabricKey | "unknown_material";
  fabricConfidence: "high" | "moderate" | "low" | "unknown";
  colour: ColourKey;
  colourStability: "untested" | "passed" | "failed" | "inconclusive" | "active_bleeding";
  construction: ComponentPartKey[];
  careLabelStatus: "available" | "no_label" | "unclear" | "conflicting";
  careLabelProhibitions: string[];
  careLabelPermissions: string[];
  safeBoundaryEstablished: boolean;
  hiddenTestAreaAvailable: boolean;
  existingDamage: string[];
  highValueGarment: boolean;

  /* history */
  previousChemicals: string[];
  previousChemicalUnknown: boolean;
  multipleProductsMixed: boolean;

  /* case state */
  riskLevel: RiskLevel;
  hiddenTestResult: "not_done" | "passed" | "failed" | "inconclusive";
  attemptCount: number;
  inspectionFindings: string[];
  adverseOutcomeReported: boolean;
  availableMaterials: string[];            // household product keys or material classes
};

export const emptyDomesticCase = (over: Partial<DomesticCase> = {}): DomesticCase => ({
  caseId: "SM-CASE-000000",
  caseVersion: 1,
  role: "domestic_user",
  country: "IN",
  stainConfidence: 0,
  stainSourceKnown: false,
  stainIsUnknownChemical: false,
  stainIsBiologicalHazard: false,
  combinationComponents: [],
  stainAge: "unknown",
  alteredBeyondScope: false,
  fabric: "unknown_material",
  fabricConfidence: "unknown",
  colour: "unknown_stability",
  colourStability: "untested",
  construction: [],
  careLabelStatus: "no_label",
  careLabelProhibitions: [],
  careLabelPermissions: [],
  safeBoundaryEstablished: false,
  hiddenTestAreaAvailable: false,
  existingDamage: [],
  highValueGarment: false,
  previousChemicals: [],
  previousChemicalUnknown: false,
  multipleProductsMixed: false,
  riskLevel: "amber",
  hiddenTestResult: "not_done",
  attemptCount: 0,
  inspectionFindings: [],
  adverseOutcomeReported: false,
  availableMaterials: [],
  ...over,
});

/* ------------------------------------------------------------------ */
/* §7 Automatic rejection                                              */
/* ------------------------------------------------------------------ */

export type RejectionReason = { code: string; plain: string; escalation: string };

const PROFESSIONAL_ESCALATION =
  "Take the garment to a professional cleaner without drying, pressing or applying anything else.";
const SPECIALIST_ESCALATION =
  "This material or condition needs a specialist assessment before any treatment.";
const HAZARD_ESCALATION =
  "Do not touch, heat or add another chemical. Appropriate professional safety assessment is required.";

const AGE_ORDER = ["fresh", "recent", "days", "old"] as const;

export function automaticRejections(c: DomesticCase, ev?: SafetyEvaluation): RejectionReason[] {
  const r: RejectionReason[] = [];
  const add = (code: string, plain: string, escalation = PROFESSIONAL_ESCALATION) =>
    r.push({ code, plain, escalation });

  if (ev?.engineFailure) add("safety_engine_failure", "Safety checks could not be completed.", PROFESSIONAL_ESCALATION);
  if (ev?.hazardReferral) add("hazard", "This case is a possible hazard.", HAZARD_ESCALATION);
  if (ev && ev.blocked) add("safety_blocked", "The safety engine has blocked treatment for this case.", PROFESSIONAL_ESCALATION);
  if (ev && ev.domesticAllowed === false) add("safety_domestic_blocked", "The safety engine does not permit domestic handling of this case.", PROFESSIONAL_ESCALATION);
  if (ev && (ev.outcome === "professional_only" || ev.outcome === "specialist_referral"))
    add("professional_only", "This case requires professional handling.", ev.outcome === "specialist_referral" ? SPECIALIST_ESCALATION : PROFESSIONAL_ESCALATION);

  if (c.stainConfidence < MIN_DOMESTIC_CONFIDENCE)
    add("stain_confidence", `The stain is identified at ${c.stainConfidence}/10, below the 9/10 required for household guidance.`);
  if (!c.stainSourceKnown) add("stain_source", "The source of the stain is not known or verified.");
  if (c.stainIsUnknownChemical) add("unknown_chemical", "An unknown chemical must never be treated at home.", HAZARD_ESCALATION);
  if (c.stainIsBiologicalHazard) add("biological_hazard", "Uncontrolled biological contamination needs appropriate professional controls.", HAZARD_ESCALATION);
  if (c.alteredBeyondScope) add("altered_stain", "The stain has been altered beyond the scope of any approved household method.");

  if (c.fabric === "unknown_material" && !c.safeBoundaryEstablished)
    add("fabric_boundary", "The fabric cannot be placed inside a safe treatment boundary.");
  if (["leather", "suede", "fur"].includes(c.fabric))
    add("specialist_material", "Leather, suede and fur need a specialist.", SPECIALIST_ESCALATION);
  if (["coated", "waterproof"].includes(c.fabric))
    add("coated_material", "Coated or laminated materials need a specialist.", SPECIALIST_ESCALATION);
  if (c.construction.some((k) => ["coatings", "laminations"].includes(k)))
    add("coating_involved", "A coating or lamination is involved.", SPECIALIST_ESCALATION);
  if (c.construction.includes("adhesives"))
    add("glued_decoration", "Glued decoration is affected by this treatment area.");
  if (c.construction.includes("metallic_thread"))
    add("metallic_thread", "Metallic thread can be damaged by the relevant chemistry.");
  if (c.construction.some((k) => ["beads", "sequins", "embroidery"].includes(k)) && c.highValueGarment)
    add("embellished_high_value", "Bridal or heavily embellished garments are not suitable for household treatment.", SPECIALIST_ESCALATION);
  if (c.highValueGarment)
    add("high_value", "High-value, bridal, designer, sentimental or irreplaceable garments are not treated at home when the method carries meaningful risk.");

  if (c.riskLevel === "red" || c.riskLevel === "black")
    add("risk_level", `The current garment risk is ${c.riskLevel === "red" ? "Red" : "Black"}.`);
  if (c.colourStability === "active_bleeding") add("active_bleeding", "The colour is actively bleeding.");
  if (c.existingDamage.includes("colour_loss")) add("existing_colour_loss", "There is existing colour loss on the garment.");
  if (c.existingDamage.some((d) => ["fibre_damage", "melting", "scorch", "peeling_coating", "lamination_separation", "finish_damage"].includes(d)))
    add("existing_damage", "There is existing fibre, coating or finish damage.");

  if (c.careLabelStatus === "conflicting") add("care_label_conflict", "The care instructions conflict with each other.");
  if (c.careLabelProhibitions.some((p) => ["do_not_clean", "do_not_wash", "dry_clean_only", "spot_clean_only"].includes(p)))
    add("care_label_prohibits", "The care label does not permit this kind of household treatment.");

  if (c.previousChemicalUnknown) add("unknown_previous_chemical", "A previous chemical on the garment is unknown.", HAZARD_ESCALATION);
  if (c.multipleProductsMixed) add("mixed_products", "Several products have already been mixed on the garment.", HAZARD_ESCALATION);

  if (!c.hiddenTestAreaAvailable) add("no_test_area", "There is no hidden area where a test can be made.");
  if (c.hiddenTestResult === "failed") add("test_failed", "The hidden-area test failed.");
  if (c.hiddenTestResult === "inconclusive") add("test_inconclusive", "The hidden-area test result was not clear.");

  if (c.adverseOutcomeReported) add("adverse_outcome", "Damage has been reported on this case, so no further household treatment is offered.");
  if (c.inspectionFindings.some((f) => ["ring_formation", "colour_loss", "colour_transfer", "texture_change", "spreading"].includes(f)))
    add("inspection_stop", "The inspection shows a stop condition.");

  if (c.role !== "domestic_user" && c.role !== "learner")
    add("role", "Domestic guidance is prepared for household users.");

  return r;
}

/* ------------------------------------------------------------------ */
/* §6 Per-treatment eligibility                                        */
/* ------------------------------------------------------------------ */

export type EligibilityCheck = { key: string; label: string; pass: boolean; detail: string };

export function checkTreatmentEligibility(c: DomesticCase, t: DomesticTreatment): EligibilityCheck[] {
  const add = (key: string, label: string, pass: boolean, detail: string): EligibilityCheck =>
    ({ key, label, pass, detail });
  const checks: EligibilityCheck[] = [];

  checks.push(add("status", "Method is published", isActionable(t.status), `Status: ${t.status}.`));
  checks.push(add("stain", "Stain matches the approved scope", c.stainKey === t.stainKey,
    c.stainKey === t.stainKey ? "Stain matches." : "This method is approved for a different stain."));
  checks.push(add("stain_confidence", "Stain confidence meets the method minimum",
    c.stainConfidence >= t.minimumStainConfidence,
    `${c.stainConfidence}/10 against a minimum of ${t.minimumStainConfidence}/10.`));
  checks.push(add("role", "User role is eligible", t.eligibleRoles.includes(c.role), `Role ${c.role}.`));
  checks.push(add("country", "Country is eligible", t.eligibleCountries.includes(c.country),
    t.eligibleCountries.includes(c.country) ? `${c.country} is approved.` : `${c.country} is not in the approved country list.`));
  checks.push(add("fabric", "Fabric is eligible",
    (t.eligibleFabrics as string[]).includes(c.fabric) && !(t.prohibitedFabrics as string[]).includes(c.fabric),
    `Fabric ${c.fabric}.`));
  checks.push(add("fabric_confidence", "Fabric confidence is sufficient",
    t.fabricConfidenceRequirement === "high" ? c.fabricConfidence === "high"
      : c.fabricConfidence === "high" || c.fabricConfidence === "moderate",
    `Fabric confidence ${c.fabricConfidence}.`));
  checks.push(add("colour", "Colour is eligible",
    (t.eligibleColours as string[]).includes(c.colour) && !(t.prohibitedColours as string[]).includes(c.colour),
    `Colour ${c.colour}.`));
  checks.push(add("construction", "Construction is eligible",
    !c.construction.some((k) => (t.prohibitedConstructions as string[]).includes(k)),
    c.construction.length ? c.construction.join(", ") : "Plain, unembellished."));
  checks.push(add("care_label", "Care instructions permit the method",
    !c.careLabelProhibitions.some((p) => t.careLabelProhibitors.includes(p)) && c.careLabelStatus !== "conflicting",
    t.careLabelRequirements.join("; ") || "No specific requirement."));
  checks.push(add("risk", "Garment risk is within the approved level",
    riskRank(c.riskLevel) <= riskRank(t.maximumRiskLevel),
    `Case risk ${c.riskLevel}, method maximum ${t.maximumRiskLevel}.`));
  checks.push(add("age", "Stain age is within scope",
    c.stainAge !== "unknown" && AGE_ORDER.indexOf(c.stainAge as typeof AGE_ORDER[number]) <= AGE_ORDER.indexOf(t.maximumStainAge),
    `Stain age ${c.stainAge}, method maximum ${t.maximumStainAge}.`));
  checks.push(add("test_area", "A hidden-area test is possible",
    !t.hiddenAreaTest.required || c.hiddenTestAreaAvailable,
    t.hiddenAreaTest.required ? "This method requires a hidden-area test." : "No hidden-area test is required."));
  checks.push(add("test_result", "Hidden-area test has not failed",
    c.hiddenTestResult !== "failed" && c.hiddenTestResult !== "inconclusive",
    `Test result: ${c.hiddenTestResult}.`));
  checks.push(add("attempts", "Attempt limit is defined and not exceeded",
    t.maximumAttempts !== null && c.attemptCount < t.maximumAttempts,
    t.maximumAttempts === null
      ? "No safe attempt limit is defined for this method, so repeated treatment cannot be published."
      : `Attempt ${c.attemptCount + 1} of ${t.maximumAttempts}.`));
  checks.push(add("stop_conditions", "Stop conditions are defined", t.stopConditions.length > 0,
    `${t.stopConditions.length} stop conditions.`));
  checks.push(add("evidence", "Current evidence is attached",
    t.evidence.length > 0 && t.evidence.every((e) => e.verification === "verified"),
    t.evidence.length ? `${t.evidence.length} evidence records.` : "No evidence attached."));
  checks.push(add("method_complete", "Method values are complete",
    methodValuesComplete(t), methodValuesComplete(t) ? "All required step values are present." : "Required step values are missing."));

  const materials = materialAvailability(c, t);
  checks.push(add("materials", "Required approved materials are available", materials.allAvailable,
    materials.allAvailable ? "All required materials are available." : `Missing: ${materials.missing.map((m) => m.label).join(", ")}.`));

  const product = t.householdProductKey ? HOUSEHOLD_BY_KEY[t.householdProductKey] : undefined;
  checks.push(add("product", "Household product is verified and current",
    !t.householdProductKey || (!!product && product.verification === "verified" && product.status === "active" && !product.formulationChangedAt),
    !t.householdProductKey ? "No chemical product is used."
      : product ? `${product.brand} ${product.productName} — ${product.verification}${product.formulationChangedAt ? ", formulation changed" : ""}.`
      : "Product record missing."));
  checks.push(add("product_country", "Household product matches the user market",
    !product || product.country === c.country,
    product ? `Product market ${product.country}, user market ${c.country}.` : "Not applicable."));

  return checks;
}

const riskRank = (r: RiskLevel) => ({ green: 0, amber: 1, red: 2, black: 3 }[r]);

export function methodValuesComplete(t: DomesticTreatment) {
  if (!t.methodSteps.length) return false;
  if (t.maximumAttempts === null) return false;
  if (!t.stopConditions.length) return false;
  if (t.hiddenAreaTest.required &&
    (!t.hiddenAreaTest.location || !t.hiddenAreaTest.product || !t.hiddenAreaTest.contactTime ||
      !t.hiddenAreaTest.technique || !t.hiddenAreaTest.source || !t.hiddenAreaTest.passConditions.length))
    return false;
  return t.methodSteps.every((s) =>
    s.action && s.material && s.technique && s.inspectionPoint && s.stopCondition &&
    s.temperatureLimit && s.contactTime !== undefined);
}

/* ------------------------------------------------------------------ */
/* §34 Household material selection — never builds a recipe            */
/* ------------------------------------------------------------------ */

export type MaterialAvailability = {
  allAvailable: boolean;
  missing: { label: string; materialClass: string }[];
  matched: { label: string; materialClass: string }[];
  note: string;
};

export function materialAvailability(c: DomesticCase, t: DomesticTreatment): MaterialAvailability {
  const have = new Set(c.availableMaterials);
  const matched: MaterialAvailability["matched"] = [];
  const missing: MaterialAvailability["missing"] = [];
  for (const m of t.requiredMaterials) {
    const ok = m.exactProductRequired
      ? !!m.productKey && have.has(m.productKey)
      : (!!m.productKey && have.has(m.productKey)) || have.has(m.materialClass);
    (ok ? matched : missing).push({ label: m.label, materialClass: m.materialClass });
  }
  return {
    allAvailable: missing.length === 0,
    matched,
    missing,
    note: "Materials are matched to an already approved method. No recipe is ever created from selected ingredients and no mixture is ever suggested.",
  };
}

/** The system never composes a method from selected ingredients. */
export function buildRecipeFromMaterials(): null {
  return null;
}

/* ------------------------------------------------------------------ */
/* §15 Confidence — weakest mandatory factor caps the score            */
/* ------------------------------------------------------------------ */

export type ConfidenceResult = {
  score: number;
  weakestFactor: ConfidenceFactorKey;
  weakestLabel: string;
  weakestValue: number;
  factors: ConfidenceFactors;
  breakdown: { key: ConfidenceFactorKey; label: string; value: number; capping: boolean }[];
  explanation: string;
};

export function computeConfidence(c: DomesticCase, t: DomesticTreatment): ConfidenceResult {
  const product = t.householdProductKey ? HOUSEHOLD_BY_KEY[t.householdProductKey] : undefined;

  const caseFactors: ConfidenceFactors = {
    stain_identification: Math.max(0, Math.min(10, c.stainConfidence)),
    fabric_boundary:
      c.fabricConfidence === "high" ? 10 : c.fabricConfidence === "moderate" ? 7 : c.safeBoundaryEstablished ? 6 : 2,
    colour_stability:
      c.colourStability === "passed" ? 10 : c.colourStability === "untested" ? 7
        : c.colourStability === "inconclusive" ? 4 : c.colourStability === "failed" ? 1 : 0,
    garment_construction:
      c.construction.some((k) => (t.prohibitedConstructions as string[]).includes(k)) ? 2
        : c.construction.length ? 7 : 10,
    care_instruction_compatibility:
      c.careLabelStatus === "conflicting" ? 1
        : c.careLabelProhibitions.some((p) => t.careLabelProhibitors.includes(p)) ? 1
        : c.careLabelStatus === "available" ? 10
        : c.safeBoundaryEstablished ? 9 : 4,
    method_evidence: 10,
    household_product_verification:
      !t.householdProductKey ? 10
        : !product ? 0
        : product.formulationChangedAt ? 4
        : product.verification === "verified" ? 10
        : product.verification === "pending_review" ? 6 : 3,
    previous_treatment_certainty:
      c.previousChemicalUnknown || c.multipleProductsMixed ? 0 : c.previousChemicals.length ? 7 : 10,
    test_feasibility:
      !t.hiddenAreaTest.required ? 9
        : !c.hiddenTestAreaAvailable ? 0
        : c.hiddenTestResult === "passed" ? 10
        : c.hiddenTestResult === "failed" ? 0
        : c.hiddenTestResult === "inconclusive" ? 2 : 8,
    expected_damage_risk:
      c.riskLevel === "green" ? 10 : c.riskLevel === "amber" ? 6 : c.riskLevel === "red" ? 2 : 0,
    country_applicability:
      t.eligibleCountries.includes(c.country) && (!product || product.country === c.country) ? 10 : 2,
  };

  /* The published record's own factors are an independent ceiling. */
  const factors = Object.fromEntries(
    CONFIDENCE_FACTORS.map((k) => [k, Math.min(caseFactors[k], t.confidenceFactors[k] ?? 10)]),
  ) as ConfidenceFactors;

  let weakestFactor: ConfidenceFactorKey = CONFIDENCE_FACTORS[0];
  for (const k of CONFIDENCE_FACTORS) if (factors[k] < factors[weakestFactor]) weakestFactor = k;
  const score = factors[weakestFactor];

  return {
    score,
    weakestFactor,
    weakestLabel: CONFIDENCE_FACTOR_LABEL[weakestFactor],
    weakestValue: score,
    factors,
    breakdown: CONFIDENCE_FACTORS.map((k) => ({
      key: k, label: CONFIDENCE_FACTOR_LABEL[k], value: factors[k], capping: factors[k] === score,
    })),
    explanation:
      `Domestic-treatment confidence is limited by the weakest mandatory safety factor: ${CONFIDENCE_FACTOR_LABEL[weakestFactor]} at ${score}/10. No average is used, so a single weak factor cannot be hidden.`,
  };
}

/* ------------------------------------------------------------------ */
/* §23 Result                                                          */
/* ------------------------------------------------------------------ */

export type DomesticDecision = "domestic_treatment_available" | "not_recommended";

export type DomesticResult = {
  engineVersion: string;
  evaluatedAt: string;
  caseId: string;
  caseVersion: number;
  decision: DomesticDecision;
  /** Exactly the required fallback wording when not recommended. */
  headline: string;
  reasons: RejectionReason[];
  escalation: string;
  confidence: ConfidenceResult | null;
  treatment: DomesticTreatment | null;
  eligibility: EligibilityCheck[];
  materials: MaterialAvailability | null;
  whySuitable: string[];
  beforeYouStart: string[];
  heatAndDrying: string[];
  stopConditions: string[];
  stopMessage: string;
  expectedOutcome: { key: ExpectedOutcomeKey; label: string; note: string } | null;
  attemptsRemaining: number | null;
  sources: { claim: string; source: string; type: string; reviewer?: string }[];
  lastReviewedDate: string | null;
  /** Never contains the chemical method when ineligible. */
  methodVisible: boolean;
  candidatesConsidered: number;
};

const notRecommended = (
  c: DomesticCase,
  reasons: RejectionReason[],
  considered: number,
): DomesticResult => ({
  engineVersion: DOMESTIC_ENGINE_VERSION,
  evaluatedAt: new Date().toISOString(),
  caseId: c.caseId,
  caseVersion: c.caseVersion,
  decision: "not_recommended",
  headline: DOMESTIC_NOT_RECOMMENDED,
  reasons,
  escalation: reasons[0]?.escalation ?? PROFESSIONAL_ESCALATION,
  confidence: null,
  treatment: null,
  eligibility: [],
  materials: null,
  whySuitable: [],
  beforeYouStart: [],
  heatAndDrying: HEAT_AND_DRYING_RULES,
  stopConditions: MANDATORY_STOP_CONDITIONS,
  stopMessage: STOP_MESSAGE,
  expectedOutcome: null,
  attemptsRemaining: null,
  sources: [],
  lastReviewedDate: null,
  methodVisible: false,
  candidatesConsidered: considered,
});

export function evaluateDomestic(
  c: DomesticCase,
  ev?: SafetyEvaluation,
  treatments: DomesticTreatment[] = DOMESTIC_TREATMENTS,
): DomesticResult {
  /* Draft, suspended, rejected and archived methods can never be reached. */
  const publishable = treatments.filter((t) => isActionable(t.status));

  const hard = automaticRejections(c, ev);
  if (hard.length) return notRecommended(c, hard, publishable.length);

  const candidates = publishable.filter((t) => t.stainKey === c.stainKey);
  if (!candidates.length)
    return notRecommended(c, [{
      code: "no_approved_method",
      plain: "There is no approved household method for this stain and garment combination.",
      escalation: PROFESSIONAL_ESCALATION,
    }], publishable.length);

  let best: { t: DomesticTreatment; checks: EligibilityCheck[]; conf: ConfidenceResult } | null = null;
  const failures: RejectionReason[] = [];

  for (const t of candidates) {
    const checks = checkTreatmentEligibility(c, t);
    const failed = checks.filter((x) => !x.pass);
    const conf = computeConfidence(c, t);
    if (failed.length) {
      failures.push(...failed.map((f) => ({
        code: f.key,
        plain: `${f.label}: ${f.detail}`,
        escalation: PROFESSIONAL_ESCALATION,
      })));
      continue;
    }
    if (conf.score < MIN_DOMESTIC_CONFIDENCE) {
      failures.push({
        code: "confidence",
        plain: `Confidence reaches only ${conf.score}/10 because of ${conf.weakestLabel}. At least ${MIN_DOMESTIC_CONFIDENCE}/10 is required.`,
        escalation: PROFESSIONAL_ESCALATION,
      });
      continue;
    }
    if (!best || conf.score > best.conf.score) best = { t, checks, conf };
  }

  if (!best) {
    const seen = new Set<string>();
    const unique = failures.filter((f) => (seen.has(f.code) ? false : (seen.add(f.code), true)));
    return notRecommended(c, unique, publishable.length);
  }

  const { t, checks, conf } = best;
  const materials = materialAvailability(c, t);

  return {
    engineVersion: DOMESTIC_ENGINE_VERSION,
    evaluatedAt: new Date().toISOString(),
    caseId: c.caseId,
    caseVersion: c.caseVersion,
    decision: "domestic_treatment_available",
    headline: t.treatmentName,
    reasons: [],
    escalation: t.escalationPoint,
    confidence: conf,
    treatment: t,
    eligibility: checks,
    materials,
    whySuitable: checks.filter((x) => x.pass).map((x) => `${x.label} — ${x.detail}`),
    beforeYouStart: [
      ...t.preparation,
      "Do not apply heat of any kind before the final inspection.",
      "Do not mix any household products.",
      `Maximum attempts for this method: ${t.maximumAttempts}.`,
    ],
    heatAndDrying: t.dryingRestrictions,
    stopConditions: t.stopConditions,
    stopMessage: STOP_MESSAGE,
    expectedOutcome: {
      key: t.expectedOutcome,
      label: EXPECTED_OUTCOME_LABEL[t.expectedOutcome],
      note: t.expectedOutcomeNote,
    },
    attemptsRemaining: t.maximumAttempts === null ? null : t.maximumAttempts - c.attemptCount,
    sources: t.evidence.map((e) => ({ claim: e.claim, source: e.source, type: e.sourceType, reviewer: e.reviewer })),
    lastReviewedDate: t.lastReviewedDate,
    methodVisible: true,
    candidatesConsidered: candidates.length,
  };
}

/* ------------------------------------------------------------------ */
/* §31 Publication validation                                          */
/* ------------------------------------------------------------------ */

export type ValidationIssue = { field: string; message: string };

export function validateForPublication(t: DomesticTreatment): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const need = (cond: boolean, field: string, message: string) => { if (!cond) issues.push({ field, message }); };

  need(!!t.treatmentName, "treatmentName", "A treatment name is required.");
  need(!!t.stainKey, "stainKey", "A stain must be selected.");
  need(t.eligibleFabrics.length > 0, "eligibleFabrics", "Eligible fabrics must be defined.");
  need(t.eligibleColours.length > 0, "eligibleColours", "Eligible colours must be defined.");
  need(t.eligibleCountries.length > 0, "eligibleCountries", "At least one country must be approved.");
  need(t.eligibleRoles.length > 0, "eligibleRoles", "Eligible user roles must be defined.");
  need(t.minimumStainConfidence >= MIN_DOMESTIC_CONFIDENCE, "minimumStainConfidence", "Minimum stain confidence must be at least 9/10.");
  need(t.methodSteps.length > 0, "methodSteps", "A step-by-step method is required.");
  need(t.maximumAttempts !== null, "maximumAttempts", "A maximum attempt limit is required; it must never be invented.");
  need(t.stopConditions.length > 0, "stopConditions", "Stop conditions are required.");
  need(!!t.escalationPoint, "escalationPoint", "An escalation point is required.");
  need(t.evidence.length > 0, "evidence", "At least one evidence record is required.");
  need(t.evidence.every((e) => e.verification === "verified"), "evidence", "All evidence must be verified.");
  need(!!t.technicalReviewer, "technicalReviewer", "Technical review is required.");
  need(!!t.safetyReviewer, "safetyReviewer", "Chemical-safety review is required.");
  need(!!t.countryReviewer, "countryReviewer", "Country review is required.");
  need(!!t.nextReviewDate, "nextReviewDate", "A next-review date is required.");
  need(methodValuesComplete(t), "methodSteps", "Every step needs an action, material, technique, temperature limit, inspection point and stop condition.");
  if (t.hiddenAreaTest.required) {
    need(!!t.hiddenAreaTest.location && !!t.hiddenAreaTest.product && !!t.hiddenAreaTest.technique,
      "hiddenAreaTest", "The hidden-area test must define location, product and technique.");
    need(t.hiddenAreaTest.passConditions.length > 0 && t.hiddenAreaTest.failConditions.length > 0,
      "hiddenAreaTest", "Pass and fail conditions are required.");
    need(!!t.hiddenAreaTest.source, "hiddenAreaTest", "The hidden-area test must cite an approved source.");
  }
  const banned = containsBannedTerm(`${t.treatmentName} ${t.expectedOutcomeNote} ${t.escalationPoint}`);
  need(banned.length === 0, "terminology", `Prohibited published wording: ${banned.join(", ")}.`);

  /* At least one repeated controlled observation — a single uncontrolled test never reaches 9/10. */
  need(t.evidence.some((e) => e.repeatability === "repeated_controlled"),
    "evidence", "At least one repeated, controlled observation is required before 9/10 confidence.");

  return issues;
}

/* ------------------------------------------------------------------ */
/* §28 Review triggers                                                 */
/* ------------------------------------------------------------------ */

export const REVIEW_TRIGGERS = [
  "product_formulation_changed", "label_changed", "manufacturer_instruction_changed",
  "new_fabric_restriction", "new_dye_risk", "repeated_failures", "damage_report",
  "better_evidence", "country_availability_changed", "translation_outdated",
  "review_date_expired", "stain_classification_changed", "safety_rule_changed",
] as const;
export type ReviewTriggerKey = (typeof REVIEW_TRIGGERS)[number];

export const REVIEW_TRIGGER_LABEL: Record<ReviewTriggerKey, string> = {
  product_formulation_changed: "Household product formulation changed",
  label_changed: "Product label changed",
  manufacturer_instruction_changed: "Manufacturer instruction changed",
  new_fabric_restriction: "New fabric restriction appeared",
  new_dye_risk: "New dye risk appeared",
  repeated_failures: "Repeated failures reported",
  damage_report: "Damage report received",
  better_evidence: "Better evidence became available",
  country_availability_changed: "Country availability changed",
  translation_outdated: "Translation became outdated",
  review_date_expired: "Review date expired",
  stain_classification_changed: "Connected stain classification changed",
  safety_rule_changed: "Safety rule changed",
};

/** Triggers that suspend a method immediately rather than flagging it. */
export const IMMEDIATE_SUSPENSION_TRIGGERS: ReviewTriggerKey[] = ["damage_report"];

export function autoReviewTriggers(t: DomesticTreatment, today = new Date()): ReviewTriggerKey[] {
  const out: ReviewTriggerKey[] = [];
  if (t.nextReviewDate && new Date(t.nextReviewDate) < today) out.push("review_date_expired");
  const product = t.householdProductKey ? HOUSEHOLD_BY_KEY[t.householdProductKey] : undefined;
  if (product?.formulationChangedAt) out.push("product_formulation_changed");
  if (product && product.verification !== "verified") out.push("label_changed");
  return out;
}

/* ------------------------------------------------------------------ */
/* §29 / §30 Feedback and adverse outcomes                             */
/* ------------------------------------------------------------------ */

export const FEEDBACK_OUTCOMES = [
  "stain_removed", "stain_reduced", "no_change", "stain_spread", "ring_formed",
  "colour_changed", "texture_changed", "garment_damaged", "odour_remains",
  "user_stopped", "professional_referral_used",
] as const;
export type FeedbackOutcome = (typeof FEEDBACK_OUTCOMES)[number];

export const FEEDBACK_LABEL: Record<FeedbackOutcome, string> = {
  stain_removed: "Stain removed",
  stain_reduced: "Stain reduced",
  no_change: "No change",
  stain_spread: "Stain spread",
  ring_formed: "Ring formed",
  colour_changed: "Colour changed",
  texture_changed: "Texture changed",
  garment_damaged: "Garment damaged",
  odour_remains: "Odour remains",
  user_stopped: "User stopped",
  professional_referral_used: "Professional referral used",
};

export const DAMAGE_OUTCOMES: FeedbackOutcome[] = [
  "garment_damaged", "colour_changed", "texture_changed", "ring_formed", "stain_spread",
];

export const FEEDBACK_NOTE =
  "User feedback is monitoring evidence, not proof. A method is never modified automatically from feedback.";

/** Configured thresholds before a published method is suspended. */
export const SUSPENSION_THRESHOLDS = { damageReports: 1, repeatedFailures: 5 };

export type MonitoringSummary = {
  domesticTreatmentId: string;
  attempts: number;
  removed: number;
  reduced: number;
  failures: number;
  damageReports: number;
  suspensionRecommended: boolean;
  reviewRecommended: boolean;
  reason: string;
};

export function summarizeMonitoring(
  domesticTreatmentId: string,
  feedback: { domesticTreatmentId: string; outcome: FeedbackOutcome }[],
  adverse: { domesticTreatmentId: string }[],
): MonitoringSummary {
  const f = feedback.filter((x) => x.domesticTreatmentId === domesticTreatmentId);
  const damageReports = adverse.filter((x) => x.domesticTreatmentId === domesticTreatmentId).length;
  const failures = f.filter((x) => x.outcome === "no_change" || DAMAGE_OUTCOMES.includes(x.outcome)).length;
  const suspensionRecommended =
    damageReports >= SUSPENSION_THRESHOLDS.damageReports || failures >= SUSPENSION_THRESHOLDS.repeatedFailures;
  return {
    domesticTreatmentId,
    attempts: f.length,
    removed: f.filter((x) => x.outcome === "stain_removed").length,
    reduced: f.filter((x) => x.outcome === "stain_reduced").length,
    failures,
    damageReports,
    suspensionRecommended,
    reviewRecommended: failures > 0 || damageReports > 0,
    reason: damageReports
      ? "A credible damage report was received; suspend the method and open a technical review."
      : failures >= SUSPENSION_THRESHOLDS.repeatedFailures
        ? "Repeated failures reached the configured threshold."
        : "No threshold reached.",
  };
}

/* ------------------------------------------------------------------ */
/* Public helpers                                                      */
/* ------------------------------------------------------------------ */

export const genericRequirementsFor = (cls: MaterialClass) =>
  GENERIC_REQUIREMENTS.find((g) => g.materialClass === cls) ?? null;

export const materialClassLabel = (cls: string) =>
  MATERIAL_CLASS_LABEL[cls as MaterialClass] ?? cls;

export const foodIngredientWarning = (selected: string[]) => {
  const flagged = selected.filter((s) => s in UNVERIFIED_FOOD_LABEL);
  if (!flagged.length) return null;
  return {
    flagged: flagged.map((f) => UNVERIFIED_FOOD_LABEL[f as keyof typeof UNVERIFIED_FOOD_LABEL]),
    message: FOOD_INGREDIENT_NOTE,
  };
};

export const prohibitedPractices = () => PROHIBITED_DOMESTIC_PRACTICES;
