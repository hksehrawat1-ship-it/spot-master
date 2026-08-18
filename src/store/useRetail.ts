import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WorkingLayerKey } from "@/data/retailSpotting";
import type { KitSelection, RetailCase } from "@/lib/retailEngine";

/**
 * Device-level convenience only. The database stays authoritative for
 * companies, kits, products and every safety decision.
 */

export const EMPTY_CASE: RetailCase = {
  stainKnown: false,
  fabricKnown: false,
  careLabel: "available",
  colour: "Unknown",
  stainAge: "Unknown",
  heatExposed: "Not sure",
  previouslyTreated: "No",
  visibleDamage: "No",
  activeColourBleeding: "No",
  specialConstruction: "No",
  kit: { kind: "none" },
  testResult: "Not tested",
  safetyEngineAvailable: true,
  observations: {},
};

type RetailState = {
  layer: WorkingLayerKey;
  kit: KitSelection;
  otherKitName: string;
  current: RetailCase;
  events: { name: string; at: number }[];
  setLayer: (l: WorkingLayerKey) => void;
  setKit: (k: KitSelection) => void;
  setOtherKitName: (n: string) => void;
  patchCase: (p: Partial<RetailCase>) => void;
  resetCase: () => void;
  track: (names: string[]) => void;
};

export const useRetail = create<RetailState>()(
  persist(
    (set, get) => ({
      layer: "retail",
      kit: { kind: "none" },
      otherKitName: "",
      current: EMPTY_CASE,
      events: [],
      setLayer: (layer) => set({ layer }),
      setKit: (kit) => set({ kit, current: { ...get().current, kit } }),
      setOtherKitName: (otherKitName) => set({ otherKitName }),
      patchCase: (p) => set({ current: { ...get().current, ...p } }),
      resetCase: () => set({ current: { ...EMPTY_CASE, kit: get().kit } }),
      track: (names) =>
        set({
          // Operational events only — no personal data is recorded.
          events: [...get().events, ...names.map((name) => ({ name, at: Date.now() }))].slice(-200),
        }),
    }),
    { name: "sm-retail-spotting", partialize: (s) => ({ layer: s.layer, kit: s.kit, otherKitName: s.otherKitName }) },
  ),
);
