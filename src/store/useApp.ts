import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StainProMethod = {
  chemical: string;
  type: string; // Alkali / Solvent / Enzyme / Oxidizer …
  dilution: string;
  steps: string[];
  temperature: string;
  time: string;
};

export type StainExpert = {
  ph: string;
  why: string;
  fiberReaction: string;
  chemistry: string;
};

export type StainEntry = {
  id: string;
  name: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Risky";
  removability: number; // 0-100
  pro: StainProMethod;
  alternative: { whenToUse: string; steps: string[] };
  diy: { items: string[]; steps: string[] };
  doNotDo: string[];
  proTips: { bestTime: string; whenToSend: string };
  expert: StainExpert;
  updatedAt: number;
};

export type SavedStain = {
  id: string;
  stainId?: string;
  name: string;
  category: string;
  savedAt: number;
};

export type StainHistory = {
  id: string;
  name: string;
  category: string;
  treatedAt: number;
};

type State = {
  stainCatalog: StainEntry[];
  savedStains: SavedStain[];
  stainHistory: StainHistory[];
  stainMasterUnlocked: boolean;
  unlockStainMaster: (info: { name: string; email: string; phone: string }) => void;
  upsertStain: (s: StainEntry) => void;
  removeStain: (id: string) => void;
  saveStain: (s: Omit<SavedStain, "id" | "savedAt">) => void;
  unsaveStain: (id: string) => void;
  addStainHistory: (h: Omit<StainHistory, "id" | "treatedAt">) => void;
};

export const useApp = create<State>()(
  persist(
    (set) => ({
      stainCatalog: [],
      savedStains: [],
      stainHistory: [],
      stainMasterUnlocked: false,
      unlockStainMaster: () => set({ stainMasterUnlocked: true }),
      upsertStain: (s) =>
        set((st) => {
          const exists = st.stainCatalog.some((x) => x.id === s.id);
          const updated = { ...s, updatedAt: Date.now() };
          return {
            stainCatalog: exists
              ? st.stainCatalog.map((x) => (x.id === s.id ? updated : x))
              : [updated, ...st.stainCatalog],
          };
        }),
      removeStain: (id) => set((st) => ({ stainCatalog: st.stainCatalog.filter((x) => x.id !== id) })),
      saveStain: (s) =>
        set((st) => ({
          savedStains: [{ ...s, id: `SAV-${Date.now().toString(36)}`, savedAt: Date.now() }, ...st.savedStains],
        })),
      unsaveStain: (id) => set((st) => ({ savedStains: st.savedStains.filter((x) => x.id !== id) })),
      addStainHistory: (h) =>
        set((st) => ({
          stainHistory: [
            { ...h, id: `HIS-${Date.now().toString(36)}`, treatedAt: Date.now() },
            ...st.stainHistory,
          ].slice(0, 50),
        })),
    }),
    { name: "gilm-store" },
  ),
);
