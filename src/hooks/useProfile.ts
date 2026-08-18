import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";

export type WorkingLevel = "retail" | "professional" | "master";

export type WorkspaceProfile = {
  id: string;
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  country: string | null;
  phone_country_code: string | null;
  phone_national_number: string | null;
  preferred_language: string | null;
  working_level: WorkingLevel | null;
  preferred_kits: string[];
  available_products: string[];
  measurement_units: string;
  currency_display: string;
  time_zone: string | null;
  marketing_consent: boolean;
  setup_step: number;
  setup_completed_at: string | null;
};

type State = {
  profile: WorkspaceProfile | null;
  loading: boolean;
  /** Fail closed: true when the profile could not be verified. */
  unavailable: boolean;
};

/**
 * The signed-in operator's workspace profile.
 * Preferences are server-backed; browser storage holds nothing authoritative.
 */
export function useProfile() {
  const { user, status } = useAuth();
  const [state, setState] = useState<State>({ profile: null, loading: true, unavailable: false });

  const load = useCallback(async () => {
    if (!user) {
      setState({ profile: null, loading: false, unavailable: false });
      return;
    }
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      setState({ profile: (data as unknown as WorkspaceProfile) ?? null, loading: false, unavailable: false });
    } catch {
      setState({ profile: null, loading: false, unavailable: true });
    }
  }, [user]);

  useEffect(() => {
    if (status === "loading") return;
    void load();
  }, [status, load]);

  const save = useCallback(
    async (patch: Partial<WorkspaceProfile>) => {
      if (!user) return { error: "Please sign in first." };
      const payload = { ...patch, user_id: user.id };
      const { error } = await supabase
        .from("profiles")
        .upsert(payload as never, { onConflict: "user_id" });
      if (error) return { error: "We could not save that just now. Please try again." };
      await load();
      return {};
    },
    [user, load],
  );

  return { ...state, reload: load, save };
}
