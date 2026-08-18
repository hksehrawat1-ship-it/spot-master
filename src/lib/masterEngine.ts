/**
 * LAYER 3 — Master Spotter decision engine.
 *
 * Deterministic. No AI. Fails closed. Never invents chemistry, never assumes
 * brand equivalence, never ranks products and never releases a non-overridable
 * safety block. It extends the Layer 2 professional case so an operator can
 * change working level without re-entering anything.
 */

import { LABEL_FALLBACK_INSTRUCTION } from "@/lib/constitution";
import { canShowDomesticTreatment, evaluateGate } from "@/lib/contentGate";
import { isDisplayableAsGuidance, type Classified } from "@/lib/dataSource";
import {
  buildComponentPlan,
  type ComponentPlan,
  type ProductTransition,
  type ProfessionalCase,
  type VerifiedProduct,
} from "@/lib/professionalEngine";
import { EMPTY_PRO_EXTRA } from "@/lib/professionalEngine";
import type { BasicMethod, KitSelection } from "@/lib/retailEngine";
import {
  COMPONENT_MAP_ORDER,
  FAIL_CLOSED_MESSAGE,
  FORBIDDEN_CALCULATIONS,
  IMMEDIATE_STOP_CONDITIONS,
  INSPECTION_RESULTS,
  MARK_KINDS,
  MASTER_BASIC_LABEL,
  MASTER_STAGES,
  NON_REMOVABLE_MESSAGE,
  NOT_VERIFIED,
  NO_SDS_EMERGENCY_TEXT,
  NO_STRONGER_CHEMISTRY_NOTE,
  OFFLINE_STALE_WARNING,
  OPERATOR_OBSERVATION_LABEL,
  SAFETY_HIERARCHY,
  SUPERSEDED_WARNING,
  TRANSITION_OUTCOMES,
  TRIMS_AND_FINISHES,
  UNKNOWN_PRODUCT,
  UNVERIFIED_TRANSITION_MESSAGE,
  type ComparisonOutcomeKey,
  type ComponentMapKey,
  type FailureCauseKey,
  type FailureConclusionKey,
  type ForbiddenCalculation,
  type InspectionResultKey,
  type MarkKind,
  type MasterOutcome,
  type MasterStageKey,
  type SafetyHierarchyKey,
  type StopConditionKey,
  type TransitionOutcomeKey,
  type TrimKey,
} from "@/data/masterSpotter";

export const MASTER_ENGINE_VERSION = "master-engine-v1.0.0";

/* ------------------------------------------------------------------ */
/* Case                                                                */
/* ------------------------------------------------------------------ */

export type LedgerEntry = {
  id: string;
  entryOrder: number;
  stageKey?: MasterStageKey | null;
  stageNumber?: number | null;
  componentKey?: string | null;
  productId?: string | null;
  productName: string;
  manufacturer?: string | null;
  amount?: string | null;
  dilution?: string | null;
  temperature?: string | null;
  contactTime?: string | null;
  mechanicalAction?: string | null;
  steamUsed: boolean;
  vacuumUsed: boolean;
  spottingBoardUsed: boolean;
  rinsePerformed: boolean;
  neutralizationPerformed: boolean;
  dryingOrHeat?: string | null;
  visibleResponse?: string | null;
  colourMovement?: string | null;
  textureChange?: string | null;
  inspectionResult?: InspectionResultKey | null;
  operatorObservation: boolean;
  notes?: string | null;
  performedAt: string;
  operator?: string | null;
};

export type MasterCase = ProfessionalCase & {
  caseId: string | null;
  caseReference: string;
  /** Advanced intake */
  garmentIdentity: Record<string, string>;
  fibreAssessment: {
    certainty: string;
    category: string;
    named: string;
    blend: string;
    composition: string;
    identifiedBy: string;
    samplingLocation: string;
    samplingAuthorised: boolean;
  };
  constructionTypes: string[];
  dyeColour: { method: string; flags: Record<string, string> };
  trims: TrimKey[];
  /** Advanced diagnosis */
  diagnosis: {
    markKind: MarkKind;
    likelyIdentity: string;
    alternativeIdentities: string[];
    primaryComponent: string;
    secondaryComponent: string;
    tertiaryComponent: string;
    physicalState: string;
    colour: string;
    odour: string;
    conditions: string[];
  };
  /** Evidence workspace */
  evidencePanel: {
    observed: string[];
    supporting: string[];
    contradicting: string[];
    alternatives: string[];
    missingInformation: string[];
    confidence: Record<string, string>;
    sources: string[];
  };
  ledger: LedgerEntry[];
  /** Kits selected for comparison. */
  selectedKits: KitSelection[];
  inventory: string[];
  activeStage: MasterStageKey | null;
  stopConditions: StopConditionKey[];
  outcome: MasterOutcome | null;
  finalDisposition: string;
  customerNotes: string;
  /** Set false when the verified data layer could not be loaded. */
  technicalDataAvailable: boolean;
  offline: boolean;
};

