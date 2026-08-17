/**
 * STEP 8 — Product-to-stage mapping entities and provisional seed mappings.
 *
 * Permanent principle:
 *   Products belong to verified treatment stages. A mapping never copies product
 *   instructions into a stain record, never crosses product versions and never
 *   bypasses fabric, colour, process, PPE, training or document restrictions.
 *
 * Nothing here invents rinsing methods, quantities, contact times, temperatures
 * or repeat limits. Undocumented values are omitted.
 */

import type { PrimaryCategoryKey, ComponentKey, SourceTypeKey } from "@/data/taxonomy";
import type { UserRoleKey } from "@/lib/fabricSafety";
import type {
  TextileKey, ColourTargetKey, ComponentKey as ConstructionKey, ProcessKey, PpeKey, TrainingKey,
} from "@/data/professionalProducts";
import { PRODUCTS, PRODUCT_BY_KEY, FOLLOW_LABEL, INSUFFICIENT_INFO } from "@/data/professionalProducts";

export const MAPPING_SYSTEM_VERSION = "step8-mappings-v1";

/* ------------------------------------------------------------------ */
/* Controlled decisions                                                */
/* ------------------------------------------------------------------ */

export const MAPPING_DECISIONS = [
  "recommended", "recommended_after_testing", "professional_use_only",
  "domestic_use_suitable", "not_recommended", "insufficient_information",
] as const;
export type MappingDecision = (typeof MAPPING_DECISIONS)[number];

export const DECISION_LABEL: Record<MappingDecision, string> = {
  recommended: "Recommended",
  recommended_after_testing: "Recommended After Testing",
  professional_use_only: "Professional Use Only",
  domestic_use_suitable: "Domestic Use Suitable",
  not_recommended: "Not Recommended",
  insufficient_information: "Insufficient Information",
};

/* ------------------------------------------------------------------ */
/* Evidence levels                                                     */
/* ------------------------------------------------------------------ */

export const MAPPING_EVIDENCE_LEVELS = [
  "current_manufacturer_label", "current_sds", "current_tds", "current_manufacturer_instruction",
  "manufacturer_brochure", "verified_distributor_documentation", "internal_controlled_trial",
  "professional_observation", "user_report", "inferred", "insufficient_information",
] as const;
export type MappingEvidenceLevel = (typeof MAPPING_EVIDENCE_LEVELS)[number];

export const EVIDENCE_LEVEL_LABEL: Record<MappingEvidenceLevel, string> = {
  current_manufacturer_label: "Current Manufacturer Label",
  current_sds: "Current SDS",
  current_tds: "Current TDS",
  current_manufacturer_instruction: "Current Manufacturer Instruction",
  manufacturer_brochure: "Manufacturer Brochure",
  verified_distributor_documentation: "Verified Distributor Documentation",
  internal_controlled_trial: "Internal Controlled Trial",
  professional_observation: "Professional Observation",
  user_report: "User Report",
  inferred: "Inferred",
  insufficient_information: INSUFFICIENT_INFO,
};

/** Evidence levels that can never, alone, support a Recommended decision. */
export const NON_RECOMMENDING_EVIDENCE: MappingEvidenceLevel[] = [
  "manufacturer_brochure", "professional_observation", "user_report", "inferred", "insufficient_information",
];

/** Evidence levels strong enough to carry a verified mapping. */
export const RECOMMENDING_EVIDENCE: MappingEvidenceLevel[] = [
  "current_manufacturer_label", "current_sds", "current_tds",
  "current_manufacturer_instruction", "verified_distributor_documentation", "internal_controlled_trial",
];

/* ------------------------------------------------------------------ */
/* Approval workflow                                                   */
/* ------------------------------------------------------------------ */

export const MAPPING_STATUSES = [
  "draft", "documentation_required", "under_technical_review", "approved",
  "published", "needs_review", "suspended", "rejected", "archived",
] as const;
export type MappingStatus = (typeof MAPPING_STATUSES)[number];

export const MAPPING_STATUS_LABEL: Record<MappingStatus, string> = {
  draft: "Draft",
  documentation_required: "Documentation Required",
  under_technical_review: "Under Technical Review",
  approved: "Approved",
  published: "Published",
  needs_review: "Needs Review",
  suspended: "Suspended",
  rejected: "Rejected",
  archived: "Archived",
};

