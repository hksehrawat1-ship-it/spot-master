/**
 * STEP 13 — cross-company kit comparison engine.
 *
 * Rules enforced here:
 *   • Products are compared only under one defined case context.
 *   • The comparison never upgrades a decision produced by an approved mapping
 *     or by the safety engine.
 *   • Missing data never becomes a favourable value.
 *   • Safety failures remove a product from ranking entirely.
 *   • Ranking is produced only when the comparability gate passes.
 *   • Company count is data-driven; nothing is hard-coded to three companies.
 */

import {
  COMPARISON_RULESET_VERSION, CRITICAL_COMPARABILITY, COMPARABILITY_LABEL, CLAIM_ONLY_LEVELS,
  DAMAGE_OUTCOMES, DISQUALIFYING_DAMAGE, ELIGIBLE_SELECTIONS, EVIDENCE_STRENGTH,
  NOT_COMPARABLE_TEXT, NOT_ESTABLISHED, NOT_DISCLOSED, PRICE_MAX_AGE_DAYS, REMOVAL_SCORE,
  SELECTION_LABEL, TRIAL_OUTCOME_LABEL, CHECKLIST_LABEL, COST_UNCALCULABLE,
  DOMESTIC_PUBLIC_STATEMENT, NO_SUSTAINABILITY, RANK_DISPLAY_STATUSES, SUSPENDING_TRIGGERS,
  emptyChecklist, emptyCost, formatComparisonId,
} from "@/data/kitComparison";
import type {
  ComparisonContext, ComparisonEntry, ComparisonEvidenceLevel, ComparisonStatus,
  ComparisonSnapshot, ComparisonReviewTrigger, CostResult, DamageObservation,
  EvidenceChecklist, EvidenceChecklistKey, OperationalBurden, PerformanceTrial, PriceRecord,
  RankOutput, SelectionOutcome, ComparabilityCheckKey, SustainabilityFields,
} from "@/data/kitComparison";
import { PRODUCT_BY_KEY, COMPANY_BY_KEY, INSUFFICIENT_INFO } from "@/data/professionalProducts";
import type { Product, ProductDocument, ProductVersion } from "@/data/professionalProducts";
import type { ProductStageMapping, ProductTransition, MappingDecision } from "@/data/productMappings";
import { DECISION_LABEL } from "@/data/productMappings";
import {
  evaluateEligibility, versionOf, documentState, rinseText, repetitionText, isProfessionalRole,
} from "@/lib/mappingEngine";
import type { EligibilityOutcome, EligibilityResult, MappingCase } from "@/lib/mappingEngine";
import type { SafetyOutcome } from "@/lib/safetyEngine";

export const COMPARISON_ENGINE_VERSION = "step13-engine-v1";

/* ------------------------------------------------------------------ */
/* IDs and context                                                     */
/* ------------------------------------------------------------------ */

export const allocateComparisonId = (existing: { comparisonId: string }[]) =>
  formatComparisonId(existing.length + 1);

export const emptyContext = (over: Partial<ComparisonContext> = {}): ComparisonContext => ({
  comparisonId: formatComparisonId(1),
  components: [],
  stageNumber: 4,
  textile: "unknown",
  riskLevel: "amber",
  colour: "unknown",
  constructions: [],
  previousChemistry: [],
  appliedProductKeys: [],
  process: "wetside_spotting",
  country: "unspecified",
  role: "professional_spotter",
  training: [],
  equipmentAvailable: [],
  ppeAvailable: [],
  ventilationAvailable: false,
  productVersionKeys: [],
  comparisonDate: new Date().toISOString().slice(0, 10),
  rulesetVersion: COMPARISON_RULESET_VERSION,
  mappingVersions: [],
  ...over,
} as ComparisonContext);

/** A comparison context is never reduced to the stain name alone (§3). */
export function contextIsSufficient(ctx: ComparisonContext): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!ctx.stainKey && !ctx.categoryKey) missing.push("Stain or primary category");
  if (ctx.stageNumber === undefined || ctx.stageNumber === null) missing.push("Treatment stage");
  if (!ctx.textile || ctx.textile === "unknown") missing.push("Fabric");
  if (!ctx.colour || ctx.colour === "unknown") missing.push("Colour condition");
  if (!ctx.process) missing.push("Cleaning process");
  if (!ctx.country || ctx.country === "unspecified") missing.push("Country");
  if (!ctx.role) missing.push("User role");
  return { ok: missing.length === 0, missing };
}

export const caseFromContext = (ctx: ComparisonContext): MappingCase => ({
  stainKey: ctx.stainKey,
  categoryKey: ctx.categoryKey,
  components: ctx.components,
  stageNumber: ctx.stageNumber,
  textile: ctx.textile,
  colour: ctx.colour,
  constructions: ctx.constructions,
  riskLevel: ctx.riskLevel,
  process: ctx.process,
  country: ctx.country,
  role: ctx.role,
  training: ctx.training,
  ppeAvailable: ctx.ppeAvailable,
  ventilationAvailable: ctx.ventilationAvailable,
  equipmentAvailable: ctx.equipmentAvailable,
  previousChemistry: ctx.previousChemistry,
  appliedProductKeys: ctx.appliedProductKeys,
  testsCompleted: [],
});

/* ------------------------------------------------------------------ */
/* Selection outcome mapping (§5)                                      */
/* ------------------------------------------------------------------ */

