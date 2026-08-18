/**
 * LAYER 2 — Professional Spotting decision engine.
 *
 * Deterministic. No AI. Fails closed. Never invents chemistry and never
 * assumes brand equivalence. It extends the Layer 1 retail evaluation and can
 * only ever be as restrictive, or more restrictive, than the Constitution gate.
 */

import { LABEL_FALLBACK_INSTRUCTION } from "@/lib/constitution";
import { canShowDomesticTreatment, evaluateGate } from "@/lib/contentGate";
import { isDisplayableAsGuidance, type Classified } from "@/lib/dataSource";
import { COMPONENT_LABEL, type ComponentKey } from "@/data/taxonomy";
import { CONCEALED_TEST_LOCATIONS, type TestResult } from "@/data/retailSpotting";
import {
  APPROVED_DECOMPOSITIONS,
  BASIC_ALTERNATIVE_LABEL,
  ESCALATION_TRIGGERS,
  MASTER_ONLY_CAPABILITIES,
  NO_APPROVED_SEQUENCE,
  UNKNOWN_OPTION,
  type ApprovedDecomposition,
  type ComponentPlanEntry,
  type EscalationTriggerKey,
  type MasterOnlyCapability,
  type UnknownFabricOutcome,
} from "@/data/professionalSpotting";
import type { BasicMethod, KitSelection, RetailCase } from "@/lib/retailEngine";

export const PROFESSIONAL_ENGINE_VERSION = "professional-engine-v1.0.0";

/* ------------------------------------------------------------------ */
/* Case                                                                */
/* ------------------------------------------------------------------ */

export type ProfessionalCase = RetailCase & {
  /** Answers keyed by PRO_GARMENT_QUESTIONS / PRO_STAIN_QUESTIONS keys. */
  garment: Record<string, string>;
  stain: Record<string, string>;
  /** Unknown-fabric structured test panel answers. */
  fabricTests: Record<string, string>;
  /** Previous-chemical tracking answers. */
  previousChemical: Record<string, string>;
  previousChemistryFamily?: string;
  previousProductKey?: string;
  /** Operator-selected component to work on now. */
  activeComponent?: ComponentKey;
  highValueGarment: boolean;
  operatorUncertain: boolean;
  colourfastnessFailures: number;
  notes: string;
  supervisorNotes: string;
  photos: { before: string[]; after: string[] };
};

export const EMPTY_PRO_EXTRA = {
  garment: {},
  stain: {},
  fabricTests: {},
  previousChemical: {},
  highValueGarment: false,
  operatorUncertain: false,
  colourfastnessFailures: 0,
  notes: "",
  supervisorNotes: "",
  photos: { before: [], after: [] },
} satisfies Omit<ProfessionalCase, keyof RetailCase>;

/* ------------------------------------------------------------------ */
/* Verified product records supplied by the caller (database-backed)   */
/* ------------------------------------------------------------------ */

export type VerifiedProduct = {
  productId: string;
  productKey: string;
  productName: string;
  companyId: string | null;
  companyName: string;
  chemistryFamily?: string | null;
  verifiedPurpose?: string | null;
  eligibleComponents: string[];
  compatibleStages: number[];
  prohibitions: string[];
  applicationMethod?: string | null;
  dilution?: string | null;
  temperature?: string | null;
  contactTime?: string | null;
  mechanicalAction?: string | null;
  rinseRequirement?: string | null;
  neutralisation?: string | null;
  ppe: string[];
  incompatibilities: string[];
  inspectionPoint?: string | null;
  maximumAttempts?: number | null;
  sourceDocument?: string | null;
  documentVersion?: string | null;
};

export type ProductTransition = {
  fromProductKey?: string | null;
  fromChemistryFamily?: string | null;
  toProductKey?: string | null;
  toChemistryFamily?: string | null;
  permission: "permitted" | "permitted_with_rinse" | "prohibited" | string;
  requiredRinse?: string | null;
  requiredNeutralisation?: string | null;
  inspectionRequired?: boolean | null;
  approvalStatus?: string | null;
};

/* ------------------------------------------------------------------ */
/* Component plan (multi-component stains)                             */
/* ------------------------------------------------------------------ */

export function findApprovedDecomposition(stainName?: string): ApprovedDecomposition | null {
  const name = (stainName ?? "").trim().toLowerCase();
  if (!name) return null;
  return (
    APPROVED_DECOMPOSITIONS.find((d) => d.match.some((m) => name.includes(m))) ?? null
  );
}

