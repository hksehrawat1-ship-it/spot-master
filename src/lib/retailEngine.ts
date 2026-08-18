/**
 * LAYER 1 — Retail Spotting decision engine.
 *
 * Deterministic. No AI. Fails closed. Never invents chemistry.
 * It reuses the Constitution gate (contentGate) and the data-source
 * classification rules; it can only ever be MORE restrictive than they are.
 */

import { LABEL_FALLBACK_INSTRUCTION } from "@/lib/constitution";
import { canShowDomesticTreatment, evaluateGate, missingPublicationFields } from "@/lib/contentGate";
import { isDisplayableAsGuidance, type Classified } from "@/lib/dataSource";
import {
  AVOID_LIBRARY,
  CHECK_AFTER_EVERY_STEP,
  CONCEALED_TEST_LOCATIONS,
  NO_VERIFIED_BASIC_METHOD,
  type ExpectedOutcome,
  type TestResult,
} from "@/data/retailSpotting";

export const RETAIL_ENGINE_VERSION = "retail-engine-v1.0.0";

/* ------------------------------------------------------------------ */
/* Case                                                                */
/* ------------------------------------------------------------------ */

export type KitSelection =
  | { kind: "company"; companyId: string; companyName: string; kitId?: string | null; productIds: string[] }
  | { kind: "basic" }
  | { kind: "other"; kitName: string }
  | { kind: "none" };

export type RetailCase = {
  /* stain */
  stainName?: string;
  stainCategory?: string;
  stainKnown: boolean;
  observations?: Record<string, string>;

  /* garment */
  fabricKnown: boolean;
  fabric?: string;
  careLabel: "available" | "no_label" | "unreadable";
  colour: "White" | "Light" | "Dark" | "Multicolour" | "Unknown";
  stainAge: "Fresh" | "Old" | "Unknown";
  heatExposed: "No" | "Yes" | "Not sure";
  previouslyTreated: "No" | "Yes — product known" | "Yes — product unknown";
  visibleDamage: "No" | "Yes" | "Not sure";
  activeColourBleeding: "No" | "Yes" | "Not sure";
  specialConstruction: "No" | "Yes" | "Not sure";

  /* kit + test */
  kit: KitSelection;
  testResult: TestResult;

  /** false when the deterministic safety data could not be evaluated. */
  safetyEngineAvailable: boolean;
};

/* ------------------------------------------------------------------ */
/* Product records (always supplied by the caller, from the database)  */
/* ------------------------------------------------------------------ */

export type ProductInstruction = {
  productId: string;
  productName: string;
  /** Approved, human-written steps. Never generated. */
  steps: string[];
};

export type BasicMethod = {
  methodId: string;
  title: string;
  steps: string[];
  confidence: number;
  status: string;
};

export type RetailStatus =
  | "safe_to_proceed"
  | "test_first"
  | "stop_escalate"
  | "possible_fabric_damage"
  | "no_approved_method";

export const STATUS_LABEL: Record<RetailStatus, string> = {
  safe_to_proceed: "Safe to proceed",
  test_first: "Test first",
  stop_escalate: "Stop and escalate",
  possible_fabric_damage: "Possible fabric damage",
  no_approved_method: "No approved method available",
};

export const STATUS_TONE: Record<RetailStatus, "green" | "amber" | "red" | "neutral"> = {
  safe_to_proceed: "green",
  test_first: "amber",
  stop_escalate: "red",
  possible_fabric_damage: "red",
  no_approved_method: "neutral",
};