const OUTCOME_TO_SELECTION: Record<EligibilityOutcome, SelectionOutcome> = {
  eligible: "included",
  eligible_after_testing: "included_after_testing",
  professional_only: "professional_only",
  ineligible_fabric: "excluded_fabric",
  ineligible_colour: "excluded_colour",
  ineligible_construction: "excluded_construction",
  ineligible_process: "excluded_process",
  ineligible_previous_chemical: "excluded_previous_chemical",
  ineligible_country: "excluded_country",
  ineligible_user_role: "excluded_safety_rule",
  missing_training: "excluded_training",
  missing_ppe: "excluded_ppe",
  missing_ventilation: "excluded_equipment",
  missing_equipment: "excluded_equipment",
  documentation_incomplete: "excluded_missing_documentation",
  document_conflict: "excluded_missing_documentation",
  product_suspended: "excluded_safety_rule",
  product_discontinued: "excluded_safety_rule",
  insufficient_information: "insufficient_information",
};

/* ------------------------------------------------------------------ */
/* Evidence checklist (§11)                                            */
/* ------------------------------------------------------------------ */

export function buildChecklist(
  mapping: ProductStageMapping,
  product?: Product,
  version?: ProductVersion,
  docs?: ProductDocument[],
  opts: { trials?: PerformanceTrial[]; price?: PriceRecord } = {},
): EvidenceChecklist {
  const list = emptyChecklist();
  const state = documentState(mapping, version, docs);
  list.identity_verified = !!product && !product.provisional;
  list.version_verified = !!version && version.verification === "verified";
  list.country_verified =
    !!version && version.countries.some((c) => c.country === mapping.country && c.marketStatus === "available");
  list.label_current = state.labelVerified;
  list.sds_current = state.sdsVerified;
  list.tds_current = state.tdsOrInstructionVerified;
  list.intended_use_verified = mapping.verifiedUse;
  list.fabric_compatibility_verified = mapping.fabricConditions.some((f) => f.verdict !== "insufficient_information");
  list.colour_compatibility_verified = mapping.colourConditions.some((f) => f.verdict !== "insufficient_information");
  list.process_compatibility_verified = mapping.processConditions.some((f) => f.verdict !== "insufficient_information");
  list.quantity_verified = mapping.quantities?.approvalStatus === "approved" && !!mapping.quantities.quantity;
  list.contact_time_verified = !!mapping.quantities?.contactTime;
  list.temperature_verified = !!mapping.quantities?.temperature;
  list.rinsing_verified = mapping.rinse.required !== "insufficient_information";
  list.neutralization_verified = !!mapping.rinse.medium;
  list.ppe_verified = mapping.requiredPpe.length > 0;
  list.ventilation_verified = mapping.ventilationRequired !== "insufficient_information";
  list.incompatibilities_verified = (version?.incompatibilities.length ?? 0) > 0;
  list.performance_evidence_available = (opts.trials ?? []).some((t) => t.decision === "accepted");
  list.cost_data_available = !!opts.price?.verified;
  list.technical_review_complete = mapping.status === "published" || mapping.status === "approved";
  return list;
}

export const checklistGaps = (c: EvidenceChecklist): string[] =>
  (Object.keys(c) as EvidenceChecklistKey[]).filter((k) => !c[k]).map((k) => CHECKLIST_LABEL[k]);

/* ------------------------------------------------------------------ */
/* Performance trials (§12, §13)                                       */
/* ------------------------------------------------------------------ */

export function trialsForEntry(
  trials: PerformanceTrial[],
  productKey: string,
  productVersionKey: string,
  ctx: ComparisonContext,
): PerformanceTrial[] {
  return trials.filter(
    (t) =>
      t.productKey === productKey &&
      t.productVersionKey === productVersionKey &&
      t.decision === "accepted" &&
      t.result !== "test_invalid" &&
      (!ctx.stainKey || t.stainKey === ctx.stainKey) &&
      t.textile === ctx.textile &&
      t.process === ctx.process,
  );
}

/** Two trials may only be compared when the case-critical conditions match (§12). */
export function trialsComparable(a: PerformanceTrial, b: PerformanceTrial): boolean {
  return (
    a.stainKey === b.stainKey &&
    a.textile === b.textile &&
    a.process === b.process &&
    a.controlSample === b.controlSample &&
    a.inspectionAfterDrying === b.inspectionAfterDrying &&
    (a.fabricColour ?? "unknown") === (b.fabricColour ?? "unknown") &&
    (a.contactTime ?? NOT_ESTABLISHED) === (b.contactTime ?? NOT_ESTABLISHED) &&
    (a.dose ?? NOT_ESTABLISHED) === (b.dose ?? NOT_ESTABLISHED) &&
    (a.temperature ?? NOT_ESTABLISHED) === (b.temperature ?? NOT_ESTABLISHED)
  );
}

export const bestTrialScore = (trials: PerformanceTrial[]): number =>
  trials.length ? Math.max(...trials.map((t) => REMOVAL_SCORE[t.result])) : -1;

export function damageFromTrials(trials: PerformanceTrial[]): DamageObservation[] {
  const set = new Set<DamageObservation>();
  for (const t of trials) {
    if (DAMAGE_OUTCOMES.includes(t.result)) set.add(t.result as DamageObservation);
    t.damageObserved.filter((d) => d !== "none").forEach((d) => set.add(d));
  }
  return [...set];
}

/* ------------------------------------------------------------------ */
/* Cost per treatment (§15, §16)                                       */
/* ------------------------------------------------------------------ */

const daysBetween = (a: string, b: string) =>
  Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);

