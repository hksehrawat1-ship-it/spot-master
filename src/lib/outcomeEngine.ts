/**
 * STEP 14 — outcome engine: compliance checking, safety stop, controlled
 * classification, expectation comparison, repeat decisions, severity, review
 * triggers, evidence promotion, metrics and closure control.
 *
 * Deterministic and explainable: every decision returns its reasons.
 */

import {
  DAMAGE_OBSERVATIONS, HAZARD_OBSERVATIONS, IMPROVEMENT_OBSERVATIONS,
  DAMAGE_CLASSIFICATIONS, IMPROVEMENT_RANK, SEVERITY_POLICY, SAFETY_STOP_MESSAGE,
  SIMULATION_RECORD_TYPES, MINIMUM_PUBLISHABLE_SAMPLE, SMALL_SAMPLE_WARNING,
  NON_COMPARABLE_WARNING, EVIDENCE_STAGE_RANK, DEFAULT_THRESHOLDS,
  REQUIRED_BASELINE_PHOTOS, CLASSIFICATION_LABEL, REMAINING_MARK_LABEL,
  SAFETY_ENGINE_UNAVAILABLE_MESSAGE, COMPARABILITY_KEYS,
} from "@/data/outcomes";
import type {
  AttemptRecord, ApprovedMethodSnapshot, ComplianceResult, Inspection,
  OutcomeClassification, OutcomeRecord, OutcomeRecordType, PostDryingInspection,
  PostRinseInspection, RepeatDecision, SafetyStop, AdverseSeverity, EvidenceStage,
  OutcomeReviewTrigger, OutcomeThreshold, MonitoringAction, ExpectationComparison,
  PreTreatmentBaseline, ClosureState, CustomerSummary, OutcomeComparabilityKey,
  RemainingMarkType, InspectionObservation,
} from "@/data/outcomes";

export const OUTCOME_ENGINE_VERSION = "outcome-engine-v1.0.0";

const has = (i: Inspection | undefined, o: InspectionObservation) => !!i?.observations.includes(o);
const anyOf = (i: Inspection | undefined, list: InspectionObservation[]) =>
  !!i?.observations.some((o) => list.includes(o));

/* ------------------------------------------------------------------ */
/* 5. Baseline validation                                              */
/* ------------------------------------------------------------------ */

export type BaselineCheck = { complete: boolean; missing: string[] };

export function checkBaseline(b: PreTreatmentBaseline): BaselineCheck {
  const missing: string[] = [];
  for (const p of REQUIRED_BASELINE_PHOTOS) if (!b.photos[p]) missing.push(`Photograph: ${p.replace(/_/g, " ")}`);
  if (!b.stainSize.trim()) missing.push("Stain dimensions or size category");
  if (!b.stainColour.trim()) missing.push("Stain colour");
  if (!b.garmentColour.trim()) missing.push("Garment colour");
  if (!b.operatorConfirmed) missing.push("Operator confirmation");
  return { complete: missing.length === 0, missing };
}

/** Pre-existing damage recorded at baseline is never attributed to the treatment. */
export function preExistingFindings(b: PreTreatmentBaseline): string[] {
  const out = [...b.existingDamage];
  if (b.existingRing) out.push("Ring present before treatment");
  if (b.existingDyeLoss) out.push("Dye loss present before treatment");
  if (b.existingTextureChange) out.push("Texture change present before treatment");
  if (b.existingOdour) out.push("Odour present before treatment");
  return out;
}

/* ------------------------------------------------------------------ */
/* 7. Method compliance                                                */
/* ------------------------------------------------------------------ */

export type ComplianceReport = {
  results: ComplianceResult[];
  primary: ComplianceResult;
  materiallyChanged: boolean;
  detail: string[];
};

