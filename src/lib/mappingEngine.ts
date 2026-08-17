/**
 * STEP 8 — Product-mapping, eligibility and transition engine.
 *
 * Safety principles enforced here:
 *   • Unverified products can never be Recommended.
 *   • A mapping cannot bypass fabric, colour, construction, process, PPE,
 *     ventilation, training, role or document restrictions.
 *   • Rinsing, neutralization, contact time and repeat limits are never invented.
 *   • Missing evidence returns Insufficient Information.
 *   • When nothing is eligible, a safe fallback is returned.
 */

import {
  DECISION_LABEL, NON_RECOMMENDING_EVIDENCE, RECOMMENDING_EVIDENCE, SPECIFICITY_RANK,
  UNKNOWN_RINSE, formatMappingId,
} from "@/data/productMappings";
import type {
  ProductStageMapping, MappingDecision, MappingStatus, MappingEvidenceLevel,
  ProductTransition, ChemistryFamily, RepetitionRule, MappingSpecificity,
} from "@/data/productMappings";
import {
  PRODUCT_BY_KEY, COMPANY_BY_KEY, DOCUMENTS, FOLLOW_LABEL, INSUFFICIENT_INFO,
} from "@/data/professionalProducts";
import type {
  Product, ProductVersion, ProductDocument, TextileKey, ColourTargetKey,
  ComponentKey as ConstructionKey, ProcessKey, PpeKey, TrainingKey,
} from "@/data/professionalProducts";
import type { UserRoleKey, RiskLevel } from "@/lib/fabricSafety";
import type { PrimaryCategoryKey, ComponentKey } from "@/data/taxonomy";
import {
  STAGE_BY_NUMBER, STOPPING_INSPECTION_FIELDS, MANDATORY_STOP_CONDITIONS,
} from "@/data/treatmentStages";
import type { InspectionField } from "@/data/treatmentStages";

export const MAPPING_ENGINE_VERSION = "step8-v1";

export const SAFE_FALLBACK =
  "No verified product option is available for the current stain, garment and process conditions.";

/* ------------------------------------------------------------------ */
/* IDs                                                                 */
/* ------------------------------------------------------------------ */

export const allocateMappingId = (existing: { mappingId: string }[]) =>
  formatMappingId(existing.length + 1);

/* ------------------------------------------------------------------ */
/* Case input                                                          */
/* ------------------------------------------------------------------ */

export type MappingCase = {
  stainKey?: string;
  categoryKey?: PrimaryCategoryKey;
  components: ComponentKey[];
  dominantComponent?: ComponentKey;
  stageNumber: number;

  textile: TextileKey;
  colour: ColourTargetKey;
  constructions: ConstructionKey[];
  riskLevel: RiskLevel;
  process: ProcessKey;
  country: string;

  role: UserRoleKey;
  training: TrainingKey[];
  ppeAvailable: PpeKey[];
  ventilationAvailable: boolean;
  equipmentAvailable: string[];

  previousChemistry: ChemistryFamily[];
  appliedProductKeys: string[];
  unrinsedResidue?: boolean;

  testsCompleted: { testKey: string; passed: boolean }[];
  inspectionCompleted?: boolean;
  inspectionFindings?: InspectionField[];
  /** Stain-level prohibitions coming from the master stain record. */
  stainProhibitedStages?: number[];
  stainProhibitedProductKeys?: string[];
};

export const emptyCase = (over: Partial<MappingCase> = {}): MappingCase => ({
  components: [],
  stageNumber: 5,
  textile: "unknown_material",
  colour: "light",
  constructions: [],
  riskLevel: "amber",
  process: "hand_spotting",
  country: "IN",
  role: "professional_spotter",
  training: ["trained_spotter_required"],
  ppeAvailable: ["protective_gloves", "eye_protection"],
  ventilationAvailable: true,
  equipmentAvailable: [],
  previousChemistry: [],
  appliedProductKeys: [],
  testsCompleted: [],
  ...over,
});

/* ------------------------------------------------------------------ */
/* Eligibility outcomes                                                */
/* ------------------------------------------------------------------ */

export const ELIGIBILITY_OUTCOMES = [
  "eligible", "eligible_after_testing", "professional_only",
  "ineligible_fabric", "ineligible_colour", "ineligible_construction", "ineligible_process",
  "ineligible_previous_chemical", "ineligible_country", "ineligible_user_role",
  "missing_training", "missing_ppe", "missing_ventilation", "missing_equipment",
  "documentation_incomplete", "document_conflict", "product_suspended",
  "product_discontinued", "insufficient_information",
] as const;
export type EligibilityOutcome = (typeof ELIGIBILITY_OUTCOMES)[number];

export const OUTCOME_LABEL: Record<EligibilityOutcome, string> = {
  eligible: "Eligible",
  eligible_after_testing: "Eligible after testing",
  professional_only: "Professional use only",
  ineligible_fabric: "Not eligible — fabric",
  ineligible_colour: "Not eligible — colour",
  ineligible_construction: "Not eligible — construction",
  ineligible_process: "Not eligible — cleaning process",
  ineligible_previous_chemical: "Not eligible — previous chemical",
  ineligible_country: "Not eligible — country",
  ineligible_user_role: "Not eligible — user role",
  missing_training: "Missing training",
  missing_ppe: "Missing PPE",
  missing_ventilation: "Missing ventilation",
  missing_equipment: "Missing equipment",
  documentation_incomplete: "Documentation incomplete",
  document_conflict: "Document conflict",
  product_suspended: "Product suspended",
  product_discontinued: "Product discontinued",
  insufficient_information: INSUFFICIENT_INFO,
};

