/**
 * Loads spotting-kit companies, kits and products from the database.
 * Companies are DATA (Constitution R20) — never code branches. Adding a new
 * company, kit or product requires no application change.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { classifyFromDatabase, type Classified } from "@/lib/dataSource";
import type { ProductInstruction } from "@/lib/retailEngine";

export type KitCompany = { id: string; name: string; verification: string | null };
export type KitRecord = { id: string; companyId: string; name: string };
export type KitProduct = {
  id: string;
  name: string;
  companyId: string | null;
  kitId: string | null;
  record: Classified<ProductInstruction>;
};

export function useKitCompanies() {
  return useQuery({
    queryKey: ["retail", "companies"],
    queryFn: async (): Promise<KitCompany[]> => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, company_name, display_name, verification_status, status")
        .order("company_name");
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        name: row.display_name || row.company_name,
        verification: row.verification_status,
      }));
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useCompanyProducts(companyId: string | null) {
  return useQuery({
    queryKey: ["retail", "products", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<KitProduct[]> => {
      const { data, error } = await supabase
        .from("professional_products")
        .select(
          "id, product_name, display_name, company_id, kit_id, application_method, status, verification_status, label_version",
        )
        .eq("company_id", companyId!);
      if (error) throw error;
      return (data ?? []).map((row) => {
        const name = (row.display_name as string) || row.product_name;
        // Approved instruction text only. Nothing is generated or inferred here.
        const steps =
          typeof row.application_method === "string" && row.application_method.trim()
            ? row.application_method
                .split(/\r?\n|(?<=\.)\s+(?=[A-Z0-9])/)
                .map((s) => s.trim())
                .filter(Boolean)
            : [];
        return {
          id: row.id,
          name,
          companyId: row.company_id,
          kitId: row.kit_id,
          record: classifyFromDatabase<ProductInstruction>(
            { productId: row.id, productName: name, steps },
            row as unknown as Record<string, unknown>,
          ),
        };
      });
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Verified basic/domestic methods. Only approved or published records with
 * evidence confidence of at least 9/10 are ever returned (Constitution R7).
 */
export function useVerifiedBasicMethods(stainName?: string) {
  return useQuery({
    queryKey: ["retail", "basic-methods", stainName ?? "any"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domestic_treatments")
        .select("id, title, method, confidence_score, approval_status")
        .in("approval_status", ["approved", "published"])
        .gte("confidence_score", 9);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        methodId: row.id,
        title: (row.title as string) ?? "Approved basic method",
        steps: Array.isArray(row.method) ? (row.method as string[]) : [],
        confidence: Number(row.confidence_score ?? 0),
        status: String(row.approval_status ?? ""),
      }));
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
