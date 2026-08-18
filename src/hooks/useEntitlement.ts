import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { PLAN_CODE } from "@/config/pricing";

export type AccessState = "loading" | "none" | "active" | "expired" | "unavailable";

export type Entitlement = {
  state: AccessState;
  accessEndsAt: string | null;
  accessStartsAt: string | null;
  refresh: () => Promise<void>;
};

/**
 * Paid access is decided by the server (subscriptions + has_active_access).
 * Nothing here reads entitlement from browser storage, and any failure fails closed.
 */
export function useEntitlement(): Entitlement {
  const { user, status } = useAuth();
  const [state, setState] = useState<AccessState>("loading");
  const [accessEndsAt, setEnds] = useState<string | null>(null);
  const [accessStartsAt, setStarts] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (status === "loading") return;
    if (!user) {
      setState("none");
      return;
    }
    try {
      const { data: active, error: rpcError } = await supabase.rpc("has_active_access", {
        _user_id: user.id,
      });
      if (rpcError) throw rpcError;

      const { data: row, error } = await supabase
        .from("subscriptions")
        .select("status, access_starts_at, access_ends_at")
        .eq("user_id", user.id)
        .eq("plan_code", PLAN_CODE)
        .maybeSingle();
      if (error) throw error;

      setStarts(row?.access_starts_at ?? null);
      setEnds(row?.access_ends_at ?? null);

      if (active) setState("active");
      else if (row && (row.status === "expired" || (row.access_ends_at && new Date(row.access_ends_at) <= new Date())))
        setState("expired");
      else setState("none");
    } catch {
      setState("unavailable");
    }
  }, [user, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, accessEndsAt, accessStartsAt, refresh };
}
