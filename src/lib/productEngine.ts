/**
 * STEP 7 — professional product engine.
 *
 * Verification scorecard, publication rules, document hierarchy, conflict
 * detection, immutable versioning, role-aware views, cost gating and export.
 *
 * The engine never invents a value. Where documentation is absent it returns an
 * explicit "not disclosed" / "insufficient information" / "follow the label"
 * marker so the UI can label it.
 */

import {
  COMPANIES, KITS, PRODUCTS, DOCUMENTS, KIT_PRODUCTS,
  LAST_COMPANY_SEQ, LAST_KIT_SEQ, LAST_PRODUCT_SEQ, LAST_DOCUMENT_SEQ,
  formatCompanyId, formatKitId, formatProductId, formatDocumentId,
  NOT_DISCLOSED, INSUFFICIENT_INFO, FOLLOW_LABEL, COST_UNAVAILABLE,
  DOCUMENT_HIERARCHY, CHART_CANNOT_AUTHORISE, SAFETY_CRITICAL_FIELDS,
  TEXTILE_KEYS, COLOUR_TARGET_KEYS, PROCESS_LABEL, SUITABILITY_LABEL,
} from "@/data/professionalProducts";
import type {
  Company, Kit, Product, ProductVersion, ProductDocument, DocumentType,
  Suitability, ProcessKey, ProcessPermission, Instruction, CostInputs,
  Extraction, ExtractionField, TextileCompatibility, ActiveChemistry, ProductStatus,
} from "@/data/professionalProducts";

export const PRODUCT_ENGINE_VERSION = "step7-v1";

/* ------------------------------------------------------------------ */
/* Stable ID allocation (never reused)                                 */
/* ------------------------------------------------------------------ */

const seqOf = (id: string, prefix: string) => Number(id.replace(prefix, "")) || 0;

export const allocateCompanyId = (existing: Company[]) =>
  formatCompanyId(Math.max(LAST_COMPANY_SEQ, ...existing.map((c) => seqOf(c.companyId, "SM-CMP-"))) + 1);
export const allocateKitId = (existing: Kit[]) =>
  formatKitId(Math.max(LAST_KIT_SEQ, ...existing.map((k) => seqOf(k.kitId, "SM-KIT-"))) + 1);
export const allocateProductId = (existing: Product[]) =>
  formatProductId(Math.max(LAST_PRODUCT_SEQ, ...existing.map((p) => seqOf(p.productId, "SM-PRD-"))) + 1);
export const allocateDocumentId = (existing: ProductDocument[]) =>
  formatDocumentId(Math.max(LAST_DOCUMENT_SEQ, ...existing.map((d) => seqOf(d.documentId, "SM-DOC-"))) + 1);

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

export const currentVersion = (p: Product): ProductVersion =>
  p.versions.find((v) => v.key === p.currentVersionKey) ?? p.versions[p.versions.length - 1];

export const versionByKey = (p: Product, key?: string): ProductVersion | undefined =>
  key ? p.versions.find((v) => v.key === key) : undefined;

export const kitsForProduct = (productKey: string, links = KIT_PRODUCTS, kits = KITS): Kit[] =>
  links.filter((l) => l.productKey === productKey)
    .map((l) => kits.find((k) => k.key === l.kitKey))
    .filter(Boolean) as Kit[];

export const productsForKit = (kitKey: string, links = KIT_PRODUCTS, products = PRODUCTS): Product[] =>
  links.filter((l) => l.kitKey === kitKey)
    .map((l) => products.find((p) => p.key === l.productKey))
    .filter(Boolean) as Product[];

export const documentsFor = (p: Product, docs = DOCUMENTS): ProductDocument[] => {
  const kitKeys = kitsForProduct(p.key).map((k) => k.key);
  return docs.filter(
    (d) => d.productKey === p.key || (d.kitKey && kitKeys.includes(d.kitKey)) ||
      currentVersion(p).documentKeys.includes(d.key),
  );
};

/* ------------------------------------------------------------------ */
/* Display helpers — never invent a value                              */
/* ------------------------------------------------------------------ */

