/** STEP 14 — technical acceptance scenarios for the treatment feedback and outcome loop (§35). */

import {
  emptyBaseline, emptyInspection, DEFAULT_THRESHOLDS, formatOutcomeId,
} from "@/data/outcomes";
import type {
  OutcomeRecord, AttemptRecord, ApprovedMethodSnapshot, OutcomeContext,
  InspectionObservation, PostDryingInspection, PostRinseInspection,
  OutcomeRecordType, PreTreatmentBaseline,
} from "@/data/outcomes";
import {
  assessOutcome, canPromote, computeMetrics, outcomeComparability, validateClosure,
  syncOutcome, safetyEngineGate, correctOutcome, canDeleteOutcome, visibleOutcomes,
  customerSummary, summaryExcludes, classifyOutcome, checkBaseline,
} from "@/lib/outcomeEngine";

/* ---------------- builders ---------------- */

export const makeContext = (over: Partial<OutcomeContext> = {}): OutcomeContext => ({
  caseId: "SM-CASE-000001", caseVersion: 1,
  resultId: "SM-RES-000001", resultVersion: 1,
  role: "professional_spotter", organizationKey: "org_alpha", country: "IN",
  garmentDescription: "White cotton shirt", fabricKey: "cotton",
  fabricConfidence: "high", fabricRiskGroup: "group_a",
  colour: "white", construction: "woven",
  stainKey: "coffee", stainConfidence: 9, classificationKey: "tannin",
  stainAge: "fresh", heatExposure: "none", previousTreatments: [],
  stageNumber: 5, productKey: "prd_a", productVersionKey: "prd_a__v1__IN",
  mappingVersionKey: "SM-MAP-000001__v1", ruleSetVersion: "safety-rules-v1",
  sourceDocumentVersions: ["doc_a__v1"],
  equipment: ["spotting_board"], ppeUsed: ["protective_gloves"], ventilation: "adequate",
  operator: "op1", recordedAt: "2026-08-01T10:00:00.000Z",
  ...over,
});

export const fullBaseline = (over: Partial<PreTreatmentBaseline> = {}) => emptyBaseline({
  photos: { garment_full: "p1", stain_closeup: "p2" },
  stainSize: "3 cm", stainColour: "brown", stainTexture: "flat",
  garmentColour: "white", operatorConfirmed: true,
  ...over,
});

export const makeAttempt = (over: Partial<AttemptRecord> = {}): AttemptRecord => ({
  attemptNumber: 1, stageNumber: 5, action: "apply_tannin_agent",
  productOrMethod: "Product A", productVersionKey: "prd_a__v1__IN",
  quantity: "2 ml", dilution: "1:10", contactTime: "60 s", temperature: "ambient",
  technique: "blot", equipment: ["spotting_board"],
  rinsingPerformed: "yes", neutralizationPerformed: "not_required",
  deviations: [], operator: "op1", recordedPractice: true,
  ...over,
});

export const makeApproved = (over: Partial<ApprovedMethodSnapshot> = {}): ApprovedMethodSnapshot => ({
  methodVersionKey: "method_a__v1", stageNumber: 5, productVersionKey: "prd_a__v1__IN",
  requiredSteps: ["apply_tannin_agent"], quantity: "2 ml", dilution: "1:10",
  contactTime: "60 s", temperature: "ambient",
  rinseRequired: true, neutralizationRequired: false,
  requiredPpe: ["protective_gloves"], requiredEquipment: ["spotting_board"],
  repetitionPermitted: true, maximumAttempts: 2,
  expectedResult: "successful_without_observed_damage",
  ...over,
});

export const makeRinse = (over: Partial<PostRinseInspection> = {}): PostRinseInspection => ({
  requiredProcessCompleted: "yes", processUsed: "water flush", completionConfirmed: true,
  residueVisible: false, odourRemains: false, ringRemains: false,
  colourChanged: false, textureChanged: false, productRemovalUncertain: false,
  operator: "op1", ...over,
});

