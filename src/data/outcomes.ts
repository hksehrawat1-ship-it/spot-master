/**
 * STEP 14 — Treatment feedback and outcome loop: controlled vocabularies, record
 * structures, thresholds and evidence-promotion states.
 *
 * Permanent principle:
 *   A treatment is successful only when the stain improves without unacceptable
 *   garment damage. Raw feedback never rewrites approved guidance.
 */

import type { UserRoleKey } from "@/lib/fabricSafety";

export const OUTCOME_SYSTEM_VERSION = "step14-outcomes-v1";

/* ------------------------------------------------------------------ */
/* 2. Outcome record types                                             */
/* ------------------------------------------------------------------ */

export const OUTCOME_RECORD_TYPES = [
  "domestic_attempt", "quick_professional_attempt", "technical_professional_attempt",
  "compatibility_test", "training_simulation", "internal_controlled_trial",
  "professional_observation", "customer_reported", "adverse_outcome",
  "no_treatment_referral", "damage_diagnosis", "unresolved_case",
] as const;
export type OutcomeRecordType = (typeof OUTCOME_RECORD_TYPES)[number];

export const RECORD_TYPE_LABEL: Record<OutcomeRecordType, string> = {
  domestic_attempt: "Domestic treatment attempt",
  quick_professional_attempt: "Quick Professional treatment attempt",
  technical_professional_attempt: "Technical Professional treatment attempt",
  compatibility_test: "Compatibility test",
  training_simulation: "Training simulation",
  internal_controlled_trial: "Internal controlled trial",
  professional_observation: "Professional observation",
  customer_reported: "Customer-reported outcome",
  adverse_outcome: "Adverse outcome",
  no_treatment_referral: "No-treatment referral",
  damage_diagnosis: "Damage diagnosis",
  unresolved_case: "Unresolved case",
};

/** Simulated / non-live record types are never mixed into live performance metrics. */
export const SIMULATION_RECORD_TYPES: OutcomeRecordType[] = ["training_simulation"];

/** Record types that represent a real treatment applied to a real garment. */
export const LIVE_TREATMENT_TYPES: OutcomeRecordType[] = [
  "domestic_attempt", "quick_professional_attempt", "technical_professional_attempt",
  "internal_controlled_trial", "customer_reported", "adverse_outcome",
];

/* ------------------------------------------------------------------ */
/* 3. Stable outcome IDs                                               */
/* ------------------------------------------------------------------ */

export const formatOutcomeId = (n: number) => `SM-OUT-${String(n).padStart(6, "0")}`;
export const formatAdverseId = (n: number) => `SM-ADV-${String(n).padStart(6, "0")}`;
export const formatReviewId = (n: number) => `SM-REV-${String(n).padStart(6, "0")}`;

/* ------------------------------------------------------------------ */
/* 4. Context snapshot                                                 */
/* ------------------------------------------------------------------ */

export type OutcomeContext = {
  caseId: string;
  caseVersion: number;
  resultId: string;
  resultVersion: number;
  role: UserRoleKey;
  organizationKey: string;
  country: string;

  garmentDescription: string;
  fabricKey: string;
  fabricConfidence: "high" | "moderate" | "low" | "unknown";
  fabricRiskGroup: "group_a" | "group_b" | "group_c" | "group_d";
  colour: string;
  construction: string;

  stainKey: string;
  stainConfidence: number;           // 0–10
  classificationKey: string;
  stainAge: string;
  heatExposure: string;
  previousTreatments: string[];

  stageNumber: number;
  productKey?: string;
  productVersionKey?: string;
  productBatch?: string;
  productExpiry?: string;
  mappingVersionKey?: string;
  domesticTreatmentVersionKey?: string;
  ruleSetVersion: string;
  sourceDocumentVersions: string[];

  equipment: string[];
  ppeUsed: string[];
  ventilation: "adequate" | "inadequate" | "unknown";
  operator: string;
  recordedAt: string;
};

/* ------------------------------------------------------------------ */
/* 5. Pre-treatment baseline                                           */
/* ------------------------------------------------------------------ */

export type BaselinePhotoKey =
  | "garment_full" | "stain_closeup" | "comparison_area" | "existing_damage";

export type PreTreatmentBaseline = {
  photos: Partial<Record<BaselinePhotoKey, string>>;
  stainSize: string;
  stainColour: string;
  stainTexture: string;
  garmentColour: string;
  existingDamage: string[];
  existingRing: boolean;
  existingDyeLoss: boolean;
  existingTextureChange: boolean;
  existingOdour: boolean;
  notes?: string;
  operatorConfirmed: boolean;
};

export const emptyBaseline = (over: Partial<PreTreatmentBaseline> = {}): PreTreatmentBaseline => ({
  photos: {},
  stainSize: "",
  stainColour: "",
  stainTexture: "",
  garmentColour: "",
  existingDamage: [],
  existingRing: false,
  existingDyeLoss: false,
  existingTextureChange: false,
  existingOdour: false,
  operatorConfirmed: false,
  ...over,
});

export const REQUIRED_BASELINE_PHOTOS: BaselinePhotoKey[] = ["garment_full", "stain_closeup"];

/* ------------------------------------------------------------------ */
/* 6. Attempt record                                                   */
/* ------------------------------------------------------------------ */

