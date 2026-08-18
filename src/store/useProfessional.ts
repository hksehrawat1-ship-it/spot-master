import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EMPTY_CASE } from "@/store/useRetail";
import { EMPTY_PRO_EXTRA, type ProfessionalCase } from "@/lib/professionalEngine";
import type { KitSelection } from "@/lib/retailEngine";

/**
 * Device-level professional workspace: saved cases, product-use history,
 * favourite kit and supervisor notes. The database stays authoritative for
 * every product, mapping and safety decision.
 */

export const EMPTY_PRO_CASE: ProfessionalCase = { ...EMPTY_CASE, ...EMPTY_PRO_EXTRA };

export type SavedProCase = {
  id: string;
  savedAt: number;
  reference: string;
  status: string;
  productUsed: string | null;
  outcome?: string;
  rework?: boolean;
  adverseEvent?: string;
  data: ProfessionalCase;
};

type ProState = {
  current: ProfessionalCase;
  cases: SavedProCase[];
  productUse: { at: number; product: string; component?: string; outcome?: string }[];
  favouriteKit: KitSelection | null;
  patch: (p: Partial<ProfessionalCase>) => void;
  patchGarment: (k: string, v: string) => void;
  patchStain: (k: string, v: string) => void;
  patchFabricTest: (k: string, v: string) => void;
  patchPreviousChemical: (k: string, v: string) => void;
  reset: () => void;
  saveCase: (c: Omit<SavedProCase, "id" | "savedAt" | "data">) => string;
  updateCase: (id: string, p: Partial<SavedProCase>) => void;
  recordProductUse: (e: { product: string; component?: string; outcome?: string }) => void;
  setFavouriteKit: (k: KitSelection | null) => void;
};

export const useProfessional = create<ProState>()(
  persist(
    (set, get) => ({
      current: EMPTY_PRO_CASE,
      cases: [],
      productUse: [],
      favouriteKit: null,
      patch: (p) => set({ current: { ...get().current, ...p } }),
      patchGarment: (k, v) => set({ current: { ...get().current, garment: { ...get().current.garment, [k]: v } } }),
      patchStain: (k, v) => set({ current: { ...get().current, stain: { ...get().current.stain, [k]: v } } }),
      patchFabricTest: (k, v) =>
        set({ current: { ...get().current, fabricTests: { ...get().current.fabricTests, [k]: v } } }),
      patchPreviousChemical: (k, v) =>
        set({ current: { ...get().current, previousChemical: { ...get().current.previousChemical, [k]: v } } }),
      reset: () => set({ current: { ...EMPTY_PRO_CASE, kit: get().current.kit } }),
      saveCase: (c) => {
        const id = `case-${Date.now()}`;
        set({ cases: [{ ...c, id, savedAt: Date.now(), data: get().current }, ...get().cases].slice(0, 100) });
        return id;
      },
      updateCase: (id, p) => set({ cases: get().cases.map((c) => (c.id === id ? { ...c, ...p } : c)) }),
      recordProductUse: (e) => set({ productUse: [{ ...e, at: Date.now() }, ...get().productUse].slice(0, 200) }),
      setFavouriteKit: (favouriteKit) => set({ favouriteKit }),
    }),
    {
      name: "sm-professional-spotting",
      partialize: (s) => ({ cases: s.cases, productUse: s.productUse, favouriteKit: s.favouriteKit }),
    },
  ),
);
