import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EMPTY_CASE } from "@/store/useRetail";
import { EMPTY_PRO_EXTRA } from "@/lib/professionalEngine";
import {
  EMPTY_MASTER_EXTRA,
  preserveCase,
  type LedgerEntry,
  type MasterCase,
} from "@/lib/masterEngine";
import type { MasterStageKey, MasterTabKey, ViewMode } from "@/data/masterSpotter";
import type { KitSelection } from "@/lib/retailEngine";
import type { ComponentKey } from "@/data/taxonomy";

/**
 * Device-level Master Spotter workspace. Convenience only — Supabase remains
 * the authoritative case record (Constitution R23; requirement §23).
 * Only the preferred kits, view mode and an offline safety summary are persisted.
 */

export const EMPTY_MASTER_CASE: MasterCase = {
  ...EMPTY_CASE,
  ...EMPTY_PRO_EXTRA,
  ...EMPTY_MASTER_EXTRA,
};

type OfflineCache = { content: string; sourceVersion: string; lastVerified: string } | null;

type MasterState = {
  current: MasterCase;
  tab: MasterTabKey;
  view: ViewMode;
  preferredKits: KitSelection[];
  offlineCache: OfflineCache;
  saveStatus: "idle" | "saving" | "saved" | "error";
  setTab: (t: MasterTabKey) => void;
  setView: (v: ViewMode) => void;
  patch: (p: Partial<MasterCase>) => void;
  patchPath: <K extends keyof MasterCase>(key: K, value: Partial<MasterCase[K]>) => void;
  patchGarment: (k: string, v: string) => void;
  patchStain: (k: string, v: string) => void;
  patchIdentity: (k: string, v: string) => void;
  patchDyeFlag: (k: string, v: string) => void;
  patchConfidence: (k: string, v: string) => void;
  toggleTrim: (k: MasterCase["trims"][number]) => void;
  toggleConstruction: (v: string) => void;
  toggleCondition: (v: string) => void;
  setKits: (k: KitSelection[]) => void;
  setActiveStage: (s: MasterStageKey | null) => void;
  setActiveComponent: (c: ComponentKey | undefined) => void;
  addLedgerEntry: (e: Omit<LedgerEntry, "id" | "entryOrder" | "performedAt"> & Partial<Pick<LedgerEntry, "performedAt">>) => LedgerEntry;
  updateLedgerEntry: (id: string, p: Partial<LedgerEntry>) => void;
  adoptCase: (from: Partial<MasterCase>) => void;
  setSaveStatus: (s: MasterState["saveStatus"]) => void;
  setOfflineCache: (c: OfflineCache) => void;
  reset: () => void;
};

export const useMaster = create<MasterState>()(
  persist(
    (set, get) => ({
      current: EMPTY_MASTER_CASE,
      tab: "case",
      view: "technical",
      preferredKits: [],
      offlineCache: null,
      saveStatus: "idle",
      setTab: (tab) => set({ tab }),
      setView: (view) => set({ view }),
      patch: (p) => set({ current: { ...get().current, ...p } }),
      patchPath: (key, value) =>
        set({ current: { ...get().current, [key]: { ...(get().current[key] as object), ...(value as object) } } }),
      patchGarment: (k, v) => set({ current: { ...get().current, garment: { ...get().current.garment, [k]: v } } }),
      patchStain: (k, v) => set({ current: { ...get().current, stain: { ...get().current.stain, [k]: v } } }),
      patchIdentity: (k, v) =>
        set({ current: { ...get().current, garmentIdentity: { ...get().current.garmentIdentity, [k]: v } } }),
      patchDyeFlag: (k, v) =>
        set({
          current: {
            ...get().current,
            dyeColour: { ...get().current.dyeColour, flags: { ...get().current.dyeColour.flags, [k]: v } },
          },
        }),
      patchConfidence: (k, v) =>
        set({
          current: {
            ...get().current,
            evidencePanel: {
              ...get().current.evidencePanel,
              confidence: { ...get().current.evidencePanel.confidence, [k]: v },
            },
          },
        }),
      toggleTrim: (k) => {
        const trims = get().current.trims;
        set({ current: { ...get().current, trims: trims.includes(k) ? trims.filter((t) => t !== k) : [...trims, k] } });
      },
      toggleConstruction: (v) => {
        const list = get().current.constructionTypes;
        set({
          current: {
            ...get().current,
            constructionTypes: list.includes(v) ? list.filter((x) => x !== v) : [...list, v],
          },
        });
      },
      toggleCondition: (v) => {
        const list = get().current.diagnosis.conditions;
        set({
          current: {
            ...get().current,
            diagnosis: {
              ...get().current.diagnosis,
              conditions: list.includes(v) ? list.filter((x) => x !== v) : [...list, v],
            },
          },
        });
      },
      setKits: (preferredKits) => set({ preferredKits, current: { ...get().current, selectedKits: preferredKits } }),
      setActiveStage: (activeStage) => set({ current: { ...get().current, activeStage } }),
      setActiveComponent: (activeComponent) => set({ current: { ...get().current, activeComponent } }),
      addLedgerEntry: (e) => {
        const ledger = get().current.ledger;
        const entry: LedgerEntry = {
          ...e,
          id: `ledger-${Date.now()}-${ledger.length}`,
          entryOrder: ledger.length + 1,
          performedAt: e.performedAt ?? new Date().toISOString(),
        };
        set({ current: { ...get().current, ledger: [...ledger, entry] } });
        return entry;
      },
      updateLedgerEntry: (id, p) =>
        set({
          current: {
            ...get().current,
            ledger: get().current.ledger.map((e) => (e.id === id ? { ...e, ...p } : e)),
          },
        }),
      /** Carry a retail/professional case into Master Spotter without re-entry. */
      adoptCase: (from) => set({ current: preserveCase(from, { ...get().current, ...from } as MasterCase) }),
      setSaveStatus: (saveStatus) => set({ saveStatus }),
      setOfflineCache: (offlineCache) => set({ offlineCache }),
      reset: () => set({ current: { ...EMPTY_MASTER_CASE, selectedKits: get().preferredKits } }),
    }),
    {
      name: "sm-master-spotter",
      partialize: (s) => ({ preferredKits: s.preferredKits, view: s.view, offlineCache: s.offlineCache }),
    },
  ),
);