export function chemistryDisplay(c: ActiveChemistry) {
  return {
    ingredients: c.ingredients.length
      ? c.ingredients.map((i) => (i.concentration ? `${i.name} (${i.concentration})` : i.name))
      : [NOT_DISCLOSED],
    chemicalFamily: c.chemicalFamily || NOT_DISCLOSED,
    solventFamily: c.solventFamily || NOT_DISCLOSED,
    ph: c.ph ?? NOT_DISCLOSED,
    flashPoint: c.flashPoint ?? NOT_DISCLOSED,
    surfactantType: c.surfactantType || NOT_DISCLOSED,
    hazardousComponents: c.hazardousComponents.length ? c.hazardousComponents : [NOT_DISCLOSED],
    disclosureConfidence: c.disclosureConfidence,
  };
}

/** Missing compatibility always defaults to Insufficient Information (§10). */
export function textileSuitability(v: ProductVersion, targetKey: string): {
  suitability: Suitability; label: string; mainRisk?: string; requiredTest?: string; recorded: boolean;
} {
  const row = v.textile.find((t) => t.targetKey === targetKey);
  if (!row) {
    return { suitability: "insufficient_information", label: INSUFFICIENT_INFO, recorded: false };
  }
  return {
    suitability: row.suitability,
    label: SUITABILITY_LABEL[row.suitability],
    mainRisk: row.mainRisk,
    requiredTest: row.requiredTest,
    recorded: true,
  };
}

/** Missing process compatibility is "process not established" (§11). */
export function processPermission(v: ProductVersion, processKey: ProcessKey): {
  permitted: ProcessPermission; label: string; recorded: boolean;
} {
  const row = v.processes.find((p) => p.processKey === processKey);
  if (!row) return { permitted: "process_not_established", label: "Process not established", recorded: false };
  return { permitted: row.permitted, label: PROCESS_LABEL[processKey], recorded: true };
}

const INSTRUCTION_FIELDS = [
  "dilution", "contactTime", "temperature", "applicationMethod", "productQuantity",
  "rinsing", "neutralization", "maximumAttempts", "drying", "flushing",
] as const;
export type InstructionField = (typeof INSTRUCTION_FIELDS)[number];

/**
 * Returns the documented instruction value or the mandated fallback text.
 * Never synthesises a dilution, drop count, contact time, temperature,
 * attempt limit or neutralisation process (§12).
 */
export function instructionValue(v: ProductVersion, field: InstructionField): string {
  const approved = v.instructions
    .filter((i) => i.approvalStatus === "approved" && i.origin !== "local_practice" && i.origin !== "rejected")
    .sort((a, b) => a.stepOrder - b.stepOrder);
  const hit = approved.map((i) => i[field]).find((x) => typeof x === "string" && x.trim().length > 0);
  return (hit as string) ?? FOLLOW_LABEL;
}

/* ------------------------------------------------------------------ */
/* Document hierarchy                                                  */
/* ------------------------------------------------------------------ */

export const documentRank = (t: DocumentType) => {
  const i = DOCUMENT_HIERARCHY.indexOf(t);
  return i === -1 ? DOCUMENT_HIERARCHY.length : i;
};

/** Ordered highest authority first, restricted to documents for a country when given. */
export function rankedDocuments(docs: ProductDocument[], country?: string): ProductDocument[] {
  return [...docs]
    .filter((d) => (country ? !d.country || d.country === country : true))
    .sort((a, b) => documentRank(a.documentType) - documentRank(b.documentType));
}

export type AuthorityTopic = (typeof CHART_CANNOT_AUTHORISE)[number];

/** A spotting chart alone may never authorise these topics (§18). */
export function canAuthorise(docs: ProductDocument[], topic: AuthorityTopic): boolean {
  const verified = docs.filter((d) => d.state === "current_and_verified");
  if (!verified.length) return false;
  const nonChart = verified.filter((d) => d.documentType !== "spotting_chart");
  if (!nonChart.length) return false;
  void topic;
  return true;
}

/* ------------------------------------------------------------------ */
/* Verification scorecard (§26)                                        */
/* ------------------------------------------------------------------ */

export const SCORECARD_CHECKS = [
  "company_identity_verified", "product_identity_verified", "current_label_available",
  "current_sds_available", "current_tds_available", "manufacturer_instructions_available",
  "country_applicability_confirmed", "textile_restrictions_confirmed",
  "colour_restrictions_confirmed", "process_compatibility_confirmed", "dilution_confirmed",
  "contact_time_confirmed", "rinsing_confirmed", "neutralization_confirmed", "ppe_confirmed",
  "ventilation_confirmed", "incompatibilities_confirmed", "storage_confirmed",
  "reviewer_approval_complete",
] as const;
export type ScorecardCheck = (typeof SCORECARD_CHECKS)[number];

