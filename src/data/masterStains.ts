/**
 * STEP 6 — Master Stain Database.
 *
 * One authoritative master record per stain. Fabrics, colours, conditions,
 * treatment principles, products, countries and languages are CONNECTED to the
 * master record — they never duplicate it.
 *
 * Manufacturer independent: no Seitz / STAS / Clean Craft (or any brand)
 * product instructions are stored here.
 */

import type { IdCategoryKey } from "./stainKnowledge";
import type { ComponentKey, SourceTypeKey, ConditionTagKey, RiskTagKey } from "./taxonomy";

/* ------------------------------------------------------------------ */
/* Controlled vocabularies                                             */
/* ------------------------------------------------------------------ */

export type RecordStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "published"
  | "needs_review"
  | "suspended"
  | "archived";

export const RECORD_STATUS_LABEL: Record<RecordStatus, string> = {
  draft: "Draft",
  under_review: "Under Review",
  approved: "Approved",
  published: "Published",
  needs_review: "Needs Review",
  suspended: "Suspended",
  archived: "Archived",
};

export type EvidenceType =
  | "manufacturer_label"
  | "sds"
  | "tds"
  | "manufacturer_instruction"
  | "equipment_manual"
  | "textile_standard"
  | "textile_chemistry_reference"
  | "internal_trial"
  | "professional_observation"
  | "user_report";

/** Ordered strongest → weakest. Social media is deliberately absent. */
export const EVIDENCE_PRIORITY: EvidenceType[] = [
  "manufacturer_label",
  "sds",
  "tds",
  "manufacturer_instruction",
  "equipment_manual",
  "textile_standard",
  "textile_chemistry_reference",
  "internal_trial",
  "professional_observation",
  "user_report",
];

export const EVIDENCE_LABEL: Record<EvidenceType, string> = {
  manufacturer_label: "Current manufacturer label",
  sds: "Safety Data Sheet",
  tds: "Technical Data Sheet",
  manufacturer_instruction: "Manufacturer instruction",
  equipment_manual: "Equipment manual",
  textile_standard: "Recognized textile-testing standard",
  textile_chemistry_reference: "Credible textile-chemistry reference",
  internal_trial: "Verified internal trial",
  professional_observation: "Professional observation",
  user_report: "User report",
};

export type AudienceRole =
  | "public"
  | "domestic_user"
  | "laundry_employee"
  | "dry_cleaner"
  | "professional_spotter"
  | "trainer"
  | "learner"
  | "technical_reviewer"
  | "content_admin";

export const PROFESSIONAL_ROLES: AudienceRole[] = [
  "dry_cleaner",
  "professional_spotter",
  "trainer",
  "technical_reviewer",
  "content_admin",
];

export type AliasType =
  | "common_name"
  | "local_name"
  | "regional_name"
  | "technical_name"
  | "brand_used_as_source_term"
  | "misspelling"
  | "transliteration"
  | "historical_name";

export type RelationKind =
  | "similar_appearance"
  | "similar_source"
  | "shared_components"
  | "commonly_confused"
  | "possible_progression"
  | "variant"
  | "not_equivalent";

export const RELATION_LABEL: Record<RelationKind, string> = {
  similar_appearance: "Similar appearance",
  similar_source: "Similar source",
  shared_components: "Shared components",
  commonly_confused: "Commonly confused",
  possible_progression: "Possible progression",
  variant: "Variant",
  not_equivalent: "Not equivalent",
};

export type FabricKey =
  | "cotton" | "linen" | "wool" | "silk" | "viscose" | "polyester" | "nylon"
  | "acrylic" | "acetate" | "triacetate" | "elastane" | "blend" | "leather"
  | "suede" | "fur" | "coated" | "waterproof" | "unknown_material";

export const FABRIC_LABEL: Record<FabricKey, string> = {
  cotton: "Cotton", linen: "Linen", wool: "Wool", silk: "Silk",
  viscose: "Viscose / rayon", polyester: "Polyester", nylon: "Nylon / polyamide",
  acrylic: "Acrylic", acetate: "Acetate", triacetate: "Triacetate",
  elastane: "Elastane", blend: "Blends", leather: "Leather", suede: "Suede",
  fur: "Fur", coated: "Coated fabrics", waterproof: "Waterproof fabrics",
  unknown_material: "Unknown material",
};

export type ComponentPartKey =
  | "prints" | "embroidery" | "beads" | "sequins" | "metallic_thread"
  | "adhesives" | "coatings" | "laminations" | "interlinings" | "elastic"
  | "leather_trims";

export const COMPONENT_PART_LABEL: Record<ComponentPartKey, string> = {
  prints: "Prints", embroidery: "Embroidery", beads: "Beads", sequins: "Sequins",
  metallic_thread: "Metallic thread", adhesives: "Adhesives", coatings: "Coatings",
  laminations: "Laminations", interlinings: "Interlinings", elastic: "Elastic",
  leather_trims: "Leather or suede trims",
};

export type ColourKey =
  | "white" | "light" | "dark" | "bright" | "multicoloured" | "printed"
  | "garment_dyed" | "metallic" | "unknown_stability";

export const COLOUR_LABEL: Record<ColourKey, string> = {
  white: "White", light: "Light coloured", dark: "Dark coloured",
  bright: "Bright coloured", multicoloured: "Multicoloured", printed: "Printed",
  garment_dyed: "Garment-dyed", metallic: "Metallic or foil-finished",
  unknown_stability: "Unknown colour stability",
};

export type ConditionKey =
  | "fresh" | "wet" | "dried" | "aged" | "heat_exposed" | "heat_set_possible"
  | "washed" | "dry_cleaned" | "previously_spotted" | "repeatedly_treated"
  | "hardened" | "cured" | "spread" | "ringed" | "penetrated_lining"
  | "crossing_colours";

export const CONDITION_LABEL: Record<ConditionKey, string> = {
  fresh: "Fresh", wet: "Wet", dried: "Dried", aged: "Aged",
  heat_exposed: "Heat-exposed", heat_set_possible: "Heat-set possible",
  washed: "Washed", dry_cleaned: "Dry-cleaned",
  previously_spotted: "Previously spotted", repeatedly_treated: "Repeatedly treated",
  hardened: "Hardened", cured: "Cured", spread: "Spread", ringed: "Ringed",
  penetrated_lining: "Penetrated into lining", crossing_colours: "Crossing multiple colours",
};

export type ProhibitionType =
  | "heat" | "aggressive_rubbing" | "unverified_mixture" | "chlorine_bleach"
  | "oxidizer" | "reducer" | "strong_acid" | "strong_alkali" | "solvent"
  | "water" | "steam" | "machine_drying" | "ironing" | "repeated_treatment"
  | "mechanical_scraping" | "unknown_fibre" | "unstable_dye";

export const PROHIBITION_LABEL: Record<ProhibitionType, string> = {
  heat: "Heat", aggressive_rubbing: "Aggressive rubbing",
  unverified_mixture: "Unverified chemical mixture", chlorine_bleach: "Chlorine bleach",
  oxidizer: "Oxidizer", reducer: "Reducer", strong_acid: "Strong acid",
  strong_alkali: "Strong alkali", solvent: "Solvent", water: "Water", steam: "Steam",
  machine_drying: "Machine drying", ironing: "Ironing",
  repeated_treatment: "Repeated treatment", mechanical_scraping: "Mechanical scraping",
  unknown_fibre: "Treatment on unknown fibre", unstable_dye: "Treatment on unstable dye",
};

export type OutcomeClass =
  | "likely_removable" | "likely_reducible" | "uncertain"
  | "permanent_damage_possible" | "pigment_may_remain" | "professional_assessment_required";

export const OUTCOME_LABEL: Record<OutcomeClass, string> = {
  likely_removable: "Likely removable",
  likely_reducible: "Likely reducible",
  uncertain: "Uncertain",
  permanent_damage_possible: "Permanent damage possible",
  pigment_may_remain: "Pigment may remain",
  professional_assessment_required: "Professional assessment required",
};

export type TreatmentStageKey =
  | "excess_removal" | "water_side" | "oil_solvent_side" | "protein_stage"
  | "tannin_stage" | "pigment_particulate" | "dye_ink_stage" | "paint_resin_adhesive"
  | "metal_rust" | "oxidation" | "reduction" | "biological" | "rinsing"
  | "neutralization" | "final_inspection" | "drying_assessment";

export const STAGE_LABEL: Record<TreatmentStageKey, string> = {
  excess_removal: "Controlled removal of excess material",
  water_side: "Water-side assessment",
  oil_solvent_side: "Oil / solvent-side assessment",
  protein_stage: "Protein-stage assessment",
  tannin_stage: "Tannin-stage assessment",
  pigment_particulate: "Pigment / particulate removal",
  dye_ink_stage: "Dye / ink-stage assessment",
  paint_resin_adhesive: "Paint / resin / adhesive assessment",
  metal_rust: "Metal / rust assessment",
  oxidation: "Oxidation assessment",
  reduction: "Reduction assessment",
  biological: "Biological contamination assessment",
  rinsing: "Rinsing",
  neutralization: "Neutralization",
  final_inspection: "Final inspection",
  drying_assessment: "Drying assessment",
};

export type DomesticStatus =
  | "no_domestic_treatment"
  | "candidate_under_review"
  | "approved_domestic_treatment"
  | "country_specific"
  | "suspended"
  | "insufficient_information";

export const DOMESTIC_STATUS_LABEL: Record<DomesticStatus, string> = {
  no_domestic_treatment: "Domestic treatment is not recommended.",
  candidate_under_review: "Domestic treatment is not recommended.",
  approved_domestic_treatment: "Approved domestic treatment available",
  country_specific: "Country-specific domestic treatment available",
  suspended: "Domestic treatment is not recommended.",
  insufficient_information: "Domestic treatment is not recommended.",
};

export const DOMESTIC_NOT_RECOMMENDED = "Domestic treatment is not recommended.";
export const MIN_DOMESTIC_CONFIDENCE = 9;
export const INSUFFICIENT_INFORMATION = "Insufficient Information";
export const UNDER_REVIEW = "Under Review";

export type ReviewTrigger =
  | "product_formulation_changed" | "label_changed" | "sds_changed" | "tds_changed"
  | "manufacturer_instruction_changed" | "new_fabric_restriction" | "repeated_failures"
  | "repeated_damage_reports" | "better_evidence" | "translation_outdated"
  | "review_date_expired" | "treatment_suspended";

export const REVIEW_TRIGGER_LABEL: Record<ReviewTrigger, string> = {
  product_formulation_changed: "Connected product formulation changed",
  label_changed: "Connected label changed",
  sds_changed: "SDS changed",
  tds_changed: "TDS changed",
  manufacturer_instruction_changed: "Manufacturer instructions changed",
  new_fabric_restriction: "New fabric restriction identified",
  repeated_failures: "Repeated treatment failures documented",
  repeated_damage_reports: "Repeated damage reports",
  better_evidence: "Better evidence became available",
  translation_outdated: "Translation is outdated",
  review_date_expired: "Review date expired",
  treatment_suspended: "Connected treatment suspended",
};

/* ------------------------------------------------------------------ */
/* Structured section types                                            */
/* ------------------------------------------------------------------ */

export type EvidenceRef = {
  id: string;
  type: EvidenceType;
  source: string;
  version?: string;
  date?: string;
  country?: string;
  /** Section of the master record this evidence supports. */
  section: string;
  /** Claim-level traceability. */
  claim: string;
  reviewer?: string;
  verification: "unverified" | "pending_review" | "verified" | "insufficient_information" | "disputed";
};

