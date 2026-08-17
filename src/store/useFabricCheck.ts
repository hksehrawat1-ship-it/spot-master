import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  FabricAnswers,
  FabricResult,
  emptyAnswers,
  evaluateFabricSafety,
  UserRoleKey,
} from "@/lib/fabricSafety";

export type CompatibilityTest = {
  id: string;
  testType: string;
  location: string;
  medium: string;
  methodSource: string;
  result: string;
  colourTransfer: string;
  textureChange: string;
  distortion: string;
  ringFormation: string;
  operator: string;
  performedAt: number;
  photo?: string;
  decision: string;
};

export type AuditEntry = {
  id: string;
  at: number;
  action: string;
  by: string;
  reason?: string;
  detail?: string;
};

export type AnalyticsEvent = { id: string; at: number; name: string; stage?: string; props?: Record<string, string | number | boolean> };

export type Assessment = {
  id: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  version: number;
  state: "in_progress" | "completed";
  owner: string; // email or "guest"
  answers: FabricAnswers;
  result: FabricResult | null;
  tests: CompatibilityTest[];
  audit: AuditEntry[];
  adminOverride?: { riskLevel: FabricResult["riskLevel"]; gate: FabricResult["gate"]; reason: string; reviewer: string; at: number };
};

const newId = () => `FSC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

type Store = {
  assessments: Assessment[];
  currentId: string | null;
  events: AnalyticsEvent[];
  start: (owner: string, role: UserRoleKey) => string;
  resume: (id: string) => void;
  clearCurrent: () => void;
  patchAnswers: (id: string, patch: Partial<FabricAnswers>, note?: string) => void;
  complete: (id: string) => FabricResult | null;
  addTest: (id: string, test: Omit<CompatibilityTest, "id" | "performedAt">) => void;
  removePhoto: (id: string, kind: string) => void;
  remove: (id: string) => void;
  applyOverride: (id: string, o: { riskLevel: FabricResult["riskLevel"]; gate: FabricResult["gate"]; reason: string; reviewer: string }) => void;
  track: (name: string, stage?: string, props?: Record<string, string | number | boolean>) => void;
};

const touch = (a: Assessment, entry: AuditEntry): Assessment => ({
  ...a,
  updatedAt: Date.now(),
  audit: [entry, ...a.audit].slice(0, 200),
});

export const useFabricCheck = create<Store>()(
  persist(
    (set, get) => ({
      assessments: [],
      currentId: null,
      events: [],
      track: (name, stage, props) =>
        set((s) => ({
          events: [{ id: newId(), at: Date.now(), name, stage, props }, ...s.events].slice(0, 500),
        })),
      start: (owner, role) => {
        const id = newId();
        const a: Assessment = {
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
          state: "in_progress",
          owner,
          answers: emptyAnswers(role),
          result: null,
          tests: [],
          audit: [{ id: newId(), at: Date.now(), action: "assessment_started", by: owner }],
        };
        set((s) => ({ assessments: [a, ...s.assessments], currentId: id }));
        return id;
      },
      resume: (id) => set({ currentId: id }),
      clearCurrent: () => set({ currentId: null }),
      patchAnswers: (id, patch, note) =>
        set((s) => ({
          assessments: s.assessments.map((a) =>
            a.id !== id
              ? a
              : touch(
                  { ...a, answers: { ...a.answers, ...patch } },
                  { id: newId(), at: Date.now(), action: "answers_updated", by: a.owner, detail: note ?? Object.keys(patch).join(", ") },
                ),
          ),
        })),
      complete: (id) => {
        const a = get().assessments.find((x) => x.id === id);
        if (!a) return null;
        const result = evaluateFabricSafety(a.answers);
        set((s) => ({
          assessments: s.assessments.map((x) =>
            x.id !== id
              ? x
              : touch(
                  {
                    ...x,
                    result,
                    state: "completed",
                    completedAt: Date.now(),
                    version: x.state === "completed" ? x.version + 1 : x.version,
                  },
                  {
                    id: newId(),
                    at: Date.now(),
                    action: "risk_decision_recorded",
                    by: x.owner,
                    detail: `${result.riskLevel} / ${result.gate} / confidence ${result.confidence} / rules ${result.rulesVersion}`,
                  },
                ),
          ),
        }));
        return result;
      },
      addTest: (id, test) =>
        set((s) => ({
          assessments: s.assessments.map((a) =>
            a.id !== id
              ? a
              : touch(
                  { ...a, tests: [{ ...test, id: newId(), performedAt: Date.now() }, ...a.tests] },
                  { id: newId(), at: Date.now(), action: "compatibility_test_recorded", by: a.owner, detail: test.testType },
                ),
          ),
        })),
      removePhoto: (id, kind) =>
        set((s) => ({
          assessments: s.assessments.map((a) => {
            if (a.id !== id) return a;
            const photos = { ...a.answers.photos };
            delete photos[kind];
            return touch(
              { ...a, answers: { ...a.answers, photos } },
              { id: newId(), at: Date.now(), action: "photo_removed", by: a.owner, detail: kind },
            );
          }),
        })),
      remove: (id) =>
        set((s) => ({
          assessments: s.assessments.filter((a) => a.id !== id),
          currentId: s.currentId === id ? null : s.currentId,
        })),
      applyOverride: (id, o) =>
        set((s) => ({
          assessments: s.assessments.map((a) =>
            a.id !== id
              ? a
              : touch(
                  { ...a, adminOverride: { ...o, at: Date.now() } },
                  {
                    id: newId(),
                    at: Date.now(),
                    action: "admin_override",
                    by: o.reviewer,
                    reason: o.reason,
                    detail: `${o.riskLevel} / ${o.gate}`,
                  },
                ),
          ),
        })),
    }),
    { name: "stain-master-fabric-check" },
  ),
);

/** Reusable treatment gate for later steps (Step 3+ reads this). */
export function getTreatmentGate(assessmentId: string) {
  const a = useFabricCheck.getState().assessments.find((x) => x.id === assessmentId);
  if (!a?.result) return null;
  return a.adminOverride?.gate ?? a.result.gate;
}
