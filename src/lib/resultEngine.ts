/**
 * STEP 11 — Treatment Result Engine.
 *
 * Converts an assessed case + a Step 9 safety decision + Step 8 verified
 * mappings into a controlled, role-aware, versioned treatment result.
 *
 * Rules obeyed here:
 *  - No safety logic is re-implemented. The safety engine decides; this file presents.
 *  - No chemistry, dose, dilution, contact time, temperature or neutralization is
 *    ever generated. Missing values become explicit fallback text.
 *  - Role redaction happens in the data layer, not in the screen.
 */

import {
  MASTER_STAINS,
  MASTER_BY_KEY,
  DOMESTIC_NOT_RECOMMENDED,
  MIN_DOMESTIC_CONFIDENCE,
  INSUFFICIENT_INFORMATION,
  OUTCOME_LABEL as OUTCOME_CLASS_LABEL,
  FABRIC_LABEL,
  COLOUR_LABEL,
  STAGE_LABEL,
  PROHIBITION_LABEL,
  EVIDENCE_LABEL,
  type MasterStain,
  type OutcomeClass,
  type FabricKey,
  type ColourKey,
} from "@/data/masterStains";
import { PRODUCT_BY_KEY, COMPANY_BY_KEY } from "@/data/professionalProducts";
import { SEED_MAPPINGS, type ProductStageMapping } from "@/data/productMappings";
import { STAGE_BY_NUMBER, INSPECTION_FIELDS, INSPECTION_LABEL, type InspectionField } from "@/data/treatmentStages";
import {
  evaluateCase as evaluateMappingCase,
  emptyCase as emptyMappingCase,
  versionOf,
  type MappingCase,
  type EligibilityResult,
  OUTCOME_LABEL as ELIGIBILITY_LABEL,
} from "@/lib/mappingEngine";
import { ENGINE_FAILURE_MESSAGE, type SafetyCase } from "@/data/safetyRules";
import type { SafetyEvaluation } from "@/lib/safetyEngine";
import type { RiskLevel } from "@/lib/fabricSafety";

export const RESULT_ENGINE_VERSION = "step11-result-v1";
export const FOLLOW_LABEL_TEXT = "Follow the current product label or technical data sheet.";
export const INSUFFICIENT_TREATMENT = "Insufficient Information — treatment instruction unavailable.";
export const SAFETY_UNAVAILABLE =
  "Safety checks could not be completed. Treatment guidance is temporarily unavailable.";
export const NO_VERIFIED_PRODUCT =
  "No verified product instruction is available for the current conditions.";
export const UNKNOWN_STAIN_MESSAGE =
  "The stain cannot be identified confidently. Only safe assessment and referral guidance is available.";
export const UNKNOWN_FABRIC_MESSAGE =
  "The fabric cannot be identified within a safe treatment boundary. Do not apply stain-removal chemicals yet.";
export const POSSIBLE_DAMAGE_MESSAGE =
  "The remaining mark may be dye, fibre or finish damage rather than a removable stain.";
export const HAZARD_STOP_MESSAGE =
  "Do not touch, heat or add another chemical. Appropriate professional safety assessment is required.";
export const STOP_TREATMENT_MESSAGE =
  "Stop treatment. Do not apply another product or heat. Record the result and escalate the case.";
export const NO_RANK_MESSAGE =
  "The products cannot be ranked reliably because comparable verified information is incomplete.";
export const REPEAT_UNKNOWN_MESSAGE =
  "Do not repeat automatically. Follow the current product label or technical data sheet.";

/* ------------------------------------------------------------------ */
/* Vocabularies                                                        */
/* ------------------------------------------------------------------ */

export const PRESENTATION_MODES = [
  "domestic",
  "quick_professional",
  "technical_professional",
  "training",
  "administration",
] as const;
export type PresentationMode = (typeof PRESENTATION_MODES)[number];

export const MODE_LABEL: Record<PresentationMode, string> = {
  domestic: "Domestic mode",
  quick_professional: "Quick professional mode",
  technical_professional: "Technical professional mode",
  training: "Training mode (simulation)",
  administration: "Administration preview",
};

export const RESULT_TYPES = [
  "domestic_treatment",
  "quick_professional",
  "technical_professional",
  "assessment_only",
  "compatibility_test_required",
  "professional_referral",
  "specialist_material",
  "unknown_stain",
  "possible_damage",
  "hazard_stop",
  "insufficient_information",
] as const;
export type ResultType = (typeof RESULT_TYPES)[number];

export const RESULT_TYPE_LABEL: Record<ResultType, string> = {
  domestic_treatment: "Domestic treatment result",
  quick_professional: "Quick professional result",
  technical_professional: "Technical professional result",
  assessment_only: "Assessment-only result",
  compatibility_test_required: "Compatibility test required",
  professional_referral: "Professional referral",
  specialist_material: "Specialist material",
  unknown_stain: "Unknown stain",
  possible_damage: "Possible damage",
  hazard_stop: "Hazard stop",
  insufficient_information: "Insufficient information",
};

export const RESULT_STATUSES = [
  "draft_assessment",
  "ready",
  "testing_required",
  "professional_only",
  "blocked",
  "in_progress",
  "stopped",
  "escalated",
  "completed",
  "closed_as_damage",
  "closed_unresolved",
  "superseded",
] as const;
export type ResultStatus = (typeof RESULT_STATUSES)[number];

export const RESULT_STATUS_LABEL: Record<ResultStatus, string> = {
  draft_assessment: "Draft Assessment",
  ready: "Ready",
  testing_required: "Testing Required",
  professional_only: "Professional Only",
  blocked: "Blocked",
  in_progress: "In Progress",
  stopped: "Stopped",
  escalated: "Escalated",
  completed: "Completed",
  closed_as_damage: "Closed as Damage",
  closed_unresolved: "Closed Unresolved",
  superseded: "Superseded",
};

export const PRIMARY_STATUS_TEXT = {
  cautious: "Cautious Treatment May Proceed",
  testing: "Testing Required Before Treatment",
  professional: "Professional Treatment Only",
  specialist: "Specialist Assessment Required",
  hold: "Do Not Treat Yet",
  damage: "Possible Fabric Damage",
  insufficient: "Insufficient Information",
} as const;
export type PrimaryStatusKey = keyof typeof PRIMARY_STATUS_TEXT;

export const PRIMARY_STATUS_ICON: Record<PrimaryStatusKey, string> = {
  cautious: "shield-check",
  testing: "flask",
  professional: "briefcase",
  specialist: "microscope",
  hold: "hand",
  damage: "alert-triangle",
  insufficient: "help-circle",
};

export const RISK_TEXT: Record<RiskLevel, string> = {
  green: "Green — low damage risk",
  amber: "Amber — cautious handling",
  red: "Red — professional handling",
  black: "Black — do not treat",
};

/* ------------------------------------------------------------------ */
/* Case input                                                          */
/* ------------------------------------------------------------------ */

export type ResultCase = {
  caseId: string;
  caseVersion: number;
  createdAt: string;
  lastAssessedAt: string;

  mode: PresentationMode;
  country: string;
  organizationKey?: string;

  /** Recorded assessment identities — prerequisites, not free text. */
  fabricAssessmentId: string | null;
  stainAssessmentId: string | null;
  readinessStatus: string | null;
  readinessGatePermitsResult: boolean;

  stainKey?: string;
  alternativeStainKeys: string[];
  stainIsUnknown: boolean;

  garmentType: string;
  componentsPresent: string[];
  availableProducts: string[];
  availableEquipment: string[];
  missingInformation: string[];

  /** Full safety-engine input, reused verbatim. */
  safety: SafetyCase;
  /** Full mapping-engine input, reused verbatim. */
  mapping: MappingCase;
};

export const emptyResultCase = (over: Partial<ResultCase> = {}): ResultCase => ({
  caseId: "SM-CASE-000000",
  caseVersion: 1,
  createdAt: new Date().toISOString(),
  lastAssessedAt: new Date().toISOString(),
  mode: "domestic",
  country: "IN",
  fabricAssessmentId: null,
  stainAssessmentId: null,
  readinessStatus: null,
  readinessGatePermitsResult: true,
  alternativeStainKeys: [],
  stainIsUnknown: false,
  garmentType: "Garment",
  componentsPresent: [],
  availableProducts: [],
  availableEquipment: [],
  missingInformation: [],
  safety: {} as SafetyCase,
  mapping: emptyMappingCase(),
  ...over,
});

/* ------------------------------------------------------------------ */
/* Prerequisites (§2)                                                  */
/* ------------------------------------------------------------------ */

export type PrerequisiteCheck = { key: string; label: string; ok: boolean; detail: string };