export type AttemptRecord = {
  attemptNumber: number;
  stageNumber: number;
  action: string;
  productOrMethod: string;
  productVersionKey?: string;
  quantity?: string;
  dilution?: string;
  contactTime?: string;
  temperature?: string;
  technique?: string;
  equipment: string[];
  rinsingPerformed: "yes" | "no" | "not_required" | "unknown";
  neutralizationPerformed: "yes" | "no" | "not_required" | "unknown";
  dryingCondition?: string;
  deviations: string[];
  deviationReason?: string;
  operator: string;
  supervisor?: string;
  startTime?: string;
  endTime?: string;
  /** Everything above is recorded practice, never verified instruction. */
  recordedPractice: true;
};

export const RECORDED_PRACTICE_NOTE =
  "Recorded practice — entered by the operator. This is not a verified instruction and does not replace the approved method.";

/** The approved method the attempt is compared against. */
export type ApprovedMethodSnapshot = {
  methodVersionKey: string;
  stageNumber: number;
  productVersionKey?: string;
  requiredSteps: string[];
  quantity?: string;
  dilution?: string;
  contactTime?: string;
  temperature?: string;
  rinseRequired: boolean;
  neutralizationRequired: boolean;
  requiredPpe: string[];
  requiredEquipment: string[];
  repetitionPermitted: boolean;
  maximumAttempts?: number;
  expectedResult: OutcomeClassification;
};

/* ------------------------------------------------------------------ */
/* 7. Method compliance                                                */
/* ------------------------------------------------------------------ */

export const COMPLIANCE_RESULTS = [
  "followed_as_approved", "minor_documented_deviation", "major_deviation",
  "required_step_skipped", "product_version_mismatch", "quantity_dilution_mismatch",
  "contact_time_mismatch", "temperature_mismatch", "required_rinse_missing",
  "required_neutralization_missing", "ppe_requirement_not_met",
  "equipment_requirement_not_met", "insufficient_information",
] as const;
export type ComplianceResult = (typeof COMPLIANCE_RESULTS)[number];

export const COMPLIANCE_LABEL: Record<ComplianceResult, string> = {
  followed_as_approved: "Followed as Approved",
  minor_documented_deviation: "Minor Documented Deviation",
  major_deviation: "Major Deviation",
  required_step_skipped: "Required Step Skipped",
  product_version_mismatch: "Product Version Mismatch",
  quantity_dilution_mismatch: "Quantity or Dilution Mismatch",
  contact_time_mismatch: "Contact-Time Mismatch",
  temperature_mismatch: "Temperature Mismatch",
  required_rinse_missing: "Required Rinse Missing",
  required_neutralization_missing: "Required Neutralization Missing",
  ppe_requirement_not_met: "PPE Requirement Not Met",
  equipment_requirement_not_met: "Equipment Requirement Not Met",
  insufficient_information: "Insufficient Information",
};

export const MAJOR_COMPLIANCE_FAILURES: ComplianceResult[] = [
  "major_deviation", "required_step_skipped", "product_version_mismatch",
  "required_rinse_missing", "required_neutralization_missing",
];

export const COMPLIANCE_CAUSATION_NOTE =
  "A deviation is recorded for context only. It is not proof that the approved method or the deviation caused the outcome.";

/* ------------------------------------------------------------------ */
/* 8. Immediate inspection                                             */
/* ------------------------------------------------------------------ */

export const INSPECTION_OBSERVATIONS = [
  "stain_removed", "major_reduction", "moderate_reduction", "minor_reduction",
  "no_meaningful_change", "stain_spread", "ring_appeared", "ring_worsened",
  "pigment_remains", "dye_transferred", "colour_lightened", "colour_darkened",
  "fibre_weakened", "texture_changed", "shrinkage", "distortion",
  "coating_softened", "coating_lifted", "lamination_separated", "adhesive_loosened",
  "decoration_changed", "odour_changed", "residue_remains", "unexpected_heat",
  "unexpected_vapour", "unexpected_reaction", "user_uncertain",
] as const;
export type InspectionObservation = (typeof INSPECTION_OBSERVATIONS)[number];

export const OBSERVATION_LABEL: Record<InspectionObservation, string> = {
  stain_removed: "Stain removed",
  major_reduction: "Major reduction",
  moderate_reduction: "Moderate reduction",
  minor_reduction: "Minor reduction",
  no_meaningful_change: "No meaningful change",
  stain_spread: "Stain spread",
  ring_appeared: "Ring appeared",
  ring_worsened: "Ring worsened",
  pigment_remains: "Pigment remains",
  dye_transferred: "Dye transferred",
  colour_lightened: "Colour lightened",
  colour_darkened: "Colour darkened",
  fibre_weakened: "Fibre weakened",
  texture_changed: "Texture changed",
  shrinkage: "Shrinkage",
  distortion: "Distortion",
  coating_softened: "Coating softened",
  coating_lifted: "Coating lifted",
  lamination_separated: "Lamination separated",
  adhesive_loosened: "Adhesive loosened",
  decoration_changed: "Decoration changed",
  odour_changed: "Odour changed",
  residue_remains: "Residue remains",
  unexpected_heat: "Unexpected heat",
  unexpected_vapour: "Unexpected vapour",
  unexpected_reaction: "Unexpected reaction",
  user_uncertain: "User uncertain",
};