export const EMPTY_MASTER_EXTRA = {
  caseId: null,
  caseReference: "",
  garmentIdentity: {},
  fibreAssessment: {
    certainty: "",
    category: "",
    named: "",
    blend: "",
    composition: "",
    identifiedBy: "",
    samplingLocation: "",
    samplingAuthorised: false,
  },
  constructionTypes: [],
  dyeColour: { method: "", flags: {} },
  trims: [],
  diagnosis: {
    markKind: "stain",
    likelyIdentity: "",
    alternativeIdentities: [],
    primaryComponent: "",
    secondaryComponent: "",
    tertiaryComponent: "",
    physicalState: "",
    colour: "",
    odour: "",
    conditions: [],
  },
  evidencePanel: {
    observed: [],
    supporting: [],
    contradicting: [],
    alternatives: [],
    missingInformation: [],
    confidence: {},
    sources: [],
  },
  ledger: [],
  selectedKits: [],
  inventory: [],
  activeStage: null,
  stopConditions: [],
  outcome: null,
  finalDisposition: "",
  customerNotes: "",
  technicalDataAvailable: true,
  offline: false,
} satisfies Omit<MasterCase, keyof ProfessionalCase>;

/** Promote a retail/professional case to Master Spotter without losing data. */
export function toMasterCase(base: Partial<ProfessionalCase>, extra: Partial<MasterCase> = {}): MasterCase {
  return {
    ...EMPTY_PRO_EXTRA,
    ...(base as ProfessionalCase),
    ...EMPTY_MASTER_EXTRA,
    ...extra,
  } as MasterCase;
}

/** Fields that must survive a working-level change (acceptance criterion 2). */
export const PRESERVED_CASE_FIELDS = [
  "garment",
  "stain",
  "kit",
  "fabricTests",
  "previousChemical",
  "testResult",
  "photos",
  "notes",
  "supervisorNotes",
] as const;

export function preserveCase<T extends Partial<ProfessionalCase>>(from: T, into: MasterCase): MasterCase {
  const next = { ...into } as Record<string, unknown>;
  for (const key of PRESERVED_CASE_FIELDS) {
    const value = (from as Record<string, unknown>)[key];
    if (value !== undefined) next[key] = value;
  }
  return next as MasterCase;
}

/* ------------------------------------------------------------------ */
/* Most sensitive component (§4)                                       */
/* ------------------------------------------------------------------ */

export function mostSensitiveComponent(c: MasterCase): { label: string; sensitive: boolean; source: string } {
  const sensitiveTrim = c.trims.find((t) => TRIMS_AND_FINISHES.find((x) => x.key === t)?.sensitive);
  if (sensitiveTrim) {
    return {
      label: TRIMS_AND_FINISHES.find((x) => x.key === sensitiveTrim)!.label,
      sensitive: true,
      source: "trim_or_finish",
    };
  }
  const risky = ["Coated", "Laminated", "Bonded", "Adhesive construction", "Flocked", "Velvet", "Pile"];
  const construction = c.constructionTypes.find((x) => risky.includes(x));
  if (construction) return { label: construction, sensitive: true, source: "construction" };
  if (c.fibreAssessment.category === "Leather or suede component" || c.fibreAssessment.category === "Coated or laminated material") {
    return { label: c.fibreAssessment.category, sensitive: true, source: "fibre" };
  }
  if (c.fibreAssessment.category === "Unknown material" || !c.fabricKnown) {
    return { label: "Unidentified material", sensitive: true, source: "fibre" };
  }
  return { label: c.fibreAssessment.named || c.fabric || "Main fabric", sensitive: false, source: "fibre" };
}

/* ------------------------------------------------------------------ */
/* Removable soil vs permanent change (§5)                             */
/* ------------------------------------------------------------------ */

export function isRemovableMark(kind: MarkKind): boolean {
  return MARK_KINDS.find((m) => m.key === kind)?.removable ?? false;
}

export function markKindLabel(kind: MarkKind): string {
  return MARK_KINDS.find((m) => m.key === kind)?.label ?? kind;
}

/* ------------------------------------------------------------------ */
/* Safety hierarchy (§20)                                              */
/* ------------------------------------------------------------------ */

export type SafetyDecision = {
  key: SafetyHierarchyKey;
  rank: number;
  label: string;
  triggered: boolean;
  overridable: boolean;
  message: string;
};

export function safetyDecisions(c: MasterCase, opts: { sdsProhibited?: boolean; humanRisk?: boolean } = {}): SafetyDecision[] {
  const trims = c.trims.map((t) => TRIMS_AND_FINISHES.find((x) => x.key === t)).filter(Boolean);
  const sensitive = mostSensitiveComponent(c);
  const facts: Record<SafetyHierarchyKey, { triggered: boolean; message: string }> = {
    human_safety: {
      triggered: !!opts.humanRisk || c.stopConditions.includes("fumes") || c.stopConditions.includes("unexpected_heat"),
      message: "An immediate human-safety condition is recorded. Stop, ventilate and follow the site emergency procedure.",
    },
    sds_prohibition: {
      triggered: !!opts.sdsProhibited,
      message: "A safety data sheet or manufacturer prohibition applies to this garment or combination.",
    },
    care_label_prohibition: {
      triggered: c.garment.careLabelProhibition === "Yes",
      message: "The care label prohibits this process.",
    },
    damage_or_bleeding: {
      triggered: c.visibleDamage === "Yes" || c.activeColourBleeding === "Yes" || c.stopConditions.length > 0,
      message: "Existing damage or active colour movement is recorded. Chemical treatment is blocked.",
    },
    material_safety: {
      triggered: sensitive.sensitive || trims.length > 0,
      message: `The safety decision follows the most sensitive component: ${sensitive.label}.`,
    },
    unknown_previous_chemistry: {
      triggered:
        c.previouslyTreated === "Yes — product unknown" ||
        c.previousChemical.product === UNKNOWN_PRODUCT ||
        c.ledger.some((e) => e.productName === UNKNOWN_PRODUCT),
      message: "An unknown product was already applied. Incompatible next steps are restricted until the garment is flushed and reassessed.",
    },
    verified_transition: {
      triggered: false,
      message: "Transition requirements are evaluated for every product change.",
    },
    stain_removal: { triggered: true, message: "Stain removal is pursued only within the limits above." },
    cost_convenience: { triggered: true, message: "Cost and convenience never override a safety rule." },
  };

  return SAFETY_HIERARCHY.map((h) => ({
    key: h.key,
    rank: h.rank,
    label: h.label,
    overridable: h.overridable,
    triggered: facts[h.key].triggered,
    message: facts[h.key].message,
  }));
}