export type RetailResult = {
  status: RetailStatus;
  statusMessage: string;
  immediateAction: string;
  blockReason?: string;
  escalationRequired: boolean;
  stain: { name: string; category: string; confidence: "likely" | "uncertain" | "unknown" };
  product: {
    kind: "verified_kit" | "verified_basic" | "fallback" | "none";
    name?: string;
    message: string;
  };
  test: { required: boolean; recorded: TestResult; locations: readonly string[] };
  steps: string[];
  avoid: string[];
  checks: readonly string[];
  expectedOutcome: ExpectedOutcome;
  analyticsEvents: string[];
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function stainConfidence(c: RetailCase): "likely" | "uncertain" | "unknown" {
  if (!c.stainKnown || !c.stainName) return "unknown";
  if (c.stainName === "Unknown mark") return "unknown";
  return c.observations && Object.keys(c.observations).length > 0 && !c.stainKnown ? "uncertain" : "likely";
}

/** A kit product is only usable when it is production-classified and publishable. */
export function usableKitInstruction(
  record: Classified<ProductInstruction> | null | undefined,
): ProductInstruction | null {
  if (!record || !isDisplayableAsGuidance(record)) return null;
  if (missingPublicationFields(record as unknown as Record<string, unknown>).length > 0) return null;
  const steps = record.data?.steps?.filter((s) => s.trim().length > 0) ?? [];
  return steps.length ? { ...record.data, steps } : null;
}

/** R7 — basic/domestic methods require >= 9/10 confidence and approval. */
export function usableBasicMethod(methods: BasicMethod[]): BasicMethod | null {
  return (
    methods.find(
      (m) => canShowDomesticTreatment({ confidence: m.confidence, status: m.status }) && m.steps.length > 0,
    ) ?? null
  );
}

function avoidList(c: RetailCase): string[] {
  const out = [AVOID_LIBRARY.rub, AVOID_LIBRARY.colour, AVOID_LIBRARY.texture];
  if (c.heatExposed !== "No" || c.stainAge !== "Fresh") out.splice(1, 0, AVOID_LIBRARY.heat);
  if (c.previouslyTreated !== "No" || c.kit.kind === "basic") out.push(AVOID_LIBRARY.mix);
  return out;
}

function expectedOutcome(c: RetailCase, status: RetailStatus): ExpectedOutcome {
  if (status === "possible_fabric_damage") return "Permanent damage possible";
  if (status === "stop_escalate" || status === "no_approved_method") return "Professional assessment recommended";
  if (!c.stainKnown) return "Result uncertain";
  if (c.stainAge === "Fresh" && c.heatExposed === "No") return "Likely removable";
  if (c.heatExposed === "Yes" || c.stainAge === "Old") return "Improvement possible";
  return "Likely reducible";
}

/** Testing is required whenever compatibility or colourfastness is not confirmed. */
export function concealedTestRequired(c: RetailCase): boolean {
  if (c.testResult === "Passed") return false;
  return (
    !c.fabricKnown ||
    c.careLabel !== "available" ||
    c.colour !== "White" ||
    c.colour === "Unknown" ||
    c.specialConstruction !== "No"
  );
}

/* ------------------------------------------------------------------ */
/* Main evaluation                                                     */
/* ------------------------------------------------------------------ */

export function evaluateRetailCase(
  c: RetailCase,
  sources: {
    kitInstruction?: Classified<ProductInstruction> | null;
    basicMethods?: BasicMethod[];
  } = {},
): RetailResult {
  const events: string[] = [];
  if (c.stainName) events.push("stain_selected");
  if (!c.fabricKnown) events.push("fabric_unknown");
  if (c.careLabel === "no_label") events.push("no_care_label");

  const gate = evaluateGate({
    fabricKnown: c.fabricKnown,
    fabricLabelPresent: c.careLabel === "available",
    colourfastnessKnown: c.testResult === "Passed" || c.colour === "White",
    existingDamage: c.visibleDamage === "Yes",
    activeColourBleeding: c.activeColourBleeding === "Yes",
    unknownPreviousChemical: c.previouslyTreated === "Yes — product unknown",
    safetyEvaluationAvailable: c.safetyEngineAvailable,
  });

  const base = {
    stain: {
      name: c.stainName || "Not identified",
      category: c.stainCategory || "Not classified",
      confidence: stainConfidence(c),
    },
    test: {
      required: concealedTestRequired(c),
      recorded: c.testResult,
      locations: CONCEALED_TEST_LOCATIONS,
    },
    checks: CHECK_AFTER_EVERY_STEP,
    avoid: avoidList(c),
    analyticsEvents: events,
  };

  const stop = (
    status: RetailStatus,
    statusMessage: string,
    immediateAction: string,
    blockReason?: string,
  ): RetailResult => ({
    ...base,
    status,
    statusMessage,
    immediateAction,
    blockReason,
    escalationRequired: true,
    product: { kind: "none", message: "No treatment guidance is shown while this case is stopped." },
    steps: [],
    expectedOutcome: expectedOutcome(c, status),
  });

  /* 1. Safety check unavailable — fail closed. */
  if (!c.safetyEngineAvailable) {
    return stop(
      "stop_escalate",
      "The safety check could not run, so no treatment can be shown.",
      "Set the garment aside and escalate the case.",
      "safety_engine_unavailable",
    );
  }

  /* 2. Damage-type cases. */
  if (c.visibleDamage === "Yes") {
    return stop(
      "possible_fabric_damage",
      "This garment already shows damage.",
      "Do not treat. Record the damage and escalate for professional assessment.",
      "existing_damage",
    );
  }
  if (c.observations?.appeared && c.observations.appeared !== "No" && c.observations.appeared !== "Not sure") {
    return stop(
      "possible_fabric_damage",
      "The mark appeared after a process, so it may be fabric damage rather than a stain.",
      "Do not treat. Escalate for professional assessment.",
      "suspected_process_damage",
    );
  }

  /* 3. Non-overridable stops from the Constitution gate. */
  if (gate.outcome === "blocked") {
    return stop("stop_escalate", gate.message, "Stop treatment and escalate this case.", gate.blockReason);
  }

  /* 4. Concealed-area test outcomes. */
  if (c.testResult === "Failed") {
    events.push("concealed_test_failed");
    return stop(
      "stop_escalate",
      "The concealed-area test failed.",
      "Stop. Do not treat this garment and escalate the case.",
      "failed_concealed_test",
    );
  }
  if (c.testResult === "Unsure") {
    return stop(
      "stop_escalate",
      "The concealed-area test result is not clear.",
      "Stop and escalate rather than risk the garment.",
      "inconclusive_concealed_test",
    );
  }
  if (c.testResult === "No concealed area available") {
    return stop(
      "stop_escalate",
      "There is no concealed area available to test safely.",
      "No treatment steps can be given. Escalate the case.",
      "no_concealed_test_area",
    );
  }

  /* 5. Approved product resolution — data driven, never invented. */
  let product: RetailResult["product"];
  let steps: string[] = [];

  if (c.kit.kind === "company") {
    const usable = usableKitInstruction(sources.kitInstruction);
    if (usable) {
      product = { kind: "verified_kit", name: usable.productName, message: `Approved instruction for ${usable.productName}.` };
      steps = usable.steps;
    } else {
      events.push("no_verified_mapping");
      product = { kind: "fallback", message: LABEL_FALLBACK_INSTRUCTION };
    }
  } else if (c.kit.kind === "basic") {
    const method = usableBasicMethod(sources.basicMethods ?? []);
    if (method) {
      events.push("domestic_method_used");
      product = { kind: "verified_basic", name: method.title, message: `Approved basic method: ${method.title}.` };
      steps = method.steps;
    } else {
      events.push("no_verified_mapping");
      product = { kind: "none", message: NO_VERIFIED_BASIC_METHOD };
    }
  } else if (c.kit.kind === "other") {
    events.push("no_verified_mapping");
    product = { kind: "fallback", message: LABEL_FALLBACK_INSTRUCTION };
  } else {
    events.push("no_verified_mapping");
    product = {
      kind: "none",
      message: "No spotting product is available for this case, so no treatment steps can be shown.",
    };
  }

  /* 6. Testing gate — always before actionable guidance. */
  if (base.test.required) {
    events.push("concealed_test_required");
    return {
      ...base,
      status: "test_first",
      statusMessage:
        "The fabric or colour behaviour is not confirmed, so a concealed-area test is required before any treatment.",
      immediateAction: "Run the concealed-area test and record the result before continuing.",
      escalationRequired: false,
      product,
      steps: [],
      expectedOutcome: expectedOutcome(c, "test_first"),
    };
  }

  /* 7. No approved method → no chemistry, but not a safety stop. */
  if (!steps.length) {
    return {
      ...base,
      status: "no_approved_method",
      statusMessage: "No approved method is available for this combination.",
      immediateAction: product.message,
      escalationRequired: true,
      product,
      steps: [],
      expectedOutcome: expectedOutcome(c, "no_approved_method"),
    };
  }

  return {
    ...base,
    status: "safe_to_proceed",
    statusMessage: "The safety checks passed for this case.",
    immediateAction: "Work in small stages and inspect the garment after every step.",
    escalationRequired: false,
    product,
    steps,
    expectedOutcome: expectedOutcome(c, "safe_to_proceed"),
  };
}

/* ------------------------------------------------------------------ */
/* Escalation                                                          */
/* ------------------------------------------------------------------ */

export type EscalationSummary = {
  createdAt: string;
  reason: string;
  stain: { name: string; category: string; confidence: string; observations: Record<string, string> };
  garment: Record<string, string>;
  kit: KitSelection;
  previousTreatment: string;
  concealedTestResult: TestResult;
  photographs: string[];
  operatorNotes: string;
  engineVersion: string;
};

export function buildEscalationSummary(
  c: RetailCase,
  result: RetailResult,
  reason: string,
  operatorNotes = "",
  photographs: string[] = [],
): EscalationSummary {
  return {
    createdAt: new Date().toISOString(),
    reason: reason || result.statusMessage,
    stain: {
      name: result.stain.name,
      category: result.stain.category,
      confidence: result.stain.confidence,
      observations: c.observations ?? {},
    },
    garment: {
      fabric: c.fabricKnown ? c.fabric || "Selected" : "Unknown",
      careLabel: c.careLabel,
      colour: c.colour,
      stainAge: c.stainAge,
      heatExposed: c.heatExposed,
      visibleDamage: c.visibleDamage,
      activeColourBleeding: c.activeColourBleeding,
      specialConstruction: c.specialConstruction,
    },
    kit: c.kit,
    previousTreatment: c.previouslyTreated,
    concealedTestResult: c.testResult,
    photographs,
    operatorNotes,
    engineVersion: RETAIL_ENGINE_VERSION,
  };
}