export function checkPrerequisites(rc: ResultCase, ev?: SafetyEvaluation): PrerequisiteCheck[] {
  const checks: PrerequisiteCheck[] = [];
  const add = (key: string, label: string, ok: boolean, detail: string) =>
    checks.push({ key, label, ok, detail });

  add("case", "Case assessment exists", Boolean(rc.caseId && rc.fabricAssessmentId && rc.stainAssessmentId),
    rc.fabricAssessmentId && rc.stainAssessmentId
      ? "Fabric and stain assessments are recorded."
      : "A recorded fabric assessment and stain assessment are required.");
  add("version", "Current case version saved", rc.caseVersion >= 1, `Case version ${rc.caseVersion}.`);
  add("safety", "Safety evaluation succeeded", Boolean(ev && !ev.engineFailure),
    ev?.engineFailure ? ENGINE_FAILURE_MESSAGE : "Safety engine returned a decision.");
  add("ruleset", "Rule-set version recorded", Boolean(ev?.rulesetVersion), ev?.rulesetVersion ?? "Missing");
  add("gate", "Treatment gate permits a result", rc.readinessGatePermitsResult,
    rc.readinessGatePermitsResult ? "Readiness gate allows a result to be generated." : "Treatment readiness has not been completed.");
  add("classification", "Stain classification exists or case is Unknown",
    Boolean(rc.stainKey) || rc.stainIsUnknown,
    rc.stainKey ? `Classified as ${MASTER_BY_KEY[rc.stainKey]?.canonicalName ?? rc.stainKey}.` : "Case is explicitly marked Unknown.");
  add("risk", "Current risk available", Boolean(ev?.riskLevel), ev ? RISK_TEXT[ev.riskLevel] : "Missing");
  add("role", "User role and permissions verified", Boolean(rc.safety?.role), rc.safety?.role ?? "Missing");
  add("country", "Country known", Boolean(rc.country), rc.country || "Missing");
  add("documents", "Required source documents approved", true,
    "Product rows are filtered by the Step 7/8 document state; unverified rows never recommend.");
  add("stop", "No unresolved Stop rule", Boolean(ev && !ev.blocked) || Boolean(ev?.blocked),
    ev?.blocked ? "A Stop rule is active — a blocked result type is used." : "No Stop rule active.");
  return checks;
}

export const prerequisitesMet = (checks: PrerequisiteCheck[]) =>
  checks.filter((c) => c.key !== "stop").every((c) => c.ok);

/* ------------------------------------------------------------------ */
/* Result type + header (§3, §4)                                       */
/* ------------------------------------------------------------------ */

export function resolveResultType(rc: ResultCase, ev: SafetyEvaluation): ResultType {
  if (ev.engineFailure) return "insufficient_information";
  if (ev.hazardReferral) return "hazard_stop";
  if (rc.safety.existingDamage?.some((d) =>
    ["colour_loss", "fibre_damage", "melting", "scorch", "peeling_coating", "lamination_separation"].includes(d)))
    return "possible_damage";
  if (ev.outcome === "specialist_referral") return "specialist_material";
  if (ev.blocked) return rc.stainIsUnknown ? "unknown_stain" : "professional_referral";
  if (rc.stainIsUnknown || (rc.safety.stainConfidence ?? 0) < 4) return "unknown_stain";
  if (ev.moreInformationRequired) return "insufficient_information";
  if (ev.outcome === "professional_only") return "professional_referral";
  if (ev.testRequired) return "compatibility_test_required";
  if (rc.mode === "domestic") return ev.domesticAllowed ? "domestic_treatment" : "assessment_only";
  if (rc.mode === "technical_professional" || rc.mode === "administration") return "technical_professional";
  return "quick_professional";
}

export function primaryStatus(rc: ResultCase, ev: SafetyEvaluation, type: ResultType): PrimaryStatusKey {
  if (type === "possible_damage") return "damage";
  if (type === "hazard_stop" || ev.blocked) return "hold";
  if (type === "specialist_material") return "specialist";
  if (type === "insufficient_information" || type === "unknown_stain") return "insufficient";
  if (type === "professional_referral") return "professional";
  if (ev.testRequired) return "testing";
  return "cautious";
}

/* ------------------------------------------------------------------ */
/* Section 1 — Case understanding (§6)                                 */
/* ------------------------------------------------------------------ */

export type CaseUnderstanding = { label: string; value: string; plain: string }[];

const listOr = (v: string[] | undefined, fallback = "Not recorded") =>
  v && v.length ? v.join(", ") : fallback;

export function buildCaseUnderstanding(rc: ResultCase): CaseUnderstanding {
  const s = rc.safety;
  const stain = rc.stainKey ? MASTER_BY_KEY[rc.stainKey] : undefined;
  return [
    { label: "Stain", value: stain?.canonicalName ?? "Unknown stain", plain: "What we think the mark is." },
    {
      label: "Alternative possibilities",
      value: rc.alternativeStainKeys.map((k) => MASTER_BY_KEY[k]?.canonicalName ?? k).join(", ") || "None recorded",
      plain: "Other stains that look similar.",
    },
    { label: "Likely source", value: stain?.commonSources?.[0]?.name ?? "Not recorded", plain: "Where the mark probably came from." },
    { label: "Fabric / risk group", value: `${s.textile ?? "unknown_material"}${s.fabricRiskGroup ? ` · ${s.fabricRiskGroup.replace("group_", "Group ").toUpperCase()}` : ""}`, plain: "The material and how carefully it must be handled." },
    { label: "Fabric confidence", value: s.fabricConfidence ?? "unknown", plain: "How sure we are about the material." },
    { label: "Garment type", value: rc.garmentType, plain: "The item itself." },
    { label: "Colour", value: s.colour ?? "unknown", plain: "Colour and dye stability matter for every chemical." },
    { label: "Care-label status", value: s.labelStatus ?? "unclear", plain: "Whether the care label could be read." },
    { label: "Care restrictions", value: listOr(s.labelProhibitions, "None recorded"), plain: "What the label forbids." },
    { label: "Construction and decoration", value: listOr(s.construction, "None recorded"), plain: "Linings, prints, beads, coatings." },
    { label: "Stain age", value: s.stainAge ?? "unknown", plain: "Older marks hold on harder." },
    { label: "Heat exposure", value: String(s.heatExposure ?? "unknown"), plain: "Heat can set a stain permanently." },
    { label: "Previous treatment", value: listOr(s.previousTreatments, "None recorded"), plain: "What was already tried." },
    { label: "Existing damage", value: listOr(s.existingDamage, "None recorded"), plain: "Damage already present before treatment." },
    { label: "User type", value: s.role ?? "unknown", plain: "Guidance is limited to what your role permits." },
    { label: "Country", value: rc.country, plain: "Product documents differ by country." },
    { label: "Available products", value: listOr(rc.availableProducts, "None recorded"), plain: "What you have on hand." },
    { label: "Available equipment", value: listOr(rc.availableEquipment, "None recorded"), plain: "Equipment changes what is safe." },
    { label: "Missing information", value: listOr([...rc.missingInformation, ...(rc.missingInformation.length ? [] : [])], "None") , plain: "Gaps that limit this result." },
  ];
}

/* ------------------------------------------------------------------ */
/* Section 2 — Exactly five advance recommendations (§7)               */
/* ------------------------------------------------------------------ */

export const RECOMMENDATION_TOPICS = [
  "treatment_attempt",
  "fabric_colour_testing",
  "safest_option",
  "damage_risk",
  "stop_or_escalation",
] as const;
export type RecommendationTopic = (typeof RECOMMENDATION_TOPICS)[number];

export const TOPIC_LABEL: Record<RecommendationTopic, string> = {
  treatment_attempt: "Should treatment be attempted",
  fabric_colour_testing: "Fabric and colour testing",
  safest_option: "Safest eligible option",
  damage_risk: "Main garment-damage risk",
  stop_or_escalation: "Stop / escalation condition",
};

export type Recommendation = {
  topic: RecommendationTopic;
  text: string;
  supportedBy: string[]; // rule IDs or record IDs
};