export function costPerTreatment(
  price: PriceRecord | undefined,
  mapping: ProductStageMapping,
  ctx: ComparisonContext,
  opts: { basis?: "product_only" | "total_process"; targetCurrency?: string } = {},
): CostResult {
  const missing: string[] = [];
  if (!price) return emptyCost(["Verified price record"]);
  if (!price.verified) missing.push("Verified price record");
  if (price.price === undefined) missing.push("Product price");
  if (!price.currency) missing.push("Currency");
  if (!price.priceDate) missing.push("Price date");
  if (price.packSize === undefined) missing.push("Verified pack size");
  if (price.usableQuantity === undefined) missing.push("Usable quantity");
  if (price.taxIncluded === undefined) missing.push("Tax basis");
  if (price.country !== ctx.country) missing.push("Country-applicable price");

  const dose = mapping.quantities;
  const doseVerified = dose?.approvalStatus === "approved" && !!dose.quantity;
  if (!doseVerified) missing.push("Verified dose");
  const doseValue = doseVerified ? Number.parseFloat(String(dose?.quantity)) : Number.NaN;
  if (doseVerified && !Number.isFinite(doseValue)) missing.push("Numeric verified dose");

  if (price.priceDate && daysBetween(price.priceDate, ctx.comparisonDate) > PRICE_MAX_AGE_DAYS)
    missing.push("Current price date");

  const needsConversion = !!opts.targetCurrency && !!price.currency && opts.targetCurrency !== price.currency;
  if (needsConversion && (!price.exchangeRate || !price.exchangeRateSource || !price.exchangeRateDate))
    missing.push("Exchange rate with recorded source and date");

  if (missing.length) {
    const out = emptyCost(missing);
    out.private = !!price.organizationKey;
    return out;
  }

  const waste = price.wasteAllowance ?? 0;
  const usable = price.usableQuantity! - waste;
  const treatments = usable / doseValue;
  const rate = needsConversion ? price.exchangeRate! : 1;
  const result = (price.price! * rate) / treatments;

  return {
    calculable: true,
    formula:
      "(price × exchange rate) ÷ ((usable quantity − documented waste) ÷ verified dose)",
    inputs: {
      price: String(price.price),
      currency: price.currency!,
      priceDate: price.priceDate!,
      packSize: `${price.packSize} ${price.packUnit ?? ""}`.trim(),
      usableQuantity: String(price.usableQuantity),
      documentedWaste: String(waste),
      verifiedDose: `${dose?.quantity} ${dose?.unit ?? ""}`.trim(),
      taxIncluded: price.taxIncluded ? "Tax included" : "Tax excluded",
      exchangeRate: needsConversion
        ? `${price.exchangeRate} (${price.exchangeRateSource}, ${price.exchangeRateDate})`
        : "Not applied",
      country: price.country,
    },
    currency: opts.targetCurrency ?? price.currency,
    result: Math.round(result * 10_000) / 10_000,
    costBasis: opts.basis ?? "product_only",
    confidence: "verified",
    missingInputs: [],
    message: "Cost per treatment calculated from verified price and verified dose.",
    private: !!price.organizationKey,
  };
}

/** Costs may only be compared when both were calculated on the same basis (§16). */
export function costsComparable(a: CostResult, b: CostResult): boolean {
  return (
    a.calculable && b.calculable &&
    a.costBasis === b.costBasis &&
    a.currency === b.currency &&
    a.inputs.taxIncluded === b.inputs.taxIncluded
  );
}

/* ------------------------------------------------------------------ */
/* Operational burden (§18)                                            */
/* ------------------------------------------------------------------ */

export function operationalBurden(mapping: ProductStageMapping, version?: ProductVersion): OperationalBurden {
  const training = mapping.role.training.map((t) => t.replace(/_/g, " "));
  const testing = mapping.requiredTests.map((t) => t.testKey.replace(/_/g, " "));
  const burdenIndex =
    training.length + testing.length + mapping.requiredEquipment.length + mapping.requiredPpe.length +
    (mapping.rinse.required === "required" ? 1 : 0) +
    (mapping.rinse.inspectionRequired ? 1 : 0);
  return {
    trainingRequired: training.length ? training : [INSUFFICIENT_INFO],
    treatmentStageCount: mapping.requiredPriorStage || mapping.requiredFollowingStage
      ? [mapping.requiredPriorStage, mapping.stageNumber, mapping.requiredFollowingStage].filter((x) => x !== undefined).length
      : 1,
    requiredTesting: testing.length ? testing : ["None recorded"],
    requiredEquipment: mapping.requiredEquipment.length ? mapping.requiredEquipment : [INSUFFICIENT_INFO],
    requiredPpe: mapping.requiredPpe.length ? mapping.requiredPpe : [INSUFFICIENT_INFO],
    ventilation: mapping.ventilationRequired === "insufficient_information"
      ? INSUFFICIENT_INFO : mapping.ventilationRequired.replace(/_/g, " "),
    rinsing: rinseText(mapping),
    neutralization: mapping.rinse.medium ?? NOT_ESTABLISHED,
    inspectionBurden: mapping.rinse.inspectionRequired ? "Inspection required" : NOT_ESTABLISHED,
    machineRestrictions: version?.processes.length ? "Recorded at version level" : INSUFFICIENT_INFO,
    storage: version?.safety.storage ?? NOT_DISCLOSED,
    documentationComplexity: `${mapping.sourceDocumentKeys.length} source document(s) recorded`,
    burdenIndex,
  };
}

/* ------------------------------------------------------------------ */
/* Advantages and limitations (§19)                                    */
/* ------------------------------------------------------------------ */

