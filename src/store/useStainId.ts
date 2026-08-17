import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GateStatus, RiskLevel } from "@/lib/fabricSafety";
import {
  emptyIdAnswers,
  evaluateIdentification,
  ID_RULES_VERSION,
  type IdAnswers,
  type IdResult,
} from "@/lib/stainId";

export type IdAudit = { id: string; at: number; action: string; by: string; reason?: string; detail?: string };

export type IdCase = {
  id: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  version: number;
  assessmentVersion: string;
  state: "in_progress" | "completed";
  owner: string;
  organization: string;
  fabricAssessmentId: string | null;
  riskBefore: RiskLevel;
  gateBefore: GateStatus;
  answers: IdAnswers;
  result: IdResult | null;
  confirmedStainId: string | null;
  rejectedStainIds: string[];
  notSureStainIds: string[];
  audit: IdAudit[];
  reviewer?: { by: string; reason: string; at: number; correctedStainId?: string | null };
};

export type IdEvent = { id: string; at: number; name: string; stage?: string; props?: Record<string, string | number | boolean> };

const newId = (p = "SID") => `${p}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const touch = (c: IdCase, entry: IdAudit): IdCase => ({
  ...c,
  updatedAt: Date.now(),
  audit: [entry, ...c.audit].slice(0, 200),
});

type Store = {
  cases: IdCase[];
  currentId: string | null;
  events: IdEvent[];
  searchLog: { term: string; at: number; results: number }[];
  savedStainIds: string[];
  start: (input: { owner: string; organization?: string; fabricAssessmentId: string | null; riskBefore: RiskLevel; gateBefore: GateStatus }) => string;
  resume: (id: string) => void;
  clearCurrent: () => void;
  patch: (id: string, patch: Partial<IdAnswers>, note?: string) => void;
  complete: (id: string) => IdResult | null;
  confirmCandidate: (id: string, stainId: string) => void;
  rejectCandidate: (id: string, stainId: string) => void;
  notSureCandidate: (id: string, stainId: string) => void;
  review: (id: string, r: { by: string; reason: string; correctedStainId?: string | null }) => void;
  remove: (id: string) => void;
  logSearch: (term: string, results: number) => void;
  toggleSaved: (stainId: string) => void;
  track: (name: string, stage?: string, props?: Record<string, string | number | boolean>) => void;
};

export const useStainId = create<Store>()(
  persist(
    (set, get) => ({
      cases: [],
      currentId: null,
      events: [],
      searchLog: [],
      savedStainIds: [],

      track: (name, stage, props) =>
        set((s) => ({ events: [{ id: newId("EV"), at: Date.now(), name, stage, props }, ...s.events].slice(0, 500) })),

      logSearch: (term, results) =>
        set((s) => ({ searchLog: [{ term, at: Date.now(), results }, ...s.searchLog].slice(0, 300) })),

      toggleSaved: (stainId) =>
        set((s) => ({
          savedStainIds: s.savedStainIds.includes(stainId)
            ? s.savedStainIds.filter((x) => x !== stainId)
            : [stainId, ...s.savedStainIds].slice(0, 50),
        })),

      start: ({ owner, organization = "default", fabricAssessmentId, riskBefore, gateBefore }) => {
        const id = newId();
        const c: IdCase = {
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
          assessmentVersion: ID_RULES_VERSION,
          state: "in_progress",
          owner,
          organization,
          fabricAssessmentId,
          riskBefore,
          gateBefore,
          answers: emptyIdAnswers(),
          result: null,
          confirmedStainId: null,
          rejectedStainIds: [],
          notSureStainIds: [],
          audit: [{ id: newId("A"), at: Date.now(), action: "identification_started", by: owner }],
        };
        set((s) => ({ cases: [c, ...s.cases].slice(0, 100), currentId: id }));
        return id;
      },

      resume: (id) => set({ currentId: id }),
      clearCurrent: () => set({ currentId: null }),

      patch: (id, patch, note) =>
        set((s) => ({
          cases: s.cases.map((c) =>
            c.id !== id
              ? c
              : touch(
                  { ...c, answers: { ...c.answers, ...patch } },
                  { id: newId("A"), at: Date.now(), action: "answers_updated", by: c.owner, detail: note ?? Object.keys(patch).join(", ") },
                ),
          ),
        })),

      complete: (id) => {
        const c = get().cases.find((x) => x.id === id);
        if (!c) return null;
        const result = evaluateIdentification(c.answers, { riskBefore: c.riskBefore, gateBefore: c.gateBefore });
        set((s) => ({
          cases: s.cases.map((x) =>
            x.id !== id
              ? x
              : touch(
                  { ...x, result, state: "completed", completedAt: Date.now(), version: x.version + 1 },
                  {
                    id: newId("A"),
                    at: Date.now(),
                    action: "identification_evaluated",
                    by: x.owner,
                    detail: `${result.outcome} · confidence ${result.confidence}/10 · risk ${result.riskBefore}→${result.riskAfter}`,
                  },
                ),
          ),
        }));
        return result;
      },

      confirmCandidate: (id, stainId) =>
        set((s) => ({
          cases: s.cases.map((c) =>
            c.id !== id
              ? c
              : touch(
                  { ...c, confirmedStainId: stainId, rejectedStainIds: c.rejectedStainIds.filter((x) => x !== stainId) },
                  { id: newId("A"), at: Date.now(), action: "candidate_confirmed", by: c.owner, detail: stainId },
                ),
          ),
        })),

      rejectCandidate: (id, stainId) =>
        set((s) => ({
          cases: s.cases.map((c) =>
            c.id !== id
              ? c
              : touch(
                  {
                    ...c,
                    confirmedStainId: c.confirmedStainId === stainId ? null : c.confirmedStainId,
                    rejectedStainIds: Array.from(new Set([...c.rejectedStainIds, stainId])),
                  },
                  { id: newId("A"), at: Date.now(), action: "candidate_rejected", by: c.owner, detail: stainId },
                ),
          ),
        })),

      notSureCandidate: (id, stainId) =>
        set((s) => ({
          cases: s.cases.map((c) =>
            c.id !== id
              ? c
              : touch(
                  { ...c, notSureStainIds: Array.from(new Set([...c.notSureStainIds, stainId])) },
                  { id: newId("A"), at: Date.now(), action: "candidate_not_sure", by: c.owner, detail: stainId },
                ),
          ),
        })),

      /** Reviewer corrections are recorded as a new version; history is never rewritten. */
      review: (id, r) =>
        set((s) => ({
          cases: s.cases.map((c) =>
            c.id !== id
              ? c
              : touch(
                  { ...c, version: c.version + 1, reviewer: { ...r, at: Date.now() } },
                  { id: newId("A"), at: Date.now(), action: "reviewer_correction", by: r.by, reason: r.reason, detail: r.correctedStainId ?? "" },
                ),
          ),
        })),

      remove: (id) => set((s) => ({ cases: s.cases.filter((c) => c.id !== id), currentId: s.currentId === id ? null : s.currentId })),
    }),
    { name: "sm-stain-id-v1" },
  ),
);
