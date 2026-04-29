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

type State = {
  user: User;
  // lessonId -> completed
  completed: Record<string, boolean>;
  vault: VaultItem[];
  setUser: (u: User) => void;
  signOut: () => void;
  toggleLesson: (id: string, value: boolean) => void;
  addVaultItems: (items: VaultItem[]) => void;
  removeVaultItem: (id: string) => void;
};

export const useApp = create<State>()(
  persist(
    (set) => ({
      user: null,
      completed: {},
      vault: [],
      setUser: (user) => set({ user }),
      signOut: () => set({ user: null }),
      toggleLesson: (id, value) =>
        set((s) => ({ completed: { ...s.completed, [id]: value } })),
      addVaultItems: (items) =>
        set((s) => ({ vault: [...items, ...s.vault] })),
      removeVaultItem: (id) =>
        set((s) => ({ vault: s.vault.filter((v) => v.id !== id) })),
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