export type EligibilityResult = {
  mappingId: string;
  productKey: string;
  productVersionKey: string;
  companyKey: string;
  stageNumber: number;
  outcome: EligibilityOutcome;
  decision: MappingDecision;
  reason: string;                 // plain language, always present
  blockingChecks: string[];
  passedChecks: string[];
  requiredTests: string[];
  rinseText: string;
  repetitionText: string;
  stopConditions: string[];
  evidenceLevel: MappingEvidenceLevel;
  specificity: MappingSpecificity;
  provisional: boolean;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const PROFESSIONAL_ROLES: UserRoleKey[] = ["dry_cleaner", "professional_spotter", "trainer"];

export const isProfessionalRole = (role: UserRoleKey) => PROFESSIONAL_ROLES.includes(role);

export function versionOf(mapping: ProductStageMapping, product?: Product): ProductVersion | undefined {
  const p = product ?? PRODUCT_BY_KEY[mapping.productKey];
  return p?.versions.find((v) => v.key === mapping.productVersionKey);
}

function documentsFor(mapping: ProductStageMapping, docs: ProductDocument[] = DOCUMENTS) {
  return docs.filter((d) => mapping.sourceDocumentKeys.includes(d.key));
}

export type MappingDocumentState = {
  labelVerified: boolean;
  sdsVerified: boolean;
  tdsOrInstructionVerified: boolean;
  conflict: boolean;
  complete: boolean;
};

export function documentState(
  mapping: ProductStageMapping,
  version?: ProductVersion,
  docs: ProductDocument[] = DOCUMENTS,
): MappingDocumentState {
  const attached = documentsFor(mapping, docs);
  const has = (t: string) =>
    attached.some((d) => d.documentType === t && d.state === "current_and_verified");
  const labelVerified = has("product_label") || Boolean(version?.labelVersion && version.verification === "verified");
  const sdsVerified = has("sds") || Boolean(version?.sdsVersion && version.verification === "verified");
  const tdsOrInstructionVerified =
    has("tds") || has("manufacturer_instruction") ||
    Boolean((version?.tdsVersion || version?.instructionVersion) && version.verification === "verified");
  const conflict = attached.some((d) => d.state === "version_conflict" || d.state === "country_mismatch");
  return {
    labelVerified, sdsVerified, tdsOrInstructionVerified, conflict,
    complete: labelVerified && sdsVerified && tdsOrInstructionVerified && !conflict,
  };
}

/* ------------------------------------------------------------------ */
/* Previous-chemical check (§12)                                        */
/* ------------------------------------------------------------------ */

export type PreviousChemicalCheck = {
  blocked: boolean;
  requiresFlushing: boolean;
  outcome: "clear" | "blocked" | "flush_required" | "insufficient_information";
  reasons: string[];
};

export function previousChemicalCheck(
  c: MappingCase,
  mapping: ProductStageMapping,
  transitions: ProductTransition[],
): PreviousChemicalCheck {
  const reasons: string[] = [];
  let blocked = false;
  let flush = false;
  let unknown = false;

  if (c.previousChemistry.includes("unknown_chemical")) {
    unknown = true;
    blocked = true;
    reasons.push(
      "A previous chemical on this garment is unknown, so compatibility cannot be established. No further chemistry can be offered and no flushing method may be guessed.",
    );
  }
  if (c.unrinsedResidue) {
    blocked = true;
    reasons.push("An unrinsed residue is present. The documented removal process must be completed before any further product is considered.");
  }
  for (const family of c.previousChemistry) {
    if (mapping.prohibitedPriorChemistry.includes(family)) {
      blocked = true;
      reasons.push(`This mapping prohibits use after ${family.replace(/_/g, " ")}.`);
    }
  }
  for (const appliedKey of c.appliedProductKeys) {
    const t = transitions.find(
      (x) => x.fromProductKey === appliedKey &&
        (x.toProductKey === mapping.productKey || x.toChemistryFamily === "professional_spotting_agent"),
    );
    if (!t) {
      blocked = true;
      reasons.push(
        `No documented transition record exists from ${PRODUCT_BY_KEY[appliedKey]?.displayName ?? appliedKey} to this product. Appearing in the same kit is not evidence of compatibility.`,
      );
      continue;
    }
    if (t.permission === "prohibited") {
      blocked = true;
      reasons.push(`A documented incompatibility prohibits this product after ${PRODUCT_BY_KEY[appliedKey]?.displayName ?? appliedKey}.`);
    } else if (t.permission === "permitted_after_verified_flushing") {
      flush = true;
      reasons.push(`This product may only follow ${PRODUCT_BY_KEY[appliedKey]?.displayName ?? appliedKey} after the documented flushing process is completed.`);
    } else if (t.permission === "insufficient_information") {
      blocked = true;
      reasons.push(
        `The transition from ${PRODUCT_BY_KEY[appliedKey]?.displayName ?? appliedKey} to this product is not documented. It is treated as unsafe until documented.`,
      );
    }
  }
  for (const family of c.previousChemistry) {
    const t = transitions.find(
      (x) => x.fromChemistryFamily === family &&
        (x.toProductKey === mapping.productKey || x.toChemistryFamily === "professional_spotting_agent"),
    );
    if (t?.permission === "prohibited") {
      blocked = true;
      reasons.push(`A documented hazard prohibits further spotting chemistry after ${family.replace(/_/g, " ")}.`);
    }
    if (t?.permission === "permitted_after_verified_flushing") flush = true;
  }

  const outcome: PreviousChemicalCheck["outcome"] = unknown
    ? "insufficient_information"
    : blocked ? "blocked" : flush ? "flush_required" : "clear";
  if (!reasons.length) reasons.push("No conflicting previous chemistry recorded.");
  return { blocked, requiresFlushing: flush, outcome, reasons };
}

/* ------------------------------------------------------------------ */
/* Inspection gate (§15)                                                */
/* ------------------------------------------------------------------ */

export type InspectionVerdict = {
  stop: boolean;
  repeatAllowed: boolean;
  heatAllowed: boolean;
  reasons: string[];
};

export function evaluateInspection(
  findings: InspectionField[] | undefined,
  completed: boolean | undefined,
): InspectionVerdict {
  if (!completed) {
    return {
      stop: false, repeatAllowed: false, heatAllowed: false,
      reasons: ["The mandatory inspection has not been recorded. No repetition and no heat may be authorized."],
    };
  }
  const triggers = (findings ?? []).filter((f) => STOPPING_INSPECTION_FIELDS.includes(f));
  if (triggers.length) {
    return {
      stop: true, repeatAllowed: false, heatAllowed: false,
      reasons: [
        `Inspection recorded ${triggers.join(", ").replace(/_/g, " ")}. Treatment stops and the case is escalated.`,
      ],
    };
  }
  return { stop: false, repeatAllowed: true, heatAllowed: true, reasons: ["Inspection recorded with no stop condition."] };
}

export const stopConditionsForStage = (stageNumber: number) =>
  STAGE_BY_NUMBER[stageNumber]?.stopConditions ?? MANDATORY_STOP_CONDITIONS;

/* ------------------------------------------------------------------ */
/* Repetition (§16)                                                     */
/* ------------------------------------------------------------------ */

export function repetitionText(rule: RepetitionRule, quantities?: { maximumAttempts?: string }): string {
  switch (rule) {
    case "repeat_permitted": return "Repeat permitted.";
    case "repeat_permitted_after_inspection": return "Repeat permitted only after the inspection gate is recorded.";
    case "maximum_attempts":
      return quantities?.maximumAttempts
        ? `Maximum documented attempts: ${quantities.maximumAttempts}.`
        : "A maximum attempt count is claimed but not documented. No number is assumed.";
    case "repeat_not_permitted": return "Repeat not permitted.";
    case "follow_label_tds": return FOLLOW_LABEL;
    default: return "No documented repeat rule. A repeat count is not invented.";
  }
}

export function rinseText(mapping: ProductStageMapping): string {
  const r = mapping.rinse ?? UNKNOWN_RINSE;
  if (r.required === "not_required" && r.sourceDocumentKey) return "The current product document states that no rinsing or neutralization is required.";
  if (r.required === "required" && r.method) {
    const parts = [r.method, r.medium, r.temperature, r.duration, r.quantity].filter(Boolean);
    return `Documented removal process: ${parts.join(" · ")}`;
  }
  return r.fallbackText || FOLLOW_LABEL;
}

/* ------------------------------------------------------------------ */
/* Validation (§28)                                                     */
/* ------------------------------------------------------------------ */

export type ValidationIssue = { field: string; severity: "error" | "warning"; message: string };

export function validateMapping(
  mapping: ProductStageMapping,
  opts: { domesticRecordConfidence?: number; docs?: ProductDocument[] } = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const product = PRODUCT_BY_KEY[mapping.productKey];
  const version = versionOf(mapping, product);
  const docs = documentState(mapping, version, opts.docs);

  if (!mapping.productVersionKey) issues.push({ field: "productVersionKey", severity: "error", message: "Product version is required." });
  if (!mapping.country) issues.push({ field: "country", severity: "error", message: "Country is required." });
  if (mapping.stageNumber === undefined || mapping.stageNumber === null)
    issues.push({ field: "stageNumber", severity: "error", message: "Treatment stage is required." });
  if (!mapping.decision) issues.push({ field: "decision", severity: "error", message: "Decision is required." });

  const evidenceOk = RECOMMENDING_EVIDENCE.includes(mapping.evidenceLevel) && !NON_RECOMMENDING_EVIDENCE.includes(mapping.evidenceLevel);

  if (mapping.decision === "recommended") {
    if (!mapping.verifiedUse || !evidenceOk || !docs.complete)
      issues.push({ field: "decision", severity: "error", message: "Recommended requires complete current verification: verified use, current label, SDS and TDS or manufacturer instruction, and no document conflict." });
    if (!mapping.fabricConditions.length || !mapping.colourConditions.length || !mapping.processConditions.length)
      issues.push({ field: "decision", severity: "error", message: "Missing fabric, colour or process compatibility defaults to Insufficient Information." });
    if (!mapping.requiredPpe.length)
      issues.push({ field: "requiredPpe", severity: "error", message: "PPE requirements are missing, so Recommended cannot be produced." });
    if (mapping.rinse.required === "insufficient_information")
      issues.push({ field: "rinse", severity: "error", message: "Rinsing or neutralization information is missing and must not be guessed." });
  }
  if (mapping.decision === "recommended_after_testing" && !mapping.requiredTests.some((t) => t.approved))
    issues.push({ field: "requiredTests", severity: "error", message: "Recommended After Testing requires a defined, approved compatibility test." });
  if (mapping.decision === "professional_use_only") {
    if (!mapping.role.roles.some(isProfessionalRole) || !mapping.role.training.length)
      issues.push({ field: "role", severity: "error", message: "Professional Use Only requires a defined professional role and training requirement." });
  }
  if (mapping.decision === "domestic_use_suitable" && (opts.domesticRecordConfidence ?? 0) < 9)
    issues.push({ field: "decision", severity: "error", message: "Domestic Use Suitable requires an approved domestic-treatment record with at least 9/10 confidence." });
  if (mapping.decision === "not_recommended" && !mapping.notRecommendedReason)
    issues.push({ field: "notRecommendedReason", severity: "error", message: "Not Recommended requires a reason." });
  if (docs.conflict && (mapping.status === "published" || mapping.status === "approved"))
    issues.push({ field: "status", severity: "error", message: "A document conflict blocks publication." });
  if (product?.status === "suspended" && mapping.decision === "recommended")
    issues.push({ field: "decision", severity: "error", message: "A suspended product cannot be recommended." });
  if (product?.status === "discontinued" && mapping.status === "published")
    issues.push({ field: "status", severity: "warning", message: "A discontinued product cannot be selected for new treatment unless an explicit reviewed exception exists." });
  if (!mapping.evidence.length)
    issues.push({ field: "evidence", severity: "warning", message: "No evidence attached. The mapping defaults to Insufficient Information." });
  return issues;
}

export const canPublish = (mapping: ProductStageMapping, opts?: Parameters<typeof validateMapping>[1]) =>
  validateMapping(mapping, opts).every((i) => i.severity !== "error");

/* ------------------------------------------------------------------ */
/* Specificity resolution (§8)                                          */
/* ------------------------------------------------------------------ */

export function mappingMatchesCase(m: ProductStageMapping, c: MappingCase): boolean {
  if (m.stageNumber !== c.stageNumber) return false;
  if (m.stainKey) return m.stainKey === c.stainKey;
  if (m.componentKey) return c.components.includes(m.componentKey) || c.dominantComponent === m.componentKey;
  if (m.categoryKey) return m.categoryKey === c.categoryKey;
  return true;
}

/**
 * Most specific approved mapping wins. A broad category mapping never overrides
 * a stain-specific prohibition.
 */
export function resolveMappings(mappings: ProductStageMapping[], c: MappingCase): ProductStageMapping[] {
  const candidates = mappings.filter((m) => mappingMatchesCase(m, c));
  const byProduct = new Map<string, ProductStageMapping>();
  for (const m of candidates) {
    const key = `${m.productKey}::${m.productVersionKey}`;
    const current = byProduct.get(key);
    if (!current) { byProduct.set(key, m); continue; }
    const prohibitionWins =
      (m.decision === "not_recommended" && SPECIFICITY_RANK[m.specificity] >= SPECIFICITY_RANK[current.specificity]) ||
      (current.decision === "not_recommended" && SPECIFICITY_RANK[current.specificity] > SPECIFICITY_RANK[m.specificity]);
    if (prohibitionWins) {
      byProduct.set(key, current.decision === "not_recommended" &&
        SPECIFICITY_RANK[current.specificity] > SPECIFICITY_RANK[m.specificity] ? current : m);
      continue;
    }
    if (SPECIFICITY_RANK[m.specificity] > SPECIFICITY_RANK[current.specificity]) byProduct.set(key, m);
  }
  return [...byProduct.values()];
}

/* ------------------------------------------------------------------ */
/* Eligibility engine (§9, §10)                                         */
/* ------------------------------------------------------------------ */

const verdictOf = <T extends { verdict: string }>(list: T[], match: (x: T) => boolean) =>
  list.find(match)?.verdict as ("permitted" | "permitted_after_testing" | "prohibited" | "insufficient_information" | undefined);

export function evaluateEligibility(
  mapping: ProductStageMapping,
  c: MappingCase,
  opts: {
    transitions?: ProductTransition[];
    docs?: ProductDocument[];
    domesticRecordConfidence?: number;
    /** Optional product lookup override (test harnesses, admin previews). */
    products?: Record<string, Product>;
  } = {},
): EligibilityResult {
  const transitions = opts.transitions ?? [];
  const product = (opts.products ?? PRODUCT_BY_KEY)[mapping.productKey];
  const version = versionOf(mapping, product);
  const docs = documentState(mapping, version, opts.docs);
  const blocking: string[] = [];
  const passed: string[] = [];

  const base = {
    mappingId: mapping.mappingId,
    productKey: mapping.productKey,
    productVersionKey: mapping.productVersionKey,
    companyKey: mapping.companyKey,
    stageNumber: mapping.stageNumber,
    requiredTests: mapping.requiredTests.map((t) => `${t.testKey.replace(/_/g, " ")} (${t.methodSource})`),
    rinseText: rinseText(mapping),
    repetitionText: repetitionText(mapping.repetition, mapping.quantities),
    stopConditions: mapping.stopConditions.length ? mapping.stopConditions : stopConditionsForStage(mapping.stageNumber),
    evidenceLevel: mapping.evidenceLevel,
    specificity: mapping.specificity,
    provisional: mapping.provisional,
  };

  const fail = (outcome: EligibilityOutcome, reason: string, decision: MappingDecision = "insufficient_information"): EligibilityResult => ({
    ...base, outcome, decision, reason, blockingChecks: [...blocking, reason], passedChecks: passed,
  });

  // Stain-level prohibitions always win over broad mappings.
  if (c.stainProhibitedProductKeys?.includes(mapping.productKey))
    return fail("insufficient_information", "A stain-specific prohibition blocks this product for this stain, and a broad category mapping cannot override it.", "not_recommended");
  if (c.stainProhibitedStages?.includes(mapping.stageNumber))
    return fail("insufficient_information", "A stain-specific prohibition blocks this treatment stage for this stain.", "not_recommended");

  // Product identity, status and version.
  if (!product) return fail("insufficient_information", "The product record could not be found, so nothing can be offered.");
  if (!version) return fail("insufficient_information", "This mapping does not point to a stored product version. Mappings are never transferred between versions.");
  if (product.status === "suspended") return fail("product_suspended", "This product is suspended and cannot be recommended.");
  if (product.status === "discontinued") return fail("product_discontinued", "This product is discontinued and cannot be selected for new treatment without a reviewed exception.");
  if (version.knownFormulationChange && version.approvalStatus !== "approved")
    return fail("documentation_incomplete", "This product was reformulated and the new version has not completed review, so the earlier mapping does not carry over.");
  passed.push("Product identity and version selected");

  // Publication status.
  if (mapping.status !== "published")
    return fail("insufficient_information", `This mapping is ${mapping.status.replace(/_/g, " ")} and only published mappings can drive guidance.`);

  // Country.
  if (mapping.country !== "all" && mapping.country !== c.country)
    return fail("ineligible_country", `This mapping applies to ${mapping.country}, not ${c.country}. A product version from another market is never substituted.`);
  passed.push("Country matches");

  // Documents.
  if (docs.conflict) return fail("document_conflict", "The attached product documents conflict with each other, which blocks any recommendation until a reviewer resolves it.");
  if (!docs.labelVerified || !docs.sdsVerified || !docs.tdsOrInstructionVerified)
    return fail("documentation_incomplete", "The current label, safety data sheet and technical data sheet or manufacturer instruction are not all verified for this version.");
  passed.push("Current label, SDS and TDS or instruction verified");

  // Intended use.
  if (!mappingMatchesCase(mapping, c))
    return fail("insufficient_information", "This mapping does not cover the current stain, component or treatment stage.");
  passed.push("Intended stain or component matches");

  // Fabric.
  const fabric = verdictOf(mapping.fabricConditions, (x) => x.textile === c.textile);
  if (fabric === "prohibited") return fail("ineligible_fabric", `This product must not be used on ${c.textile.replace(/_/g, " ")}.`, "not_recommended");
  if (!fabric || fabric === "insufficient_information")
    return fail("insufficient_information", `No verified compatibility statement exists for ${c.textile.replace(/_/g, " ")}, so nothing can be recommended.`);
  passed.push("Fabric compatibility passes");

  // Colour.
  const colour = verdictOf(mapping.colourConditions, (x) => x.colour === c.colour);
  if (colour === "prohibited") return fail("ineligible_colour", `This product must not be used on ${c.colour.replace(/_/g, " ")} items.`, "not_recommended");
  if (!colour || colour === "insufficient_information")
    return fail("insufficient_information", `No verified colour compatibility statement exists for ${c.colour.replace(/_/g, " ")} items.`);
  passed.push("Colour compatibility passes");

  // Construction.
  for (const construction of c.constructions) {
    const v = verdictOf(mapping.constructionConditions, (x) => x.construction === construction);
    if (v === "prohibited")
      return fail("ineligible_construction", `The garment contains ${construction.replace(/_/g, " ")}, which this product must not contact.`, "not_recommended");
  }
  passed.push("Construction compatibility passes");

  // Process.
  const process = verdictOf(mapping.processConditions, (x) => x.process === c.process);
  if (process === "prohibited") return fail("ineligible_process", `This product is not permitted in the ${c.process.replace(/_/g, " ")} process.`, "not_recommended");
  if (!process || process === "insufficient_information")
    return fail("insufficient_information", `No verified statement exists for the ${c.process.replace(/_/g, " ")} process.`);
  passed.push("Cleaning-process compatibility passes");

  // Previous chemistry.
  const prev = previousChemicalCheck(c, mapping, transitions);
  if (prev.blocked) return fail(
    prev.outcome === "insufficient_information" ? "insufficient_information" : "ineligible_previous_chemical",
    prev.reasons[0],
  );
  passed.push("Previous-chemical check passes");

  // Role.
  if (!mapping.role.roles.includes(c.role))
    return fail("ineligible_user_role", `This mapping is restricted to ${mapping.role.roles.join(", ").replace(/_/g, " ")} and is not shown to a ${c.role.replace(/_/g, " ")}.`,
      isProfessionalRole(c.role) ? "professional_use_only" : "insufficient_information");
  passed.push("User role permitted");

  // Training.
  const missingTraining = mapping.role.training.filter((t) => !c.training.includes(t));
  if (missingTraining.length)
    return fail("missing_training", `This product requires training that has not been recorded: ${missingTraining.join(", ").replace(/_/g, " ")}.`);
  passed.push("Training requirement satisfied");

  // PPE / ventilation / equipment.
  const missingPpe = mapping.requiredPpe.filter((p) => !c.ppeAvailable.includes(p));
  if (missingPpe.length)
    return fail("missing_ppe", `Required protective equipment is unavailable: ${missingPpe.join(", ").replace(/_/g, " ")}.`);
  if (mapping.ventilationRequired === "required" && !c.ventilationAvailable)
    return fail("missing_ventilation", "This product requires ventilation that is not available at this workstation.");
  if (mapping.ventilationRequired === "insufficient_information")
    return fail("insufficient_information", "The ventilation requirement for this product is not documented, so it cannot be offered.");
  const missingEquipment = mapping.requiredEquipment.filter((e) => !c.equipmentAvailable.includes(e));
  if (missingEquipment.length)
    return fail("missing_equipment", `Required equipment is unavailable: ${missingEquipment.join(", ")}.`);
  passed.push("PPE, ventilation and equipment available");

  // Rinsing / neutralization must exist.
  if (mapping.rinse.required === "insufficient_information")
    return fail("insufficient_information", "The removal or deactivation process after this product is not documented, and it is never guessed.");
  passed.push("Required rinsing or neutralization process available");

  // Inspection gate blocking repetition.
  if (c.inspectionCompleted === true) {
    const insp = evaluateInspection(c.inspectionFindings, true);
    if (insp.stop) return fail("insufficient_information", `${insp.reasons[0]} No further chemistry may be applied.`, "not_recommended");
  }

  // Required tests.
  const outstanding = mapping.requiredTests.filter((t) => {
    const done = c.testsCompleted.find((x) => x.testKey === t.testKey);
    return !done;
  });
  const failedTest = mapping.requiredTests.find((t) => c.testsCompleted.find((x) => x.testKey === t.testKey && !x.passed));
  if (failedTest)
    return fail("ineligible_fabric", `The required ${failedTest.testKey.replace(/_/g, " ")} test failed, so this product must not be used on this garment.`, "not_recommended");

  // Risk gates.
  if (c.riskLevel === "black")
    return fail("professional_only", "This garment is a black-risk item. Treatment remains blocked and a specialist assessment is required.", "not_recommended");
  if (c.riskLevel === "red" && !isProfessionalRole(c.role))
    return fail("professional_only", "This garment is a red-risk item, so any product option remains professional-only.", "professional_use_only");

  if (outstanding.length) {
    return {
      ...base,
      outcome: "eligible_after_testing",
      decision: "recommended_after_testing",
      reason: `This product may be considered only after the required ${outstanding.map((t) => t.testKey.replace(/_/g, " ")).join(" and ")} test is completed using the approved method.`,
      blockingChecks: [],
      passedChecks: passed,
    };
  }
  if (prev.requiresFlushing) {
    return {
      ...base,
      outcome: "eligible_after_testing",
      decision: "recommended_after_testing",
      reason: "This product may follow the previous chemistry only after the documented flushing process is completed and inspected.",
      blockingChecks: [],
      passedChecks: passed,
    };
  }

  if (mapping.decision === "domestic_use_suitable" && (opts.domesticRecordConfidence ?? 0) < 9)
    return fail("insufficient_information", "A domestic decision requires a separately approved domestic-treatment record with at least 9/10 confidence.");

  if (!isProfessionalRole(c.role) && mapping.decision !== "domestic_use_suitable")
    return fail("ineligible_user_role", "Professional product mappings are not shown to domestic users.", "professional_use_only");

  const decision: MappingDecision =
    mapping.decision === "recommended" ? "recommended"
      : mapping.decision === "domestic_use_suitable" ? "domestic_use_suitable"
        : "professional_use_only";

  return {
    ...base,
    outcome: decision === "professional_use_only" ? "professional_only" : "eligible",
    decision,
    reason: `Every required condition passed for this case: ${DECISION_LABEL[decision]}.`,
    blockingChecks: [],
    passedChecks: passed,
  };
}

/* ------------------------------------------------------------------ */
/* Case evaluation with safe fallback (§26)                             */
/* ------------------------------------------------------------------ */

export type CaseEvaluation = {
  results: EligibilityResult[];
  eligible: EligibilityResult[];
  fallback?: string;
  notes: string[];
};

export function evaluateCase(
  mappings: ProductStageMapping[],
  c: MappingCase,
  opts: Parameters<typeof evaluateEligibility>[2] = {},
): CaseEvaluation {
  const resolved = resolveMappings(mappings, c);
  const results = resolved.map((m) => evaluateEligibility(m, c, opts));
  const eligible = results.filter((r) => r.outcome === "eligible" || r.outcome === "eligible_after_testing");
  const notes: string[] = [];
  if (results.length > 1) {
    notes.push(
      "Multiple products map to this stage. They are alternatives, not equivalents: evidence, fabric restrictions, safety requirements and expected results differ.",
    );
  }
  return {
    results,
    eligible,
    fallback: eligible.length ? undefined : SAFE_FALLBACK,
    notes,
  };
}

/* ------------------------------------------------------------------ */
/* Alternatives and cross-company comparison (§17, §18)                 */
/* ------------------------------------------------------------------ */

export const COMPARISON_DIMENSIONS = [
  "intended_target", "stage", "fabric", "colour", "process", "required_testing",
  "quantity_dilution", "contact_time", "temperature", "rinsing", "ppe", "ventilation",
  "incompatibilities", "training", "country", "evidence", "cost_per_treatment", "verification_completeness",
] as const;
export type ComparisonDimension = (typeof COMPARISON_DIMENSIONS)[number];

export type ComparisonCell = { value: string; comparable: boolean };
export type ComparisonRow = {
  mappingId: string;
  productKey: string;
  productName: string;
  companyName: string;
  cells: Record<ComparisonDimension, ComparisonCell>;
};

export type Comparison = {
  rows: ComparisonRow[];
  rankable: boolean;
  message: string;
};

export function compareMappings(mappings: ProductStageMapping[]): Comparison {
  const rows: ComparisonRow[] = mappings.map((m) => {
    const product = PRODUCT_BY_KEY[m.productKey];
    const company = COMPANY_BY_KEY[m.companyKey];
    const cell = (value: string | undefined, comparable = Boolean(value)): ComparisonCell => ({
      value: value || INSUFFICIENT_INFO,
      comparable: comparable && Boolean(value),
    });
    return {
      mappingId: m.mappingId,
      productKey: m.productKey,
      productName: product?.displayName ?? m.productKey,
      companyName: company?.displayName ?? m.companyKey,
      cells: {
        intended_target: cell(m.stainKey ?? m.componentKey ?? m.categoryKey),
        stage: cell(STAGE_BY_NUMBER[m.stageNumber]?.name),
        fabric: cell(m.fabricConditions.length ? `${m.fabricConditions.length} recorded` : undefined),
        colour: cell(m.colourConditions.length ? `${m.colourConditions.length} recorded` : undefined),
        process: cell(m.processConditions.length ? `${m.processConditions.length} recorded` : undefined),
        required_testing: cell(m.requiredTests.map((t) => t.testKey).join(", ") || undefined),
        quantity_dilution: cell(m.quantities?.dilution ?? m.quantities?.quantity),
        contact_time: cell(m.quantities?.contactTime),
        temperature: cell(m.quantities?.temperature),
        rinsing: cell(m.rinse.required === "insufficient_information" ? undefined : rinseText(m)),
        ppe: cell(m.requiredPpe.join(", ") || undefined),
        ventilation: cell(m.ventilationRequired === "insufficient_information" ? undefined : m.ventilationRequired),
        incompatibilities: cell(m.prohibitedPriorChemistry.join(", ") || undefined),
        training: cell(m.role.training.join(", ") || undefined),
        country: cell(m.country === "unspecified" ? undefined : m.country),
        evidence: cell(m.evidenceLevel === "insufficient_information" ? undefined : m.evidenceLevel),
        cost_per_treatment: cell(undefined),
        verification_completeness: cell(m.verifiedUse ? "Verified" : undefined),
      },
    };
  });
  const rankable = rows.length > 1 && rows.every((r) =>
    Object.values(r.cells).filter((c) => !c.comparable).length === 0);
  return {
    rows,
    rankable,
    message: rankable
      ? "Comparable information is available for every dimension."
      : "These options are not directly comparable. Ranking is withheld because comparable information is unavailable for at least one dimension.",
  };
}

/* ------------------------------------------------------------------ */
/* Review triggers (§21)                                                */
/* ------------------------------------------------------------------ */

export const REVIEW_TRIGGERS = [
  "formulation_change", "label_change", "sds_change", "tds_change", "instruction_change",
  "product_discontinued", "country_change", "new_textile_restriction", "new_incompatibility",
  "repeated_failure", "repeated_damage", "stage_definition_change", "equipment_change",
  "better_evidence_available",
] as const;
export type ReviewTrigger = (typeof REVIEW_TRIGGERS)[number];

export const REVIEW_TRIGGER_LABEL: Record<ReviewTrigger, string> = {
  formulation_change: "Product formulation changed",
  label_change: "Label changed",
  sds_change: "SDS changed",
  tds_change: "TDS changed",
  instruction_change: "Manufacturer instructions changed",
  product_discontinued: "Product discontinued",
  country_change: "Country applicability changed",
  new_textile_restriction: "New textile restriction found",
  new_incompatibility: "New incompatibility found",
  repeated_failure: "Repeated failure documented",
  repeated_damage: "Repeated damage documented",
  stage_definition_change: "Treatment-stage definition changed",
  equipment_change: "Required equipment changed",
  better_evidence_available: "Better evidence became available",
};

/**
 * Marks affected mappings Needs Review. Historical mappings used by past cases are
 * archived as a copy, never deleted.
 */
export function applyReviewTrigger(
  mappings: ProductStageMapping[],
  trigger: ReviewTrigger,
  scope: { productKey?: string; productVersionKey?: string; stageNumber?: number },
): { updated: ProductStageMapping[]; history: ProductStageMapping[]; affectedIds: string[] } {
  const affected: string[] = [];
  const history: ProductStageMapping[] = [];
  const updated = mappings.map((m) => {
    const inScope =
      (!scope.productKey || m.productKey === scope.productKey) &&
      (!scope.productVersionKey || m.productVersionKey === scope.productVersionKey) &&
      (scope.stageNumber === undefined || m.stageNumber === scope.stageNumber);
    if (!inScope) return m;
    affected.push(m.mappingId);
    history.push({ ...m, status: "archived", notes: `${m.notes ?? ""} Retained for historical cases.`.trim() });
    return {
      ...m,
      status: "needs_review" as MappingStatus,
      flags: [...m.flags, `Needs review: ${REVIEW_TRIGGER_LABEL[trigger]}.`],
    };
  });
  return { updated, history, affectedIds: affected };
}

/* ------------------------------------------------------------------ */
/* Role-aware visibility (§25)                                          */
/* ------------------------------------------------------------------ */

export type MappingAudience = "domestic" | "laundry_employee" | "professional_spotter" | "technical_reviewer";

export function audienceForRole(role: UserRoleKey, isReviewer = false): MappingAudience {
  if (isReviewer) return "technical_reviewer";
  if (role === "professional_spotter" || role === "trainer" || role === "dry_cleaner") return "professional_spotter";
  if (role === "laundry_employee") return "laundry_employee";
  return "domestic";
}

export type VisibleMapping = {
  mapping: ProductStageMapping;
  showEvidence: boolean;
  showVersionHistory: boolean;
  showApprovalControls: boolean;
  simplified: boolean;
};

export function visibleMappings(
  mappings: ProductStageMapping[],
  audience: MappingAudience,
  ctx: { country?: string; processes?: ProcessKey[]; training?: TrainingKey[]; approvedProductKeys?: string[] } = {},
): VisibleMapping[] {
  if (audience === "domestic") {
    return mappings
      .filter((m) => m.decision === "domestic_use_suitable" && m.status === "published")
      .map((m) => ({ mapping: m, showEvidence: false, showVersionHistory: false, showApprovalControls: false, simplified: true }));
  }
  if (audience === "laundry_employee") {
    return mappings
      .filter((m) =>
        m.status === "published" &&
        (!ctx.approvedProductKeys || ctx.approvedProductKeys.includes(m.productKey)) &&
        (!ctx.country || m.country === ctx.country || m.country === "all") &&
        (!ctx.processes || m.processConditions.some((p) => ctx.processes!.includes(p.process) && p.verdict !== "prohibited")) &&
        (!ctx.training || m.role.training.every((t) => ctx.training!.includes(t))))
      .map((m) => ({ mapping: m, showEvidence: false, showVersionHistory: false, showApprovalControls: false, simplified: true }));
  }
  if (audience === "professional_spotter") {
    return mappings
      .filter((m) => m.status === "published" || m.status === "approved")
      .map((m) => ({ mapping: m, showEvidence: false, showVersionHistory: false, showApprovalControls: false, simplified: false }));
  }
  return mappings.map((m) => ({
    mapping: m, showEvidence: true, showVersionHistory: true, showApprovalControls: true, simplified: false,
  }));
}

/* ------------------------------------------------------------------ */
/* Editor justification (§24)                                           */
/* ------------------------------------------------------------------ */

export const JUSTIFIED_MAPPING_CHANGES = [
  "prohibition", "product_sequence", "ppe", "neutralization", "fabric_compatibility",
  "decision_upgrade", "conflict_override",
] as const;
export type JustifiedMappingChange = (typeof JUSTIFIED_MAPPING_CHANGES)[number];

export const JUSTIFICATION_LABEL: Record<JustifiedMappingChange, string> = {
  prohibition: "Changing a prohibition",
  product_sequence: "Changing product sequence",
  ppe: "Changing PPE",
  neutralization: "Changing neutralization",
  fabric_compatibility: "Changing fabric compatibility",
  decision_upgrade: "Changing from Insufficient Information to Recommended",
  conflict_override: "Overriding a conflict",
};

export function changesRequiringJustification(
  before: ProductStageMapping,
  after: ProductStageMapping,
): JustifiedMappingChange[] {
  const out: JustifiedMappingChange[] = [];
  const j = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);
  if (j(before.prohibitedPriorChemistry, after.prohibitedPriorChemistry)) out.push("prohibition");
  if (j(before.requiredPriorStage, after.requiredPriorStage) || j(before.requiredFollowingStage, after.requiredFollowingStage))
    out.push("product_sequence");
  if (j(before.requiredPpe, after.requiredPpe)) out.push("ppe");
  if (j(before.rinse, after.rinse)) out.push("neutralization");
  if (j(before.fabricConditions, after.fabricConditions)) out.push("fabric_compatibility");
  if (before.decision === "insufficient_information" && after.decision === "recommended") out.push("decision_upgrade");
  return out;
}

