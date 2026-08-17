import { create } from "zustand";
import { persist } from "zustand/middleware";

import { classify, type ClassificationResult, type ClassifyInput } from "@/lib/classification";
import { TAXONOMY_VERSION, type PrimaryCategoryKey } from "@/data/taxonomy";

export type ClassificationAudit = {
  id: string;
  at: number;
  action: string;
  by: string;
  justification?: string;
  previousPrimary?: string;
  newPrimary?: string;
};

export type CaseClassification = {
  id: string;
  createdAt: number;
  updatedAt: number;
  owner: string;
  /** Links to earlier steps. */
  fabricAssessmentId: string | null;
  identificationId: string | null;
  readinessCaseId: string | null;
  input: ClassifyInput;
  result: ClassificationResult;
  /** Full version history — restoring never deletes an earlier record. */
  versions: { version: number; at: number; result: ClassificationResult; note: string }[];
  version: number;
  audit: ClassificationAudit[];
};

/** Reviewer edits to the library, kept out of the seed file so seeds stay auditable. */
export type LibraryOverride = {
  key: string;
  primary: PrimaryCategoryKey;
  justification: string;
  by: string;
  at: number;
  previousPrimary: PrimaryCategoryKey | null;
};

const newId = () =>
  `CLS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

type Store = {
  cases: CaseClassification[];
  currentId: string | null;
  overrides: LibraryOverride[];
  create: (input: ClassifyInput, links?: {
    owner?: string;
    fabricAssessmentId?: string | null;
    identificationId?: string | null;
    readinessCaseId?: string | null;
  }) => string;
  update: (id: string, patch: Partial<ClassifyInput>, note: string) => void;
  resume: (id: string) => void;
  clearCurrent: () => void;
  restoreVersion: (id: string, version: number, by: string) => void;
  remove: (id: string) => void;
  overrideLibraryPrimary: (o: Omit<LibraryOverride, "at">) => void;
};

export const useClassification = create<Store>()(
  persist(
    (set, get) => ({
      cases: [],
      currentId: null,
      overrides: [],

      create: (input, links) => {
        const id = newId();
        const result = classify(input);
        const now = Date.now();
        const record: CaseClassification = {
          id,
          createdAt: now,
          updatedAt: now,
          owner: links?.owner ?? "Current user",
          fabricAssessmentId: links?.fabricAssessmentId ?? null,
          identificationId: links?.identificationId ?? null,
          readinessCaseId: links?.readinessCaseId ?? null,
          input,
          result,
          version: 1,
          versions: [{ version: 1, at: now, result, note: "Initial classification" }],
          audit: [{ id: newId(), at: now, action: "Classification created", by: links?.owner ?? "Current user" }],
        };
        set((s) => ({ cases: [record, ...s.cases].slice(0, 100), currentId: id }));
        return id;
      },

      update: (id, patch, note) => {
        set((s) => ({
          cases: s.cases.map((c) => {
            if (c.id !== id) return c;
            const input = { ...c.input, ...patch };
            const result = classify(input);
            const version = c.version + 1;
            const at = Date.now();
            return {
              ...c,
              input,
              result,
              version,
              updatedAt: at,
              versions: [...c.versions, { version, at, result, note }],
              audit: [
                {
                  id: newId(), at, action: note, by: c.owner,
                  previousPrimary: c.result.primaryCategory ?? "damage",
                  newPrimary: result.primaryCategory ?? "damage",
                },
                ...c.audit,
              ].slice(0, 100),
            };
          }),
        }));
      },

      resume: (id) => set({ currentId: id }),
      clearCurrent: () => set({ currentId: null }),

      restoreVersion: (id, version, by) => {
        set((s) => ({
          cases: s.cases.map((c) => {
            if (c.id !== id) return c;
            const target = c.versions.find((v) => v.version === version);
            if (!target) return c;
            const at = Date.now();
            const nextVersion = c.version + 1;
            return {
              ...c,
              result: target.result,
              version: nextVersion,
              updatedAt: at,
              versions: [...c.versions, { version: nextVersion, at, result: target.result, note: `Restored version ${version}` }],
              audit: [{ id: newId(), at, action: `Restored version ${version}`, by }, ...c.audit],
            };
          }),
        }));
      },

      remove: (id) =>
        set((s) => ({
          cases: s.cases.filter((c) => c.id !== id),
          currentId: s.currentId === id ? null : s.currentId,
        })),

      overrideLibraryPrimary: (o) => {
        if (!o.justification.trim()) return;
        set((s) => ({ overrides: [{ ...o, at: Date.now() }, ...s.overrides].slice(0, 200) }));
      },
    }),
    { name: `stain-classification-${TAXONOMY_VERSION}` },
  ),
);

export const currentClassification = (s: Store) =>
  s.cases.find((c) => c.id === s.currentId) ?? null;