/** The highest-priority triggered safety rule, if any blocks chemical work. */
export function highestBlock(decisions: SafetyDecision[]): SafetyDecision | null {
  return decisions.find((d) => d.triggered && !d.overridable) ?? null;
}

/* ------------------------------------------------------------------ */
/* Transition safety (§10)                                             */
/* ------------------------------------------------------------------ */

export type MasterTransition = {
  outcome: TransitionOutcomeKey;
  label: string;
  allowed: boolean;
  overridable: boolean;
  message: string;
  requiredRinse?: string;
  requiredNeutralisation?: string;
  inspectionRequired: boolean;
};

const outcomeMeta = (key: TransitionOutcomeKey) => TRANSITION_OUTCOMES.find((t) => t.key === key)!;

function transition(key: TransitionOutcomeKey, message: string, extra: Partial<MasterTransition> = {}): MasterTransition {
  const meta = outcomeMeta(key);
  return {
    outcome: key,
    label: meta.label,
    allowed: meta.allowed,
    overridable: meta.overridable,
    message,
    inspectionRequired: extra.inspectionRequired ?? !meta.allowed,
    ...extra,
  };
}

export function evaluateMasterTransition(
  c: MasterCase,
  product: VerifiedProduct | null,
  transitions: ProductTransition[],
): MasterTransition {
  if (!c.technicalDataAvailable) return transition("blocked", FAIL_CLOSED_MESSAGE);
  if (c.stopConditions.length > 0) {
    return transition("blocked", "An immediate stop condition is recorded. No further product may be applied.");
  }
  if (c.visibleDamage === "Yes" || c.activeColourBleeding === "Yes") {
    return transition("blocked", "Existing damage or active colour bleeding blocks any further chemical stage.");
  }
  if (!product) return transition("insufficient_information", UNVERIFIED_TRANSITION_MESSAGE);

  const last = [...c.ledger].sort((a, b) => a.entryOrder - b.entryOrder).at(-1);
  const unknownPrevious =
    last?.productName === UNKNOWN_PRODUCT ||
    c.previousChemical.product === UNKNOWN_PRODUCT ||
    c.previouslyTreated === "Yes — product unknown";

  if (unknownPrevious) {
    return transition(
      "insufficient_information",
      "Previous chemistry is unknown, so the interaction cannot be verified. " + UNVERIFIED_TRANSITION_MESSAGE,
    );
  }

  // First chemical stage on a garment with no recorded chemistry.
  if (!last && !c.previousChemistryFamily && !c.previousProductKey) {
    return transition("eligible", "No previous chemistry is recorded, so no transition restriction applies.", {
      inspectionRequired: true,
    });
  }

  const approved = transitions.filter((t) =>
    ["approved", "published"].includes(String(t.approvalStatus ?? "").toLowerCase()),
  );
  const fromKey = last?.productId ?? c.previousProductKey;
  const fromFamily = c.previousChemistryFamily;
  const match = approved.find(
    (t) =>
      (t.toProductKey === product.productKey || t.toChemistryFamily === product.chemistryFamily) &&
      (t.fromProductKey === fromKey || (!!fromFamily && t.fromChemistryFamily === fromFamily)),
  );

  if (!match) return transition("insufficient_information", UNVERIFIED_TRANSITION_MESSAGE);
  if (match.permission === "prohibited") {
    return transition("incompatible", "This transition is recorded as incompatible by the approved mapping. It cannot be dismissed.");
  }

  const rinsed = last?.rinsePerformed === true || c.previousChemical.rinsed === "Yes";
  const neutralised = last?.neutralizationPerformed === true;

  if (match.requiredNeutralisation && !neutralised) {
    return transition("eligible_after_neutralisation", "Complete and record the verified neutralization step before this product.", {
      requiredNeutralisation: match.requiredNeutralisation,
      requiredRinse: match.requiredRinse ?? undefined,
    });
  }
  if ((match.permission === "permitted_with_rinse" || match.requiredRinse) && !rinsed) {
    return transition("eligible_after_rinse", "Complete and record the required rinse or flush before this product.", {
      requiredRinse: match.requiredRinse ?? undefined,
    });
  }
  if (match.permission === "permitted_with_test" || (match.inspectionRequired && !last?.inspectionResult)) {
    return transition("additional_test_required", "Record a controlled test or inspection result before this product.", {
      inspectionRequired: true,
    });
  }

  return transition("eligible", "This transition is covered by an approved mapping.", {
    requiredRinse: match.requiredRinse ?? undefined,
    requiredNeutralisation: match.requiredNeutralisation ?? undefined,
    inspectionRequired: !!match.inspectionRequired,
  });
}