/** Observations that represent garment damage or a hazardous reaction. */
export const DAMAGE_OBSERVATIONS: InspectionObservation[] = [
  "dye_transferred", "colour_lightened", "colour_darkened", "fibre_weakened",
  "texture_changed", "shrinkage", "distortion", "coating_softened", "coating_lifted",
  "lamination_separated", "adhesive_loosened", "decoration_changed",
];

export const HAZARD_OBSERVATIONS: InspectionObservation[] = [
  "unexpected_heat", "unexpected_vapour", "unexpected_reaction",
];

export const IMPROVEMENT_OBSERVATIONS: InspectionObservation[] = [
  "stain_removed", "major_reduction", "moderate_reduction", "minor_reduction",
];

export type Inspection = {
  observations: InspectionObservation[];
  photos: string[];
  notes?: string;
  inspectedBy: string;
  inspectedAt: string;
};

export const emptyInspection = (over: Partial<Inspection> = {}): Inspection => ({
  observations: [], photos: [], inspectedBy: "", inspectedAt: "", ...over,
});

/* ------------------------------------------------------------------ */
/* 9. Safety stop                                                      */
/* ------------------------------------------------------------------ */

export const SAFETY_STOP_MESSAGE =
  "Stop treatment. Do not apply another product or heat. Record the result and escalate the case.";

export type SafetyStop = {
  stopped: boolean;
  message?: string;
  blockRepetition: boolean;
  blockNextChemicalStage: boolean;
  blockHeat: boolean;
  escalationRequired: boolean;
  notifyRoles: string[];
  adverseRecordRequired: boolean;
  casePreserved: true;
};

/* ------------------------------------------------------------------ */
/* 10. Post-rinse inspection                                           */
/* ------------------------------------------------------------------ */

export type PostRinseInspection = {
  requiredProcessCompleted: "yes" | "no" | "unknown";
  processUsed?: string;
  completionConfirmed: boolean;
  residueVisible: boolean;
  odourRemains: boolean;
  ringRemains: boolean;
  colourChanged: boolean;
  textureChanged: boolean;
  productRemovalUncertain: boolean;
  photo?: string;
  operator: string;
};

/* ------------------------------------------------------------------ */
/* 11. Post-drying inspection                                          */
/* ------------------------------------------------------------------ */

export type PostDryingInspection = {
  dryingMethod: string;
  dryingPermittedBySafetyEngine: boolean;
  stainResult: InspectionObservation;
  ring: boolean;
  colourChanged: boolean;
  textureChanged: boolean;
  shrinkage: boolean;
  distortion: boolean;
  odour: boolean;
  residue: boolean;
  coatingCondition: string;
  decorationCondition: string;
  photo?: string;
  date: string;
};

/* ------------------------------------------------------------------ */
/* 12. Delayed follow-up                                               */
/* ------------------------------------------------------------------ */

export const FOLLOW_UP_INTERVALS = [
  "after_24_hours", "next_customer_inspection", "next_cleaning_cycle", "treatment_specific",
] as const;
export type FollowUpInterval = (typeof FOLLOW_UP_INTERVALS)[number];

export const FOLLOW_UP_INTERVAL_LABEL: Record<FollowUpInterval, string> = {
  after_24_hours: "After 24 hours",
  next_customer_inspection: "At the next customer inspection",
  next_cleaning_cycle: "At the next cleaning cycle",
  treatment_specific: "Treatment-specific interval",
};

export const FOLLOW_UP_FINDINGS = [
  "stain_reappeared", "ring_developed", "yellowing_developed", "odour_returned",
  "texture_changed", "coating_changed", "customer_complaint", "no_delayed_issue", "not_inspected",
] as const;
export type FollowUpFinding = (typeof FOLLOW_UP_FINDINGS)[number];

export const FOLLOW_UP_FINDING_LABEL: Record<FollowUpFinding, string> = {
  stain_reappeared: "Stain reappeared",
  ring_developed: "Ring developed",
  yellowing_developed: "Yellowing developed",
  odour_returned: "Odour returned",
  texture_changed: "Texture changed",
  coating_changed: "Coating changed",
  customer_complaint: "Customer complaint",
  no_delayed_issue: "No delayed issue",
  not_inspected: "Not inspected",
};

export type DelayedFollowUp = {
  interval: FollowUpInterval;
  intervalNote?: string;
  findings: FollowUpFinding[];
  recordedBy?: string;
  recordedAt?: string;
};

export const FOLLOW_UP_NOTE =
  "Follow-up intervals are treatment-specific. Not every case requires the same interval.";

/* ------------------------------------------------------------------ */
/* 13. Controlled outcome classification                               */
/* ------------------------------------------------------------------ */

export const OUTCOME_CLASSIFICATIONS = [
  "successful_without_observed_damage", "major_reduction_without_damage",
  "moderate_reduction_without_damage", "minor_reduction_without_damage",
  "no_meaningful_change", "pigment_remains", "stain_spread", "ring_formed",
  "dye_loss", "dye_bleeding", "fibre_damage", "texture_damage",
  "shrinkage_or_distortion", "finish_or_coating_damage", "adhesive_or_decoration_damage",
  "odour_or_residue_concern", "hazardous_reaction", "inconclusive",
  "not_inspected_after_drying",
] as const;
export type OutcomeClassification = (typeof OUTCOME_CLASSIFICATIONS)[number];