export type Alias = {
  alias: string;
  type: AliasType;
  language: string;
  country?: string;
  script?: string;
  transliteration?: string;
  searchPriority: number;
  approval: "draft" | "approved";
  source?: string;
  reviewer?: string;
  /** Brand terms must not imply a formulation. */
  requiresLabelCheck?: boolean;
};

export type CommonSource = {
  name: string;
  sourceType: SourceTypeKey;
  context: string;
  countries: string[];
  formulationVariable: boolean;
  likelihood: "high" | "moderate" | "low";
  evidence: EvidenceType;
  notes?: string;
};

export type StainScience = {
  composition: string;
  solubility: string;
  bonding: string;
  heat: string;
  ageing: string;
  oxidation?: string;
  reduction?: string;
  acidity?: string;
  alkalinity?: string;
  mechanical?: string;
  water?: string;
  drySolvent?: string;
  whyPrincipleMayWork?: string;
  uncertainty: string;
};

export type IdentificationGuidance = {
  appearance: string;
  texture: string;
  locations: string[];
  odour?: string;
  fresh: string;
  aged: string;
  similarLooking: string[];
  distinguishingQuestions: string[];
  photoLimitations: string;
  inspectionMethod: string;
  /** 0–9; visual appearance never confirms chemistry. */
  confidenceCeiling: number;
  hazardIndicators?: string[];
  damageVsStain?: string;
  labOnly?: boolean;
};

export type FabricRule = {
  fabric: FabricKey | ComponentPartKey;
  isComponentPart?: boolean;
  mainRisk: string;
  why: string;
  testRequired: boolean;
  firstResponseBoundary: string;
  prohibitedPrinciples: TreatmentStageKey[];
  referralCondition?: string;
  confidence: number;
  evidence: EvidenceType;
  reviewer?: string;
};

export type ColourRule = {
  colour: ColourKey;
  mainRisk: string;
  colourfastnessTest: boolean;
  dyeTransferRisk: "low" | "moderate" | "high";
  oxidationRestricted: boolean;
  reductionRestricted: boolean;
  heatRestricted: boolean;
  referral?: string;
  evidence: EvidenceType;
};

export type ConditionEffect = {
  condition: ConditionKey;
  difficulty: "unchanged" | "harder" | "much_harder" | "easier";
  addedDamageRisk: string;
  assessmentRequired: string;
  outcomeAdjustment: OutcomeClass;
  escalation?: string;
};

export type FirstResponse = {
  id: string;
  roles: AudienceRole[];
  eligibleFabricConditions: string;
  eligibleStainConditions: string;
  action: string;
  purpose: string;
  prohibitedCircumstances: string[];
  maxDelayBeforeAssessment?: string;
  heatWarning: string;
  escalationTrigger: string;
  evidence: EvidenceType;
  approval: "draft" | "under_review" | "approved";
};

export type StageLink = {
  stage: TreatmentStageKey;
  order: number;
  preconditions: string[];
  prohibitedConditions: string[];
  inspectionPoint: string;
  stopCondition: string;
  evidence: EvidenceType;
  approval: "draft" | "under_review" | "approved";
};

export type Prohibition = {
  type: ProhibitionType;
  condition: string;
  roles: AudienceRole[];
  reason: string;
  severity: "advisory" | "important" | "critical";
  evidence: EvidenceType;
  reviewer?: string;
};

export type ExpectedOutcome = {
  fabric?: FabricKey;
  colour?: ColourKey;
  age?: "fresh" | "aged" | "any";
  previouslyTreated?: boolean;
  heatExposed?: boolean;
  damaged?: boolean;
  outcome: OutcomeClass;
  foreignMaterial: string;
  remainingPigment: string;
  dyeLoss: string;
  fibreDamage: string;
  finishDamage: string;
  odourHygiene?: string;
};

export type FailureEscalation = {
  whyTreatmentMayFail: string[];
  residueIndicators: string[];
  dyeLossIndicators: string[];
  fibreDamageIndicators: string[];
  finishDamageIndicators: string[];
  furtherAttemptSafe: "no" | "conditional" | "assessment_required";
  maxAttemptPolicy: string;
  mandatoryStop: string[];
  escalationPoint: string;
  nextAssessment: string;
  evidence: EvidenceType;
};

export type FaqItem = {
  question: string;
  answer: string;
  audience: AudienceRole;
  language: string;
  country?: string;
  evidence: EvidenceType;
  approval: "draft" | "under_review" | "approved";
  order: number;
};

export type PublicContent = {
  pageTitle: string;
  shortAnswer: string;
  beforeYouStart: string;
  whyDifficult: string;
  materialsCautious: string[];
  materialsProfessional: string[];
  professionalSummary: string;
  commonMistakes: string[];
  faqs: FaqItem[];
  disclaimer: string;
};

export type TechnicalContent = {
  detailedScience: string;
  classificationEvidence: string;
  requiredTests: string[];
  referralOptions: string[];
  failureAnalysis: string;
  reviewerNotes: string;
  /** Product mapping is intentionally empty until Step 7. */
  productMappingPlaceholder: string;
};

export type Governance = {
  contentOwner: string;
  technicalReviewer?: string;
  sourceDocuments: string[];
  countries: string[];
  languages: string[];
  created: string;
  lastReviewed?: string;
  nextReview?: string;
  status: RecordStatus;
  published: boolean;
  contentVersion: number;
  revisionReason?: string;
};

export type Revision = {
  version: number;
  date: string;
  by: string;
  reason: string;
  status: RecordStatus;
  sections?: string[];
};

export type Localization = {
  language: string;
  country?: string;
  displayName: string;
  shortDescription?: string;
  translationStatus: "not_started" | "machine_draft" | "human_draft" | "reviewed";
  translator?: string;
  technicalReviewOfTranslation?: string;
  /** Links the translation to the source content version. */
  sourceVersion: number;
  units?: "metric" | "imperial";
  script?: string;
};

export type MasterStain = {
  uuid: string;
  /** Stable human-readable ID: SM-STN-000001. Never reused. */
  stainId: string;
  key: string;
  canonicalName: string;
  displaySingular: string;
  displayPlural?: string;
  technicalName?: string;
  shortDescription: string;
  icon: string;
  aliases: Alias[];
  searchKeywords: string[];
  /** Variants point at a canonical parent; canonical records have no parent. */
  canonicalOf?: string;
  variantNotes?: string;
  addedComponents?: ComponentKey[];

  /** Layer A–D classification links (Step 5 taxonomy — never free text). */
  primaryCategory: IdCategoryKey;
  classificationConfidence: number;
  classificationExplanation: string;
  secondaryComponents: { component: ComponentKey; relevance: "primary" | "major" | "minor" | "possible"; confidence: number }[];
  componentConfidence: number;
  sourceTypes: SourceTypeKey[];
  conditionTags: ConditionTagKey[];
  riskTags: RiskTagKey[];
  classificationEvidence: EvidenceType;
  classificationReviewer?: string;
  classificationVersion: number;
  /** Damage diagnosis records are NOT ordinary removable stains. */
  isDamageDiagnosis?: boolean;
  damageInterpretation?: string;

  commonSources: CommonSource[];
  science: StainScience;
  sciencePlain: string;
  identification: IdentificationGuidance;
  relations: { toKey: string; kind: RelationKind; explanation: string; evidence: EvidenceType; reviewer?: string; directional?: boolean }[];
  fabricRules: FabricRule[];
  colourRules: ColourRule[];
  conditionEffects: ConditionEffect[];
  firstResponses: FirstResponse[];
  stageLinks: StageLink[];
  prohibitions: Prohibition[];
  expectedOutcomes: ExpectedOutcome[];
  failure: FailureEscalation;

  domesticStatus: DomesticStatus;
  domesticConfidence: number;
  productMappings: { placeholder: true; status: typeof UNDER_REVIEW }[];

  publicContent: PublicContent;
  technicalContent: TechnicalContent;
  evidence: EvidenceRef[];
  governance: Governance;
  revisions: Revision[];
  localizations: Localization[];
};

/* ------------------------------------------------------------------ */
/* Seed builder — sensible, safety-first defaults                      */
/* ------------------------------------------------------------------ */

const TODAY = "2026-01-15";
const NEXT_REVIEW = "2027-01-15";

let seq = 0;
export const formatStainId = (n: number) => `SM-STN-${String(n).padStart(6, "0")}`;

type SeedInput = {
  key: string;
  name: string;
  plural?: string;
  technicalName?: string;
  icon?: string;
  alt?: string[];
  local?: string[];
  misspellings?: string[];
  keywords?: string[];
  canonicalOf?: string;
  variantNotes?: string;
  addedComponents?: ComponentKey[];
  category: IdCategoryKey;
  confidence?: number;
  why: string;
  components?: { component: ComponentKey; relevance: "primary" | "major" | "minor" | "possible"; confidence: number }[];
  sources: SourceTypeKey[];
  sourceRecords?: Partial<CommonSource>[];
  riskTags?: RiskTagKey[];
  conditionTags?: ConditionTagKey[];
  short: string;
  plain: string;
  science: Partial<StainScience> & { composition: string; solubility: string; bonding: string; heat: string; ageing: string };
  identification: Partial<IdentificationGuidance> & { appearance: string; texture: string };
  relations?: MasterStain["relations"];
  fabrics?: Partial<FabricRule>[];
  colours?: Partial<ColourRule>[];
  prohibitions?: Partial<Prohibition>[];
  stages?: TreatmentStageKey[];
  outcome?: OutcomeClass;
  outcomeNotes?: Partial<ExpectedOutcome>;
  heatWarning?: string;
  firstResponse?: Partial<FirstResponse>;
  damage?: boolean;
  damageInterpretation?: string;
  status?: RecordStatus;
  reviewer?: string;
  hindi?: string;
  faqs?: { q: string; a: string }[];
  labOnly?: boolean;
};

const DEFAULT_FABRICS: FabricKey[] = ["cotton", "silk", "wool", "acetate", "unknown_material"];

const defaultFabricRule = (f: FabricKey, category: IdCategoryKey): FabricRule => {
  const delicate = ["silk", "wool", "acetate", "triacetate", "viscose", "leather", "suede", "fur", "coated", "waterproof"].includes(f);
  return {
    fabric: f,
    mainRisk: delicate
      ? "Fibre, dye or finish damage before the stain responds"
      : "Colour change or a treated ring if the area is over-worked",
    why: delicate
      ? "This material has limited tolerance to moisture, mechanical action, temperature or solvent exposure."
      : "The fibre is comparatively tolerant, but dye and finish behaviour still vary by garment.",
    testRequired: delicate || f === "unknown_material",
    firstResponseBoundary: delicate
      ? "Blotting and heat avoidance only; no wetting out until a professional assessment is done."
      : "Mild, reversible first response only; stop if colour appears on the cloth.",
    prohibitedPrinciples: delicate
      ? (["oxidation", "reduction", "water_side"] as TreatmentStageKey[])
      : [],
    referralCondition: f === "unknown_material" ? "Refer whenever the fibre cannot be confirmed." : delicate ? "Refer when the stain is aged, heat-set or covers a dyed area." : undefined,
    confidence: delicate ? 7 : 8,
    evidence: "textile_chemistry_reference",
    reviewer: "Technical review pending",
  };
};