/* ------------------------------------------------------------------ */
/* Component map (§14)                                                 */
/* ------------------------------------------------------------------ */

export type ComponentMapEntry = {
  key: ComponentMapKey;
  label: string;
  present: boolean;
  state: "treating" | "pending" | "completed" | "not_present" | "not_removable";
  reason: string;
};

const COMPONENT_ALIAS: Record<string, ComponentMapKey> = {
  particulate: "surface",
  excess: "surface",
  oil: "oil",
  wax: "oil",
  cosmetic_base: "oil",
  resin: "oil",
  protein: "protein",
  tannin: "tannin",
  natural_dye: "tannin",
  pigment: "pigment",
  synthetic_dye: "pigment",
  metal: "metal",
  sugar: "residue",
  residue: "residue",
};

export function buildMasterComponentMap(c: MasterCase, plan: ComponentPlan): ComponentMapEntry[] {
  const planned = plan.entries.map((e) => COMPONENT_ALIAS[e.component] ?? "residue");
  const declared = [c.diagnosis.primaryComponent, c.diagnosis.secondaryComponent, c.diagnosis.tertiaryComponent]
    .filter(Boolean)
    .map((x) => COMPONENT_ALIAS[x] ?? (x as ComponentMapKey));
  const treatedKeys = c.ledger.map((e) => COMPONENT_ALIAS[e.componentKey ?? ""] ?? null).filter(Boolean);
  const active = c.activeComponent ? COMPONENT_ALIAS[c.activeComponent] ?? null : null;

  return COMPONENT_MAP_ORDER.map((slot) => {
    if (slot.key === "damage") {
      const damaged = !isRemovableMark(c.diagnosis.markKind) || c.visibleDamage === "Yes";
      return {
        key: slot.key,
        label: slot.label,
        present: damaged,
        state: damaged ? "not_removable" : "not_present",
        reason: damaged ? NON_REMOVABLE_MESSAGE : "No permanent change recorded.",
      };
    }
    const present = planned.includes(slot.key) || declared.includes(slot.key);
    if (!present) {
      return { key: slot.key, label: slot.label, present: false, state: "not_present", reason: "Not recorded for this stain." };
    }
    if (active === slot.key) {
      return { key: slot.key, label: slot.label, present: true, state: "treating", reason: "Being treated at the current stage." };
    }
    if (treatedKeys.includes(slot.key)) {
      return { key: slot.key, label: slot.label, present: true, state: "completed", reason: "A treatment stage has been recorded for this component." };
    }
    return { key: slot.key, label: slot.label, present: true, state: "pending", reason: "Remaining component in the approved sequence." };
  });
}

/* ------------------------------------------------------------------ */
/* Pathway stage eligibility (§8)                                      */
/* ------------------------------------------------------------------ */

export type StageEligibility = {
  key: MasterStageKey;
  number: number;
  label: string;
  chemical: boolean;
  eligible: boolean;
  reason: string;
};

export function eligibleStages(c: MasterCase, plan: ComponentPlan): StageEligibility[] {
  const blocked = highestBlock(safetyDecisions(c));
  const planComponents = plan.entries.map((e) => COMPONENT_ALIAS[e.component] ?? "residue");
  const removable = isRemovableMark(c.diagnosis.markKind);

  return MASTER_STAGES.map((s) => {
    const stage = s as (typeof MASTER_STAGES)[number] & { component?: string; conditional?: boolean };
    if (!stage.chemical) {
      return { key: stage.key, number: stage.number, label: stage.label, chemical: false, eligible: true, reason: "Non-chemical stage." };
    }
    if (!c.technicalDataAvailable) {
      return { key: stage.key, number: stage.number, label: stage.label, chemical: true, eligible: false, reason: FAIL_CLOSED_MESSAGE };
    }
    if (blocked) {
      return { key: stage.key, number: stage.number, label: stage.label, chemical: true, eligible: false, reason: blocked.message };
    }
    if (!removable) {
      return { key: stage.key, number: stage.number, label: stage.label, chemical: true, eligible: false, reason: NON_REMOVABLE_MESSAGE };
    }
    const mapped = stage.component ? COMPONENT_ALIAS[stage.component] ?? (stage.component as ComponentMapKey) : null;
    if (mapped && !planComponents.includes(mapped) && stage.conditional) {
      return {
        key: stage.key,
        number: stage.number,
        label: stage.label,
        chemical: true,
        eligible: false,
        reason: "This stage is not eligible: the component is not recorded in the approved sequence for this case.",
      };
    }
    return { key: stage.key, number: stage.number, label: stage.label, chemical: true, eligible: true, reason: "Eligible when a verified product and transition exist." };
  });
}

/* ------------------------------------------------------------------ */
/* Product eligibility across several kits (§3, §15)                   */
/* ------------------------------------------------------------------ */