export type ComponentPlan = {
  available: boolean;
  label: string;
  message: string;
  entries: (ComponentPlanEntry & { componentLabel: string })[];
  finalStage: string;
  source?: string;
  version?: string;
};

export function buildComponentPlan(c: ProfessionalCase): ComponentPlan {
  const approved = findApprovedDecomposition(c.stainName);
  if (!approved) {
    return {
      available: false,
      label: c.stainName || "Not identified",
      message: NO_APPROVED_SEQUENCE,
      entries: [],
      finalStage: "",
    };
  }
  return {
    available: true,
    label: approved.label,
    message: "Approved component sequence. Work through one component at a time.",
    entries: approved.components.map((e) => ({ ...e, componentLabel: COMPONENT_LABEL[e.component] })),
    finalStage: approved.finalStage,
    source: approved.source,
    version: approved.version,
  };
}

/* ------------------------------------------------------------------ */
/* Unknown-fabric pathway                                              */
/* ------------------------------------------------------------------ */

export function unknownFabricOutcome(c: ProfessionalCase): UnknownFabricOutcome | null {
  const known = c.fabricKnown && (c.garment.fibre ?? UNKNOWN_OPTION) !== UNKNOWN_OPTION;
  if (known) return null;
  const t = c.fabricTests;

  if (t.seam === "Damage seen" || t.product_reaction === "Adverse reaction" || t.colour_transfer === "Clear transfer") {
    return "Do not spot-treat";
  }
  if (t.coating === "Coating present" || t.coating === "Adhesive present" || t.moisture === "Swelling or shrinkage") {
    return "Master Spotter assessment required";
  }
  const answered = ["visual", "moisture", "colour_transfer", "seam", "coating"].filter(
    (k) => t[k] && t[k] !== "Not done",
  ).length;
  if (answered < 4 || t.visual === "Inconclusive") return "Additional test required";
  if (t.operator_confidence === "Low" || t.colour_transfer === "Slight transfer" || t.seam === "Minor change") {
    return "Proceed with restricted products";
  }
  return "Proceed within verified limits";
}

/* ------------------------------------------------------------------ */
/* Previous-chemical transition safety                                 */
/* ------------------------------------------------------------------ */

export type TransitionDecision = {
  allowed: boolean;
  status: "permitted" | "requires_rinse" | "prohibited" | "unverified" | "not_applicable";
  message: string;
  requiredRinse?: string;
  requiredNeutralisation?: string;
  inspectionRequired: boolean;
};

export function evaluateTransition(
  c: ProfessionalCase,
  product: VerifiedProduct | null,
  transitions: ProductTransition[] = [],
): TransitionDecision {
  const previous = c.previousChemical.product ?? "None";
  if (previous === "None") {
    return { allowed: true, status: "not_applicable", message: "No previous chemical recorded.", inspectionRequired: false };
  }
  if (previous === "Unknown product") {
    return {
      allowed: false,
      status: "prohibited",
      message:
        "An unknown product was already applied. The interaction cannot be verified, so no further product may be applied in professional mode.",
      inspectionRequired: true,
    };
  }
  if (!product) {
    return {
      allowed: false,
      status: "unverified",
      message: "No eligible verified product is available, so the transition cannot be checked.",
      inspectionRequired: true,
    };
  }

  const approved = transitions.filter(
    (t) => (t.approvalStatus ?? "").toLowerCase() === "approved" || (t.approvalStatus ?? "").toLowerCase() === "published",
  );
  const match = approved.find(
    (t) =>
      (t.toProductKey === product.productKey || t.toChemistryFamily === product.chemistryFamily) &&
      (t.fromProductKey === c.previousProductKey || t.fromChemistryFamily === c.previousChemistryFamily),
  );

  if (!match) {
    return {
      allowed: false,
      status: "unverified",
      message:
        "This product transition is not covered by an approved mapping. Do not continue — escalate to Master Spotter.",
      inspectionRequired: true,
    };
  }
  if (match.permission === "prohibited") {
    return {
      allowed: false,
      status: "prohibited",
      message: "This product transition is prohibited by the approved mapping.",
      inspectionRequired: true,
    };
  }
  const needsRinse = match.permission === "permitted_with_rinse" || !!match.requiredRinse;
  const rinsed = c.previousChemical.rinsed === "Yes";
  if (needsRinse && !rinsed) {
    return {
      allowed: false,
      status: "requires_rinse",
      message:
        "The approved mapping requires rinsing, flushing or neutralisation before this product. Complete that stage and record it first.",
      requiredRinse: match.requiredRinse ?? undefined,
      requiredNeutralisation: match.requiredNeutralisation ?? undefined,
      inspectionRequired: true,
    };
  }
  return {
    allowed: true,
    status: "permitted",
    message: "This transition is covered by an approved mapping.",
    requiredRinse: match.requiredRinse ?? undefined,
    requiredNeutralisation: match.requiredNeutralisation ?? undefined,
    inspectionRequired: !!match.inspectionRequired,
  };
}

