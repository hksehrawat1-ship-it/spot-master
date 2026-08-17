/** STEP 14 — outcome store: records, adverse records, review tasks, evidence promotion, audit, offline queue. */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  formatOutcomeId, formatAdverseId, formatReviewId, DEFAULT_THRESHOLDS, SEVERITY_POLICY,
} from "@/data/outcomes";
import type {
  OutcomeRecord, OutcomeAudit, AdverseOutcomeRecord, AdverseSeverity, EvidencePromotion,
  EvidenceStage, OutcomeReviewTrigger, OutcomeThreshold, CorrectiveAction,
  RootCauseConclusion, ClosureState, InvestigationStatus,
} from "@/data/outcomes";
import { canPromote, canDeleteOutcome, correctOutcome, syncOutcome } from "@/lib/outcomeEngine";

export type ReviewTask = {
  reviewId: string;
  outcomeId: string;
  trigger: OutcomeReviewTrigger;
  priority: "low" | "normal" | "high" | "immediate";
  status: "open" | "in_review" | "closed";
  conclusion?: RootCauseConclusion;
  answers: Record<string, "yes" | "no" | "unknown">;
  correctiveActions: CorrectiveAction[];
  createdAt: string;
};

type State = {
  records: OutcomeRecord[];
  adverse: AdverseOutcomeRecord[];
  reviews: ReviewTask[];
  promotions: EvidencePromotion[];
  thresholds: OutcomeThreshold[];
  audit: OutcomeAudit[];
  suspensions: { key: string; scope: string; reason: string; at: string }[];

  nextOutcomeId: () => string;
  addRecord: (r: Omit<OutcomeRecord, "outcomeId">, by: string) => OutcomeRecord;
  syncRecord: (r: Omit<OutcomeRecord, "outcomeId">, by: string) => { ok: boolean; message: string };
  correct: (outcomeId: string, patch: Partial<OutcomeRecord>, by: string, reason: string) => string;
  remove: (outcomeId: string, by: string, reason: string) => { ok: boolean; message: string };
  closeCase: (outcomeId: string, closure: ClosureState, by: string, exceptionReason?: string) => void;

  addAdverse: (a: Omit<AdverseOutcomeRecord, "adverseId" | "deletable">, by: string) => AdverseOutcomeRecord;
  setInvestigation: (adverseId: string, status: InvestigationStatus, by: string, note: string) => void;

  openReview: (outcomeId: string, trigger: OutcomeReviewTrigger, severity: AdverseSeverity, by: string) => ReviewTask;
  answerReview: (reviewId: string, question: string, answer: "yes" | "no" | "unknown") => void;
  concludeReview: (reviewId: string, conclusion: RootCauseConclusion, by: string, reason: string) => void;
  proposeAction: (reviewId: string, action: CorrectiveAction, by: string) => void;
  approveAction: (reviewId: string, key: string, by: string, reason: string) => void;

  promote: (outcomeId: string, from: EvidenceStage, to: EvidenceStage, reviewer: string, role: string, reason: string) => { ok: boolean; message: string };
  suspend: (key: string, scope: string, reason: string, by: string) => void;
  setThresholds: (t: OutcomeThreshold[]) => void;
  log: (e: Omit<OutcomeAudit, "id" | "at">) => void;
  reset: () => void;
};

const now = () => new Date().toISOString();