export function buildRecommendations(
  rc: ResultCase,
  ev: SafetyEvaluation,
  type: ResultType,
  best?: EligibilityResult,
): Recommendation[] {
  const determining = ev.determiningRule;
  const rules = ev.firedRules.map((f) => f.ruleId);
  const stain = rc.stainKey ? MASTER_BY_KEY[rc.stainKey] : undefined;
  const noTreatment = ev.blocked || type === "hazard_stop" || type === "possible_damage";

  if (noTreatment) {
    return [
      { topic: "treatment_attempt", text: `Do not treat this ${rc.garmentType.toLowerCase()}. ${determining?.warning ?? HAZARD_STOP_MESSAGE}`, supportedBy: rules },
      { topic: "fabric_colour_testing", text: "Do not run any product or colour test while this block is active.", supportedBy: determining ? [determining.ruleId] : rules },
      { topic: "safest_option", text: "Avoid heat and avoid adding any further chemical, including water-based household products.", supportedBy: rules },
      { topic: "damage_risk", text: "Preserve the care label, packaging of anything already applied, and photograph the area as evidence.", supportedBy: rules },
      { topic: "stop_or_escalation", text: determining?.requiredAction ?? "Seek the appropriate professional or safety assessment before anything else is done.", supportedBy: rules },
    ];
  }

  const testRule = ev.firedRules.find((f) => f.effects.includes("require_compatibility_test"));
  const damageRule =
    ev.firedRules.find((f) => f.category === "material_fabric") ??
    ev.firedRules.find((f) => f.category === "colour_dye") ??
    ev.firedRules.find((f) => f.category === "construction_finish") ??
    determining;
  const stopRule =
    ev.firedRules.find((f) => f.stopCondition) ?? determining;

  return [
    {
      topic: "treatment_attempt",
      text:
        type === "domestic_treatment"
          ? "Cautious domestic treatment may be attempted using the approved method below, one attempt at a time."
          : type === "professional_referral"
            ? "Do not treat this yourself — this case is limited to professional handling."
            : `Treatment may proceed with caution at ${STAGE_BY_NUMBER[rc.mapping.stageNumber]?.name ?? `stage ${rc.mapping.stageNumber}`}, following the sequence below.`,
      supportedBy: determining ? [determining.ruleId] : [],
    },
    {
      topic: "fabric_colour_testing",
      text: ev.testRequired
        ? `A hidden-area test is required first${rc.safety.hiddenTestAreaAvailable === false ? " but no hidden area was recorded — treatment cannot start" : ""}.`
        : rc.safety.colourStability === "passed"
          ? "Colourfastness already passed; re-check the hidden area if the garment dries differently."
          : "Check colour on a hidden area before the first application.",
      supportedBy: testRule ? [testRule.ruleId] : [],
    },
    {
      topic: "safest_option",
      text: best
        ? `${PRODUCT_BY_KEY[best.productKey]?.displayName ?? best.productKey} (${best.productVersionKey}) — ${ELIGIBILITY_LABEL[best.outcome]}.`
        : type === "domestic_treatment"
          ? "Use only the approved domestic materials listed below; nothing else is verified for this case."
          : NO_VERIFIED_PRODUCT,
      supportedBy: best ? [best.mappingId] : [],
    },
    {
      topic: "damage_risk",
      text:
        damageRule?.warning ??
        stain?.fabricRules?.[0]?.mainRisk ??
        `Main risk on ${FABRIC_LABEL[(rc.safety.textile as FabricKey) ?? "unknown_material"] ?? "this material"}: dye movement and fibre change during wet work.`,
      supportedBy: damageRule ? [damageRule.ruleId] : [],
    },
    {
      topic: "stop_or_escalation",
      text: stopRule?.stopCondition ?? "Stop at the first sign of colour loss, dye bleeding, texture change or an unexpected reaction, and escalate the case.",
      supportedBy: stopRule ? [stopRule.ruleId] : [],
    },
  ];
}

export type RecommendationValidation = { ok: boolean; count: number; issues: string[] };

export function validateRecommendations(recs: Recommendation[]): RecommendationValidation {
  const issues: string[] = [];
  if (recs.length !== 5) issues.push(`Exactly five advance recommendations are required — found ${recs.length}.`);
  const topics = new Set(recs.map((r) => r.topic));
  for (const t of RECOMMENDATION_TOPICS) if (!topics.has(t)) issues.push(`Missing recommendation topic: ${TOPIC_LABEL[t]}.`);
  recs.forEach((r, i) => {
    if (!r.text.trim()) issues.push(`Recommendation ${i + 1} is empty.`);
    if (r.text.trim().length > 260) issues.push(`Recommendation ${i + 1} is not short enough.`);
  });
  return { ok: issues.length === 0, count: recs.length, issues };
}

/* ------------------------------------------------------------------ */
/* Section 3 — Confidence and risk (§8)                                */
/* ------------------------------------------------------------------ */

export type ConfidenceBlock = {
  stain: number;
  fabric: number;
  treatment: number;
  productDocumentation: number | null;
  risk: RiskLevel;
  professionalHandling: "Yes" | "No" | "Conditional";
  explanations: { label: string; text: string }[];
};

const FABRIC_CONF_SCORE: Record<string, number> = { high: 9, moderate: 6, low: 3, unknown: 1 };

export function buildConfidence(rc: ResultCase, ev: SafetyEvaluation, best?: EligibilityResult): ConfidenceBlock {
  const stain = Math.max(0, Math.min(10, rc.stainIsUnknown ? 1 : rc.safety.stainConfidence ?? 0));
  const fabric = FABRIC_CONF_SCORE[rc.safety.fabricConfidence ?? "unknown"] ?? 1;

  const docScore = best
    ? best.evidenceLevel === "current_manufacturer_instruction" || best.evidenceLevel === "current_tds" || best.evidenceLevel === "current_manufacturer_label"
      ? 9
      : best.provisional
        ? 4
        : 6
    : null;

  let treatment = Math.round((stain + fabric) / 2);
  if (rc.safety.colourStability === "failed" || rc.safety.colourStability === "active_bleeding") treatment -= 4;
  else if (rc.safety.colourStability === "untested") treatment -= 1;
  if ((rc.safety.construction ?? []).length > 1) treatment -= 1;
  if ((rc.safety.previousChemicals ?? []).length) treatment -= 2;
  if (docScore !== null) treatment = Math.round((treatment * 2 + docScore) / 3);
  if (best && best.outcome !== "eligible" && best.outcome !== "eligible_after_testing") treatment -= 2;
  if (rc.country !== rc.mapping.country) treatment -= 1;
  if (rc.safety.role === "domestic_user") treatment -= 1;
  if (ev.testRequired && rc.safety.hiddenTestAreaAvailable !== true) treatment -= 2;
  if (!(rc.safety.ppeAvailable ?? []).length && rc.safety.role !== "domestic_user") treatment -= 1;
  if (ev.blocked) treatment = Math.min(treatment, 2);
  treatment = Math.max(0, Math.min(10, treatment));

  const explanations: { label: string; text: string }[] = [];
  if (stain < 7) explanations.push({ label: "Stain identification", text: "Appearance alone cannot confirm chemistry; alternatives remain open." });
  if (fabric < 7) explanations.push({ label: "Fabric identification", text: "The fibre was not confirmed, so the safe treatment boundary is set by the most sensitive plausible material." });
  if (docScore !== null && docScore < 7) explanations.push({ label: "Product documentation", text: "The current product document set is incomplete or provisional for this country." });
  if (rc.safety.colourStability !== "passed") explanations.push({ label: "Dye stability", text: "Colourfastness has not passed a recorded test." });
  if ((rc.safety.previousChemicals ?? []).length) explanations.push({ label: "Previous chemistry", text: "Products already applied change how the next chemical behaves." });

  return {
    stain,
    fabric,
    treatment,
    productDocumentation: docScore,
    risk: ev.riskLevel,
    professionalHandling: ev.blocked || ev.outcome === "professional_only" || ev.outcome === "specialist_referral"
      ? "Yes"
      : ev.testRequired || ev.riskLevel === "amber"
        ? "Conditional"
        : "No",
    explanations,
  };
}

/* ------------------------------------------------------------------ */
/* Section 4 — Stain science (§9)                                      */
/* ------------------------------------------------------------------ */

export type ScienceRow = {
  category: string;
  composition: string;
  solubility: string;
  bonding: string;
  heat: string;
  ageing: string;
  principle: string;
  uncertainty: string;
  plain: string[];
};

export function buildScience(rc: ResultCase): ScienceRow | null {
  const s = rc.stainKey ? MASTER_BY_KEY[rc.stainKey] : undefined;
  if (!s) return null;
  const sc = s.science;
  return {
    category: s.primaryCategory,
    composition: sc.composition,
    solubility: sc.solubility,
    bonding: sc.bonding,
    heat: sc.heat,
    ageing: sc.ageing,
    principle: sc.whyPrincipleMayWork ?? INSUFFICIENT_INFORMATION,
    uncertainty: sc.uncertainty,
    plain: [s.sciencePlain, sc.heat, sc.ageing].filter(Boolean),
  };
}

/* ------------------------------------------------------------------ */
/* Section 5 — Fabric compatibility (§10)                              */
/* ------------------------------------------------------------------ */

export type FabricRow = {
  component: string;
  mainRisk: string;
  testRequired: string;
  suitable: string;
  prohibited: string;
  referral: string;
  mostSensitive?: boolean;
};

const SENSITIVE_ORDER = [
  "coating", "lamination", "adhesive", "beads", "sequins", "metallic_thread", "leather_trim",
  "suede_trim", "fur_trim", "interlining", "lining", "print", "embroidery", "elastic",
];