/* ------------------------------------------------------------------ */
/* Matrix (§23)                                                         */
/* ------------------------------------------------------------------ */

export type MatrixFilters = {
  companyKey?: string;
  kitKey?: string;
  productKey?: string;
  stageNumber?: number;
  stainKey?: string;
  categoryKey?: PrimaryCategoryKey;
  componentKey?: ComponentKey;
  textile?: TextileKey;
  colour?: ColourTargetKey;
  process?: ProcessKey;
  country?: string;
  decision?: MappingDecision;
  status?: MappingStatus;
  needsReviewOnly?: boolean;
};

export function filterMappings(mappings: ProductStageMapping[], f: MatrixFilters): ProductStageMapping[] {
  return mappings.filter((m) => {
    if (f.companyKey && m.companyKey !== f.companyKey) return false;
    if (f.kitKey && m.kitKey !== f.kitKey) return false;
    if (f.productKey && m.productKey !== f.productKey) return false;
    if (f.stageNumber !== undefined && m.stageNumber !== f.stageNumber) return false;
    if (f.stainKey && m.stainKey !== f.stainKey) return false;
    if (f.categoryKey && m.categoryKey !== f.categoryKey) return false;
    if (f.componentKey && m.componentKey !== f.componentKey) return false;
    if (f.textile && !m.fabricConditions.some((x) => x.textile === f.textile)) return false;
    if (f.colour && !m.colourConditions.some((x) => x.colour === f.colour)) return false;
    if (f.process && !m.processConditions.some((x) => x.process === f.process)) return false;
    if (f.country && m.country !== f.country && m.country !== "all") return false;
    if (f.decision && m.decision !== f.decision) return false;
    if (f.status && m.status !== f.status) return false;
    if (f.needsReviewOnly && m.status !== "needs_review") return false;
    return true;
  });
}