export const makeDrying = (over: Partial<PostDryingInspection> = {}): PostDryingInspection => ({
  dryingMethod: "air dry", dryingPermittedBySafetyEngine: true,
  stainResult: "stain_removed", ring: false, colourChanged: false, textureChanged: false,
  shrinkage: false, distortion: false, odour: false, residue: false,
  coatingCondition: "unchanged", decorationCondition: "unchanged", date: "2026-08-02",
  ...over,
});

let seq = 0;
export const makeRecord = (over: Partial<OutcomeRecord> = {}): OutcomeRecord => ({
  outcomeId: formatOutcomeId(++seq), version: 1,
  recordType: "technical_professional_attempt" as OutcomeRecordType,
  context: makeContext(),
  baseline: fullBaseline(),
  attempts: [makeAttempt()],
  approvedMethod: makeApproved(),
  immediate: emptyInspection({ observations: ["stain_removed"], inspectedBy: "op1", inspectedAt: "2026-08-01T10:10:00.000Z" }),
  postRinse: makeRinse(),
  postDrying: makeDrying(),
  failureHypotheses: [],
  evidenceStage: "raw_report",
  reportedBy: "op1",
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  clientRecordKey: `local-${seq}`,
  syncState: "synced",
  superseded: false,
  ...over,
});

const withObs = (obs: InspectionObservation[], over: Partial<OutcomeRecord> = {}) =>
  makeRecord({ immediate: emptyInspection({ observations: obs, inspectedBy: "op1", inspectedAt: "t" }), ...over });

/* ---------------- scenarios ---------------- */

export type Scenario = { id: string; title: string; run: () => boolean };

