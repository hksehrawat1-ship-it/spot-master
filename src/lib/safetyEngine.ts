/**
 * STEP 9 — centralized, explainable Safety Rules Engine.
 *
 * Every treatment-related decision in Stain Master passes through `evaluateSafety`.
 * The engine is deterministic, versioned, explainable and fails safe.
 */

import type { RiskLevel } from "@/lib/fabricSafety";
import {
  SAFETY_RULES, BAND_RANK, SEVERITY_BLOCKS, RULESET_VERSION, ENGINE_FAILURE_MESSAGE,
  NON_OVERRIDABLE_REASONS, DOMESTIC_NOT_RECOMMENDED,
} from "@/data/safetyRules";
import type {
  SafetyRule, SafetyCase, RuleSeverity, DecisionEffect, PrecedenceBand, RuleCategory,
} from "@/data/safetyRules";

export type { SafetyCase, SafetyRule } from "@/data/safetyRules";

export const ENGINE_VERSION = "safety-engine-v1.0.0";

/* ------------------------------------------------------------------ */
/* Output contract (§32)                                               */
/* ------------------------------------------------------------------ */

export type FiredRule = {
  ruleId: string;
  name: string;
  plainTitle: string;
  category: RuleCategory;
  band: PrecedenceBand;
  bandRank: number;
  severity: RuleSeverity;
  effects: DecisionEffect[];
  warning: string;
  requiredAction?: string;
  stopCondition?: string;
  technicalDescription: string;
  evidenceSource: string;
  ruleVersion: number;
  overridable: boolean;
  /** The exact case fields that caused the rule to fire. */
  triggeredBy: Record<string, unknown>;
};

export type SafetyOutcome =
  | "proceed"
  | "proceed_with_caution"
  | "test_required"
  | "more_information_required"
  | "professional_only"
  | "specialist_referral"
  | "blocked"
  | "hazard_referral";

export type ProductEligibility =
  | "eligible" | "eligible_after_testing" | "professional_only" | "ineligible" | "insufficient_information";

export type SafetyEvaluation = {
  evaluationId: string;
  caseId: string;
  caseVersion: number;
  evaluatedAt: string;
  engineVersion: string;
  rulesetVersion: string;
  ruleVersions: Record<string, number>;

  outcome: SafetyOutcome;
  riskLevel: RiskLevel;
  gateStatus:
    | "proceed" | "proceed_with_testing" | "professional_only"
    | "blocked_pending_identification" | "blocked_existing_damage" | "specialist_material_route";
  productEligibility: ProductEligibility;

  blocked: boolean;
  domesticAllowed: boolean;
  heatBlocked: boolean;
  repetitionBlocked: boolean;
  nextStageBlocked: boolean;
  testRequired: boolean;
  inspectionRequired: boolean;
  rinseRequired: boolean;
  supervisorReviewRequired: boolean;
  hazardReferral: boolean;
  moreInformationRequired: boolean;

  /** The single highest-priority rule that determined the outcome. */
  determiningRule?: FiredRule;
  firedRules: FiredRule[];
  suppressedRules: { ruleId: string; reason: string }[];
  effects: DecisionEffect[];
  warnings: string[];
  requiredActions: string[];
  missingInformation: string[];
  explanation: string[];
  engineFailure?: string;
};

/* ------------------------------------------------------------------ */
/* Overrides (§35)                                                     */
/* ------------------------------------------------------------------ */

export type SafetyOverride = {
  overrideId: string;
  caseId: string;
  ruleId: string;
  reason: string;
  approvedBy: string;
  approvedAt: string;
  expiresAt?: string;
};

export const isOverridable = (rule: SafetyRule) => rule.overridable && !SEVERITY_BLOCKS[rule.severity]
  ? true
  : rule.overridable && rule.severity !== "hazard_referral";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const RISK_ORDER: RiskLevel[] = ["green", "amber", "red", "black"];
const worstRisk = (a: RiskLevel, b: RiskLevel) =>
  RISK_ORDER[Math.max(RISK_ORDER.indexOf(a), RISK_ORDER.indexOf(b))];