function advantagesAndLimitations(
  entry: {
    mapping: ProductStageMapping; selection: SelectionOutcome; checklist: EvidenceChecklist;
    cost: CostResult; trials: PerformanceTrial[]; damage: DamageObservation[]; ctx: ComparisonContext;
  },
): { advantages: string[]; limitations: string[] } {
  const { mapping, selection, checklist, cost, trials, damage, ctx } = entry;
  const advantages: string[] = [];
  const limitations: string[] = [];

  if (checklist.fabric_compatibility_verified && selection !== "excluded_fabric")
    advantages.push(`Verified compatibility with ${ctx.textile.replace(/_/g, " ")}.`);
  if (checklist.process_compatibility_verified && selection !== "excluded_process")
    advantages.push(`Applicable to the ${ctx.process.replace(/_/g, " ")} process.`);
  if (checklist.label_current && checklist.sds_current && checklist.tds_current)
    advantages.push("Current country documents complete.");
  if (cost.calculable) advantages.push(`Cost per treatment calculated from verified data (${cost.currency} ${cost.result}).`);
  if (mapping.requiredEquipment.every((e) => ctx.equipmentAvailable.includes(e)) && mapping.requiredEquipment.length)
    advantages.push("Requires equipment already available.");
  const best = trials.find((t) => REMOVAL_SCORE[t.result] >= 4 && !damage.length);
  if (best) advantages.push(`Controlled-trial result under comparable conditions: ${TRIAL_OUTCOME_LABEL[best.result]}.`);

  if (selection === "professional_only") limitations.push("Professional use only.");
  if (selection === "excluded_fabric") limitations.push("Not permitted on the current fabric.");
  if (selection === "excluded_colour") limitations.push("Not permitted on the current colour condition.");
  if (selection === "excluded_process") limitations.push("Not compatible with the organization's cleaning process.");
  if (selection === "included_after_testing" || mapping.requiredTests.length) limitations.push("Requires testing before use.");
  if (!checklist.tds_current) limitations.push("Missing current TDS.");
  if (!checklist.sds_current) limitations.push("Missing current SDS.");
  if (!checklist.label_current) limitations.push("Missing current label.");
  if (mapping.requiredPpe.length > 2) limitations.push("Higher documented PPE requirement.");
  if (!cost.calculable) limitations.push("Cost cannot be calculated.");
  if (!trials.length) limitations.push("Performance evidence is unavailable.");
  if (damage.length) limitations.push(`Damage observed in trials: ${damage.join(", ")}.`);
  return { advantages, limitations };
}

/* ------------------------------------------------------------------ */
/* Entry assembly                                                      */
/* ------------------------------------------------------------------ */

export type ComparisonOptions = {
  mappings: ProductStageMapping[];
  transitions?: ProductTransition[];
  docs?: ProductDocument[];
  products?: Record<string, Product>;
  trials?: PerformanceTrial[];
  prices?: PriceRecord[];
  sustainability?: Record<string, SustainabilityFields>;
  /** Organization inventory keys; when supplied, products outside it are excluded. */
  inventoryProductKeys?: string[];
  /** Safety-engine outcome for the case; a blocked outcome removes every product. */
  safetyOutcome?: SafetyOutcome;
  safetyBlockedProductKeys?: string[];
  targetCurrency?: string;
  status?: ComparisonStatus;
  reviewer?: string;
};

function evidenceLevelFor(
  mapping: ProductStageMapping,
  trials: PerformanceTrial[],
): ComparisonEvidenceLevel {
  if (trials.some((t) => t.repeatability === "repeated")) return "repeated_internal_trial";
  if (trials.length) return "controlled_internal_trial";
  const l = mapping.evidenceLevel;
  if (l === "internal_controlled_trial") return "controlled_internal_trial";
  if (COMPARISON_EVIDENCE_SET.has(l as ComparisonEvidenceLevel)) return l as ComparisonEvidenceLevel;
  return "insufficient_information";
}

const COMPARISON_EVIDENCE_SET = new Set<ComparisonEvidenceLevel>([
  "current_manufacturer_label", "current_sds", "current_tds", "current_manufacturer_instruction",
  "manufacturer_brochure", "verified_distributor_documentation", "controlled_internal_trial",
  "repeated_internal_trial", "professional_observation", "user_report", "inferred",
  "insufficient_information",
]);