export type MatrixCell = {
  mapping: ProductStageMapping;
  decisionLabel: string;
  verification: string;
  fabricRestriction: string;
  processRestriction: string;
  evidenceCompleteness: string;
  mainWarning: string;
  lastReviewed: string;
};

export function matrixCell(m: ProductStageMapping): MatrixCell {
  const prohibitedFabrics = m.fabricConditions.filter((x) => x.verdict === "prohibited").map((x) => x.textile);
  const prohibitedProcesses = m.processConditions.filter((x) => x.verdict === "prohibited").map((x) => x.process);
  return {
    mapping: m,
    decisionLabel: DECISION_LABEL[m.decision],
    verification: m.verifiedUse ? "Verified use" : "Claimed use only",
    fabricRestriction: prohibitedFabrics.length
      ? `Prohibited: ${prohibitedFabrics.join(", ")}`
      : m.fabricConditions.length ? "Recorded" : INSUFFICIENT_INFO,
    processRestriction: prohibitedProcesses.length
      ? `Prohibited: ${prohibitedProcesses.join(", ")}`
      : m.processConditions.length ? "Recorded" : INSUFFICIENT_INFO,
    evidenceCompleteness: m.evidenceLevel === "insufficient_information" ? INSUFFICIENT_INFO : EVIDENCE_SHORT[m.evidenceLevel] ?? m.evidenceLevel,
    mainWarning: m.flags[0] ?? (m.provisional ? "Provisional mapping" : "None recorded"),
    lastReviewed: m.reviewDate ?? m.effectiveDate ?? "Not recorded",
  };
}

