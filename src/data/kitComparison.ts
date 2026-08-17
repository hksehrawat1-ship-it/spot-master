/**
 * STEP 13 — Three-kit (and n-kit) comparison data model.
 *
 * Permanent principle:
 *   Compare verified products under the same case conditions.
 *   Never compare brands in the abstract.
 *
 * Nothing in this file invents doses, contact times, prices, restrictions or
 * performance results. Missing information stays missing.
 */

import type { PrimaryCategoryKey, ComponentKey } from "@/data/taxonomy";
import type { UserRoleKey, RiskLevel } from "@/lib/fabricSafety";
import type {
  TextileKey, ColourTargetKey, ComponentKey as ConstructionKey, ProcessKey, PpeKey, TrainingKey,
} from "@/data/professionalProducts";
import { INSUFFICIENT_INFO } from "@/data/professionalProducts";
import type { ChemistryFamily, MappingDecision } from "@/data/productMappings";

export const COMPARISON_SYSTEM_VERSION = "step13-comparison-v1";
export const COMPARISON_RULESET_VERSION = "step13-ruleset-v1";

/* ------------------------------------------------------------------ */
/* Controlled missing-data vocabulary (§9)                             */
/* ------------------------------------------------------------------ */

export const NOT_DISCLOSED = "Not disclosed";
export const NOT_ESTABLISHED = "Not established";
export const NOT_APPLICABLE = "Not applicable";
export const NOT_AVAILABLE_COUNTRY = "Not available in this country";
export const CURRENT_DOCUMENT_REQUIRED = "Current document required";
export const NOT_COMPARABLE_TEXT =
  "The products cannot be ranked reliably because comparable verified information is incomplete.";
export const COST_UNCALCULABLE =
  "Cost per treatment cannot be calculated from available information.";
export const DOMESTIC_PUBLIC_STATEMENT =
  "Professional stain-removal products may be available through trained textile-care operators.";

/* ------------------------------------------------------------------ */
/* Comparison ID (§4)                                                  */
/* ------------------------------------------------------------------ */

export const formatComparisonId = (n: number) => `SM-CMPAR-${String(n).padStart(6, "0")}`;

/* ------------------------------------------------------------------ */
/* Comparison context (§3)                                             */
/* ------------------------------------------------------------------ */

export type ComparisonContext = {
  comparisonId: string;
  caseId?: string;

  stainKey?: string;
  stainVariant?: string;
  categoryKey?: PrimaryCategoryKey;
  components: ComponentKey[];
  stageNumber: number;

  textile: TextileKey;
  fabricRiskGroup?: string;
  riskLevel: RiskLevel;
  colour: ColourTargetKey;
  constructions: ConstructionKey[];

  stainAge?: string;
  heatExposure?: string;
  previousTreatment?: string;
  previousChemistry: ChemistryFamily[];
  appliedProductKeys: string[];

  process: ProcessKey;
  country: string;

  role: UserRoleKey;
  training: TrainingKey[];
  equipmentAvailable: string[];
  ppeAvailable: PpeKey[];
  ventilationAvailable: boolean;

  organizationKey?: string;
  /** Product versions pinned into this comparison — never substituted. */
  productVersionKeys: string[];
  comparisonDate: string;
  rulesetVersion: string;
  mappingVersions: { mappingId: string; version: number }[];
};

/* ------------------------------------------------------------------ */
/* Product selection outcomes (§5)                                     */
/* ------------------------------------------------------------------ */

export const SELECTION_OUTCOMES = [
  "included", "included_after_testing", "professional_only",
  "excluded_fabric", "excluded_colour", "excluded_construction", "excluded_process",
  "excluded_previous_chemical", "excluded_country", "excluded_missing_documentation",
  "excluded_safety_rule", "excluded_training", "excluded_ppe", "excluded_equipment",
  "excluded_organization", "no_matching_product", "insufficient_information",
] as const;
export type SelectionOutcome = (typeof SELECTION_OUTCOMES)[number];