export function buildEntry(
  mapping: ProductStageMapping,
  ctx: ComparisonContext,
  opts: ComparisonOptions,
): ComparisonEntry {
  const product = (opts.products ?? PRODUCT_BY_KEY)[mapping.productKey];
  const version = versionOf(mapping, product);
  const eligibility: EligibilityResult = evaluateEligibility(mapping, caseFromContext(ctx), {
    transitions: opts.transitions, docs: opts.docs, products: opts.products,
  });

  let selection: SelectionOutcome = OUTCOME_TO_SELECTION[eligibility.outcome];
  let reason = eligibility.reason;

  if (opts.safetyBlockedProductKeys?.includes(mapping.productKey)) {
    selection = "excluded_safety_rule";
    reason = "The centralized safety engine blocked this product for the current case.";
  } else if (opts.safetyOutcome === "blocked" || opts.safetyOutcome === "hazard_referral") {
    selection = "excluded_safety_rule";
    reason = "The centralized safety engine blocked treatment for this case, so no product can be offered.";
  } else if (opts.inventoryProductKeys && !opts.inventoryProductKeys.includes(mapping.productKey)) {
    selection = "excluded_organization";
    reason = "This product is not held or approved in the organization's inventory.";
  }

  const trials = trialsForEntry(opts.trials ?? [], mapping.productKey, mapping.productVersionKey, ctx);
  const damage = damageFromTrials(trials);
  const price = (opts.prices ?? []).find(
    (p) =>
      p.productKey === mapping.productKey &&
      p.productVersionKey === mapping.productVersionKey &&
      (!ctx.organizationKey || !p.organizationKey || p.organizationKey === ctx.organizationKey),
  );
  const cost = costPerTreatment(price, mapping, ctx, { targetCurrency: opts.targetCurrency });
  const checklist = buildChecklist(mapping, product, version, opts.docs, { trials, price });
  const burden = operationalBurden(mapping, version);
  const evidenceLevel = evidenceLevelFor(mapping, trials);
  const { advantages, limitations } = advantagesAndLimitations({
    mapping, selection, checklist, cost, trials, damage, ctx,
  });

  const decision: MappingDecision = ELIGIBLE_SELECTIONS.includes(selection)
    ? eligibility.decision
    : selection === "insufficient_information"
      ? "insufficient_information"
      : "not_recommended";

  const company = COMPANY_BY_KEY[mapping.companyKey];
  const dimensions: ComparisonEntry["dimensions"] = {
    company: company?.displayName ?? mapping.companyKey,
    kit: mapping.kitKey ?? NOT_ESTABLISHED,
    productName: product?.displayName ?? mapping.productKey,
    productCode: product?.productCode ?? version?.productCode ?? NOT_DISCLOSED,
    productVersion: mapping.productVersionKey,
    country: mapping.country,
    stage: `Stage ${mapping.stageNumber}`,
    intendedStain: mapping.stainKey ?? mapping.categoryKey ?? NOT_ESTABLISHED,
    intendedComponent: mapping.componentKey ?? NOT_ESTABLISHED,
    stainSuitability: SELECTION_LABEL[selection],
    fabricSuitability: describeVerdict(mapping.fabricConditions.find((f) => f.textile === ctx.textile)?.verdict),
    colourSuitability: describeVerdict(mapping.colourConditions.find((f) => f.colour === ctx.colour)?.verdict),
    constructionSuitability: mapping.constructionConditions.length ? "Recorded" : INSUFFICIENT_INFO,
    processCompatibility: describeVerdict(mapping.processConditions.find((f) => f.process === ctx.process)?.verdict),
    previousChemicalCompatibility: mapping.prohibitedPriorChemistry.length
      ? `Prohibited after: ${mapping.prohibitedPriorChemistry.join(", ")}` : INSUFFICIENT_INFO,
    requiredTesting: eligibility.requiredTests.length ? eligibility.requiredTests.join("; ") : "None recorded",
    quantityOrDilution: mapping.quantities?.quantity ?? NOT_ESTABLISHED,
    contactTime: mapping.quantities?.contactTime ?? NOT_ESTABLISHED,
    temperatureLimits: mapping.quantities?.temperature ?? NOT_ESTABLISHED,
    applicationTechnique: mapping.notes ?? NOT_ESTABLISHED,
    rinsing: rinseText(mapping),
    neutralization: mapping.rinse.medium ?? NOT_ESTABLISHED,
    inspection: mapping.rinse.inspectionRequired ? "Required" : NOT_ESTABLISHED,
    ppe: burden.requiredPpe.join(", "),
    ventilation: burden.ventilation,
    equipment: burden.requiredEquipment.join(", "),
    storage: burden.storage,
    incompatibilities: version?.incompatibilities.length
      ? `${version.incompatibilities.length} recorded` : INSUFFICIENT_INFO,
    training: burden.trainingRequired.join(", "),
    manufacturerClaims: mapping.manufacturerClaim ?? "None recorded",
    verifiedPerformance: trials.length
      ? trials.map((t) => TRIAL_OUTCOME_LABEL[t.result]).join("; ")
      : "No comparable controlled trial held",
    costPerTreatment: cost.calculable ? `${cost.currency} ${cost.result}` : COST_UNCALCULABLE,
    advantages: advantages.join(" ") || "None recorded",
    limitations: limitations.join(" ") || "None recorded",
    evidenceLevel,
    verificationCompleteness: `${Object.values(checklist).filter(Boolean).length}/${Object.keys(checklist).length} verified`,
    decision: DECISION_LABEL[decision],
    rankEligibility: "",
  };

  const { eligible, failures } = rankEligibility({
    selection, checklist, mapping, trials, damage, cost, evidenceLevel, ctx,
  });
  dimensions.rankEligibility = eligible ? "Rank eligible" : `Not rank eligible: ${failures[0]}`;

  return {
    productKey: mapping.productKey,
    productVersionKey: mapping.productVersionKey,
    companyKey: mapping.companyKey,
    kitKey: mapping.kitKey,
    mappingId: mapping.mappingId,
    mappingVersion: mapping.version,
    selection,
    selectionReason: reason,
    decision,
    dimensions,
    checklist,
    checklistComplete: Object.values(checklist).every(Boolean),
    evidenceLevel,
    trials,
    damageObserved: damage,
    cost,
    sustainability: opts.sustainability?.[mapping.productKey] ?? NO_SUSTAINABILITY,
    burden,
    advantages,
    limitations,
    rankEligible: eligible,
    rankEligibilityFailures: failures,
    rank: ELIGIBLE_SELECTIONS.includes(selection) ? "insufficient_information" : "not_recommended",
    rankReason: "",
    missingData: checklistGaps(checklist),
  };
}

const describeVerdict = (v?: string) =>
  !v || v === "insufficient_information" ? INSUFFICIENT_INFO : v.replace(/_/g, " ");

/* ------------------------------------------------------------------ */
/* Rank eligibility (§20)                                              */
/* ------------------------------------------------------------------ */