export function checkCompliance(
  attempt: AttemptRecord,
  approved?: ApprovedMethodSnapshot,
  ppeUsed: string[] = [],
): ComplianceReport {
  if (!approved) {
    return {
      results: ["insufficient_information"], primary: "insufficient_information",
      materiallyChanged: false, detail: ["No approved method snapshot was stored for this attempt."],
    };
  }
  const results: ComplianceResult[] = [];
  const detail: string[] = [];

  if (approved.productVersionKey && attempt.productVersionKey !== approved.productVersionKey) {
    results.push("product_version_mismatch");
    detail.push(`Recorded product version ${attempt.productVersionKey ?? "unknown"} differs from the approved ${approved.productVersionKey}.`);
  }
  const skipped = approved.requiredSteps.filter(
    (s) => !attempt.action.includes(s) && !attempt.technique?.includes(s) && !attempt.equipment.includes(s),
  );
  if (skipped.length && attempt.deviations.some((d) => skipped.some((s) => d.includes(s)))) {
    results.push("required_step_skipped");
    detail.push(`Required step(s) not recorded: ${skipped.join(", ")}.`);
  }
  if (approved.quantity && attempt.quantity && attempt.quantity !== approved.quantity) {
    results.push("quantity_dilution_mismatch");
    detail.push(`Quantity ${attempt.quantity} differs from approved ${approved.quantity}.`);
  }
  if (approved.dilution && attempt.dilution && attempt.dilution !== approved.dilution) {
    if (!results.includes("quantity_dilution_mismatch")) results.push("quantity_dilution_mismatch");
    detail.push(`Dilution ${attempt.dilution} differs from approved ${approved.dilution}.`);
  }
  if (approved.contactTime && attempt.contactTime && attempt.contactTime !== approved.contactTime) {
    results.push("contact_time_mismatch");
    detail.push(`Contact time ${attempt.contactTime} differs from approved ${approved.contactTime}.`);
  }
  if (approved.temperature && attempt.temperature && attempt.temperature !== approved.temperature) {
    results.push("temperature_mismatch");
    detail.push(`Temperature ${attempt.temperature} differs from approved ${approved.temperature}.`);
  }
  if (approved.rinseRequired && attempt.rinsingPerformed !== "yes") {
    results.push("required_rinse_missing");
    detail.push("The approved method requires rinsing and rinsing was not confirmed.");
  }
  if (approved.neutralizationRequired && attempt.neutralizationPerformed !== "yes") {
    results.push("required_neutralization_missing");
    detail.push("The approved method requires neutralization and it was not confirmed.");
  }
  const missingPpe = approved.requiredPpe.filter((p) => !ppeUsed.includes(p));
  if (missingPpe.length) {
    results.push("ppe_requirement_not_met");
    detail.push(`PPE not recorded: ${missingPpe.join(", ")}.`);
  }
  const missingEquipment = approved.requiredEquipment.filter((e) => !attempt.equipment.includes(e));
  if (missingEquipment.length) {
    results.push("equipment_requirement_not_met");
    detail.push(`Equipment not recorded: ${missingEquipment.join(", ")}.`);
  }
  if (attempt.deviations.length && !results.length) {
    results.push(attempt.deviationReason ? "minor_documented_deviation" : "major_deviation");
    detail.push(attempt.deviationReason
      ? `Documented deviation: ${attempt.deviations.join(", ")} — ${attempt.deviationReason}`
      : `Undocumented deviation: ${attempt.deviations.join(", ")}`);
  }
  if (!results.length) {
    results.push("followed_as_approved");
    detail.push("The recorded attempt matches the approved method.");
  }

  const materiallyChanged = results.some((r) =>
    ["major_deviation", "required_step_skipped", "product_version_mismatch",
      "required_rinse_missing", "required_neutralization_missing",
      "quantity_dilution_mismatch", "contact_time_mismatch", "temperature_mismatch"].includes(r));

  return { results, primary: results[0], materiallyChanged, detail };
}

/* ------------------------------------------------------------------ */
/* 9. Safety stop                                                      */
/* ------------------------------------------------------------------ */

export function evaluateSafetyStop(immediate: Inspection, severityHint?: AdverseSeverity): SafetyStop {
  const hazard = anyOf(immediate, HAZARD_OBSERVATIONS);
  const damage = anyOf(immediate, DAMAGE_OBSERVATIONS);
  if (!hazard && !damage) {
    return {
      stopped: false, blockRepetition: false, blockNextChemicalStage: false, blockHeat: false,
      escalationRequired: false, notifyRoles: [], adverseRecordRequired: false, casePreserved: true,
    };
  }
  const severity: AdverseSeverity = severityHint ?? (hazard ? 5 : 4);
  return {
    stopped: true,
    message: SAFETY_STOP_MESSAGE,
    blockRepetition: true,
    blockNextChemicalStage: true,
    blockHeat: true,
    escalationRequired: true,
    notifyRoles: SEVERITY_POLICY[severity].notifyRoles,
    adverseRecordRequired: true,
    casePreserved: true,
  };
}

/* ------------------------------------------------------------------ */
/* 13. Controlled classification                                       */
/* ------------------------------------------------------------------ */

export type ClassificationResult = {
  classification: OutcomeClassification;
  reasons: string[];
  damageObserved: boolean;
  finalStageReached: boolean;
};