/* ------------------------------------------------------------------ */
/* Specificity                                                         */
/* ------------------------------------------------------------------ */

export type MappingSpecificity = "category" | "component" | "stain" | "case_condition";

export const SPECIFICITY_RANK: Record<MappingSpecificity, number> = {
  category: 1, component: 2, stain: 3, case_condition: 4,
};

/* ------------------------------------------------------------------ */
/* Condition sub-entities                                             */
/* ------------------------------------------------------------------ */

export type ConditionVerdict = "permitted" | "permitted_after_testing" | "prohibited" | "insufficient_information";

export type FabricCondition = { textile: TextileKey; verdict: ConditionVerdict; note?: string; source?: string };
export type ColourCondition = { colour: ColourTargetKey; verdict: ConditionVerdict; note?: string; source?: string };
export type ConstructionCondition = { construction: ConstructionKey; verdict: ConditionVerdict; note?: string; source?: string };
export type ProcessCondition = { process: ProcessKey; verdict: ConditionVerdict; note?: string; source?: string };

export type RoleCondition = {
  roles: UserRoleKey[];
  training: TrainingKey[];
  supervisionRequired: boolean;
};

export type RequiredTest = {
  testKey: "hidden_area" | "colour_transfer" | "water_sensitivity" | "product_compatibility" | "surface_finish";
  methodSource: string;          // approved method or manufacturer document — never invented
  approved: boolean;
};

/** Rinsing / flushing / neutralization requirement (Step 8 §13). */
export type RinseRequirement = {
  required: "required" | "not_required" | "insufficient_information";
  method?: string;
  medium?: string;
  quantity?: string;
  temperature?: string;
  duration?: string;
  equipment?: string;
  processDestination?: string;
  inspectionRequired: boolean;
  sourceDocumentKey?: string;
  documentVersion?: string;
  country?: string;
  reviewer?: string;
  /** Shown when exact information is unavailable. */
  fallbackText: string;
};

export const UNKNOWN_RINSE: RinseRequirement = {
  required: "insufficient_information",
  inspectionRequired: true,
  fallbackText: FOLLOW_LABEL,
};

/** Verified dose / contact-time record (Step 8 §14). Every value needs provenance. */
export type VerifiedQuantity = {
  quantity?: string;
  unit?: string;
  dilution?: string;
  contactTime?: string;
  temperature?: string;
  reapplicationLimit?: string;
  maximumAttempts?: string;
  source?: string;
  documentVersion?: string;
  country?: string;
  applicableProcess?: ProcessKey;
  applicableMaterial?: TextileKey;
  reviewer?: string;
  approvalStatus: "draft" | "approved";
};

export const REPETITION_RULES = [
  "repeat_permitted", "repeat_permitted_after_inspection", "maximum_attempts",
  "repeat_not_permitted", "follow_label_tds", "insufficient_information",
] as const;
export type RepetitionRule = (typeof REPETITION_RULES)[number];

export const REPETITION_LABEL: Record<RepetitionRule, string> = {
  repeat_permitted: "Repeat permitted",
  repeat_permitted_after_inspection: "Repeat permitted after inspection",
  maximum_attempts: "Maximum documented attempts",
  repeat_not_permitted: "Repeat not permitted",
  follow_label_tds: FOLLOW_LABEL,
  insufficient_information: INSUFFICIENT_INFO,
};

/* ------------------------------------------------------------------ */
/* The mapping                                                         */
/* ------------------------------------------------------------------ */

export type MappingEvidence = {
  level: MappingEvidenceLevel;
  documentKey?: string;
  documentVersion?: string;
  description: string;
  reviewer?: string;
};