const GATE_ORDER = [
  "proceed", "proceed_with_testing", "professional_only",
  "specialist_material_route", "blocked_pending_identification", "blocked_existing_damage",
] as const;
type Gate = (typeof GATE_ORDER)[number];
const worstGate = (a: Gate, b: Gate) =>
  GATE_ORDER[Math.max(GATE_ORDER.indexOf(a), GATE_ORDER.indexOf(b))];

const ELIGIBILITY_ORDER: ProductEligibility[] = [
  "eligible", "eligible_after_testing", "professional_only", "insufficient_information", "ineligible",
];
const worstEligibility = (a: ProductEligibility, b: ProductEligibility) =>
  ELIGIBILITY_ORDER[Math.max(ELIGIBILITY_ORDER.indexOf(a), ELIGIBILITY_ORDER.indexOf(b))];

const pick = (c: SafetyCase, fields: string[]): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const [head, tail] = f.split(".");
    const base = (c as unknown as Record<string, unknown>)[head];
    if (tail && base && typeof base === "object") {
      out[f] = (base as Record<string, unknown>)[tail];
    } else {
      out[f] = base;
    }
  }
  return out;
};

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const toFired = (rule: SafetyRule, c: SafetyCase): FiredRule => ({
  ruleId: rule.ruleId,
  name: rule.name,
  plainTitle: rule.plainTitle,
  category: rule.category,
  band: rule.band,
  bandRank: BAND_RANK[rule.band],
  severity: rule.severity,
  effects: rule.effects,
  warning: rule.warning,
  requiredAction: rule.requiredAction,
  stopCondition: rule.stopCondition,
  technicalDescription: rule.technicalDescription,
  evidenceSource: rule.evidenceSource,
  ruleVersion: rule.version,
  overridable: rule.overridable,
  triggeredBy: pick(c, rule.requiredData),
});

const ruleAppliesToContext = (rule: SafetyRule, c: SafetyCase) => {
  if (rule.status !== "active") return false;
  if (rule.roles !== "all" && !rule.roles.includes(c.role)) return false;
  if (!rule.countries.includes("all") && c.userCountry && !rule.countries.includes(c.userCountry)) return false;
  return true;
};

/* ------------------------------------------------------------------ */
/* Core evaluation                                                     */
/* ------------------------------------------------------------------ */

