import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  emptyReadinessAnswers,
  evaluateReadiness,
  READINESS_VERSION,
  type ReadinessAnswers,
  type ReadinessContext,
  type ReadinessResult,
} from "@/lib/treatmentReadiness";

export type ReadinessAudit = {
  id: string;
  at: number;
  action: string;
  by: string;
  reason?: string;
  detail?: string;
  previous?: string;
};

export type ReadinessCase = {
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
  identificationId: string | null;
  context: ReadinessContext;
  answers: ReadinessAnswers;
  result: ReadinessResult | null;
  audit: ReadinessAudit[];
  override?: { by: string; justification: string; status: string; at: number; previousStatus: string };
};

export type ReadinessEvent = {
  id: string;
  at: number;
  name: string;
  stage?: string;
  props?: Record<string, string | number | boolean>;
};

const newId = (p = "TRC") =>
  `${p}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const touch = (c: ReadinessCase, entry: ReadinessAudit): ReadinessCase => ({
  ...c,
  updatedAt: Date.now(),
  audit: [entry, ...c.audit].slice(0, 250),
});

type Store = {
  cases: ReadinessCase[];
  currentId: string | null;
  events: ReadinessEvent[];
  start: (input: {
    owner: string;
    organization?: string;
    fabricAssessmentId: string | null;
    identificationId: string | null;
    context: ReadinessContext;
    seed?: Partial<ReadinessAnswers>;
  }) => string;
  resume: (id: string) => void;
  clearCurrent: () => void;
  patch: (id: string, patch: Partial<ReadinessAnswers>, note?: string) => void;
  complete: (id: string) => ReadinessResult | null;
  override: (id: string, o: { by: string; justification: string; status: string }) => void;
  remove: (id: string) => void;
  track: (name: string, stage?: string, props?: Record<string, string | number | boolean>) => void;
};

export const useReadiness = create<Store>()(
  persist(
    (set, get) => ({
      cases: [],
      currentId: null,
      events: [],

      track: (name, stage, props) =>
        set((s) => ({
          events: [{ id: newId("EV"), at: Date.now(), name, stage, props }, ...s.events].slice(0, 500),
        })),

      start: ({ owner, organization = "Personal", fabricAssessmentId, identificationId, context, seed }) => {
        const id = newId();
        const c: ReadinessCase = {
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
          assessmentVersion: READINESS_VERSION,
          state: "in_progress",
          owner,
          organization,
          fabricAssessmentId,
          identificationId,
          context,
          answers: { ...emptyReadinessAnswers(), ...seed },
          result: null,
          audit: [
            {
              id: newId("A"),
              at: Date.now(),
              action: "case_started",
              by: owner,
              detail: `risk ${context.riskBefore} / gate ${context.gateBefore} / stain ${context.suspectedStain ?? "unknown"}`,
            },
          ],
        };
        set((s) => ({ cases: [c, ...s.cases], currentId: id }));
        return id;
      },

      resume: (id) => set({ currentId: id }),
      clearCurrent: () => set({ currentId: null }),

      patch: (id, patch, note) =>
        set((s) => ({
          cases: s.cases.map((c) => {
            if (c.id !== id) return c;
            const previous = Object.keys(patch)
              .map((k) => `${k}=${JSON.stringify((c.answers as Record<string, unknown>)[k])}`)
              .join(", ");
            return touch(
              { ...c, answers: { ...c.answers, ...patch } },
              {
                id: newId("A"),
                at: Date.now(),
                action: "answer_updated",
                by: c.owner,
                detail: note ?? Object.keys(patch).join(", "),
                previous,
              },
            );
          }),
        })),

      complete: (id) => {
        const c = get().cases.find((x) => x.id === id);
        if (!c) return null;
        const result = evaluateReadiness(c.answers, c.context);
        set((s) => ({
          cases: s.cases.map((x) =>
            x.id !== id
              ? x
              : touch(
                  {
                    ...x,
                    result,
                    state: "completed",
                    completedAt: Date.now(),
                    version: x.version + 1,
                  },
                  {
                    id: newId("A"),
                    at: Date.now(),
                    action: "readiness_evaluated",
                    by: x.owner,
                    detail: `${result.status} / risk ${result.riskBefore}→${result.riskAfter} / ${result.version}`,
                  },
                ),
          ),
        }));
        return result;
      },

      override: (id, o) =>
        set((s) => ({
          cases: s.cases.map((c) => {
            if (c.id !== id) return c;
            const previousStatus = c.override?.status ?? c.result?.status ?? "unknown";
            return touch(
              { ...c, override: { ...o, at: Date.now(), previousStatus } },
              {
                id: newId("A"),
                at: Date.now(),
                action: "admin_override",
                by: o.by,
                reason: o.justification,
                detail: `${previousStatus} → ${o.status}`,
                previous: previousStatus,
              },
            );
          }),
        })),

      remove: (id) =>
        set((s) => ({ cases: s.cases.filter((c) => c.id !== id), currentId: s.currentId === id ? null : s.currentId })),
    }),
    { name: "stain-master-readiness" },
  ),
);

/** Effective readiness status for later steps (Step 5+ reads this). */
export function getReadinessStatus(caseId: string) {
  const c = useReadiness.getState().cases.find((x) => x.id === caseId);
  if (!c?.result) return null;
  return (c.override?.status as ReadinessResult["status"]) ?? c.result.status;
}
