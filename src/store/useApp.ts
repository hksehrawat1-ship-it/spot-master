import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = { name: string; email: string; role: "student" | "admin" } | null;

type State = {
  user: User;
  // lessonId -> completed
  completed: Record<string, boolean>;
  setUser: (u: User) => void;
  signOut: () => void;
  toggleLesson: (id: string, value: boolean) => void;
};

export const useApp = create<State>()(
  persist(
    (set) => ({
      user: null,
      completed: {},
      setUser: (user) => set({ user }),
      signOut: () => set({ user: null }),
      toggleLesson: (id, value) =>
        set((s) => ({ completed: { ...s.completed, [id]: value } })),
    }),
    { name: "gilm-store" }
  )
);

// Designate the master admin email here
export const ADMIN_EMAIL = "admin@gilm.in";