export type ProductStageMapping = {
  mappingId: string;             // SM-MAP-000001
  productKey: string;
  productVersionKey: string;     // mandatory — mappings never transfer between versions
  companyKey: string;
  kitKey?: string;

  stageNumber: number;
  specificity: MappingSpecificity;
  stainKey?: string;
  categoryKey?: PrimaryCategoryKey;
  componentKey?: ComponentKey;
  sourceType?: SourceTypeKey;

  country: string;               // mandatory
  role: RoleCondition;

  fabricConditions: FabricCondition[];
  colourConditions: ColourCondition[];
  constructionConditions: ConstructionCondition[];
  processConditions: ProcessCondition[];

  requiredEquipment: string[];
  requiredPpe: PpeKey[];
  ventilationRequired: "required" | "not_required" | "insufficient_information";
  requiredTests: RequiredTest[];

  requiredPriorStage?: number;
  prohibitedPriorChemistry: string[];
  requiredFollowingStage?: number;
  rinse: RinseRequirement;
  quantities?: VerifiedQuantity;
  repetition: RepetitionRule;
  stopConditions: string[];

  manufacturerClaim?: string;
  verifiedUse: boolean;
  decision: MappingDecision;
  notRecommendedReason?: string;
  evidence: MappingEvidence[];
  evidenceLevel: MappingEvidenceLevel;
  sourceDocumentKeys: string[];
  reviewer?: string;
  status: MappingStatus;
  effectiveDate?: string;
  reviewDate?: string;
  version: number;
  supersedesMappingId?: string;
  provisional: boolean;
  notes?: string;
  flags: string[];
};

const mappingId = (n: number) => `SM-MAP-${String(n).padStart(6, "0")}`;
export const formatMappingId = mappingId;

/* ------------------------------------------------------------------ */
/* Product transitions (Step 8 §11)                                    */
/* ------------------------------------------------------------------ */

export const TRANSITION_PERMISSIONS = [
  "permitted", "prohibited", "permitted_after_verified_flushing", "insufficient_information",
] as const;
export type TransitionPermission = (typeof TRANSITION_PERMISSIONS)[number];

export const TRANSITION_LABEL: Record<TransitionPermission, string> = {
  permitted: "Permitted",
  prohibited: "Prohibited",
  permitted_after_verified_flushing: "Permitted only after verified flushing",
  insufficient_information: INSUFFICIENT_INFO,
};

export type ProductTransition = {
  transitionId: string;          // SM-TRN-000001
  fromProductKey?: string;
  fromChemistryFamily?: string;
  toProductKey?: string;
  toChemistryFamily?: string;
  permission: TransitionPermission;
  requiredRinse?: string;
  requiredNeutralization?: string;
  inspectionRequired: boolean;
  waitingRequirement?: string;   // only when documented
  source: string;
  fromProductVersionKey?: string;
  toProductVersionKey?: string;
  country: string;
  reviewer?: string;
  approvalStatus: MappingStatus;
  notes?: string;
};

const transitionId = (n: number) => `SM-TRN-${String(n).padStart(6, "0")}`;

/* ------------------------------------------------------------------ */
/* Previous chemistry families (Step 8 §12)                            */
/* ------------------------------------------------------------------ */

export const CHEMISTRY_FAMILIES = [
  "unknown_chemical", "bleach", "acid", "alkali", "ammonia", "alcohol", "solvent",
  "oxidizer", "reducer", "professional_spotting_agent", "unrinsed_residue", "detergent",
] as const;
export type ChemistryFamily = (typeof CHEMISTRY_FAMILIES)[number];

export const CHEMISTRY_FAMILY_LABEL: Record<ChemistryFamily, string> = {
  unknown_chemical: "Unknown chemical",
  bleach: "Bleach",
  acid: "Acid",
  alkali: "Alkali",
  ammonia: "Ammonia",
  alcohol: "Alcohol",
  solvent: "Solvent",
  oxidizer: "Oxidizer",
  reducer: "Reducer",
  professional_spotting_agent: "Professional spotting agent",
  unrinsed_residue: "Unrinsed residue",
  detergent: "Detergent",
};

/* ------------------------------------------------------------------ */
/* Provisional seed mappings                                           */
/* ------------------------------------------------------------------ */

const TODAY = "2026-08-17";

let seq = 0;

