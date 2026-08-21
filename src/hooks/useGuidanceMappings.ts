/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Canonical product-to-stain guidance mappings.
 * Reads and writes `product_guidance_mappings` only. Legacy mapping tables are never touched.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { recordProductAudit } from "@/lib/productCatalog";

export type GuidanceMapping = {
  id: string;
  mapping_ref: string;
  product_id: string;
  product_version_id: string;
  stain_record_id: string;
  treatment_stage_number: number | null;
  decision: string;
  suitability: string;
  risk_level: string;
  user_capability: string;
  country: string;
  language: string;
  restriction: string | null;
  mandatory_hidden_test: boolean;
  mandatory_stop_conditions: string[];
  required_rinse: string | null;
  required_neutralisation: string | null;
  evidence_level: string;
  evidence_note: string | null;
  source_document_id: string | null;
  source_section: string | null;
  approval_status: string;
  verification_status: string;
  provisional: boolean;
  review_note: string | null;
  created_at: string;
  stain_records?: { id: string; stable_id: string; canonical_name: string; reroute_pending: boolean } | null;
  professional_products?: { id: string; product_ref: string | null; product_name: string; display_name: string | null } | null;
  product_versions?: { id: string; version_ref: string; approval_status: string } | null;
};

export const MAPPING_DECISIONS = [
  "not_assessed",
  "recommended",
  "recommended_after_testing",
  "professional_only",
  "not_recommended",
] as const;

export const EVIDENCE_LEVELS = [
  "none",
  "manufacturer_claim",
  "label_documented",
  "sds_tds_documented",
  "independent_trial",
  "textile_standard",
] as const;

const SELECT = `
  id, mapping_ref, product_id, product_version_id, stain_record_id, treatment_stage_number,
  decision, suitability, risk_level, user_capability, country, language, restriction,
  mandatory_hidden_test, mandatory_stop_conditions, required_rinse, required_neutralisation,
  evidence_level, evidence_note, source_document_id, source_section, approval_status,
  verification_status, provisional, review_note, created_at,
  stain_records:stain_record_id ( id, stable_id, canonical_name, reroute_pending ),
  professional_products:product_id ( id, product_ref, product_name, display_name ),
  product_versions:product_version_id ( id, version_ref, approval_status )
`;

export function useGuidanceMappings(opts: { includeDrafts: boolean }) {
  return useQuery({
    queryKey: ["guidance-mappings", opts.includeDrafts],
    queryFn: async () => {
      let q = supabase.from("product_guidance_mappings").select(SELECT).order("created_at", { ascending: false });
      if (!opts.includeDrafts) q = q.in("approval_status", ["approved", "published"]);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as GuidanceMapping[];
    },
  });
}

export type NewMappingInput = {
  productId: string;
  productVersionId: string;
  stainRecordId: string;
  stainStableId: string;
  decision: string;
  country: string;
  evidenceLevel: string;
  sourceDocumentId: string;
  sourceSection: string;
  reviewNote: string;
  stopConditions: string[];
  approvalStatus: "draft" | "under_review";
};

/** Every required field must be present — the database also refuses partial mappings. */
export function validateMappingInput(input: Partial<NewMappingInput>): string[] {
  const missing: string[] = [];
  if (!input.productId) missing.push("Product");
  if (!input.productVersionId) missing.push("Product version");
  if (!input.stainRecordId) missing.push("Exact stain record (stable ID)");
  if (!input.decision || input.decision === "not_assessed") missing.push("Decision");
  if (!input.country) missing.push("Country");
  if (!input.evidenceLevel || input.evidenceLevel === "none") missing.push("Evidence level");
  if (!input.sourceDocumentId) missing.push("Source document");
  if (!input.sourceSection?.trim()) missing.push("Source section");
  if (!input.reviewNote?.trim()) missing.push("Review note");
  if (!input.stopConditions?.length) missing.push("Stop conditions");
  return missing;
}

export function useCreateGuidanceMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewMappingInput) => {
      const missing = validateMappingInput(input);
      if (missing.length) return { ok: false as const, message: `Missing: ${missing.join(", ")}` };
      const { data: userData } = await supabase.auth.getUser();
      const ref = `PGM-${input.stainStableId}-${Date.now().toString(36).toUpperCase()}`;
      const { data, error } = await supabase
        .from("product_guidance_mappings")
        .insert({
          mapping_ref: ref,
          product_id: input.productId,
          product_version_id: input.productVersionId,
          stain_record_id: input.stainRecordId,
          decision: input.decision,
          country: input.country,
          evidence_level: input.evidenceLevel as any,
          source_document_id: input.sourceDocumentId,
          source_section: input.sourceSection,
          review_note: input.reviewNote,
          mandatory_stop_conditions: input.stopConditions,
          approval_status: input.approvalStatus,
          created_by: userData?.user?.id ?? null,
        })
        .select("id")
        .single();
      if (error) return { ok: false as const, message: error.message };
      await recordProductAudit({
        entityTable: "product_guidance_mappings",
        entityId: data.id,
        productId: input.productId,
        action: "create_mapping",
        fieldKey: "mapping_ref",
        previousValue: null,
        newValue: ref,
        reason: input.reviewNote,
        sourceDocumentId: input.sourceDocumentId,
        safetyCritical: true,
      });
      return { ok: true as const, message: `Draft mapping ${ref} created.`, id: data.id };
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["guidance-mappings"] }),
  });
}

export function useApproveGuidanceMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; target: "approved" | "published"; reason: string }) => {
      const { data, error } = await supabase.rpc("approve_guidance_mapping", {
        _mapping_id: args.id,
        _target_status: args.target,
        _reason: args.reason,
      });
      if (error) return { ok: false as const, blockers: [error.message] };
      const payload = (data ?? {}) as { ok?: boolean; blockers?: string[] };
      return { ok: !!payload.ok, blockers: payload.blockers ?? [] };
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["guidance-mappings"] }),
  });
}

/** Stain selector data — always by record id + stable id, never by name alone. */
export function useStainSearch(query: string) {
  return useQuery({
    queryKey: ["mapping-stain-search", query],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_stains", { q: query, lim: 25, off: 0 });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: query.trim().length >= 2,
  });
}