export const CLASSIFICATION_LABEL: Record<OutcomeClassification, string> = {
  successful_without_observed_damage: "Successful Without Observed Damage",
  major_reduction_without_damage: "Major Reduction Without Observed Damage",
  moderate_reduction_without_damage: "Moderate Reduction Without Observed Damage",
  minor_reduction_without_damage: "Minor Reduction Without Observed Damage",
  no_meaningful_change: "No Meaningful Change",
  pigment_remains: "Pigment Remains",
  stain_spread: "Stain Spread",
  ring_formed: "Ring Formed",
  dye_loss: "Dye Loss",
  dye_bleeding: "Dye Bleeding",
  fibre_damage: "Fibre Damage",
  texture_damage: "Texture Damage",
  shrinkage_or_distortion: "Shrinkage or Distortion",
  finish_or_coating_damage: "Finish or Coating Damage",
  adhesive_or_decoration_damage: "Adhesive or Decoration Damage",
  odour_or_residue_concern: "Odour or Residue Concern",
  hazardous_reaction: "Hazardous Reaction",
  inconclusive: "Inconclusive",
  not_inspected_after_drying: "Not Inspected After Drying",
};

export const DAMAGE_CLASSIFICATIONS: OutcomeClassification[] = [
  "dye_loss", "dye_bleeding", "fibre_damage", "texture_damage", "shrinkage_or_distortion",
  "finish_or_coating_damage", "adhesive_or_decoration_damage", "hazardous_reaction",
];

/* ------------------------------------------------------------------ */
/* 14. Expected vs actual                                              */
/* ------------------------------------------------------------------ */

export const COMPARISON_RESULTS = [
  "met_expectation", "exceeded_expectation", "below_expectation",
  "unexpected_damage", "invalid_comparison", "insufficient_information",
] as const;
export type ExpectationComparison = (typeof COMPARISON_RESULTS)[number];

export const EXPECTATION_LABEL: Record<ExpectationComparison, string> = {
  met_expectation: "Met Expectation",
  exceeded_expectation: "Exceeded Expectation",
  below_expectation: "Below Expectation",
  unexpected_damage: "Unexpected Damage",
  invalid_comparison: "Invalid Comparison",
  insufficient_information: "Insufficient Information",
};

/** Ordered improvement ladder used for expectation comparison only. */
export const IMPROVEMENT_RANK: Partial<Record<OutcomeClassification, number>> = {
  successful_without_observed_damage: 4,
  major_reduction_without_damage: 3,
  moderate_reduction_without_damage: 2,
  minor_reduction_without_damage: 1,
  no_meaningful_change: 0,
  pigment_remains: 0,
  stain_spread: -1,
};

/* ------------------------------------------------------------------ */
/* 15. Remaining-mark diagnosis                                        */
/* ------------------------------------------------------------------ */

export const REMAINING_MARK_TYPES = [
  "remaining_removable_stain", "residual_pigment", "residual_dye", "dye_loss",
  "fibre_damage", "heat_damage", "chemical_damage", "finish_damage", "coating_damage",
  "ring_or_residue", "stain_and_damage_combination", "unknown", "specialist_assessment_required",
] as const;
export type RemainingMarkType = (typeof REMAINING_MARK_TYPES)[number];

export const REMAINING_MARK_LABEL: Record<RemainingMarkType, string> = {
  remaining_removable_stain: "Remaining removable stain",
  residual_pigment: "Residual pigment",
  residual_dye: "Residual dye",
  dye_loss: "Dye loss",
  fibre_damage: "Fibre damage",
  heat_damage: "Heat damage",
  chemical_damage: "Chemical damage",
  finish_damage: "Finish damage",
  coating_damage: "Coating damage",
  ring_or_residue: "Ring or residue",
  stain_and_damage_combination: "Combination of stain and damage",
  unknown: "Unknown",
  specialist_assessment_required: "Specialist assessment required",
};

export const NO_STRONGER_CHEMISTRY_NOTE =
  "Stronger chemistry is never recommended automatically for a remaining mark. A reviewer must diagnose the mark first.";

/* ------------------------------------------------------------------ */
/* 16. Repeat decision                                                 */
/* ------------------------------------------------------------------ */

export const REPEAT_DECISIONS = [
  "repeat_permitted", "repeat_permitted_after_review", "different_stage_may_be_considered",
  "do_not_repeat", "stop_and_escalate", "insufficient_information",
] as const;
export type RepeatDecision = (typeof REPEAT_DECISIONS)[number];

export const REPEAT_DECISION_LABEL: Record<RepeatDecision, string> = {
  repeat_permitted: "Repeat Permitted",
  repeat_permitted_after_review: "Repeat Permitted After Review",
  different_stage_may_be_considered: "Different Approved Stage May Be Considered",
  do_not_repeat: "Do Not Repeat",
  stop_and_escalate: "Stop and Escalate",
  insufficient_information: "Insufficient Information",
};

/* ------------------------------------------------------------------ */
/* 17. Failure reasons (hypotheses only)                               */
/* ------------------------------------------------------------------ */