export const SCORECARD_LABEL: Record<ScorecardCheck, string> = {
  company_identity_verified: "Company identity verified",
  product_identity_verified: "Product identity verified",
  current_label_available: "Current label available",
  current_sds_available: "Current SDS available",
  current_tds_available: "Current TDS available",
  manufacturer_instructions_available: "Manufacturer instructions available",
  country_applicability_confirmed: "Country applicability confirmed",
  textile_restrictions_confirmed: "Textile restrictions confirmed",
  colour_restrictions_confirmed: "Colour restrictions confirmed",
  process_compatibility_confirmed: "Process compatibility confirmed",
  dilution_confirmed: "Dilution confirmed",
  contact_time_confirmed: "Contact time confirmed",
  rinsing_confirmed: "Rinsing confirmed",
  neutralization_confirmed: "Neutralization confirmed",
  ppe_confirmed: "PPE confirmed",
  ventilation_confirmed: "Ventilation confirmed",
  incompatibilities_confirmed: "Incompatibilities confirmed",
  storage_confirmed: "Storage confirmed",
  reviewer_approval_complete: "Reviewer approval complete",
};

export type OverallVerification =
  | "fully_verified" | "partially_verified" | "identity_only"
  | "insufficient_documentation" | "conflicting_documentation" | "suspended";

export const OVERALL_LABEL: Record<OverallVerification, string> = {
  fully_verified: "Fully Verified",
  partially_verified: "Partially Verified",
  identity_only: "Identity Only",
  insufficient_documentation: "Insufficient Documentation",
  conflicting_documentation: "Conflicting Documentation",
  suspended: "Suspended",
};

export type Scorecard = {
  checks: Record<ScorecardCheck, boolean>;
  passed: number;
  total: number;
  overall: OverallVerification;
  canPublishInstructions: boolean;
  blockingReasons: string[];
  documentCompleteness: "complete" | "partial" | "incomplete";
  countryMismatch: boolean;
};

const hasCurrent = (docs: ProductDocument[], type: DocumentType, country?: string) =>
  docs.some(
    (d) => d.documentType === type && d.state === "current_and_verified" &&
      (!country || !d.country || d.country === country),
  );