export const SELECTION_LABEL: Record<SelectionOutcome, string> = {
  included: "Included",
  included_after_testing: "Included After Testing",
  professional_only: "Professional Only",
  excluded_fabric: "Excluded by Fabric",
  excluded_colour: "Excluded by Colour",
  excluded_construction: "Excluded by Construction",
  excluded_process: "Excluded by Process",
  excluded_previous_chemical: "Excluded by Previous Chemical",
  excluded_country: "Excluded by Country",
  excluded_missing_documentation: "Excluded by Missing Documentation",
  excluded_safety_rule: "Excluded by Safety Rule",
  excluded_training: "Excluded by Missing Training",
  excluded_ppe: "Excluded by Unavailable PPE",
  excluded_equipment: "Excluded by Unavailable Equipment",
  excluded_organization: "Excluded — not available in this organization",
  no_matching_product: "No Matching Product",
  insufficient_information: INSUFFICIENT_INFO,
};

/** Outcomes that keep a product in the case-eligible set. */
export const ELIGIBLE_SELECTIONS: SelectionOutcome[] = [
  "included", "included_after_testing", "professional_only",
];

/* ------------------------------------------------------------------ */
/* Comparison dimensions (§6)                                          */
/* ------------------------------------------------------------------ */

export const COMPARISON_DIMENSION_KEYS = [
  "company", "kit", "productName", "productCode", "productVersion", "country",
  "stage", "intendedStain", "intendedComponent", "stainSuitability", "fabricSuitability",
  "colourSuitability", "constructionSuitability", "processCompatibility",
  "previousChemicalCompatibility", "requiredTesting", "quantityOrDilution", "contactTime",
  "temperatureLimits", "applicationTechnique", "rinsing", "neutralization", "inspection",
  "ppe", "ventilation", "equipment", "storage", "incompatibilities", "training",
  "manufacturerClaims", "verifiedPerformance", "costPerTreatment", "advantages",
  "limitations", "evidenceLevel", "verificationCompleteness", "decision", "rankEligibility",
] as const;
export type ComparisonDimensionKey = (typeof COMPARISON_DIMENSION_KEYS)[number];

export const DIMENSION_LABEL: Record<ComparisonDimensionKey, string> = {
  company: "Company", kit: "Kit", productName: "Product name", productCode: "Product code",
  productVersion: "Product version", country: "Country", stage: "Recommended treatment stage",
  intendedStain: "Intended stain", intendedComponent: "Intended component",
  stainSuitability: "Stain suitability", fabricSuitability: "Fabric suitability",
  colourSuitability: "Colour suitability", constructionSuitability: "Construction suitability",
  processCompatibility: "Cleaning-process compatibility",
  previousChemicalCompatibility: "Previous-chemical compatibility",
  requiredTesting: "Required testing", quantityOrDilution: "Required quantity or dilution",
  contactTime: "Contact time", temperatureLimits: "Temperature limits",
  applicationTechnique: "Application technique", rinsing: "Required rinsing",
  neutralization: "Required neutralization", inspection: "Required inspection",
  ppe: "Required PPE", ventilation: "Required ventilation", equipment: "Required equipment",
  storage: "Storage", incompatibilities: "Incompatibilities", training: "Training requirement",
  manufacturerClaims: "Manufacturer claims", verifiedPerformance: "Verified performance evidence",
  costPerTreatment: "Cost per treatment", advantages: "Advantages", limitations: "Limitations",
  evidenceLevel: "Evidence level", verificationCompleteness: "Verification completeness",
  decision: "Decision", rankEligibility: "Rank eligibility",
};

/* ------------------------------------------------------------------ */
/* Evidence levels (§10)                                               */
/* ------------------------------------------------------------------ */

export const COMPARISON_EVIDENCE_LEVELS = [
  "current_manufacturer_label", "current_sds", "current_tds", "current_manufacturer_instruction",
  "manufacturer_brochure", "verified_distributor_documentation", "controlled_internal_trial",
  "repeated_internal_trial", "professional_observation", "user_report", "inferred",
  "insufficient_information",
] as const;
export type ComparisonEvidenceLevel = (typeof COMPARISON_EVIDENCE_LEVELS)[number];

export const COMPARISON_EVIDENCE_LABEL: Record<ComparisonEvidenceLevel, string> = {
  current_manufacturer_label: "Current Manufacturer Label",
  current_sds: "Current SDS",
  current_tds: "Current TDS",
  current_manufacturer_instruction: "Current Manufacturer Instruction",
  manufacturer_brochure: "Manufacturer Brochure",
  verified_distributor_documentation: "Verified Distributor Documentation",
  controlled_internal_trial: "Controlled Internal Trial",
  repeated_internal_trial: "Repeated Internal Trial",
  professional_observation: "Professional Observation",
  user_report: "User Report",
  inferred: "Inferred",
  insufficient_information: INSUFFICIENT_INFO,
};