export const FAILURE_REASONS = [
  "incorrect_stain_identification", "combination_component_missed", "incorrect_fabric_assumption",
  "stain_aged", "stain_heat_set", "previous_treatment_altered_stain", "wrong_treatment_stage",
  "incompatible_product", "product_under_applied", "product_over_applied",
  "contact_time_insufficient", "contact_time_excessive", "temperature_incorrect",
  "mechanical_action_incorrect", "required_rinse_missing", "required_neutralization_missing",
  "product_expired_or_degraded", "product_version_mismatch", "equipment_limitation",
  "operator_deviation", "stain_is_permanent_pigment", "mark_is_dye_loss_or_damage",
  "manufacturer_claim_not_reproduced", "method_evidence_insufficient", "unknown",
] as const;
export type FailureReason = (typeof FAILURE_REASONS)[number];

export const FAILURE_REASON_LABEL: Record<FailureReason, string> = {
  incorrect_stain_identification: "Incorrect stain identification",
  combination_component_missed: "Combination component missed",
  incorrect_fabric_assumption: "Incorrect fabric assumption",
  stain_aged: "Stain aged",
  stain_heat_set: "Stain heat-set",
  previous_treatment_altered_stain: "Previous treatment altered stain",
  wrong_treatment_stage: "Wrong treatment stage",
  incompatible_product: "Incompatible product",
  product_under_applied: "Product under-applied",
  product_over_applied: "Product over-applied",
  contact_time_insufficient: "Contact time insufficient",
  contact_time_excessive: "Contact time excessive",
  temperature_incorrect: "Temperature incorrect",
  mechanical_action_incorrect: "Mechanical action incorrect",
  required_rinse_missing: "Required rinse missing",
  required_neutralization_missing: "Required neutralization missing",
  product_expired_or_degraded: "Product expired or degraded",
  product_version_mismatch: "Product version mismatch",
  equipment_limitation: "Equipment limitation",
  operator_deviation: "Operator deviation",
  stain_is_permanent_pigment: "Stain is permanent pigment",
  mark_is_dye_loss_or_damage: "Mark is dye loss or damage",
  manufacturer_claim_not_reproduced: "Manufacturer claim not reproduced",
  method_evidence_insufficient: "Method evidence insufficient",
  unknown: "Unknown",
};

export const FAILURE_HYPOTHESIS_NOTE =
  "Failure reasons remain hypotheses until a technical reviewer confirms them.";

/* ------------------------------------------------------------------ */
/* 18. Adverse-outcome severity                                        */
/* ------------------------------------------------------------------ */

export type AdverseSeverity = 1 | 2 | 3 | 4 | 5;

export const SEVERITY_LABEL: Record<AdverseSeverity, string> = {
  1: "Level 1 — No damage, method ineffective",
  2: "Level 2 — Reversible residue or ring suspected",
  3: "Level 3 — Possible colour, texture or finish change",
  4: "Level 4 — Confirmed garment damage",
  5: "Level 5 — Hazardous chemical reaction or exposure concern",
};

export type SeverityPolicy = {
  blockWorkflow: boolean;
  notifyRoles: string[];
  reviewPriority: "low" | "normal" | "high" | "immediate";
  suspensionThreshold: number;      // reports needed before suspension
  escalationRoute: string;
};

export const SEVERITY_POLICY: Record<AdverseSeverity, SeverityPolicy> = {
  1: { blockWorkflow: false, notifyRoles: ["content_admin"], reviewPriority: "low", suspensionThreshold: 8, escalationRoute: "Routine monitoring" },
  2: { blockWorkflow: false, notifyRoles: ["content_admin", "technical_reviewer"], reviewPriority: "normal", suspensionThreshold: 5, escalationRoute: "Technical review queue" },
  3: { blockWorkflow: true, notifyRoles: ["technical_reviewer"], reviewPriority: "high", suspensionThreshold: 3, escalationRoute: "Technical reviewer, priority queue" },
  4: { blockWorkflow: true, notifyRoles: ["technical_reviewer", "system_admin"], reviewPriority: "immediate", suspensionThreshold: 1, escalationRoute: "Immediate technical review and precautionary suspension" },
  5: { blockWorkflow: true, notifyRoles: ["technical_reviewer", "system_admin"], reviewPriority: "immediate", suspensionThreshold: 1, escalationRoute: "Safety reviewer, immediate suspension pending review" },
};

/* ------------------------------------------------------------------ */
/* 19. Adverse-outcome record                                          */
/* ------------------------------------------------------------------ */

export const INVESTIGATION_STATUSES = [
  "open", "under_investigation", "awaiting_information", "concluded", "closed",
] as const;
export type InvestigationStatus = (typeof INVESTIGATION_STATUSES)[number];

export type AdverseOutcomeRecord = {
  adverseId: string;
  outcomeId: string;
  severity: AdverseSeverity;
  caseVersion: number;
  treatmentVersionKey?: string;
  productKey?: string;
  productBatch?: string;
  operator: string;
  garmentDescription: string;
  stainKey: string;
  approvedMethodKey?: string;
  actualMethodSummary: string;
  deviation: ComplianceResult;
  immediateSymptoms: InspectionObservation[];
  damageTypes: RemainingMarkType[];
  photos: string[];
  requiredFirstResponse: string;
  escalationRoute: string;
  reviewer?: string;
  investigationStatus: InvestigationStatus;
  rootCauseConclusion?: RootCauseConclusion;
  correctiveActions: CorrectiveAction[];
  closureDate?: string;
  /** Adverse records may be corrected but never deleted. */
  deletable: false;
};