export function rankEligibility(arg: {
  selection: SelectionOutcome;
  checklist: EvidenceChecklist;
  mapping: ProductStageMapping;
  trials: PerformanceTrial[];
  damage: DamageObservation[];
  cost: CostResult;
  evidenceLevel: ComparisonEvidenceLevel;
  ctx: ComparisonContext;
}): { eligible: boolean; failures: string[] } {
  const f: string[] = [];
  const { checklist, selection, trials, damage, evidenceLevel } = arg;
  if (!ELIGIBLE_SELECTIONS.includes(selection)) f.push("Product is not eligible for this case.");
  if (!checklist.identity_verified || !checklist.version_verified) f.push("Product identity or version is not verified.");
  if (!checklist.country_verified) f.push("Country applicability is not verified.");
  if (!checklist.label_current || !checklist.sds_current || !checklist.tds_current)
    f.push("Current documents are incomplete.");
  if (!checklist.technical_review_complete) f.push("Technical review is not complete.");
  if (!trials.length) f.push("No comparable performance evidence is held.");
  if (CLAIM_ONLY_LEVELS.includes(evidenceLevel)) f.push("Only claim-level evidence is held.");
  if (damage.some((d) => DISQUALIFYING_DAMAGE.includes(d))) f.push("Documented garment damage removes this product from ranking.");
  return { eligible: f.length === 0, failures: f };
}

/* ------------------------------------------------------------------ */
/* Comparability gate (§8)                                             */
/* ------------------------------------------------------------------ */

export type ComparabilityResult = {
  comparable: boolean;
  checks: { key: ComparabilityCheckKey; label: string; passed: boolean; note: string }[];
  failedCritical: string[];
  message: string;
};

export function comparabilityGate(entries: ComparisonEntry[], ctx: ComparisonContext): ComparabilityResult {
  const pool = entries.filter((e) => ELIGIBLE_SELECTIONS.includes(e.selection));
  const check = (key: ComparabilityCheckKey, passed: boolean, note: string) =>
    ({ key, label: COMPARABILITY_LABEL[key], passed, note });

  const stages = new Set(pool.map((e) => e.dimensions.stage));
  const targets = new Set(pool.map((e) => e.dimensions.intendedStain));
  const trialsPool = pool.flatMap((e) => e.trials);
  const trialPairsComparable =
    pool.length > 1 && pool.every((e) => e.trials.length > 0) &&
    trialsPool.every((t) => trialsComparable(t, trialsPool[0]));
  const doses = pool.map((e) => e.dimensions.quantityOrDilution ?? NOT_ESTABLISHED);
  const costs = pool.map((e) => e.cost);

  const checks = [
    check("same_stage", pool.length > 0 && stages.size === 1, `Stages compared: ${[...stages].join(", ") || "none"}`),
    check("same_target", pool.length > 0 && targets.size === 1, `Targets compared: ${[...targets].join(", ") || "none"}`),
    check("same_case_conditions", contextIsSufficient(ctx).ok, contextIsSufficient(ctx).missing.join(", ") || "Case context complete"),
    check("same_use_objective", pool.length > 0 && targets.size === 1, "Product-use objective derived from the mapped stage and target"),
    check("same_fabric_applicability", pool.every((e) => e.checklist.fabric_compatibility_verified), "Verified fabric statements required for every product"),
    check("same_colour_applicability", pool.every((e) => e.checklist.colour_compatibility_verified), "Verified colour statements required for every product"),
    check("same_process_applicability", pool.every((e) => e.checklist.process_compatibility_verified), "Verified process statements required for every product"),
    check("current_versions", pool.every((e) => e.checklist.version_verified), "Every compared product must use a verified current version"),
    check("country_applicability", pool.every((e) => e.checklist.country_verified), `Country: ${ctx.country}`),
    check("safety_documents_available", pool.every((e) => e.checklist.sds_current && e.checklist.label_current), "Current label and SDS required"),
    check("comparable_performance_evidence", trialPairsComparable, trialPairsComparable ? "Trial conditions match" : "Trial conditions are missing or materially different"),
    check("comparable_dose_information", doses.length > 0 && doses.every((d) => d !== NOT_ESTABLISHED), "Verified dose required for every product"),
    check("comparable_outcome_measure", trialPairsComparable, "Outcomes must use the same controlled scale and conditions"),
    check("comparable_cost_basis", costs.length > 1 && costs.every((c) => costsComparable(c, costs[0])), "Same cost basis, currency and tax basis required"),
  ];

  const failedCritical = checks.filter((c) => CRITICAL_COMPARABILITY.includes(c.key) && !c.passed).map((c) => c.label);
  const comparable = pool.length > 1 && failedCritical.length === 0;
  return {
    comparable,
    checks,
    failedCritical,
    message: comparable ? "Products are comparable under the recorded case conditions." : NOT_COMPARABLE_TEXT,
  };
}

/* ------------------------------------------------------------------ */
/* Ranking (§21, §22, §23)                                             */
/* ------------------------------------------------------------------ */

function rankScore(e: ComparisonEntry): number[] {
  // Lower is better on every axis; safety-first ordering (§21).
  return [
    e.selection === "included" ? 0 : e.selection === "included_after_testing" ? 1 : 2, // safety and compatibility
    e.checklist.fabric_compatibility_verified && e.checklist.process_compatibility_verified ? 0 : 1, // care/process compliance
    5 - bestTrialScore(e.trials),                                    // verified effectiveness
    e.damageObserved.length ? 1 : 0,                                 // absence of damage
    10 - EVIDENCE_STRENGTH[e.evidenceLevel],                         // evidence quality
    e.burden.requiredTesting.length,                                 // process completion
    e.burden.burdenIndex,                                            // operational feasibility
    e.cost.calculable ? e.cost.result! : Number.MAX_SAFE_INTEGER,    // cost per treatment
    e.sustainability.evidenceLevel === "insufficient_information" ? 1 : 0,
  ];
}

const cmp = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};