export function classifyOutcome(
  immediate: Inspection,
  postRinse: PostRinseInspection | undefined,
  postDrying: PostDryingInspection | undefined,
  baseline: PreTreatmentBaseline,
): ClassificationResult {
  const reasons: string[] = [];
  const pre = preExistingFindings(baseline);
  if (pre.length) reasons.push(`Pre-existing findings excluded from attribution: ${pre.join("; ")}.`);

  if (anyOf(immediate, HAZARD_OBSERVATIONS)) {
    return { classification: "hazardous_reaction", reasons: [...reasons, "A hazardous reaction was reported."], damageObserved: true, finalStageReached: true };
  }

  // Damage anywhere in the chain outranks stain improvement.
  const dryDamage: OutcomeClassification[] = [];
  if (postDrying) {
    if (postDrying.colourChanged) dryDamage.push("dye_loss");
    if (postDrying.textureChanged) dryDamage.push("texture_damage");
    if (postDrying.shrinkage || postDrying.distortion) dryDamage.push("shrinkage_or_distortion");
    if (postDrying.coatingCondition && /damag|lift|soft|separat/i.test(postDrying.coatingCondition)) dryDamage.push("finish_or_coating_damage");
    if (postDrying.decorationCondition && /loose|damag|lift/i.test(postDrying.decorationCondition)) dryDamage.push("adhesive_or_decoration_damage");
  }
  const immediateDamage: OutcomeClassification[] = [];
  if (has(immediate, "fibre_weakened")) immediateDamage.push("fibre_damage");
  if (has(immediate, "colour_lightened") && !baseline.existingDyeLoss) immediateDamage.push("dye_loss");
  if (has(immediate, "dye_transferred")) immediateDamage.push("dye_bleeding");
  if (has(immediate, "colour_darkened")) immediateDamage.push("dye_bleeding");
  if (has(immediate, "texture_changed") && !baseline.existingTextureChange) immediateDamage.push("texture_damage");
  if (has(immediate, "shrinkage") || has(immediate, "distortion")) immediateDamage.push("shrinkage_or_distortion");
  if (has(immediate, "coating_softened") || has(immediate, "coating_lifted") || has(immediate, "lamination_separated"))
    immediateDamage.push("finish_or_coating_damage");
  if (has(immediate, "adhesive_loosened") || has(immediate, "decoration_changed"))
    immediateDamage.push("adhesive_or_decoration_damage");

  const damage = [...immediateDamage, ...dryDamage];
  if (damage.length) {
    reasons.push("Garment damage was observed, so the result cannot be classified as successful.");
    return { classification: damage[0], reasons, damageObserved: true, finalStageReached: !!postDrying };
  }

  if (has(immediate, "user_uncertain") && !postDrying) {
    return { classification: "inconclusive", reasons: [...reasons, "The inspection was reported as uncertain."], damageObserved: false, finalStageReached: false };
  }
  if (has(immediate, "stain_spread")) {
    return { classification: "stain_spread", reasons: [...reasons, "The stain spread during treatment."], damageObserved: false, finalStageReached: !!postDrying };
  }
  if (has(immediate, "ring_appeared") || has(immediate, "ring_worsened") || postDrying?.ring) {
    return { classification: "ring_formed", reasons: [...reasons, "A ring was recorded."], damageObserved: false, finalStageReached: !!postDrying };
  }
  if (postRinse && (postRinse.productRemovalUncertain || postRinse.requiredProcessCompleted === "no")) {
    return {
      classification: "odour_or_residue_concern",
      reasons: [...reasons, "Required product removal could not be confirmed after rinsing."],
      damageObserved: false, finalStageReached: false,
    };
  }
  if (!postDrying) {
    return {
      classification: "not_inspected_after_drying",
      reasons: [...reasons, "Wet appearance alone cannot determine the final result. Post-drying inspection is required."],
      damageObserved: false, finalStageReached: false,
    };
  }
  if (postDrying.residue || postDrying.odour) {
    return { classification: "odour_or_residue_concern", reasons: [...reasons, "Residue or odour remained after drying."], damageObserved: false, finalStageReached: true };
  }

  const result = postDrying.stainResult;
  if (result === "stain_removed")
    return { classification: "successful_without_observed_damage", reasons: [...reasons, "Stain removed and no damage observed after drying."], damageObserved: false, finalStageReached: true };
  if (result === "major_reduction")
    return { classification: "major_reduction_without_damage", reasons, damageObserved: false, finalStageReached: true };
  if (result === "moderate_reduction")
    return { classification: "moderate_reduction_without_damage", reasons, damageObserved: false, finalStageReached: true };
  if (result === "minor_reduction")
    return { classification: "minor_reduction_without_damage", reasons, damageObserved: false, finalStageReached: true };
  if (result === "pigment_remains")
    return { classification: "pigment_remains", reasons, damageObserved: false, finalStageReached: true };
  return { classification: "no_meaningful_change", reasons, damageObserved: false, finalStageReached: true };
}

/* ------------------------------------------------------------------ */
/* 14. Expected vs actual                                              */
/* ------------------------------------------------------------------ */

