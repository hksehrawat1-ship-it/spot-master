/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * LAYER 2 — verified product loaders.
 *
 * Every technical value shown in Professional mode comes from these approved
 * database records. Nothing is generated, inferred or copied across companies.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { classifyFromDatabase, type Classified } from "@/lib/dataSource";
import type { ProductTransition, VerifiedProduct } from "@/lib/professionalEngine";

const toArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String).filter(Boolean) : typeof v === "string" && v.trim() ? [v.trim()] : [];

const toNumbers = (v: unknown): number[] =>
  Array.isArray(v) ? v.map((n) => Number(n)).filter((n) => Number.isFinite(n)) : [];

export function useVerifiedProducts(companyId: string | null) {
  return useQuery({
    queryKey: ["professional", "products", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<Classified<VerifiedProduct>[]> => {
      const { data, error } = await supabase
        .from("professional_products")
        .select(
          "id, product_ref, product_name, display_name, company_id, chemical_family, intended_professional_use, " +
            "intended_stain_categories, prohibited_materials, application_method, dilution_instruction, " +
            "temperature_limits, contact_time, rinsing_instruction, neutralization_instruction, ppe, " +
            "incompatibilities, safety_warnings, label_version, tds_version, status, verification_status",
        )
        .eq("company_id", companyId!);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Record<string, any>[];

      return rows.map((row) => {
        const name = (row.display_name as string) || (row.product_name as string);
        const product: VerifiedProduct = {
          productId: row.id as string,
          productKey: (row.product_ref as string) ?? row.id,
          productName: name,
          companyId: (row.company_id as string) ?? null,
          companyName: "",
          chemistryFamily: row.chemical_family as string | null,
          verifiedPurpose: row.intended_professional_use as string | null,
          eligibleComponents: toArray(row.intended_stain_categories),
          compatibleStages: toNumbers((row as Record<string, unknown>).compatible_stages),
          prohibitions: [...toArray(row.prohibited_materials), ...toArray(row.safety_warnings)],
          applicationMethod: row.application_method as string | null,
          dilution: row.dilution_instruction as string | null,
          temperature: row.temperature_limits as string | null,
          contactTime: row.contact_time as string | null,
          mechanicalAction: null,
          rinseRequirement: row.rinsing_instruction as string | null,
          neutralisation: row.neutralization_instruction as string | null,
          ppe: toArray(row.ppe),
          incompatibilities: toArray(row.incompatibilities),
          inspectionPoint: null,
          maximumAttempts: null,
          sourceDocument: (row.tds_version as string) ?? (row.label_version as string) ?? null,
          documentVersion: (row.label_version as string) ?? null,
        };
        return classifyFromDatabase<VerifiedProduct>(product, row as Record<string, unknown>);
      });
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/** Stage- and component-level mappings that make a product eligible. */
export function useStageMappings(companyId: string | null) {
  return useQuery({
    queryKey: ["professional", "stage-mappings", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_stage_mappings")
        .select("product_id, stage_number, component_key, decision, approval_status")
        .in("approval_status", ["approved", "published"]);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/** Approved product-to-product transitions. Unlisted transitions are unverified. */
export function useProductTransitions() {
  return useQuery({
    queryKey: ["professional", "transitions"],
    queryFn: async (): Promise<ProductTransition[]> => {
      const { data, error } = await supabase
        .from("product_transitions")
        .select(
          "from_product_key, from_chemistry_family, to_product_key, to_chemistry_family, permission, " +
            "required_rinse, required_neutralization, inspection_required, approval_status",
        )
        .in("approval_status", ["approved", "published"]);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Record<string, any>[];
      return rows.map((r) => ({
        fromProductKey: r.from_product_key,
        fromChemistryFamily: r.from_chemistry_family,
        toProductKey: r.to_product_key,
        toChemistryFamily: r.to_chemistry_family,
        permission: String(r.permission ?? "unverified"),
        requiredRinse: r.required_rinse as string | null,
        requiredNeutralisation: r.required_neutralization as string | null,
        inspectionRequired: r.inspection_required as boolean | null,
        approvalStatus: r.approval_status as string | null,
      }));
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
