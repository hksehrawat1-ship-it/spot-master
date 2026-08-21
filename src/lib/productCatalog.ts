/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CANONICAL PRODUCT DOMAIN — database access layer.
 *
 * Company → Kit → Product → Product version → Source documents → Safety / instructions
 * → Approved product-to-stain guidance.
 *
 * Nothing in this file hardcodes a manufacturer name. Adding a new company, kit or
 * product is database content only. Legacy tables (manufacturer_products,
 * product_mappings, product_stain_mappings, product_stage_mappings, stains) are never
 * queried here — see the `legacy_table_replacements` view.
 */

import { supabase } from "@/integrations/supabase/client";

export const CANONICAL_PRODUCT_TABLES = [
  "companies",
  "product_kits",
  "professional_products",
  "kit_products",
  "product_versions",
  "source_documents",
  "product_source_documents",
  "product_manufacturer_claims",
  "product_safety_data",
  "product_instructions",
  "product_guidance_mappings",
  "product_audit_log",
] as const;

export const LEGACY_PRODUCT_TABLES = [
  "manufacturer_products",
  "product_stain_mappings",
  "product_mappings",
  "product_stage_mappings",
  "stains",
] as const;

export const APPROVED_STATES = ["approved", "published"] as const;

/** Honest states — never converted into a guessed value. */
export const UNKNOWN_STATES = {
  notDisclosed: "Not disclosed",
  notFound: "Not found in supplied source",
  pendingDocument: "Pending document",
  pendingReview: "Pending technical review",
  notApplicable: "Not applicable",
  superseded: "Superseded",
} as const;

export const DOCUMENT_ROLES = [
  "manufacturer_label",
  "manufacturer_tds",
  "manufacturer_sds",
  "manufacturer_spotting_chart",
  "distributor_guide",
  "training_guide",
  "internal_gilm_guide",
  "regulatory_source",
  "superseded_document",
] as const;
export type DocumentRole = (typeof DOCUMENT_ROLES)[number];

export const DOCUMENT_ROLE_LABEL: Record<DocumentRole, string> = {
  manufacturer_label: "Manufacturer label",
  manufacturer_tds: "Manufacturer TDS",
  manufacturer_sds: "Manufacturer SDS",
  manufacturer_spotting_chart: "Manufacturer spotting chart",
  distributor_guide: "Distributor guide",
  training_guide: "Training guide",
  internal_gilm_guide: "Internal GILM guide",
  regulatory_source: "Regulatory source",
  superseded_document: "Superseded document",
};

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  under_review: "Under review",
  approved: "Approved",
  published: "Published",
  needs_review: "Needs review",
  suspended: "Suspended",
  archived: "Archived",
  unverified: "Unverified",
  pending_review: "Pending review",
  verified: "Verified",
  insufficient_information: "Insufficient information",
  disputed: "Disputed",
};

export type ProductVersionRow = {
  id: string;
  product_id: string;
  version_ref: string;
  country: string;
  label_version: string | null;
  sds_version: string | null;
  tds_version: string | null;
  approval_status: string;
  verification_status: string;
  immutable: boolean;
  provisional: boolean;
  change_summary: string | null;
  reviewer: string | null;
  notes: string | null;
  created_at: string;
};

export type CatalogProduct = {
  id: string;
  productRef: string;
  name: string;
  productCode: string | null;
  brand: string | null;
  companyId: string;
  companyName: string;
  companyVerification: string;
  kits: { id: string; name: string; ref: string | null; position: number | null; bottleLabel: string | null }[];
  verificationStatus: string;
  status: string;
  provisional: boolean;
  safetyWarnings: string | null;
  ppe: string | null;
  versions: ProductVersionRow[];
  currentVersion: ProductVersionRow | null;
  approved: boolean;
};

const PRODUCT_SELECT = `
  id, product_ref, product_name, display_name, product_code, brand, company_id,
  verification_status, status, provisional, safety_warnings, ppe,
  companies:company_id ( id, company_name, verification_status ),
  kit_products ( kit_id, position, bottle_label, product_kits:kit_id ( id, kit_name, kit_ref ) ),
  product_versions ( id, product_id, version_ref, country, label_version, sds_version, tds_version,
    approval_status, verification_status, immutable, provisional, change_summary, reviewer, notes, created_at )
`;

function pickCurrent(versions: ProductVersionRow[]): ProductVersionRow | null {
  if (!versions.length) return null;
  const approved = versions.filter((v) => (APPROVED_STATES as readonly string[]).includes(v.approval_status));
  const pool = approved.length ? approved : versions;
  return [...pool].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] ?? null;
}