export function compareToExpectation(
  approved: ApprovedMethodSnapshot | undefined,
  actual: OutcomeClassification,
  compliance: ComplianceReport,
  finalStageReached: boolean,
): { result: ExpectationComparison; note: string } {
  if (!approved) return { result: "insufficient_information", note: "No approved expected result was stored." };
  if (compliance.materiallyChanged)
    return { result: "invalid_comparison", note: "The approved method was materially changed, so the comparison is not valid." };
  if (DAMAGE_CLASSIFICATIONS.includes(actual))
    return { result: "unexpected_damage", note: "Damage was recorded and is treated as an unexpected outcome pending review." };
  if (!finalStageReached)
    return { result: "insufficient_information", note: "Post-drying inspection is not yet available." };

  const exp = IMPROVEMENT_RANK[approved.expectedResult];
  const act = IMPROVEMENT_RANK[actual];
  if (exp === undefined || act === undefined)
    return { result: "insufficient_information", note: "The expected or actual result is not on the comparable improvement scale." };
  if (act > exp) return { result: "exceeded_expectation", note: `Actual ${CLASSIFICATION_LABEL[actual]} exceeded the expected result.` };
  if (act === exp) return { result: "met_expectation", note: `Actual result matched the expected ${CLASSIFICATION_LABEL[approved.expectedResult]}.` };
  return { result: "below_expectation", note: `Actual ${CLASSIFICATION_LABEL[actual]} was below the expected ${CLASSIFICATION_LABEL[approved.expectedResult]}.` };
}

/* ------------------------------------------------------------------ */
/* 15. Remaining-mark diagnosis                                        */
/* ------------------------------------------------------------------ */

export function remainingMarkGuidance(mark?: RemainingMarkType): string {
  if (!mark) return "No remaining mark has been diagnosed by a reviewer.";
  const specialist: RemainingMarkType[] = [
    "fibre_damage", "heat_damage", "chemical_damage", "finish_damage", "coating_damage",
    "specialist_assessment_required", "unknown",
  ];
  if (specialist.includes(mark))
    return `${REMAINING_MARK_LABEL[mark]} — this is a damage or unknown diagnosis. Further chemistry is not recommended; specialist assessment applies.`;
  return `${REMAINING_MARK_LABEL[mark]} — any further treatment must follow an approved stage. Stronger chemistry is not recommended automatically.`;
}

/* ------------------------------------------------------------------ */
/* 16. Repeat decision                                                 */
/* ------------------------------------------------------------------ */

export type RepeatInput = {
  approved?: ApprovedMethodSnapshot;
  attemptsMade: number;
  compliance: ComplianceReport;
  classification: OutcomeClassification;
  damageObserved: boolean;
  postRinse?: PostRinseInspection;
  productVersionApplicable: boolean;
  roleAndEquipmentValid: boolean;
  safetyEngineAuthorizes: boolean | "unavailable";
};

export function decideRepeat(i: RepeatInput): { decision: RepeatDecision; reasons: string[] } {
  const reasons: string[] = [];
  if (i.classification === "hazardous_reaction" || i.damageObserved) {
    return { decision: "stop_and_escalate", reasons: ["Damage or a hazardous reaction was recorded. Repetition and further chemistry are blocked."] };
  }
  if (i.safetyEngineAuthorizes === "unavailable")
    return { decision: "insufficient_information", reasons: [SAFETY_ENGINE_UNAVAILABLE_MESSAGE] };
  if (!i.approved) return { decision: "insufficient_information", reasons: ["No approved method snapshot is available."] };
  if (!i.safetyEngineAuthorizes) return { decision: "do_not_repeat", reasons: ["The safety engine does not authorize repetition for this case."] };
  if (!i.approved.repetitionPermitted) {
    reasons.push("The approved method does not permit repetition.");
    return { decision: "different_stage_may_be_considered", reasons };
  }
  if (i.approved.maximumAttempts !== undefined && i.attemptsMade >= i.approved.maximumAttempts)
    return { decision: "do_not_repeat", reasons: [`The documented maximum of ${i.approved.maximumAttempts} attempt(s) has been reached.`] };
  if (i.approved.rinseRequired && i.postRinse?.requiredProcessCompleted !== "yes")
    return { decision: "do_not_repeat", reasons: ["The required rinse was not confirmed as completed."] };
  if (i.approved.neutralizationRequired && !i.postRinse?.completionConfirmed)
    return { decision: "do_not_repeat", reasons: ["The required neutralization was not confirmed as completed."] };
  if (!i.productVersionApplicable) return { decision: "repeat_permitted_after_review", reasons: ["The recorded product version is no longer applicable."] };
  if (!i.roleAndEquipmentValid) return { decision: "repeat_permitted_after_review", reasons: ["User role or equipment conditions have changed."] };
  if (i.compliance.materiallyChanged) return { decision: "repeat_permitted_after_review", reasons: ["A material deviation from the approved method was recorded."] };
  if (i.classification === "inconclusive") return { decision: "insufficient_information", reasons: ["The inspection result is inconclusive."] };
  return { decision: "repeat_permitted", reasons: ["Inspection found no damage, required processes were completed and the approved method permits repetition."] };
}

/* ------------------------------------------------------------------ */
/* 18/19. Severity and adverse handling                                */
/* ------------------------------------------------------------------ */