/* ------------------------------------------------------------------ */
/* Product eligibility — stage and component filtered                  */
/* ------------------------------------------------------------------ */

/** Only products verified for this company, component and stage are eligible. */
export function eligibleProducts(
  records: Classified<VerifiedProduct>[],
  opts: { kit: KitSelection; component?: ComponentKey; stageNumber?: number; restricted?: boolean },
): VerifiedProduct[] {
  if (opts.kit.kind !== "company") return [];
  return records
    .filter(isDisplayableAsGuidance)
    .map((r) => r.data)
    // R20/§2 — never assume equivalence across companies.
    .filter((p) => p.companyId === (opts.kit as { companyId: string }).companyId)
    .filter((p) => (opts.component ? p.eligibleComponents.includes(opts.component) : true))
    .filter((p) => (opts.stageNumber ? p.compatibleStages.includes(opts.stageNumber) : true))
    // Restricted pathway: only products with no recorded prohibitions.
    .filter((p) => (opts.restricted ? p.prohibitions.length === 0 : true));
}

/* ------------------------------------------------------------------ */
/* Basic alternative (§10)                                             */
/* ------------------------------------------------------------------ */

export function basicAlternative(
  c: ProfessionalCase,
  methods: BasicMethod[],
): { method: BasicMethod; label: string } | null {
  const dangerousPrevious =
    c.previousChemical.product === "Unknown product" || c.previouslyTreated === "Yes — product unknown";
  if (dangerousPrevious) return null;
  if (c.visibleDamage === "Yes" || c.activeColourBleeding === "Yes") return null;
  if (c.garment.colourfastness === "Failed") return null;
  const method = methods.find((m) => canShowDomesticTreatment({ confidence: m.confidence, status: m.status }) && m.steps.length > 0);
  return method ? { method, label: BASIC_ALTERNATIVE_LABEL } : null;
}

/* ------------------------------------------------------------------ */
/* Escalation triggers (§12)                                           */
/* ------------------------------------------------------------------ */

export function activeEscalationTriggers(
  c: ProfessionalCase,
  extra: { transition?: TransitionDecision; stainRemains?: boolean } = {},
): EscalationTriggerKey[] {
  const keys: EscalationTriggerKey[] = [];
  if (!c.fabricKnown || (c.garment.fibre ?? UNKNOWN_OPTION) === UNKNOWN_OPTION) keys.push("fabric_unidentified");
  if (c.colourfastnessFailures >= 2 || c.garment.colourfastness === "Failed") keys.push("colourfastness_failed");
  if (c.activeColourBleeding === "Yes") keys.push("active_bleeding");
  if (c.previousChemical.product === "Unknown product" || c.previouslyTreated === "Yes — product unknown") {
    keys.push("multiple_unknown_chemicals");
  }
  if (c.garment.existingDamage === "Suspected chemical damage" || c.previousChemical.textureChange === "Yes" || c.heatExposed === "Yes") {
    keys.push("suspected_damage");
  }
  if (c.highValueGarment) keys.push("high_value_garment");
  if (extra.stainRemains) keys.push("stain_remains");
  if (extra.transition && (extra.transition.status === "unverified" || extra.transition.status === "prohibited")) {
    keys.push("unverified_transition");
  }
  if (
    ["Coated", "Laminated", "Bonded"].includes(c.garment.construction ?? "") ||
    ["Adhesive or bonded trim", "Beads or sequins", "Leather or fur trim"].includes(c.garment.trims ?? "") ||
    c.specialConstruction === "Yes"
  ) {
    keys.push("sensitive_construction");
  }
  if (c.operatorUncertain || c.stain.confidence === "Low") keys.push("operator_uncertain");
  return Array.from(new Set(keys));
}

export function escalationTriggerLabel(key: EscalationTriggerKey): string {
  return ESCALATION_TRIGGERS.find((t) => t.key === key)?.label ?? key;
}

