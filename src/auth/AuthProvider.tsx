import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { canAccessAdmin, hasPermission, type Permission } from "@/lib/permissions";

/**
 * Real authentication (Constitution R16, R17).
 * Session and identity come from Supabase; roles come from the protected user_roles table.
 * Nothing here reads roles from localStorage, Zustand, the URL or interface controls.
 */

export type AuthStatus = "loading" | "signed_out" | "signed_in" | "unavailable";

type AuthValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  roles: string[];
  rolesLoaded: boolean;
  /** true when the backend could not be reached — screens must fail closed. */
  backendUnavailable: boolean;
  isAdmin: boolean;
  can: (permission: Permission) => boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithPassword: (email: string, password: string, fullName: string, phone: string) => Promise<{ error?: string }>;
  /** Sends a one-time code to the email address, creating the account if needed. */
  sendEmailOtp: (email: string, fullName?: string, phone?: string) => Promise<{ error?: string }>;
  /** Verifies the emailed one-time code and starts the session. */
  verifyEmailOtp: (email: string, code: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const mounted = useRef(true);

  const loadRoles = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setRoles([]);
      setRolesLoaded(true);
      return;
    }
    try {
      // Give brand-new accounts their baseline access. The function can only ever
      // grant "domestic user" — privileged roles are never self-assignable.
      await supabase.rpc("ensure_default_role");
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if (error) throw error;
      if (!mounted.current) return;
      setRoles((data ?? []).map((r) => r.role as string));
      setBackendUnavailable(false);
    } catch {
      if (!mounted.current) return;
      // Fail closed: no roles when we cannot verify them.
      setRoles([]);
      setBackendUnavailable(true);
    } finally {
      if (mounted.current) setRolesLoaded(true);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? "signed_in" : "signed_out");
      setRolesLoaded(false);
      // Defer the database read out of the auth callback.
      setTimeout(() => void loadRoles(nextSession?.user?.id), 0);
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted.current) return;
        setSession(data.session);
        setStatus(data.session ? "signed_in" : "signed_out");
        void loadRoles(data.session?.user?.id);
      })
      .catch(() => {
        if (!mounted.current) return;
        setStatus("unavailable");
        setBackendUnavailable(true);
        setRolesLoaded(true);
      });

    return () => {
      mounted.current = false;
      sub.subscription.unsubscribe();
    };
  }, [loadRoles]);

  const value = useMemo<AuthValue>(() => {
    const user = session?.user ?? null;
    return {
      status,
      session,
      user,
      roles,
      rolesLoaded,
      backendUnavailable,
      isAdmin: canAccessAdmin(roles),
      can: (permission) => hasPermission(roles, permission),
      signInWithPassword: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        return error ? { error: friendlyAuthError(error.message) } : {};
      },
      signUpWithPassword: async (email, password, fullName, phone) => {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName, phone },
          },
        });
        return error ? { error: friendlyAuthError(error.message) } : {};
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setRoles([]);
      },
      sendEmailOtp: async (email, fullName, phone) => {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${window.location.origin}/`,
            data: fullName || phone ? { full_name: fullName, phone } : undefined,
          },
        });
        return error ? { error: friendlyAuthError(error.message) } : {};
      },
      verifyEmailOtp: async (email, code) => {
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: code.trim(),
          type: "email",
        });
        return error ? { error: friendlyAuthError(error.message) } : {};
      },
      refreshRoles: async () => loadRoles(session?.user?.id),
    };
  }, [status, session, roles, rolesLoaded, backendUnavailable, loadRoles]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Never leak backend wording to end users. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "That email address or password is not correct.";
  if (m.includes("already registered")) return "An account already exists for this email address. Please sign in.";
  if (m.includes("email not confirmed")) return "Please confirm your email address, then sign in.";
  if (m.includes("password")) return "Please use a password of at least 8 characters.";
  if (m.includes("rate") || m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  return "We could not complete that just now. Please try again.";
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