/* ------------------------------------------------------------------ */
/* 20. Review triggers                                                 */
/* ------------------------------------------------------------------ */

export const OUTCOME_REVIEW_TRIGGERS = [
  "garment_damage_reported", "hazardous_reaction", "method_repeatedly_underperforms",
  "product_repeatedly_causes_rings", "product_fabric_damage_pattern",
  "manufacturer_claim_not_reproduced", "outcome_differs_by_product_version",
  "product_batch_issue_suspected", "translation_may_have_caused_misuse",
  "step_repeatedly_skipped", "stop_condition_insufficient", "domestic_adverse_report",
] as const;
export type OutcomeReviewTrigger = (typeof OUTCOME_REVIEW_TRIGGERS)[number];

export const OUTCOME_TRIGGER_LABEL: Record<OutcomeReviewTrigger, string> = {
  garment_damage_reported: "Garment damage reported",
  hazardous_reaction: "Hazardous reaction occurred",
  method_repeatedly_underperforms: "Same method repeatedly underperforms",
  product_repeatedly_causes_rings: "Same product repeatedly causes rings",
  product_fabric_damage_pattern: "Same product-fabric combination shows damage",
  manufacturer_claim_not_reproduced: "Manufacturer claim repeatedly not reproduced",
  outcome_differs_by_product_version: "Outcome differs significantly by product version",
  product_batch_issue_suspected: "Product batch issue suspected",
  translation_may_have_caused_misuse: "Translation may have caused misuse",
  step_repeatedly_skipped: "Users repeatedly skip or misunderstand a step",
  stop_condition_insufficient: "Existing stop condition is insufficient",
  domestic_adverse_report: "Domestic method received a credible adverse report",
};

/* ------------------------------------------------------------------ */
/* 21. Thresholds and monitoring                                       */
/* ------------------------------------------------------------------ */

export const MONITORING_ACTIONS = [
  "monitor", "send_for_review", "mark_needs_review", "suspend_mapping",
  "suspend_domestic_method", "suspend_ranking", "suspend_product_instructions",
  "notify_safety_reviewer",
] as const;
export type MonitoringAction = (typeof MONITORING_ACTIONS)[number];

export const MONITORING_ACTION_LABEL: Record<MonitoringAction, string> = {
  monitor: "Monitor",
  send_for_review: "Send for review",
  mark_needs_review: "Mark Needs Review",
  suspend_mapping: "Suspend mapping",
  suspend_domestic_method: "Suspend domestic method",
  suspend_ranking: "Suspend ranking",
  suspend_product_instructions: "Suspend product instructions",
  notify_safety_reviewer: "Notify safety reviewer",
};

export type ThresholdScope =
  | "treatment_record" | "product_mapping" | "product_version"
  | "stain_fabric_combination" | "country" | "organization" | "outcome_type";

export type OutcomeThreshold = {
  key: string;
  scope: ThresholdScope;
  scopeValue: string;
  outcomeTypes: OutcomeClassification[];
  count: number;
  periodDays: number;
  action: MonitoringAction;
  /** Minimum severity that bypasses the count and acts immediately. */
  immediateSeverity?: AdverseSeverity;
  note: string;
};

export const DEFAULT_THRESHOLDS: OutcomeThreshold[] = [
  {
    key: "thr_damage_any", scope: "product_mapping", scopeValue: "*",
    outcomeTypes: ["fibre_damage", "texture_damage", "shrinkage_or_distortion", "finish_or_coating_damage", "adhesive_or_decoration_damage"],
    count: 2, periodDays: 180, action: "suspend_mapping", immediateSeverity: 4,
    note: "Confirmed garment damage suspends the mapping pending review.",
  },
  {
    key: "thr_hazard", scope: "product_version", scopeValue: "*",
    outcomeTypes: ["hazardous_reaction"], count: 1, periodDays: 365,
    action: "notify_safety_reviewer", immediateSeverity: 5,
    note: "A hazardous reaction is escalated immediately and suspends live guidance pending review.",
  },
  {
    key: "thr_rings", scope: "product_version", scopeValue: "*",
    outcomeTypes: ["ring_formed"], count: 3, periodDays: 180, action: "send_for_review",
    note: "Repeated ring formation on the same product version is reviewed.",
  },
  {
    key: "thr_no_change", scope: "treatment_record", scopeValue: "*",
    outcomeTypes: ["no_meaningful_change"], count: 5, periodDays: 180, action: "mark_needs_review",
    note: "Repeated ineffectiveness marks the method Needs Review.",
  },
  {
    key: "thr_domestic_adverse", scope: "treatment_record", scopeValue: "domestic",
    outcomeTypes: ["dye_loss", "fibre_damage", "hazardous_reaction"], count: 1, periodDays: 365,
    action: "suspend_domestic_method", immediateSeverity: 4,
    note: "A credible domestic adverse report suspends the domestic method pending review.",
  },
];

export const LOW_QUALITY_REPORT_NOTE =
  "A single low-quality anonymous report does not suspend guidance unless the severity justifies immediate precaution.";