export function eligibleMasterProducts(
  records: Classified<VerifiedProduct>[],
  opts: { kits: KitSelection[]; inventory?: string[]; component?: string; stageNumber?: number; country?: string },
): VerifiedProduct[] {
  const companyIds = opts.kits.filter((k) => k.kind === "company").map((k) => (k as { companyId: string }).companyId);
  if (companyIds.length === 0) return [];
  return records
    .filter(isDisplayableAsGuidance)
    .map((r) => r.data)
    .filter((p) => !!p.companyId && companyIds.includes(p.companyId))
    .filter((p) => (opts.component ? p.eligibleComponents.includes(opts.component) : true))
    .filter((p) => (opts.stageNumber ? p.compatibleStages.includes(opts.stageNumber) : true))
    .filter((p) => (opts.inventory && opts.inventory.length ? opts.inventory.includes(p.productId) || opts.inventory.includes(p.productKey) : true));
}

/* ------------------------------------------------------------------ */
/* Cross-brand comparison (§15)                                        */
/* ------------------------------------------------------------------ */

export type ComparisonRow = {
  product: VerifiedProduct;
  outcome: ComparisonOutcomeKey;
  outcomeLabel: string;
  fields: { label: string; value: string }[];
  note: string;
};

const OUTCOME_LABEL: Record<ComparisonOutcomeKey, string> = {
  eligible: "Eligible for this case",
  conditionally_eligible: "Conditionally eligible",
  not_eligible: "Not eligible",
  insufficient_evidence: "Insufficient evidence",
  different_function: "Different function—not directly comparable",
};

const shown = (v?: string | null) => (v && String(v).trim() ? String(v).trim() : NOT_VERIFIED);

export function compareAcrossBrands(
  records: Classified<VerifiedProduct>[],
  c: MasterCase,
  opts: { component?: string; stageNumber?: number } = {},
): ComparisonRow[] {
  const companyIds = c.selectedKits.filter((k) => k.kind === "company").map((k) => (k as { companyId: string }).companyId);
  return records
    .filter((r) => !!r.data.companyId && companyIds.includes(r.data.companyId!))
    .map((record) => {
      const p = record.data;
      let outcome: ComparisonOutcomeKey;
      if (!isDisplayableAsGuidance(record)) outcome = "insufficient_evidence";
      else if (opts.component && !p.eligibleComponents.includes(opts.component)) outcome = "different_function";
      else if (opts.stageNumber && !p.compatibleStages.includes(opts.stageNumber)) outcome = "not_eligible";
      else if (!p.applicationMethod || !p.contactTime) outcome = "conditionally_eligible";
      else outcome = "eligible";

      return {
        product: p,
        outcome,
        outcomeLabel: OUTCOME_LABEL[outcome],
        note: "Verified fields only. No equivalence is implied between companies.",
        fields: [
          { label: "Company", value: shown(p.companyName) },
          { label: "Intended stain component", value: p.eligibleComponents.join(", ") || NOT_VERIFIED },
          { label: "Compatible treatment stages", value: p.compatibleStages.join(", ") || NOT_VERIFIED },
          { label: "Application type", value: shown(p.applicationMethod) },
          { label: "Ready-to-use/dilution status", value: shown(p.dilution) },
          { label: "Contact time", value: shown(p.contactTime) },
          { label: "Rinse/neutralisation requirements", value: shown(p.rinseRequirement ?? p.neutralisation) },
          { label: "PPE", value: p.ppe.join(", ") || NOT_VERIFIED },
          { label: "Prohibitions", value: p.prohibitions.join(", ") || NOT_VERIFIED },
          { label: "Source quality", value: shown(p.sourceDocument) },
          { label: "Verification date", value: shown(record.reviewDate) },
        ],
      };
    });
}

/* ------------------------------------------------------------------ */
/* Basic/domestic alternative (§16)                                    */
/* ------------------------------------------------------------------ */

export function masterBasicAlternative(c: MasterCase, methods: BasicMethod[]): { method: BasicMethod; label: string } | null {
  if (c.visibleDamage === "Yes" || c.activeColourBleeding === "Yes") return null;
  if (c.dyeColour.flags.colourfastness === "Failed") return null;
  if (
    c.previousChemical.product === UNKNOWN_PRODUCT ||
    c.previouslyTreated === "Yes — product unknown" ||
    c.ledger.some((e) => e.productName === UNKNOWN_PRODUCT)
  ) {
    return null;
  }
  const method = methods.find(
    (m) => canShowDomesticTreatment({ confidence: m.confidence, status: m.status }) && m.steps.length > 0,
  );
  return method ? { method, label: MASTER_BASIC_LABEL } : null;
}

/* ------------------------------------------------------------------ */
/* Treatment instruction card (§12)                                    */
/* ------------------------------------------------------------------ */

export type MasterStatus =
  | "proceed"
  | "test_required"
  | "additional_information_required"
  | "no_verified_product"
  | "stopped"
  | "data_unavailable";

export const MASTER_STATUS_LABEL: Record<MasterStatus, string> = {
  proceed: "Eligible within verified limits",
  test_required: "Controlled test required",
  additional_information_required: "Additional information required",
  no_verified_product: "No verified product available",
  stopped: "Treatment stopped",
  data_unavailable: "Verified guidance unavailable",
};

export const MASTER_STATUS_TONE: Record<MasterStatus, "green" | "amber" | "red" | "neutral"> = {
  proceed: "green",
  test_required: "amber",
  additional_information_required: "amber",
  no_verified_product: "neutral",
  stopped: "red",
  data_unavailable: "red",
};

