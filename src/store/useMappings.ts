/** STEP 8 — product-to-stage mapping governance store. */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SEED_MAPPINGS, SEED_TRANSITIONS } from "@/data/productMappings";
import type {
  ProductStageMapping, ProductTransition, MappingStatus, MappingDecision,
} from "@/data/productMappings";
import {
  allocateMappingId, applyReviewTrigger, changesRequiringJustification, validateMapping,
} from "@/lib/mappingEngine";
import type { ReviewTrigger, EligibilityResult } from "@/lib/mappingEngine";
import type { InspectionField } from "@/data/treatmentStages";

export type MappingAudit = {
  id: string;
  at: string;
  mappingId: string;
  action: string;
  field?: string;
  previousValue?: string;
  newValue?: string;
  justification: string;
  changedBy: string;
  safetyCritical: boolean;
};

export type InspectionRecord = {
  id: string;
  caseId: string;
  mappingId: string;
  at: string;
  findings: InspectionField[];
  photograph?: string;
  operator: string;
  stopped: boolean;
};

/** A historical case pins the exact mapping snapshot it used. */
export type PinnedCaseMapping = {
  caseId: string;
  at: string;
  snapshot: ProductStageMapping;
  eligibility: EligibilityResult;
};

type MappingsState = {
  mappingOverrides: Record<string, Partial<ProductStageMapping>>;
  customMappings: ProductStageMapping[];
  archivedMappings: ProductStageMapping[];
  customTransitions: ProductTransition[];
  inspections: InspectionRecord[];
  pinnedCases: PinnedCaseMapping[];
  audit: MappingAudit[];

  mappings: () => ProductStageMapping[];
  transitions: () => ProductTransition[];

  createMapping: (draft: Partial<ProductStageMapping>, by: string) => ProductStageMapping;
  updateMapping: (
    mappingId: string,
    patch: Partial<ProductStageMapping>,
    opts: { by: string; justification: string },
  ) => { ok: boolean; message: string };
  setStatus: (mappingId: string, status: MappingStatus, opts: { by: string; justification: string }) => { ok: boolean; message: string };
  triggerReview: (trigger: ReviewTrigger, scope: { productKey?: string; productVersionKey?: string; stageNumber?: number }, by: string) => number;
  addTransition: (t: ProductTransition, by: string) => void;
  recordInspection: (rec: Omit<InspectionRecord, "id" | "at">) => InspectionRecord;
  pinCase: (caseId: string, snapshot: ProductStageMapping, eligibility: EligibilityResult) => void;
  log: (e: Omit<MappingAudit, "id" | "at">) => void;
  reset: () => void;
};

const merge = <T extends object>(base: T, over?: Partial<T>): T => (over ? { ...base, ...over } : base);
const now = () => new Date().toISOString();

