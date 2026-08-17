/** STEP 12 — domestic-treatment governance, monitoring and case delivery state. */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DOMESTIC_TREATMENTS,
  formatDomesticId,
  LAST_DOMESTIC_SEQUENCE,
  MIGRATION_AUDIT,
  type DomesticTreatment,
  type DomesticWorkflowStatus,
  type MigrationRecord,
  type ControlledTest,
} from "@/data/domesticTreatments";
import {
  evaluateDomestic,
  summarizeMonitoring,
  autoReviewTriggers,
  validateForPublication,
  IMMEDIATE_SUSPENSION_TRIGGERS,
  type DomesticCase,
  type DomesticResult,
  type FeedbackOutcome,
  type ReviewTriggerKey,
} from "@/lib/domesticEngine";
import type { SafetyEvaluation } from "@/lib/safetyEngine";

export type DomesticFeedback = {
  id: string;
  domesticTreatmentId: string;
  methodVersion: number;
  caseId: string;
  attemptNumber: number;
  outcome: FeedbackOutcome;
  householdProductKey?: string;
  productVersion?: string;
  photographs: string[];
  notes?: string;
  at: string;
};

export type AdverseEvent = {
  id: string;
  domesticTreatmentId: string;
  methodVersion: number;
  caseId: string;
  damageType: string;
  observations: string;
  photographs: string[];
  householdProductKey?: string;
  caseAccessBlocked: boolean;
  reviewStatus: "pending_review" | "under_review" | "closed";
  reviewer?: string;
  resolution?: string;
  at: string;
};

export type DomesticAudit = {
  id: string;
  at: string;
  domesticTreatmentId: string;
  action: "created" | "edited" | "status_changed" | "flagged" | "suspended" | "approved" | "published" | "rejected";
  field?: string;
  previousValue?: string;
  newValue?: string;
  justification: string;
  by: string;
};

