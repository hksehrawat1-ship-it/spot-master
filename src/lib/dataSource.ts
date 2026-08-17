/**
 * Data-source layer (Constitution R22).
 *
 * Every record surfaced by the interface must be classified. The interface may never
 * silently treat hardcoded demonstration records as approved production content.
 */

export type DataClassification =
  /** Verified content held in the database and approved/published. */
  | "production"
  /** Hardcoded illustrative content shipped with the prototype. */
  | "demonstration"
  /** Extracted or drafted but not technically verified. */
  | "provisional"
  /** Structural scaffolding (labels, taxonomies, stage names) — never treatment chemistry. */
  | "interface_fallback";

export const CLASSIFICATION_LABEL: Record<DataClassification, string> = {
  production: "Approved content",
  demonstration: "Demonstration data",
  provisional: "Under technical review",
  interface_fallback: "Reference structure only",
};

export type Classified<T> = {
  data: T;
  classification: DataClassification;
  /** Where the record came from. */
  origin: "database" | "bundled";
  source?: string;
  version?: string;
  reviewer?: string;
  reviewDate?: string;
  approvalStatus?: string;
};

export function classify<T>(
  data: T,
  classification: DataClassification,
  meta: Partial<Omit<Classified<T>, "data" | "classification">> = {},
): Classified<T> {
  return { data, classification, origin: meta.origin ?? "bundled", ...meta };
}

/** Bundled records are never production, whatever their own fields claim. */
export function classifyBundled<T>(data: T, classification: Exclude<DataClassification, "production"> = "demonstration") {
  return classify(data, classification, { origin: "bundled" });
}

/** Only database-backed, approved/published records count as production. */
export function classifyFromDatabase<T>(
  data: T,
  row: { approval_status?: string | null; status?: string | null } & Record<string, unknown>,
): Classified<T> {
  const status = String(row.approval_status ?? row.status ?? "").toLowerCase();
  const approved = status === "approved" || status === "published";
  return classify(data, approved ? "production" : "provisional", {
    origin: "database",
    approvalStatus: status || undefined,
    source: (row.source_reference as string) ?? (row.source as string) ?? undefined,
    version: (row.version as string) ?? undefined,
    reviewer: (row.technical_reviewer as string) ?? (row.reviewer as string) ?? undefined,
    reviewDate: (row.review_date as string) ?? undefined,
  });
}

/** May this record be shown as actionable guidance? Fails closed (R23). */
export function isDisplayableAsGuidance(record: Classified<unknown>): boolean {
  return record.classification === "production";
}

/** Anything not production must carry a visible marker in the interface. */
export function needsMarker(record: Classified<unknown>): boolean {
  return record.classification !== "production";
}