const EVIDENCE_SHORT: Partial<Record<MappingEvidenceLevel, string>> = {
  current_manufacturer_label: "Label",
  current_sds: "SDS",
  current_tds: "TDS",
  current_manufacturer_instruction: "Instruction",
  manufacturer_brochure: "Brochure",
  verified_distributor_documentation: "Distributor doc",
  internal_controlled_trial: "Internal trial",
  professional_observation: "Observation",
  user_report: "User report",
  inferred: "Inferred",
};

/* ------------------------------------------------------------------ */
/* Dependency report (run before creating replacement structures)       */
/* ------------------------------------------------------------------ */

export type DependencyIssue = { severity: "blocking" | "warning"; area: string; message: string };

export function dependencyReport(mappings: ProductStageMapping[]): DependencyIssue[] {
  const issues: DependencyIssue[] = [];
  const productKeys = new Set(Object.keys(PRODUCT_BY_KEY));
  for (const m of mappings) {
    if (!productKeys.has(m.productKey))
      issues.push({ severity: "blocking", area: "product", message: `Mapping ${m.mappingId} references unknown product ${m.productKey}.` });
    if (!STAGE_BY_NUMBER[m.stageNumber])
      issues.push({ severity: "blocking", area: "stage", message: `Mapping ${m.mappingId} references unknown stage ${m.stageNumber}.` });
    const product = PRODUCT_BY_KEY[m.productKey];
    if (product && !product.versions.some((v) => v.key === m.productVersionKey))
      issues.push({ severity: "blocking", area: "version", message: `Mapping ${m.mappingId} references a product version that does not exist.` });
    if (m.country === "unspecified")
      issues.push({ severity: "warning", area: "country", message: `Mapping ${m.mappingId} has no confirmed country. Country applicability must be recorded before review.` });
  }
  return issues;
}