/* ------------------------------------------------------------------ */
/* Master-only boundary (§11)                                          */
/* ------------------------------------------------------------------ */

export function isMasterOnly(capability: string): capability is MasterOnlyCapability {
  return (MASTER_ONLY_CAPABILITIES as readonly string[]).includes(capability);
}

export function professionalCanUse(capability: string): boolean {
  return !isMasterOnly(capability);
}

/* ------------------------------------------------------------------ */
/* Decision card                                                       */
/* ------------------------------------------------------------------ */

export type ProStatus =
  | "proceed"
  | "proceed_restricted"
  | "test_required"
  | "additional_information_required"
  | "no_verified_product"
  | "stop_escalate";

export const PRO_STATUS_LABEL: Record<ProStatus, string> = {
  proceed: "Proceed within verified limits",
  proceed_restricted: "Proceed with restricted products",
  test_required: "Test required before treatment",
  additional_information_required: "Additional information required",
  no_verified_product: "No verified product available",
  stop_escalate: "Stop — escalate to Master Spotter",
};

export const PRO_STATUS_TONE: Record<ProStatus, "green" | "amber" | "red" | "neutral"> = {
  proceed: "green",
  proceed_restricted: "amber",
  test_required: "amber",
  additional_information_required: "amber",
  no_verified_product: "neutral",
  stop_escalate: "red",
};

export type ProDecisionCard = {
  status: ProStatus;
  statusMessage: string;
  blockReason?: string;
  fabricRisk: { summary: string; unknownPathway: UnknownFabricOutcome | null; testRequired: boolean; locations: readonly string[] };
  componentPlan: ComponentPlan;
  activeComponent?: { key: ComponentKey; label: string; stageNumber?: number; stageLabel?: string };
  kit: { label: string; note: string };
  product: VerifiedProduct | null;
  verification: { source: string; version: string; status: string };
  instructions: { label: string; value: string }[];
  ppe: string[];
  prohibited: string[];
  rinseRequirement: string;
  inspectionCheckpoint: string;
  nextActions: string[];
  expectedOutcome: string;
  transition: TransitionDecision;
  escalation: { required: boolean; triggers: { key: EscalationTriggerKey; label: string }[] };
  basicAlternative: { title: string; steps: string[]; label: string } | null;
  engineVersion: string;
};

const val = (v?: string | null) => (v && String(v).trim() ? String(v).trim() : LABEL_FALLBACK_INSTRUCTION);