/* ------------------------------------------------------------------ */
/* 22. Root-cause review                                               */
/* ------------------------------------------------------------------ */

export const ROOT_CAUSE_QUESTIONS = [
  "Was the case classified correctly?",
  "Was the garment assessed correctly?",
  "Was the product version correct?",
  "Were documents current?",
  "Was the approved method followed?",
  "Was a required test completed?",
  "Were PPE and equipment appropriate?",
  "Was previous chemistry known?",
  "Was rinsing or neutralization completed?",
  "Did the product perform as documented?",
  "Was the mark actually damage?",
  "Is the rule or instruction unclear?",
  "Is additional controlled testing required?",
] as const;

export const ROOT_CAUSE_CONCLUSIONS = [
  "method_valid", "user_deviation", "product_mismatch", "documentation_problem",
  "classification_problem", "safety_rule_gap", "product_performance_concern",
  "translation_problem", "training_problem", "garment_specific_limitation", "inconclusive",
] as const;
export type RootCauseConclusion = (typeof ROOT_CAUSE_CONCLUSIONS)[number];

export const ROOT_CAUSE_LABEL: Record<RootCauseConclusion, string> = {
  method_valid: "Method Valid",
  user_deviation: "User Deviation",
  product_mismatch: "Product Mismatch",
  documentation_problem: "Documentation Problem",
  classification_problem: "Classification Problem",
  safety_rule_gap: "Safety Rule Gap",
  product_performance_concern: "Product Performance Concern",
  translation_problem: "Translation Problem",
  training_problem: "Training Problem",
  garment_specific_limitation: "Garment-Specific Limitation",
  inconclusive: "Inconclusive",
};

/* ------------------------------------------------------------------ */
/* 23. Corrective actions                                              */
/* ------------------------------------------------------------------ */

export const CORRECTIVE_ACTIONS = [
  "no_change", "clarify_wording", "add_warning", "add_required_question",
  "add_fabric_restriction", "add_colour_restriction", "add_construction_restriction",
  "change_risk_level", "require_testing", "change_role_requirement",
  "add_equipment_or_ppe", "suspend_domestic_treatment", "suspend_product_mapping",
  "suspend_ranking", "request_manufacturer_clarification", "request_new_sds_tds",
  "conduct_controlled_trial", "add_training_module", "retire_method",
] as const;
export type CorrectiveActionKey = (typeof CORRECTIVE_ACTIONS)[number];

export const CORRECTIVE_ACTION_LABEL: Record<CorrectiveActionKey, string> = {
  no_change: "No change",
  clarify_wording: "Clarify wording",
  add_warning: "Add warning",
  add_required_question: "Add required question",
  add_fabric_restriction: "Add fabric restriction",
  add_colour_restriction: "Add colour restriction",
  add_construction_restriction: "Add construction restriction",
  change_risk_level: "Change risk level",
  require_testing: "Require testing",
  change_role_requirement: "Change user-role requirement",
  add_equipment_or_ppe: "Add equipment or PPE requirement",
  suspend_domestic_treatment: "Suspend domestic treatment",
  suspend_product_mapping: "Suspend product mapping",
  suspend_ranking: "Suspend ranking",
  request_manufacturer_clarification: "Request manufacturer clarification",
  request_new_sds_tds: "Request new SDS/TDS",
  conduct_controlled_trial: "Conduct controlled trial",
  add_training_module: "Add training module",
  retire_method: "Retire method",
};

export type CorrectiveAction = {
  key: CorrectiveActionKey;
  detail: string;
  proposedBy: string;
  approvalStatus: "proposed" | "under_review" | "approved" | "rejected";
  approver?: string;
  approvedAt?: string;
  affectsLiveGuidance: boolean;
};

export const CORRECTIVE_APPROVAL_NOTE =
  "A corrective action affects live guidance only after the applicable approval workflow is completed.";

/* ------------------------------------------------------------------ */
/* 24. Evidence promotion                                              */
/* ------------------------------------------------------------------ */

export const EVIDENCE_STAGES = [
  "raw_report", "validated_case", "professional_observation",
  "controlled_internal_trial", "repeated_controlled_evidence", "approved_evidence",
] as const;
export type EvidenceStage = (typeof EVIDENCE_STAGES)[number];

export const EVIDENCE_STAGE_LABEL: Record<EvidenceStage, string> = {
  raw_report: "Raw Report",
  validated_case: "Validated Case",
  professional_observation: "Professional Observation",
  controlled_internal_trial: "Controlled Internal Trial",
  repeated_controlled_evidence: "Repeated Controlled Evidence",
  approved_evidence: "Approved Evidence",
};

export const EVIDENCE_STAGE_RANK: Record<EvidenceStage, number> = {
  raw_report: 0, validated_case: 1, professional_observation: 2,
  controlled_internal_trial: 3, repeated_controlled_evidence: 4, approved_evidence: 5,
};

export type EvidencePromotion = {
  outcomeId: string;
  fromStage: EvidenceStage;
  toStage: EvidenceStage;
  reviewer: string;
  decision: "promoted" | "rejected";
  reason: string;
  at: string;
};

export const RAW_REPORT_NOTE =
  "A raw report can never become an approved instruction directly. Each promotion step needs a reviewer decision.";

/* ------------------------------------------------------------------ */
/* 25/26. Metrics and comparability                                    */
/* ------------------------------------------------------------------ */

