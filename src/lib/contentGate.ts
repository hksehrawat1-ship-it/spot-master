/**
 * Deterministic content gate (Constitution R5-R11, R13, R23).
 * Decides what may be shown for a case. Fails closed on missing data.
 */

import {
  DOMESTIC_MIN_CONFIDENCE,
  LABEL_FALLBACK_INSTRUCTION,
  REQUIRED_PUBLICATION_FIELDS,
  isNonOverridableBlock,
} from "./constitution";
import { isDisplayableAsGuidance, type Classified } from "./dataSource";

export type GateOutcome =
  | "show"
  | "hidden_area_test_required"
  | "professional_assessment_required"
  | "blocked"
  | "no_approved_method"
  | "content_under_review"
  | "safety_check_unavailable";

export type CaseFacts = {
  fabricKnown: boolean;
  fabricLabelPresent: boolean;
  colourfastnessKnown: boolean;
  existingDamage: boolean;
  activeColourBleeding: boolean;
  unknownPreviousChemical: boolean;
  /** false when the safety engine or its data could not be evaluated. */
  safetyEvaluationAvailable: boolean;
};

export type GateDecision = {
  outcome: GateOutcome;
  /** Plain-language message for a dry cleaner, never internal terminology. */
  message: string;
  hiddenAreaTestRequired: boolean;
  overridable: boolean;
  blockReason?: string;
};

export const DEFAULT_FACTS: CaseFacts = {
  fabricKnown: false,
  fabricLabelPresent: false,
  colourfastnessKnown: false,
  existingDamage: false,
  activeColourBleeding: false,
  unknownPreviousChemical: false,
  safetyEvaluationAvailable: true,
};

/** Master gate for any actionable guidance. */
export function evaluateGate(facts: Partial<CaseFacts>): GateDecision {
  const f = { ...DEFAULT_FACTS, ...facts };

  if (!f.safetyEvaluationAvailable) {
    return {
      outcome: "safety_check_unavailable",
      message:
        "The safety check could not run right now, so no treatment steps can be shown. Please try again shortly, or treat the item as professional-only.",
      hiddenAreaTestRequired: true,
      overridable: false,
    };
  }

  if (f.existingDamage) return block("existing_damage", "This garment already shows damage. Treatment is blocked until the damage is recorded and assessed by a professional.");
  if (f.activeColourBleeding) return block("active_colour_bleeding", "The colour is currently bleeding. Treatment is blocked — stop, keep the item cool and dry, and refer it for professional assessment.");
  if (f.unknownPreviousChemical) return block("unknown_previous_chemical", "Something unknown has already been applied to this stain. Treatment is blocked because the reaction cannot be predicted.");

  // R4 / R5 — safest compatible path when anything is uncertain.
  const uncertain = !f.fabricKnown || !f.fabricLabelPresent || !f.colourfastnessKnown;
  if (uncertain) {
    return {
      outcome: "hidden_area_test_required",
      message:
        "The fabric or colour behaviour is not confirmed, so take the safest route: test on a hidden area (inside seam, hem or pocket facing) first and stop immediately if colour lifts or the fabric changes.",
      hiddenAreaTestRequired: true,
      overridable: true,
    };
  }

  return { outcome: "show", message: "", hiddenAreaTestRequired: false, overridable: true };
}

function block(reason: string, message: string): GateDecision {
  return {
    outcome: "blocked",
    message,
    hiddenAreaTestRequired: true,
    overridable: !isNonOverridableBlock(reason),
    blockReason: reason,
  };
}

/** R7 — domestic treatment visibility. */
export function canShowDomesticTreatment(record: {
  confidence?: number | null;
  status?: string | null;
}): boolean {
  const confidence = typeof record.confidence === "number" ? record.confidence : -1;
  const status = String(record.status ?? "").toLowerCase();
  return confidence >= DOMESTIC_MIN_CONFIDENCE && (status === "approved" || status === "published");
}

/** R11 — publication completeness. Returns the missing field names. */
export function missingPublicationFields(record: Record<string, unknown>): string[] {
  return REQUIRED_PUBLICATION_FIELDS.filter((field) => {
    const value = record[field];
    return value === undefined || value === null || String(value).trim() === "";
  });
}

export function isPublishable(record: Record<string, unknown>): boolean {
  return missingPublicationFields(record).length === 0;
}

/** R8-R10 — professional instruction text. Never invented. */
export function professionalInstruction(
  instruction: Classified<{ text?: string } | null> | null | undefined,
): string {
  if (!instruction || !isDisplayableAsGuidance(instruction)) return LABEL_FALLBACK_INSTRUCTION;
  const text = instruction.data?.text?.trim();
  return text ? text : LABEL_FALLBACK_INSTRUCTION;
}

/** R13 — AI suggestions are advisory until the gate approves them. */
export type AiSuggestion = { name: string; confidence: number; why: string };

export function applySafetyToAiSuggestions(
  suggestions: AiSuggestion[],
  facts: Partial<CaseFacts>,
): { suggestions: AiSuggestion[]; decision: GateDecision; actionableGuidanceAllowed: boolean } {
  const decision = evaluateGate(facts);
  return {
    suggestions: suggestions.slice(0, 3),
    decision,
    actionableGuidanceAllowed: decision.outcome === "show" || decision.outcome === "hidden_area_test_required",
  };
}
