/**
 * STEP 9 — structured safety-rule database.
 *
 * Permanent principle: when evidence is incomplete or risks conflict, Stain Master
 * chooses the safer route and explains why.
 *
 * Rule IDs (SM-RUL-XXXXXX) are permanent and are never reused.
 */

import type { RiskLevel, UserRoleKey } from "@/lib/fabricSafety";
import type { TextileKey, PpeKey, ProcessKey, TrainingKey } from "@/data/professionalProducts";

export const RULESET_VERSION = "safety-rules-v1";

/* ------------------------------------------------------------------ */
/* §3 Rule categories                                                   */
/* ------------------------------------------------------------------ */

export const RULE_CATEGORIES = [
  "material_fabric", "colour_dye", "construction_finish", "care_label", "stain_chemistry",
  "stain_condition", "previous_treatment", "chemical_incompatibility", "product_documentation",
  "cleaning_process", "role_training", "equipment", "ppe_ventilation", "country_applicability",
  "inspection_stop", "repetition", "domestic_treatment", "professional_referral",
  "hazardous_contamination", "missing_information",
] as const;
export type RuleCategory = (typeof RULE_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<RuleCategory, string> = {
  material_fabric: "Material and fabric",
  colour_dye: "Colour and dye",
  construction_finish: "Construction and finish",
  care_label: "Care label",
  stain_chemistry: "Stain chemistry",
  stain_condition: "Stain condition",
  previous_treatment: "Previous treatment",
  chemical_incompatibility: "Chemical incompatibility",
  product_documentation: "Product documentation",
  cleaning_process: "Cleaning process",
  role_training: "User role and training",
  equipment: "Equipment",
  ppe_ventilation: "PPE and ventilation",
  country_applicability: "Country applicability",
  inspection_stop: "Inspection and stop",
  repetition: "Repetition",
  domestic_treatment: "Domestic treatment",
  professional_referral: "Professional referral",
  hazardous_contamination: "Hazardous contamination",
  missing_information: "Missing information",
};

/* ------------------------------------------------------------------ */
/* §5 Severities                                                        */
/* ------------------------------------------------------------------ */

export const RULE_SEVERITIES = [
  "information", "caution", "test_required", "professional_only", "stop", "hazard_referral",
] as const;
export type RuleSeverity = (typeof RULE_SEVERITIES)[number];

export const SEVERITY_LABEL: Record<RuleSeverity, string> = {
  information: "Information",
  caution: "Caution",
  test_required: "Test Required",
  professional_only: "Professional Only",
  stop: "Stop",
  hazard_referral: "Emergency or Hazard Referral",
};

/** Severity drives behaviour, never presentation alone. */
export const SEVERITY_BLOCKS: Record<RuleSeverity, boolean> = {
  information: false,
  caution: false,
  test_required: false,
  professional_only: false,
  stop: true,
  hazard_referral: true,
};

/* ------------------------------------------------------------------ */
/* §6 Decision effects                                                  */
/* ------------------------------------------------------------------ */

export const DECISION_EFFECTS = [
  "allow_assessment", "allow_with_warning", "require_more_information", "require_compatibility_test",
  "professional_only", "specialist_only", "block_treatment", "block_product", "block_next_stage",
  "block_heat", "block_repetition", "require_rinse_or_neutralization", "require_inspection",
  "require_supervisor_review", "require_hazard_referral",
] as const;
export type DecisionEffect = (typeof DECISION_EFFECTS)[number];

export const EFFECT_LABEL: Record<DecisionEffect, string> = {
  allow_assessment: "Assessment may continue",
  allow_with_warning: "Continue with a warning",
  require_more_information: "More information required",
  require_compatibility_test: "Compatibility test required",
  professional_only: "Professional handling only",
  specialist_only: "Specialist referral only",
  block_treatment: "Treatment blocked",
  block_product: "Product blocked",
  block_next_stage: "Next stage blocked",
  block_heat: "Heat blocked",
  block_repetition: "Repetition blocked",
  require_rinse_or_neutralization: "Rinsing or neutralization required",
  require_inspection: "Inspection required",
  require_supervisor_review: "Supervisor review required",
  require_hazard_referral: "Hazard referral required",
};

/* ------------------------------------------------------------------ */
/* §7 Precedence bands (1 = highest)                                    */
/* ------------------------------------------------------------------ */

export const PRECEDENCE_BANDS = [
  "hazard_stop", "existing_damage_stop", "chemical_incompatibility_stop", "care_label_prohibition",
  "product_prohibition", "fabric_construction_prohibition", "active_dye_instability",
  "missing_safety_documentation", "missing_ppe_equipment_training", "required_compatibility_test",
  "professional_only_restriction", "caution", "general_recommendation",
] as const;
export type PrecedenceBand = (typeof PRECEDENCE_BANDS)[number];

export const BAND_RANK: Record<PrecedenceBand, number> = PRECEDENCE_BANDS.reduce(
  (acc, band, i) => ({ ...acc, [band]: i + 1 }),
  {} as Record<PrecedenceBand, number>,
);

export const BAND_LABEL: Record<PrecedenceBand, string> = {
  hazard_stop: "Hazard or emergency stop",
  existing_damage_stop: "Existing garment damage stop",
  chemical_incompatibility_stop: "Chemical-incompatibility stop",
  care_label_prohibition: "Care-label prohibition",
  product_prohibition: "Product-specific prohibition",
  fabric_construction_prohibition: "Fabric or construction prohibition",
  active_dye_instability: "Active dye instability",
  missing_safety_documentation: "Missing safety documentation",
  missing_ppe_equipment_training: "Missing PPE, ventilation, equipment or training",
  required_compatibility_test: "Required compatibility test",
  professional_only_restriction: "Professional-only restriction",
  caution: "Caution",
  general_recommendation: "General recommendation",
};

/* ------------------------------------------------------------------ */
/* §31 Engine input contract — versioned case snapshot                  */
/* ------------------------------------------------------------------ */

export type HeatExposure =
  | "none" | "ironed" | "steamed" | "tumble_dried" | "hot_water" | "pressed" | "unknown";

export type ProductEligibilityInput = {
  productKey?: string;
  productVersionKey?: string;
  companyKey?: string;
  countryMatch?: boolean;
  labelCurrent?: boolean;
  sdsCurrent?: boolean;
  tdsCurrent?: boolean;
  technicallyApproved?: boolean;
  fabricRestrictionsRecorded?: boolean;
  colourRestrictionsRecorded?: boolean;
  processRestrictionsRecorded?: boolean;
  ppeRecorded?: boolean;
  ventilationRecorded?: boolean;
  incompatibilitiesRecorded?: boolean;
  rinseRecorded?: boolean;
  prohibitedTextiles?: TextileKey[];
  prohibitedProcesses?: ProcessKey[];
  machineEntryProhibited?: boolean;
  flammable?: boolean;
  requiredPpe?: PpeKey[];
  requiredTraining?: TrainingKey[];
  requiredEquipment?: string[];
  maximumAttempts?: string;
  claimsAllTextiles?: boolean;
};

export type SafetyCase = {
  /* identity and versioning */
  caseId: string;
  caseVersion: number;
  createdAt: string;

  /* user context */
  role: UserRoleKey;
  isTechnicalReviewer?: boolean;
  organizationKey?: string;
  userCountry?: string;
  training: TrainingKey[];

  /* garment */
  garmentType?: string;
  textile: TextileKey | "unknown_material";
  plausibleTextiles?: TextileKey[];
  fabricConfidence: "high" | "moderate" | "low" | "unknown";
  fabricRiskGroup?: "group_a" | "group_b" | "group_c" | "group_d";
  colour: "white" | "light" | "dark" | "bright" | "multicoloured" | "print" | "garment_dyed" | "metallic" | "unknown";
  colourStability: "untested" | "passed" | "failed" | "inconclusive" | "active_bleeding";
  construction: string[];
  decorationLoosening?: boolean;
  hiddenTestAreaAvailable?: boolean;
  highValueGarment?: boolean;

  /* care label */
  labelStatus: "available" | "no_label" | "unclear" | "conflicting";
  labelProhibitions: string[];   // e.g. "do_not_bleach", "do_not_wash", "do_not_dry_clean", "spot_clean_only", "do_not_clean"
  labelPermissions: string[];    // e.g. "dry_clean", "wash"

  /* existing damage */
  existingDamage: string[];      // e.g. "colour_loss", "fibre_damage", "melting", "peeling_coating", "lamination_separation"

  /* stain */
  stainKey?: string;
  stainCategory?: string;        // taxonomy primary category key
  stainComponents: string[];     // taxonomy component keys
  stainConfidence: number;       // 0-9
  stainAge?: "fresh" | "recent" | "days" | "old" | "unknown";
  heatExposure: HeatExposure;

  /* history */
  previousTreatments: string[];  // e.g. "washing", "dry_cleaning", "professional_spotter"
  previousChemicals: string[];   // e.g. "chlorine_bleach", "acid", "ammonia", "unknown_product"
  previousRinsed: "yes" | "no" | "unsure";
  previousOutcome?: "no_change" | "improved" | "worse" | "damage" | "unknown";
  unrinsedProductCount?: number;

  /* process and capability */
  process?: ProcessKey | "unknown_solvent";
  equipmentAvailable: string[];
  improvisedEquipment?: boolean;
  ppeAvailable: PpeKey[];
  ventilation: "local_exhaust" | "general" | "none" | "unknown";
  ignitionSourcesControlled?: boolean;

  /* treatment context */
  currentRisk: RiskLevel;
  treatmentStage?: number;
  nextStage?: number;
  product?: ProductEligibilityInput;
  testCompleted?: boolean;
  testResult?: "passed" | "failed" | "inconclusive" | "not_done";
  inspectionCompleted?: boolean;
  inspectionFindings: string[];  // e.g. "colour_loss", "no_damage"
  attemptCount?: number;
  repeatLimitKnown?: boolean;
  aiSuggestion?: string;

  /* documentation */
  sourceDocumentStatus?: "complete" | "partial" | "missing" | "country_mismatch";
};

export const emptySafetyCase = (over: Partial<SafetyCase> = {}): SafetyCase => ({
  caseId: "case-preview",
  caseVersion: 1,
  createdAt: new Date().toISOString(),
  role: "domestic_user",
  training: [],
  textile: "unknown_material",
  fabricConfidence: "unknown",
  colour: "unknown",
  colourStability: "untested",
  construction: [],
  labelStatus: "no_label",
  labelProhibitions: [],
  labelPermissions: [],
  existingDamage: [],
  stainComponents: [],
  stainConfidence: 0,
  heatExposure: "unknown",
  previousTreatments: [],
  previousChemicals: [],
  previousRinsed: "unsure",
  equipmentAvailable: [],
  ppeAvailable: [],
  ventilation: "unknown",
  currentRisk: "amber",
  inspectionFindings: [],
  ...over,
});

/* ------------------------------------------------------------------ */
/* §4 Rule structure                                                    */
/* ------------------------------------------------------------------ */

export type RuleRevision = {
  version: number;
  at: string;
  by: string;
  summary: string;
};

export type SafetyRule = {
  ruleId: string;                    // SM-RUL-000001 — never reused
  name: string;
  plainTitle: string;
  technicalDescription: string;
  category: RuleCategory;
  band: PrecedenceBand;
  severity: RuleSeverity;
  effects: DecisionEffect[];
  riskEffect?: RiskLevel;            // minimum risk the rule imposes
  gateEffect?:
    | "proceed" | "proceed_with_testing" | "professional_only"
    | "blocked_pending_identification" | "blocked_existing_damage" | "specialist_material_route";
  productEligibilityEffect?: "eligible" | "eligible_after_testing" | "professional_only" | "ineligible" | "insufficient_information";
  triggerDescription: string;
  requiredData: string[];
  excludedConditions?: string[];
  warning: string;                   // plain-language, shown to the user
  requiredAction?: string;
  stopCondition?: string;
  evidenceSource: string;
  countries: string[];               // ["all"] or ISO-ish keys
  roles: UserRoleKey[] | "all";
  effectiveDate: string;
  reviewDate?: string;
  version: number;
  status: "draft" | "under_review" | "approved" | "active" | "scheduled" | "retired";
  contentOwner: string;
  technicalReviewer?: string;
  overridable: boolean;              // §35 — never true for the six protected classes
  revisions: RuleRevision[];
  /** Deterministic trigger. Never AI-driven. */
  trigger: (c: SafetyCase) => boolean;
};

let seq = 0;
const rid = () => `SM-RUL-${String(++seq).padStart(6, "0")}`;

type RuleSeed = Omit<SafetyRule, "ruleId" | "effectiveDate" | "version" | "status" | "contentOwner" | "revisions" | "countries" | "roles" | "overridable"> &
  Partial<Pick<SafetyRule, "countries" | "roles" | "overridable" | "status" | "technicalReviewer" | "reviewDate">>;

const rule = (seed: RuleSeed): SafetyRule => ({
  ruleId: rid(),
  countries: ["all"],
  roles: "all",
  overridable: true,
  status: "active",
  effectiveDate: "2026-01-01",
  version: 1,
  contentOwner: "Stain Master technical content",
  revisions: [{ version: 1, at: "2026-01-01", by: "Stain Master technical content", summary: "Initial rule" }],
  ...seed,
});

const has = (list: string[] | undefined, ...keys: string[]) =>
  Boolean(list?.some((v) => keys.includes(v)));

const PROFESSIONAL_ROLES: UserRoleKey[] = ["dry_cleaner", "professional_spotter", "trainer"];

/* ------------------------------------------------------------------ */
/* Rule set                                                             */
/* ------------------------------------------------------------------ */

export const SAFETY_RULES: SafetyRule[] = [
  /* ---------------- Hazard and dangerous mixing (§19) ---------------- */
  rule({
    name: "Chlorine bleach with acid",
    plainTitle: "Stop — a dangerous chemical mixture may have occurred",
    technicalDescription:
      "Chlorine bleach in contact with an acid can release chlorine gas. No further chemistry may be applied and no neutralization may be attempted by the user.",
    category: "chemical_incompatibility",
    band: "hazard_stop",
    severity: "hazard_referral",
    effects: ["block_treatment", "require_hazard_referral", "block_product"],
    riskEffect: "black",
    gateEffect: "blocked_existing_damage",
    productEligibilityEffect: "ineligible",
    triggerDescription: "Previous chemicals include chlorine bleach and an acid.",
    requiredData: ["previousChemicals"],
    warning:
      "Chlorine bleach and an acid have both been used on this item. This combination can release a hazardous gas. Stop treatment, move the item to a well-ventilated place and do not add any other chemical.",
    requiredAction:
      "Isolate the item, keep the product names and label photographs, and use your country's professional or emergency safety contact.",
    stopCondition: "Any suspected chlorine-plus-acid mixture.",
    evidenceSource: "Product SDS incompatibility statements; general chemical safety guidance.",
    overridable: false,
    trigger: (c) => has(c.previousChemicals, "chlorine_bleach") && has(c.previousChemicals, "acid", "acidic_cleaner", "descaler"),
  }),
  rule({
    name: "Chlorine bleach with ammonia",
    plainTitle: "Stop — a dangerous chemical mixture may have occurred",
    technicalDescription:
      "Chlorine bleach with ammonia can release chloramine vapours. Treatment stops and the case is referred.",
    category: "chemical_incompatibility",
    band: "hazard_stop",
    severity: "hazard_referral",
    effects: ["block_treatment", "require_hazard_referral", "block_product"],
    riskEffect: "black",
    gateEffect: "blocked_existing_damage",
    productEligibilityEffect: "ineligible",
    triggerDescription: "Previous chemicals include chlorine bleach and ammonia.",
    requiredData: ["previousChemicals"],
    warning:
      "Chlorine bleach and ammonia have both been used on this item. This combination can release a hazardous vapour. Stop treatment and do not add any other chemical.",
    requiredAction: "Ventilate the area, isolate the item and contact professional or emergency safety support for your country.",
    stopCondition: "Any suspected bleach-plus-ammonia mixture.",
    evidenceSource: "Product SDS incompatibility statements; general chemical safety guidance.",
    overridable: false,
    trigger: (c) => has(c.previousChemicals, "chlorine_bleach") && has(c.previousChemicals, "ammonia"),
  }),
  rule({
    name: "Chlorine bleach with alcohol or unknown cleaner",
    plainTitle: "Stop — bleach has been mixed with an unverified product",
    technicalDescription:
      "Chlorine bleach with alcohols or unidentified cleaners has undocumented reaction potential. No further chemistry is permitted.",
    category: "chemical_incompatibility",
    band: "hazard_stop",
    severity: "stop",
    effects: ["block_treatment", "block_product", "require_hazard_referral"],
    riskEffect: "black",
    productEligibilityEffect: "ineligible",
    triggerDescription: "Previous chemicals include chlorine bleach with alcohol or an unknown product.",
    requiredData: ["previousChemicals"],
    warning:
      "Chlorine bleach has been combined with alcohol or an unidentified cleaner. The reaction cannot be predicted, so no further chemical may be applied.",
    requiredAction: "Keep the products and labels for professional assessment. Do not attempt to neutralize the mixture.",
    stopCondition: "Bleach plus alcohol or an unknown product.",
    evidenceSource: "Product SDS incompatibility statements.",
    overridable: false,
    trigger: (c) => has(c.previousChemicals, "chlorine_bleach") && has(c.previousChemicals, "alcohol", "unknown_product"),
  }),
  rule({
    name: "Oxidizer with reducer",
    plainTitle: "Stop — oxidizing and reducing chemistry have been combined",
    technicalDescription:
      "Uncontrolled oxidizer/reducer contact is unpredictable and can destroy fibre and dye. Treatment is blocked pending professional assessment.",
    category: "chemical_incompatibility",
    band: "chemical_incompatibility_stop",
    severity: "stop",
    effects: ["block_treatment", "block_product", "require_rinse_or_neutralization"],
    riskEffect: "black",
    productEligibilityEffect: "ineligible",
    triggerDescription: "Previous chemicals include both an oxidizer and a reducer.",
    requiredData: ["previousChemicals"],
    warning: "Oxidizing and reducing products have both been used. Further chemistry is blocked until a professional assesses the item.",
    requiredAction: "Refer for professional assessment with the full product history.",
    stopCondition: "Oxidizer and reducer both recorded.",
    evidenceSource: "Product SDS incompatibility statements.",
    overridable: false,
    trigger: (c) => has(c.previousChemicals, "oxidizer", "oxygen_bleach", "chlorine_bleach") && has(c.previousChemicals, "reducer", "rust_remover", "reducing_agent"),
  }),
  rule({
    name: "Acid with alkali without a verified controlled process",
    plainTitle: "Stop — acid and alkali have been combined without a verified process",
    technicalDescription:
      "Acid/alkali contact outside a documented controlled sequence produces heat and unpredictable residues.",
    category: "chemical_incompatibility",
    band: "chemical_incompatibility_stop",
    severity: "stop",
    effects: ["block_treatment", "require_rinse_or_neutralization"],
    riskEffect: "red",
    triggerDescription: "Previous chemicals include an acid and an alkali with no verified controlled process.",
    requiredData: ["previousChemicals", "process"],
    warning: "An acid and an alkali have both been used. Further chemistry is blocked until the item has been flushed and assessed.",
    requiredAction: "Flush thoroughly with water where the fabric allows, then refer for professional assessment.",
    stopCondition: "Acid and alkali recorded together.",
    evidenceSource: "Product SDS incompatibility statements.",
    overridable: false,
    trigger: (c) => has(c.previousChemicals, "acid", "acidic_cleaner") && has(c.previousChemicals, "alkali", "alkaline_cleaner", "ammonia"),
  }),
  rule({
    name: "Flammable product near heat or ignition source",
    plainTitle: "Stop — flammable product with uncontrolled ignition sources",
    technicalDescription:
      "Flammable solvents require documented ignition-source control. Without it, use is prohibited.",
    category: "hazardous_contamination",
    band: "hazard_stop",
    severity: "hazard_referral",
    effects: ["block_product", "block_treatment", "block_heat"],
    riskEffect: "black",
    productEligibilityEffect: "ineligible",
    triggerDescription: "A flammable product is selected and ignition sources are not controlled, or heat is in use.",
    requiredData: ["product.flammable", "ignitionSourcesControlled", "heatExposure"],
    warning:
      "This product is flammable and ignition sources are not confirmed as controlled. Do not use it near heat, sparks or flames.",
    requiredAction: "Confirm ignition-source control and ventilation before any flammable product is considered.",
    stopCondition: "Flammable product with uncontrolled ignition sources.",
    evidenceSource: "Product SDS section 7 handling and storage.",
    overridable: false,
    trigger: (c) =>
      Boolean(c.product?.flammable) &&
      (c.ignitionSourcesControlled === false || ["ironed", "steamed", "pressed", "hot_water", "tumble_dried"].includes(c.heatExposure)),
  }),
  rule({
    name: "Hazardous biological contamination",
    plainTitle: "Specialist handling — biological contamination",
    technicalDescription:
      "Biological contamination requires hygiene controls, PPE and a specialist decontamination route before stain chemistry is considered.",
    category: "hazardous_contamination",
    band: "hazard_stop",
    severity: "hazard_referral",
    effects: ["specialist_only", "block_treatment", "require_hazard_referral"],
    riskEffect: "black",
    gateEffect: "specialist_material_route",
    triggerDescription: "Stain category or components indicate hazardous biological material.",
    requiredData: ["stainCategory", "stainComponents"],
    warning:
      "This item may carry hazardous biological contamination. It needs specialist handling with hygiene controls before any stain treatment.",
    requiredAction: "Refer to a specialist decontamination route and use barrier PPE when handling the item.",
    stopCondition: "Suspected hazardous biological contamination.",
    evidenceSource: "Occupational hygiene guidance for soiled textiles.",
    overridable: false,
    trigger: (c) =>
      c.stainCategory === "biological" &&
      has(c.stainComponents, "biological_material", "unknown_component"),
  }),
  rule({
    name: "Unknown industrial chemical present",
    plainTitle: "Stop — an unidentified industrial chemical is involved",
    technicalDescription:
      "An unidentified industrial chemical has unknown reactivity with both the fibre and any further product.",
    category: "chemical_incompatibility",
    band: "chemical_incompatibility_stop",
    severity: "stop",
    effects: ["block_treatment", "block_product", "specialist_only"],
    riskEffect: "black",
    productEligibilityEffect: "ineligible",
    triggerDescription: "Previous chemicals or stain source include an unknown industrial chemical.",
    requiredData: ["previousChemicals", "stainKey"],
    warning:
      "An unidentified industrial chemical is involved. Nothing further may be applied until the chemical is identified by a professional.",
    requiredAction: "Keep the container or label and refer the item for professional assessment.",
    stopCondition: "Unknown industrial chemical.",
    evidenceSource: "Missing-information policy (Step 9 §30).",
    overridable: false,
    trigger: (c) => has(c.previousChemicals, "unknown_industrial_chemical") || c.stainKey === "unknown_industrial_chemical",
  }),

  /* ---------------- Existing damage (§7 band 2) ---------------- */
  rule({
    name: "Active fibre damage",
    plainTitle: "Stop — the fabric is already damaged",
    technicalDescription: "Fibre weakening, holes or destruction means any further chemical or mechanical action increases loss.",
    category: "inspection_stop",
    band: "existing_damage_stop",
    severity: "stop",
    effects: ["block_treatment", "specialist_only"],
    riskEffect: "black",
    gateEffect: "blocked_existing_damage",
    triggerDescription: "Existing damage includes fibre damage or holes.",
    requiredData: ["existingDamage"],
    warning: "The fabric is already weakened or damaged. Stain treatment would increase the damage.",
    requiredAction: "Refer to a professional restorer; record and photograph the damage before any handling.",
    stopCondition: "Active fibre destruction.",
    evidenceSource: "Damage diagnosis structure (Step 5).",
    overridable: false,
    trigger: (c) => has(c.existingDamage, "fibre_damage", "holes", "fibre_destruction"),
  }),
  rule({
    name: "Existing colour loss",
    plainTitle: "Stop — colour has already been lost",
    technicalDescription:
      "Existing bleach-related or chemical colour loss is permanent damage. It is a damage diagnosis, not a stain.",
    category: "colour_dye",
    band: "existing_damage_stop",
    severity: "stop",
    effects: ["block_treatment", "professional_only"],
    riskEffect: "black",
    gateEffect: "blocked_existing_damage",
    triggerDescription: "Existing damage includes colour loss.",
    requiredData: ["existingDamage"],
    warning:
      "The colour has already been removed in this area. This is dye loss, not a stain — stain chemistry cannot bring the colour back and may spread the loss.",
    requiredAction: "Refer for professional assessment of possible colour restoration.",
    stopCondition: "Confirmed colour loss.",
    evidenceSource: "Damage diagnosis structure (Step 5).",
    trigger: (c) => has(c.existingDamage, "colour_loss", "bleach_spot"),
  }),
  rule({
    name: "Melted or scorched surface",
    plainTitle: "Stop — the surface is melted or scorched",
    technicalDescription:
      "Melting, glazing or scorching of thermoplastic fibres is irreversible damage and routes to damage diagnosis.",
    category: "material_fabric",
    band: "existing_damage_stop",
    severity: "stop",
    effects: ["block_treatment", "block_heat", "specialist_only"],
    riskEffect: "black",
    gateEffect: "blocked_existing_damage",
    triggerDescription: "Existing damage includes melting, shine or scorching.",
    requiredData: ["existingDamage"],
    warning:
      "The surface is melted, glazed or scorched. This is heat damage and cannot be removed by stain chemistry.",
    requiredAction: "Route to damage diagnosis and professional assessment.",
    stopCondition: "Melting, glazing or scorch damage.",
    evidenceSource: "Damage diagnosis structure (Step 5).",
    trigger: (c) => has(c.existingDamage, "melting", "scorching", "shine"),
  }),
  rule({
    name: "Peeling coating or separating lamination",
    plainTitle: "Specialist only — the coating or lamination is failing",
    technicalDescription:
      "A failing coating, lamination or membrane will be further damaged by solvents, water and mechanical action.",
    category: "construction_finish",
    band: "existing_damage_stop",
    severity: "stop",
    effects: ["block_treatment", "specialist_only"],
    riskEffect: "black",
    gateEffect: "specialist_material_route",
    triggerDescription: "Existing damage includes a peeling coating or separating lamination.",
    requiredData: ["existingDamage", "construction"],
    warning: "The coating or lamination is already lifting. Cleaning chemistry will accelerate the failure.",
    requiredAction: "Refer to a specialist in coated and laminated garments.",
    stopCondition: "Failing coating or lamination.",
    evidenceSource: "Construction sensitivity rules (Step 2).",
    trigger: (c) => has(c.existingDamage, "peeling_coating", "lamination_separation", "coating_lifting"),
  }),

  /* ---------------- Care label (§15) ---------------- */
  rule({
    name: "Care label prohibits cleaning",
    plainTitle: "The care label says do not clean",
    technicalDescription: "A confirmed 'do not clean' instruction overrides all general treatment guidance.",
    category: "care_label",
    band: "care_label_prohibition",
    severity: "stop",
    effects: ["block_treatment", "specialist_only"],
    riskEffect: "black",
    triggerDescription: "Label prohibitions include 'do not clean'.",
    requiredData: ["labelStatus", "labelProhibitions"],
    warning: "The care label states that this garment must not be cleaned. No treatment may be recommended.",
    requiredAction: "Refer the customer to the manufacturer or a specialist who accepts the risk in writing.",
    stopCondition: "Confirmed 'do not clean' label.",
    evidenceSource: "Garment care label.",
    trigger: (c) => c.labelStatus === "available" && has(c.labelProhibitions, "do_not_clean"),
  }),
  rule({
    name: "Care label prohibits bleaching",
    plainTitle: "The care label prohibits bleach",
    technicalDescription: "A confirmed do-not-bleach symbol blocks oxidizing and reducing bleach chemistry.",
    category: "care_label",
    band: "care_label_prohibition",
    severity: "stop",
    effects: ["block_product", "block_treatment"],
    riskEffect: "red",
    productEligibilityEffect: "ineligible",
    triggerDescription: "Label prohibits bleaching while an oxidation or reduction stage is under consideration.",
    requiredData: ["labelProhibitions", "treatmentStage"],
    warning: "The care label prohibits bleach, so oxidizing or reducing chemistry cannot be used on this garment.",
    requiredAction: "Choose a stage that does not rely on bleach chemistry.",
    stopCondition: "Do-not-bleach label with bleach chemistry selected.",
    evidenceSource: "Garment care label.",
    trigger: (c) =>
      has(c.labelProhibitions, "do_not_bleach") && (c.treatmentStage === 13 || c.treatmentStage === 14),
  }),
  rule({
    name: "Spot clean only",
    plainTitle: "The care label allows spot cleaning only",
    technicalDescription: "Immersion, machine washing and full solvent processes are prohibited.",
    category: "care_label",
    band: "care_label_prohibition",
    severity: "professional_only",
    effects: ["professional_only", "allow_with_warning"],
    riskEffect: "red",
    triggerDescription: "Label prohibitions include 'spot clean only'.",
    requiredData: ["labelProhibitions"],
    warning: "This garment is marked spot clean only. Immersion or machine processes are not permitted.",
    requiredAction: "Restrict the plan to localized spotting with inspection after each step.",
    evidenceSource: "Garment care label.",
    trigger: (c) => has(c.labelProhibitions, "spot_clean_only"),
  }),
  rule({
    name: "Unreadable care label",
    plainTitle: "The care label cannot be read",
    technicalDescription: "An unreadable label is missing information, never permission.",
    category: "missing_information",
    band: "missing_safety_documentation",
    severity: "caution",
    effects: ["require_more_information", "require_compatibility_test"],
    riskEffect: "amber",
    triggerDescription: "Label status is unclear.",
    requiredData: ["labelStatus"],
    warning: "The care label cannot be read, so the manufacturer's restrictions are unknown. Treat this as missing information, not as permission.",
    requiredAction: "Photograph the label area and test any product on a hidden area first.",
    evidenceSource: "Missing-information policy (Step 9 §30).",
    trigger: (c) => c.labelStatus === "unclear",
  }),
  rule({
    name: "Missing care label",
    plainTitle: "There is no care label",
    technicalDescription: "A missing label increases uncertainty and requires the fabric safe-boundary route.",
    category: "care_label",
    band: "caution",
    severity: "caution",
    effects: ["require_more_information", "allow_with_warning"],
    riskEffect: "amber",
    triggerDescription: "Label status is 'no label'.",
    requiredData: ["labelStatus"],
    warning: "There is no care label, so the manufacturer's cleaning restrictions are unknown.",
    requiredAction: "Use the fabric safe boundary and test before any chemistry.",
    evidenceSource: "Fabric safety check (Step 2).",
    trigger: (c) => c.labelStatus === "no_label",
  }),
  rule({
    name: "Conflicting care instructions",
    plainTitle: "The care instructions conflict",
    technicalDescription: "Contradictory symbols or written instructions require professional assessment.",
    category: "care_label",
    band: "professional_only_restriction",
    severity: "professional_only",
    effects: ["professional_only"],
    riskEffect: "red",
    triggerDescription: "Label status is 'conflicting'.",
    requiredData: ["labelStatus"],
    warning: "The care instructions on this garment contradict each other, so it needs professional assessment.",
    evidenceSource: "Garment care label.",
    trigger: (c) => c.labelStatus === "conflicting",
  }),
  rule({
    name: "Dry-clean label is not product permission",
    plainTitle: "A dry-clean symbol does not approve every spotting agent",
    technicalDescription:
      "A care label permitting dry cleaning proves nothing about a specific spotting product's compatibility.",
    category: "care_label",
    band: "caution",
    severity: "information",
    effects: ["allow_with_warning"],
    triggerDescription: "Label permits dry cleaning and a product is under consideration.",
    requiredData: ["labelPermissions", "product"],
    warning:
      "The dry-clean symbol permits the process, not this specific product. Product compatibility still has to be verified separately.",
    evidenceSource: "Garment care label; product documentation.",
    trigger: (c) => has(c.labelPermissions, "dry_clean") && Boolean(c.product?.productKey),
  }),
  rule({
    name: "Wash label is not dye or finish permission",
    plainTitle: "A wash symbol does not prove the dye is water-safe",
    technicalDescription: "Washable construction does not guarantee dye or finish stability under spotting chemistry.",
    category: "care_label",
    band: "caution",
    severity: "caution",
    effects: ["require_compatibility_test"],
    riskEffect: "amber",
    triggerDescription: "Label permits washing and colour stability is untested.",
    requiredData: ["labelPermissions", "colourStability"],
    warning: "The wash symbol does not prove that the dye and finish will survive spotting chemistry. Test first.",
    evidenceSource: "Garment care label.",
    trigger: (c) => has(c.labelPermissions, "wash") && c.colourStability === "untested",
  }),

  /* ---------------- Product documentation (§20) ---------------- */
  rule({
    name: "Product prohibits this textile",
    plainTitle: "This product is prohibited on this fabric",
    technicalDescription:
      "A recorded product prohibition for a textile overrides any general 'all textiles' claim.",
    category: "product_documentation",
    band: "product_prohibition",
    severity: "stop",
    effects: ["block_product"],
    riskEffect: "red",
    productEligibilityEffect: "ineligible",
    triggerDescription: "The selected product lists this textile as prohibited.",
    requiredData: ["product.prohibitedTextiles", "textile"],
    warning: "The selected product must not be used on this fabric. A general claim for all textiles does not cancel a specific prohibition.",
    requiredAction: "Select a product with verified compatibility for this fabric.",
    stopCondition: "Documented textile prohibition.",
    evidenceSource: "Product label and technical data sheet.",
    overridable: false,
    trigger: (c) => Boolean(c.product?.prohibitedTextiles?.includes(c.textile as TextileKey)),
  }),
  rule({
    name: "Product prohibited in this process",
    plainTitle: "This product is not approved for the selected process",
    technicalDescription: "Product-machine and product-process restrictions block incompatible use.",
    category: "cleaning_process",
    band: "product_prohibition",
    severity: "stop",
    effects: ["block_product"],
    riskEffect: "red",
    productEligibilityEffect: "ineligible",
    triggerDescription: "The selected process is listed as prohibited for the product.",
    requiredData: ["product.prohibitedProcesses", "process"],
    warning: "The selected product is not approved for this cleaning process.",
    evidenceSource: "Product technical data sheet.",
    overridable: false,
    trigger: (c) => Boolean(c.process && c.product?.prohibitedProcesses?.includes(c.process as ProcessKey)),
  }),
  rule({
    name: "Product prohibited from machine entry",
    plainTitle: "Treated items must not enter the machine",
    technicalDescription:
      "A product allowed at the spotting table may still be prohibited from entering the cleaning machine before flushing.",
    category: "cleaning_process",
    band: "product_prohibition",
    severity: "stop",
    effects: ["block_next_stage", "require_rinse_or_neutralization"],
    riskEffect: "amber",
    triggerDescription: "Product is marked as prohibited from machine entry.",
    requiredData: ["product.machineEntryProhibited"],
    warning:
      "This product may be used on the spotting table but the item must not enter the machine until the documented flushing has been completed.",
    requiredAction: "Complete the documented flushing and inspection before the next process.",
    evidenceSource: "Product technical data sheet.",
    trigger: (c) => Boolean(c.product?.machineEntryProhibited),
  }),
  rule({
    name: "Missing safety data sheet",
    plainTitle: "The safety data sheet is missing",
    technicalDescription: "Without a current SDS the hazard, PPE and incompatibility set is unknown.",
    category: "product_documentation",
    band: "missing_safety_documentation",
    severity: "stop",
    effects: ["block_product", "require_more_information"],
    riskEffect: "amber",
    productEligibilityEffect: "insufficient_information",
    triggerDescription: "A product is selected and its current SDS is not held.",
    requiredData: ["product.sdsCurrent"],
    warning: "The current safety data sheet for this product is not held, so it cannot be used to drive guidance.",
    requiredAction: "Obtain the current SDS for this product version and country.",
    evidenceSource: "Product documentation register (Step 7).",
    trigger: (c) => Boolean(c.product?.productKey) && c.product?.sdsCurrent !== true,
  }),
  rule({
    name: "Missing product label or instructions",
    plainTitle: "The product label or instructions are missing",
    technicalDescription: "Missing label or TDS means dose, contact time and rinsing cannot be verified.",
    category: "product_documentation",
    band: "missing_safety_documentation",
    severity: "stop",
    effects: ["block_product", "require_more_information"],
    riskEffect: "amber",
    productEligibilityEffect: "insufficient_information",
    triggerDescription: "A product is selected and its current label or technical instructions are not held.",
    requiredData: ["product.labelCurrent", "product.tdsCurrent"],
    warning: "The current label or technical instructions for this product are not held, so its use cannot be verified.",
    requiredAction: "Record the current label and technical data sheet for this version and country.",
    evidenceSource: "Product documentation register (Step 7).",
    trigger: (c) => Boolean(c.product?.productKey) && (c.product?.labelCurrent !== true || c.product?.tdsCurrent !== true),
  }),
  rule({
    name: "Product not technically approved",
    plainTitle: "This product has not been approved by a technical reviewer",
    technicalDescription: "Unapproved product versions cannot drive actionable guidance.",
    category: "product_documentation",
    band: "missing_safety_documentation",
    severity: "professional_only",
    effects: ["block_product"],
    productEligibilityEffect: "insufficient_information",
    triggerDescription: "The selected product version is not technically approved.",
    requiredData: ["product.technicallyApproved"],
    warning: "This product version has not completed technical review, so it cannot be recommended.",
    evidenceSource: "Product verification scorecard (Step 7).",
    trigger: (c) => Boolean(c.product?.productKey) && c.product?.technicallyApproved !== true,
  }),
  rule({
    name: "Product restrictions not recorded",
    plainTitle: "Key product restrictions are not recorded",
    technicalDescription:
      "Fabric, colour, process, PPE, ventilation, incompatibility and rinsing fields must all be recorded before a product drives guidance.",
    category: "product_documentation",
    band: "missing_safety_documentation",
    severity: "caution",
    effects: ["require_more_information", "block_product"],
    productEligibilityEffect: "insufficient_information",
    triggerDescription: "One or more mandatory product restriction fields is missing.",
    requiredData: ["product"],
    warning: "Some of this product's fabric, colour, process, PPE, ventilation, incompatibility or rinsing information is missing.",
    requiredAction: "Complete the missing product fields from the current official documents. Do not fill gaps from another company's product.",
    evidenceSource: "Product documentation register (Step 7).",
    trigger: (c) => {
      const p = c.product;
      if (!p?.productKey) return false;
      return [p.fabricRestrictionsRecorded, p.colourRestrictionsRecorded, p.processRestrictionsRecorded,
        p.ppeRecorded, p.ventilationRecorded, p.incompatibilitiesRecorded, p.rinseRecorded].some((v) => v !== true);
    },
  }),
  rule({
    name: "Country mismatch on product documentation",
    plainTitle: "The product documents are for another country",
    technicalDescription:
      "A foreign SDS may be shown as reference only. Country-specific formulation and emergency information take priority.",
    category: "country_applicability",
    band: "missing_safety_documentation",
    severity: "caution",
    effects: ["block_product", "require_more_information"],
    productEligibilityEffect: "insufficient_information",
    triggerDescription: "Product country does not match the user country, or documents are flagged as a country mismatch.",
    requiredData: ["userCountry", "product.countryMatch", "sourceDocumentStatus"],
    warning:
      "The held product documents are for a different country. They may be used as reference only — local formulation, units and emergency contacts must be confirmed.",
    requiredAction: "Obtain the documentation issued for the user's country.",
    evidenceSource: "Product country applicability records (Step 7).",
    trigger: (c) =>
      (Boolean(c.product?.productKey) && c.product?.countryMatch === false) || c.sourceDocumentStatus === "country_mismatch",
  }),
  rule({
    name: "Product documentation changed after this case",
    plainTitle: "The product documentation has changed since this case was decided",
    technicalDescription: "Historical decisions stay reproducible; the new documentation requires re-evaluation.",
    category: "product_documentation",
    band: "caution",
    severity: "caution",
    effects: ["require_more_information", "require_supervisor_review"],
    triggerDescription: "Source-document status is marked partial after a version change.",
    requiredData: ["sourceDocumentStatus"],
    warning: "The product documentation has changed since this case was assessed. The earlier decision is preserved but must be re-checked.",
    evidenceSource: "Mapping review triggers (Step 8).",
    trigger: (c) => c.sourceDocumentStatus === "partial",
  }),

  /* ---------------- Fabric and material (§11, §12) ---------------- */
  rule({
    name: "Unknown fabric without a safe boundary",
    plainTitle: "The fabric cannot be identified within a safe treatment boundary",
    technicalDescription:
      "Where plausible materials share no safe common boundary, all chemistry is blocked. Fibre is never identified from appearance and burn testing is never recommended.",
    category: "material_fabric",
    band: "fabric_construction_prohibition",
    severity: "stop",
    effects: ["block_treatment", "require_more_information"],
    riskEffect: "black",
    gateEffect: "blocked_pending_identification",
    triggerDescription: "Fabric is unknown with unknown confidence and no risk group established.",
    requiredData: ["textile", "fabricConfidence", "fabricRiskGroup"],
    warning:
      "The fabric cannot be identified within a safe treatment boundary. Do not apply stain-removal chemicals yet.",
    requiredAction: "Provide the fibre-composition label or have the fibre identified professionally.",
    stopCondition: "No safe common boundary across plausible materials.",
    evidenceSource: "Fabric safety check (Step 2).",
    trigger: (c) => c.textile === "unknown_material" && c.fabricConfidence === "unknown" && !c.fabricRiskGroup,
  }),
  rule({
    name: "Unknown fabric with an established risk group",
    plainTitle: "Use the safest boundary for the possible fabrics",
    technicalDescription:
      "With a Step 2 risk group available, the safest boundary across plausible materials applies and a controlled test is required.",
    category: "material_fabric",
    band: "required_compatibility_test",
    severity: "test_required",
    effects: ["require_compatibility_test", "allow_with_warning"],
    riskEffect: "amber",
    gateEffect: "proceed_with_testing",
    triggerDescription: "Fabric is unknown but a fabric risk group is recorded.",
    requiredData: ["textile", "fabricRiskGroup"],
    warning: "The exact fibre is unknown, so the safest boundary for the possible materials is applied and a hidden test is required.",
    requiredAction: "Complete a controlled hidden-area test before treating the visible area.",
    evidenceSource: "Fabric safety check (Step 2).",
    trigger: (c) => c.textile === "unknown_material" && Boolean(c.fabricRiskGroup),
  }),
  rule({
    name: "Acetate and triacetate solvent sensitivity",
    plainTitle: "Acetate dissolves in common solvents",
    technicalDescription:
      "Acetate and triacetate are destroyed by acetone-type solvents and are sensitive to heat and strong alkali.",
    category: "material_fabric",
    band: "fabric_construction_prohibition",
    severity: "professional_only",
    effects: ["professional_only", "require_compatibility_test"],
    riskEffect: "red",
    triggerDescription: "Textile is acetate or triacetate.",
    requiredData: ["textile"],
    warning: "Acetate can dissolve in common solvents. Only products with verified acetate compatibility may be considered.",
    requiredAction: "Verify acetate compatibility on the product document before any application.",
    evidenceSource: "Textile chemistry reference; product textile compatibility records.",
    trigger: (c) => c.textile === "acetate" || c.textile === "triacetate",
  }),
  rule({
    name: "Protein fibre alkali and oxidizer sensitivity",
    plainTitle: "Wool and silk are damaged by alkali and bleach",
    technicalDescription:
      "Wool and silk are protein fibres: alkali, chlorine bleach, high heat and mechanical action cause irreversible damage.",
    category: "material_fabric",
    band: "fabric_construction_prohibition",
    severity: "professional_only",
    effects: ["professional_only", "require_compatibility_test"],
    riskEffect: "red",
    triggerDescription: "Textile is wool or silk.",
    requiredData: ["textile"],
    warning: "Wool and silk are damaged by alkaline and bleaching chemistry, high heat and rubbing.",
    requiredAction: "Use only products with verified protein-fibre compatibility, at low mechanical action.",
    evidenceSource: "Textile chemistry reference.",
    trigger: (c) => c.textile === "wool" || c.textile === "silk",
  }),
  rule({
    name: "Viscose wet strength loss",
    plainTitle: "Viscose loses strength when wet",
    technicalDescription: "Viscose/rayon loses tensile strength when wet and distorts or shrinks under mechanical action.",
    category: "material_fabric",
    band: "caution",
    severity: "caution",
    effects: ["allow_with_warning", "require_compatibility_test"],
    riskEffect: "amber",
    triggerDescription: "Textile is viscose or rayon.",
    requiredData: ["textile"],
    warning: "Viscose is weak when wet and can shrink, distort or ring easily. Keep moisture controlled and mechanical action minimal.",
    evidenceSource: "Textile chemistry reference.",
    trigger: (c) => c.textile === "viscose_rayon",
  }),
  rule({
    name: "Thermoplastic heat sensitivity",
    plainTitle: "Synthetic fibres melt and glaze with heat",
    technicalDescription: "Polyester, nylon, acrylic and elastane are thermoplastic; heat causes glazing, melting and set stains.",
    category: "material_fabric",
    band: "caution",
    severity: "caution",
    effects: ["block_heat", "allow_with_warning"],
    riskEffect: "amber",
    triggerDescription: "Textile is a thermoplastic fibre.",
    requiredData: ["textile"],
    warning: "This fibre softens with heat. Heat may glaze or melt the surface and can set the stain permanently.",
    evidenceSource: "Textile chemistry reference.",
    trigger: (c) => ["polyester", "nylon_polyamide", "acrylic", "elastane"].includes(c.textile),
  }),
  rule({
    name: "Leather, suede and fur",
    plainTitle: "Specialist only — leather, suede or fur",
    technicalDescription: "These materials require specialist processes; water and solvent spotting causes staining, stiffening and colour loss.",
    category: "professional_referral",
    band: "fabric_construction_prohibition",
    severity: "stop",
    effects: ["specialist_only", "block_treatment"],
    riskEffect: "black",
    gateEffect: "specialist_material_route",
    triggerDescription: "Textile is leather, suede or fur.",
    requiredData: ["textile"],
    warning:
      "Leather, suede and fur need a specialist cleaner. Ordinary stain chemistry causes staining, hardening and colour loss.",
    requiredAction: "Refer to a leather and fur specialist.",
    stopCondition: "Leather, suede or fur item.",
    evidenceSource: "Specialist material route (Step 2).",
    trigger: (c) => ["leather", "suede", "fur"].includes(c.textile),
  }),
  rule({
    name: "Coated and waterproof fabrics",
    plainTitle: "Coated or waterproof fabric — restricted chemistry",
    technicalDescription: "Coatings, membranes and durable finishes are damaged by solvents, alkali and mechanical action.",
    category: "construction_finish",
    band: "fabric_construction_prohibition",
    severity: "professional_only",
    effects: ["professional_only", "require_compatibility_test"],
    riskEffect: "red",
    triggerDescription: "Textile is coated or waterproof.",
    requiredData: ["textile", "construction"],
    warning: "Coatings and waterproof membranes are easily damaged. Only verified, tested chemistry may be considered.",
    evidenceSource: "Construction sensitivity rules (Step 2).",
    trigger: (c) => ["coated_fabric", "waterproof_fabric"].includes(c.textile) || has(c.construction, "coating", "lamination", "waterproof_membrane"),
  }),
  rule({
    name: "Blends follow the most sensitive fibre",
    plainTitle: "A blend is treated as its most sensitive fibre",
    technicalDescription: "Blend treatment boundaries are set by the most sensitive component fibre, not the majority fibre.",
    category: "material_fabric",
    band: "caution",
    severity: "caution",
    effects: ["allow_with_warning"],
    riskEffect: "amber",
    triggerDescription: "Textile is recorded as a blend.",
    requiredData: ["textile"],
    warning: "This is a blend, so the most sensitive fibre in it sets the treatment boundary.",
    evidenceSource: "Fabric safety check (Step 2).",
    trigger: (c) => c.textile === "blends",
  }),

  /* ---------------- Colour and dye (§13) ---------------- */
  rule({
    name: "Active dye bleeding",
    plainTitle: "Stop — the dye is bleeding",
    technicalDescription: "Active dye transfer blocks further chemistry until the dye behaviour has been assessed.",
    category: "colour_dye",
    band: "active_dye_instability",
    severity: "stop",
    effects: ["block_treatment", "professional_only"],
    riskEffect: "black",
    triggerDescription: "Colour stability is recorded as active bleeding.",
    requiredData: ["colourStability"],
    warning: "The dye is currently moving. Any further moisture or chemistry will spread the colour and cause permanent damage.",
    requiredAction: "Stop, keep the area undisturbed and refer for professional assessment.",
    stopCondition: "Active dye transfer.",
    evidenceSource: "Colour and dye rules (Step 9 §13).",
    trigger: (c) => c.colourStability === "active_bleeding",
  }),
  rule({
    name: "Failed colourfastness test",
    plainTitle: "Stop — the colour test failed",
    technicalDescription: "A failed hidden test means the tested product, concentration and condition are prohibited.",
    category: "colour_dye",
    band: "active_dye_instability",
    severity: "stop",
    effects: ["block_product", "block_treatment"],
    riskEffect: "black",
    productEligibilityEffect: "ineligible",
    triggerDescription: "Test result is recorded as failed.",
    requiredData: ["testResult"],
    warning: "The hidden-area test failed. This product must not be used on this garment.",
    stopCondition: "Failed compatibility test.",
    evidenceSource: "Compatibility test record (Step 3).",
    overridable: false,
    trigger: (c) => c.testResult === "failed",
  }),
  rule({
    name: "White is not automatically bleach-safe",
    plainTitle: "White does not mean bleach-safe",
    technicalDescription: "Optical brighteners, finishes and elastane content make many white garments bleach-sensitive.",
    category: "colour_dye",
    band: "caution",
    severity: "caution",
    effects: ["allow_with_warning", "require_compatibility_test"],
    riskEffect: "amber",
    triggerDescription: "Garment is white and bleach chemistry is under consideration.",
    requiredData: ["colour", "treatmentStage"],
    warning: "A white garment is not automatically bleach-safe. Finishes, brighteners and elastane can be damaged.",
    evidenceSource: "Colour and dye rules (Step 9 §13).",
    trigger: (c) => c.colour === "white" && (c.treatmentStage === 13 || c.treatmentStage === 14),
  }),
  rule({
    name: "Dark and bright dye caution",
    plainTitle: "Dark and bright colours need extra dye caution",
    technicalDescription: "Deep and bright shades carry more surface dye and show any dye loss immediately.",
    category: "colour_dye",
    band: "required_compatibility_test",
    severity: "test_required",
    effects: ["require_compatibility_test"],
    riskEffect: "amber",
    triggerDescription: "Colour is dark, bright or garment-dyed and stability is untested.",
    requiredData: ["colour", "colourStability"],
    warning: "Dark, bright and garment-dyed fabrics lose colour easily. Test on a hidden area before treating the stain.",
    evidenceSource: "Colour and dye rules (Step 9 §13).",
    trigger: (c) => ["dark", "bright", "garment_dyed"].includes(c.colour) && c.colourStability === "untested",
  }),
  rule({
    name: "Multicoloured and printed garments",
    plainTitle: "Every affected colour must be tested",
    technicalDescription:
      "Multicoloured, printed and foil-finished garments require testing on each affected colour; a pass on one colour is not a pass on another.",
    category: "colour_dye",
    band: "required_compatibility_test",
    severity: "test_required",
    effects: ["require_compatibility_test", "professional_only"],
    riskEffect: "red",
    triggerDescription: "Colour is multicoloured, printed or metallic and stability is not confirmed on all colours.",
    requiredData: ["colour", "colourStability"],
    warning: "This garment has more than one colour. Each affected colour has to be tested separately before treatment.",
    evidenceSource: "Colour and dye rules (Step 9 §13).",
    trigger: (c) => ["multicoloured", "print", "metallic"].includes(c.colour) && c.colourStability !== "passed",
  }),
  rule({
    name: "Unknown colour stability",
    plainTitle: "Colour stability is unknown",
    technicalDescription: "Unconfirmed colour stability is missing information and requires a controlled test.",
    category: "missing_information",
    band: "required_compatibility_test",
    severity: "test_required",
    effects: ["require_compatibility_test", "require_more_information"],
    riskEffect: "amber",
    triggerDescription: "Colour is unknown or the stability test is inconclusive.",
    requiredData: ["colour", "colourStability"],
    warning: "The colour behaviour of this garment is not confirmed, so a controlled test is required.",
    evidenceSource: "Missing-information policy (Step 9 §30).",
    trigger: (c) => c.colour === "unknown" || c.colourStability === "inconclusive",
  }),
  rule({
    name: "Test scope is limited",
    plainTitle: "A passed test covers only what was tested",
    technicalDescription:
      "A passed test applies only to the tested product, concentration, contact time and condition.",
    category: "colour_dye",
    band: "general_recommendation",
    severity: "information",
    effects: ["allow_with_warning"],
    triggerDescription: "A test has passed.",
    requiredData: ["testResult"],
    warning:
      "The passed test covers only that product, strength, time and condition. Any change means testing again.",
    evidenceSource: "Compatibility test record (Step 3).",
    trigger: (c) => c.testResult === "passed",
  }),
  rule({
    name: "No safe hidden test area",
    plainTitle: "There is no safe area to test on",
    technicalDescription: "Without a hidden test area, required colour testing cannot be performed.",
    category: "professional_referral",
    band: "professional_only_restriction",
    severity: "professional_only",
    effects: ["professional_only", "require_more_information"],
    riskEffect: "red",
    triggerDescription: "No hidden test area is available.",
    requiredData: ["hiddenTestAreaAvailable"],
    warning: "There is no hidden area where a test can be made safely, so testing has to be done by a professional.",
    evidenceSource: "Compatibility testing rules (Step 3).",
    trigger: (c) => c.hiddenTestAreaAvailable === false,
  }),

  /* ---------------- Construction and finish (§14) ---------------- */
  rule({
    name: "Glued decoration in the stain area",
    plainTitle: "Stop — the stain is on a glued decoration",
    technicalDescription:
      "Stones, foil and flocking attached with adhesive are released by solvents, water and heat.",
    category: "construction_finish",
    band: "fabric_construction_prohibition",
    severity: "stop",
    effects: ["block_treatment", "specialist_only"],
    riskEffect: "black",
    gateEffect: "specialist_material_route",
    triggerDescription: "Construction includes glued stones, foil or flocking.",
    requiredData: ["construction"],
    warning: "The affected area has glued decoration. Cleaning chemistry will loosen or remove it.",
    requiredAction: "Refer to a specialist who can protect or re-fix the decoration.",
    stopCondition: "Stain on glued decoration.",
    evidenceSource: "Construction sensitivity rules (Step 2).",
    trigger: (c) => has(c.construction, "beads", "sequins", "rhinestones", "foil", "flocking", "adhesive_construction", "glued_stones"),
  }),
  rule({
    name: "Decoration already loosening",
    plainTitle: "Stop — decoration is already coming away",
    technicalDescription: "Loosening decoration will detach during any treatment and is recorded as existing damage.",
    category: "construction_finish",
    band: "existing_damage_stop",
    severity: "stop",
    effects: ["block_treatment", "specialist_only"],
    riskEffect: "black",
    triggerDescription: "Decoration is recorded as loosening.",
    requiredData: ["decorationLoosening"],
    warning: "Decoration on this garment is already loosening, so treatment would detach it.",
    evidenceSource: "Construction sensitivity rules (Step 2).",
    trigger: (c) => c.decorationLoosening === true,
  }),
  rule({
    name: "Metallic thread with incompatible chemistry",
    plainTitle: "Metallic thread can tarnish or dissolve",
    technicalDescription: "Metallic and zari threads react with alkaline, oxidizing and reducing chemistry.",
    category: "construction_finish",
    band: "fabric_construction_prohibition",
    severity: "professional_only",
    effects: ["professional_only", "require_compatibility_test"],
    riskEffect: "red",
    triggerDescription: "Construction includes metallic thread.",
    requiredData: ["construction"],
    warning: "Metallic thread tarnishes or dissolves with the wrong chemistry, and the change is permanent.",
    evidenceSource: "Construction sensitivity rules (Step 2).",
    trigger: (c) => has(c.construction, "metallic_thread", "zari"),
  }),
  rule({
    name: "Unknown interlining or structured garment",
    plainTitle: "Structured garment with unknown interlining",
    technicalDescription: "Fusible interlinings bubble and separate when solvents or moisture reach the adhesive.",
    category: "construction_finish",
    band: "professional_only_restriction",
    severity: "professional_only",
    effects: ["professional_only"],
    riskEffect: "red",
    triggerDescription: "Construction includes interlining, padding or an unknown adhesive.",
    requiredData: ["construction"],
    warning: "Structured areas can bubble or separate when the inner adhesive is reached. This needs professional handling.",
    evidenceSource: "Construction sensitivity rules (Step 2).",
    trigger: (c) => has(c.construction, "interlining", "padding", "unknown_adhesive", "fusible"),
  }),
  rule({
    name: "High-value or irreplaceable garment",
    plainTitle: "High-value garment — professional handling",
    technicalDescription: "Bridal, designer and irreplaceable items carry disproportionate loss and require professional handling.",
    category: "professional_referral",
    band: "professional_only_restriction",
    severity: "professional_only",
    effects: ["professional_only"],
    riskEffect: "red",
    triggerDescription: "Garment is marked high value or irreplaceable.",
    requiredData: ["highValueGarment"],
    warning: "This garment is high value or irreplaceable, so it should be treated professionally rather than at home.",
    evidenceSource: "Professional referral rules (Step 9 §27).",
    trigger: (c) => c.highValueGarment === true,
  }),

  /* ---------------- Stain chemistry (§16) ---------------- */
  rule({
    name: "Unknown stain blocks speculative chemistry",
    plainTitle: "The stain has not been identified",
    technicalDescription: "Speculative chemistry on an unidentified stain risks setting it and damaging the fibre.",
    category: "stain_chemistry",
    band: "fabric_construction_prohibition",
    severity: "stop",
    effects: ["block_treatment", "block_heat", "require_more_information"],
    riskEffect: "red",
    gateEffect: "blocked_pending_identification",
    triggerDescription: "Stain confidence is below 4 or the category is combination/unknown with no components.",
    requiredData: ["stainConfidence", "stainCategory"],
    warning: "The stain has not been identified confidently enough to choose chemistry safely.",
    requiredAction: "Answer the identification questions, or add a photograph and the stain source.",
    evidenceSource: "Stain identification confidence (Step 3).",
    trigger: (c) => c.stainConfidence < 4 || (c.stainCategory === "combination_unknown" && c.stainComponents.length === 0),
  }),
  rule({
    name: "Protein stain heat block",
    plainTitle: "No heat on a protein stain",
    technicalDescription: "Heat coagulates protein and sets the stain permanently.",
    category: "stain_chemistry",
    band: "fabric_construction_prohibition",
    severity: "stop",
    effects: ["block_heat"],
    riskEffect: "amber",
    triggerDescription: "Stain category or components include protein.",
    requiredData: ["stainCategory", "stainComponents"],
    warning: "Heat sets protein stains permanently. Do not iron, steam, tumble dry or use hot water before the stain is removed.",
    stopCondition: "Any heat before protein removal is assessed.",
    evidenceSource: "Stain chemistry reference.",
    overridable: false,
    trigger: (c) => c.stainCategory === "protein" || has(c.stainComponents, "protein"),
  }),
  rule({
    name: "Oil and grease need more than water",
    plainTitle: "Water alone will not remove oil",
    technicalDescription: "Oil and grease require a solvent or surfactant route; water-only attempts spread the stain and cause rings.",
    category: "stain_chemistry",
    band: "general_recommendation",
    severity: "information",
    effects: ["allow_with_warning"],
    triggerDescription: "Stain category or components are oil or grease.",
    requiredData: ["stainCategory", "stainComponents"],
    warning: "Water alone does not remove oil or grease and can leave a ring. A solvent or detergent route is needed.",
    evidenceSource: "Stain chemistry reference.",
    trigger: (c) => c.stainCategory === "oil_grease" || has(c.stainComponents, "oil", "grease", "wax"),
  }),
  rule({
    name: "Tannin escalation control",
    plainTitle: "Do not escalate tannin stains without verification",
    technicalDescription: "Unverified alkaline or oxidizing escalation on tannin stains risks dye and fibre damage.",
    category: "stain_chemistry",
    band: "caution",
    severity: "caution",
    effects: ["allow_with_warning", "require_compatibility_test"],
    riskEffect: "amber",
    triggerDescription: "Stain category is tannin/plant.",
    requiredData: ["stainCategory"],
    warning: "Tannin stains respond to controlled steps. Stronger alkaline or bleaching chemistry must not be added without verification.",
    evidenceSource: "Stain chemistry reference.",
    trigger: (c) => c.stainCategory === "tannin_plant" || has(c.stainComponents, "tannin"),
  }),
  rule({
    name: "Dye and ink spreading risk",
    plainTitle: "Dye and ink stains can spread",
    technicalDescription: "Dye and ink require colourfastness assessment and containment of the spreading edge.",
    category: "stain_chemistry",
    band: "required_compatibility_test",
    severity: "test_required",
    effects: ["require_compatibility_test", "professional_only"],
    riskEffect: "red",
    triggerDescription: "Stain category is dye/ink.",
    requiredData: ["stainCategory"],
    warning: "Dye and ink stains spread easily and can transfer into surrounding fabric. Colourfastness must be checked first.",
    evidenceSource: "Stain chemistry reference.",
    trigger: (c) => c.stainCategory === "dye_ink" || has(c.stainComponents, "ink", "synthetic_dye", "natural_dye"),
  }),
  rule({
    name: "Paint, resin and adhesive curing",
    plainTitle: "Cured paint and adhesive need specialist work",
    technicalDescription: "Once cured, polymer stains require solvents that frequently attack the finish or fibre.",
    category: "stain_chemistry",
    band: "professional_only_restriction",
    severity: "professional_only",
    effects: ["professional_only"],
    riskEffect: "red",
    triggerDescription: "Stain category is paint/polymer.",
    requiredData: ["stainCategory"],
    warning: "Paint, resin and adhesive harden with time and need solvents that can damage the fabric or finish.",
    evidenceSource: "Stain chemistry reference.",
    trigger: (c) => c.stainCategory === "paint_polymer" || has(c.stainComponents, "resin", "adhesive", "polymer", "paint_binder"),
  }),
  rule({
    name: "Metal and rust verification",
    plainTitle: "Rust removers need material and trim verification",
    technicalDescription: "Rust removers are acidic or reducing and attack metal trim, elastane and some dyes.",
    category: "stain_chemistry",
    band: "professional_only_restriction",
    severity: "professional_only",
    effects: ["professional_only", "require_compatibility_test"],
    riskEffect: "red",
    triggerDescription: "Stain category is metal/rust.",
    requiredData: ["stainCategory", "construction"],
    warning: "Rust treatment uses aggressive chemistry that can damage the fabric, trim and dye. Material and trim must be verified first.",
    evidenceSource: "Stain chemistry reference.",
    trigger: (c) => c.stainCategory === "metal_rust" || has(c.stainComponents, "metallic_oxide", "mineral"),
  }),
  rule({
    name: "Oxidizable classification is not bleach permission",
    plainTitle: "An oxidizable stain does not authorize bleach",
    technicalDescription: "Category alone never authorizes oxidation; textile, colour and product verification are separate requirements.",
    category: "stain_chemistry",
    band: "caution",
    severity: "caution",
    effects: ["require_compatibility_test", "allow_with_warning"],
    riskEffect: "amber",
    triggerDescription: "Stain category is oxidizable.",
    requiredData: ["stainCategory"],
    warning: "Being an oxidizable stain does not mean bleach may be used. Fabric, colour and product compatibility all have to be verified.",
    evidenceSource: "Universal classification system (Step 5).",
    trigger: (c) => c.stainCategory === "oxidizable",
  }),
  rule({
    name: "Reducible chemistry professional verification",
    plainTitle: "Reducing chemistry is professional work",
    technicalDescription: "Reducing agents require verified colour compatibility, ventilation and controlled rinsing.",
    category: "stain_chemistry",
    band: "professional_only_restriction",
    severity: "professional_only",
    effects: ["professional_only"],
    riskEffect: "red",
    triggerDescription: "Stain category is reducible.",
    requiredData: ["stainCategory"],
    warning: "Reducing chemistry needs professional verification of colour compatibility, ventilation and rinsing.",
    evidenceSource: "Universal classification system (Step 5).",
    trigger: (c) => c.stainCategory === "reducible",
  }),
  rule({
    name: "Combination stain ordering",
    plainTitle: "A combination stain needs an ordered sequence",
    technicalDescription: "Combination stains require ordered stages by dominant component; a single step is unsafe.",
    category: "stain_chemistry",
    band: "caution",
    severity: "caution",
    effects: ["allow_with_warning", "require_inspection"],
    riskEffect: "amber",
    triggerDescription: "More than one significant stain component is recorded.",
    requiredData: ["stainComponents"],
    warning: "This stain has more than one component, so it must be treated in an ordered sequence with inspection between steps.",
    evidenceSource: "Treatment pathways (Step 8).",
    trigger: (c) => c.stainComponents.length > 1,
  }),

  /* ---------------- Heat (§17) ---------------- */
  rule({
    name: "No heat before inspection",
    plainTitle: "No heat until the item has been inspected",
    technicalDescription: "Heat is prohibited until the post-treatment inspection gate has passed.",
    category: "inspection_stop",
    band: "fabric_construction_prohibition",
    severity: "stop",
    effects: ["block_heat", "require_inspection"],
    riskEffect: "amber",
    triggerDescription: "A treatment stage has been applied and inspection is not completed.",
    requiredData: ["treatmentStage", "inspectionCompleted"],
    warning: "Do not apply any heat until the treated area has been inspected and confirmed clear.",
    stopCondition: "Heat before a passed inspection.",
    evidenceSource: "Inspection gates (Step 8 §15).",
    overridable: false,
    trigger: (c) => Boolean(c.treatmentStage && c.treatmentStage >= 4) && c.inspectionCompleted !== true,
  }),
  rule({
    name: "Heat already applied to the stain",
    plainTitle: "Heat has already been applied to this stain",
    technicalDescription: "Heat-set stains are harder to remove and carry a higher risk of permanent marking.",
    category: "stain_condition",
    band: "caution",
    severity: "caution",
    effects: ["allow_with_warning", "block_heat"],
    riskEffect: "amber",
    triggerDescription: "Heat exposure is recorded as ironing, steaming, tumble drying, hot water or pressing.",
    requiredData: ["heatExposure"],
    warning: "This stain has already been heated, so it is harder to remove and may be permanent. No further heat may be used.",
    evidenceSource: "Treatment readiness assessment (Step 4).",
    trigger: (c) => ["ironed", "steamed", "tumble_dried", "hot_water", "pressed"].includes(c.heatExposure),
  }),
  rule({
    name: "Unknown heat history",
    plainTitle: "It is not known whether heat was applied",
    technicalDescription: "Unknown heat history is missing information and blocks further heat.",
    category: "missing_information",
    band: "caution",
    severity: "caution",
    effects: ["block_heat", "require_more_information"],
    riskEffect: "amber",
    triggerDescription: "Heat exposure is unknown.",
    requiredData: ["heatExposure"],
    warning: "It is not known whether this stain has already been heated, so no heat may be used and removal may be limited.",
    evidenceSource: "Missing-information policy (Step 9 §30).",
    trigger: (c) => c.heatExposure === "unknown",
  }),
  rule({
    name: "Steam instruction does not override a stain heat prohibition",
    plainTitle: "A product steam instruction cannot override a heat block",
    technicalDescription:
      "A product-level steam-first instruction never overrides a stain-specific heat prohibition such as protein or unknown stains.",
    category: "stain_chemistry",
    band: "fabric_construction_prohibition",
    severity: "stop",
    effects: ["block_heat"],
    riskEffect: "amber",
    triggerDescription: "A steam-first product instruction exists while the stain prohibits heat.",
    requiredData: ["stainCategory", "product"],
    warning:
      "The product instruction mentions steam, but this stain type must not be heated. The stain rule applies.",
    stopCondition: "Steam instruction against a heat-prohibited stain.",
    evidenceSource: "Clean Craft chart review flag (Step 7/8).",
    overridable: false,
    trigger: (c) =>
      Boolean(c.product?.productKey) &&
      (c.stainCategory === "protein" || has(c.stainComponents, "protein") || c.stainConfidence < 4),
  }),

  /* ---------------- Previous treatment (§18) ---------------- */
  rule({
    name: "Unknown previous chemical",
    plainTitle: "An unknown product was already used",
    technicalDescription: "Unknown prior chemistry blocks uncertain additions because the reaction cannot be predicted.",
    category: "previous_treatment",
    band: "chemical_incompatibility_stop",
    severity: "stop",
    effects: ["block_treatment", "block_product", "require_more_information", "professional_only"],
    riskEffect: "red",
    productEligibilityEffect: "ineligible",
    triggerDescription: "Previous chemicals include an unknown product.",
    requiredData: ["previousChemicals"],
    warning:
      "An unidentified product has already been used on this stain. Adding another chemical is not safe until the first one is known.",
    requiredAction: "Find the product name or label photograph, or refer the item for professional assessment.",
    stopCondition: "Unknown previous chemistry.",
    evidenceSource: "Previous-chemical check (Step 8 §12).",
    trigger: (c) => has(c.previousChemicals, "unknown_product", "unknown"),
  }),
  rule({
    name: "Multiple unrinsed products",
    plainTitle: "Several products are still in the fabric",
    technicalDescription: "Two or more unrinsed products create an unknown mixture and trigger a safety hold.",
    category: "previous_treatment",
    band: "chemical_incompatibility_stop",
    severity: "stop",
    effects: ["block_treatment", "require_rinse_or_neutralization"],
    riskEffect: "red",
    triggerDescription: "Two or more products were applied without rinsing.",
    requiredData: ["unrinsedProductCount", "previousRinsed"],
    warning: "More than one product is still in the fabric. Nothing further may be added until the item has been flushed.",
    requiredAction: "Flush with water where the fabric allows, then re-assess.",
    stopCondition: "Multiple unrinsed products.",
    evidenceSource: "Previous-chemical check (Step 8 §12).",
    trigger: (c) => (c.unrinsedProductCount ?? 0) >= 2,
  }),
  rule({
    name: "Rinsing not confirmed",
    plainTitle: "Rinsing has not been confirmed",
    technicalDescription: "Previous rinsing is never assumed when the user is unsure.",
    category: "previous_treatment",
    band: "caution",
    severity: "caution",
    effects: ["require_rinse_or_neutralization", "require_more_information"],
    riskEffect: "amber",
    triggerDescription: "The user is unsure whether the previous product was rinsed out and a product was applied.",
    requiredData: ["previousRinsed", "previousChemicals"],
    warning: "It is not confirmed that the earlier product was rinsed out, so residue may still be present.",
    evidenceSource: "Previous-chemical check (Step 8 §12).",
    trigger: (c) => c.previousRinsed === "unsure" && c.previousChemicals.length > 0,
  }),
  rule({
    name: "Damage or colour change after previous treatment",
    plainTitle: "Stop — the earlier treatment changed the fabric",
    technicalDescription: "Colour loss, bleeding or fibre change after a previous attempt is a stop condition.",
    category: "previous_treatment",
    band: "existing_damage_stop",
    severity: "stop",
    effects: ["block_treatment", "professional_only"],
    riskEffect: "black",
    triggerDescription: "Previous outcome is recorded as worse or damaging.",
    requiredData: ["previousOutcome"],
    warning: "The earlier attempt changed the colour or the fabric. Stop and have the item assessed professionally.",
    stopCondition: "Damage after previous treatment.",
    evidenceSource: "Treatment attempt history (Step 4).",
    trigger: (c) => c.previousOutcome === "damage" || c.previousOutcome === "worse",
  }),
  rule({
    name: "Repeated failure escalates to professional",
    plainTitle: "Repeated attempts have failed",
    technicalDescription: "Previous failure never justifies stronger chemistry; it escalates the case.",
    category: "professional_referral",
    band: "professional_only_restriction",
    severity: "professional_only",
    effects: ["professional_only", "block_repetition"],
    riskEffect: "red",
    triggerDescription: "Three or more attempts recorded, or a professional spotter has already treated the item.",
    requiredData: ["attemptCount", "previousTreatments"],
    warning:
      "This stain has already resisted several attempts. Stronger chemistry is not the answer — the case needs professional assessment.",
    evidenceSource: "Repetition rules (Step 9 §29).",
    trigger: (c) => (c.attemptCount ?? 0) >= 3 || has(c.previousTreatments, "professional_spotter"),
  }),
  rule({
    name: "Previous treatment lowers identification confidence",
    plainTitle: "Earlier cleaning makes the stain harder to identify",
    technicalDescription: "Prior washing or cleaning removes the visible characteristics used for identification.",
    category: "stain_condition",
    band: "caution",
    severity: "information",
    effects: ["allow_with_warning"],
    triggerDescription: "The item has been washed or cleaned since the stain occurred.",
    requiredData: ["previousTreatments"],
    warning: "Because the item has already been cleaned, the stain's appearance is less reliable for identification.",
    evidenceSource: "Stain identification (Step 3).",
    trigger: (c) => has(c.previousTreatments, "washing", "dry_cleaning", "wet_cleaning"),
  }),

  /* ---------------- Cleaning process (§21) ---------------- */
  rule({
    name: "Unknown dry-cleaning solvent",
    plainTitle: "The dry-cleaning solvent is not known",
    technicalDescription:
      "Dry-cleaning systems are not interchangeable; an unknown solvent blocks solvent-specific recommendations.",
    category: "cleaning_process",
    band: "missing_safety_documentation",
    severity: "stop",
    effects: ["block_product", "require_more_information"],
    riskEffect: "amber",
    productEligibilityEffect: "insufficient_information",
    triggerDescription: "Process is recorded as an unknown solvent system.",
    requiredData: ["process"],
    warning: "The dry-cleaning system in use is not known, so solvent-specific products cannot be recommended.",
    requiredAction: "Record the machine's solvent system before selecting a solvent-side product.",
    evidenceSource: "Process compatibility records (Step 7).",
    trigger: (c) => c.process === "unknown_solvent",
  }),
  rule({
    name: "Required flushing cannot be completed",
    plainTitle: "The required flushing cannot be completed",
    technicalDescription: "Where flushing is required before the next process, absence of water flushing blocks progression.",
    category: "cleaning_process",
    band: "missing_ppe_equipment_training",
    severity: "stop",
    effects: ["block_next_stage", "require_rinse_or_neutralization"],
    riskEffect: "amber",
    triggerDescription: "Rinsing is required but water flushing equipment is not available.",
    requiredData: ["product.rinseRecorded", "equipmentAvailable"],
    warning: "The documented flushing step cannot be completed with the available equipment, so the next process must not start.",
    evidenceSource: "Rinsing requirements (Step 8 §13).",
    trigger: (c) => Boolean(c.product?.productKey) && !has(c.equipmentAvailable, "water_flushing", "spotting_table"),
  }),

  /* ---------------- Role and training (§22) ---------------- */
  rule({
    name: "Domestic user cannot receive industrial instructions",
    plainTitle: "This is professional-only chemistry",
    technicalDescription:
      "Domestic users never receive industrial chemical instructions, regardless of PPE availability or product access.",
    category: "role_training",
    band: "professional_only_restriction",
    severity: "professional_only",
    effects: ["professional_only", "block_product"],
    productEligibilityEffect: "professional_only",
    triggerDescription: "Role is domestic user and a professional product is selected.",
    requiredData: ["role", "product"],
    warning: "This product is for professional use. Home instructions for it are not provided.",
    requiredAction: "Take the item to a professional cleaner, or use the approved domestic route if one exists.",
    evidenceSource: "Role-based disclosure (Step 6/7).",
    overridable: false,
    trigger: (c) => c.role === "domestic_user" && Boolean(c.product?.productKey),
  }),
  rule({
    name: "Learner requires supervision",
    plainTitle: "Learners work under supervision",
    technicalDescription: "Learners receive educational content and supervised procedures only.",
    category: "role_training",
    band: "professional_only_restriction",
    severity: "professional_only",
    effects: ["require_supervisor_review"],
    triggerDescription: "Role is learner.",
    requiredData: ["role"],
    warning: "As a learner, this procedure must be carried out under supervision.",
    evidenceSource: "Role model (Step 1).",
    trigger: (c) => c.role === "learner",
  }),
  rule({
    name: "Missing required training",
    plainTitle: "The required training is not recorded",
    technicalDescription: "Missing training blocks the procedure even when the product and equipment are available.",
    category: "role_training",
    band: "missing_ppe_equipment_training",
    severity: "stop",
    effects: ["block_product", "block_treatment"],
    productEligibilityEffect: "ineligible",
    triggerDescription: "A product requires training that the user does not hold.",
    requiredData: ["training", "product.requiredTraining"],
    warning: "The training recorded for this procedure is missing, so it must not be carried out.",
    requiredAction: "Complete and record the required training, or hand the case to a trained colleague.",
    evidenceSource: "Product training requirements (Step 7).",
    trigger: (c) =>
      Boolean(c.product?.requiredTraining?.length) &&
      !c.product!.requiredTraining!.every((t) => t === "domestic_use_prohibited" || c.training.includes(t)),
  }),
  rule({
    name: "Administrator role is not chemical permission",
    plainTitle: "An administrator account does not grant chemical permission",
    technicalDescription: "System administration rights never imply trained chemical-use permission.",
    category: "role_training",
    band: "caution",
    severity: "information",
    effects: ["allow_with_warning"],
    triggerDescription: "A technical reviewer or administrator context is used with a product selected.",
    requiredData: ["isTechnicalReviewer", "product"],
    warning: "Reviewer access shows the technical detail but does not authorize chemical use without the recorded training.",
    evidenceSource: "Role model (Step 1).",
    trigger: (c) => Boolean(c.isTechnicalReviewer) && Boolean(c.product?.productKey),
  }),

  /* ---------------- Equipment, PPE, ventilation (§23, §24) ---------------- */
  rule({
    name: "Missing required equipment",
    plainTitle: "The required equipment is not available",
    technicalDescription: "Missing required equipment blocks the method; improvised equipment is never accepted automatically.",
    category: "equipment",
    band: "missing_ppe_equipment_training",
    severity: "stop",
    effects: ["block_product", "block_treatment"],
    productEligibilityEffect: "ineligible",
    triggerDescription: "Equipment required by the product is not in the available list.",
    requiredData: ["equipmentAvailable", "product.requiredEquipment"],
    warning: "Equipment needed for this method is not available, so the method must not be attempted.",
    evidenceSource: "Product instruction records (Step 7).",
    trigger: (c) =>
      Boolean(c.product?.requiredEquipment?.length) &&
      !c.product!.requiredEquipment!.every((e) => c.equipmentAvailable.includes(e)),
  }),
  rule({
    name: "Improvised equipment",
    plainTitle: "Improvised equipment is not accepted",
    technicalDescription: "Substituted tools change mechanical action, dose and control and are not automatically accepted.",
    category: "equipment",
    band: "caution",
    severity: "caution",
    effects: ["require_supervisor_review", "allow_with_warning"],
    riskEffect: "amber",
    triggerDescription: "Improvised equipment is recorded.",
    requiredData: ["improvisedEquipment"],
    warning: "Improvised tools change the amount of pressure and product applied, so the method is not approved as recorded.",
    evidenceSource: "Equipment rules (Step 9 §23).",
    trigger: (c) => c.improvisedEquipment === true,
  }),
  rule({
    name: "Missing required PPE",
    plainTitle: "The required protective equipment is missing",
    technicalDescription: "Documented PPE is mandatory for hazardous use; generic substitutes do not satisfy a material requirement.",
    category: "ppe_ventilation",
    band: "missing_ppe_equipment_training",
    severity: "stop",
    effects: ["block_product", "block_treatment"],
    productEligibilityEffect: "ineligible",
    triggerDescription: "PPE required by the product is not available.",
    requiredData: ["ppeAvailable", "product.requiredPpe"],
    warning: "The protective equipment required for this product is not available, so it must not be used.",
    requiredAction: "Obtain the exact PPE named in the safety data sheet before use.",
    stopCondition: "Missing mandatory PPE for hazardous use.",
    evidenceSource: "Product PPE requirements (Step 7).",
    overridable: false,
    trigger: (c) =>
      Boolean(c.product?.requiredPpe?.length) &&
      !c.product!.requiredPpe!.every((p) => c.ppeAvailable.includes(p)),
  }),
  rule({
    name: "Ventilation not confirmed",
    plainTitle: "Ventilation has not been confirmed",
    technicalDescription: "'Good ventilation' is never assumed; local exhaust is required where the SDS specifies it.",
    category: "ppe_ventilation",
    band: "missing_ppe_equipment_training",
    severity: "stop",
    effects: ["block_product", "require_more_information"],
    productEligibilityEffect: "ineligible",
    triggerDescription: "Ventilation is unknown or absent while a product is selected.",
    requiredData: ["ventilation", "product"],
    warning: "Ventilation for this work area has not been confirmed, so chemical use must not start.",
    evidenceSource: "Product SDS section 8.",
    trigger: (c) => Boolean(c.product?.productKey) && (c.ventilation === "unknown" || c.ventilation === "none"),
  }),
  rule({
    name: "PPE does not make an incompatible textile safe",
    plainTitle: "Protective equipment protects the person, not the garment",
    technicalDescription: "PPE availability never converts a textile incompatibility into permitted use.",
    category: "ppe_ventilation",
    band: "general_recommendation",
    severity: "information",
    effects: ["allow_with_warning"],
    triggerDescription: "PPE is available while a textile restriction applies.",
    requiredData: ["ppeAvailable", "textile"],
    warning: "Protective equipment keeps the operator safe. It does not make an incompatible chemical safe for the fabric.",
    evidenceSource: "PPE rules (Step 9 §24).",
    trigger: (c) => c.ppeAvailable.length > 0 && Boolean(c.product?.prohibitedTextiles?.includes(c.textile as TextileKey)),
  }),

  /* ---------------- Country (§25) ---------------- */
  rule({
    name: "User country not recorded",
    plainTitle: "The country is not recorded",
    technicalDescription: "Country drives product version, regulatory status, units and emergency contacts.",
    category: "country_applicability",
    band: "missing_safety_documentation",
    severity: "caution",
    effects: ["require_more_information"],
    triggerDescription: "User country is missing while a product is selected.",
    requiredData: ["userCountry"],
    warning: "The country is not recorded, so the correct product version and emergency information cannot be confirmed.",
    evidenceSource: "Country applicability records (Step 7).",
    trigger: (c) => Boolean(c.product?.productKey) && !c.userCountry,
  }),

  /* ---------------- Inspection and repetition (§28, §29) ---------------- */
  rule({
    name: "Inspection shows damage",
    plainTitle: "Stop — the inspection found a change",
    technicalDescription:
      "Colour loss, bleeding, ring worsening, fibre weakening, shrinkage, texture change, coating or adhesive movement all stop treatment.",
    category: "inspection_stop",
    band: "existing_damage_stop",
    severity: "stop",
    effects: ["block_treatment", "block_next_stage", "block_repetition", "block_heat"],
    riskEffect: "black",
    triggerDescription: "Inspection findings include any damage indicator.",
    requiredData: ["inspectionFindings"],
    warning: "The inspection found a change in the garment. Stop treatment now — continuing will make the damage permanent.",
    stopCondition: "Any damage indicator at inspection.",
    evidenceSource: "Inspection gates (Step 8 §15).",
    overridable: false,
    trigger: (c) =>
      has(c.inspectionFindings, "colour_loss", "dye_bleeding", "ring_worse", "fibre_weakening",
        "shrinkage", "distortion", "texture_change", "coating_softening", "lamination_separating",
        "adhesive_loosening", "decoration_change", "unexpected_reaction", "operator_uncertain"),
  }),
  rule({
    name: "Inspection required before the next stage",
    plainTitle: "Inspect before the next step",
    technicalDescription: "No repetition, heat or next-stage chemistry proceeds until an inspection has passed.",
    category: "inspection_stop",
    band: "required_compatibility_test",
    severity: "caution",
    effects: ["require_inspection", "block_next_stage"],
    triggerDescription: "A next stage is requested with no completed inspection.",
    requiredData: ["nextStage", "inspectionCompleted"],
    warning: "The treated area has to be inspected before the next step begins.",
    evidenceSource: "Inspection gates (Step 8 §15).",
    trigger: (c) => Boolean(c.nextStage) && c.inspectionCompleted !== true,
  }),
  rule({
    name: "Repeat limit unknown",
    plainTitle: "The number of permitted repeats is unknown",
    technicalDescription: "There is no universal repeat count; unknown maximum attempts returns Insufficient Information.",
    category: "repetition",
    band: "missing_safety_documentation",
    severity: "caution",
    effects: ["block_repetition", "require_more_information"],
    triggerDescription: "A product is selected with no verified maximum-attempt value.",
    requiredData: ["product.maximumAttempts", "repeatLimitKnown"],
    warning: "The documented number of permitted repeats is not held, so the step must not simply be repeated.",
    evidenceSource: "Product instruction records (Step 7).",
    trigger: (c) => Boolean(c.product?.productKey) && c.repeatLimitKnown !== true && !c.product?.maximumAttempts,
  }),

  /* ---------------- Missing information and domestic eligibility (§26, §30) ---------------- */
  rule({
    name: "Domestic eligibility requires 9/10 stain confidence",
    plainTitle: "Domestic treatment needs a confident stain identification",
    technicalDescription:
      "Domestic treatment may only be offered at stain confidence 9 or above with a known or safely bounded fabric.",
    category: "domestic_treatment",
    band: "professional_only_restriction",
    severity: "professional_only",
    effects: ["professional_only", "require_more_information"],
    triggerDescription: "Role is domestic user and stain confidence is below 9.",
    requiredData: ["role", "stainConfidence"],
    warning:
      "Domestic treatment is not recommended: the stain has not been identified confidently enough for a safe home method.",
    evidenceSource: "Domestic-treatment rules (Step 9 §26).",
    trigger: (c) => c.role === "domestic_user" && c.stainConfidence < 9,
  }),
  rule({
    name: "Domestic treatment requires low garment risk",
    plainTitle: "Domestic treatment needs a low-risk garment",
    technicalDescription:
      "Domestic treatment requires Green risk, or an explicitly approved Amber case with testing available.",
    category: "domestic_treatment",
    band: "professional_only_restriction",
    severity: "professional_only",
    effects: ["professional_only"],
    triggerDescription: "Role is domestic user and current risk is Red or Black.",
    requiredData: ["role", "currentRisk"],
    warning: "Domestic treatment is not recommended: this garment carries too much risk for a home method.",
    evidenceSource: "Domestic-treatment rules (Step 9 §26).",
    trigger: (c) => c.role === "domestic_user" && (c.currentRisk === "red" || c.currentRisk === "black"),
  }),
  rule({
    name: "Missing fibre information on a high-risk garment",
    plainTitle: "Fibre information is missing on a sensitive garment",
    technicalDescription: "Missing care and fibre information on a high-risk garment never defaults to safe.",
    category: "missing_information",
    band: "missing_safety_documentation",
    severity: "caution",
    effects: ["require_more_information", "professional_only"],
    riskEffect: "red",
    triggerDescription: "Fabric confidence is low or unknown on a high-value or heavily constructed garment.",
    requiredData: ["fabricConfidence", "highValueGarment", "construction"],
    warning: "Important fibre or care information is missing on a sensitive garment, so it needs professional assessment.",
    evidenceSource: "Missing-information policy (Step 9 §30).",
    trigger: (c) =>
      ["low", "unknown"].includes(c.fabricConfidence) && (c.highValueGarment === true || c.construction.length > 0),
  }),

  /* ---------------- AI subordination (§42) ---------------- */
  rule({
    name: "AI suggestion is subordinate to deterministic rules",
    plainTitle: "AI suggestions never override a safety rule",
    technicalDescription:
      "Any AI-generated treatment suggestion is advisory. Deterministic rules always take precedence and an AI suggestion can never lift a block.",
    category: "missing_information",
    band: "general_recommendation",
    severity: "information",
    effects: ["allow_with_warning"],
    triggerDescription: "An AI suggestion is present in the case.",
    requiredData: ["aiSuggestion"],
    warning: "The AI suggestion is advisory only. Where it disagrees with a safety rule, the safety rule applies.",
    evidenceSource: "Step 9 acceptance criteria.",
    overridable: false,
    trigger: (c) => Boolean(c.aiSuggestion),
  }),

  /* ---------------- Professional referral catch-all ---------------- */
  rule({
    name: "Risk beyond the user's capability",
    plainTitle: "This case is beyond the available training and equipment",
    technicalDescription:
      "Where risk is Red or Black and the user is not a professional role, referral is required with a stated reason.",
    category: "professional_referral",
    band: "professional_only_restriction",
    severity: "professional_only",
    effects: ["professional_only"],
    triggerDescription: "Risk is red or black and the role is not professional.",
    requiredData: ["currentRisk", "role"],
    warning: "This case needs equipment and training beyond the current user, so it should go to a professional.",
    evidenceSource: "Professional referral rules (Step 9 §27).",
    trigger: (c) => ["red", "black"].includes(c.currentRisk) && !PROFESSIONAL_ROLES.includes(c.role),
  }),
];

export const RULE_BY_ID: Record<string, SafetyRule> = Object.fromEntries(
  SAFETY_RULES.map((r) => [r.ruleId, r]),
);

export const RULE_COUNT_BY_CATEGORY = RULE_CATEGORIES.reduce(
  (acc, cat) => ({ ...acc, [cat]: SAFETY_RULES.filter((r) => r.category === cat).length }),
  {} as Record<RuleCategory, number>,
);

/** §35 — decisions that may never be overridden, whatever the reviewer's authority. */
export const NON_OVERRIDABLE_REASONS = [
  "Dangerous chemical mixing",
  "Active hazardous reaction",
  "Missing mandatory PPE for hazardous use",
  "Confirmed product prohibition",
  "Active fibre destruction",
  "Emergency referral requirement",
];

export const ENGINE_FAILURE_MESSAGE =
  "Safety checks could not be completed. Treatment guidance is temporarily unavailable.";

export const UNKNOWN_FABRIC_BLOCK_MESSAGE =
  "The fabric cannot be identified within a safe treatment boundary. Do not apply stain-removal chemicals yet.";

export const DOMESTIC_NOT_RECOMMENDED = "Domestic treatment is not recommended.";