const defaultColourRule = (c: ColourKey): ColourRule => ({
  colour: c,
  mainRisk:
    c === "white"
      ? "Optical brightener loss and fibre damage — a white textile is not automatically bleach-safe."
      : "Dye loss, dye bleeding or a lightened halo around the treated area.",
  colourfastnessTest: c !== "white",
  dyeTransferRisk: c === "dark" || c === "bright" || c === "garment_dyed" ? "high" : c === "multicoloured" || c === "printed" ? "moderate" : "low",
  oxidationRestricted: c !== "white",
  reductionRestricted: c !== "white",
  heatRestricted: true,
  referral: c === "unknown_stability" ? "Refer until colour stability is confirmed." : undefined,
  evidence: "textile_standard",
});

const DEFAULT_CONDITIONS: ConditionKey[] = [
  "fresh", "dried", "aged", "heat_exposed", "heat_set_possible", "washed",
  "previously_spotted", "repeatedly_treated", "ringed", "crossing_colours",
];

const defaultConditionEffect = (c: ConditionKey, outcome: OutcomeClass): ConditionEffect => {
  const map: Record<string, Partial<ConditionEffect>> = {
    fresh: { difficulty: "unchanged", addedDamageRisk: "Low if handled gently.", outcomeAdjustment: outcome },
    dried: { difficulty: "harder", addedDamageRisk: "Mechanical action becomes more tempting and more damaging." },
    aged: { difficulty: "much_harder", addedDamageRisk: "Ageing can bond the residue to the fibre.", outcomeAdjustment: "uncertain" },
    heat_exposed: { difficulty: "much_harder", addedDamageRisk: "Heat can fix residue and change fibre or dye behaviour.", outcomeAdjustment: "pigment_may_remain" },
    heat_set_possible: { difficulty: "much_harder", addedDamageRisk: "A heat-set mark may be permanent.", outcomeAdjustment: "permanent_damage_possible", escalation: "Professional assessment before any further attempt." },
    washed: { difficulty: "harder", addedDamageRisk: "Washing may already have set part of the mark.", outcomeAdjustment: "uncertain" },
    previously_spotted: { difficulty: "harder", addedDamageRisk: "Unknown residual chemistry may react.", assessmentRequired: "Identify what was previously applied before anything else.", outcomeAdjustment: "professional_assessment_required", escalation: "Stop if the previous product cannot be identified." },
    repeatedly_treated: { difficulty: "much_harder", addedDamageRisk: "Cumulative dye and fibre stress.", outcomeAdjustment: "permanent_damage_possible", escalation: "Stop; do not escalate chemistry." },
    ringed: { difficulty: "harder", addedDamageRisk: "The ring itself may become the visible defect." },
    crossing_colours: { difficulty: "much_harder", addedDamageRisk: "Dye migration between colours.", outcomeAdjustment: "professional_assessment_required", escalation: "Professional assessment required." },
  };
  return {
    condition: c,
    difficulty: "harder",
    addedDamageRisk: "Increased risk of dye or fibre damage.",
    assessmentRequired: "Re-assess fabric, colour and previous treatment before proceeding.",
    outcomeAdjustment: outcome,
    ...map[c],
  } as ConditionEffect;
};

const M = (s: SeedInput): MasterStain => {
  seq += 1;
  const outcome: OutcomeClass = s.outcome ?? (s.damage ? "permanent_damage_possible" : "uncertain");
  const aliases: Alias[] = [
    ...(s.alt ?? []).map((a, i) => ({ alias: a, type: "common_name" as AliasType, language: "en", searchPriority: 8 - i, approval: "approved" as const })),
    ...(s.local ?? []).map((a, i) => ({ alias: a, type: "local_name" as AliasType, language: "hi", country: "IN", script: "Latin", transliteration: a, searchPriority: 9 - i, approval: "approved" as const })),
    ...(s.misspellings ?? []).map((a) => ({ alias: a, type: "misspelling" as AliasType, language: "en", searchPriority: 3, approval: "approved" as const })),
  ];
  const fabricRules: FabricRule[] = [
    ...DEFAULT_FABRICS.map((f) => defaultFabricRule(f, s.category)),
    ...(s.fabrics ?? []).map((f) => ({ ...defaultFabricRule((f.fabric as FabricKey) ?? "cotton", s.category), ...f })) as FabricRule[],
  ].filter((r, i, arr) => arr.findIndex((x) => x.fabric === r.fabric) === i);

  const colourRules: ColourRule[] = (["white", "light", "dark", "bright", "multicoloured", "printed", "garment_dyed", "metallic", "unknown_stability"] as ColourKey[])
    .map((c) => ({ ...defaultColourRule(c), ...((s.colours ?? []).find((x) => x.colour === c) ?? {}) }));

  const prohibitions: Prohibition[] = [
    {
      type: "heat",
      condition: "Before the stain has been assessed and while any residue remains",
      roles: ["public", "domestic_user", "laundry_employee", "learner"],
      reason: s.heatWarning ?? "Heat can set the residue and make the mark permanent.",
      severity: "critical",
      evidence: "textile_chemistry_reference",
    },
    {
      type: "unverified_mixture",
      condition: "Always",
      roles: ["public", "domestic_user", "laundry_employee", "learner", "dry_cleaner"],
      reason: "Mixing unverified chemicals can cause fibre damage, dye loss or a hazardous reaction.",
      severity: "critical",
      evidence: "sds",
    },
    {
      type: "aggressive_rubbing",
      condition: "On any dyed, delicate, printed or coated area",
      roles: ["public", "domestic_user", "laundry_employee", "learner"],
      reason: "Rubbing spreads the stain and abrades fibre and dye.",
      severity: "important",
      evidence: "textile_standard",
    },
    ...((s.prohibitions ?? []).map((p) => ({
      type: "heat" as ProhibitionType,
      condition: "Conditional",
      roles: ["public", "domestic_user"] as AudienceRole[],
      reason: "See condition.",
      severity: "important" as const,
      evidence: "textile_chemistry_reference" as EvidenceType,
      ...p,
    }))),
  ];

  const status: RecordStatus = s.status ?? "under_review";

  return {
    uuid: `msu-${s.key}`,
    stainId: formatStainId(seq),
    key: s.key,
    canonicalName: s.name,
    displaySingular: s.name,
    displayPlural: s.plural,
    technicalName: s.technicalName,
    shortDescription: s.short,
    icon: s.icon ?? "🧪",
    aliases,
    searchKeywords: [s.name, ...(s.alt ?? []), ...(s.local ?? []), ...(s.keywords ?? [])].map((k) => k.toLowerCase()),
    canonicalOf: s.canonicalOf,
    variantNotes: s.variantNotes,
    addedComponents: s.addedComponents,

    primaryCategory: s.category,
    classificationConfidence: s.confidence ?? 8,
    classificationExplanation: s.why,
    secondaryComponents: s.components ?? [],
    componentConfidence: s.components?.length ? 7 : 5,
    sourceTypes: s.sources,
    conditionTags: s.conditionTags ?? [],
    riskTags: s.riskTags ?? [],
    classificationEvidence: "textile_chemistry_reference",
    classificationReviewer: s.reviewer,
    classificationVersion: 1,
    isDamageDiagnosis: s.damage,
    damageInterpretation: s.damageInterpretation,

    commonSources: (s.sourceRecords ?? [{ name: s.name, context: "General use" }]).map((r) => ({
      name: r.name ?? s.name,
      sourceType: r.sourceType ?? s.sources[0],
      context: r.context ?? "General use",
      countries: r.countries ?? ["IN", "Global"],
      formulationVariable: r.formulationVariable ?? false,
      likelihood: r.likelihood ?? "high",
      evidence: r.evidence ?? "professional_observation",
      notes: r.notes,
    })),

    science: {
      uncertainty: "Composition is formulation dependent and may not be disclosed. Treat the listed composition as likely, not confirmed.",
      whyPrincipleMayWork: "Recorded as a principle only; no product, quantity or timing is defined at this step.",
      ...s.science,
    },
    sciencePlain: s.plain,

    identification: {
      locations: ["Front", "Cuff", "Collar", "Hem"],
      fresh: "Recently deposited and usually easier to assess.",
      aged: "Darker, harder or more diffuse; chemistry may have changed.",
      similarLooking: [],
      distinguishingQuestions: ["What was the garment exposed to?", "Has it been washed, ironed or previously treated?"],
      photoLimitations: "A photograph can suggest a likely stain type but never confirms chemistry.",
      inspectionMethod: "Inspect in good light, both sides of the fabric, and check the lining.",
      confidenceCeiling: 7,
      ...s.identification,
      labOnly: s.labOnly,
    },

    relations: s.relations ?? [],
    fabricRules,
    colourRules,
    conditionEffects: DEFAULT_CONDITIONS.map((c) => defaultConditionEffect(c, outcome)),

    firstResponses: [
      {
        id: `${s.key}-fr1`,
        roles: ["public", "domestic_user", "laundry_employee", "learner", "dry_cleaner", "professional_spotter", "trainer"],
        eligibleFabricConditions: "Any fabric with no existing damage in the stained area",
        eligibleStainConditions: "Fresh or dried; not previously treated with an unknown product",
        action:
          s.firstResponse?.action ??
          "Keep the garment away from heat and sunlight, remove any loose material carefully, and blot gently without rubbing. Photograph the mark and keep the product label if there is one.",
        purpose: "Prevent the mark from setting or spreading before a proper assessment.",
        prohibitedCircumstances: s.firstResponse?.prohibitedCircumstances ?? [
          "Do not apply water when the fabric or dye stability is unknown.",
          "Do not use any household chemical.",
          "Do not iron, tumble dry or steam.",
        ],
        maxDelayBeforeAssessment: "Seek professional assessment within 48 hours where possible.",
        heatWarning: s.heatWarning ?? "Heat can make this mark permanent.",
        escalationTrigger: "Any colour on the blotting cloth, any texture change, or an unknown fibre.",
        evidence: "professional_observation",
        approval: "approved",
        ...s.firstResponse,
      },
    ],

    stageLinks: (s.stages ?? ["excess_removal", "final_inspection"]).map((stage, i) => ({
      stage,
      order: i + 1,
      preconditions: ["Fibre identified", "Colour stability assessed", "Previous treatment history known"],
      prohibitedConditions: ["Unknown fibre", "Unstable dye", "Existing damage in the stain area"],
      inspectionPoint: "Inspect after each stage in good light before continuing.",
      stopCondition: "Stop on any dye movement, texture change or finish change.",
      evidence: "textile_chemistry_reference",
      approval: "under_review",
    })),

    prohibitions,

    expectedOutcomes: [
      {
        age: "fresh",
        outcome: s.damage ? "permanent_damage_possible" : outcome,
        foreignMaterial: s.damage ? "There is no foreign material to remove." : "Foreign material may be reduced or removed.",
        remainingPigment: s.damage ? "Not applicable." : "Some pigment may remain even after a correct process.",
        dyeLoss: "Dye loss is possible and is not reversible by further cleaning.",
        fibreDamage: "Fibre damage is possible where the fabric is delicate or already weakened.",
        finishDamage: "Coatings, prints and finishes may be affected.",
        odourHygiene: "Odour or hygiene outcomes are assessed separately from visual improvement.",
        ...s.outcomeNotes,
      },
      {
        age: "aged",
        heatExposed: true,
        outcome: s.damage ? "permanent_damage_possible" : "uncertain",
        foreignMaterial: "Reduction only; complete removal cannot be promised.",
        remainingPigment: "Residual pigment is likely.",
        dyeLoss: "Risk increases with age and previous treatment.",
        fibreDamage: "Higher risk on aged or repeatedly treated fabric.",
        finishDamage: "Finish change may already be present.",
      },
    ],

    failure: {
      whyTreatmentMayFail: [
        "The stain has more than one component and only one was addressed.",
        "Heat or ageing has bonded residue to the fibre.",
        "Earlier unknown treatment changed the chemistry.",
      ],
      residueIndicators: ["A shadow that reappears on drying", "A visible ring at the edge"],
      dyeLossIndicators: ["A lighter patch", "Colour on the blotting cloth"],
      fibreDamageIndicators: ["Roughness, thinning, pilling or a hole forming"],
      finishDamageIndicators: ["Loss of sheen, stiffness change or a dull patch"],
      furtherAttemptSafe: "assessment_required",
      maxAttemptPolicy: "Attempt limits are defined with the approved treatment records in a later step.",
      mandatoryStop: ["Any dye loss", "Any fibre or finish damage", "Unknown previous chemistry"],
      escalationPoint: "Escalate to a technical reviewer or specialist cleaner rather than increasing chemical strength.",
      nextAssessment: "Fibre confirmation, colourfastness assessment and damage inspection.",
      evidence: "professional_observation",
    },

    domesticStatus: "no_domestic_treatment",
    domesticConfidence: 0,
    productMappings: [],

    publicContent: {
      pageTitle: `${s.name} stain — what it is and what to do first`,
      shortAnswer: s.short,
      beforeYouStart: "Do not use heat and do not rub. If the fabric, colour or previous treatment is unknown, get a professional assessment.",
      whyDifficult: s.plain,
      materialsCautious: ["Cotton", "Linen", "Polyester"],
      materialsProfessional: ["Silk", "Wool", "Acetate", "Leather and suede", "Coated and waterproof fabrics", "Unknown material"],
      professionalSummary:
        "A professional cleaner identifies the fibre, checks colour stability and works through an assessed sequence of principles. Specialist procedures and products are not published here.",
      commonMistakes: ["Rubbing the mark", "Applying hot water", "Ironing or drying before the mark is gone", "Mixing household chemicals"],
      faqs: (s.faqs ?? [{ q: `Can ${s.name.toLowerCase()} be removed completely?`, a: "Not always. Improvement is realistic; complete removal cannot be promised." }]).map((f, i) => ({
        question: f.q,
        answer: f.a,
        audience: "public" as AudienceRole,
        language: "en",
        evidence: "professional_observation" as EvidenceType,
        approval: "approved" as const,
        order: i + 1,
      })),
      disclaimer:
        "This guidance is general information for assessment only. It is not a treatment instruction and does not replace a professional inspection of the actual garment.",
    },

    technicalContent: {
      detailedScience: `${s.science.composition}. ${s.science.bonding}.`,
      classificationEvidence: s.why,
      requiredTests: ["Fibre confirmation", "Colourfastness on a hidden area", "Finish and coating check"],
      referralOptions: ["Technical reviewer", "Specialist textile cleaner", "Textile testing laboratory"],
      failureAnalysis: "Record what was observed, not what was expected. Do not increase chemical strength after a failed attempt.",
      reviewerNotes: "Awaiting technical reviewer sign-off for this record.",
      productMappingPlaceholder: UNDER_REVIEW,
    },

    evidence: [
      {
        id: `${s.key}-ev-heat`,
        type: "textile_chemistry_reference",
        source: "Textile chemistry reference (internal library)",
        section: "science.heat",
        claim: s.science.heat,
        verification: "pending_review",
        date: TODAY,
      },
      {
        id: `${s.key}-ev-class`,
        type: "textile_chemistry_reference",
        source: "Step 5 universal classification taxonomy",
        section: "classification",
        claim: s.why,
        verification: "verified",
        date: TODAY,
      },
      {
        id: `${s.key}-ev-fabric`,
        type: "textile_standard",
        source: "Recognized textile-testing standard (care and colourfastness)",
        section: "fabricRules",
        claim: "Delicate materials require testing before any wet or solvent-side work.",
        verification: "verified",
        date: TODAY,
      },
    ],

    governance: {
      contentOwner: "Stain Master content team",
      technicalReviewer: s.reviewer,
      sourceDocuments: ["Internal textile-chemistry reference", "Recognized textile-testing standard"],
      countries: ["IN", "Global"],
      languages: ["en", "hi"],
      created: TODAY,
      lastReviewed: s.reviewer ? TODAY : undefined,
      nextReview: NEXT_REVIEW,
      status,
      published: status === "published",
      contentVersion: 1,
    },

    revisions: [
      { version: 1, date: TODAY, by: "Step 6 seed", reason: "Initial master record created", status },
    ],

    localizations: [
      { language: "en", displayName: s.name, shortDescription: s.short, translationStatus: "reviewed", sourceVersion: 1, units: "metric", script: "Latin" },
      {
        language: "hi",
        country: "IN",
        displayName: s.hindi ?? s.name,
        translationStatus: s.hindi ? "human_draft" : "not_started",
        sourceVersion: 1,
        units: "metric",
        script: "Devanagari",
      },
    ],
  };
};