export function buildDecisionCard(
  c: ProfessionalCase,
  sources: {
    products?: Classified<VerifiedProduct>[];
    transitions?: ProductTransition[];
    basicMethods?: BasicMethod[];
    stainRemains?: boolean;
  } = {},
): ProDecisionCard {
  const plan = buildComponentPlan(c);
  const planEntry = plan.entries.find((e) => e.component === c.activeComponent);
  const unknownPathway = unknownFabricOutcome(c);
  const restricted = unknownPathway === "Proceed with restricted products";

  const candidates = eligibleProducts(sources.products ?? [], {
    kit: c.kit,
    component: c.activeComponent,
    stageNumber: planEntry?.stageNumber,
    restricted,
  });
  const product = candidates[0] ?? null;
  const transition = evaluateTransition(c, product, sources.transitions ?? []);

  const gate = evaluateGate({
    fabricKnown: c.fabricKnown,
    fabricLabelPresent: c.careLabel === "available",
    colourfastnessKnown: c.garment.colourfastness === "Passed" || c.testResult === "Passed" || c.colour === "White",
    existingDamage: c.visibleDamage === "Yes" || (c.garment.existingDamage ?? "None") !== "None",
    activeColourBleeding: c.activeColourBleeding === "Yes",
    unknownPreviousChemical:
      c.previouslyTreated === "Yes — product unknown" || c.previousChemical.product === "Unknown product",
    safetyEvaluationAvailable: c.safetyEngineAvailable,
  });

  const triggers = activeEscalationTriggers(c, { transition, stainRemains: sources.stainRemains });
  const testRequired =
    c.garment.colourfastness !== "Passed" &&
    (c.testResult !== "Passed" || !c.fabricKnown || (c.garment.trims ?? "None") !== "None");

  let status: ProStatus = "proceed";
  let statusMessage = "Safety checks passed for this case within verified limits.";
  let blockReason: string | undefined;

  if (!c.safetyEngineAvailable) {
    status = "stop_escalate";
    statusMessage = "The safety check could not run, so no treatment guidance can be shown.";
    blockReason = "safety_engine_unavailable";
  } else if (gate.outcome === "blocked") {
    status = "stop_escalate";
    statusMessage = gate.message;
    blockReason = gate.blockReason;
  } else if (unknownPathway === "Do not spot-treat" || unknownPathway === "Master Spotter assessment required") {
    status = "stop_escalate";
    statusMessage =
      unknownPathway === "Do not spot-treat"
        ? "The fabric test panel shows an unsafe response. Do not spot-treat this garment."
        : "The construction or test response needs a Master Spotter assessment.";
    blockReason = "unknown_fabric_pathway";
  } else if (!transition.allowed) {
    status = "stop_escalate";
    statusMessage = transition.message;
    blockReason = `transition_${transition.status}`;
  } else if (c.testResult === "Failed") {
    status = "stop_escalate";
    statusMessage = "The colour or fabric test failed.";
    blockReason = "failed_test";
  } else if (unknownPathway === "Additional test required") {
    status = "additional_information_required";
    statusMessage = "Complete the structured fabric test panel before any product is applied.";
  } else if (!c.activeComponent) {
    status = "additional_information_required";
    statusMessage = "Select the stain component you are treating now.";
  } else if (!product) {
    status = "no_verified_product";
    statusMessage =
      c.kit.kind === "company"
        ? "No product in the selected kit is verified for this component and stage."
        : "Select a verified spotting kit to see eligible products.";
  } else if (testRequired && c.testResult !== "Passed") {
    status = "test_required";
    statusMessage = "Record a concealed-area or colourfastness test result before applying this product.";
  } else if (restricted) {
    status = "proceed_restricted";
    statusMessage = "Proceed with restricted products only, inspecting after every step.";
  }

  const actionable = status === "proceed" || status === "proceed_restricted";

  return {
    status,
    statusMessage,
    blockReason,
    fabricRisk: {
      summary: fabricRiskSummary(c),
      unknownPathway,
      testRequired,
      locations: CONCEALED_TEST_LOCATIONS,
    },
    componentPlan: plan,
    activeComponent: c.activeComponent
      ? {
          key: c.activeComponent,
          label: COMPONENT_LABEL[c.activeComponent],
          stageNumber: planEntry?.stageNumber,
          stageLabel: planEntry?.stageLabel,
        }
      : undefined,
    kit: {
      label:
        c.kit.kind === "company"
          ? c.kit.companyName
          : c.kit.kind === "basic"
            ? "Basic/domestic products"
            : c.kit.kind === "other"
              ? c.kit.kitName
              : "No kit selected",
      note: "Products are used only as verified for this company. Similar names across companies are not equivalent.",
    },
    product: actionable ? product : null,
    verification: {
      source: product?.sourceDocument ?? "Not recorded",
      version: product?.documentVersion ?? "Not recorded",
      status: product ? "Verified approved record" : "No verified record selected",
    },
    instructions: actionable && product
      ? [
          { label: "Product", value: product.productName },
          { label: "Treatment stage", value: planEntry ? `${planEntry.stageNumber} — ${planEntry.stageLabel}` : LABEL_FALLBACK_INSTRUCTION },
          { label: "Application method", value: val(product.applicationMethod) },
          { label: "Approved dilution", value: val(product.dilution) },
          { label: "Approved temperature", value: val(product.temperature) },
          { label: "Approved dwell/contact time", value: val(product.contactTime) },
          { label: "Mechanical action allowed", value: val(product.mechanicalAction) },
          { label: "Maximum verified repetition", value: product.maximumAttempts ? String(product.maximumAttempts) : LABEL_FALLBACK_INSTRUCTION },
        ]
      : [],
    ppe: product?.ppe?.length ? product.ppe : ["Follow the current product label or technical data sheet."],
    prohibited: [
      ...(product?.incompatibilities ?? []),
      ...(product?.prohibitions ?? []),
      "Never mix products.",
      "Never substitute a similarly named product from another company.",
    ],
    rinseRequirement: actionable
      ? val(product?.rinseRequirement ?? transition.requiredRinse ?? product?.neutralisation ?? null)
      : "No product may be applied while this case is stopped.",
    inspectionCheckpoint: actionable
      ? val(product?.inspectionPoint ?? "Inspect the treated area after every application before continuing.")
      : "Inspect and document the garment, then escalate.",
    nextActions: nextActions(status, plan, c),
    expectedOutcome: expectedOutcome(status, c),
    transition,
    escalation: {
      required: status === "stop_escalate" || triggers.length > 0,
      triggers: triggers.map((k) => ({ key: k, label: escalationTriggerLabel(k) })),
    },
    basicAlternative: (() => {
      const alt = basicAlternative(c, sources.basicMethods ?? []);
      return alt ? { title: alt.method.title, steps: alt.method.steps, label: alt.label } : null;
    })(),
    engineVersion: PROFESSIONAL_ENGINE_VERSION,
  };
}