export type MasterInstructionCard = {
  status: MasterStatus;
  statusMessage: string;
  stage: { number: number; label: string } | null;
  product: VerifiedProduct | null;
  purpose: string;
  eligibility: string;
  limitations: string[];
  concealedTest: string;
  sections: { label: string; value: string; verified: boolean }[];
  ppe: string[];
  prohibited: string[];
  rinseRequirement: string;
  inspectionCheckpoint: string;
  maximumRepetition: string;
  source: { label: string; value: string }[];
  nextActions: string[];
  stopConditions: string[];
  transition: MasterTransition;
  componentMap: ComponentMapEntry[];
  safety: SafetyDecision[];
  basicAlternative: { title: string; steps: string[]; label: string } | null;
  engineVersion: string;
};

export function buildMasterCard(
  c: MasterCase,
  sources: {
    products?: Classified<VerifiedProduct>[];
    transitions?: ProductTransition[];
    basicMethods?: BasicMethod[];
    selectedProductId?: string | null;
    sdsProhibited?: boolean;
    superseded?: boolean;
  } = {},
): MasterInstructionCard {
  const plan = buildComponentPlan(c);
  const componentMap = buildMasterComponentMap(c, plan);
  const safety = safetyDecisions(c, { sdsProhibited: sources.sdsProhibited });
  const block = highestBlock(safety);
  const stageMeta = c.activeStage ? MASTER_STAGES.find((s) => s.key === c.activeStage) ?? null : null;

  const candidates = eligibleMasterProducts(sources.products ?? [], {
    kits: c.selectedKits.length ? c.selectedKits : [c.kit],
    inventory: c.inventory,
    component: c.activeComponent,
    stageNumber: stageMeta?.number,
  });
  const product = sources.selectedProductId
    ? candidates.find((p) => p.productId === sources.selectedProductId) ?? null
    : candidates[0] ?? null;

  const trans = evaluateMasterTransition(c, product, sources.transitions ?? []);

  const gate = evaluateGate({
    fabricKnown: c.fabricKnown,
    fabricLabelPresent: c.careLabel === "available",
    colourfastnessKnown: c.dyeColour.flags.colourfastness === "Passed" || c.testResult === "Passed" || c.colour === "White",
    existingDamage: c.visibleDamage === "Yes",
    activeColourBleeding: c.activeColourBleeding === "Yes",
    unknownPreviousChemical:
      c.previouslyTreated === "Yes — product unknown" || c.previousChemical.product === UNKNOWN_PRODUCT,
    safetyEvaluationAvailable: c.safetyEngineAvailable && c.technicalDataAvailable,
  });

  let status: MasterStatus = "proceed";
  let statusMessage = "Verified product, stage and transition checks passed for this case.";

  if (!c.technicalDataAvailable) {
    status = "data_unavailable";
    statusMessage = FAIL_CLOSED_MESSAGE;
  } else if (sources.superseded) {
    status = "data_unavailable";
    statusMessage = SUPERSEDED_WARNING;
  } else if (block) {
    status = "stopped";
    statusMessage = block.message;
  } else if (gate.outcome === "blocked") {
    status = "stopped";
    statusMessage = gate.message;
  } else if (!isRemovableMark(c.diagnosis.markKind)) {
    status = "stopped";
    statusMessage = NON_REMOVABLE_MESSAGE;
  } else if (!c.activeStage) {
    status = "additional_information_required";
    statusMessage = "Select the treatment stage you are working on.";
  } else if (!c.activeComponent) {
    status = "additional_information_required";
    statusMessage = "Select the stain component being treated at this stage.";
  } else if (!product) {
    status = "no_verified_product";
    statusMessage = "No verified product in the selected kits is approved for this component and stage.";
  } else if (!trans.allowed) {
    status = trans.outcome === "additional_test_required" ? "test_required" : "stopped";
    statusMessage = trans.message;
  } else if (c.testResult !== "Passed" && c.dyeColour.flags.colourfastness !== "Passed") {
    status = "test_required";
    statusMessage = "Record a concealed-area or colourfastness result before applying this product.";
  }

  const actionable = status === "proceed";
  const sensitive = mostSensitiveComponent(c);

  const section = (label: string, value?: string | null) => ({
    label,
    value: actionable ? shown(value) : NOT_VERIFIED,
    verified: actionable && !!value && String(value).trim().length > 0,
  });

  return {
    status,
    statusMessage,
    stage: stageMeta ? { number: stageMeta.number, label: stageMeta.label } : null,
    product: actionable ? product : null,
    purpose: actionable && product?.verifiedPurpose ? product.verifiedPurpose : NOT_VERIFIED,
    eligibility: MASTER_STATUS_LABEL[status],
    limitations: [
      `Most sensitive component: ${sensitive.label}.`,
      c.dyeColour.flags.colourfastness === "Failed" ? "Colourfastness failed — dye-risk treatment is blocked." : "",
      c.fibreAssessment.category === "Unknown material" ? "Fibre is unidentified — restricted pathway only." : "",
    ].filter(Boolean),
    concealedTest:
      c.testResult === "Passed"
        ? "Concealed-area test recorded as passed."
        : "A concealed-area test is required before this product is applied.",
    sections: [
      section("Manufacturer-approved application", product?.applicationMethod),
      section("Verified dilution or ready-to-use status", product?.dilution),
      section("Verified temperature", product?.temperature),
      section("Verified contact time", product?.contactTime),
      section("Permitted mechanical action", product?.mechanicalAction),
      section("Steam/vacuum guidance", null),
    ],
    ppe: actionable && product?.ppe.length ? product.ppe : [LABEL_FALLBACK_INSTRUCTION],
    prohibited: [
      ...(product?.incompatibilities ?? []),
      ...(product?.prohibitions ?? []),
      "Never mix products.",
      "Never substitute a similarly named product from another company.",
    ],
    rinseRequirement: actionable
      ? shown(product?.rinseRequirement ?? trans.requiredRinse ?? product?.neutralisation)
      : "No product may be applied while this case is stopped.",
    inspectionCheckpoint: "Record an inspection checkpoint after this action before any further stage.",
    maximumRepetition: product?.maximumAttempts ? String(product.maximumAttempts) : NOT_VERIFIED,
    source: [
      { label: "Source document", value: shown(product?.sourceDocument) },
      { label: "Document version", value: shown(product?.documentVersion) },
      { label: "Verification status", value: product ? "Approved record" : NOT_VERIFIED },
    ],
    nextActions: nextActions(status, trans, componentMap),
    stopConditions: IMMEDIATE_STOP_CONDITIONS.map((s) => s.label),
    transition: trans,
    componentMap,
    safety,
    basicAlternative: (() => {
      const alt = masterBasicAlternative(c, sources.basicMethods ?? []);
      return alt ? { title: alt.method.title, steps: alt.method.steps, label: alt.label } : null;
    })(),
    engineVersion: MASTER_ENGINE_VERSION,
  };
}