export function deriveSeverity(
  classification: OutcomeClassification,
  immediate: Inspection,
  postRinse?: PostRinseInspection,
): AdverseSeverity {
  if (classification === "hazardous_reaction" || anyOf(immediate, HAZARD_OBSERVATIONS)) return 5;
  if (["fibre_damage", "shrinkage_or_distortion", "adhesive_or_decoration_damage", "dye_loss", "dye_bleeding"].includes(classification)) return 4;
  if (["texture_damage", "finish_or_coating_damage"].includes(classification)) return 3;
  if (classification === "ring_formed" || classification === "odour_or_residue_concern" || postRinse?.residueVisible) return 2;
  return 1;
}

/* ------------------------------------------------------------------ */
/* 20/21. Review triggers and thresholds                               */
/* ------------------------------------------------------------------ */

export function reviewTriggersFor(
  record: OutcomeRecord,
  classification: OutcomeClassification,
  compliance: ComplianceReport,
  history: { classification: OutcomeClassification; productVersionKey?: string; recordType: OutcomeRecordType }[] = [],
): OutcomeReviewTrigger[] {
  const t = new Set<OutcomeReviewTrigger>();
  if (DAMAGE_CLASSIFICATIONS.includes(classification) && classification !== "hazardous_reaction") t.add("garment_damage_reported");
  if (classification === "hazardous_reaction") t.add("hazardous_reaction");
  if (record.recordType === "domestic_attempt" && DAMAGE_CLASSIFICATIONS.includes(classification)) t.add("domestic_adverse_report");
  if (compliance.results.includes("required_step_skipped")) t.add("step_repeatedly_skipped");
  if (compliance.results.includes("product_version_mismatch")) t.add("outcome_differs_by_product_version");
  if (record.context.productBatch && DAMAGE_CLASSIFICATIONS.includes(classification)) t.add("product_batch_issue_suspected");

  const live = history.filter((h) => !SIMULATION_RECORD_TYPES.includes(h.recordType));
  const noChange = live.filter((h) => h.classification === "no_meaningful_change").length;
  if (noChange >= 3) t.add("method_repeatedly_underperforms");
  const rings = live.filter((h) => h.classification === "ring_formed").length;
  if (rings >= 3) t.add("product_repeatedly_causes_rings");
  const damageHistory = live.filter((h) => DAMAGE_CLASSIFICATIONS.includes(h.classification)).length;
  if (damageHistory >= 2) t.add("product_fabric_damage_pattern");
  if (noChange >= 5) t.add("manufacturer_claim_not_reproduced");
  return [...t];
}

export type ThresholdOutcome = {
  threshold: OutcomeThreshold;
  matched: number;
  action: MonitoringAction;
  immediate: boolean;
  note: string;
};