export function applyRanking(
  entries: ComparisonEntry[],
  comparability: ComparabilityResult,
  status: ComparisonStatus,
): ComparisonEntry[] {
  const ranked = entries.map((e) => ({ ...e }));
  const displayRank = RANK_DISPLAY_STATUSES.includes(status);

  for (const e of ranked) {
    if (!ELIGIBLE_SELECTIONS.includes(e.selection)) {
      e.rank = "not_recommended";
      e.rankReason = e.selectionReason;
    }
  }

  const pool = ranked.filter((e) => e.rankEligible && ELIGIBLE_SELECTIONS.includes(e.selection));

  if (!comparability.comparable || pool.length < 2) {
    for (const e of ranked) {
      if (ELIGIBLE_SELECTIONS.includes(e.selection)) {
        e.rank = pool.length === 0 && ranked.every((x) => !ELIGIBLE_SELECTIONS.includes(x.selection))
          ? "no_applicable_product"
          : "not_comparable";
        e.rankReason = comparability.comparable
          ? "Only one product is rank eligible, so no comparative rank is produced."
          : `${NOT_COMPARABLE_TEXT} Missing: ${comparability.failedCritical.join(", ") || "comparable verified evidence"}.`;
      }
    }
    return ranked;
  }

  if (!displayRank) {
    for (const e of pool) {
      e.rank = "insufficient_information";
      e.rankReason = "A final rank is displayed only for approved or published comparisons.";
    }
    return ranked;
  }

  const sorted = [...pool].sort((a, b) => cmp(rankScore(a), rankScore(b)));
  let position = 0;
  let previous: number[] | null = null;
  sorted.forEach((e, index) => {
    const score = rankScore(e);
    const joint = previous !== null && cmp(score, previous) === 0;
    if (!joint) position = index + 1;
    previous = score;
    e.rank = joint ? "joint_rank" : position === 1 ? "rank_1" : position === 2 ? "rank_2" : position === 3 ? "rank_3" : "joint_rank";
    if (joint) {
      const twin = sorted[index - 1];
      twin.rank = "joint_rank";
      twin.rankReason = "Verified data are equivalent under the recorded case conditions.";
    }
    e.rankReason = e.rankReason || rankExplanation(e);
  });
  return ranked;
}

const rankExplanation = (e: ComparisonEntry) =>
  [
    `Safety and compatibility: ${SELECTION_LABEL[e.selection]}.`,
    `Verified effectiveness: ${e.dimensions.verifiedPerformance}.`,
    `Damage: ${e.damageObserved.length ? e.damageObserved.join(", ") : "none documented"}.`,
    `Evidence: ${e.evidenceLevel.replace(/_/g, " ")}.`,
    `Cost: ${e.dimensions.costPerTreatment}.`,
  ].join(" ");

/* ------------------------------------------------------------------ */
/* Comparison assembly                                                 */
/* ------------------------------------------------------------------ */

export type ComparisonResult = {
  comparisonId: string;
  context: ComparisonContext;
  status: ComparisonStatus;
  entries: ComparisonEntry[];
  comparability: ComparabilityResult;
  ranked: boolean;
  headline: string;
  noRankReason?: string;
  missingDataSummary: string[];
  snapshot: ComparisonSnapshot;
  engineVersion: string;
};

export function buildComparison(ctx: ComparisonContext, opts: ComparisonOptions): ComparisonResult {
  const relevant = opts.mappings.filter((m) => m.stageNumber === ctx.stageNumber);
  const entries = relevant.map((m) => buildEntry(m, ctx, opts));
  const comparability = comparabilityGate(entries, ctx);

  let status: ComparisonStatus = opts.status ?? "draft";
  if (!opts.status) {
    if (entries.length === 0) status = "data_required";
    else if (!comparability.comparable) status = "not_comparable";
    else status = "comparable";
  }

  const ranked = applyRanking(entries, comparability, status);
  const anyEligible = ranked.some((e) => ELIGIBLE_SELECTIONS.includes(e.selection));
  const didRank = ranked.some((e) => e.rank === "rank_1" || e.rank === "joint_rank");

  const headline = !entries.length
    ? "No product mapping exists for this treatment stage, so no comparison can be produced."
    : !anyEligible
      ? "No product is eligible for this case. Products are shown with the reason each was excluded."
      : didRank
        ? "Products are ranked under the recorded case conditions only."
        : NOT_COMPARABLE_TEXT;

  const snapshot: ComparisonSnapshot = {
    comparisonId: ctx.comparisonId,
    caseVersion: ctx.caseId ?? "unlinked",
    rulesetVersion: ctx.rulesetVersion,
    stainContentVersion: ctx.stainKey ? `${ctx.stainKey}@${ctx.comparisonDate}` : "not linked",
    productVersionKeys: ranked.map((e) => e.productVersionKey),
    mappingVersions: ranked.map((e) => ({ mappingId: e.mappingId!, version: e.mappingVersion ?? 1 })),
    sourceDocumentKeys: [...new Set(relevant.flatMap((m) => m.sourceDocumentKeys))],
    priceVersionIds: (opts.prices ?? []).map((p) => p.priceId),
    trialIds: [...new Set(ranked.flatMap((e) => e.trials.map((t) => t.testId)))],
    decision: status,
    rankEligible: ranked.some((e) => e.rankEligible),
    ranks: ranked.map((e) => ({ productKey: e.productKey, rank: e.rank })),
    explanation: headline,
    reviewer: opts.reviewer,
    date: ctx.comparisonDate,
  };

  return {
    comparisonId: ctx.comparisonId,
    context: ctx,
    status,
    entries: ranked,
    comparability,
    ranked: didRank,
    headline,
    noRankReason: didRank ? undefined : comparability.failedCritical.join(", ") || "Comparable verified evidence is incomplete.",
    missingDataSummary: [...new Set(ranked.flatMap((e) => e.missingData))],
    snapshot,
    engineVersion: COMPARISON_ENGINE_VERSION,
  };
}