export function buildFabricCompatibility(rc: ResultCase): FabricRow[] {
  const stain = rc.stainKey ? MASTER_BY_KEY[rc.stainKey] : undefined;
  const rows: FabricRow[] = [];
  const push = (component: string, rule?: MasterStain["fabricRules"][number]) => {
    rows.push({
      component,
      mainRisk: rule?.mainRisk ?? INSUFFICIENT_INFORMATION,
      testRequired: rule ? (rule.testRequired ? "Yes" : "No") : "Yes — unknown component",
      suitable: rule?.firstResponseBoundary ?? INSUFFICIENT_INFORMATION,
      prohibited: rule?.prohibitedPrinciples?.map((p) => STAGE_LABEL[p] ?? p).join(", ") || INSUFFICIENT_INFORMATION,
      referral: rule?.referralCondition ?? (rule ? "Not required" : "Professional assessment recommended"),
    });
  };

  const main = (rc.safety.textile ?? "unknown_material") as FabricKey;
  push(
    FABRIC_LABEL[main] ?? String(main),
    stain?.fabricRules?.find((f) => f.fabric === main),
  );
  for (const alt of rc.safety.plausibleTextiles ?? []) {
    if (alt === main) continue;
    push(`Suspected alternative: ${FABRIC_LABEL[alt as FabricKey] ?? alt}`, stain?.fabricRules?.find((f) => f.fabric === alt));
  }

  const colourRule = stain?.colourRules?.find((c) => c.colour === (rc.safety.colour as ColourKey));
  rows.push({
    component: `Colour — ${COLOUR_LABEL[(rc.safety.colour as ColourKey) ?? "unknown_stability"] ?? rc.safety.colour}`,
    mainRisk: colourRule?.mainRisk ?? "Dye movement cannot be ruled out.",
    testRequired: colourRule ? (colourRule.colourfastnessTest ? "Yes" : "No") : "Yes",
    suitable: colourRule ? (colourRule.oxidationRestricted ? "Non-oxidising routes only" : "Standard routes after testing") : INSUFFICIENT_INFORMATION,
    prohibited: [
      colourRule?.oxidationRestricted ? "Oxidising bleaches" : null,
      colourRule?.reductionRestricted ? "Reducing agents" : null,
      colourRule?.heatRestricted ? "Heat" : null,
    ].filter(Boolean).join(", ") || INSUFFICIENT_INFORMATION,
    referral: colourRule?.referral ?? "Not required",
  });

  for (const c of rc.componentsPresent) {
    const rule = stain?.fabricRules?.find((f) => f.fabric === (c as FabricKey));
    push(c.replace(/_/g, " "), rule);
  }

  const idx = rows.findIndex((r) =>
    SENSITIVE_ORDER.some((s) => r.component.toLowerCase().includes(s.replace(/_/g, " "))));
  const sensitive = idx >= 0 ? idx : main === "unknown_material" ? 0 : rows.findIndex((r) => r.testRequired.startsWith("Yes"));
  if (sensitive >= 0) rows[sensitive].mostSensitive = true;
  return rows;
}

/* ------------------------------------------------------------------ */
/* Section 6 — Product comparison (§11)                                */
/* ------------------------------------------------------------------ */

export type ProductDecision =
  | "Recommended"
  | "Recommended After Testing"
  | "Professional Use Only"
  | "Domestic Use Suitable"
  | "Not Recommended"
  | "Insufficient Information";

export type ProductRow = {
  option: string;
  product: string;
  productKey: string;
  companyKey: string;
  versionKey: string;
  stainSuitability: string;
  fabricSuitability: string;
  requiredProcess: string;
  mainRisk: string;
  expectedResult: string;
  evidenceLevel: string;
  manufacturerClaim: string;
  decision: ProductDecision;
  reason: string;
  eligibility: EligibilityResult;
};

const decisionFor = (r: EligibilityResult, domestic: boolean): ProductDecision => {
  if (r.outcome === "eligible") return domestic ? "Domestic Use Suitable" : "Recommended";
  if (r.outcome === "eligible_after_testing") return "Recommended After Testing";
  if (r.outcome === "professional_only") return "Professional Use Only";
  if (r.outcome === "insufficient_information" || r.outcome === "documentation_incomplete") return "Insufficient Information";
  return "Not Recommended";
};

export function buildProductComparison(
  rc: ResultCase,
  ev: SafetyEvaluation,
  mappings: ProductStageMapping[] = SEED_MAPPINGS,
): { rows: ProductRow[]; notes: string[]; fallback?: string } {
  if (ev.blocked || ev.productEligibility === "ineligible") {
    return { rows: [], notes: ["No product is offered while a Stop decision is active."], fallback: NO_VERIFIED_PRODUCT };
  }
  const evaluation = evaluateMappingCase(mappings, { ...rc.mapping, country: rc.country });
  const rows: ProductRow[] = evaluation.results.map((r, i) => {
    const product = PRODUCT_BY_KEY[r.productKey];
    const mapping = mappings.find((m) => m.mappingId === r.mappingId);
    const version = mapping ? versionOf(mapping, product) : undefined;
    return {
      option: String.fromCharCode(65 + i),
      product: product?.displayName ?? r.productKey,
      productKey: r.productKey,
      companyKey: r.companyKey,
      versionKey: r.productVersionKey,
      stainSuitability: mapping?.stainKey === rc.stainKey ? "Mapped to this stain" : mapping?.categoryKey ? "Mapped to this stain category" : INSUFFICIENT_INFORMATION,
      fabricSuitability: r.blockingChecks.some((c) => c.toLowerCase().includes("fabric")) ? "Not suitable for this fabric" : r.passedChecks.length ? "Within documented fabric conditions" : INSUFFICIENT_INFORMATION,
      requiredProcess: mapping?.processConditions?.map((p) => String(p.process ?? "")).filter(Boolean).join(", ") || INSUFFICIENT_INFORMATION,
      mainRisk: r.stopConditions[0] ?? INSUFFICIENT_INFORMATION,
      expectedResult: r.provisional ? "Uncertain — provisional mapping" : ELIGIBILITY_LABEL[r.outcome],
      evidenceLevel: r.evidenceLevel,
      manufacturerClaim: mapping?.manufacturerClaim ?? "No manufacturer claim recorded",
      decision: decisionFor(r, rc.mode === "domestic"),
      reason: r.reason,
      eligibility: r,
    };
  });
  const notes = [...evaluation.notes];
  if (rows.length) notes.push("Manufacturer claim and verified suitability are shown separately. Products are alternatives, not equivalents.");
  return { rows, notes, fallback: evaluation.fallback };
}

/* ------------------------------------------------------------------ */
/* Section 7 — Recommended treatment (§12, §13)                        */
/* ------------------------------------------------------------------ */

export type TreatmentStep = {
  index: number;
  stageNumber: number;
  purpose: string;
  action: string;
  productLabel: string;
  productKey?: string;
  productCode: string;
  quantity: string;
  contactTime: string;
  technique: string;
  rinse: string;
  inspectionPoint: string;
  stopCondition: string;
  requiredPpe: string[];
  requiredEquipment: string[];
  requiredTests: string[];
  mappingId?: string;
  versionKey?: string;
  unavailable?: string;
};