/** Ordered strongest → weakest, used only to describe evidence quality. */
export const EVIDENCE_STRENGTH: Record<ComparisonEvidenceLevel, number> = {
  repeated_internal_trial: 10,
  controlled_internal_trial: 9,
  current_tds: 8,
  current_sds: 8,
  current_manufacturer_instruction: 7,
  current_manufacturer_label: 7,
  verified_distributor_documentation: 5,
  manufacturer_brochure: 3,
  professional_observation: 2,
  user_report: 1,
  inferred: 1,
  insufficient_information: 0,
};

/** A manufacturer claim never proves performance. */
export const CLAIM_ONLY_LEVELS: ComparisonEvidenceLevel[] = [
  "manufacturer_brochure", "professional_observation", "user_report",
  "inferred", "insufficient_information",
];

/* ------------------------------------------------------------------ */
/* Evidence completeness checklist (§11)                               */
/* ------------------------------------------------------------------ */

export const EVIDENCE_CHECKLIST_KEYS = [
  "identity_verified", "version_verified", "country_verified", "label_current",
  "sds_current", "tds_current", "intended_use_verified", "fabric_compatibility_verified",
  "colour_compatibility_verified", "process_compatibility_verified", "quantity_verified",
  "contact_time_verified", "temperature_verified", "rinsing_verified",
  "neutralization_verified", "ppe_verified", "ventilation_verified",
  "incompatibilities_verified", "performance_evidence_available", "cost_data_available",
  "technical_review_complete",
] as const;
export type EvidenceChecklistKey = (typeof EVIDENCE_CHECKLIST_KEYS)[number];

export const CHECKLIST_LABEL: Record<EvidenceChecklistKey, string> = {
  identity_verified: "Identity verified",
  version_verified: "Product version verified",
  country_verified: "Country verified",
  label_current: "Label current",
  sds_current: "SDS current",
  tds_current: "TDS current",
  intended_use_verified: "Intended-use claim verified",
  fabric_compatibility_verified: "Fabric compatibility verified",
  colour_compatibility_verified: "Colour compatibility verified",
  process_compatibility_verified: "Process compatibility verified",
  quantity_verified: "Quantity or dilution verified",
  contact_time_verified: "Contact time verified",
  temperature_verified: "Temperature verified",
  rinsing_verified: "Rinsing verified",
  neutralization_verified: "Neutralization verified",
  ppe_verified: "PPE verified",
  ventilation_verified: "Ventilation verified",
  incompatibilities_verified: "Incompatibilities verified",
  performance_evidence_available: "Performance evidence available",
  cost_data_available: "Cost data available",
  technical_review_complete: "Technical review complete",
};

export type EvidenceChecklist = Record<EvidenceChecklistKey, boolean>;

export const emptyChecklist = (): EvidenceChecklist =>
  Object.fromEntries(EVIDENCE_CHECKLIST_KEYS.map((k) => [k, false])) as EvidenceChecklist;

/* ------------------------------------------------------------------ */
/* Performance trials (§12, §13)                                       */
/* ------------------------------------------------------------------ */

export const TRIAL_OUTCOMES = [
  "complete_visual_removal", "major_reduction", "moderate_reduction", "minor_reduction",
  "no_meaningful_change", "stain_spread", "pigment_remained", "dye_loss", "fibre_damage",
  "finish_damage", "test_invalid", "insufficient_evidence",
] as const;
export type TrialOutcome = (typeof TRIAL_OUTCOMES)[number];

export const TRIAL_OUTCOME_LABEL: Record<TrialOutcome, string> = {
  complete_visual_removal: "Complete visual removal under test conditions",
  major_reduction: "Major reduction",
  moderate_reduction: "Moderate reduction",
  minor_reduction: "Minor reduction",
  no_meaningful_change: "No meaningful change",
  stain_spread: "Stain spread",
  pigment_remained: "Pigment remained",
  dye_loss: "Dye loss occurred",
  fibre_damage: "Fibre damage occurred",
  finish_damage: "Finish damage occurred",
  test_invalid: "Test invalid",
  insufficient_evidence: "Insufficient evidence",
};