function provisionalMapping(
  productKey: string,
  stageNumber: number,
  claim: string,
  opts: Partial<ProductStageMapping> = {},
): ProductStageMapping {
  seq += 1;
  const product = PRODUCT_BY_KEY[productKey];
  return {
    mappingId: mappingId(seq),
    productKey,
    productVersionKey: product?.currentVersionKey ?? `${productKey}__v1__unspecified`,
    companyKey: product?.companyKey ?? "unknown",
    kitKey: opts.kitKey,
    stageNumber,
    specificity: "category",
    country: product?.countryFormulation ?? "unspecified",
    role: { roles: ["professional_spotter", "trainer"], training: ["trained_spotter_required"], supervisionRequired: true },
    fabricConditions: [],
    colourConditions: [],
    constructionConditions: [],
    processConditions: [],
    requiredEquipment: [],
    requiredPpe: [],
    ventilationRequired: "insufficient_information",
    requiredTests: [],
    prohibitedPriorChemistry: ["unknown_chemical"],
    rinse: { ...UNKNOWN_RINSE },
    repetition: "insufficient_information",
    stopConditions: [],
    manufacturerClaim: claim,
    verifiedUse: false,
    decision: "insufficient_information",
    evidence: [
      {
        level: "insufficient_information",
        description: "Provisional chart claim only. No current label, SDS, TDS or manufacturer instruction held.",
      },
    ],
    evidenceLevel: "insufficient_information",
    sourceDocumentKeys: [],
    status: "documentation_required",
    effectiveDate: TODAY,
    version: 1,
    provisional: true,
    flags: [
      "Claimed use only — not verified.",
      "Textile, colour, process, PPE and ventilation conditions are Insufficient Information.",
      "Not publishable and cannot drive actionable guidance.",
    ],
    ...opts,
  };
}

const SEITZ_STAGE_CLAIMS: { key: string; stage: number; claim: string }[] = [
  { key: "seitz_purasol", stage: 4, claim: "Chart association: oil / solvent-side or adhesive and paint-related assessment." },
  { key: "seitz_quickol", stage: 4, claim: "Chart association: oil / solvent-side and mixed wet/grease-related assessment." },
  { key: "seitz_lacol", stage: 10, claim: "Chart association: paint, resin and adhesive assessment." },
  { key: "seitz_frankosol", stage: 5, claim: "Chart association: wet-side assessment." },
  { key: "seitz_cavesol", stage: 7, claim: "Chart association: tannin assessment." },
  { key: "seitz_blutol", stage: 6, claim: "Chart association: protein assessment." },
  { key: "seitz_colorsol", stage: 9, claim: "Chart association: dye / ink or residual-colour assessment." },
];

const CLEAN_CRAFT_STAGE_CLAIMS: { key: string; stage: number; claim: string; extraFlags?: string[] }[] = [
  { key: "cc_food_1", stage: 5, claim: "Chart association: combination food or general wet-side assessment." },
  { key: "cc_food_2", stage: 7, claim: "Chart association: tannin / plant-colour assessment." },
  { key: "cc_colour_1", stage: 9, claim: "Chart association: dye-transfer or residual-colour assessment." },
  { key: "cc_colour_2", stage: 9, claim: "Chart association: dye-transfer or residual-colour assessment." },
  {
    key: "cc_fungus_go", stage: 12,
    claim: "Chart association unresolved: the supplied chart describes colour transfer, not fungal staining.",
    extraFlags: ["UNRESOLVED: source-description inconsistency between the product name and the chart description. Mapping cannot progress until the manufacturer clarifies the intended use."],
  },
  {
    key: "cc_organic", stage: 6,
    claim: "Chart association: biological / protein-related assessment, pending verification.",
    extraFlags: ["BLOCKED: the supplied chart instructs steam first. Steam on protein material may fix the stain. Publication is blocked until the manufacturer resolves the protein and heat conflict."],
  },
  { key: "cc_oil_1", stage: 4, claim: "Chart association: oil / solvent-side or cosmetic assessment." },
  { key: "cc_oil_2", stage: 4, claim: "Chart association: oil / solvent-side or cosmetic assessment." },
  { key: "cc_rust_go", stage: 11, claim: "Chart association: metal / rust assessment." },
];

const CLEAN_CRAFT_COMMON_FLAGS = [
  "Universal drop-count and contact-time claims on the chart are not accepted as verified values.",
  "Missing textile restrictions.",
  "Missing PPE and ventilation requirements.",
  "Missing incompatibilities.",
  "Missing current label, SDS and TDS.",
];