export const useOutcomes = create<State>()(
  persist(
    (set, get) => ({
      records: [],
      adverse: [],
      reviews: [],
      promotions: [],
      thresholds: [...DEFAULT_THRESHOLDS],
      audit: [],
      suspensions: [],

      nextOutcomeId: () => formatOutcomeId(get().records.length + 1),

      log: (e) => set((st) => ({ audit: [{ id: `oa${st.audit.length + 1}`, at: now(), ...e }, ...st.audit].slice(0, 1000) })),

      addRecord: (r, by) => {
        const full: OutcomeRecord = { ...r, outcomeId: get().nextOutcomeId() };
        set((st) => ({ records: [full, ...st.records] }));
        get().log({ outcomeId: full.outcomeId, user: by, action: "create", reason: "Outcome recorded", newValue: full.recordType });
        return full;
      },

      syncRecord: (r, by) => {
        const candidate: OutcomeRecord = { ...r, outcomeId: get().nextOutcomeId() };
        const res = syncOutcome(get().records, candidate);
        if (!res.accepted) return { ok: false, message: res.message };
        set((st) => ({ records: [{ ...candidate, syncState: "synced" }, ...st.records] }));
        get().log({ outcomeId: candidate.outcomeId, user: by, action: "sync", reason: res.message });
        return { ok: true, message: res.message };
      },

      correct: (outcomeId, patch, by, reason) => {
        const original = get().records.find((r) => r.outcomeId === outcomeId);
        if (!original) return "Outcome not found.";
        const newId = get().nextOutcomeId();
        const { original: preserved, correction } = correctOutcome(original, patch, newId, by);
        set((st) => ({
          records: [correction, ...st.records.map((r) => (r.outcomeId === outcomeId ? preserved : r))],
        }));
        get().log({ outcomeId, user: by, action: "correct", reason, newValue: newId });
        return `Correction ${newId} stored. The original entry ${outcomeId} is preserved.`;
      },

      remove: (outcomeId, by, reason) => {
        const r = get().records.find((x) => x.outcomeId === outcomeId);
        if (!r) return { ok: false, message: "Outcome not found." };
        if (!canDeleteOutcome(r))
          return { ok: false, message: "Adverse and damage records cannot be deleted. Record a correction instead." };
        set((st) => ({ records: st.records.filter((x) => x.outcomeId !== outcomeId) }));
        get().log({ outcomeId, user: by, action: "delete", reason });
        return { ok: true, message: "Record removed and the action recorded in the audit trail." };
      },

      closeCase: (outcomeId, closure, by, exceptionReason) => {
        set((st) => ({
          records: st.records.map((r) => (r.outcomeId === outcomeId ? { ...r, closure, closureExceptionReason: exceptionReason, updatedAt: now() } : r)),
        }));
        get().log({ outcomeId, user: by, action: "close", field: "closure", newValue: closure, reason: exceptionReason ?? "Case closed" });
      },

      addAdverse: (a, by) => {
        const full: AdverseOutcomeRecord = { ...a, adverseId: formatAdverseId(get().adverse.length + 1), deletable: false };
        set((st) => ({ adverse: [full, ...st.adverse] }));
        get().log({ outcomeId: a.outcomeId, user: by, action: "adverse_record", reason: `Severity ${a.severity} adverse outcome recorded`, newValue: full.adverseId });
        return full;
      },

      setInvestigation: (adverseId, status, by, note) => {
        set((st) => ({ adverse: st.adverse.map((a) => (a.adverseId === adverseId ? { ...a, investigationStatus: status } : a)) }));
        const a = get().adverse.find((x) => x.adverseId === adverseId);
        get().log({ outcomeId: a?.outcomeId ?? "—", user: by, action: "investigation", field: "status", newValue: status, reason: note });
      },

      openReview: (outcomeId, trigger, severity, by) => {
        const task: ReviewTask = {
          reviewId: formatReviewId(get().reviews.length + 1),
          outcomeId, trigger,
          priority: SEVERITY_POLICY[severity].reviewPriority,
          status: "open", answers: {}, correctiveActions: [], createdAt: now(),
        };
        set((st) => ({ reviews: [task, ...st.reviews] }));
        get().log({ outcomeId, user: by, action: "open_review", reason: `Trigger: ${trigger}`, newValue: task.reviewId });
        return task;
      },

      answerReview: (reviewId, question, answer) =>
        set((st) => ({
          reviews: st.reviews.map((r) => (r.reviewId === reviewId ? { ...r, status: "in_review", answers: { ...r.answers, [question]: answer } } : r)),
        })),

      concludeReview: (reviewId, conclusion, by, reason) => {
        set((st) => ({ reviews: st.reviews.map((r) => (r.reviewId === reviewId ? { ...r, conclusion, status: "closed" } : r)) }));
        const t = get().reviews.find((r) => r.reviewId === reviewId);
        get().log({ outcomeId: t?.outcomeId ?? "—", user: by, action: "conclude_review", field: "conclusion", newValue: conclusion, reason });
      },

      proposeAction: (reviewId, action, by) => {
        set((st) => ({
          reviews: st.reviews.map((r) => (r.reviewId === reviewId ? { ...r, correctiveActions: [...r.correctiveActions, { ...action, approvalStatus: "proposed", affectsLiveGuidance: false }] } : r)),
        }));
        const t = get().reviews.find((r) => r.reviewId === reviewId);
        get().log({ outcomeId: t?.outcomeId ?? "—", user: by, action: "propose_corrective_action", newValue: action.key, reason: action.detail });
      },

      approveAction: (reviewId, key, by, reason) => {
        set((st) => ({
          reviews: st.reviews.map((r) =>
            r.reviewId === reviewId
              ? {
                ...r,
                correctiveActions: r.correctiveActions.map((a) =>
                  a.key === key ? { ...a, approvalStatus: "approved", approver: by, approvedAt: now(), affectsLiveGuidance: true } : a),
              }
              : r),
        }));
        const t = get().reviews.find((r) => r.reviewId === reviewId);
        get().log({ outcomeId: t?.outcomeId ?? "—", user: by, action: "approve_corrective_action", newValue: key, reason });
      },

      promote: (outcomeId, from, to, reviewer, role, reason) => {
        const check = canPromote(from, to, role);
        const entry: EvidencePromotion = {
          outcomeId, fromStage: from, toStage: to, reviewer,
          decision: check.ok ? "promoted" : "rejected", reason: check.ok ? reason : check.message, at: now(),
        };
        set((st) => ({
          promotions: [entry, ...st.promotions],
          records: check.ok ? st.records.map((r) => (r.outcomeId === outcomeId ? { ...r, evidenceStage: to } : r)) : st.records,
        }));
        get().log({ outcomeId, user: reviewer, action: "evidence_promotion", previousValue: from, newValue: check.ok ? to : from, reason: entry.reason });
        return check;
      },

      suspend: (key, scope, reason, by) => {
        set((st) => ({ suspensions: [{ key, scope, reason, at: now() }, ...st.suspensions] }));
        get().log({ outcomeId: "—", user: by, action: "suspension", field: scope, newValue: key, reason });
      },

      setThresholds: (t) => set({ thresholds: t }),

      reset: () => set({ records: [], adverse: [], reviews: [], promotions: [], thresholds: [...DEFAULT_THRESHOLDS], audit: [], suspensions: [] }),
    }),
    { name: "sm-outcomes-v1" },
  ),
);