export const COMPARABILITY_KEYS = [
  "same_stain_or_variant", "same_fabric_family", "similar_colour_condition",
  "similar_stain_age", "same_product_version", "same_method_version",
  "same_treatment_stage", "similar_cleaning_process", "same_outcome_definition",
  "post_drying_available",
] as const;
export type OutcomeComparabilityKey = (typeof COMPARABILITY_KEYS)[number];

export const OUTCOME_COMPARABILITY_LABEL: Record<OutcomeComparabilityKey, string> = {
  same_stain_or_variant: "Same stain or variant",
  same_fabric_family: "Same fabric family",
  similar_colour_condition: "Similar colour condition",
  similar_stain_age: "Similar stain age",
  same_product_version: "Same product version",
  same_method_version: "Same treatment method version",
  same_treatment_stage: "Same treatment stage",
  similar_cleaning_process: "Similar cleaning process",
  same_outcome_definition: "Same outcome definition",
  post_drying_available: "Post-drying inspection available",
};

/** Below this sample size, percentages are always shown with a warning. */
export const MINIMUM_PUBLISHABLE_SAMPLE = 10;

export const SMALL_SAMPLE_WARNING =
  "Sample size is small. These percentages are indicative only and must not be used as verified performance evidence.";

export const NON_COMPARABLE_WARNING =
  "These cases are not comparable. Outcomes are listed individually and are not aggregated.";

/* ------------------------------------------------------------------ */
/* 30. Customer-facing summary                                         */
/* ------------------------------------------------------------------ */

export type CustomerSummary = {
  stainResult: string;
  remainingMark: string;
  observedGarmentChange: string;
  treatmentStopped: string;
  furtherTreatment: string;
  expectedPermanence: string;
  careRecommendation: string;
  date: string;
};

/* ------------------------------------------------------------------ */
/* 31. Case closure                                                    */
/* ------------------------------------------------------------------ */

export const CLOSURE_STATES = [
  "completed_successfully", "completed_with_reduction", "closed_with_pigment_remaining",
  "closed_as_dye_loss", "closed_as_fibre_damage", "closed_as_finish_damage",
  "stopped_for_safety", "escalated", "customer_declined_further_treatment", "closed_unresolved",
] as const;
export type ClosureState = (typeof CLOSURE_STATES)[number];

export const CLOSURE_LABEL: Record<ClosureState, string> = {
  completed_successfully: "Completed Successfully",
  completed_with_reduction: "Completed with Reduction",
  closed_with_pigment_remaining: "Closed with Pigment Remaining",
  closed_as_dye_loss: "Closed as Dye Loss",
  closed_as_fibre_damage: "Closed as Fibre Damage",
  closed_as_finish_damage: "Closed as Finish Damage",
  stopped_for_safety: "Stopped for Safety",
  escalated: "Escalated",
  customer_declined_further_treatment: "Customer Declined Further Treatment",
  closed_unresolved: "Closed Unresolved",
};

/* ------------------------------------------------------------------ */
/* 29. Neutral feedback questions                                      */
/* ------------------------------------------------------------------ */

export const NEUTRAL_QUESTIONS = [
  "What changed?",
  "Was the stain reduced?",
  "Did the garment colour change?",
  "Did the texture change?",
  "Was the garment inspected after drying?",
  "Did you follow every listed step?",
] as const;

/* ------------------------------------------------------------------ */
/* The outcome record                                                  */
/* ------------------------------------------------------------------ */

export type OutcomeRecord = {
  outcomeId: string;
  version: number;
  recordType: OutcomeRecordType;
  context: OutcomeContext;
  baseline: PreTreatmentBaseline;
  attempts: AttemptRecord[];
  approvedMethod?: ApprovedMethodSnapshot;
  immediate: Inspection;
  postRinse?: PostRinseInspection;
  postDrying?: PostDryingInspection;
  followUp?: DelayedFollowUp;
  remainingMark?: RemainingMarkType;
  failureHypotheses: FailureReason[];
  evidenceStage: EvidenceStage;
  closure?: ClosureState;
  closureExceptionReason?: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
  /** Offline capture support. */
  clientRecordKey: string;
  syncState: "local_draft" | "queued" | "synced";
  /** Correction chain — the original entry is preserved. */
  correctsOutcomeId?: string;
  superseded: boolean;
};

export type OutcomeAudit = {
  id: string;
  at: string;
  outcomeId: string;
  user: string;
  action: string;
  field?: string;
  previousValue?: string;
  newValue?: string;
  reason: string;
};

/* ------------------------------------------------------------------ */
/* 33. Privacy                                                         */
/* ------------------------------------------------------------------ */

export const PRIVATE_FIELDS = [
  "customerName", "customerContact", "photos", "operator", "organizationKey", "localPrice",
];

export const PHOTO_RETENTION_DAYS = 365;

export const PRIVACY_NOTE =
  "Customer identity, photographs, organization and employee performance data are restricted. Technical analysis uses anonymized records.";

/* ------------------------------------------------------------------ */
/* 34. Offline                                                         */
/* ------------------------------------------------------------------ */

export const SAFETY_ENGINE_UNAVAILABLE_MESSAGE =
  "The safety engine cannot be reached. Progression to another treatment stage is blocked until it is available.";