/* ------------------------------------------------------------------ */
/* Seed records (Step 6 §35)                                           */
/* ------------------------------------------------------------------ */

export const MASTER_STAINS: MasterStain[] = [
  M({
    key: "blood", name: "Blood", icon: "🩸", alt: ["Dried blood", "Blood spot"], local: ["Khoon", "Rakt"],
    misspellings: ["blod", "bllod"], hindi: "खून",
    category: "protein", confidence: 9,
    why: "Protein is the dominant treatment-relevant material, with iron-based colour.",
    components: [{ component: "protein", relevance: "primary", confidence: 9 }, { component: "natural_dye", relevance: "minor", confidence: 5 }],
    sources: ["body_fluid"], riskTags: ["heat_warning"],
    short: "A protein mark from the body that darkens and sets quickly with heat.",
    plain: "Blood is mostly protein. Warm water or ironing cooks the protein into the fibre, which is why a fresh mark is far easier than a set one.",
    science: {
      composition: "Water, proteins and iron-containing haemoglobin",
      solubility: "Partly water-dispersible while fresh; not soluble once coagulated",
      bonding: "Coagulated protein grips the fibre surface and traps colour",
      heat: "Heat coagulates protein and can set the mark permanently",
      ageing: "Oxidises from red to brown and becomes much harder to improve",
      oxidation: "Aged blood darkens through oxidation",
      water: "Cold water only; warm water sets protein",
      mechanical: "Rubbing spreads and drives residue deeper",
    },
    identification: { appearance: "Red when fresh, brown to near-black when aged", texture: "Crusty or stiff when dry", similarLooking: ["Food colour", "Rust", "Red fruit juice"], distinguishingQuestions: ["Was there an injury or a nosebleed?", "Is the mark stiff to the touch?"], confidenceCeiling: 7 },
    relations: [{ toKey: "food_colour_ref", kind: "commonly_confused", explanation: "Red food colour can look identical to fresh blood but behaves as a dye.", evidence: "professional_observation" }],
    heatWarning: "Never use warm water, an iron or a dryer on a blood mark.",
    stages: ["excess_removal", "protein_stage", "water_side", "rinsing", "final_inspection"],
    outcome: "likely_reducible", reviewer: "Technical reviewer A", status: "published",
    faqs: [{ q: "Should I use hot water on blood?", a: "No. Warm or hot water sets the protein. Keep the garment cool and away from heat." }],
  }),
  M({
    key: "tea", name: "Tea", icon: "🍵", alt: ["Chai stain"], local: ["Chai"], misspellings: ["tae", "chay"], hindi: "चाय",
    category: "tannin_plant", confidence: 9,
    why: "Plant tannin dominates; milk and sugar add secondary components.",
    components: [{ component: "tannin", relevance: "primary", confidence: 9 }, { component: "sugar", relevance: "possible", confidence: 5 }, { component: "protein", relevance: "possible", confidence: 4 }],
    sources: ["beverage"], short: "A brown plant-tannin mark that darkens with age and heat.",
    plain: "Tea colour comes from plant tannins. They bind to fibres and become noticeably harder to shift once dried or ironed.",
    science: { composition: "Water, plant tannins, sometimes milk and sugar", solubility: "Partly water-dispersible while fresh", bonding: "Tannin binds to cellulose and protein fibres", heat: "Heat darkens and fixes tannin", ageing: "Turns yellow-brown and oxidises", oxidation: "Aged tannin marks respond differently and may need an oxidation assessment" },
    identification: { appearance: "Light to mid brown, often with a defined ring", texture: "Flat, may be slightly sticky if sugared", similarLooking: ["Coffee", "Aged yellow mark"], distinguishingQuestions: ["Was milk or sugar added?"] },
    stages: ["excess_removal", "tannin_stage", "water_side", "rinsing", "final_inspection"],
    outcome: "likely_reducible", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "coffee", name: "Coffee", icon: "☕", alt: ["Coffee spill"], local: ["Kaapi", "Coffee"], misspellings: ["cofee", "coffe"], hindi: "कॉफ़ी",
    category: "tannin_plant", confidence: 9,
    why: "Plant tannin is the dominant colour-bearing material.",
    components: [{ component: "tannin", relevance: "primary", confidence: 9 }],
    sources: ["beverage"], short: "A brown plant-tannin drink mark. Additions change how it behaves.",
    plain: "Plain coffee is mostly tannin colour. Milk, sugar or cream add protein, sugar and fat, which changes the assessment.",
    science: { composition: "Water, plant tannins and roasted solids", solubility: "Partly water-dispersible while fresh", bonding: "Tannin binds to the fibre; fine solids lodge between fibres", heat: "Heat fixes tannin colour", ageing: "Darkens and oxidises" },
    identification: { appearance: "Mid to dark brown with a ring", texture: "Flat when plain", similarLooking: ["Tea", "Gravy"], distinguishingQuestions: ["Was it black, or with milk, sugar or cream?"] },
    relations: [{ toKey: "coffee_black", kind: "variant", explanation: "Black coffee is a variant of the canonical coffee record.", evidence: "professional_observation" }],
    stages: ["excess_removal", "tannin_stage", "water_side", "rinsing", "final_inspection"],
    outcome: "likely_reducible", reviewer: "Technical reviewer A", status: "published",
    faqs: [{ q: "Is coffee with milk treated the same as black coffee?", a: "No. Milk adds protein and fat, so the assessment sequence changes." }],
  }),
  M({
    key: "coffee_black", name: "Black coffee", icon: "☕", alt: ["Coffee without milk"], canonicalOf: "coffee",
    variantNotes: "No added protein, fat or sugar. Tannin only.",
    category: "tannin_plant", confidence: 9, why: "Tannin only; no added components.",
    components: [{ component: "tannin", relevance: "primary", confidence: 9 }],
    sources: ["beverage"], short: "Coffee with no milk or sugar — a tannin-only mark.",
    plain: "Without milk or sugar this is a straightforward tannin mark, but it still fixes with heat.",
    science: { composition: "Water, plant tannins and roasted solids", solubility: "Partly water-dispersible while fresh", bonding: "Tannin binds to the fibre", heat: "Heat fixes the colour", ageing: "Darkens with age" },
    identification: { appearance: "Brown, even, with a ring", texture: "Flat and dry" },
    stages: ["tannin_stage", "water_side", "rinsing", "final_inspection"],
    outcome: "likely_reducible", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "coffee_milk", name: "Coffee with milk", icon: "☕", alt: ["Milk coffee", "Latte stain"], canonicalOf: "coffee",
    variantNotes: "Adds protein and fat to the canonical tannin chemistry.",
    addedComponents: ["protein", "oil"],
    category: "combination_unknown", confidence: 8,
    why: "Tannin plus milk protein and fat make this a combination rather than a single-category mark.",
    components: [{ component: "tannin", relevance: "primary", confidence: 9 }, { component: "protein", relevance: "major", confidence: 8 }, { component: "oil", relevance: "major", confidence: 7 }, { component: "sugar", relevance: "possible", confidence: 5 }],
    sources: ["beverage"], short: "Coffee with milk — tannin colour plus milk protein and fat.",
    plain: "The milk adds protein and fat, so heat is even more damaging and one single approach rarely clears the whole mark.",
    science: { composition: "Water, tannins, milk protein and milk fat", solubility: "Mixed: part water-dispersible, part not", bonding: "Protein coagulates and fat absorbs into the fibre", heat: "Heat coagulates the protein and sets the colour", ageing: "Fat oxidises and yellows" },
    identification: { appearance: "Pale to mid brown, sometimes with a greasy halo", texture: "Slightly stiff or greasy", similarLooking: ["Gravy", "Chocolate"] },
    stages: ["excess_removal", "protein_stage", "oil_solvent_side", "tannin_stage", "rinsing", "final_inspection"],
    outcome: "uncertain", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "turmeric", name: "Turmeric / Haldi", icon: "🟡", alt: ["Turmeric", "Haldi stain"], local: ["Haldi", "Halad", "Manjal", "Pasupu"],
    misspellings: ["haldee", "tumeric", "haldhi"], keywords: ["yellow", "curcumin"], hindi: "हल्दी",
    category: "dye_ink", confidence: 8,
    why: "Curcumin behaves as a natural dye that binds strongly to fibre, not as a simple pigment deposit.",
    components: [{ component: "natural_dye", relevance: "primary", confidence: 9 }, { component: "oil", relevance: "possible", confidence: 5 }],
    sources: ["food", "cooking"], riskTags: ["pigment_may_remain", "heat_warning"],
    short: "A strong yellow natural dye that binds fast and reacts to alkali.",
    plain: "Haldi is a dye, not just powder. It sinks into the fibre quickly and can turn red-brown if something alkaline touches it.",
    science: { composition: "Curcumin with plant solids, often carried in oil", solubility: "Poorly water-soluble", bonding: "Binds to fibre like a natural dye", heat: "Heat and sunlight both fix and alter the colour", ageing: "Fades unevenly and may leave a shadow", alkalinity: "Alkali turns curcumin red-brown", acidity: "Acid can restore the yellow tone but does not remove the dye", uncertainty: "Household mixtures often make the mark worse; composition varies with the dish." },
    identification: { appearance: "Bright yellow to orange, often diffuse", texture: "Flat, may be greasy if from a curry", similarLooking: ["Curry", "Mustard", "Aged yellow mark"], distinguishingQuestions: ["Was it dry powder or part of a cooked dish?"] },
    relations: [{ toKey: "curry", kind: "shared_components", explanation: "Curry usually contains turmeric plus oil and other pigments.", evidence: "professional_observation" }],
    heatWarning: "Heat and direct sunlight both fix turmeric colour.",
    stages: ["excess_removal", "oil_solvent_side", "dye_ink_stage", "oxidation", "final_inspection"],
    outcome: "pigment_may_remain", reviewer: "Technical reviewer A", status: "published",
    faqs: [{ q: "Why did my haldi mark turn red?", a: "Something alkaline touched it. That is a colour change in the dye, not a new stain." }],
  }),
  M({
    key: "curry", name: "Curry", icon: "🍛", alt: ["Gravy stain", "Masala stain"], local: ["Sabzi", "Salan", "Curry"], hindi: "करी",
    category: "combination_unknown", confidence: 8,
    why: "Curry combines oil, natural dye, protein and particulate; no single category describes it.",
    components: [{ component: "oil", relevance: "primary", confidence: 9 }, { component: "natural_dye", relevance: "major", confidence: 9 }, { component: "protein", relevance: "minor", confidence: 5 }, { component: "particulate", relevance: "minor", confidence: 6 }],
    sources: ["food", "cooking"], riskTags: ["pigment_may_remain"],
    short: "A combination mark: cooking oil carrying strong natural dye and solids.",
    plain: "Curry is several stains at once. The oil spreads, the turmeric dyes the fibre, and the solids sit on top.",
    science: { composition: "Cooking oil, spices, natural dyes and food solids", solubility: "Mixed; the oil side is not water-soluble", bonding: "Oil carries dye deep into the fibre", heat: "Heat sets both the oil and the dye", ageing: "Oil oxidises and yellows around the coloured mark" },
    identification: { appearance: "Yellow-orange to brown, often with a greasy halo", texture: "Greasy, sometimes with solids", similarLooking: ["Turmeric", "Gravy", "Chocolate"] },
    stages: ["excess_removal", "oil_solvent_side", "dye_ink_stage", "tannin_stage", "rinsing", "final_inspection"],
    outcome: "pigment_may_remain", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "cooking_oil", name: "Cooking oil", icon: "🫒", alt: ["Vegetable oil", "Frying oil"], local: ["Tel"], hindi: "तेल",
    category: "oil_grease", confidence: 9, why: "Fat is the dominant treatment-relevant material.",
    components: [{ component: "oil", relevance: "primary", confidence: 9 }],
    sources: ["cooking", "food"], short: "A translucent greasy mark that darkens the fabric.",
    plain: "Oil soaks into the fibre and spreads. It often looks invisible when wet and reappears as it dries.",
    science: { composition: "Triglyceride oils", solubility: "Not water-soluble", bonding: "Absorbs into fibre and spreads outwards", heat: "Heat drives oil deeper", ageing: "Oxidises and yellows, becoming much harder to improve", water: "Water alone does not lift oil" },
    identification: { appearance: "Darker, translucent patch", texture: "Greasy or slippery", similarLooking: ["Wet mark", "Machine oil"], distinguishingQuestions: ["Does the mark feel greasy when dry?"] },
    relations: [{ toKey: "machine_oil", kind: "similar_appearance", explanation: "Machine oil looks similar but carries metal particulate and a different hazard profile.", evidence: "professional_observation" }],
    stages: ["excess_removal", "oil_solvent_side", "rinsing", "final_inspection"],
    outcome: "likely_reducible", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "ghee", name: "Ghee", icon: "🧈", alt: ["Clarified butter"], local: ["Ghee", "Tup"], hindi: "घी",
    category: "oil_grease", confidence: 9, why: "Clarified fat dominates; residual milk solids may remain.",
    components: [{ component: "oil", relevance: "primary", confidence: 9 }, { component: "protein", relevance: "minor", confidence: 4 }],
    sources: ["cooking", "food"], short: "A greasy cooking-fat mark that hardens as it cools.",
    plain: "Ghee is solid at room temperature, so the mark often feels waxy and can be lifted more easily as excess before any other step.",
    science: { composition: "Clarified milk fat with possible residual solids", solubility: "Not water-soluble", bonding: "Solidifies within the fibre", heat: "Softens, spreads and penetrates further", ageing: "Oxidises and yellows" },
    identification: { appearance: "Translucent, often yellowish", texture: "Waxy when cool, greasy when warm" },
    stages: ["excess_removal", "oil_solvent_side", "rinsing", "final_inspection"],
    outcome: "likely_reducible", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "machine_oil", name: "Machine oil", icon: "⚙️", alt: ["Motor oil", "Engine oil", "Grease"], local: ["Kaala tel"], hindi: "मशीन का तेल",
    category: "oil_grease", confidence: 9, why: "Hydrocarbon oil dominates and usually carries dark particulate.",
    components: [{ component: "oil", relevance: "primary", confidence: 9 }, { component: "grease", relevance: "major", confidence: 8 }, { component: "particulate", relevance: "major", confidence: 8 }, { component: "metallic_oxide", relevance: "possible", confidence: 4 }],
    sources: ["machinery"], riskTags: ["pigment_may_remain", "professional_only"],
    short: "A dark, heavy oil mark from machinery, usually with fine black particles.",
    plain: "This is oil plus metal and carbon particles, which is why it stays grey even after the greasy feel has gone.",
    science: { composition: "Mineral or synthetic hydrocarbon oil with suspended solids", solubility: "Not water-soluble", bonding: "Deep penetration plus trapped particulate", heat: "Heat drives it deeper and can bake the residue", ageing: "Darkens and becomes far harder to improve", uncertainty: "Additive packages are formulation dependent and are usually not disclosed." },
    identification: { appearance: "Black or dark grey, spreading", texture: "Greasy, sometimes gritty", hazardIndicators: ["Strong solvent or fuel odour", "Unknown industrial contamination"] },
    stages: ["excess_removal", "oil_solvent_side", "pigment_particulate", "rinsing", "final_inspection"],
    outcome: "pigment_may_remain", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "ballpoint_ink", name: "Ballpoint ink", icon: "🖊️", alt: ["Pen ink", "Biro mark"], local: ["Pen ki syahi"], misspellings: ["ball point ink", "balpoint"], hindi: "बॉलपॉइंट स्याही",
    category: "dye_ink", confidence: 9, why: "Solvent-carried dye is the dominant material.",
    components: [{ component: "synthetic_dye", relevance: "primary", confidence: 9 }, { component: "resin", relevance: "major", confidence: 7 }, { component: "oil", relevance: "minor", confidence: 5 }],
    sources: ["ink_stationery"], riskTags: ["pigment_may_remain"],
    short: "Concentrated dye in an oily, resinous carrier.",
    plain: "Ballpoint ink is dye held in a sticky carrier. It spreads easily, so working from the edge inwards matters more than strength.",
    science: { composition: "Dyes in a glycol or oil carrier with resin", solubility: "Not water-soluble", bonding: "Resin holds dye against the fibre", heat: "Heat sets both the dye and the resin", ageing: "Dye migrates and becomes diffuse", uncertainty: "Ink formulations vary by brand and are not disclosed." },
    identification: { appearance: "Blue, black or red line or blot", texture: "Slightly raised when fresh", similarLooking: ["Textile dye transfer", "Marker"], distinguishingQuestions: ["Is there a pen line, or a diffuse patch of colour?"] },
    relations: [{ toKey: "dye_transfer", kind: "commonly_confused", explanation: "Ink is applied colour; dye transfer comes from another textile.", evidence: "professional_observation", directional: true }],
    stages: ["dye_ink_stage", "oil_solvent_side", "rinsing", "final_inspection"],
    outcome: "uncertain", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "permanent_marker", name: "Permanent marker", icon: "🖍️", alt: ["Marker pen", "Sharpie-type marker"], hindi: "परमानेंट मार्कर",
    category: "dye_ink", confidence: 9, why: "Solvent dye with resin binder, designed not to be removed.",
    components: [{ component: "synthetic_dye", relevance: "primary", confidence: 9 }, { component: "resin", relevance: "major", confidence: 8 }],
    sources: ["ink_stationery"], riskTags: ["pigment_may_remain", "professional_only"],
    short: "A solvent dye made to resist removal.",
    plain: "Permanent marker is designed to stay. Realistic expectations matter more here than any single method.",
    science: { composition: "Solvent-based dyes with a resin binder", solubility: "Not water-soluble", bonding: "Resin bonds dye to the fibre surface and inside it", heat: "Heat sets it further", ageing: "Little fading; may migrate" },
    identification: { appearance: "Dense, sharp-edged colour", texture: "Flat" },
    stages: ["dye_ink_stage", "final_inspection"],
    outcome: "pigment_may_remain", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "lipstick", name: "Lipstick", icon: "💄", alt: ["Lip colour"], local: ["Lipstick"], hindi: "लिपस्टिक",
    category: "combination_unknown", confidence: 9,
    why: "Lipstick combines wax, oil and pigment — a combination stain, never a single category.",
    components: [{ component: "wax", relevance: "primary", confidence: 9 }, { component: "oil", relevance: "major", confidence: 9 }, { component: "pigment", relevance: "major", confidence: 9 }, { component: "synthetic_dye", relevance: "minor", confidence: 6 }],
    sources: ["cosmetic"], riskTags: ["pigment_may_remain"],
    short: "A waxy, oily, strongly pigmented cosmetic mark.",
    plain: "Lipstick is wax and oil holding pigment. The greasy part and the colour part behave differently, so one approach never clears both.",
    science: { composition: "Waxes, oils and pigments, sometimes with dyes", solubility: "Not water-soluble", bonding: "Wax film holds pigment against the fibre", heat: "Heat melts the wax and spreads the pigment", ageing: "Oil oxidises; pigment stays", uncertainty: "Cosmetic formulations are proprietary and vary widely." },
    identification: { appearance: "Dense red, pink or brown smear", texture: "Waxy and slightly raised", similarLooking: ["Foundation makeup", "Food colour"] },
    stages: ["excess_removal", "oil_solvent_side", "pigment_particulate", "dye_ink_stage", "final_inspection"],
    outcome: "pigment_may_remain", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "foundation", name: "Foundation makeup", icon: "💧", alt: ["Liquid foundation", "BB cream mark"], hindi: "फाउंडेशन",
    category: "combination_unknown", confidence: 8, why: "Pigment in an oil or silicone base with film formers.",
    components: [{ component: "pigment", relevance: "primary", confidence: 9 }, { component: "oil", relevance: "major", confidence: 8 }, { component: "polymer", relevance: "major", confidence: 7 }],
    sources: ["cosmetic"], short: "A beige pigment mark in an oily or silicone base, usually on collars.",
    plain: "Foundation leaves pigment held in a base that repels water, which is why plain washing often leaves a shadow.",
    science: { composition: "Mineral pigments in oil, water or silicone bases", solubility: "Base dependent", bonding: "Film former holds pigment on the fibre", heat: "Heat sets the film", ageing: "Darkens with body soil" },
    identification: { appearance: "Beige to brown collar or cuff mark", texture: "Slightly greasy", locations: ["Collar", "Cuff", "Shoulder"] },
    stages: ["oil_solvent_side", "pigment_particulate", "rinsing", "final_inspection"],
    outcome: "likely_reducible", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "nail_polish", name: "Nail polish", icon: "💅", alt: ["Nail varnish", "Nail enamel"], hindi: "नेल पॉलिश",
    category: "paint_polymer", confidence: 9, why: "A pigmented polymer lacquer that dries to a film.",
    components: [{ component: "resin", relevance: "primary", confidence: 9 }, { component: "pigment", relevance: "major", confidence: 9 }, { component: "unknown_component", relevance: "minor", confidence: 6 }],
    sources: ["cosmetic"], riskTags: ["professional_only", "pigment_may_remain"],
    short: "A pigmented lacquer film. Solvent choices here can dissolve the fabric itself.",
    plain: "Nail polish dries as a plastic film. On acetate and similar fibres, the solvents that soften polish also destroy the fabric.",
    science: { composition: "Nitrocellulose or acrylic resin with pigment and solvent", solubility: "Not water-soluble", bonding: "Forms a mechanical film in and on the fibre", heat: "Heat hardens the film", ageing: "Becomes brittle and locks in pigment", drySolvent: "Solvent sensitivity of the fabric must be confirmed before any solvent-side work" },
    identification: { appearance: "Glossy coloured film", texture: "Hard and raised", damageVsStain: "Check underneath for fabric already dissolved or weakened." },
    fabrics: [{ fabric: "acetate", mainRisk: "The fabric itself can dissolve", why: "Acetate and triacetate are destroyed by the solvent classes used on lacquer.", testRequired: true, firstResponseBoundary: "No solvent contact at all. Do not attempt.", prohibitedPrinciples: ["paint_resin_adhesive", "oil_solvent_side"], referralCondition: "Always refer.", confidence: 9, evidence: "textile_standard" }],
    stages: ["excess_removal", "paint_resin_adhesive", "pigment_particulate", "final_inspection"],
    outcome: "professional_assessment_required", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "hair_dye", name: "Hair dye", icon: "🎨", alt: ["Hair colour"], local: ["Baalon ka rang"], hindi: "हेयर डाई",
    category: "dye_ink", confidence: 9, why: "Reactive dye chemistry designed to bond to keratin and cellulose.",
    components: [{ component: "synthetic_dye", relevance: "primary", confidence: 9 }, { component: "surfactant_residue", relevance: "major", confidence: 8 }],
    sources: ["cosmetic"], riskTags: ["professional_only", "pigment_may_remain"],
    short: "Reactive dye with an oxidiser — it can also bleach the garment colour.",
    plain: "Hair dye works by reacting inside the fibre. It can both add colour and remove the garment's own colour at the same time.",
    science: { composition: "Dye precursors with peroxide or ammonia developer", solubility: "Not water-soluble once developed", bonding: "Reacts and bonds within the fibre", heat: "Accelerates the reaction", ageing: "Fully developed colour is effectively permanent", oxidation: "The developer can strip the garment dye, producing a lighter patch" },
    identification: { appearance: "Dark brown, black or coloured patch, sometimes with a lighter halo", texture: "Flat", damageVsStain: "A lighter halo is dye loss, not a removable stain." },
    stages: ["dye_ink_stage", "reduction", "final_inspection"],
    outcome: "professional_assessment_required", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "mud", name: "Mud", icon: "🪨", alt: ["Soil", "Dirt"], local: ["Keechad", "Mitti"], hindi: "कीचड़",
    category: "pigment_particulate", confidence: 9, why: "Solid particles held in the fibre structure.",
    components: [{ component: "particulate", relevance: "primary", confidence: 9 }, { component: "metallic_oxide", relevance: "possible", confidence: 5 }],
    sources: ["soil_outdoor"], short: "Solid soil particles trapped in the fibre.",
    plain: "Mud is particles, not chemistry. Letting it dry and removing the loose material first is usually better than working it wet.",
    science: { composition: "Mineral particles, clay and organic matter", solubility: "Not soluble", bonding: "Mechanically trapped between fibres", heat: "Heat can bake organic matter into the fibre", ageing: "Particles work deeper with wear" },
    identification: { appearance: "Brown or red-brown deposit", texture: "Gritty or crusty", similarLooking: ["Mould", "Rust"] },
    relations: [{ toKey: "mould", kind: "commonly_confused", explanation: "Mould is biological and needs a hygiene assessment; particulate dirt does not.", evidence: "professional_observation" }],
    stages: ["excess_removal", "pigment_particulate", "water_side", "rinsing", "final_inspection"],
    outcome: "likely_removable", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "grass", name: "Grass", icon: "🌿", alt: ["Grass mark", "Chlorophyll stain"], local: ["Ghaas"], hindi: "घास",
    category: "tannin_plant", confidence: 8, why: "Plant pigment and tannin bound into the fibre by mechanical pressure.",
    components: [{ component: "tannin", relevance: "primary", confidence: 8 }, { component: "natural_dye", relevance: "major", confidence: 8 }, { component: "protein", relevance: "possible", confidence: 4 }],
    sources: ["plant"], short: "Green plant pigment pressed into the fibre.",
    plain: "Grass colour is a plant dye that is rubbed in under pressure, which is why knees and elbows are the hardest areas.",
    science: { composition: "Chlorophyll, plant tannins and cell material", solubility: "Poorly water-soluble", bonding: "Pressed into and bound to fibre", heat: "Heat fixes the green tone", ageing: "Turns yellow-brown" },
    identification: { appearance: "Green, later yellow-brown", texture: "Flat", locations: ["Knee", "Elbow", "Seat"] },
    stages: ["tannin_stage", "oxidation", "rinsing", "final_inspection"],
    outcome: "uncertain", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "rust", name: "Rust", icon: "🔩", alt: ["Iron mark", "Metal transfer"], local: ["Jang", "Zang"], misspellings: ["rust stain", "rustt"], hindi: "जंग",
    category: "metal_rust", confidence: 9, why: "Iron oxide deposited in the fibre; this is metal chemistry, not soil.",
    components: [{ component: "metallic_oxide", relevance: "primary", confidence: 9 }],
    sources: ["metal"], riskTags: ["professional_only"],
    short: "Iron oxide in the fibre — orange-brown and chemically specific.",
    plain: "Rust needs metal-specific chemistry. General stain removers and bleach usually make it worse or darker.",
    science: { composition: "Iron oxides", solubility: "Not water-soluble", bonding: "Chemically deposited within the fibre", heat: "Heat can darken the deposit", ageing: "Spreads as the metal source continues to corrode", oxidation: "Oxidising agents can darken and fix rust", reduction: "A reduction assessment is the technically relevant route" },
    identification: { appearance: "Orange to red-brown, often following a metal shape", texture: "Flat, sometimes rough", similarLooking: ["Brown dye transfer", "Aged blood", "Mud"], distinguishingQuestions: ["Was the garment in contact with metal, a hanger clip or a pipe?"] },
    relations: [{ toKey: "dye_transfer", kind: "commonly_confused", explanation: "Brown dye transfer looks similar but is dye chemistry, not metal.", evidence: "professional_observation" }],
    stages: ["metal_rust", "reduction", "rinsing", "final_inspection"],
    outcome: "professional_assessment_required", reviewer: "Technical reviewer A", status: "published",
    faqs: [{ q: "Can bleach remove rust?", a: "No. Chlorine bleach usually darkens rust and can damage the fabric." }],
  }),
  M({
    key: "latex_paint", name: "Latex paint", icon: "🎨", alt: ["Emulsion paint", "Water-based paint", "Wall paint"], hindi: "लेटेक्स पेंट",
    category: "paint_polymer", confidence: 9, why: "Water-based polymer emulsion carrying pigment; it cures into a film.",
    components: [{ component: "resin", relevance: "primary", confidence: 9 }, { component: "pigment", relevance: "major", confidence: 9 }],
    sources: ["paint_construction"], riskTags: ["pigment_may_remain"],
    short: "Water-based paint that becomes a plastic film once dry.",
    plain: "While wet this is far easier than once it cures. After curing, the film is effectively plastic in the fabric.",
    science: { composition: "Acrylic or vinyl polymer emulsion with pigment", solubility: "Water-dispersible only while wet", bonding: "Cures into a continuous film around fibres", heat: "Accelerates curing", ageing: "Fully cured film is very difficult to remove", water: "Useful only before curing" },
    identification: { appearance: "Opaque coloured deposit", texture: "Rubbery or hard when cured", fresh: "Soft and water-dispersible", aged: "Cured, brittle film" },
    stages: ["excess_removal", "paint_resin_adhesive", "pigment_particulate", "final_inspection"],
    outcome: "uncertain", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "acrylic_paint", name: "Acrylic paint", icon: "🖌️", alt: ["Artist acrylic"],
    category: "paint_polymer", confidence: 9, why: "Acrylic polymer with pigment that cures rapidly.",
    components: [{ component: "resin", relevance: "primary", confidence: 9 }, { component: "pigment", relevance: "major", confidence: 9 }],
    sources: ["paint_construction"], riskTags: ["pigment_may_remain"],
    short: "Fast-curing artist paint that locks pigment into the fibre.",
    plain: "Acrylic cures in minutes. Once it has set, expectations should be about improvement, not removal.",
    science: { composition: "Acrylic polymer emulsion with pigment", solubility: "Water-dispersible only while wet", bonding: "Cures into a flexible film", heat: "Accelerates curing", ageing: "Effectively permanent once cured" },
    identification: { appearance: "Bright opaque colour", texture: "Slightly rubbery film" },
    stages: ["excess_removal", "paint_resin_adhesive", "final_inspection"],
    outcome: "pigment_may_remain", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "adhesive", name: "Adhesive", icon: "🩹", alt: ["Glue", "Gum", "Sticker residue"], local: ["Gond", "Fevicol-type adhesive"], hindi: "गोंद",
    category: "paint_polymer", confidence: 7,
    why: "Adhesives are polymer systems; the exact chemistry cannot be assumed from a brand name.",
    components: [{ component: "resin", relevance: "primary", confidence: 8 }, { component: "unknown_component", relevance: "possible", confidence: 4 }],
    sources: ["adhesive"], riskTags: ["unknown_chemical"],
    short: "A polymer residue whose chemistry depends entirely on the product used.",
    plain: "Glue can be water-based, solvent-based or reactive. Until the label or product type is known, no chemistry should be assumed.",
    science: { composition: "Formulation dependent: water-based emulsion, solvent-based or reactive polymer", solubility: "Formulation dependent", bonding: "Cures or dries into a film", heat: "May soften or harden depending on type", ageing: "Hardens and yellows", uncertainty: "A brand name used as an everyday term does not confirm the formulation. Ask for the label or product type." },
    identification: { appearance: "Clear to yellow film or a tacky patch", texture: "Sticky, rubbery or hard", distinguishingQuestions: ["Do you have the tube or label?", "Was it a white school-type glue, a clear fast-setting glue, or an industrial adhesive?"] },
    stages: ["excess_removal", "paint_resin_adhesive", "final_inspection"],
    outcome: "uncertain", status: "under_review",
  }),
  M({
    key: "wax", name: "Wax", icon: "🕯️", alt: ["Candle wax", "Hair-removal wax"], local: ["Mom"], hindi: "मोम",
    category: "oil_grease", confidence: 9, why: "Solid fat-like material that melts and re-solidifies in the fibre.",
    components: [{ component: "wax", relevance: "primary", confidence: 9 }, { component: "pigment", relevance: "possible", confidence: 5 }],
    sources: ["household_chemical"], short: "A solid wax deposit, often with dye from a coloured candle.",
    plain: "The wax itself is bulk material that can be lifted, but coloured candles also leave dye behind.",
    science: { composition: "Paraffin or natural wax, sometimes dyed", solubility: "Not water-soluble", bonding: "Solidifies mechanically around fibres", heat: "Melts and spreads deeper", ageing: "Stable but attracts soil" },
    identification: { appearance: "Opaque raised deposit", texture: "Hard and brittle", damageVsStain: "Colour left after wax removal is dye, assessed separately." },
    stages: ["excess_removal", "oil_solvent_side", "dye_ink_stage", "final_inspection"],
    outcome: "likely_reducible", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "shoe_polish", name: "Shoe polish", icon: "🥾", alt: ["Boot polish"], local: ["Polish"], hindi: "जूता पॉलिश",
    category: "combination_unknown", confidence: 8, why: "Wax and solvent carrying strong pigment and dye.",
    components: [{ component: "wax", relevance: "primary", confidence: 9 }, { component: "pigment", relevance: "major", confidence: 9 }, { component: "synthetic_dye", relevance: "major", confidence: 7 }, { component: "unknown_component", relevance: "minor", confidence: 5 }],
    sources: ["household_chemical"], riskTags: ["pigment_may_remain"],
    short: "A waxy, heavily pigmented mark designed to stay on a surface.",
    plain: "Shoe polish is built to resist water and rubbing, so a shadow often remains even after a correct process.",
    science: { composition: "Waxes, solvents, pigments and dyes", solubility: "Not water-soluble", bonding: "Wax film binds pigment to fibre", heat: "Softens and spreads", ageing: "Sets hard and holds pigment" },
    identification: { appearance: "Dense black, brown or tan smear", texture: "Waxy" },
    stages: ["excess_removal", "oil_solvent_side", "pigment_particulate", "dye_ink_stage", "final_inspection"],
    outcome: "pigment_may_remain", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "perspiration", name: "Perspiration", icon: "💦", alt: ["Sweat", "Underarm mark"], local: ["Paseena"], misspellings: ["persperation", "prespiration"], hindi: "पसीना",
    category: "protein", confidence: 8, why: "Body proteins and salts, often combined with product residue.",
    components: [{ component: "protein", relevance: "primary", confidence: 8 }, { component: "salt", relevance: "major", confidence: 8 }, { component: "oil", relevance: "minor", confidence: 6 }],
    sources: ["body_fluid"], riskTags: ["heat_warning"],
    short: "Body salts and protein that yellow the fabric and can affect dye.",
    plain: "Sweat is mildly acidic and then becomes alkaline as it ages, which is why old underarm marks can change the garment colour, not just add one.",
    science: { composition: "Water, salts, proteins and body oils", solubility: "Partly water-soluble", bonding: "Salts crystallise and proteins bind", heat: "Sets protein and yellowing", ageing: "Yellows and can weaken fibre", acidity: "Fresh perspiration is acidic", alkalinity: "Ageing perspiration becomes alkaline and can shift dye colour" },
    identification: { appearance: "Yellow underarm or collar area, sometimes stiff", texture: "Stiff or crisp", locations: ["Underarm", "Collar", "Back"], damageVsStain: "Colour change in the dye is damage, not a removable mark." },
    stages: ["protein_stage", "water_side", "oxidation", "rinsing", "final_inspection"],
    outcome: "uncertain", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "deodorant", name: "Deodorant buildup", icon: "🧴", alt: ["Antiperspirant residue"], hindi: "डिओडोरेंट",
    category: "combination_unknown", confidence: 7, why: "Aluminium salts, wax and body soil build into a stiff deposit.",
    components: [{ component: "metallic_oxide", relevance: "major", confidence: 7 }, { component: "wax", relevance: "major", confidence: 7 }, { component: "protein", relevance: "minor", confidence: 6 }],
    sources: ["cosmetic", "body_fluid"], short: "A stiff white or yellow underarm deposit.",
    plain: "This is product buildup mixed with body soil. It stiffens the fabric and often needs several assessment stages.",
    science: { composition: "Aluminium salts, waxes, fragrance and body soil", solubility: "Partly water-soluble", bonding: "Salt and wax deposits within the fibre", heat: "Sets the yellowing", ageing: "Hardens and can weaken fibre", uncertainty: "Product formulations are proprietary." },
    identification: { appearance: "White crusting or yellowing", texture: "Stiff", locations: ["Underarm"] },
    stages: ["water_side", "oil_solvent_side", "protein_stage", "rinsing", "final_inspection"],
    outcome: "uncertain", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "urine", name: "Urine", icon: "🚽", alt: ["Pet urine"], local: ["Peshaab"], hindi: "मूत्र",
    category: "protein", confidence: 8, why: "Body waste with protein, salts and urea; also a hygiene matter.",
    components: [{ component: "protein", relevance: "primary", confidence: 8 }, { component: "salt", relevance: "major", confidence: 8 }],
    sources: ["body_fluid"], riskTags: ["biological_precaution", "heat_warning"],
    short: "A body-waste mark that is both a stain and a hygiene issue.",
    plain: "Urine can change garment colour as it ages and needs a hygiene assessment as well as a visual one.",
    science: { composition: "Water, urea, salts and proteins", solubility: "Partly water-soluble", bonding: "Salts and protein bind as it dries", heat: "Sets the yellowing and the odour", ageing: "Becomes alkaline and can alter dyes", alkalinity: "Aged urine is alkaline and may shift dye colour" },
    identification: { appearance: "Yellow ring, often with a defined edge", texture: "Stiff when dry", odour: "Distinct ammonia-like odour when aged", hazardIndicators: ["Contamination risk — handle with hygiene precautions"] },
    stages: ["protein_stage", "biological", "water_side", "rinsing", "final_inspection"],
    outcome: "uncertain", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "vomit", name: "Vomit", icon: "🤢", alt: ["Sick"], local: ["Ulti"], hindi: "उल्टी",
    category: "protein", confidence: 8, why: "Digested food protein with acid; also a contamination matter.",
    components: [{ component: "protein", relevance: "primary", confidence: 9 }, { component: "unknown_component", relevance: "major", confidence: 8 }, { component: "natural_dye", relevance: "possible", confidence: 5 }],
    sources: ["body_fluid"], riskTags: ["biological_precaution", "heat_warning"],
    short: "Protein and stomach acid — a stain, a hygiene issue and a possible dye risk.",
    plain: "Stomach acid can strip dye while the protein sets, so what is left may be colour loss rather than a stain.",
    science: { composition: "Digested food, protein, stomach acid", solubility: "Partly water-dispersible while fresh", bonding: "Protein coagulates on the fibre", heat: "Sets the protein", ageing: "Acid can permanently affect the dye", acidity: "Strongly acidic; may cause dye loss" },
    identification: { appearance: "Mixed colour deposit, sometimes with a lightened patch", texture: "Chunky then crusty", odour: "Distinctly sour", damageVsStain: "A lightened area is acid dye damage, not a stain." },
    stages: ["excess_removal", "protein_stage", "biological", "neutralization", "rinsing", "final_inspection"],
    outcome: "uncertain", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "milk", name: "Milk", icon: "🥛", alt: ["Dairy spill"], local: ["Doodh"], hindi: "दूध",
    category: "protein", confidence: 9, why: "Milk protein with milk fat.",
    components: [{ component: "protein", relevance: "primary", confidence: 9 }, { component: "oil", relevance: "major", confidence: 8 }],
    sources: ["food", "beverage"], short: "Protein plus fat — often invisible at first, then yellow and smelly.",
    plain: "A milk mark can dry almost invisible and then yellow later, especially after heat.",
    science: { composition: "Water, milk proteins, milk fat and lactose", solubility: "Partly water-dispersible while fresh", bonding: "Protein coagulates; fat absorbs", heat: "Coagulates protein and sets the yellowing", ageing: "Yellows and develops odour" },
    identification: { appearance: "Almost invisible when fresh, yellow when aged", texture: "Slightly stiff", odour: "Sour when aged" },
    stages: ["protein_stage", "oil_solvent_side", "rinsing", "final_inspection"],
    outcome: "likely_reducible", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "egg", name: "Egg", icon: "🥚", alt: ["Egg yolk", "Egg white"], local: ["Anda"], hindi: "अंडा",
    category: "protein", confidence: 9, why: "Egg protein, with fat and natural colour in the yolk.",
    components: [{ component: "protein", relevance: "primary", confidence: 9 }, { component: "oil", relevance: "major", confidence: 7 }, { component: "natural_dye", relevance: "minor", confidence: 5 }],
    sources: ["food"], short: "A protein mark that hardens quickly and cooks with heat.",
    plain: "Egg literally cooks onto the fabric with warm water or ironing.",
    science: { composition: "Egg proteins, fats and pigments", solubility: "Partly water-dispersible while fresh", bonding: "Coagulates into a hard film", heat: "Cooks the protein onto the fibre", ageing: "Hardens and becomes glassy" },
    identification: { appearance: "Clear glossy or yellow deposit", texture: "Hard and shiny when dry" },
    stages: ["excess_removal", "protein_stage", "oil_solvent_side", "rinsing", "final_inspection"],
    outcome: "likely_reducible", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "chocolate", name: "Chocolate", icon: "🍫", alt: ["Cocoa stain"], local: ["Chocolate"], hindi: "चॉकलेट",
    category: "combination_unknown", confidence: 8, why: "Cocoa tannin, milk protein and cocoa fat together.",
    components: [{ component: "tannin", relevance: "primary", confidence: 8 }, { component: "oil", relevance: "major", confidence: 8 }, { component: "protein", relevance: "major", confidence: 7 }, { component: "sugar", relevance: "minor", confidence: 6 }],
    sources: ["food"], short: "Fat, protein and tannin colour in one mark.",
    plain: "Chocolate has three different components, so a single approach usually leaves either the grease or the colour behind.",
    science: { composition: "Cocoa solids, cocoa butter, milk solids and sugar", solubility: "Mixed", bonding: "Fat absorbs while tannin binds", heat: "Melts the fat and sets the protein and colour", ageing: "Fat oxidises and colour darkens" },
    identification: { appearance: "Brown, sometimes greasy-edged", texture: "Greasy then stiff" },
    stages: ["excess_removal", "oil_solvent_side", "protein_stage", "tannin_stage", "rinsing", "final_inspection"],
    outcome: "likely_reducible", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "fruit_juice", name: "Fruit juice", icon: "🧃", alt: ["Juice spill", "Squash stain"], local: ["Ras", "Sharbat"], hindi: "फलों का रस",
    category: "tannin_plant", confidence: 8, why: "Plant colour and sugar; some juices are strongly dyeing.",
    components: [{ component: "tannin", relevance: "primary", confidence: 8 }, { component: "natural_dye", relevance: "major", confidence: 8 }, { component: "sugar", relevance: "major", confidence: 8 }, { component: "unknown_component", relevance: "minor", confidence: 6 }],
    sources: ["beverage", "food"], short: "Plant colour and sugar; some fruits behave like a dye.",
    plain: "Fruit sugar dries invisible and then browns with heat or age, which is why an old juice mark appears from nowhere.",
    science: { composition: "Water, fruit sugars, plant pigments and fruit acids", solubility: "Water-dispersible while fresh", bonding: "Sugar caramelises and pigment binds", heat: "Caramelises sugar into a brown mark", ageing: "Invisible sugar turns brown", acidity: "Fruit acids may affect sensitive dyes" },
    identification: { appearance: "Pink, red, purple or later brown", texture: "Sticky when fresh", aged: "Brown and much harder to improve" },
    stages: ["water_side", "tannin_stage", "oxidation", "rinsing", "final_inspection"],
    outcome: "likely_reducible", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "dye_transfer", name: "Textile dye transfer", icon: "🌈", alt: ["Colour bleeding", "Colour run", "Dye bleed"], local: ["Rang chhoot gaya"], hindi: "रंग निकलना",
    category: "dye_ink", confidence: 8, why: "Dye released from one textile and redeposited on another. This is dye chemistry, not applied ink.",
    components: [{ component: "synthetic_dye", relevance: "primary", confidence: 8 }, { component: "natural_dye", relevance: "possible", confidence: 5 }],
    sources: ["dye_transfer"], riskTags: ["professional_only"],
    short: "Colour from another garment redeposited into this fabric.",
    plain: "The colour came from another textile in the wash. It sits in the fibre exactly like the garment's own dye, which is what makes it difficult.",
    science: { composition: "Migrated textile dye", solubility: "Not water-soluble once redeposited", bonding: "Bonds to the fibre in the same way as the original dye", heat: "Heat fixes the transferred dye", ageing: "Becomes progressively harder to reduce", reduction: "A reduction assessment is the technically relevant route" },
    identification: { appearance: "Overall or patchy colour cast", texture: "No texture change", similarLooking: ["Ink", "Rust", "Fading"], distinguishingQuestions: ["Was it washed with something coloured?"], damageVsStain: "If the garment's own colour is missing, that is dye loss, not transfer." },
    relations: [{ toKey: "ballpoint_ink", kind: "not_equivalent", explanation: "Ink is applied to the surface; dye transfer arrives from another textile.", evidence: "professional_observation" }],
    stages: ["dye_ink_stage", "reduction", "rinsing", "final_inspection"],
    outcome: "uncertain", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "mould", name: "Mould / mildew", icon: "🦠", alt: ["Mildew", "Fungus"], local: ["Phaphoondi"], misspellings: ["mold", "mildue"], hindi: "फफूंदी",
    category: "biological", confidence: 9, why: "Living or decayed biological growth; a hygiene matter as well as a stain.",
    components: [{ component: "biological_material", relevance: "primary", confidence: 9 }, { component: "natural_dye", relevance: "major", confidence: 7 }],
    sources: ["mould_biological"], riskTags: ["biological_precaution", "professional_only"],
    short: "Biological growth that stains and can permanently weaken fibre.",
    plain: "Mould feeds on the fibre. Even after the colour improves, the fabric underneath may already be weakened.",
    science: { composition: "Fungal growth, spores and pigments produced by it", solubility: "Pigments are not water-soluble", bonding: "Grows into the fibre structure", heat: "Heat sets the pigment", ageing: "Progressive fibre damage", uncertainty: "Fibre strength loss may not be visible until handling." },
    identification: { appearance: "Black, green or grey spotting", texture: "Powdery or fuzzy", odour: "Musty", hazardIndicators: ["Spore exposure — ventilate and handle with care"], damageVsStain: "Holes or weakness are damage, not stain." },
    stages: ["biological", "excess_removal", "oxidation", "rinsing", "final_inspection"],
    outcome: "permanent_damage_possible", reviewer: "Technical reviewer A", status: "published",
  }),
  M({
    key: "unknown_yellow", name: "Unknown yellow mark", icon: "❓", alt: ["Yellow patch", "Storage yellowing"], hindi: "अज्ञात पीला निशान",
    category: "combination_unknown", confidence: 3,
    why: "Yellowing has many possible causes; the chemistry cannot be determined from appearance.",
    components: [{ component: "unknown_component", relevance: "primary", confidence: 3 }],
    sources: ["unknown_source"], riskTags: ["unknown_chemical", "professional_only"],
    short: "A yellow mark of unknown origin. The cause must be investigated before anything else.",
    plain: "Yellowing can come from body soil, old sugar, oxidised oil, storage or a previous chemical. Guessing is what causes damage.",
    science: { composition: "Not determined", solubility: "Unknown", bonding: "Unknown", heat: "Any heat may make an unidentified mark permanent", ageing: "May already be oxidised", uncertainty: "Insufficient information. Laboratory or specialist identification may be required." },
    identification: { appearance: "Diffuse yellow to brown", texture: "Usually flat", confidenceCeiling: 3, labOnly: true, photoLimitations: "A photograph cannot identify this mark. Physical inspection is required.", distinguishingQuestions: ["How was the garment stored?", "Was anything applied to it before?", "Is the yellowing only where the body touches?"] },
    stages: ["final_inspection"],
    outcome: "uncertain", status: "under_review",
    faqs: [{ q: "Can you tell me what this yellow mark is from a photo?", a: "No. Yellowing has several possible causes and needs physical inspection." }],
  }),
  M({
    key: "bleach_colour_loss", name: "Bleach-related colour loss", icon: "⚠️", alt: ["Bleach spot", "Colour loss", "White patch"], local: ["Rang uud gaya"], hindi: "ब्लीच से रंग जाना",
    damage: true,
    damageInterpretation: "The garment dye has been chemically destroyed. This is damage diagnosis, not a removable stain.",
    category: "combination_unknown", confidence: 9,
    why: "Recorded as a damage diagnosis: colour has been removed from the fibre, so there is no stain material to remove.",
    components: [{ component: "unknown_component", relevance: "primary", confidence: 3 }],
    sources: ["household_chemical"], riskTags: ["fibre_damage_possible", "professional_only"],
    short: "The colour has been removed from the fabric. Nothing can be cleaned off.",
    plain: "This is not a stain. The dye is gone. Cleaning cannot bring colour back; only recolouring or a repair route can be considered.",
    science: { composition: "No deposited material — dye has been chemically destroyed", solubility: "Not applicable", bonding: "Not applicable", heat: "Heat cannot reverse dye loss", ageing: "The lightened area may continue to change", oxidation: "Residual oxidiser may keep acting until neutralised", uncertainty: "The full extent may only appear after drying or a further wash." },
    identification: { appearance: "White, orange or pink patch with a sharp edge", texture: "Unchanged fabric texture", damageVsStain: "Damage — no material to remove.", confidenceCeiling: 8 },
    stages: ["neutralization", "final_inspection"],
    outcome: "permanent_damage_possible",
    outcomeNotes: { foreignMaterial: "There is no foreign material present.", remainingPigment: "Not applicable.", dyeLoss: "Dye loss is permanent and cannot be cleaned out.", fibreDamage: "Fibre may also be weakened where the chemical was strong.", finishDamage: "Finish may be affected." },
    heatWarning: "Heat will not restore colour and may worsen the surrounding area.",
    reviewer: "Technical reviewer A", status: "published",
    faqs: [{ q: "Can this bleach mark be cleaned off?", a: "No. The colour has been destroyed. Cleaning cannot restore it." }],
  }),
  M({
    key: "scorch", name: "Scorch or heat damage", icon: "🔥", alt: ["Iron mark", "Burn mark", "Singe"], local: ["Jal gaya"], hindi: "झुलसा हुआ",
    damage: true,
    damageInterpretation: "The fibre itself has been altered by heat. This is damage diagnosis, not a removable stain.",
    category: "combination_unknown", confidence: 9,
    why: "Recorded as a damage diagnosis: the fibre has been chemically and physically changed by heat.",
    components: [{ component: "unknown_component", relevance: "primary", confidence: 3 }],
    sources: ["unknown_source"], riskTags: ["fibre_damage_possible", "professional_only"],
    short: "The fibre has been altered by heat. This cannot be cleaned away.",
    plain: "A scorch mark is changed fibre, not deposited material. Cleaning cannot restore it, and rubbing usually makes a hole.",
    science: { composition: "Thermally degraded fibre and finish", solubility: "Not applicable", bonding: "Not applicable", heat: "Further heat worsens the damage", ageing: "The weakened area tears more easily with wear", uncertainty: "Structural weakening may extend beyond the visible mark." },
    identification: { appearance: "Yellow, brown or glazed shiny patch", texture: "Stiff, brittle or glazed; synthetics may be melted", damageVsStain: "Damage — no material to remove.", confidenceCeiling: 8 },
    stages: ["final_inspection"],
    outcome: "permanent_damage_possible",
    outcomeNotes: { foreignMaterial: "There is no foreign material to remove.", remainingPigment: "Not applicable.", dyeLoss: "Colour may be permanently altered.", fibreDamage: "Fibre strength is reduced and may fail in wear.", finishDamage: "Finish is usually destroyed in the marked area." },
    heatWarning: "Do not apply any further heat.",
    reviewer: "Technical reviewer A", status: "published",
    faqs: [{ q: "Can a scorch mark be removed?", a: "No. Heat damage changes the fibre. Only masking, repair or replacement can be considered." }],
  }),
];

export const MASTER_BY_KEY: Record<string, MasterStain> = Object.fromEntries(MASTER_STAINS.map((m) => [m.key, m]));
export const MASTER_BY_STAIN_ID: Record<string, MasterStain> = Object.fromEntries(MASTER_STAINS.map((m) => [m.stainId, m]));

/** Highest allocated sequence — new records continue from here and never reuse IDs. */
export const LAST_ALLOCATED_SEQUENCE = seq;