export function evaluateThresholds(
  classification: OutcomeClassification,
  severity: AdverseSeverity,
  history: { classification: OutcomeClassification; recordType: OutcomeRecordType; anonymousLowQuality?: boolean }[],
  thresholds: OutcomeThreshold[] = DEFAULT_THRESHOLDS,
  currentReportLowQuality = false,
): ThresholdOutcome[] {
  const live = history.filter((h) => !SIMULATION_RECORD_TYPES.includes(h.recordType));
  const out: ThresholdOutcome[] = [];
  for (const th of thresholds) {
    if (!th.outcomeTypes.includes(classification)) continue;
    const matched = live.filter((h) => th.outcomeTypes.includes(h.classification)).length + 1;
    const severeEnough = th.immediateSeverity !== undefined && severity >= th.immediateSeverity;
    // A single low-quality anonymous report never suspends guidance unless severity justifies it.
    if (currentReportLowQuality && severity < 4) {
      out.push({ threshold: th, matched, action: "monitor", immediate: false, note: "Low-quality anonymous report — monitored only." });
      continue;
    }
    if (severeEnough) {
      out.push({ threshold: th, matched, action: th.action, immediate: true, note: `Severity ${severity} justifies immediate precautionary action.` });
      continue;
    }
    if (matched >= th.count) out.push({ threshold: th, matched, action: th.action, immediate: false, note: th.note });
    else out.push({ threshold: th, matched, action: "monitor", immediate: false, note: `${matched}/${th.count} occurrences within the monitoring period.` });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* 24. Evidence promotion                                              */
/* ------------------------------------------------------------------ */

export function canPromote(
  from: EvidenceStage,
  to: EvidenceStage,
  reviewerRole: string,
): { ok: boolean; message: string } {
  if (EVIDENCE_STAGE_RANK[to] <= EVIDENCE_STAGE_RANK[from])
    return { ok: false, message: "Evidence can only be promoted to a higher stage." };
  if (EVIDENCE_STAGE_RANK[to] - EVIDENCE_STAGE_RANK[from] > 1)
    return { ok: false, message: "Evidence must be promoted one stage at a time with a reviewer decision at each step." };
  if (to === "approved_evidence" && reviewerRole !== "technical_reviewer")
    return { ok: false, message: "Only a technical reviewer may approve evidence." };
  return { ok: true, message: "Promotion permitted." };
}

/* ------------------------------------------------------------------ */
/* 25/26. Metrics and comparability                                    */
/* ------------------------------------------------------------------ */

export type ComparabilityCheck = { key: OutcomeComparabilityKey; passed: boolean; note: string };

export function outcomeComparability(records: OutcomeRecord[]): { comparable: boolean; checks: ComparabilityCheck[]; message: string } {
  const uniq = <T,>(vals: T[]) => new Set(vals).size <= 1;
  const checks: ComparabilityCheck[] = [
    { key: "same_stain_or_variant", passed: uniq(records.map((r) => r.context.stainKey)), note: "Stain identity" },
    { key: "same_fabric_family", passed: uniq(records.map((r) => r.context.fabricKey)), note: "Fabric family" },
    { key: "similar_colour_condition", passed: uniq(records.map((r) => r.context.colour)), note: "Colour condition" },
    { key: "similar_stain_age", passed: uniq(records.map((r) => r.context.stainAge)), note: "Stain age" },
    { key: "same_product_version", passed: uniq(records.map((r) => r.context.productVersionKey)), note: "Product version" },
    { key: "same_method_version", passed: uniq(records.map((r) => r.approvedMethod?.methodVersionKey)), note: "Method version" },
    { key: "same_treatment_stage", passed: uniq(records.map((r) => r.context.stageNumber)), note: "Treatment stage" },
    { key: "similar_cleaning_process", passed: uniq(records.map((r) => r.attempts[0]?.action)), note: "Cleaning process" },
    { key: "same_outcome_definition", passed: uniq(records.map((r) => r.recordType)), note: "Outcome definition" },
    { key: "post_drying_available", passed: records.every((r) => !!r.postDrying), note: "Post-drying inspection" },
  ];
  const comparable = checks.every((c) => c.passed);
  return {
    comparable, checks,
    message: comparable ? "Cases are comparable and may be aggregated." : NON_COMPARABLE_WARNING,
  };
}

export type MetricsResult = {
  aggregated: boolean;
  sampleSize: number;
  dateRange: string;
  productVersions: string[];
  conditions: string;
  dataQuality: "sufficient" | "small_sample" | "not_comparable" | "no_data";
  warnings: string[];
  rates: Record<string, number>;
};

export function computeMetrics(
  records: OutcomeRecord[],
  classify: (r: OutcomeRecord) => OutcomeClassification,
): MetricsResult {
  // Simulations never enter live performance evidence.
  const live = records.filter((r) => !SIMULATION_RECORD_TYPES.includes(r.recordType));
  if (!live.length)
    return { aggregated: false, sampleSize: 0, dateRange: "—", productVersions: [], conditions: "—", dataQuality: "no_data", warnings: ["No live outcome data available."], rates: {} };

  const comp = outcomeComparability(live);
  const dates = live.map((r) => r.createdAt).sort();
  const base = {
    sampleSize: live.length,
    dateRange: `${dates[0]?.slice(0, 10)} → ${dates[dates.length - 1]?.slice(0, 10)}`,
    productVersions: [...new Set(live.map((r) => r.context.productVersionKey ?? "unspecified"))],
    conditions: `${live[0].context.stainKey} on ${live[0].context.fabricKey}`,
  };
  if (!comp.comparable)
    return { ...base, aggregated: false, dataQuality: "not_comparable", warnings: [NON_COMPARABLE_WARNING], rates: {} };

  const cls = live.map(classify);
  const pct = (n: number) => Math.round((n / live.length) * 1000) / 10;
  const count = (fn: (c: OutcomeClassification) => boolean) => cls.filter(fn).length;

  const rates: Record<string, number> = {
    attemptCount: live.reduce((n, r) => n + r.attempts.length, 0),
    removalOrReductionRate: pct(count((c) => ["successful_without_observed_damage", "major_reduction_without_damage", "moderate_reduction_without_damage", "minor_reduction_without_damage"].includes(c))),
    noChangeRate: pct(count((c) => c === "no_meaningful_change")),
    ringFormationRate: pct(count((c) => c === "ring_formed")),
    dyeChangeRate: pct(count((c) => c === "dye_loss" || c === "dye_bleeding")),
    fibreDamageRate: pct(count((c) => c === "fibre_damage")),
    finishDamageRate: pct(count((c) => c === "finish_or_coating_damage")),
    escalationRate: pct(count((c) => DAMAGE_CLASSIFICATIONS.includes(c))),
    repeatTreatmentRate: pct(live.filter((r) => r.attempts.length > 1).length),
    postDryingSuccessRate: pct(count((c) => c === "successful_without_observed_damage")),
    delayedFailureRate: pct(live.filter((r) => r.followUp?.findings.some((f) => f !== "no_delayed_issue" && f !== "not_inspected")).length),
    methodComplianceRate: pct(live.filter((r) => r.approvedMethod && !checkCompliance(r.attempts[0], r.approvedMethod, r.context.ppeUsed).materiallyChanged).length),
  };

  const small = live.length < MINIMUM_PUBLISHABLE_SAMPLE;
  return {
    ...base, aggregated: true,
    dataQuality: small ? "small_sample" : "sufficient",
    warnings: small ? [SMALL_SAMPLE_WARNING] : [],
    rates,
  };
}

/* ------------------------------------------------------------------ */
/* 28. Role-based access                                               */
/* ------------------------------------------------------------------ */

export type AccessRequest = {
  role: string;
  userId: string;
  organizationKey: string;
  isReviewer?: boolean;
};

export function canViewOutcome(req: AccessRequest, record: OutcomeRecord): boolean {
  if (req.isReviewer || req.role === "trainer") return true;
  if (req.role === "domestic_user") return record.reportedBy === req.userId;
  // Professional users see only their own organization's records.
  return record.context.organizationKey === req.organizationKey;
}

export function visibleOutcomes(req: AccessRequest, records: OutcomeRecord[]): OutcomeRecord[] {
  return records.filter((r) => canViewOutcome(req, r));
}

export function canApproveEvidence(role: string) { return role === "technical_reviewer"; }
export function canViewAnalytics(role: string) { return role !== "domestic_user"; }

/* ------------------------------------------------------------------ */
/* 30. Customer summary                                                */
/* ------------------------------------------------------------------ */

export function customerSummary(
  classification: OutcomeClassification,
  mark: RemainingMarkType | undefined,
  stopped: boolean,
  repeat: RepeatDecision,
  date: string,
): CustomerSummary {
  const damage = DAMAGE_CLASSIFICATIONS.includes(classification);
  return {
    stainResult: CLASSIFICATION_LABEL[classification],
    remainingMark: mark ? REMAINING_MARK_LABEL[mark] : "No remaining mark recorded",
    observedGarmentChange: damage ? "A change to the garment was observed and recorded." : "No garment change was observed.",
    treatmentStopped: stopped ? "Treatment was stopped for safety." : "Treatment was completed.",
    furtherTreatment:
      repeat === "repeat_permitted" ? "Further treatment may be carried out."
        : repeat === "repeat_permitted_after_review" || repeat === "different_stage_may_be_considered"
          ? "Further treatment may be possible after review."
          : "No further treatment is recommended at this time.",
    expectedPermanence: classification === "successful_without_observed_damage"
      ? "The result is expected to be permanent, subject to normal wear."
      : "Any remaining mark may be permanent.",
    careRecommendation: "Follow the garment care label for future cleaning.",
    date,
  };
}

/** Internal chemistry, blame and unverified conclusions never reach the customer summary. */
export function summaryExcludes(summary: CustomerSummary, forbidden: string[]): boolean {
  const text = Object.values(summary).join(" ").toLowerCase();
  return !forbidden.some((f) => text.includes(f.toLowerCase()));
}

/* ------------------------------------------------------------------ */
/* 31. Closure                                                         */
/* ------------------------------------------------------------------ */

export function validateClosure(
  state: ClosureState,
  classification: OutcomeClassification,
  postDrying: PostDryingInspection | undefined,
  exceptionReason?: string,
): { ok: boolean; message: string } {
  if (!postDrying && !exceptionReason?.trim())
    return { ok: false, message: "Post-drying inspection is required before closure, or an explicit reason why it was unavailable." };
  if (state === "completed_successfully") {
    if (!postDrying) return { ok: false, message: "A case cannot close as successful without post-drying inspection." };
    if (DAMAGE_CLASSIFICATIONS.includes(classification))
      return { ok: false, message: "A case with observed garment damage cannot close as successful." };
    if (classification !== "successful_without_observed_damage")
      return { ok: false, message: `Recorded result is ${CLASSIFICATION_LABEL[classification]}, which cannot close as Completed Successfully.` };
  }
  return { ok: true, message: "Closure permitted." };
}

/* ------------------------------------------------------------------ */
/* 34. Offline behaviour                                               */
/* ------------------------------------------------------------------ */

export type SyncResult = { accepted: boolean; duplicate: boolean; message: string };

export function syncOutcome(existing: OutcomeRecord[], incoming: OutcomeRecord): SyncResult {
  if (existing.some((r) => r.clientRecordKey === incoming.clientRecordKey))
    return { accepted: false, duplicate: true, message: "Duplicate synchronization prevented — this record already exists." };
  return { accepted: true, duplicate: false, message: "Record synchronized." };
}

export function safetyEngineGate(available: boolean): { allowNextStage: boolean; message: string } {
  return available
    ? { allowNextStage: true, message: "Safety engine available." }
    : { allowNextStage: false, message: SAFETY_ENGINE_UNAVAILABLE_MESSAGE };
}

/* ------------------------------------------------------------------ */
/* 32. Correction (never deletion)                                     */
/* ------------------------------------------------------------------ */

export function correctOutcome(original: OutcomeRecord, patch: Partial<OutcomeRecord>, newId: string, by: string): {
  original: OutcomeRecord; correction: OutcomeRecord;
} {
  const correction: OutcomeRecord = {
    ...original,
    ...patch,
    outcomeId: newId,
    version: original.version + 1,
    correctsOutcomeId: original.outcomeId,
    superseded: false,
    reportedBy: by,
    updatedAt: new Date().toISOString(),
  };
  return { original: { ...original, superseded: true }, correction };
}

export const canDeleteOutcome = (r: OutcomeRecord) =>
  !(r.recordType === "adverse_outcome" || r.recordType === "damage_diagnosis");

/* ------------------------------------------------------------------ */
/* Full assembly                                                       */
/* ------------------------------------------------------------------ */

export type OutcomeAssessment = {
  outcomeId: string;
  engineVersion: string;
  baseline: BaselineCheck;
  compliance: ComplianceReport;
  safetyStop: SafetyStop;
  classification: ClassificationResult;
  expectation: { result: ExpectationComparison; note: string };
  severity: AdverseSeverity;
  repeat: { decision: RepeatDecision; reasons: string[] };
  triggers: OutcomeReviewTrigger[];
  thresholds: ThresholdOutcome[];
  remainingMarkNote: string;
  postDryingRequired: boolean;
  heatBlocked: boolean;
  customer: CustomerSummary;
  simulation: boolean;
};

export function assessOutcome(
  record: OutcomeRecord,
  opts: {
    history?: { classification: OutcomeClassification; productVersionKey?: string; recordType: OutcomeRecordType }[];
    productVersionApplicable?: boolean;
    roleAndEquipmentValid?: boolean;
    safetyEngineAuthorizes?: boolean | "unavailable";
    lowQualityAnonymous?: boolean;
    thresholds?: OutcomeThreshold[];
  } = {},
): OutcomeAssessment {
  const attempt = record.attempts[record.attempts.length - 1];
  const compliance = checkCompliance(attempt, record.approvedMethod, record.context.ppeUsed);
  const classification = classifyOutcome(record.immediate, record.postRinse, record.postDrying, record.baseline);
  const severity = deriveSeverity(classification.classification, record.immediate, record.postRinse);
  const safetyStop = evaluateSafetyStop(record.immediate, classification.damageObserved || anyOf(record.immediate, HAZARD_OBSERVATIONS) ? severity : undefined);

  const rinseUnconfirmed =
    !!record.approvedMethod?.rinseRequired && record.postRinse?.requiredProcessCompleted !== "yes";
  const removalUncertain = !!record.postRinse?.productRemovalUncertain;

  const repeat = decideRepeat({
    approved: record.approvedMethod,
    attemptsMade: record.attempts.length,
    compliance,
    classification: classification.classification,
    damageObserved: classification.damageObserved,
    postRinse: record.postRinse,
    productVersionApplicable: opts.productVersionApplicable ?? true,
    roleAndEquipmentValid: opts.roleAndEquipmentValid ?? true,
    safetyEngineAuthorizes: opts.safetyEngineAuthorizes ?? true,
  });

  const triggers = reviewTriggersFor(record, classification.classification, compliance, opts.history ?? []);
  const thresholds = evaluateThresholds(
    classification.classification, severity,
    (opts.history ?? []).map((h) => ({ classification: h.classification, recordType: h.recordType })),
    opts.thresholds, opts.lowQualityAnonymous,
  );

  return {
    outcomeId: record.outcomeId,
    engineVersion: OUTCOME_ENGINE_VERSION,
    baseline: checkBaseline(record.baseline),
    compliance,
    safetyStop,
    classification,
    expectation: compareToExpectation(record.approvedMethod, classification.classification, compliance, classification.finalStageReached),
    severity,
    repeat,
    triggers,
    thresholds,
    remainingMarkNote: remainingMarkGuidance(record.remainingMark),
    postDryingRequired: !record.postDrying,
    heatBlocked: safetyStop.blockHeat || rinseUnconfirmed || removalUncertain,
    customer: customerSummary(classification.classification, record.remainingMark, safetyStop.stopped, repeat.decision, record.createdAt.slice(0, 10)),
    simulation: SIMULATION_RECORD_TYPES.includes(record.recordType),
  };
}

export const COMPARABILITY_KEY_LIST = COMPARABILITY_KEYS;
export const IMPROVEMENT_LIST = IMPROVEMENT_OBSERVATIONS;
