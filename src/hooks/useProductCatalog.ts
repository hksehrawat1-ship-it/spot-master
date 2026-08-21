/**
 * React Query bindings for the canonical product domain.
 * No local storage, no static seed data, no legacy tables.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCompanies,
  fetchKits,
  fetchProductByRef,
  fetchProductEvidence,
  fetchProducts,
  fetchSourceDocuments,
  recordProductAudit,
} from "@/lib/productCatalog";

export const productKeys = {
  all: ["catalog", "products"] as const,
  one: (ref: string) => ["catalog", "product", ref] as const,
  companies: ["catalog", "companies"] as const,
  kits: ["catalog", "kits"] as const,
  documents: ["catalog", "documents"] as const,
  evidence: (id: string) => ["catalog", "evidence", id] as const,
};

export function useCatalogProducts() {
  return useQuery({ queryKey: productKeys.all, queryFn: fetchProducts, staleTime: 30_000 });
}

export function useCatalogProduct(productRef: string | undefined) {
  return useQuery({
    queryKey: productKeys.one(productRef ?? ""),
    queryFn: () => fetchProductByRef(productRef!),
    enabled: !!productRef,
  });
}

export function useCatalogCompanies() {
  return useQuery({ queryKey: productKeys.companies, queryFn: fetchCompanies, staleTime: 60_000 });
}

export function useCatalogKits() {
  return useQuery({ queryKey: productKeys.kits, queryFn: fetchKits, staleTime: 60_000 });
}

export function useSourceDocuments() {
  return useQuery({ queryKey: productKeys.documents, queryFn: fetchSourceDocuments, staleTime: 60_000 });
}

export function useProductEvidence(productId: string | undefined) {
  return useQuery({
    queryKey: productKeys.evidence(productId ?? ""),
    queryFn: () => fetchProductEvidence(productId!),
    enabled: !!productId,
  });
}

export function useInvalidateCatalog() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["catalog"] });
  };
}

export function useAuditedMutation<TArgs>(fn: (args: TArgs) => Promise<{ ok: boolean; error?: string }>) {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => invalidate(),
  });
}

export { recordProductAudit };