export const useMappings = create<MappingsState>()(
  persist(
    (set, get) => ({
      mappingOverrides: {},
      customMappings: [],
      archivedMappings: [],
      customTransitions: [],
      inspections: [],
      pinnedCases: [],
      audit: [],

      mappings: () => {
        const { mappingOverrides, customMappings } = get();
        return [
          ...SEED_MAPPINGS.map((m) => merge(m, mappingOverrides[m.mappingId])),
          ...customMappings,
        ];
      },
      transitions: () => [...SEED_TRANSITIONS, ...get().customTransitions],

      log: (e) =>
        set((st) => ({ audit: [{ id: `ma${st.audit.length + 1}`, at: now(), ...e }, ...st.audit].slice(0, 500) })),

      createMapping: (draft, by) => {
        const existing = get().mappings();
        const base = SEED_MAPPINGS[0];
        const mapping: ProductStageMapping = {
          ...base,
          ...draft,
          mappingId: allocateMappingId(existing),
          version: 1,
          status: "draft",
          decision: draft.decision ?? "insufficient_information",
          flags: draft.flags ?? ["Created in the mapping editor. Evidence required before review."],
        };
        set((st) => ({ customMappings: [...st.customMappings, mapping] }));
        get().log({
          mappingId: mapping.mappingId, action: "create", justification: "New mapping draft",
          changedBy: by, safetyCritical: false,
        });
        return mapping;
      },

      updateMapping: (mappingId, patch, { by, justification }) => {
        const before = get().mappings().find((m) => m.mappingId === mappingId);
        if (!before) return { ok: false, message: "Mapping not found." };
        const after = { ...before, ...patch, version: before.version + 1 };
        const needsJustification = changesRequiringJustification(before, after);
        if (needsJustification.length && justification.trim().length < 10) {
          return {
            ok: false,
            message: `A written justification is required for: ${needsJustification.join(", ").replace(/_/g, " ")}.`,
          };
        }
        // Keep the previous version for historical cases.
        set((st) => ({
          archivedMappings: [{ ...before }, ...st.archivedMappings].slice(0, 300),
          mappingOverrides: SEED_MAPPINGS.some((m) => m.mappingId === mappingId)
            ? { ...st.mappingOverrides, [mappingId]: { ...st.mappingOverrides[mappingId], ...patch, version: after.version } }
            : st.mappingOverrides,
          customMappings: st.customMappings.map((m) => (m.mappingId === mappingId ? after : m)),
        }));
        get().log({
          mappingId, action: "update", justification: justification || "Editorial update",
          changedBy: by, safetyCritical: needsJustification.length > 0,
          newValue: Object.keys(patch).join(", "),
        });
        return { ok: true, message: "Mapping updated. The previous version is retained for historical cases." };
      },

      setStatus: (mappingId, status, { by, justification }) => {
        const mapping = get().mappings().find((m) => m.mappingId === mappingId);
        if (!mapping) return { ok: false, message: "Mapping not found." };
        if (status === "published" || status === "approved") {
          const errors = validateMapping({ ...mapping, status }).filter((i) => i.severity === "error");
          if (errors.length) return { ok: false, message: errors[0].message };
        }
        return get().updateMapping(mappingId, { status }, { by, justification: justification || `Status set to ${status}` });
      },

      triggerReview: (trigger, scope, by) => {
        const current = get().mappings();
        const { updated, history, affectedIds } = applyReviewTrigger(current, trigger, scope);
        const overrides: Record<string, Partial<ProductStageMapping>> = { ...get().mappingOverrides };
        for (const m of updated) {
          if (affectedIds.includes(m.mappingId) && SEED_MAPPINGS.some((s) => s.mappingId === m.mappingId)) {
            overrides[m.mappingId] = { ...overrides[m.mappingId], status: m.status, flags: m.flags };
          }
        }
        set((st) => ({
          mappingOverrides: overrides,
          customMappings: st.customMappings.map((m) =>
            affectedIds.includes(m.mappingId)
              ? updated.find((u) => u.mappingId === m.mappingId) ?? m
              : m),
          archivedMappings: [...history, ...st.archivedMappings].slice(0, 300),
        }));
        affectedIds.forEach((id) =>
          get().log({ mappingId: id, action: "review_trigger", justification: trigger, changedBy: by, safetyCritical: true }));
        return affectedIds.length;
      },

      addTransition: (t, by) => {
        set((st) => ({ customTransitions: [...st.customTransitions, t] }));
        get().log({
          mappingId: t.transitionId, action: "transition", justification: t.source,
          changedBy: by, safetyCritical: true,
        });
      },

      recordInspection: (rec) => {
        const record: InspectionRecord = { ...rec, id: `insp${Date.now()}`, at: now() };
        set((st) => ({ inspections: [record, ...st.inspections].slice(0, 300) }));
        return record;
      },

      pinCase: (caseId, snapshot, eligibility) =>
        set((st) => ({
          pinnedCases: [{ caseId, at: now(), snapshot, eligibility }, ...st.pinnedCases].slice(0, 200),
        })),

      reset: () =>
        set({
          mappingOverrides: {}, customMappings: [], archivedMappings: [], customTransitions: [],
          inspections: [], pinnedCases: [], audit: [],
        }),
    }),
    { name: "sm-step8-mappings" },
  ),
);

export const decisionTone = (d: MappingDecision) =>
  d === "recommended" || d === "domestic_use_suitable" ? "positive"
    : d === "not_recommended" ? "negative"
      : "neutral";