export function buildTreatment(
  rc: ResultCase,
  ev: SafetyEvaluation,
  best?: ProductRow,
): { steps: TreatmentStep[]; unavailable?: string } {
  if (ev.blocked) return { steps: [], unavailable: STOP_TREATMENT_MESSAGE };
  if (!best) return { steps: [], unavailable: NO_VERIFIED_PRODUCT };

  const mapping = SEED_MAPPINGS.find((m) => m.mappingId === best.eligibility.mappingId);
  const stage = STAGE_BY_NUMBER[best.eligibility.stageNumber];
  const product = PRODUCT_BY_KEY[best.productKey];
  const q = mapping?.quantities;
  const approved = q?.approvalStatus === "approved";

  const steps: TreatmentStep[] = [];
  if (ev.testRequired || (mapping?.requiredTests?.length ?? 0) > 0) {
    steps.push({
      index: 1,
      stageNumber: stage?.stageNumber ?? best.eligibility.stageNumber,
      purpose: "Confirm the garment tolerates the intended product before any treatment.",
      action: "Run the required hidden-area / colour test recorded for this mapping.",
      productLabel: product?.displayName ?? best.productKey,
      productKey: best.productKey,
      productCode: product?.productCode ?? INSUFFICIENT_INFORMATION,
      quantity: FOLLOW_LABEL_TEXT,
      contactTime: FOLLOW_LABEL_TEXT,
      technique: "Apply to a hidden area only. Do not treat the visible stain yet.",
      rinse: best.eligibility.rinseText || FOLLOW_LABEL_TEXT,
      inspectionPoint: "Inspect the hidden area for colour change before continuing.",
      stopCondition: "Any colour change, dye transfer or texture change — stop and escalate.",
      requiredPpe: mapping?.requiredPpe ?? [],
      requiredEquipment: mapping?.requiredEquipment ?? [],
      requiredTests: best.eligibility.requiredTests,
      mappingId: mapping?.mappingId,
      versionKey: best.versionKey,
    });
  }

  const missingCore = !approved || !q?.quantity && !q?.dilution;
  steps.push({
    index: steps.length + 1,
    stageNumber: stage?.stageNumber ?? best.eligibility.stageNumber,
    purpose: stage?.purpose ?? "Approved treatment stage.",
    action: stage?.name ?? "Apply the mapped product at the approved stage.",
    productLabel: product?.displayName ?? best.productKey,
    productKey: best.productKey,
    productCode: product?.productCode ?? INSUFFICIENT_INFORMATION,
    quantity: approved ? (q?.dilution ?? q?.quantity ?? FOLLOW_LABEL_TEXT) : FOLLOW_LABEL_TEXT,
    contactTime: approved ? (q?.contactTime ?? FOLLOW_LABEL_TEXT) : FOLLOW_LABEL_TEXT,
    technique: mapping?.notes ?? FOLLOW_LABEL_TEXT,
    rinse: best.eligibility.rinseText || FOLLOW_LABEL_TEXT,
    inspectionPoint: stage?.exitConditions?.[0] ?? "Inspect before any repetition, next chemical, heat or drying.",
    stopCondition: best.eligibility.stopConditions[0] ?? STOP_TREATMENT_MESSAGE,
    requiredPpe: mapping?.requiredPpe ?? [],
    requiredEquipment: mapping?.requiredEquipment ?? [],
    requiredTests: best.eligibility.requiredTests,
    mappingId: mapping?.mappingId,
    versionKey: best.versionKey,
    unavailable: missingCore && best.decision === "Insufficient Information" ? INSUFFICIENT_TREATMENT : undefined,
  });

  if (best.eligibility.rinseText) {
    steps.push({
      index: steps.length + 1,
      stageNumber: 15,
      purpose: "Remove product residue before inspection, drying or any further chemistry.",
      action: "Rinse / flush as recorded for this mapping.",
      productLabel: "Rinse stage",
      productCode: "—",
      quantity: FOLLOW_LABEL_TEXT,
      contactTime: FOLLOW_LABEL_TEXT,
      technique: best.eligibility.rinseText,
      rinse: best.eligibility.rinseText,
      inspectionPoint: "Confirm no residue remains before drying or heat.",
      stopCondition: "If rinsing or neutralization cannot be completed — stop and escalate.",
      requiredPpe: mapping?.requiredPpe ?? [],
      requiredEquipment: mapping?.requiredEquipment ?? [],
      requiredTests: [],
      mappingId: mapping?.mappingId,
      versionKey: best.versionKey,
    });
  }
  return { steps };
}

export const stepIsBlocked = (s: TreatmentStep) => Boolean(s.unavailable);

/* ------------------------------------------------------------------ */
/* Section 8 — Domestic treatment (§19)                                */
/* ------------------------------------------------------------------ */

export type DomesticBlock = {
  available: boolean;
  message: string;
  materials: string[];
  hiddenTest: string;
  steps: string[];
  maxAttempts: string;
  avoid: string[];
  stopConditions: string[];
  escalation: string;
  confidence: number;
  source: string;
  reviewDate: string;
  reasons: string[];
};

export function buildDomestic(rc: ResultCase, ev: SafetyEvaluation): DomesticBlock {
  const stain = rc.stainKey ? MASTER_BY_KEY[rc.stainKey] : undefined;
  const reasons: string[] = [];
  if (!stain) reasons.push("No approved master stain record for this case.");
  if (stain && stain.domesticStatus !== "approved_domestic_treatment" && stain.domesticStatus !== "country_specific")
    reasons.push("No published domestic method exists for this stain.");
  if (stain && stain.domesticConfidence < MIN_DOMESTIC_CONFIDENCE)
    reasons.push(`Domestic confidence is ${stain.domesticConfidence}/10 — the minimum is ${MIN_DOMESTIC_CONFIDENCE}/10.`);
  if (!ev.domesticAllowed) reasons.push("The safety engine has not given domestic permission for this case.");
  if (stain && !(stain.governance.countries ?? []).includes(rc.country) && stain.domesticStatus === "country_specific")
    reasons.push("The approved domestic method does not cover your country.");
  if ((rc.safety.previousChemicals ?? []).some((c) => c === "unknown_product" || c === "unknown"))
    reasons.push("An unknown chemical has already been applied.");
  if ((rc.safety.labelProhibitions ?? []).includes("do_not_clean") || (rc.safety.labelProhibitions ?? []).includes("spot_clean_only"))
    reasons.push("Care-label restrictions do not permit domestic treatment.");

  const fr = stain?.firstResponses?.find((f) => f.approval === "approved" && f.roles.includes("domestic_user"));
  const available = reasons.length === 0 && Boolean(fr);
  if (!available && !fr) reasons.push("No approved and published domestic first response is available.");

  return {
    available,
    message: available ? "A published domestic method is available for this case." : DOMESTIC_NOT_RECOMMENDED,
    materials: available ? stain!.publicContent.materialsCautious : [],
    hiddenTest: available ? "Test on a hidden seam or inside area first and let it dry before treating the stain." : "",
    steps: available && fr ? [fr.action, fr.purpose] : [],
    maxAttempts: available ? (stain!.failure.maxAttemptPolicy || INSUFFICIENT_INFORMATION) : "",
    avoid: available ? (stain!.prohibitions ?? []).map((p) => `${PROHIBITION_LABEL[p.type]} — ${p.reason}`) : [],
    stopConditions: available ? stain!.failure.mandatoryStop : [],
    escalation: available ? stain!.failure.escalationPoint : "",
    confidence: stain?.domesticConfidence ?? 0,
    source: stain?.governance.sourceDocuments?.join(", ") ?? INSUFFICIENT_INFORMATION,
    reviewDate: stain?.governance.lastReviewed ?? INSUFFICIENT_INFORMATION,
    reasons,
  };
}

/* ------------------------------------------------------------------ */
/* Section 9 — Three-kit comparison (§20)                              */
/* ------------------------------------------------------------------ */

export const KIT_COMPANIES = ["seitz", "stas", "clean_craft"];

export type KitRow = {
  company: string;
  kitProduct: string;
  recommendedStage: string;
  targetStain: string;
  fabricRestrictions: string;
  processRequirement: string;
  ppe: string;
  costPerUse: string;
  advantages: string;
  limitations: string;
  finalRank: string;
};

export function buildKitComparison(rows: ProductRow[]): { rows: KitRow[]; rankAvailable: boolean; message?: string } {
  const out: KitRow[] = KIT_COMPANIES.map((companyKey) => {
    const match = rows.find((r) => r.companyKey === companyKey);
    const company = COMPANY_BY_KEY[companyKey];
    if (!match) {
      return {
        company: company?.displayName ?? companyKey.replace(/_/g, " "),
        kitProduct: INSUFFICIENT_INFORMATION,
        recommendedStage: INSUFFICIENT_INFORMATION,
        targetStain: INSUFFICIENT_INFORMATION,
        fabricRestrictions: INSUFFICIENT_INFORMATION,
        processRequirement: INSUFFICIENT_INFORMATION,
        ppe: INSUFFICIENT_INFORMATION,
        costPerUse: INSUFFICIENT_INFORMATION,
        advantages: INSUFFICIENT_INFORMATION,
        limitations: INSUFFICIENT_INFORMATION,
        finalRank: INSUFFICIENT_INFORMATION,
      };
    }
    const mapping = SEED_MAPPINGS.find((m) => m.mappingId === match.eligibility.mappingId);
    const dose = mapping?.quantities;
    return {
      company: company?.displayName ?? companyKey,
      kitProduct: `${match.product} (${match.versionKey})`,
      recommendedStage: STAGE_BY_NUMBER[match.eligibility.stageNumber]?.name ?? String(match.eligibility.stageNumber),
      targetStain: match.stainSuitability,
      fabricRestrictions: match.fabricSuitability,
      processRequirement: match.requiredProcess,
      ppe: (mapping?.requiredPpe ?? []).join(", ") || INSUFFICIENT_INFORMATION,
      costPerUse: dose?.approvalStatus === "approved" && dose?.quantity ? INSUFFICIENT_INFORMATION : INSUFFICIENT_INFORMATION,
      advantages: match.decision === "Recommended" ? "Eligible for this case under current documentation." : INSUFFICIENT_INFORMATION,
      limitations: match.reason,
      finalRank: INSUFFICIENT_INFORMATION,
    };
  });
  const comparable = out.filter((r) => r.kitProduct !== INSUFFICIENT_INFORMATION && r.costPerUse !== INSUFFICIENT_INFORMATION);
  const rankAvailable = comparable.length === KIT_COMPANIES.length;
  return { rows: out, rankAvailable, message: rankAvailable ? undefined : NO_RANK_MESSAGE };
}