/** Removal value only — never used alone; safety gates apply first. */
export const REMOVAL_SCORE: Record<TrialOutcome, number> = {
  complete_visual_removal: 5, major_reduction: 4, moderate_reduction: 3, minor_reduction: 2,
  no_meaningful_change: 1, pigment_remained: 1, stain_spread: 0, dye_loss: 0,
  fibre_damage: 0, finish_damage: 0, test_invalid: 0, insufficient_evidence: 0,
};

/** Damage outcomes (§14) — a mandatory gate, never a small score penalty. */
export const DAMAGE_OUTCOMES: TrialOutcome[] = ["dye_loss", "fibre_damage", "finish_damage"];

export type DamageObservation =
  | "dye_loss" | "fibre_damage" | "texture_change" | "shrinkage" | "coating_damage"
  | "adhesive_failure" | "decoration_damage" | "unacceptable_residue" | "ring_formation"
  | "colour_change" | "odour" | "none";

export const DAMAGE_LABEL: Record<DamageObservation, string> = {
  dye_loss: "Dye loss", fibre_damage: "Fibre damage", texture_change: "Texture change",
  shrinkage: "Shrinkage", coating_damage: "Coating damage", adhesive_failure: "Adhesive failure",
  decoration_damage: "Decoration damage", unacceptable_residue: "Unacceptable residue",
  ring_formation: "Ring formation", colour_change: "Colour change", odour: "Odour",
  none: "None observed",
};

/** Damage observations that disqualify a product from ranking above a safer option. */
export const DISQUALIFYING_DAMAGE: DamageObservation[] = [
  "dye_loss", "fibre_damage", "texture_change", "shrinkage", "coating_damage",
  "adhesive_failure", "decoration_damage", "unacceptable_residue",
];

export type PerformanceTrial = {
  testId: string;                 // SM-TRIAL-000001
  stainKey: string;
  stainAge?: string;
  stainQuantity?: string;
  textile: TextileKey;
  fabricColour?: ColourTargetKey;
  fabricFinish?: string;
  productKey: string;
  productVersionKey: string;
  method: string;
  controlSample: boolean;
  temperature?: string;
  contactTime?: string;
  dose?: string;
  process: ProcessKey;
  equipment?: string;
  inspectionAfterDrying: boolean;
  result: TrialOutcome;
  damageObserved: DamageObservation[];
  repetitions?: number;
  repeatability: "single_trial" | "repeated" | "not_repeatable" | "unknown";
  photographs: string[];
  testDate: string;
  country: string;
  decision: "accepted" | "rejected" | "under_review";
  reviewer?: string;
  notes?: string;
};

/**
 * Two trials are comparable only when the case-critical conditions match.
 * Different conditions are never treated as equal (§12).
 */
export const TRIAL_COMPARABILITY_FIELDS = [
  "stainKey", "textile", "process", "controlSample", "inspectionAfterDrying",
] as const;

/* ------------------------------------------------------------------ */
/* Cost per treatment (§15, §16)                                       */
/* ------------------------------------------------------------------ */

export type PriceRecord = {
  priceId: string;
  productKey: string;
  productVersionKey: string;
  country: string;
  organizationKey?: string;      // organization prices stay private (§28)
  price?: number;
  currency?: string;
  priceDate?: string;
  packSize?: number;
  packUnit?: string;
  usableQuantity?: number;
  taxIncluded?: boolean;
  wasteAllowance?: number;       // only when documented
  source?: string;
  exchangeRate?: number;
  exchangeRateSource?: string;
  exchangeRateDate?: string;
  verified: boolean;
};

export type CostResult = {
  calculable: boolean;
  formula: string;
  inputs: Record<string, string>;
  currency?: string;
  result?: number;
  costBasis: "product_only" | "total_process" | "not_calculated";
  confidence: "verified" | "partial" | "none";
  missingInputs: string[];
  message: string;
  private: boolean;              // true when derived from organization pricing
};

export const emptyCost = (missing: string[]): CostResult => ({
  calculable: false,
  formula: NOT_ESTABLISHED,
  inputs: {},
  costBasis: "not_calculated",
  confidence: "none",
  missingInputs: missing,
  message: COST_UNCALCULABLE,
  private: false,
});