function nextActions(status: MasterStatus, trans: MasterTransition, map: ComponentMapEntry[]): string[] {
  if (status === "data_unavailable") return ["Reload approved technical data", "Do not begin a new chemical stage"];
  if (status === "stopped") return ["Document the case", "Record the outcome", "Refer for technical review"];
  if (status === "test_required") return ["Run the controlled test", "Record the result", "Re-evaluate the transition"];
  if (status === "additional_information_required") return ["Complete the outstanding assessment"];
  if (status === "no_verified_product") return ["Add another verified kit", "Record available inventory", "Stop if none is eligible"];
  const remaining = map.filter((m) => m.state === "pending").map((m) => `Remaining component: ${m.label}`);
  return [
    "Apply within the verified limits shown",
    "Record the inspection checkpoint",
    trans.requiredRinse ? "Complete the recorded rinse or flush" : "Rinse or flush as verified",
    ...remaining,
  ];
}

/* ------------------------------------------------------------------ */
/* 21. Simplified job-card view — same record, no new meaning          */
/* ------------------------------------------------------------------ */

export type JobCard = {
  product: string;
  test: string;
  action: string;
  time: string;
  rinse: string;
  check: string;
  stopConditions: string[];
  nextStep: string;
};

export function simplifiedJobCard(card: MasterInstructionCard): JobCard {
  const find = (label: string) => card.sections.find((s) => s.label === label)?.value ?? NOT_VERIFIED;
  return {
    product: card.product ? card.product.productName : NOT_VERIFIED,
    test: card.concealedTest,
    action: find("Manufacturer-approved application"),
    time: find("Verified contact time"),
    rinse: card.rinseRequirement,
    check: card.inspectionCheckpoint,
    stopConditions: card.stopConditions,
    nextStep: card.nextActions[0] ?? "Stop and document",
  };
}

/* ------------------------------------------------------------------ */
/* 13. Inspection checkpoints                                          */
/* ------------------------------------------------------------------ */

export function inspectionRequiresStop(result: InspectionResultKey): boolean {
  return INSPECTION_RESULTS.find((r) => r.key === result)?.stop ?? true;
}

export function applyInspection(c: MasterCase, result: InspectionResultKey): MasterCase {
  if (!inspectionRequiresStop(result)) return c;
  const mapped: Partial<Record<InspectionResultKey, StopConditionKey>> = {
    colour_transferred: "rapid_colour_change",
    colour_changed: "rapid_colour_change",
    fabric_weakened: "fibre_weakening",
    coating_changed: "coating_failure",
    adhesive_changed: "delamination",
    spread: "unknown_response",
    shine: "fibre_weakening",
    texture_changed: "fibre_weakening",
    uncertain: "unknown_response",
  };
  const condition = mapped[result];
  return condition && !c.stopConditions.includes(condition)
    ? { ...c, stopConditions: [...c.stopConditions, condition] }
    : c;
}

/* ------------------------------------------------------------------ */
/* 17. Failure analysis                                                */
/* ------------------------------------------------------------------ */

export type FailureAnalysis = {
  causes: { key: FailureCauseKey; label: string; reason: string }[];
  conclusions: { key: FailureConclusionKey; label: string }[];
  note: string;
};

const causeLabel = (key: FailureCauseKey) => key.replace(/_/g, " ");