export const SCENARIOS: Scenario[] = [
  {
    id: "O01", title: "Stain removed without damage → successful",
    run: () => assessOutcome(makeRecord()).classification.classification === "successful_without_observed_damage",
  },
  {
    id: "O02", title: "Major reduction without damage",
    run: () => assessOutcome(makeRecord({
      immediate: emptyInspection({ observations: ["major_reduction"], inspectedBy: "o", inspectedAt: "t" }),
      postDrying: makeDrying({ stainResult: "major_reduction" }),
    })).classification.classification === "major_reduction_without_damage",
  },
  {
    id: "O03", title: "No meaningful change",
    run: () => assessOutcome(makeRecord({
      immediate: emptyInspection({ observations: ["no_meaningful_change"], inspectedBy: "o", inspectedAt: "t" }),
      postDrying: makeDrying({ stainResult: "no_meaningful_change" }),
    })).classification.classification === "no_meaningful_change",
  },
  {
    id: "O04", title: "Pigment remains",
    run: () => assessOutcome(makeRecord({
      immediate: emptyInspection({ observations: ["pigment_remains"], inspectedBy: "o", inspectedAt: "t" }),
      postDrying: makeDrying({ stainResult: "pigment_remains" }),
    })).classification.classification === "pigment_remains",
  },
  {
    id: "O05", title: "Ring forms",
    run: () => assessOutcome(withObs(["ring_appeared"])).classification.classification === "ring_formed",
  },
  {
    id: "O06", title: "Dye loss blocks success",
    run: () => {
      const a = assessOutcome(withObs(["stain_removed", "colour_lightened"]));
      return a.classification.classification === "dye_loss" && a.classification.damageObserved;
    },
  },
  {
    id: "O07", title: "Dye bleeding recorded as damage",
    run: () => assessOutcome(withObs(["dye_transferred"])).classification.classification === "dye_bleeding",
  },
  {
    id: "O08", title: "Fibre weakening recorded as fibre damage",
    run: () => assessOutcome(withObs(["fibre_weakened"])).classification.classification === "fibre_damage",
  },
  {
    id: "O09", title: "Coating lifts → finish damage",
    run: () => assessOutcome(withObs(["coating_lifted"])).classification.classification === "finish_or_coating_damage",
  },
  {
    id: "O10", title: "Decoration loosens → adhesive/decoration damage",
    run: () => assessOutcome(withObs(["adhesive_loosened"])).classification.classification === "adhesive_or_decoration_damage",
  },
  {
    id: "O11", title: "Hazardous reaction → level 5 and full stop",
    run: () => {
      const a = assessOutcome(withObs(["unexpected_reaction"]));
      return a.classification.classification === "hazardous_reaction" && a.severity === 5 &&
        a.safetyStop.stopped && a.safetyStop.blockHeat && a.safetyStop.blockNextChemicalStage;
    },
  },
  {
    id: "O12", title: "Uncertain inspection → inconclusive",
    run: () => assessOutcome(withObs(["user_uncertain"], { postDrying: undefined })).classification.classification === "inconclusive",
  },
  {
    id: "O13", title: "Required rinse completed → compliant",
    run: () => assessOutcome(makeRecord()).compliance.primary === "followed_as_approved",
  },
  {
    id: "O14", title: "Required rinse not completed → flagged and heat blocked",
    run: () => {
      const a = assessOutcome(makeRecord({
        attempts: [makeAttempt({ rinsingPerformed: "no" })],
        postRinse: makeRinse({ requiredProcessCompleted: "no", completionConfirmed: false }),
      }));
      return a.compliance.results.includes("required_rinse_missing") && a.heatBlocked;
    },
  },
  {
    id: "O15", title: "Post-drying result differs from wet result",
    run: () => {
      const a = assessOutcome(makeRecord({
        immediate: emptyInspection({ observations: ["stain_removed"], inspectedBy: "o", inspectedAt: "t" }),
        postDrying: makeDrying({ stainResult: "stain_removed", ring: true }),
      }));
      return a.classification.classification === "ring_formed";
    },
  },
  {
    id: "O16", title: "Delayed yellowing is recorded as a follow-up finding",
    run: () => {
      const r = makeRecord({ followUp: { interval: "after_24_hours", findings: ["yellowing_developed"] } });
      const m = computeMetrics([r], (x) => classifyOutcome(x.immediate, x.postRinse, x.postDrying, x.baseline).classification);
      return m.rates.delayedFailureRate === 100;
    },
  },
  {
    id: "O17", title: "Maximum attempts reached → do not repeat",
    run: () => assessOutcome(makeRecord({ attempts: [makeAttempt(), makeAttempt({ attemptNumber: 2 })] })).repeat.decision === "do_not_repeat",
  },
  {
    id: "O18", title: "Repeat permitted after clean inspection",
    run: () => assessOutcome(makeRecord({
      immediate: emptyInspection({ observations: ["minor_reduction"], inspectedBy: "o", inspectedAt: "t" }),
      postDrying: makeDrying({ stainResult: "minor_reduction" }),
    })).repeat.decision === "repeat_permitted",
  },
  {
    id: "O19", title: "Repeat blocked after damage",
    run: () => assessOutcome(withObs(["fibre_weakened"])).repeat.decision === "stop_and_escalate",
  },
  {
    id: "O20", title: "Approved method followed exactly → met expectation",
    run: () => assessOutcome(makeRecord()).expectation.result === "met_expectation",
  },
  {
    id: "O21", title: "Major deviation → invalid comparison",
    run: () => {
      const a = assessOutcome(makeRecord({ attempts: [makeAttempt({ contactTime: "600 s" })] }));
      return a.compliance.results.includes("contact_time_mismatch") && a.expectation.result === "invalid_comparison";
    },
  },
  {
    id: "O22", title: "Product-version mismatch detected",
    run: () => assessOutcome(makeRecord({ attempts: [makeAttempt({ productVersionKey: "prd_a__v2__IN" })] }))
      .compliance.results.includes("product_version_mismatch"),
  },
  {
    id: "O23", title: "Product batch suspected triggers review",
    run: () => assessOutcome(makeRecord({
      context: makeContext({ productBatch: "B-7781" }),
      immediate: emptyInspection({ observations: ["fibre_weakened"], inspectedBy: "o", inspectedAt: "t" }),
    })).triggers.includes("product_batch_issue_suspected"),
  },
  {
    id: "O24", title: "Domestic adverse outcome triggers domestic review",
    run: () => assessOutcome(makeRecord({
      recordType: "domestic_attempt",
      immediate: emptyInspection({ observations: ["colour_lightened"], inspectedBy: "u", inspectedAt: "t" }),
    })).triggers.includes("domestic_adverse_report"),
  },
  {
    id: "O25", title: "Training simulation excluded from live metrics",
    run: () => {
      const sim = makeRecord({ recordType: "training_simulation" });
      const m = computeMetrics([sim], (x) => classifyOutcome(x.immediate, x.postRinse, x.postDrying, x.baseline).classification);
      return !m.aggregated && m.dataQuality === "no_data";
    },
  },
  {
    id: "O26", title: "Raw report cannot jump to approved evidence",
    run: () => !canPromote("raw_report", "approved_evidence", "technical_reviewer").ok,
  },
  {
    id: "O27", title: "Repeated verified failures trigger method review",
    run: () => assessOutcome(makeRecord({
      immediate: emptyInspection({ observations: ["no_meaningful_change"], inspectedBy: "o", inspectedAt: "t" }),
      postDrying: makeDrying({ stainResult: "no_meaningful_change" }),
    }), {
      history: Array.from({ length: 4 }, () => ({ classification: "no_meaningful_change" as const, recordType: "technical_professional_attempt" as const })),
    }).triggers.includes("method_repeatedly_underperforms"),
  },
  {
    id: "O28", title: "Severe report triggers immediate precautionary suspension",
    run: () => {
      const a = assessOutcome(withObs(["unexpected_reaction"]));
      return a.thresholds.some((t) => t.immediate && t.action === "notify_safety_reviewer");
    },
  },
  {
    id: "O29", title: "Low-quality anonymous single report only monitored",
    run: () => {
      const a = assessOutcome(withObs(["ring_appeared"]), { lowQualityAnonymous: true });
      return a.thresholds.every((t) => t.action === "monitor");
    },
  },
  {
    id: "O30", title: "Small sample size displays warning",
    run: () => {
      const rs = [makeRecord(), makeRecord()];
      const m = computeMetrics(rs, (x) => classifyOutcome(x.immediate, x.postRinse, x.postDrying, x.baseline).classification);
      return m.dataQuality === "small_sample" && m.warnings.length > 0 && m.sampleSize === 2;
    },
  },
  {
    id: "O31", title: "Non-comparable cases are not aggregated",
    run: () => {
      const rs = [makeRecord(), makeRecord({ context: makeContext({ fabricKey: "silk" }) })];
      const m = computeMetrics(rs, (x) => classifyOutcome(x.immediate, x.postRinse, x.postDrying, x.baseline).classification);
      return !m.aggregated && m.dataQuality === "not_comparable" && !outcomeComparability(rs).comparable;
    },
  },
  {
    id: "O32", title: "Historical outcome retains original rule and product versions",
    run: () => {
      const r = makeRecord();
      const { original, correction } = correctOutcome(r, { failureHypotheses: ["stain_aged"] }, "SM-OUT-999999", "rev");
      return original.context.ruleSetVersion === "safety-rules-v1" &&
        correction.context.productVersionKey === "prd_a__v1__IN" &&
        correction.correctsOutcomeId === r.outcomeId && original.superseded;
    },
  },
  {
    id: "O33", title: "Domestic user sees only own outcome",
    run: () => {
      const mine = makeRecord({ reportedBy: "user1", recordType: "domestic_attempt" });
      const other = makeRecord({ reportedBy: "user2", recordType: "domestic_attempt" });
      const v = visibleOutcomes({ role: "domestic_user", userId: "user1", organizationKey: "" }, [mine, other]);
      return v.length === 1 && v[0].reportedBy === "user1";
    },
  },
  {
    id: "O34", title: "Organization cannot see another organization's outcomes",
    run: () => {
      const a = makeRecord({ context: makeContext({ organizationKey: "org_alpha" }) });
      const b = makeRecord({ context: makeContext({ organizationKey: "org_beta" }) });
      const v = visibleOutcomes({ role: "professional_spotter", userId: "op1", organizationKey: "org_alpha" }, [a, b]);
      return v.length === 1 && v[0].context.organizationKey === "org_alpha";
    },
  },
  {
    id: "O35", title: "Customer summary excludes internal conclusions",
    run: () => {
      const s = customerSummary("pigment_remains", "residual_pigment", false, "do_not_repeat", "2026-08-02");
      return summaryExcludes(s, ["operator error", "root cause", "hydrogen peroxide", "blame", "deviation"]);
    },
  },
  {
    id: "O36", title: "Offline record synchronizes once",
    run: () => syncOutcome([], makeRecord({ clientRecordKey: "off-1" })).accepted,
  },
  {
    id: "O37", title: "Duplicate synchronization is prevented",
    run: () => {
      const r = makeRecord({ clientRecordKey: "off-2" });
      return syncOutcome([r], { ...r, outcomeId: "SM-OUT-000999" }).duplicate;
    },
  },
  {
    id: "O38", title: "Safety-engine failure blocks the next stage",
    run: () => {
      const gate = safetyEngineGate(false);
      const a = assessOutcome(makeRecord(), { safetyEngineAuthorizes: "unavailable" });
      return !gate.allowNextStage && a.repeat.decision === "insufficient_information";
    },
  },
  {
    id: "O39", title: "Case cannot close successfully without post-drying inspection",
    run: () => {
      const r = makeRecord({ postDrying: undefined });
      const cls = classifyOutcome(r.immediate, r.postRinse, undefined, r.baseline).classification;
      return !validateClosure("completed_successfully", cls, undefined).ok;
    },
  },
  {
    id: "O40", title: "Successful closure blocked when damage occurred",
    run: () => !validateClosure("completed_successfully", "dye_loss", makeDrying()).ok,
  },
  {
    id: "O41", title: "Corrected report preserves the original entry",
    run: () => {
      const r = makeRecord();
      const { original, correction } = correctOutcome(r, { remainingMark: "residual_pigment" }, "SM-OUT-888888", "rev");
      return original.outcomeId === r.outcomeId && original.remainingMark === undefined && correction.version === 2;
    },
  },
  {
    id: "O42", title: "Adverse outcome cannot be deleted",
    run: () => !canDeleteOutcome(makeRecord({ recordType: "adverse_outcome" })),
  },
  {
    id: "O43", title: "Baseline gaps are reported before treatment",
    run: () => {
      const c = checkBaseline(emptyBaseline());
      return !c.complete && c.missing.length >= 4;
    },
  },
  {
    id: "O44", title: "Pre-existing damage is not attributed to the treatment",
    run: () => {
      const r = makeRecord({
        baseline: fullBaseline({ existingDyeLoss: true }),
        immediate: emptyInspection({ observations: ["colour_lightened", "stain_removed"], inspectedBy: "o", inspectedAt: "t" }),
      });
      const a = assessOutcome(r);
      return a.classification.classification === "successful_without_observed_damage" &&
        a.classification.reasons.some((x) => x.includes("Pre-existing"));
    },
  },
  {
    id: "O45", title: "Product removal uncertain blocks heat and completion",
    run: () => {
      const a = assessOutcome(makeRecord({ postRinse: makeRinse({ productRemovalUncertain: true }) }));
      return a.heatBlocked && a.classification.classification === "odour_or_residue_concern" &&
        !validateClosure("completed_successfully", a.classification.classification, makeDrying()).ok;
    },
  },
  {
    id: "O46", title: "Default thresholds suspend a mapping after confirmed damage",
    run: () => {
      const a = assessOutcome(withObs(["fibre_weakened"]));
      return a.thresholds.some((t) => t.action === "suspend_mapping" && t.immediate) &&
        DEFAULT_THRESHOLDS.some((t) => t.action === "suspend_mapping");
    },
  },
  {
    id: "O47", title: "Wet appearance alone cannot finalize a result",
    run: () => assessOutcome(makeRecord({ postDrying: undefined })).classification.classification === "not_inspected_after_drying",
  },
  {
    id: "O48", title: "Evidence promotes one stage at a time with reviewer permission",
    run: () => canPromote("raw_report", "validated_case", "technical_reviewer").ok &&
      !canPromote("repeated_controlled_evidence", "approved_evidence", "laundry_employee").ok,
  },
];

export function runOutcomeScenarios() {
  const results = SCENARIOS.map((s) => {
    let pass = false;
    try { pass = s.run(); } catch { pass = false; }
    return { id: s.id, title: s.title, pass };
  });
  return { total: results.length, passed: results.filter((r) => r.pass).length, results };
}
