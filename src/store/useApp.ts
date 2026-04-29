import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = { name: string; email: string; role: "student" | "admin" } | null;

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

type State = {
  user: User;
  // lessonId -> completed
  completed: Record<string, boolean>;
  vault: VaultItem[];
  // courseId -> owned
  purchases: Record<string, boolean>;
  invoices: Invoice[];
  practicalBookings: PracticalBooking[];
  setUser: (u: User) => void;
  signOut: () => void;
  toggleLesson: (id: string, value: boolean) => void;
  addVaultItems: (items: VaultItem[]) => void;
  removeVaultItem: (id: string) => void;
  purchaseCourse: (p: { courseId: string; courseTitle: string; amount: number }) => void;
  bookPractical: (b: Omit<PracticalBooking, "id" | "bookedAt">) => void;
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
      setUser: (user) =>
        set((s) => {
          // Auto-grant demo student ownership of course c1 with a sample invoice
          if (user?.email === DEMO_STUDENT.email && !s.purchases["c1"]) {
            return {
              user,
              purchases: { ...s.purchases, c1: true },
              invoices: [
                {
                  id: "INV-DEMO-0001",
                  courseId: "c1",
                  courseTitle: "Complete Guide to Start Laundry Store",
                  amount: 25500,
                  date: Date.now(),
                },
                ...s.invoices,
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

// Designate the master admin email here
export const ADMIN_EMAIL = "admin@gilm.in";

// Demo student account (one-tap sign in on the SignIn screen)
export const DEMO_STUDENT = {
  name: "Himanshu Sehrawat",
  email: "gilm@google.com",
  otp: "123456",
};