export function analyseFailure(
  c: MasterCase,
  observation: { stainRemains: boolean; adverseResponse?: InspectionResultKey | null; attempts?: number } = { stainRemains: true },
): FailureAnalysis {
  const causes: FailureAnalysis["causes"] = [];
  const add = (key: FailureCauseKey, reason: string) => causes.push({ key, label: causeLabel(key), reason });

  if (c.evidencePanel.confidence.stainIdentity === "Low" || !c.diagnosis.likelyIdentity) {
    add("wrong_identification", "Stain identity is not confirmed.");
  }
  const map = buildMasterComponentMap(c, buildComponentPlan(c));
  if (map.some((m) => m.state === "pending")) add("incomplete_sequence", "Components in the approved sequence have not been treated.");
  if (c.diagnosis.conditions.includes("Heat-set") || c.diagnosis.conditions.includes("Aged")) {
    add("aged_or_heatset", "The stain is recorded as aged or heat-set.");
  }
  if (c.diagnosis.conditions.includes("Oxidized") || c.diagnosis.conditions.includes("Polymerized")) {
    add("oxidised", "The stain is recorded as oxidized or polymerized.");
  }
  if (c.previousChemical.product === UNKNOWN_PRODUCT || c.ledger.some((e) => e.productName === UNKNOWN_PRODUCT)) {
    add("incompatible_previous", "Unknown previous chemistry cannot be verified.");
  }
  if (c.ledger.some((e) => !e.rinsePerformed)) add("insufficient_rinse", "At least one recorded stage was not rinsed or flushed.");
  if (c.ledger.some((e) => !e.contactTime)) add("dwell_time", "Contact time was not recorded for at least one stage.");
  if (c.ledger.some((e) => !e.temperature)) add("temperature", "Temperature was not recorded for at least one stage.");
  if (c.ledger.some((e) => !e.mechanicalAction)) add("mechanical", "Mechanical action was not recorded for at least one stage.");
  if (!isRemovableMark(c.diagnosis.markKind)) {
    if (c.diagnosis.markKind === "dye_loss") add("dye_loss", "The mark is recorded as dye loss, not soil.");
    else add("fibre_damage", "The mark is recorded as a fabric change, not removable soil.");
  }
  if (c.diagnosis.markKind === "coating_failure") add("finish_failure", "Coating or finish failure is recorded.");
  if (c.evidencePanel.missingInformation.length > 0) add("missing_evidence", "Required information is still missing.");

  const conclusions: FailureAnalysis["conclusions"] = [];
  const push = (key: FailureConclusionKey) => {
    const meta = { key, label: FAILURE_CONCLUSION_LABEL[key] };
    if (!conclusions.some((x) => x.key === key)) conclusions.push(meta);
  };

  if (!isRemovableMark(c.diagnosis.markKind)) {
    push("permanent_damage");
    push("stop");
  } else {
    if (causes.some((x) => x.key === "insufficient_rinse")) push("complete_rinse");
    if (causes.some((x) => x.key === "wrong_identification")) push("reassess_identity");
    if (causes.some((x) => x.key === "incomplete_sequence")) push("change_stage");
    if ((observation.attempts ?? 0) < 1 && causes.length === 0) push("retry_once");
    if (causes.some((x) => x.key === "aged_or_heatset" || x.key === "oxidised")) push("external_consultation");
  }
  if (observation.adverseResponse && inspectionRequiresStop(observation.adverseResponse)) push("stop");
  if (highestBlock(safetyDecisions(c))) push("stop");
  if (conclusions.length === 0) push("no_pathway");

  return { causes, conclusions, note: NO_STRONGER_CHEMISTRY_NOTE };
}

const FAILURE_CONCLUSION_LABEL: Record<FailureConclusionKey, string> = {
  retry_once: "Retry the same verified stage once",
  complete_rinse: "Complete required rinse/neutralization",
  reassess_identity: "Reassess stain identity",
  change_stage: "Change to another verified stage",
  stop: "Stop treatment",
  permanent_damage: "Permanent damage possible",
  external_consultation: "External laboratory/manufacturer consultation",
  no_pathway: "No supported pathway remains",
};

/* ------------------------------------------------------------------ */
/* 9 & 23. Guard rails                                                 */
/* ------------------------------------------------------------------ */

export function isForbiddenCalculation(key: string): key is ForbiddenCalculation {
  return (FORBIDDEN_CALCULATIONS as readonly string[]).includes(key);
}

/** Operator notes are always labelled and never become guidance. */
export function labelOperatorObservation(text: string): { text: string; label: string; publishable: boolean } {
  return { text, label: OPERATOR_OBSERVATION_LABEL, publishable: false };
}

/* ------------------------------------------------------------------ */
/* 22. Offline and stale data                                          */
/* ------------------------------------------------------------------ */

export type OfflineSummary = {
  readable: boolean;
  warning: string;
  content: string | null;
};

export function offlineSafetySummary(cached: {
  content?: string;
  sourceVersion?: string | null;
  lastVerified?: string | null;
} | null): OfflineSummary {
  if (!cached?.content || !cached.sourceVersion || !cached.lastVerified) {
    return { readable: false, warning: FAIL_CLOSED_MESSAGE, content: null };
  }
  return {
    readable: true,
    warning: `${OFFLINE_STALE_WARNING} Source version ${cached.sourceVersion}, last verified ${cached.lastVerified}.`,
    content: cached.content,
  };
}

/** New publication, approval or unsupported calculation is never allowed offline. */
export function offlineActionAllowed(action: "read_summary" | "record_ledger" | "publish" | "approve" | "calculate"): boolean {
  return action === "read_summary" || action === "record_ledger";
}

/* ------------------------------------------------------------------ */
/* SDS-sourced emergency guidance only                                 */
/* ------------------------------------------------------------------ */

export function emergencyGuidance(sds: { firstAid?: string | null; approved?: boolean } | null): string {
  if (!sds?.approved || !sds.firstAid) return NO_SDS_EMERGENCY_TEXT;
  return sds.firstAid;
}