export function evaluateScorecard(
  product: Product,
  version: ProductVersion,
  docs: ProductDocument[],
  company: Company | undefined,
  conflicts: Conflict[] = [],
): Scorecard {
  const country = version.country && version.country !== "unspecified" ? version.country : undefined;

  const countryMismatch =
    version.countries.some((c) => c.countryMismatch) ||
    docs.some(
      (d) => (d.documentType === "sds" || d.documentType === "product_label") &&
        !!country && !!d.country && d.country !== country,
    );

  const checks: Record<ScorecardCheck, boolean> = {
    company_identity_verified: !!company &&
      ["identity_verified", "manufacturer_verified", "distributor_verified"].includes(company.verification),
    product_identity_verified: !product.provisional && !!product.canonicalName,
    current_label_available: hasCurrent(docs, "product_label", country),
    current_sds_available: hasCurrent(docs, "sds", country),
    current_tds_available: hasCurrent(docs, "tds", country),
    manufacturer_instructions_available:
      hasCurrent(docs, "manufacturer_instruction", country) ||
      version.instructions.some((i) => i.origin === "manufacturer_documented" && i.approvalStatus === "approved"),
    country_applicability_confirmed:
      !!country && version.countries.some((c) => c.country === country && c.marketStatus !== "unconfirmed") && !countryMismatch,
    textile_restrictions_confirmed: TEXTILE_KEYS.every((k) => version.textile.some((t) => t.targetKey === k)),
    colour_restrictions_confirmed: COLOUR_TARGET_KEYS.every((k) => version.textile.some((t) => t.targetKey === k)),
    process_compatibility_confirmed: version.processes.length > 0,
    dilution_confirmed: instructionValue(version, "dilution") !== FOLLOW_LABEL,
    contact_time_confirmed: instructionValue(version, "contactTime") !== FOLLOW_LABEL,
    rinsing_confirmed: instructionValue(version, "rinsing") !== FOLLOW_LABEL,
    neutralization_confirmed: instructionValue(version, "neutralization") !== FOLLOW_LABEL,
    ppe_confirmed: version.ppe.some((p) => p.level !== "not_established"),
    ventilation_confirmed: version.ppe.some((p) => p.ppeKey === "ventilation" && p.level !== "not_established"),
    incompatibilities_confirmed: version.incompatibilities.length > 0,
    storage_confirmed: !!version.safety.storage,
    reviewer_approval_complete: version.approvalStatus === "approved" && !!version.reviewer,
  };

  const passed = SCORECARD_CHECKS.filter((c) => checks[c]).length;
  const blocking = conflicts.filter((c) => c.blocksPublication && !c.resolved);

  const blockingReasons: string[] = [];
  if (!checks.current_label_available) blockingReasons.push("No current verified product label.");
  if (!checks.current_sds_available) blockingReasons.push("No current verified Safety Data Sheet.");
  if (!checks.current_tds_available && !checks.manufacturer_instructions_available)
    blockingReasons.push("No current verified TDS or manufacturer instructions.");
  if (!checks.country_applicability_confirmed) blockingReasons.push("Country applicability is not confirmed.");
  if (!checks.textile_restrictions_confirmed) blockingReasons.push("Textile restrictions are not fully recorded.");
  if (!checks.process_compatibility_confirmed) blockingReasons.push("Process restrictions are not recorded.");
  if (!checks.ppe_confirmed || !checks.ventilation_confirmed)
    blockingReasons.push("PPE and ventilation are not recorded.");
  if (!checks.incompatibilities_confirmed) blockingReasons.push("Incompatibilities are not recorded.");
  if (!checks.reviewer_approval_complete) blockingReasons.push("Technical reviewer approval is missing.");
  if (countryMismatch) blockingReasons.push("Country mismatch between documents and product version.");
  blocking.forEach((c) => blockingReasons.push(`Conflicting documentation: ${c.conflictType}.`));

  const documentCompleteness: Scorecard["documentCompleteness"] =
    checks.current_label_available && checks.current_sds_available && checks.current_tds_available
      ? "complete"
      : (checks.current_label_available || checks.current_sds_available || checks.current_tds_available)
        ? "partial"
        : "incomplete";

  let overall: OverallVerification;
  if (product.status === "suspended") overall = "suspended";
  else if (blocking.length) overall = "conflicting_documentation";
  else if (passed === SCORECARD_CHECKS.length) overall = "fully_verified";
  else if (documentCompleteness === "incomplete") {
    overall = checks.product_identity_verified && checks.company_identity_verified
      ? "identity_only"
      : "insufficient_documentation";
  } else overall = "partially_verified";

  return {
    checks, passed, total: SCORECARD_CHECKS.length, overall,
    canPublishInstructions: blockingReasons.length === 0,
    blockingReasons, documentCompleteness, countryMismatch,
  };
}

/** Derived product status used by the library when nothing stronger is set. */
export function derivedStatus(product: Product, card: Scorecard): ProductStatus {
  if (product.status === "discontinued" || product.status === "archived" || product.status === "suspended")
    return product.status;
  if (card.overall === "conflicting_documentation") return "needs_review";
  if (card.documentCompleteness === "incomplete") return "documentation_incomplete";
  if (card.canPublishInstructions) return product.status === "published" ? "published" : "approved";
  return product.status === "draft" ? "draft" : "under_technical_review";
}

/* ------------------------------------------------------------------ */
/* Conflict detection (§21)                                            */
/* ------------------------------------------------------------------ */

export type Conflict = {
  id: string;
  productKey: string;
  versionKey?: string;
  conflictType: string;
  field?: string;
  valueA?: string;
  sourceA?: string;
  valueB?: string;
  sourceB?: string;
  severity: "critical" | "important" | "advisory";
  blocksPublication: boolean;
  resolved: boolean;
};

const CONFLICT_FIELDS: InstructionField[] = [
  "dilution", "contactTime", "temperature", "rinsing", "neutralization",
];