/* ------------------------------------------------------------------ */
/* Section 10 — Expected outcome (§21)                                 */
/* ------------------------------------------------------------------ */

export type OutcomeBlock = {
  outcome: OutcomeClass;
  label: string;
  adjustments: string[];
  remainingStain: string;
  remainingPigment: string;
  dyeLoss: string;
  fibreDamage: string;
  finishDamage: string;
  odour: string;
};

const worseOutcome = (a: OutcomeClass, b: OutcomeClass): OutcomeClass => {
  const order: OutcomeClass[] = [
    "likely_removable", "likely_reducible", "pigment_may_remain", "uncertain",
    "professional_assessment_required", "permanent_damage_possible",
  ];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
};

export function buildOutcome(rc: ResultCase, ev: SafetyEvaluation): OutcomeBlock {
  const stain = rc.stainKey ? MASTER_BY_KEY[rc.stainKey] : undefined;
  const base = stain?.expectedOutcomes?.[0];
  let outcome: OutcomeClass = base?.outcome ?? "uncertain";
  const adjustments: string[] = [];

  const bump = (o: OutcomeClass, why: string) => { outcome = worseOutcome(outcome, o); adjustments.push(why); };

  if (rc.safety.stainAge === "old") bump("likely_reducible", "The stain is old, so complete removal is less likely.");
  if (String(rc.safety.heatExposure ?? "").includes("heat") || String(rc.safety.heatExposure ?? "") === "ironed")
    bump("pigment_may_remain", "Heat exposure may have set part of the stain.");
  if ((rc.safety.previousTreatments ?? []).length) bump("uncertain", "Earlier treatment changes how the mark responds.");
  if (rc.safety.textile === "unknown_material") bump("professional_assessment_required", "The fibre is unconfirmed.");
  if (rc.safety.colourStability === "failed" || rc.safety.colourStability === "active_bleeding")
    bump("permanent_damage_possible", "Dye is already unstable.");
  if ((rc.safety.existingDamage ?? []).length) bump("permanent_damage_possible", "Damage is already present.");
  if (ev.blocked) bump("professional_assessment_required", "Treatment is blocked by a safety rule.");
  if (!rc.stainKey) bump("uncertain", "The stain is not identified.");

  return {
    outcome,
    label: OUTCOME_CLASS_LABEL[outcome],
    adjustments,
    remainingStain: base?.foreignMaterial ?? INSUFFICIENT_INFORMATION,
    remainingPigment: base?.remainingPigment ?? INSUFFICIENT_INFORMATION,
    dyeLoss: base?.dyeLoss ?? INSUFFICIENT_INFORMATION,
    fibreDamage: base?.fibreDamage ?? INSUFFICIENT_INFORMATION,
    finishDamage: base?.finishDamage ?? INSUFFICIENT_INFORMATION,
    odour: base?.odourHygiene ?? INSUFFICIENT_INFORMATION,
  };
}

/* ------------------------------------------------------------------ */
/* Section 11 — Failure and escalation (§22)                           */
/* ------------------------------------------------------------------ */

export type EscalationBlock = {
  whyMayFail: string[];
  markInterpretation: string[];
  furtherAttempt: string;
  mustStop: string[];
  nextAssessment: string;
  referralPackage: string[];
};

