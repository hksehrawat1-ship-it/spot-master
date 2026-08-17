/** STEP 9 — safety evaluation history, overrides and rule governance. */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SAFETY_RULES } from "@/data/safetyRules";
import type { SafetyRule } from "@/data/safetyRules";
import { evaluateSafety, validateOverride } from "@/lib/safetyEngine";
import type { SafetyCase, SafetyEvaluation, SafetyOverride } from "@/lib/safetyEngine";

export type RuleAudit = {
  id: string;
  at: string;
  ruleId: string;
  action: "created" | "edited" | "status_changed" | "retired" | "rolled_back";
  field?: string;
  previousValue?: string;
  newValue?: string;
  justification: string;
  changedBy: string;
};

type SafetyState = {
  /** Rule metadata overlay — the deterministic triggers always come from code. */
  ruleOverlay: Record<string, Partial<Pick<SafetyRule,
    "status" | "severity" | "warning" | "requiredAction" | "reviewDate" | "technicalReviewer" | "version">>>;
  evaluations: SafetyEvaluation[];
  overrides: SafetyOverride[];
  audit: RuleAudit[];

  rules: () => SafetyRule[];
  evaluate: (c: SafetyCase, opts?: { persist?: boolean }) => SafetyEvaluation;
  latestForCase: (caseId: string) => SafetyEvaluation | undefined;
  historyForCase: (caseId: string) => SafetyEvaluation[];

  requestOverride: (args: {
    caseId: string; ruleId: string; reason: string; approvedBy: string; expiresAt?: string;
  }) => { ok: boolean; message: string };
  revokeOverride: (overrideId: string) => void;

  updateRule: (
    ruleId: string,
    patch: Partial<Pick<SafetyRule, "status" | "severity" | "warning" | "requiredAction" | "reviewDate" | "technicalReviewer">>,
    justification: string,
    changedBy: string,
  ) => void;
  rollbackRule: (ruleId: string, justification: string, changedBy: string) => void;
  clearHistory: () => void;
};

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const useSafety = create<SafetyState>()(
  persist(
    (set, get) => ({
      ruleOverlay: {},
      evaluations: [],
      overrides: [],
      audit: [],

      rules: () => {
        const overlay = get().ruleOverlay;
        return SAFETY_RULES.map((r) => (overlay[r.ruleId] ? { ...r, ...overlay[r.ruleId] } : r));
      },

      evaluate: (c, opts = { persist: true }) => {
        const result = evaluateSafety(c, { overrides: get().overrides, rules: get().rules() });
        if (opts.persist !== false) {
          set((s) => ({ evaluations: [result, ...s.evaluations].slice(0, 300) }));
        }
        return result;
      },

      latestForCase: (caseId) => get().evaluations.find((e) => e.caseId === caseId),
      historyForCase: (caseId) => get().evaluations.filter((e) => e.caseId === caseId),

      requestOverride: ({ caseId, ruleId, reason, approvedBy, expiresAt }) => {
        const rule = get().rules().find((r) => r.ruleId === ruleId);
        if (!rule) return { ok: false, message: "Rule not found." };
        const check = validateOverride(rule, { reason, approvedBy });
        if (!check.allowed) return { ok: false, message: check.message };
        const override: SafetyOverride = {
          overrideId: uid("ovr"), caseId, ruleId, reason, approvedBy,
          approvedAt: new Date().toISOString(), expiresAt,
        };
        const auditEntry: RuleAudit = {
          id: uid("aud"), at: override.approvedAt, ruleId, action: "status_changed",
          field: "override", newValue: caseId, justification: reason, changedBy: approvedBy,
        };
        set((s) => ({
          overrides: [override, ...s.overrides],
          audit: [auditEntry, ...s.audit].slice(0, 500),
        }));

        return { ok: true, message: check.message };
      },

      revokeOverride: (overrideId) =>
        set((s) => ({ overrides: s.overrides.filter((o) => o.overrideId !== overrideId) })),

      updateRule: (ruleId, patch, justification, changedBy) =>
        set((s) => {
          const base = SAFETY_RULES.find((r) => r.ruleId === ruleId);
          if (!base) return s;
          const current = { ...base, ...(s.ruleOverlay[ruleId] ?? {}) };
          const entries = Object.entries(patch) as [keyof typeof patch, string][];
          const audits: RuleAudit[] = entries.map(([field, value]) => ({
            id: uid("aud"),
            at: new Date().toISOString(),
            ruleId,
            action: "edited",
            field: String(field),
            previousValue: String((current as Record<string, unknown>)[field as string] ?? ""),
            newValue: String(value),
            justification,
            changedBy,
          }));
          return {
            ruleOverlay: {
              ...s.ruleOverlay,
              [ruleId]: { ...s.ruleOverlay[ruleId], ...patch, version: (current.version ?? 1) + 1 },
            },
            audit: [...audits, ...s.audit].slice(0, 500),
          };
        }),

      rollbackRule: (ruleId, justification, changedBy) =>
        set((s) => {
          const overlay = { ...s.ruleOverlay };
          delete overlay[ruleId];
          return {
            ruleOverlay: overlay,
            audit: [{
              id: uid("aud"), at: new Date().toISOString(), ruleId, action: "rolled_back",
              justification, changedBy,
            }, ...s.audit].slice(0, 500),
          };
        }),

      clearHistory: () => set({ evaluations: [] }),
    }),
    { name: "sm-safety-engine-v1" },
  ),
);