function fabricRiskSummary(c: ProfessionalCase): string {
  const fibre = c.garment.fibre && c.garment.fibre !== UNKNOWN_OPTION ? c.garment.fibre : "Unidentified fibre";
  const construction = c.garment.construction && c.garment.construction !== UNKNOWN_OPTION ? c.garment.construction.toLowerCase() : "unrecorded construction";
  const colourfast =
    c.garment.colourfastness === "Passed"
      ? "colourfastness confirmed"
      : c.garment.colourfastness === "Failed"
        ? "colourfastness failed"
        : "colourfastness not confirmed";
  return `${fibre}, ${construction}, ${colourfast}.`;
}

function nextActions(status: ProStatus, plan: ComponentPlan, c: ProfessionalCase): string[] {
  if (status === "stop_escalate") return ["Document the case", "Escalate to Master Spotter"];
  if (status === "additional_information_required") return ["Complete the outstanding assessment", "Re-check the decision card"];
  if (status === "test_required") return ["Run the concealed-area test", "Record the result"];
  if (status === "no_verified_product") return ["Change kit", "Escalate to Master Spotter"];
  const remaining = plan.entries.filter((e) => e.component !== c.activeComponent).map((e) => `Next component: ${e.componentLabel}`);
  return ["Apply as instructed and inspect", "Flush, rinse or neutralise as required", ...remaining, plan.finalStage].filter(Boolean);
}

function expectedOutcome(status: ProStatus, c: ProfessionalCase): string {
  if (status === "stop_escalate") return "Professional or Master Spotter assessment required. Removal is never guaranteed.";
  if (c.stain.condition === "Heat-set" || c.stain.condition === "Oxidised") return "Partial reduction is realistic. Removal is never guaranteed.";
  if (c.stain.condition === "Fresh") return "Good reduction is realistic within the approved sequence. Removal is never guaranteed.";
  return "Reduction possible. Removal is never guaranteed.";
}

/* ------------------------------------------------------------------ */
/* Escalation package — complete case history, no re-entry             */
/* ------------------------------------------------------------------ */

export type ProfessionalEscalation = {
  createdAt: string;
  layer: "professional";
  reason: string;
  triggers: { key: EscalationTriggerKey; label: string }[];
  garment: Record<string, string>;
  stainAssessment: Record<string, string>;
  retailAnswers: Record<string, string>;
  fabricTests: Record<string, string>;
  previousChemical: Record<string, string>;
  componentPlan: ComponentPlan;
  kit: KitSelection;
  productUsed: string | null;
  transition: TransitionDecision;
  concealedTestResult: TestResult;
  photos: { before: string[]; after: string[] };
  operatorNotes: string;
  supervisorNotes: string;
  decisionStatus: ProStatus;
  engineVersion: string;
};

export function buildProfessionalEscalation(
  c: ProfessionalCase,
  card: ProDecisionCard,
  reason = "",
): ProfessionalEscalation {
  return {
    createdAt: new Date().toISOString(),
    layer: "professional",
    reason: reason || card.statusMessage,
    triggers: card.escalation.triggers,
    garment: c.garment,
    stainAssessment: { ...c.stain, name: c.stainName ?? "Not identified", category: c.stainCategory ?? "Not classified" },
    retailAnswers: {
      careLabel: c.careLabel,
      colour: c.colour,
      stainAge: c.stainAge,
      heatExposed: c.heatExposed,
      visibleDamage: c.visibleDamage,
      activeColourBleeding: c.activeColourBleeding,
      specialConstruction: c.specialConstruction,
    },
    fabricTests: c.fabricTests,
    previousChemical: c.previousChemical,
    componentPlan: card.componentPlan,
    kit: c.kit,
    productUsed: card.product?.productName ?? null,
    transition: card.transition,
    concealedTestResult: c.testResult,
    photos: c.photos,
    operatorNotes: c.notes,
    supervisorNotes: c.supervisorNotes,
    decisionStatus: card.status,
    engineVersion: PROFESSIONAL_ENGINE_VERSION,
  };
}