export function detectConflicts(
  product: Product,
  version: ProductVersion,
  docs: ProductDocument[],
): Conflict[] {
  const out: Conflict[] = [];
  const add = (c: Omit<Conflict, "id" | "productKey" | "resolved">) =>
    out.push({ id: `${product.key}-${out.length + 1}`, productKey: product.key, resolved: false, ...c });

  const usable = version.instructions.filter((i) => i.origin !== "rejected");

  // Different values for the same instruction field across sources.
  for (const field of CONFLICT_FIELDS) {
    const values = new Map<string, Instruction>();
    usable.forEach((i) => {
      const val = i[field];
      if (typeof val === "string" && val.trim()) values.set(val.trim(), i);
    });
    if (values.size > 1) {
      const [[va, ia], [vb, ib]] = [...values.entries()];
      add({
        versionKey: version.key,
        conflictType: `different_${field}`,
        field,
        valueA: va, sourceA: `${ia.sourceDescription} (${ia.origin})`,
        valueB: vb, sourceB: `${ib.sourceDescription} (${ib.origin})`,
        severity: "critical", blocksPublication: true,
      });
    }
  }

  // Local practice or distributor instruction contradicting manufacturer documentation.
  const manufacturer = usable.filter((i) => i.origin === "manufacturer_documented");
  const lesser = usable.filter((i) => i.origin === "local_practice" || i.origin === "distributor_documented");
  manufacturer.forEach((m) => {
    lesser.forEach((l) => {
      CONFLICT_FIELDS.forEach((f) => {
        const a = m[f]; const b = l[f];
        if (typeof a === "string" && typeof b === "string" && a.trim() && b.trim() && a.trim() !== b.trim()) {
          add({
            versionKey: version.key,
            conflictType: l.origin === "local_practice"
              ? "local_practice_conflicts_with_manufacturer"
              : "distributor_conflicts_with_manufacturer",
            field: f,
            valueA: a, sourceA: `Manufacturer: ${m.sourceDescription}`,
            valueB: b, sourceB: `${l.origin}: ${l.sourceDescription}`,
            severity: "critical", blocksPublication: true,
          });
        }
      });
    });
  });

  // Spotting chart contradicting a label or TDS.
  const chart = usable.filter((i) => i.documentType === "spotting_chart");
  const higher = usable.filter((i) => i.documentType === "tds" || i.documentType === "product_label");
  chart.forEach((c) => higher.forEach((h) => {
    CONFLICT_FIELDS.forEach((f) => {
      const a = c[f]; const b = h[f];
      if (typeof a === "string" && typeof b === "string" && a.trim() && b.trim() && a.trim() !== b.trim()) {
        add({
          versionKey: version.key,
          conflictType: "spotting_chart_conflicts_with_document",
          field: f,
          valueA: a, sourceA: `Spotting chart: ${c.sourceDescription}`,
          valueB: b, sourceB: `${h.documentType}: ${h.sourceDescription}`,
          severity: "critical", blocksPublication: true,
        });
      }
    });
  }));

  // Conflicting textile / process compatibility statements.
  const seen = new Map<string, TextileCompatibility>();
  version.textile.forEach((t) => {
    const prev = seen.get(t.targetKey);
    if (prev && prev.suitability !== t.suitability) {
      add({
        versionKey: version.key, conflictType: "conflicting_textile_compatibility", field: t.targetKey,
        valueA: prev.suitability, sourceA: prev.source, valueB: t.suitability, sourceB: t.source,
        severity: "critical", blocksPublication: true,
      });
    }
    seen.set(t.targetKey, t);
  });
  const solventProcesses: ProcessKey[] = ["perc_dry_cleaning", "hydrocarbon_dry_cleaning", "silicone_solvent_dry_cleaning"];
  const solventStates = new Set(
    version.processes.filter((p) => solventProcesses.includes(p.processKey)).map((p) => p.permitted),
  );
  if (solventStates.size > 1 && solventStates.has("permitted") && solventStates.has("prohibited")) {
    add({
      versionKey: version.key, conflictType: "conflicting_dry_cleaning_solvent_compatibility",
      severity: "important", blocksPublication: true,
    });
  }

  // Different PPE requirements for the same PPE kind.
  const ppeSeen = new Map<string, string>();
  version.ppe.forEach((p) => {
    const prev = ppeSeen.get(p.ppeKey);
    if (prev && prev !== p.level) {
      add({
        versionKey: version.key, conflictType: "different_ppe_requirements", field: p.ppeKey,
        valueA: prev, valueB: p.level, severity: "critical", blocksPublication: true,
      });
    }
    ppeSeen.set(p.ppeKey, p.level);
  });

  // Country mismatch on the applicable SDS.
  const country = version.country !== "unspecified" ? version.country : undefined;
  docs.filter((d) => d.documentType === "sds").forEach((d) => {
    if (country && d.country && d.country !== country) {
      add({
        versionKey: version.key, conflictType: "country_mismatch", field: "sds",
        valueA: d.country, sourceA: d.title, valueB: country, sourceB: "Product version country",
        severity: "critical", blocksPublication: true,
      });
    }
  });

  // Outdated / superseded documents.
  docs.forEach((d) => {
    if (d.state === "superseded" || d.state === "expired_review") {
      add({
        versionKey: version.key, conflictType: "outdated_document", field: d.documentType,
        valueA: d.title, sourceA: d.state, severity: "important", blocksPublication: true,
      });
    }
  });

  return out;
}

