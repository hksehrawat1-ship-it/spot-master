/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * LAYER 3 — authoritative case persistence.
 *
 * Supabase holds the case record, the chronological chemistry ledger and the
 * safety/escalation events. Browser storage is never authoritative (§23).
 */

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LedgerEntry, MasterCase } from "@/lib/masterEngine";

const table = (name: string) => (supabase as any).from(name);

export function caseRow(c: MasterCase) {
  return {
    case_reference: c.caseReference || `MS-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    working_level: "master",
    garment: { ...c.garment, identity: c.garmentIdentity, retail: { fabric: c.fabric, colour: c.colour, careLabel: c.careLabel } },
    fibre: c.fibreAssessment,
    construction: { types: c.constructionTypes },
    dye_colour: c.dyeColour,
    trims_finishes: { trims: c.trims },
    stain_diagnosis: { ...c.diagnosis, professional: c.stain, name: c.stainName },
    evidence: c.evidencePanel,
    selected_kits: c.selectedKits,
    selected_products: c.inventory,
    test_results: { concealed: c.testResult, fabricTests: c.fabricTests },
    photographs: c.photos,
    safety_decisions: c.stopConditions,
    outcome: c.outcome,
    final_disposition: c.finalDisposition || null,
    customer_notes: c.customerNotes || null,
    operator_notes: c.notes || null,
    supervisor_notes: c.supervisorNotes || null,
  };
}

export function ledgerRow(caseId: string, e: LedgerEntry) {
  return {
    case_id: caseId,
    entry_order: e.entryOrder,
    stage_key: e.stageKey ?? null,
    stage_number: e.stageNumber ?? null,
    component_key: e.componentKey ?? null,
    product_id: e.productId ?? null,
    product_name: e.productName,
    manufacturer: e.manufacturer ?? null,
    amount: e.amount ?? null,
    dilution: e.dilution ?? null,
    temperature: e.temperature ?? null,
    contact_time: e.contactTime ?? null,
    mechanical_action: e.mechanicalAction ?? null,
    steam_used: e.steamUsed,
    vacuum_used: e.vacuumUsed,
    spotting_board_used: e.spottingBoardUsed,
    rinse_performed: e.rinsePerformed,
    neutralization_performed: e.neutralizationPerformed,
    drying_or_heat: e.dryingOrHeat ?? null,
    visible_response: e.visibleResponse ?? null,
    colour_movement: e.colourMovement ?? null,
    texture_change: e.textureChange ?? null,
    inspection_result: e.inspectionResult ?? null,
    operator_observation: e.operatorObservation,
    notes: e.notes ?? null,
    performed_at: e.performedAt,
  };
}

/** Save (insert or update) the authoritative case record. */
export function useSaveMasterCase() {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const queryClient = useQueryClient();

  const save = useCallback(
    async (c: MasterCase): Promise<{ caseId: string | null; error: string | null }> => {
      setStatus("saving");
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) {
          setStatus("error");
          return { caseId: null, error: "Sign in to store this case record." };
        }
        const payload = caseRow(c);
        let caseId = c.caseId;

        if (caseId) {
          const { error } = await table("master_cases").update(payload).eq("id", caseId);
          if (error) throw error;
        } else {
          const { data, error } = await table("master_cases").insert(payload).select("id").single();
          if (error) throw error;
          caseId = data.id as string;
        }

        if (caseId && c.ledger.length) {
          const { data: existing } = await table("master_treatment_ledger")
            .select("entry_order")
            .eq("case_id", caseId);
          const stored = new Set((existing ?? []).map((r: any) => r.entry_order));
          const fresh = c.ledger.filter((e) => !stored.has(e.entryOrder)).map((e) => ledgerRow(caseId!, e));
          if (fresh.length) {
            const { error } = await table("master_treatment_ledger").insert(fresh);
            if (error) throw error;
          }
        }

        queryClient.invalidateQueries({ queryKey: ["master", "cases"] });
        setStatus("saved");
        return { caseId, error: null };
      } catch (e: any) {
        setStatus("error");
        return { caseId: null, error: e?.message ?? "The case record could not be saved." };
      }
    },
    [queryClient],
  );

  return { save, status };
}

/** Record a safety decision, transition decision, failure analysis or escalation. */
export function useRecordCaseEvent() {
  return useCallback(
    async (caseId: string | null, kind: string, summary: string, payload: Record<string, unknown> = {}) => {
      if (!caseId) return { error: "Save the case before recording events." };
      const { error } = await table("master_case_events").insert({
        case_id: caseId,
        event_kind: kind,
        status: String(payload.status ?? ""),
        summary,
        payload,
      });
      return { error: error?.message ?? null };
    },
    [],
  );
}

/** The operator's own cases (RLS restricts this to owned/organisation records). */
export function useMasterCases() {
  return useQuery({
    queryKey: ["master", "cases"],
    queryFn: async () => {
      const { data, error } = await table("master_cases")
        .select("id, case_reference, outcome, final_disposition, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
}

/** The chronological chemistry ledger for one case. */
export function useCaseLedger(caseId: string | null) {
  return useQuery({
    queryKey: ["master", "ledger", caseId],
    enabled: !!caseId,
    queryFn: async () => {
      const { data, error } = await table("master_treatment_ledger")
        .select("*")
        .eq("case_id", caseId!)
        .order("entry_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    staleTime: 30 * 1000,
    retry: 1,
  });
}

/** Approved technical references for a product, used by the evidence panel. */
export function useTechnicalReferences(productId: string | null) {
  return useQuery({
    queryKey: ["master", "references", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("source_documents")
        .select(
          "id, document_type, title, document_number, version, revision_date, language, country, extraction_status, " +
            "technical_reviewer, review_date, superseded_by, approval_status",
        )
        .limit(20);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