export function mapProduct(row: any): CatalogProduct {
  const versions: ProductVersionRow[] = (row.product_versions ?? []) as ProductVersionRow[];
  const current = pickCurrent(versions);
  return {
    id: row.id,
    productRef: row.product_ref ?? row.id,
    name: row.display_name || row.product_name,
    productCode: row.product_code ?? null,
    brand: row.brand ?? null,
    companyId: row.company_id,
    companyName: row.companies?.company_name ?? "Company record not readable",
    companyVerification: row.companies?.verification_status ?? "unverified",
    kits: (row.kit_products ?? []).map((k: any) => ({
      id: k.product_kits?.id ?? k.kit_id,
      name: k.product_kits?.kit_name ?? "Kit not readable",
      ref: k.product_kits?.kit_ref ?? null,
      position: k.position ?? null,
      bottleLabel: k.bottle_label ?? null,
    })),
    verificationStatus: row.verification_status,
    status: row.status,
    provisional: !!row.provisional,
    safetyWarnings: row.safety_warnings ?? null,
    ppe: row.ppe ?? null,
    versions,
    currentVersion: current,
    approved:
      (APPROVED_STATES as readonly string[]).includes(row.status) &&
      row.verification_status === "verified" &&
      !!current &&
      (APPROVED_STATES as readonly string[]).includes(current.approval_status),
  };
}

export async function fetchProducts(): Promise<CatalogProduct[]> {
  const { data, error } = await supabase
    .from("professional_products")
    .select(PRODUCT_SELECT)
    .order("product_name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function fetchProductByRef(productRef: string): Promise<CatalogProduct | null> {
  const { data, error } = await supabase
    .from("professional_products")
    .select(PRODUCT_SELECT)
    .eq("product_ref", productRef)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

export async function fetchCompanies() {
  const { data, error } = await supabase
    .from("companies")
    .select("id, company_name, company_ref, verification_status, status, is_manufacturer, is_distributor, country")
    .order("company_name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchKits() {
  const { data, error } = await supabase
    .from("product_kits")
    .select("id, kit_name, kit_ref, company_id, source_status, status, product_count_claimed, product_count_verified")
    .order("kit_name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchSourceDocuments() {
  const { data, error } = await supabase
    .from("source_documents")
    .select("id, document_ref, document_title, document_type, issuer, company_id, kit_id, verification_status")
    .order("document_title");
  if (error) throw error;
  return data ?? [];
}

export async function fetchProductEvidence(productId: string) {
  const { data, error } = await supabase
    .from("product_source_documents")
    .select(
      "id, product_version_id, document_role, claim_scope, source_section, page_reference, verification_status, notes, source_documents:source_document_id ( id, document_title, document_ref, issuer )",
    )
    .eq("product_id", productId);
  if (error) throw error;
  return data ?? [];
}

/** Every safety-relevant change is recorded with reason, previous and new value. */
export async function recordProductAudit(entry: {
  entityTable: string;
  entityId?: string | null;
  productId?: string | null;
  action: string;
  fieldKey?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  reason: string;
  sourceDocumentId?: string | null;
  safetyCritical?: boolean;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const actor = userData?.user?.id ?? null;
  const { error } = await supabase.from("product_audit_log").insert({
    entity_table: entry.entityTable,
    entity_id: entry.entityId ?? null,
    product_id: entry.productId ?? null,
    action: entry.action,
    field_key: entry.fieldKey ?? null,
    previous_value: entry.previousValue ?? null,
    new_value: entry.newValue ?? null,
    reason: entry.reason,
    justification_required: true,
    source_document_id: entry.sourceDocumentId ?? null,
    changed_by: actor,
    reviewer: actor,
    safety_critical: entry.safetyCritical ?? false,
  });
  return { ok: !error, error: error?.message };
}

export async function readinessForVersion(versionId: string): Promise<{ ready: boolean; blockers: string[] }> {
  const { data, error } = await supabase.rpc("product_version_publication_readiness", { _version_id: versionId });
  if (error) return { ready: false, blockers: [error.message] };
  const payload = (data ?? {}) as { ready?: boolean; blockers?: string[] };
  return { ready: !!payload.ready, blockers: payload.blockers ?? [] };
}

export async function approveVersion(versionId: string, target: "approved" | "published", reason: string, sourceDocumentId?: string) {
  const { data, error } = await supabase.rpc("approve_product_version", {
    _version_id: versionId,
    _target_status: target,
    _reason: reason,
    _source_document_id: sourceDocumentId ?? null,
  });
  if (error) return { ok: false, blockers: [error.message] };
  const payload = (data ?? {}) as { ok?: boolean; blockers?: string[] };
  return { ok: !!payload.ok, blockers: payload.blockers ?? [] };
}