/** Same product code used by two different product names, or one name with two formulations. */
export function detectIdentityConflicts(products: Product[]): Conflict[] {
  const out: Conflict[] = [];
  const byCode = new Map<string, Product[]>();
  products.forEach((p) => {
    if (!p.productCode) return;
    byCode.set(p.productCode, [...(byCode.get(p.productCode) ?? []), p]);
  });
  byCode.forEach((list, code) => {
    const names = new Set(list.map((p) => p.canonicalName));
    if (names.size > 1) {
      out.push({
        id: `code-${code}`, productKey: list[0].key, conflictType: "different_names_same_code",
        field: "product_code", valueA: [...names][0], valueB: [...names][1],
        severity: "important", blocksPublication: true, resolved: false,
      });
    }
  });
  products.forEach((p) => {
    const formulations = new Set(p.versions.map((v) => v.formulationIdentifier).filter(Boolean));
    if (formulations.size > 1) {
      out.push({
        id: `form-${p.key}`, productKey: p.key, conflictType: "same_name_different_formulations",
        valueA: [...formulations].join(" / "), severity: "advisory",
        blocksPublication: false, resolved: false,
      });
    }
  });
  return out;
}

/** Document supersession always triggers Needs Review (§39). */
export function supersedeDocument(
  docs: ProductDocument[], documentKey: string, replacementKey: string,
): { documents: ProductDocument[]; triggersReview: true } {
  return {
    documents: docs.map((d) =>
      d.key === documentKey ? { ...d, state: "superseded" as const, supersededByKey: replacementKey } : d,
    ),
    triggersReview: true,
  };
}

/* ------------------------------------------------------------------ */
/* Immutable versioning (§7, §28)                                      */
/* ------------------------------------------------------------------ */

export function addVersion(
  product: Product,
  patch: Partial<ProductVersion> & { country: string; changeSummary: string },
): Product {
  const previous = currentVersion(product);
  const nextNumber = product.versions.length + 1;
  const versionRef = `v${nextNumber}`;
  const key = `${product.key}__${versionRef}__${patch.country}`;
  const created: ProductVersion = {
    ...previous,
    ...patch,
    uuid: `pv-${key}`,
    key,
    versionRef,
    productKey: product.key,
    supersededByKey: undefined,
    knownFormulationChange: patch.knownFormulationChange ?? true,
    verification: "unverified",
    approvalStatus: "draft",
    reviewer: undefined,
    immutable: true,
  };
  // The previous version object is never mutated in place; a copy records the end.
  const versions = product.versions.map((v) =>
    v.key === previous.key
      ? { ...v, endDate: patch.effectiveDate, supersededByKey: key, approvalStatus: "superseded" as const }
      : v,
  );
  return {
    ...product,
    versions: [...versions, created],
    currentVersionKey: key,
    status: "under_technical_review",
    updated: new Date().toISOString().slice(0, 10),
  };
}

/** Discontinuing keeps the product and all its versions reachable for history. */
export function discontinue(product: Product, date: string, replacementKey?: string): Product {
  return { ...product, status: "discontinued", discontinuedDate: date, replacementProductKey: replacementKey };
}