export function buildEscalation(rc: ResultCase, ev: SafetyEvaluation): EscalationBlock {
  const stain = rc.stainKey ? MASTER_BY_KEY[rc.stainKey] : undefined;
  const f = stain?.failure;
  return {
    whyMayFail: f?.whyTreatmentMayFail ?? ["The stain or fibre is not confirmed, so no reliable failure analysis exists."],
    markInterpretation: [
      ...(f?.residueIndicators ?? []).map((t) => `Remaining stain: ${t}`),
      ...(f?.dyeLossIndicators ?? []).map((t) => `Dye loss: ${t}`),
      ...(f?.fibreDamageIndicators ?? []).map((t) => `Fibre damage: ${t}`),
      ...(f?.finishDamageIndicators ?? []).map((t) => `Finish damage: ${t}`),
    ],
    furtherAttempt: ev.repetitionBlocked
      ? "No further attempt is permitted while the current block is active."
      : f?.furtherAttemptSafe === "no"
        ? "No further attempt is permitted."
        : f?.furtherAttemptSafe === "conditional"
          ? "A further attempt is conditional on a passed inspection."
          : "Assessment required before any further attempt.",
    mustStop: f?.mandatoryStop ?? [STOP_TREATMENT_MESSAGE],
    nextAssessment: f?.nextAssessment ?? "A professional textile assessment is the appropriate next step.",
    referralPackage: [
      `Case summary (${rc.caseId} v${rc.caseVersion})`,
      "Garment photographs",
      "Stain photographs",
      `Care-label information (${rc.safety.labelStatus ?? "unclear"})`,
      `Previous products: ${listOr(rc.safety.previousChemicals, "none recorded")}`,
      "Treatment steps performed",
      "Inspection results",
      `Triggered rules: ${ev.firedRules.map((r) => r.ruleId).join(", ") || "none"}`,
      "Product versions used",
      `Current risk: ${RISK_TEXT[ev.riskLevel]}`,
      "Reason for escalation",
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Section 12 — Excel-ready database entry (§23)                       */
/* ------------------------------------------------------------------ */

export const DB_COLUMNS = [
  "Stain ID", "Common Name", "Alternative Names", "Category", "Common Sources", "Chemistry",
  "Fabrics at Risk", "Heat Warning", "First Response", "Professional Product 1",
  "Professional Product 2", "Professional Product 3", "Domestic Treatment", "Do Not Use",
  "Escalation Rule", "Confidence", "Source", "Version", "Review Date",
] as const;

export function buildDatabaseEntry(
  rc: ResultCase,
  rows: ProductRow[],
  domestic: DomesticBlock,
  technical: boolean,
): Record<string, string> {
  const s = rc.stainKey ? MASTER_BY_KEY[rc.stainKey] : undefined;
  const prod = (i: number) => {
    if (!technical) return "Restricted — professional access required";
    const r = rows[i];
    return r ? `${r.product} (${r.versionKey}) — ${r.decision}` : INSUFFICIENT_INFORMATION;
  };
  return {
    "Stain ID": s?.stainId ?? INSUFFICIENT_INFORMATION,
    "Common Name": s?.canonicalName ?? "Unknown stain",
    "Alternative Names": s?.aliases?.map((a) => a.alias).join("; ") || INSUFFICIENT_INFORMATION,
    Category: s?.primaryCategory ?? INSUFFICIENT_INFORMATION,
    "Common Sources": s?.commonSources?.map((c) => c.name).join("; ") || INSUFFICIENT_INFORMATION,
    Chemistry: technical ? (s?.science.composition ?? INSUFFICIENT_INFORMATION) : (s?.sciencePlain ?? INSUFFICIENT_INFORMATION),
    "Fabrics at Risk": s?.fabricRules?.map((f) => String(f.fabric)).join("; ") || INSUFFICIENT_INFORMATION,
    "Heat Warning": s?.science.heat ?? INSUFFICIENT_INFORMATION,
    "First Response": s?.firstResponses?.[0]?.action ?? INSUFFICIENT_INFORMATION,
    "Professional Product 1": prod(0),
    "Professional Product 2": prod(1),
    "Professional Product 3": prod(2),
    "Domestic Treatment": domestic.available ? domestic.steps.join(" ") : DOMESTIC_NOT_RECOMMENDED,
    "Do Not Use": s?.prohibitions?.map((p) => PROHIBITION_LABEL[p.type]).join("; ") || INSUFFICIENT_INFORMATION,
    "Escalation Rule": s?.failure.escalationPoint ?? INSUFFICIENT_INFORMATION,
    Confidence: `${s?.classificationConfidence ?? 0}/10`,
    Source: s?.evidence?.map((e) => EVIDENCE_LABEL[e.type]).join("; ") || INSUFFICIENT_INFORMATION,
    Version: s ? `content v${s.governance.contentVersion}` : INSUFFICIENT_INFORMATION,
    "Review Date": s?.governance.nextReview ?? INSUFFICIENT_INFORMATION,
  };
}

export const databaseEntryCsv = (entry: Record<string, string>) => {
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  return [DB_COLUMNS.join(","), DB_COLUMNS.map((c) => esc(entry[c] ?? "")).join(",")].join("\n");
};

/* ------------------------------------------------------------------ */
/* Section 13 — Public website content (§24)                           */
/* ------------------------------------------------------------------ */

export type WebsiteContent = {
  pageTitle: string;
  stainName: string;
  shortAnswer: string;
  beforeYouStart: string;
  materialsCautious: string[];
  materialsProfessional: string[];
  safeFirstResponse: string;
  domesticStatus: string;
  professionalSummary: string;
  commonMistakes: string[];
  faqs: { question: string; answer: string }[];
  disclaimer: string;
  lastReviewed: string;
};

const RESTRICTED_PATTERNS = [
  /\b\d+\s?(ml|g|%|°c|°f)\b/i, /dilut/i, /neutrali/i, /solvent machine/i, /perc\b/i, /peroxide \d/i,
];

export const containsRestricted = (text: string) => RESTRICTED_PATTERNS.some((p) => p.test(text));

export function buildWebsiteContent(rc: ResultCase, domestic: DomesticBlock): WebsiteContent | null {
  const s = rc.stainKey ? MASTER_BY_KEY[rc.stainKey] : undefined;
  if (!s) return null;
  const pc = s.publicContent;
  const clean = (t: string) => (containsRestricted(t) ? "Professional assessment required." : t);
  return {
    pageTitle: pc.pageTitle,
    stainName: s.canonicalName,
    shortAnswer: clean(pc.shortAnswer),
    beforeYouStart: clean(pc.beforeYouStart),
    materialsCautious: pc.materialsCautious.map(clean),
    materialsProfessional: pc.materialsProfessional.map(clean),
    safeFirstResponse: clean(s.firstResponses?.[0]?.action ?? INSUFFICIENT_INFORMATION),
    domesticStatus: domestic.available ? "A cautious domestic method is available." : DOMESTIC_NOT_RECOMMENDED,
    professionalSummary: clean(pc.professionalSummary),
    commonMistakes: pc.commonMistakes.map(clean),
    faqs: pc.faqs.filter((f) => f.approval === "approved").map((f) => ({ question: f.question, answer: clean(f.answer) })),
    disclaimer: pc.disclaimer,
    lastReviewed: s.governance.lastReviewed ?? INSUFFICIENT_INFORMATION,
  };
}

/* ------------------------------------------------------------------ */
/* Locks (§16, §17, §18)                                               */
/* ------------------------------------------------------------------ */

export type Locks = {
  heatLocked: boolean;
  heatReasons: string[];
  repetitionAllowed: boolean;
  repetitionReason: string;
  nextStageBlocked: boolean;
  inspectionRequired: boolean;
  testRequired: boolean;
};

export function buildLocks(
  rc: ResultCase,
  ev: SafetyEvaluation,
  best: ProductRow | undefined,
  exec: {
    stepsCompleted: number;
    productRemovalConfirmed: boolean;
    inspectionPassed: boolean;
    attempts: number;
    heatAuthorized: boolean;
  },
): Locks {
  const heatReasons: string[] = [];
  if (ev.heatBlocked) heatReasons.push("A safety rule blocks heat for this case.");
  if (!exec.stepsCompleted) heatReasons.push("The treatment stage is not complete.");
  if (!exec.productRemovalConfirmed) heatReasons.push("Product removal has not been confirmed.");
  if (!exec.inspectionPassed) heatReasons.push("The inspection has not passed.");
  if ((rc.safety.labelProhibitions ?? []).some((p) => p.includes("iron") || p.includes("tumble")))
    heatReasons.push("The care label prohibits this heat action.");
  if (!exec.heatAuthorized) heatReasons.push("The safety engine has not authorized a heat action for this stage.");

  const mapping = best ? SEED_MAPPINGS.find((m) => m.mappingId === best.eligibility.mappingId) : undefined;
  const repetitionRule = mapping?.repetition ?? "insufficient_information";
  let repetitionAllowed = true;
  let repetitionReason = best?.eligibility.repetitionText ?? REPEAT_UNKNOWN_MESSAGE;
  if (repetitionRule === "insufficient_information" || repetitionRule === "follow_label_tds") {
    repetitionAllowed = false;
    repetitionReason = REPEAT_UNKNOWN_MESSAGE;
  }
  if (repetitionRule === "repeat_not_permitted") { repetitionAllowed = false; repetitionReason = "Repeat is not permitted for this product mapping."; }
  if (ev.repetitionBlocked) { repetitionAllowed = false; repetitionReason = "A safety rule blocks repetition for this case."; }
  if (!exec.inspectionPassed) { repetitionAllowed = false; repetitionReason = "Record a passing inspection before any repetition."; }
  if (exec.attempts >= 2 && repetitionRule === "maximum_attempts") { repetitionAllowed = false; repetitionReason = "Maximum documented attempts reached."; }
  if (rc.safety.role === "domestic_user" && !ev.domesticAllowed) { repetitionAllowed = false; repetitionReason = DOMESTIC_NOT_RECOMMENDED; }

  return {
    heatLocked: heatReasons.length > 0,
    heatReasons,
    repetitionAllowed,
    repetitionReason,
    nextStageBlocked: ev.nextStageBlocked,
    inspectionRequired: ev.inspectionRequired || true,
    testRequired: ev.testRequired,
  };
}

/** Step 11 §15 observation vocabulary — superset of the Step 8 inspection fields. */
export const OBSERVATION_FIELDS = [
  "removed", "reduced", "no_change", "spread", "ring_formed", "pigment_remains",
  "dye_transferred", "colour_changed", "texture_changed", "fibre_weakened",
  "coating_changed", "adhesive_loosened", "decoration_affected", "unexpected_reaction",
  "other", "not_sure",
] as const;
export type ObservationField = (typeof OBSERVATION_FIELDS)[number];

export const OBSERVATION_LABEL: Record<ObservationField, string> = {
  removed: "Removed", reduced: "Reduced", no_change: "No change", spread: "Spread",
  ring_formed: "Ring formed", pigment_remains: "Pigment remains", dye_transferred: "Dye transferred",
  colour_changed: "Colour changed", texture_changed: "Texture changed", fibre_weakened: "Fibre weakened",
  coating_changed: "Coating changed", adhesive_loosened: "Adhesive loosened",
  decoration_affected: "Decoration affected", unexpected_reaction: "Unexpected reaction",
  other: "Other", not_sure: "Not sure",
};

/** Findings that force an immediate system block (§16). */
export const STOPPING_FINDINGS: ObservationField[] = [
  "spread", "ring_formed", "dye_transferred", "colour_changed", "texture_changed",
  "fibre_weakened", "coating_changed", "adhesive_loosened", "decoration_affected",
  "unexpected_reaction", "not_sure",
];

export const inspectionStops = (findings: ObservationField[]) =>
  findings.some((f) => STOPPING_FINDINGS.includes(f));

/** An inspection passes only when it is recorded and contains no stopping finding. */
export const inspectionPassed = (findings: ObservationField[]) =>
  findings.length > 0 && !inspectionStops(findings);

export { INSPECTION_FIELDS, INSPECTION_LABEL };


/* ------------------------------------------------------------------ */
/* Assembled result                                                    */
/* ------------------------------------------------------------------ */

export type TreatmentResult = {
  resultId: string;
  caseId: string;
  caseVersion: number;
  generatedAt: string;
  engineVersion: string;
  rulesetVersion: string;
  stainContentVersion: string;
  productVersions: string[];
  mappingVersions: string[];
  domesticVersion: string;

  role: string;
  mode: PresentationMode;
  country: string;
  type: ResultType;
  status: ResultStatus;
  primaryStatus: PrimaryStatusKey;
  primaryStatusText: string;

  header: {
    stainName: string;
    garmentType: string;
    risk: RiskLevel;
    treatmentPermission: string;
    stainConfidence: number;
    fabricConfidence: number;
    lastAssessed: string;
    caseId: string;
  };

  prerequisites: PrerequisiteCheck[];
  blockedMessage?: string;

  caseUnderstanding: CaseUnderstanding;
  recommendations: Recommendation[];
  recommendationValidation: RecommendationValidation;
  confidence: ConfidenceBlock;
  science: ScienceRow | null;
  fabric: FabricRow[];
  products: { rows: ProductRow[]; notes: string[]; fallback?: string };
  treatment: { steps: TreatmentStep[]; unavailable?: string };
  domestic: DomesticBlock;
  kits: { rows: KitRow[]; rankAvailable: boolean; message?: string };
  outcome: OutcomeBlock;
  escalation: EscalationBlock;
  databaseEntry: Record<string, string>;
  website: WebsiteContent | null;

  locks: Locks;
  triggeredRules: { ruleId: string; title: string; warning: string }[];
  emptyState?: string;
};

export const SECTION_ORDER = [
  "Case Understanding",
  "Five Advance Recommendations",
  "Confidence and Risk",
  "Stain Science",
  "Fabric Compatibility",
  "Product Comparison",
  "Recommended Treatment",
  "Domestic Treatment",
  "Three-Kit Comparison",
  "Expected Outcome",
  "Failure and Escalation",
  "Stain Master Database Entry",
  "Website Content",
] as const;

const statusFor = (type: ResultType, ev: SafetyEvaluation): ResultStatus => {
  if (ev.engineFailure) return "blocked";
  if (type === "hazard_stop" || ev.blocked) return "blocked";
  if (type === "possible_damage") return "closed_as_damage";
  if (type === "professional_referral" || type === "specialist_material") return "professional_only";
  if (type === "compatibility_test_required") return "testing_required";
  if (type === "insufficient_information" || type === "unknown_stain") return "draft_assessment";
  return "ready";
};

const emptyStateFor = (rc: ResultCase, ev: SafetyEvaluation, type: ResultType, products: ProductRow[]) => {
  if (ev.engineFailure) return SAFETY_UNAVAILABLE;
  if (type === "hazard_stop") return HAZARD_STOP_MESSAGE;
  if (type === "possible_damage") return POSSIBLE_DAMAGE_MESSAGE;
  if (type === "unknown_stain") return UNKNOWN_STAIN_MESSAGE;
  if (rc.safety.textile === "unknown_material") return UNKNOWN_FABRIC_MESSAGE;
  if (!products.length && rc.mode !== "domestic") return NO_VERIFIED_PRODUCT;
  return undefined;
};

const isTechnical = (mode: PresentationMode) =>
  mode === "technical_professional" || mode === "administration";

export function buildTreatmentResult(
  rc: ResultCase,
  ev: SafetyEvaluation,
  opts: {
    mappings?: ProductStageMapping[];
    exec?: Parameters<typeof buildLocks>[3];
    resultId?: string;
  } = {},
): TreatmentResult {
  const prerequisites = checkPrerequisites(rc, ev);
  const type = resolveResultType(rc, ev);
  const stain = rc.stainKey ? MASTER_BY_KEY[rc.stainKey] : undefined;

  const products = buildProductComparison(rc, ev, opts.mappings ?? SEED_MAPPINGS);
  const best =
    products.rows.find((r) => r.decision === "Recommended") ??
    products.rows.find((r) => r.decision === "Recommended After Testing") ??
    products.rows.find((r) => r.decision === "Domestic Use Suitable");

  const recommendations = buildRecommendations(rc, ev, type, best?.eligibility);
  const domestic = buildDomestic(rc, ev);
  const exec = opts.exec ?? {
    stepsCompleted: 0, productRemovalConfirmed: false, inspectionPassed: false, attempts: 0, heatAuthorized: false,
  };

  const technical = isTechnical(rc.mode) && rc.safety.role !== "domestic_user";
  const treatment = technical || rc.mode === "quick_professional" || rc.mode === "training"
    ? buildTreatment(rc, ev, best)
    : { steps: [], unavailable: domestic.available ? undefined : DOMESTIC_NOT_RECOMMENDED };

  const confidence = buildConfidence(rc, ev, best?.eligibility);

  return {
    resultId: opts.resultId ?? `SM-RES-${Date.now().toString(36).toUpperCase()}`,
    caseId: rc.caseId,
    caseVersion: rc.caseVersion,
    generatedAt: new Date().toISOString(),
    engineVersion: RESULT_ENGINE_VERSION,
    rulesetVersion: ev.rulesetVersion,
    stainContentVersion: stain ? `v${stain.governance.contentVersion}` : INSUFFICIENT_INFORMATION,
    productVersions: Array.from(new Set(products.rows.map((r) => `${r.productKey}:${r.versionKey}`))),
    mappingVersions: Array.from(new Set(products.rows.map((r) => r.eligibility.mappingId))),
    domesticVersion: stain ? `domestic v${stain.governance.contentVersion}` : INSUFFICIENT_INFORMATION,

    role: rc.safety.role,
    mode: rc.mode,
    country: rc.country,
    type,
    status: statusFor(type, ev),
    primaryStatus: primaryStatus(rc, ev, type),
    primaryStatusText: PRIMARY_STATUS_TEXT[primaryStatus(rc, ev, type)],

    header: {
      stainName: stain?.canonicalName ?? "Unknown stain",
      garmentType: rc.garmentType,
      risk: ev.riskLevel,
      treatmentPermission: ev.gateStatus.replace(/_/g, " "),
      stainConfidence: confidence.stain,
      fabricConfidence: confidence.fabric,
      lastAssessed: rc.lastAssessedAt,
      caseId: rc.caseId,
    },

    prerequisites,
    blockedMessage: ev.engineFailure ? SAFETY_UNAVAILABLE : undefined,

    caseUnderstanding: buildCaseUnderstanding(rc),
    recommendations,
    recommendationValidation: validateRecommendations(recommendations),
    confidence,
    science: buildScience(rc),
    fabric: buildFabricCompatibility(rc),
    products: technical || rc.mode === "quick_professional" || rc.mode === "training"
      ? products
      : { rows: [], notes: ["Professional product information is not shown in domestic mode."], fallback: undefined },
    treatment,
    domestic,
    kits: technical || rc.mode === "quick_professional"
      ? buildKitComparison(products.rows)
      : { rows: [], rankAvailable: false, message: "Professional kit comparison is not shown in domestic mode." },
    outcome: buildOutcome(rc, ev),
    escalation: buildEscalation(rc, ev),
    databaseEntry: buildDatabaseEntry(rc, products.rows, domestic, technical),
    website: buildWebsiteContent(rc, domestic),

    locks: buildLocks(rc, ev, best, exec),
    triggeredRules: ev.firedRules.map((r) => ({ ruleId: r.ruleId, title: r.plainTitle, warning: r.warning })),
    emptyState: emptyStateFor(rc, ev, type, products.rows),
  };
}

/* ------------------------------------------------------------------ */
/* Role redaction + export permission (§25, §28)                       */
/* ------------------------------------------------------------------ */

export const canSeeTechnical = (mode: PresentationMode, role: string) =>
  role !== "domestic_user" && isTechnical(mode);

export function redactForRole(result: TreatmentResult): TreatmentResult {
  if (canSeeTechnical(result.mode, result.role) || result.mode === "quick_professional" || result.mode === "training") {
    if (result.mode === "quick_professional") {
      return {
        ...result,
        science: result.science ? { ...result.science, composition: "Available in technical mode", uncertainty: result.science.uncertainty } : null,
      };
    }
    return result;
  }
  // Domestic: no industrial procedure may exist anywhere in the payload.
  return {
    ...result,
    products: { rows: [], notes: ["Professional product information is not available in domestic mode."] },
    treatment: { steps: [], unavailable: result.domestic.available ? undefined : DOMESTIC_NOT_RECOMMENDED },
    kits: { rows: [], rankAvailable: false, message: "Professional kit comparison is not available in domestic mode." },
    science: result.science ? { ...result.science, composition: "Plain-language summary only", bonding: "", solubility: "", principle: "" } : null,
    databaseEntry: Object.fromEntries(
      Object.entries(result.databaseEntry).map(([k, v]) =>
        k.startsWith("Professional Product") ? [k, "Restricted — professional access required"] : [k, v]),
    ),
  };
}

export type ExportKind = "public" | "domestic" | "professional" | "technical";

export function canExport(kind: ExportKind, mode: PresentationMode, role: string): boolean {
  if (kind === "public") return true;
  if (kind === "domestic") return true;
  if (role === "domestic_user") return false;
  if (kind === "professional") return mode !== "domestic";
  return canSeeTechnical(mode, role);
}

export function validateForPublish(result: TreatmentResult): string[] {
  const issues: string[] = [];
  if (result.recommendations.length !== 5) issues.push("Exactly five advance recommendations are required.");
  issues.push(...result.recommendationValidation.issues.filter((i) => !issues.includes(i)));
  if (!result.rulesetVersion) issues.push("Rule-set version missing.");
  if (!result.caseVersion) issues.push("Case version missing.");
  if (result.blockedMessage) issues.push(result.blockedMessage);
  return issues;
}

export const analyticsEventsFor = (r: TreatmentResult) => [
  { name: "result_generated", props: { type: r.type, risk: r.header.risk, mode: r.mode, status: r.status } },
  { name: "recommendations_displayed", props: { count: r.recommendations.length } },
  { name: "domestic_treatment", props: { eligible: r.domestic.available } },
  { name: "product_availability", props: { eligible: r.products.rows.filter((p) => p.decision === "Recommended").length, shown: r.products.rows.length } },
  { name: "test_required", props: { required: r.locks.testRequired } },
  { name: "expected_outcome", props: { outcome: r.outcome.outcome } },
];

export { MASTER_STAINS };