/** Prices older than this are not used for comparison. */
export const PRICE_MAX_AGE_DAYS = 365;

/* ------------------------------------------------------------------ */
/* Sustainability (§17) — optional, evidence only                      */
/* ------------------------------------------------------------------ */

export type SustainabilityFields = {
  concentration?: string;
  packagingQuantity?: string;
  estimatedProductUse?: string;
  waste?: string;
  requiredWater?: string;
  requiredEnergy?: string;
  requiredProcess?: string;
  hazardousWaste?: string;
  transportClassification?: string;
  packagingRecyclability?: string;
  evidenceLevel: ComparisonEvidenceLevel;
  source?: string;
};

export const NO_SUSTAINABILITY: SustainabilityFields = {
  evidenceLevel: "insufficient_information",
};

/* ------------------------------------------------------------------ */
/* Operational burden (§18)                                            */
/* ------------------------------------------------------------------ */

export type OperationalBurden = {
  trainingRequired: string[];
  treatmentStageCount: number | string;
  requiredTesting: string[];
  requiredEquipment: string[];
  requiredPpe: string[];
  ventilation: string;
  rinsing: string;
  neutralization: string;
  inspectionBurden: string;
  machineRestrictions: string;
  storage: string;
  documentationComplexity: string;
  /** Lower is simpler — never interpreted as safer or better. */
  burdenIndex: number;
};

/* ------------------------------------------------------------------ */
/* Ranking (§20, §21, §22)                                             */
/* ------------------------------------------------------------------ */

export const RANK_OUTPUTS = [
  "rank_1", "rank_2", "rank_3", "joint_rank", "not_recommended",
  "not_comparable", "insufficient_information", "no_applicable_product",
] as const;
export type RankOutput = (typeof RANK_OUTPUTS)[number];

export const RANK_LABEL: Record<RankOutput, string> = {
  rank_1: "Rank 1", rank_2: "Rank 2", rank_3: "Rank 3", joint_rank: "Joint Rank",
  not_recommended: "Not Recommended", not_comparable: "Not Comparable",
  insufficient_information: INSUFFICIENT_INFO, no_applicable_product: "No Applicable Product",
};

export const RANK_PRIORITY = [
  "Safety and compatibility",
  "Compliance with care and process restrictions",
  "Verified treatment effectiveness",
  "Absence of garment damage",
  "Evidence quality",
  "Process completion requirements",
  "Training and operational feasibility",
  "Cost per treatment",
  "Sustainability evidence",
] as const;

/* ------------------------------------------------------------------ */
/* Comparability gate (§8)                                             */
/* ------------------------------------------------------------------ */

export const COMPARABILITY_CHECKS = [
  "same_stage", "same_target", "same_case_conditions", "same_use_objective",
  "same_fabric_applicability", "same_colour_applicability", "same_process_applicability",
  "current_versions", "country_applicability", "safety_documents_available",
  "comparable_performance_evidence", "comparable_dose_information",
  "comparable_outcome_measure", "comparable_cost_basis",
] as const;
export type ComparabilityCheckKey = (typeof COMPARABILITY_CHECKS)[number];

export const COMPARABILITY_LABEL: Record<ComparabilityCheckKey, string> = {
  same_stage: "Same treatment stage",
  same_target: "Same target stain or component",
  same_case_conditions: "Same case conditions",
  same_use_objective: "Same or comparable product-use objective",
  same_fabric_applicability: "Applicable to the same fabric",
  same_colour_applicability: "Applicable to the same colour condition",
  same_process_applicability: "Applicable to the same cleaning process",
  current_versions: "Current product versions",
  country_applicability: "Same country or valid country applicability",
  safety_documents_available: "Required safety documents available",
  comparable_performance_evidence: "Comparable performance evidence",
  comparable_dose_information: "Comparable dose information",
  comparable_outcome_measure: "Comparable outcome measure",
  comparable_cost_basis: "Comparable cost basis",
};

/** Checks that must all pass before any rank may be produced. */
export const CRITICAL_COMPARABILITY: ComparabilityCheckKey[] = [
  "same_stage", "same_target", "same_case_conditions", "same_fabric_applicability",
  "same_colour_applicability", "same_process_applicability", "current_versions",
  "country_applicability", "safety_documents_available",
];