export const SEED_MAPPINGS: ProductStageMapping[] = [
  ...SEITZ_STAGE_CLAIMS.map((m) =>
    provisionalMapping(m.key, m.stage, m.claim, {
      kitKey: "seitz_seven_bottle",
      sourceDocumentKeys: ["doc_seitz_chart"],
      notes:
        "Stage association recorded for review only. Product-specific solvent-system restrictions, fabric and coating restrictions, dye restrictions, any Cavesol/Blutol prohibition and product-specific flushing requirements must each be recorded individually from official documents before review can continue.",
      flags: [
        "Claimed use only — not verified.",
        "Do not publish from the product name or the supplied chart.",
        "Solvent-system, fabric, coating and dye restrictions are not yet recorded.",
        "Product-specific flushing requirement is not yet recorded.",
      ],
    })),
  ...CLEAN_CRAFT_STAGE_CLAIMS.map((m) =>
    provisionalMapping(m.key, m.stage, m.claim, {
      kitKey: "clean_craft_nine_bottle",
      country: "IN",
      sourceDocumentKeys: ["doc_cleancraft_chart"],
      flags: [
        "Claimed use only — not verified.",
        "Chart-wide steam-first instruction is flagged for technical review.",
        ...CLEAN_CRAFT_COMMON_FLAGS,
        ...(m.extraFlags ?? []),
      ],
      status: m.extraFlags ? "under_technical_review" : "documentation_required",
    })),
];

/** STAS: brand and kit exist, but no product identities or documents are held yet. */
export const STAS_MAPPING_GAP = {
  companyKey: "stas",
  message:
    "STAS product identities and codes have not been extracted into the product database yet, so no STAS mapping can be created. The supplied STAS chart is a claim source only; textile compatibility, safety and process requirements remain Insufficient Information until current product documents are held.",
  blocking: true,
};

export const SEED_TRANSITIONS: ProductTransition[] = [
  {
    transitionId: transitionId(1),
    fromProductKey: "seitz_cavesol",
    toProductKey: "seitz_blutol",
    permission: "insufficient_information",
    inspectionRequired: true,
    source: "Supplied Seitz chart (issuer uncertain). A prohibition between these products is reported but not documented.",
    country: "unspecified",
    approvalStatus: "documentation_required",
    notes:
      "Do not treat these products as safe to follow one another. Intermixing is not assumed to be safe, and appearing in the same kit is not evidence of compatibility.",
  },
  {
    transitionId: transitionId(2),
    fromChemistryFamily: "unknown_chemical",
    toChemistryFamily: "professional_spotting_agent",
    permission: "prohibited",
    inspectionRequired: true,
    source: "Stain Master safety rule: an unknown previous chemical blocks further chemistry where compatibility cannot be established.",
    country: "all",
    approvalStatus: "published",
  },
  {
    transitionId: transitionId(3),
    fromChemistryFamily: "bleach",
    toChemistryFamily: "acid",
    permission: "prohibited",
    inspectionRequired: true,
    source: "General hazard control: acid after chlorine bleach may release hazardous gas.",
    country: "all",
    approvalStatus: "published",
  },
  {
    transitionId: transitionId(4),
    fromChemistryFamily: "bleach",
    toChemistryFamily: "ammonia",
    permission: "prohibited",
    inspectionRequired: true,
    source: "General hazard control: ammonia after chlorine bleach may release hazardous gas.",
    country: "all",
    approvalStatus: "published",
  },
  {
    transitionId: transitionId(5),
    fromChemistryFamily: "oxidizer",
    toChemistryFamily: "reducer",
    permission: "permitted_after_verified_flushing",
    requiredRinse: "As specified by the current product documents for both products.",
    inspectionRequired: true,
    source: "Stain Master safety rule: oxidizing and reducing chemistry must never meet on the garment.",
    country: "all",
    approvalStatus: "published",
  },
];

export const SEED_PRODUCT_KEYS = PRODUCTS.map((p) => p.key);
export const LAST_MAPPING_SEQ = SEED_MAPPINGS.length;
export const LAST_TRANSITION_SEQ = SEED_TRANSITIONS.length;
