import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = { name: string; email: string; role: "student" | "admin" } | null;

// Designate the master admin email here
export const ADMIN_EMAIL = "admin@gilm.in";

// GILM contact info
export const GILM_CONTACT = {
  email: "support@gilm.in",
  phone: "+91 98765 43210",
  whatsapp: "+91 98765 43210",
};

// Demo student account (one-tap sign in on the SignIn screen)
export const DEMO_STUDENT = {
  name: "Himanshu Sehrawat",
  email: "gilm@google.com",
  otp: "123456",
};

export type VaultItem = {
  id: string;
  courseId: string;
  name: string;
  kind: "pdf" | "xlsx" | "png" | "doc" | "video" | "other";
  size: number; // bytes
  url: string; // demo "#"
  addedAt: number;
};

export type Invoice = {
  id: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  date: number; // ms
};

export type PracticalBooking = {
  id: string;
  email: string;
  name: string;
  month: string; // e.g. "2026-05"
  bookedAt: number;
};

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
  user: User;
  completed: Record<string, boolean>;
  vault: VaultItem[];
  purchases: Record<string, boolean>;
  invoices: Invoice[];
  practicalBookings: PracticalBooking[];
  stainCatalog: StainEntry[];
  savedStains: SavedStain[];
  stainHistory: StainHistory[];
  stainMasterUnlocked: boolean;
  unlockStainMaster: (info: { name: string; email: string; phone: string }) => void;
  setUser: (u: User) => void;
  signOut: () => void;
  toggleLesson: (id: string, value: boolean) => void;
  addVaultItems: (items: VaultItem[]) => void;
  removeVaultItem: (id: string) => void;
  purchaseCourse: (p: { courseId: string; courseTitle: string; amount: number }) => void;
  bookPractical: (b: Omit<PracticalBooking, "id" | "bookedAt">) => void;
  upsertStain: (s: StainEntry) => void;
  removeStain: (id: string) => void;
  saveStain: (s: Omit<SavedStain, "id" | "savedAt">) => void;
  unsaveStain: (id: string) => void;
  addStainHistory: (h: Omit<StainHistory, "id" | "treatedAt">) => void;
};

export const useApp = create<State>()(
  persist(
    (set) => ({
      user: null,
      completed: {},
      vault: [],
      purchases: {},
      invoices: [],
      practicalBookings: [],
      stainCatalog: [],
      savedStains: [],
      stainHistory: [],
      stainMasterUnlocked: false,
      unlockStainMaster: ({ name, email, phone }) =>
        set((s) => ({
          stainMasterUnlocked: true,
          invoices: [
            {
              id: `INV-SM-${Date.now().toString(36).toUpperCase()}`,
              courseId: "stain-master",
              courseTitle: `Stain Master (lifetime) — ${name} · ${email} · ${phone}`,
              amount: 9999,
              date: Date.now(),
            },
            ...s.invoices,
          ],
        })),
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
      removeStain: (id) =>
        set((st) => ({ stainCatalog: st.stainCatalog.filter((x) => x.id !== id) })),
      saveStain: (s) =>
        set((st) => ({
          savedStains: [
            { ...s, id: `SAV-${Date.now().toString(36)}`, savedAt: Date.now() },
            ...st.savedStains,
          ],
        })),
      unsaveStain: (id) =>
        set((st) => ({ savedStains: st.savedStains.filter((x) => x.id !== id) })),
      addStainHistory: (h) =>
        set((st) => ({
          stainHistory: [
            { ...h, id: `HIS-${Date.now().toString(36)}`, treatedAt: Date.now() },
            ...st.stainHistory,
          ].slice(0, 50),
        })),
      setUser: (user) =>
        set((s) => {
          // Auto-grant demo student ownership of course c1 with sample invoice + vault
          if (user?.email === DEMO_STUDENT.email && !s.purchases["c1"]) {
            const demoVault: VaultItem[] = [
              { id: "v-demo-1", courseId: "c1", name: "Laundry Store Setup Checklist.pdf", kind: "pdf", size: 320_000, url: "#", addedAt: Date.now() },
              { id: "v-demo-2", courseId: "c1", name: "Equipment Costing Sheet.xlsx", kind: "xlsx", size: 48_000, url: "#", addedAt: Date.now() },
              { id: "v-demo-3", courseId: "c1", name: "Pricing Strategy Guide.pdf", kind: "pdf", size: 640_000, url: "#", addedAt: Date.now() },
            ];
            const existingIds = new Set(s.vault.map((v) => v.id));
            const mergedVault = [...demoVault.filter((v) => !existingIds.has(v.id)), ...s.vault];
            return {
              user,
              purchases: { ...s.purchases, c1: true },
              vault: mergedVault,
              invoices: [
                {
                  id: "INV-DEMO-0001",
                  courseId: "c1",
                  courseTitle: "Complete Guide to Start Laundry Store",
                  amount: 25500,
                  date: Date.now(),
                },
                ...s.invoices.filter((i) => i.id !== "INV-DEMO-0001"),
              ],
            };
          }
          return { user };
        }),
      signOut: () => set({ user: null }),
      toggleLesson: (id, value) =>
        set((s) => ({ completed: { ...s.completed, [id]: value } })),
      addVaultItems: (items) =>
        set((s) => ({ vault: [...items, ...s.vault] })),
      removeVaultItem: (id) =>
        set((s) => ({ vault: s.vault.filter((v) => v.id !== id) })),
      purchaseCourse: ({ courseId, courseTitle, amount }) =>
        set((s) => ({
          purchases: { ...s.purchases, [courseId]: true },
          invoices: [
            {
              id: `INV-${Date.now().toString(36).toUpperCase()}`,
              courseId,
              courseTitle,
              amount,
              date: Date.now(),
            },
            ...s.invoices,
          ],
        })),
      bookPractical: (b) =>
        set((s) => ({
          practicalBookings: [
            { ...b, id: `PRC-${Date.now().toString(36).toUpperCase()}`, bookedAt: Date.now() },
            ...s.practicalBookings,
          ],
        })),
    }),
    { name: "gilm-store" }
  )
);

// Practical-class capacity per month
export const PRACTICAL_SEATS_PER_MONTH = 25;