/* ------------------------------------------------------------------ */
/* Statuses and review triggers (§31, §32)                             */
/* ------------------------------------------------------------------ */

export const COMPARISON_STATUSES = [
  "draft", "data_required", "under_technical_review", "comparable", "not_comparable",
  "approved", "published", "needs_review", "suspended", "archived",
] as const;
export type ComparisonStatus = (typeof COMPARISON_STATUSES)[number];

export const COMPARISON_STATUS_LABEL: Record<ComparisonStatus, string> = {
  draft: "Draft", data_required: "Data Required", under_technical_review: "Under Technical Review",
  comparable: "Comparable", not_comparable: "Not Comparable", approved: "Approved",
  published: "Published", needs_review: "Needs Review", suspended: "Suspended", archived: "Archived",
};

/** Only these statuses may display a final rank. */
export const RANK_DISPLAY_STATUSES: ComparisonStatus[] = ["approved", "published"];

export const COMPARISON_REVIEW_TRIGGERS = [
  "formulation_change", "label_change", "sds_change", "tds_change", "mapping_change",
  "new_textile_restriction", "price_change", "new_performance_trial", "damage_report",
  "product_discontinued", "country_applicability_change", "ranking_logic_change",
  "review_date_expired",
] as const;
export type ComparisonReviewTrigger = (typeof COMPARISON_REVIEW_TRIGGERS)[number];

export const COMPARISON_TRIGGER_LABEL: Record<ComparisonReviewTrigger, string> = {
  formulation_change: "Product formulation changed",
  label_change: "Label changed",
  sds_change: "SDS changed",
  tds_change: "TDS changed",
  mapping_change: "Product mapping changed",
  new_textile_restriction: "New textile restriction appeared",
  price_change: "Price changed",
  new_performance_trial: "New performance trial added",
  damage_report: "Damage report received",
  product_discontinued: "Product discontinued",
  country_applicability_change: "Country applicability changed",
  ranking_logic_change: "Ranking logic changed",
  review_date_expired: "Review date expired",
};

/** Safety-critical triggers suspend an existing rank immediately. */
export const SUSPENDING_TRIGGERS: ComparisonReviewTrigger[] = [
  "damage_report", "new_textile_restriction", "formulation_change",
];

/* ------------------------------------------------------------------ */
/* Comparison entities                                                 */
/* ------------------------------------------------------------------ */

export type ComparisonEntry = {
  productKey: string;
  productVersionKey: string;
  companyKey: string;
  kitKey?: string;
  mappingId?: string;
  mappingVersion?: number;

  selection: SelectionOutcome;
  selectionReason: string;
  /** Never upgraded by the comparison interface (§7). */
  decision: MappingDecision;
  dimensions: Partial<Record<ComparisonDimensionKey, string>>;
  checklist: EvidenceChecklist;
  checklistComplete: boolean;
  evidenceLevel: ComparisonEvidenceLevel;
  trials: PerformanceTrial[];
  damageObserved: DamageObservation[];
  cost: CostResult;
  sustainability: SustainabilityFields;
  burden: OperationalBurden;
  advantages: string[];
  limitations: string[];
  rankEligible: boolean;
  rankEligibilityFailures: string[];
  rank: RankOutput;
  rankReason: string;
  missingData: string[];
};

export type ComparisonSnapshot = {
  comparisonId: string;
  caseVersion: string;
  rulesetVersion: string;
  stainContentVersion: string;
  productVersionKeys: string[];
  mappingVersions: { mappingId: string; version: number }[];
  sourceDocumentKeys: string[];
  priceVersionIds: string[];
  trialIds: string[];
  decision: ComparisonStatus;
  rankEligible: boolean;
  ranks: { productKey: string; rank: RankOutput }[];
  explanation: string;
  reviewer?: string;
  date: string;
};

export type ComparisonAudit = {
  id: string;
  at: string;
  comparisonId: string;
  user: string;
  action: string;
  field?: string;
  previousValue?: string;
  newValue?: string;
  reason: string;
  source?: string;
  reviewer?: string;
  approval?: string;
  rankingImpact: boolean;
};

/* ------------------------------------------------------------------ */
/* Table columns (§24)                                                 */
/* ------------------------------------------------------------------ */