const runEvaluation = (
  safetyCase: SafetyCase,
  opts: { overrides?: SafetyOverride[]; rules?: SafetyRule[] } = {},
): SafetyEvaluation => {
  const rules = opts.rules ?? SAFETY_RULES;
  const overrides = opts.overrides ?? [];
  const now = new Date().toISOString();

  const fired: FiredRule[] = [];
  const suppressed: { ruleId: string; reason: string }[] = [];

  for (const rule of rules) {
    if (!ruleAppliesToContext(rule, safetyCase)) continue;

    let triggered = false;
    try {
      triggered = rule.trigger(safetyCase);
    } catch {
      // A rule that cannot be evaluated is treated as triggered-unsafe: fail safe.
      suppressed.push({ ruleId: rule.ruleId, reason: "Rule could not be evaluated; safest route applied." });
      triggered = true;
    }
    if (!triggered) continue;

    const override = overrides.find(
      (o) => o.ruleId === rule.ruleId && o.caseId === safetyCase.caseId &&
        (!o.expiresAt || o.expiresAt > now),
    );
    if (override) {
      if (!rule.overridable) {
        suppressed.push({
          ruleId: rule.ruleId,
          reason: "Override rejected — this decision class can never be overridden.",
        });
      } else {
        suppressed.push({
          ruleId: rule.ruleId,
          reason: `Overridden by ${override.approvedBy}: ${override.reason}`,
        });
        continue;
      }
    }

    fired.push(toFired(rule, safetyCase));
  }

  // §7 conflict resolution — safest outcome always wins; band rank decides the explanation.
  fired.sort((a, b) => a.bandRank - b.bandRank || a.ruleId.localeCompare(b.ruleId));

  const effects = Array.from(new Set(fired.flatMap((f) => f.effects)));
  const hasEffect = (e: DecisionEffect) => effects.includes(e);

  let risk: RiskLevel = safetyCase.currentRisk ?? "green";
  let gate: Gate = "proceed";
  let eligibility: ProductEligibility = safetyCase.product?.productKey ? "eligible" : "insufficient_information";
  if (!safetyCase.product?.productKey) eligibility = "eligible";

  for (const f of fired) {
    const rule = rules.find((r) => r.ruleId === f.ruleId)!;
    if (rule.riskEffect) risk = worstRisk(risk, rule.riskEffect);
    if (rule.gateEffect) gate = worstGate(gate, rule.gateEffect as Gate);
    if (rule.productEligibilityEffect) eligibility = worstEligibility(eligibility, rule.productEligibilityEffect);
  }

  const hazardReferral = fired.some((f) => f.severity === "hazard_referral") || hasEffect("require_hazard_referral");
  const blocked = hazardReferral || hasEffect("block_treatment");
  const testRequired = hasEffect("require_compatibility_test");
  const moreInfo = hasEffect("require_more_information");
  const specialist = hasEffect("specialist_only");
  const professionalOnly = hasEffect("professional_only");

  if (testRequired && gate === "proceed") gate = "proceed_with_testing";
  if (professionalOnly) gate = worstGate(gate, "professional_only");
  if (specialist) gate = worstGate(gate, "specialist_material_route");
  if (blocked && gate === "proceed") gate = "blocked_pending_identification";
  if (testRequired && eligibility === "eligible") eligibility = "eligible_after_testing";
  if (professionalOnly) eligibility = worstEligibility(eligibility, "professional_only");
  if (blocked) eligibility = worstEligibility(eligibility, "ineligible");

  let outcome: SafetyOutcome = "proceed";
  if (hazardReferral) outcome = "hazard_referral";
  else if (blocked) outcome = "blocked";
  else if (specialist) outcome = "specialist_referral";
  else if (professionalOnly) outcome = "professional_only";
  else if (moreInfo) outcome = "more_information_required";
  else if (testRequired) outcome = "test_required";
  else if (fired.length > 0) outcome = "proceed_with_caution";

  const determining =
    fired.find((f) => SEVERITY_BLOCKS[f.severity]) ??
    fired.find((f) => f.severity === "professional_only" || f.severity === "test_required") ??
    fired[0];

  const domesticAllowed =
    safetyCase.role !== "domestic_user"
      ? outcome === "proceed" || outcome === "proceed_with_caution"
      : !blocked && !professionalOnly && !specialist &&
        safetyCase.stainConfidence >= 9 &&
        (risk === "green" || (risk === "amber" && safetyCase.hiddenTestAreaAvailable === true));

  const explanation: string[] = [];
  if (determining) {
    explanation.push(`${determining.plainTitle} — ${determining.warning}`);
  } else {
    explanation.push("No safety rule was triggered for this case.");
  }
  if (safetyCase.role === "domestic_user" && !domesticAllowed) {
    explanation.push(DOMESTIC_NOT_RECOMMENDED);
  }
  for (const f of fired.slice(0, 12)) {
    if (f.ruleId !== determining?.ruleId) explanation.push(`${f.plainTitle} (${f.ruleId})`);
  }

  return {
    evaluationId: uid("eval"),
    caseId: safetyCase.caseId,
    caseVersion: safetyCase.caseVersion,
    evaluatedAt: now,
    engineVersion: ENGINE_VERSION,
    rulesetVersion: RULESET_VERSION,
    ruleVersions: Object.fromEntries(fired.map((f) => [f.ruleId, f.ruleVersion])),

    outcome,
    riskLevel: risk,
    gateStatus: gate,
    productEligibility: eligibility,

    blocked,
    domesticAllowed,
    heatBlocked: hasEffect("block_heat") || blocked,
    repetitionBlocked: hasEffect("block_repetition") || blocked,
    nextStageBlocked: hasEffect("block_next_stage") || blocked,
    testRequired,
    inspectionRequired: hasEffect("require_inspection"),
    rinseRequired: hasEffect("require_rinse_or_neutralization"),
    supervisorReviewRequired: hasEffect("require_supervisor_review"),
    hazardReferral,
    moreInformationRequired: moreInfo,

    determiningRule: determining,
    firedRules: fired,
    suppressedRules: suppressed,
    effects,
    warnings: fired.map((f) => f.warning),
    requiredActions: Array.from(new Set(fired.map((f) => f.requiredAction).filter(Boolean) as string[])),
    missingInformation: Array.from(
      new Set(fired.filter((f) => f.effects.includes("require_more_information")).flatMap((f) => Object.keys(f.triggeredBy))),
    ),
    explanation,
  };
};

