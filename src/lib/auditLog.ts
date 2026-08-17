import { supabase } from "@/integrations/supabase/client";

/**
 * Server-backed administrative audit log (Constitution R11, R18).
 * Entries are append-only: no update or delete policy exists on the table.
 */

export type AdminAuditEntry = {
  action: string;
  targetType?: string;
  targetId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
};

export async function recordAdminAction(entry: AdminAuditEntry): Promise<{ ok: boolean }> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const actorId = userData?.user?.id;
    if (!actorId) return { ok: false };
    const { error } = await supabase.from("admin_audit_log").insert({
      actor_id: actorId,
      action: entry.action.slice(0, 120),
      target_type: entry.targetType?.slice(0, 80) ?? null,
      target_id: entry.targetId?.slice(0, 120) ?? null,
      reason: entry.reason?.slice(0, 500) ?? null,
      metadata: entry.metadata ?? {},
    });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

export async function readAdminAuditLog(limit = 100) {
  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("id, actor_id, action, target_type, target_id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { entries: [], unavailable: true as const };
  return { entries: data ?? [], unavailable: false as const };
}
