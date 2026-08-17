/** STEP 6 — master stain governance store (drafts, overrides, review flags, audit). */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MASTER_STAINS } from "@/data/masterStains";
import type { MasterStain, RecordStatus, ReviewTrigger } from "@/data/masterStains";
import { applyStatusChange, allocateStainId, evaluateReviewTriggers } from "@/lib/masterStainEngine";
import type { ReviewFlag } from "@/lib/masterStainEngine";

type Overrides = Record<string, Partial<MasterStain>>;

type MasterStainState = {
  /** Partial overrides layered over the seed library — seeds are never mutated. */
  overrides: Overrides;
  /** Administrator-created records. */
  custom: MasterStain[];
  reviewFlags: Record<string, ReviewFlag[]>;
  /** Historical usage pins: caseId -> { stainId, contentVersion }. */
  caseVersions: Record<string, { stainId: string; contentVersion: number; date: string }>;
  archivedIds: string[];

  all: () => MasterStain[];
  get: (key: string) => MasterStain | undefined;
  update: (key: string, patch: Partial<MasterStain>) => void;
  setStatus: (key: string, next: RecordStatus, by: string, reason: string, sections?: string[]) => void;
  createDraft: (name: string) => MasterStain;
  flagReview: (key: string, signals: Partial<Record<ReviewTrigger, string>>) => void;
  clearFlags: (key: string) => void;
  pinCaseVersion: (caseId: string, stainId: string, contentVersion: number) => void;
  restoreVersion: (key: string, version: number) => void;
};

const merge = (base: MasterStain, patch?: Partial<MasterStain>): MasterStain =>
  patch ? ({ ...base, ...patch, governance: { ...base.governance, ...(patch.governance ?? {}) } } as MasterStain) : base;

export const useMasterStains = create<MasterStainState>()(
  persist(
    (set, get) => ({
      overrides: {},
      custom: [],
      reviewFlags: {},
      caseVersions: {},
      archivedIds: [],

      all: () => {
        const { overrides, custom } = get();
        return [...MASTER_STAINS.map((m) => merge(m, overrides[m.key])), ...custom];
      },
      get: (key) => get().all().find((m) => m.key === key),

      update: (key, patch) =>
        set((st) => {
          if (st.custom.some((c) => c.key === key)) {
            return { custom: st.custom.map((c) => (c.key === key ? (merge(c, patch) as MasterStain) : c)) };
          }
          return { overrides: { ...st.overrides, [key]: { ...(st.overrides[key] ?? {}), ...patch } } };
        }),

      setStatus: (key, next, by, reason, sections) => {
        const current = get().get(key);
        if (!current) return;
        const updated = applyStatusChange(current, next, by, reason, sections);
        get().update(key, { governance: updated.governance, revisions: updated.revisions });
        if (next === "archived") set((st) => ({ archivedIds: [...new Set([...st.archivedIds, current.stainId])] }));
      },

      createDraft: (name) => {
        const base = MASTER_STAINS[0];
        const key = `custom_${Date.now()}`;
        const stainId = allocateStainId(get().all());
        const today = new Date().toISOString().slice(0, 10);
        const draft: MasterStain = {
          ...base,
          uuid: `msu-${key}`,
          key,
          stainId,
          canonicalName: name,
          displaySingular: name,
          canonicalOf: undefined,
          aliases: [],
          searchKeywords: [name.toLowerCase()],
          shortDescription: "",
          governance: {
            ...base.governance,
            status: "draft",
            published: false,
            contentVersion: 1,
            technicalReviewer: undefined,
            lastReviewed: undefined,
            created: today,
          },
          revisions: [{ version: 1, date: today, by: "Administrator", reason: "Draft created", status: "draft" }],
        };
        set((st) => ({ custom: [...st.custom, draft] }));
        return draft;
      },

      flagReview: (key, signals) => {
        const record = get().get(key);
        if (!record) return;
        const flags = evaluateReviewTriggers(record, signals);
        if (!flags.length) return;
        set((st) => ({ reviewFlags: { ...st.reviewFlags, [key]: [...(st.reviewFlags[key] ?? []), ...flags] } }));
        if (record.governance.status === "published" || record.governance.status === "approved") {
          get().setStatus(key, "needs_review", "Review trigger", flags.map((f) => f.note).join(" | "), flags.flatMap((f) => f.sections));
        }
      },

      clearFlags: (key) => set((st) => ({ reviewFlags: { ...st.reviewFlags, [key]: [] } })),

      pinCaseVersion: (caseId, stainId, contentVersion) =>
        set((st) => ({
          caseVersions: { ...st.caseVersions, [caseId]: { stainId, contentVersion, date: new Date().toISOString().slice(0, 10) } },
        })),

      restoreVersion: (key, version) => {
        const record = get().get(key);
        const rev = record?.revisions.find((r) => r.version === version);
        if (!record || !rev) return;
        get().setStatus(key, "draft", "Administrator", `Restored content version ${version}`);
      },
    }),
    { name: "sm-master-stains" },
  ),
);