export const COMPARISON_TABLE_COLUMNS = [
  "Company", "Kit Product", "Recommended Stage", "Target Stain", "Fabric Restrictions",
  "Process Requirement", "PPE", "Cost per Use", "Advantages", "Limitations", "Final Rank",
] as const;

/* ------------------------------------------------------------------ */
/* Initial three-kit status (§29)                                      */
/* ------------------------------------------------------------------ */

export type KitComparisonStatus = {
  companyKey: string;
  kitKey?: string;
  rankable: boolean;
  status: ComparisonStatus;
  summary: string;
  unresolved: string[];
};

export const INITIAL_KIT_STATUS: KitComparisonStatus[] = [
  {
    companyKey: "seitz",
    kitKey: "seitz_seven_bottle",
    rankable: false,
    status: "data_required",
    summary:
      "Purasol, Quickol, Lacol, Frankosol, Cavesol, Blutol and Colorsol are held as provisional identities only. Each product is assessed with its own recorded restrictions; no stain is assumed to have one direct Seitz product.",
    unresolved: [
      "Current labels, SDSs and TDSs or manufacturer instructions are not held.",
      "Country applicability is unspecified for every version.",
      "Solvent-system, fabric, coating and dye restrictions are not recorded.",
      "Any Cavesol/Blutol incompatibility is reported but not documented.",
    ],
  },
  {
    companyKey: "stas",
    kitKey: "stas_stain_n_kit",
    rankable: false,
    status: "data_required",
    summary:
      "STAS product identities have not been extracted into the product database, so no STAS product can enter a comparison. STAS remains unranked.",
    unresolved: [
      "Current labels not verified.",
      "Current SDSs not verified.",
      "Current TDSs or manufacturer instructions not verified.",
      "Country applicability not confirmed.",
      "Textile and process restrictions not established.",
    ],
  },
  {
    companyKey: "clean_craft",
    kitKey: "clean_craft_nine_bottle",
    rankable: false,
    status: "under_technical_review",
    summary:
      "Food 1, Food 2, Colour 1, Colour 2, Fungus Go, Organic, Oil 1, Oil 2 and Rust Go are held from a chart claim only. Bottle count, drop count and contact-time claims are not accepted as verified data.",
    unresolved: [
      "Fungus Go description inconsistency between the product name and the chart description.",
      "Chart-wide steam-first instruction is unverified.",
      "Protein and heat concern on the Organic product is unresolved.",
      "Missing chemical-family data.",
      "Missing textile restrictions.",
      "Missing PPE requirements.",
      "Missing incompatibilities.",
      "Missing current SDS and TDS.",
    ],
  },
];

/**
 * Comparison claims found in existing content that carry no evidence.
 * Reported before migration, never migrated as ranked results (§ pre-implementation).
 */
export const LEGACY_COMPARISON_CLAIMS = [
  {
    claim: "Nine-bottle kit described as more complete than a seven-bottle kit.",
    source: "Supplied Clean Craft chart",
    verdict: "rejected" as const,
    reason: "Product quantity in a kit is not evidence of performance and never affects ranking.",
  },
  {
    claim: "Universal drop count and contact time quoted for all Clean Craft products.",
    source: "Supplied Clean Craft chart",
    verdict: "rejected" as const,
    reason: "Dose and contact time must come from current applicable product documents.",
  },
  {
    claim: "Seitz described as the professional benchmark.",
    source: "Supplied Seitz chart (issuer uncertain)",
    verdict: "rejected" as const,
    reason: "Brand reputation is not a comparison dimension.",
  },
  {
    claim: "STAS chart product list treated as a verified product range.",
    source: "Supplied STAS chart",
    verdict: "flagged" as const,
    reason: "Identities may be recorded as claims once extracted, but they cannot be compared or ranked without current documents.",
  },
];

/** No verified controlled trials are held yet. */
export const SEED_TRIALS: PerformanceTrial[] = [];

/** No verified price records are held yet. */
export const SEED_PRICES: PriceRecord[] = [];

export const formatTrialId = (n: number) => `SM-TRIAL-${String(n).padStart(6, "0")}`;
export const formatPriceId = (n: number) => `SM-PRICE-${String(n).padStart(6, "0")}`;