/** A replacement product never inherits the discontinued product's approval (§28). */
export function linkReplacement(discontinued: Product, replacement: Product): { discontinued: Product; replacement: Product } {
  return {
    discontinued: { ...discontinued, replacementProductKey: replacement.key },
    replacement: {
      ...replacement,
      status: replacement.status === "published" || replacement.status === "approved"
        ? replacement.status
        : "draft",
      verifications: [],
      provisional: true,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Cost (§23)                                                          */
/* ------------------------------------------------------------------ */

export function costPerTreatment(cost?: CostInputs): { value: number | null; message: string } {
  if (!cost || !cost.doseVerified || !cost.verifiedDose || !cost.purchasePrice || !cost.packSize) {
    return { value: null, message: COST_UNAVAILABLE };
  }
  const usable = cost.usableQuantity ?? cost.packSize - (cost.estimatedWaste ?? 0);
  if (usable <= 0) return { value: null, message: COST_UNAVAILABLE };
  const perUnit = (cost.purchasePrice + (cost.shippingAllocation ?? 0)) / usable;
  const value = Number((perUnit * cost.verifiedDose).toFixed(4));
  return { value, message: `${cost.currency ?? ""} ${value}`.trim() };
}

/* ------------------------------------------------------------------ */
/* Extraction gating (§20)                                             */
/* ------------------------------------------------------------------ */

export const isSafetyCritical = (field: ExtractionField) => SAFETY_CRITICAL_FIELDS.includes(field);

export function canPublishExtraction(e: Extraction): boolean {
  if (!e.userConfirmed) return false;
  if (isSafetyCritical(e.field)) return e.reviewerApproved;
  return true;
}

/* ------------------------------------------------------------------ */
/* Role-aware views (§33, §34)                                         */
/* ------------------------------------------------------------------ */

export type ProductAudience = "public" | "domestic_user" | "professional" | "technical_reviewer";

export type PublicProductView = {
  name: string;
  company: string;
  exists: true;
  professionalOnly: string;
  intendedCategory: string;
  verificationStatus: string;
};

export function publicProductView(p: Product, company: Company | undefined, card: Scorecard): PublicProductView {
  return {
    name: p.displayName,
    company: company?.displayName ?? "Unknown",
    exists: true,
    professionalOnly: "This product is intended for trained professionals only.",
    intendedCategory: p.intendedProfessionalUse ? "General professional spotting" : INSUFFICIENT_INFO,
    verificationStatus: OVERALL_LABEL[card.overall],
  };
}

export type ProfessionalAccess = {
  allowed: boolean;
  reasons: string[];
  showInstructions: boolean;
  showCost: boolean;
  showInternalNotes: boolean;
};

/** A professional role can never bypass missing documentation (§34). */
export function professionalAccess(
  audience: ProductAudience,
  product: Product,
  version: ProductVersion,
  card: Scorecard,
  ctx: { country?: string; organizationApprovedProductKeys?: string[]; trainedRoles?: string[] } = {},
): ProfessionalAccess {
  const reasons: string[] = [];
  if (audience === "public" || audience === "domestic_user") {
    return {
      allowed: false, showInstructions: false, showCost: false, showInternalNotes: false,
      reasons: ["Professional procedures, dilutions, neutralisation and hazardous-component handling are not available to domestic users."],
    };
  }
  if (ctx.country && version.country !== "unspecified" && version.country !== ctx.country) {
    reasons.push(`This version applies to ${version.country}, not ${ctx.country}.`);
  }
  if (ctx.organizationApprovedProductKeys && !ctx.organizationApprovedProductKeys.includes(product.key)) {
    reasons.push("This product is not approved for your organization.");
  }
  if (!card.canPublishInstructions) reasons.push(...card.blockingReasons);
  if (version.approvalStatus === "superseded") reasons.push("This product version has been superseded.");

  return {
    allowed: reasons.length === 0,
    reasons,
    showInstructions: reasons.length === 0,
    showCost: audience === "technical_reviewer" || audience === "professional",
    showInternalNotes: audience === "technical_reviewer",
  };
}

/* ------------------------------------------------------------------ */
/* Justification-required changes (§35)                                */
/* ------------------------------------------------------------------ */

export const JUSTIFICATION_REQUIRED = [
  "company", "active_chemistry", "prohibited_fabric", "ppe", "incompatibility",
  "verified_instruction", "fully_verified",
] as const;
export type JustifiedChange = (typeof JUSTIFICATION_REQUIRED)[number];

export const requiresJustification = (change: string): change is JustifiedChange =>
  (JUSTIFICATION_REQUIRED as readonly string[]).includes(change);

/* ------------------------------------------------------------------ */
/* Search & filters (§31)                                              */
/* ------------------------------------------------------------------ */

export type LibraryFilters = {
  query?: string;
  companyKey?: string;
  kitKey?: string;
  country?: string;
  verification?: OverallVerification;
  documentCompleteness?: Scorecard["documentCompleteness"];
  activeOnly?: boolean;
  productType?: string;
  safetyWarningOnly?: boolean;
  needsReviewOnly?: boolean;
};

export function filterProducts(
  products: Product[],
  filters: LibraryFilters,
  cardFor: (p: Product) => Scorecard,
): Product[] {
  const q = filters.query?.trim().toLowerCase();
  return products.filter((p) => {
    const card = cardFor(p);
    if (q) {
      const hay = [p.canonicalName, p.displayName, p.productId, p.productCode, p.brand,
        ...p.alternativeNames, ...p.previousNames].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.companyKey && p.companyKey !== filters.companyKey) return false;
    if (filters.kitKey && !kitsForProduct(p.key).some((k) => k.key === filters.kitKey)) return false;
    if (filters.country) {
      const v = currentVersion(p);
      const inCountry = v.country === filters.country || v.countries.some((c) => c.country === filters.country);
      if (!inCountry) return false;
    }
    if (filters.verification && card.overall !== filters.verification) return false;
    if (filters.documentCompleteness && card.documentCompleteness !== filters.documentCompleteness) return false;
    if (filters.activeOnly && (p.status === "discontinued" || p.status === "archived")) return false;
    if (filters.productType && p.productType !== filters.productType) return false;
    if (filters.safetyWarningOnly && !currentVersion(p).safety.hazardStatements.length &&
      !currentVersion(p).incompatibilities.length) return false;
    if (filters.needsReviewOnly && !(p.reviewFlags.length || card.overall === "conflicting_documentation" ||
      p.status === "needs_review")) return false;
    return true;
  });
}

/** Card summary — never carries actionable instructions (§31). */
export function productCard(p: Product, company: Company | undefined, card: Scorecard) {
  const v = currentVersion(p);
  const pack = v.packs[0];
  return {
    productId: p.productId,
    name: p.displayName,
    company: company?.displayName ?? "Unknown",
    kits: kitsForProduct(p.key).map((k) => k.kitDisplayName),
    productCode: p.productCode ?? NOT_DISCLOSED,
    country: v.country === "unspecified" ? INSUFFICIENT_INFO : v.country,
    packSize: pack?.packSize
      ? `${pack.packSize} ${pack.measurementUnit ?? ""}${pack.claimedOnly ? " (claimed)" : ""}`.trim()
      : INSUFFICIENT_INFO,
    intendedUse: p.intendedProfessionalUse ?? INSUFFICIENT_INFO,
    verification: OVERALL_LABEL[card.overall],
    documentCompleteness: card.documentCompleteness,
    mainSafetyWarning: v.safety.hazardStatements[0] ??
      "Professional use only. Safety data is not verified for this product.",
    lastReviewed: v.reviewer ? v.effectiveDate ?? "—" : "Not reviewed",
  };
}

/* ------------------------------------------------------------------ */
/* Export (§35)                                                        */
/* ------------------------------------------------------------------ */

export function exportProductsCsv(
  products: Product[], companies: Company[], cardFor: (p: Product) => Scorecard,
): string {
  const head = [
    "Product ID", "Product", "Company ID", "Company", "Kits", "Product code", "Country",
    "Version", "Formulation", "Status", "Verification", "Document completeness",
    "Chemistry", "Dilution", "Contact time", "PPE", "Incompatibilities", "Provisional",
  ];
  const esc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const rows = products.map((p) => {
    const v = currentVersion(p);
    const c = companies.find((x) => x.key === p.companyKey);
    const card = cardFor(p);
    return [
      p.productId, p.displayName, c?.companyId ?? "", c?.displayName ?? "",
      kitsForProduct(p.key).map((k) => k.kitId).join(" | "),
      p.productCode ?? "", v.country, v.versionRef, v.formulationIdentifier ?? "",
      p.status, OVERALL_LABEL[card.overall], card.documentCompleteness,
      chemistryDisplay(v.chemistry).chemicalFamily,
      instructionValue(v, "dilution"), instructionValue(v, "contactTime"),
      v.ppe.length ? v.ppe.map((x) => `${x.ppeKey}:${x.level}`).join(" | ") : "not established",
      v.incompatibilities.length ? v.incompatibilities.map((x) => x.incompatibleWith).join(" | ") : "not recorded",
      p.provisional ? "yes" : "no",
    ].map(esc).join(",");
  });
  return [head.map(esc).join(","), ...rows].join("\n");
}