type DomesticState = {
  /** Overlay on the seeded records — code remains the source of the deterministic logic. */
  overlay: Record<string, Partial<DomesticTreatment>>;
  drafts: DomesticTreatment[];
  feedback: DomesticFeedback[];
  adverse: AdverseEvent[];
  tests: ControlledTest[];
  audit: DomesticAudit[];
  migration: MigrationRecord[];
  results: DomesticResult[];
  /** Cases blocked after an adverse outcome — no further method access. */
  blockedCases: string[];

  treatments: () => DomesticTreatment[];
  byId: (id: string) => DomesticTreatment | undefined;

  evaluate: (c: DomesticCase, ev?: SafetyEvaluation, opts?: { persist?: boolean }) => DomesticResult;

  createDraft: (partial: Partial<DomesticTreatment> & { treatmentName: string; stainKey: string }, by: string) => string;
  updateTreatment: (id: string, patch: Partial<DomesticTreatment>, justification: string, by: string) => void;
  setStatus: (id: string, status: DomesticWorkflowStatus, justification: string, by: string) => { ok: boolean; message: string };
  flagForReview: (id: string, trigger: ReviewTriggerKey, by: string) => void;
  refreshAutoTriggers: (by?: string) => void;

  recordTest: (t: ControlledTest) => void;
  recordFeedback: (f: Omit<DomesticFeedback, "id" | "at">) => void;
  recordAdverse: (a: Omit<AdverseEvent, "id" | "at" | "caseAccessBlocked" | "reviewStatus">) => void;
  monitoring: (id: string) => ReturnType<typeof summarizeMonitoring>;
  clearCaseBlock: (caseId: string) => void;
};

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const useDomestic = create<DomesticState>()(
  persist(
    (set, get) => ({
      overlay: {},
      drafts: [],
      feedback: [],
      adverse: [],
      tests: [],
      audit: [],
      migration: MIGRATION_AUDIT,
      results: [],
      blockedCases: [],

      treatments: () => {
        const { overlay, drafts } = get();
        const seeded = DOMESTIC_TREATMENTS.map((t) =>
          overlay[t.domesticTreatmentId] ? { ...t, ...overlay[t.domesticTreatmentId] } : t,
        );
        return [...seeded, ...drafts.map((d) => (overlay[d.domesticTreatmentId] ? { ...d, ...overlay[d.domesticTreatmentId] } : d))];
      },

      byId: (id) => get().treatments().find((t) => t.domesticTreatmentId === id),

      evaluate: (c, ev, opts = { persist: true }) => {
        const blocked = get().blockedCases.includes(c.caseId);
        const result = evaluateDomestic(
          blocked ? { ...c, adverseOutcomeReported: true } : c,
          ev,
          get().treatments(),
        );
        if (opts.persist !== false) set((s) => ({ results: [result, ...s.results].slice(0, 200) }));
        return result;
      },

      createDraft: (partial, by) => {
        const seq = LAST_DOMESTIC_SEQUENCE + get().drafts.length + 1;
        const id = formatDomesticId(seq);
        const base = DOMESTIC_TREATMENTS[0];
        const draft: DomesticTreatment = {
          ...base,
          domesticTreatmentId: id,
          key: `draft-${id.toLowerCase()}`,
          version: 1,
          treatmentName: partial.treatmentName,
          stainKey: partial.stainKey,
          methodSteps: [],
          evidence: [],
          maximumAttempts: null,
          technicalReviewer: null,
          safetyReviewer: null,
          countryReviewer: null,
          status: "draft",
          lastReviewedDate: null,
          nextReviewDate: null,
          revisions: [{ version: 1, at: new Date().toISOString(), by, summary: "Candidate method created", status: "draft" }],
          reviewTriggers: [],
          ...partial,
        };
        set((s) => ({
          drafts: [draft, ...s.drafts],
          audit: [{ id: uid("aud"), at: new Date().toISOString(), domesticTreatmentId: id, action: "created", justification: "Candidate method created", by }, ...s.audit],
        }));
        return id;
      },

      updateTreatment: (id, patch, justification, by) =>
        set((s) => ({
          overlay: { ...s.overlay, [id]: { ...s.overlay[id], ...patch } },
          audit: [{ id: uid("aud"), at: new Date().toISOString(), domesticTreatmentId: id, action: "edited", justification, by }, ...s.audit],
        })),

      setStatus: (id, status, justification, by) => {
        const t = get().byId(id);
        if (!t) return { ok: false, message: "Treatment not found." };
        if (status === "published") {
          const issues = validateForPublication({ ...t, status });
          if (issues.length)
            return { ok: false, message: `Publication blocked: ${issues.map((i) => i.message).join(" ")}` };
        }
        set((s) => ({
          overlay: {
            ...s.overlay,
            [id]: {
              ...s.overlay[id],
              status,
              revisions: [
                ...(t.revisions ?? []),
                { version: t.version, at: new Date().toISOString(), by, summary: justification, status },
              ],
            },
          },
          audit: [{
            id: uid("aud"), at: new Date().toISOString(), domesticTreatmentId: id,
            action: status === "suspended" ? "suspended" : status === "published" ? "published"
              : status === "approved" ? "approved" : status === "rejected" ? "rejected" : "status_changed",
            field: "status", previousValue: t.status, newValue: status, justification, by,
          }, ...s.audit],
        }));
        return { ok: true, message: `Status changed to ${status}.` };
      },

      flagForReview: (id, trigger, by) => {
        const t = get().byId(id);
        if (!t) return;
        const suspend = IMMEDIATE_SUSPENSION_TRIGGERS.includes(trigger);
        set((s) => ({
          overlay: {
            ...s.overlay,
            [id]: {
              ...s.overlay[id],
              status: suspend ? "suspended" : t.status === "published" ? "needs_review" : t.status,
              reviewTriggers: Array.from(new Set([...(t.reviewTriggers ?? []), trigger])),
            },
          },
          audit: [{
            id: uid("aud"), at: new Date().toISOString(), domesticTreatmentId: id,
            action: suspend ? "suspended" : "flagged", justification: `Review trigger: ${trigger}`, by,
          }, ...s.audit],
        }));
      },

      refreshAutoTriggers: (by = "system") => {
        for (const t of get().treatments()) {
          for (const trig of autoReviewTriggers(t)) get().flagForReview(t.domesticTreatmentId, trig, by);
        }
      },

      recordTest: (t) => set((s) => ({ tests: [t, ...s.tests] })),

      recordFeedback: (f) =>
        set((s) => ({ feedback: [{ ...f, id: uid("fb"), at: new Date().toISOString() }, ...s.feedback] })),

      recordAdverse: (a) => {
        const event: AdverseEvent = {
          ...a, id: uid("adv"), at: new Date().toISOString(),
          caseAccessBlocked: true, reviewStatus: "pending_review",
        };
        set((s) => ({
          adverse: [event, ...s.adverse],
          blockedCases: Array.from(new Set([...s.blockedCases, a.caseId])),
        }));
        get().flagForReview(a.domesticTreatmentId, "damage_report", "monitoring");
      },

      monitoring: (id) => summarizeMonitoring(id, get().feedback, get().adverse),

      clearCaseBlock: (caseId) => set((s) => ({ blockedCases: s.blockedCases.filter((c) => c !== caseId) })),
    }),
    { name: "sm-domestic-v1" },
  ),
);