/* ------------------------------------------------------------------ */
/* Table rows (§24)                                                    */
/* ------------------------------------------------------------------ */

export type ComparisonRow = {
  company: string;
  kitProduct: string;
  stage: string;
  targetStain: string;
  fabricRestrictions: string;
  processRequirement: string;
  ppe: string;
  costPerUse: string;
  advantages: string;
  limitations: string;
  finalRank: string;
  /** Safety-critical text that must never be hidden behind a disclosure. */
  criticalWarnings: string[];
};

export function comparisonRows(result: ComparisonResult): ComparisonRow[] {
  return result.entries.map((e) => ({
    company: e.dimensions.company ?? e.companyKey,
    kitProduct: `${e.dimensions.kit ?? ""} — ${e.dimensions.productName ?? e.productKey}`.replace(/^ — /, ""),
    stage: e.dimensions.stage ?? NOT_ESTABLISHED,
    targetStain: e.dimensions.intendedStain ?? NOT_ESTABLISHED,
    fabricRestrictions: e.dimensions.fabricSuitability ?? INSUFFICIENT_INFO,
    processRequirement: e.dimensions.processCompatibility ?? INSUFFICIENT_INFO,
    ppe: e.dimensions.ppe ?? INSUFFICIENT_INFO,
    costPerUse: e.dimensions.costPerTreatment ?? COST_UNCALCULABLE,
    advantages: e.advantages.join(" ") || "None recorded",
    limitations: e.limitations.join(" ") || "None recorded",
    finalRank: e.rank,
    criticalWarnings: [
      ...(e.selection.startsWith("excluded") ? [e.selectionReason] : []),
      ...e.damageObserved.map((d) => `Damage documented in trials: ${d}.`),
      ...(e.decision === "not_recommended" ? ["Not recommended for this case."] : []),
    ],
  }));
}

/* ------------------------------------------------------------------ */
/* Role-aware views (§25, §26, §27, §28)                               */
/* ------------------------------------------------------------------ */

export type ComparisonAudience = "domestic" | "quick_professional" | "technical";

export function comparisonAudience(role: string, isReviewer = false): ComparisonAudience {
  if (isReviewer || role === "technical_reviewer" || role === "content_admin" || role === "system_admin")
    return "technical";
  return isProfessionalRole(role as never) ? "quick_professional" : "domestic";
}

export type DomesticComparisonView = {
  accessible: false;
  message: string;
};

export const domesticView = (): DomesticComparisonView => ({
  accessible: false,
  message: DOMESTIC_PUBLIC_STATEMENT,
});

export type QuickComparisonCard = {
  product: string;
  company: string;
  testingRequired: string;
  mainRestriction: string;
  requiredProcess: string;
  ppe: string;
  evidenceStatus: string;
  decision: string;
  rank?: string;
};

export function quickProfessionalView(result: ComparisonResult): {
  cards: QuickComparisonCard[]; action: string;
} {
  const cards = result.entries.map((e) => ({
    product: e.dimensions.productName ?? e.productKey,
    company: e.dimensions.company ?? e.companyKey,
    testingRequired: e.dimensions.requiredTesting ?? "None recorded",
    mainRestriction: e.limitations[0] ?? "None recorded",
    requiredProcess: e.dimensions.rinsing ?? INSUFFICIENT_INFO,
    ppe: e.dimensions.ppe ?? INSUFFICIENT_INFO,
    evidenceStatus: e.dimensions.verificationCompleteness ?? INSUFFICIENT_INFO,
    decision: e.dimensions.decision ?? INSUFFICIENT_INFO,
    // An unsupported rank is never shown just to simplify the interface (§25).
    rank: result.ranked ? e.rank : undefined,
  }));
  const action = result.ranked
    ? "Use the highest-ranked eligible product under the recorded case conditions."
    : result.entries.some((e) => ELIGIBLE_SELECTIONS.includes(e.selection))
      ? "Products are shown side by side without a rank. Complete the missing evidence before choosing on comparison grounds."
      : "No eligible professional product is available for this case.";
  return { cards, action };
}

/** Organization pricing and inventory never leave the organization view (§28). */
export function universalTechnicalView(result: ComparisonResult): ComparisonResult {
  return {
    ...result,
    entries: result.entries.map((e) =>
      e.cost.private
        ? { ...e, cost: { ...emptyCost(["Organization pricing is private"]), message: "Organization pricing is not shown in the universal technical comparison." } }
        : e),
  };
}

export function organizationView(result: ComparisonResult, organizationKey: string): ComparisonResult {
  return {
    ...result,
    context: { ...result.context, organizationKey },
    entries: result.entries.filter((e) => e.selection !== "excluded_organization" || true),
  };
}

/* ------------------------------------------------------------------ */
/* Review triggers (§32)                                               */
/* ------------------------------------------------------------------ */

export function applyComparisonTrigger(
  snapshot: ComparisonSnapshot,
  trigger: ComparisonReviewTrigger,
): { status: ComparisonStatus; rankSuspended: boolean; note: string } {
  const suspend = SUSPENDING_TRIGGERS.includes(trigger);
  return {
    status: suspend ? "suspended" : "needs_review",
    rankSuspended: suspend,
    note: suspend
      ? "A safety-critical change was recorded, so the existing rank is suspended until review."
      : "The comparison is marked Needs Review. The historical result is retained unchanged.",
  };
}

/** Historical comparisons are reproducible: the snapshot is replayed, never recomputed (§30). */
export function reproduce(snapshot: ComparisonSnapshot): ComparisonSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as ComparisonSnapshot;
}