/**
 * §36 — safe failure. If anything at all goes wrong the engine blocks treatment
 * and says so, rather than returning permissive guidance.
 */
export const evaluateSafety = (
  safetyCase: SafetyCase,
  opts: { overrides?: SafetyOverride[]; rules?: SafetyRule[] } = {},
): SafetyEvaluation => {
  try {
    return runEvaluation(safetyCase, opts);
  } catch (err) {
    const now = new Date().toISOString();
    return {
      evaluationId: uid("eval-fail"),
      caseId: safetyCase?.caseId ?? "unknown",
      caseVersion: safetyCase?.caseVersion ?? 0,
      evaluatedAt: now,
      engineVersion: ENGINE_VERSION,
      rulesetVersion: RULESET_VERSION,
      ruleVersions: {},
      outcome: "blocked",
      riskLevel: "black",
      gateStatus: "blocked_pending_identification",
      productEligibility: "insufficient_information",
      blocked: true,
      domesticAllowed: false,
      heatBlocked: true,
      repetitionBlocked: true,
      nextStageBlocked: true,
      testRequired: false,
      inspectionRequired: false,
      rinseRequired: false,
      supervisorReviewRequired: true,
      hazardReferral: false,
      moreInformationRequired: true,
      firedRules: [],
      suppressedRules: [],
      effects: ["block_treatment"],
      warnings: [ENGINE_FAILURE_MESSAGE],
      requiredActions: ["Re-open the case and complete the assessment again."],
      missingInformation: [],
      explanation: [ENGINE_FAILURE_MESSAGE],
      engineFailure: err instanceof Error ? err.message : String(err),
    };
  }
};

/** §35 — validate an override request before it is stored. */
export const validateOverride = (
  rule: SafetyRule,
  request: { reason: string; approvedBy: string },
): { allowed: boolean; message: string } => {
  if (!rule.overridable) {
    return {
      allowed: false,
      message: `This decision can never be overridden (${NON_OVERRIDABLE_REASONS.join("; ")}).`,
    };
  }
  if (!request.reason.trim() || request.reason.trim().length < 10) {
    return { allowed: false, message: "A documented reason of at least 10 characters is required." };
  }
  if (!request.approvedBy.trim()) {
    return { allowed: false, message: "An authorized approver must be recorded." };
  }
  return { allowed: true, message: "Override recorded with reason, approver and timestamp." };
};

/** Public-safe view: hides technical descriptions and product chemistry (§33). */
export const publicView = (e: SafetyEvaluation) => ({
  outcome: e.outcome,
  riskLevel: e.riskLevel,
  blocked: e.blocked,
  domesticAllowed: e.domesticAllowed,
  headline: e.determiningRule?.plainTitle ?? "No safety issues were found.",
  warnings: e.warnings,
  requiredActions: e.requiredActions,
  whatNotToDo: e.firedRules.filter((f) => f.stopCondition).map((f) => f.warning),
});

export const OUTCOME_LABEL: Record<SafetyOutcome, string> = {
  proceed: "Proceed",
  proceed_with_caution: "Proceed with caution",
  test_required: "Test required",
  more_information_required: "More information required",
  professional_only: "Professional only",
  specialist_referral: "Specialist referral",
  blocked: "Blocked",
  hazard_referral: "Hazard referral",
};
