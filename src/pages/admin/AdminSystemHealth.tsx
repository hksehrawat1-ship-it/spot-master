import { useMemo } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { HEALTH_LABEL, ADMIN_AREA_VERSION } from "@/data/adminWorkspace";
import { publicationAllowedByHealth, systemHealth } from "@/lib/adminEngine";
import { useAdmin } from "@/store/useAdmin";

export default function AdminSystemHealth() {
  const admin = useAdmin();
  const states = useMemo(
    () => systemHealth({
      safetyEngineAvailable: admin.safetyEngineAvailable,
      failedValidations: 0, failedMigrations: 0, unsyncedOffline: 0,
      lastBackupAt: new Date().toISOString(),
      appVersion: ADMIN_AREA_VERSION, ruleSetVersion: "safety-v1", contentRelease: "governance-v1",
    }),
    [admin.safetyEngineAvailable],
  );

  return (
    <AdminShell section="system_health" title="System health">
      <p className="mt-3 rounded-xl bg-secondary p-3 text-xs">
        Health details never expose keys, tokens or connection strings.
      </p>
      {!publicationAllowedByHealth(states) && (
        <p role="alert" className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-semibold text-destructive">
          Publication is blocked while a critical service is down.
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {states.map((s) => (
          <li key={s.check} className="rounded-xl border border-border bg-card p-3">
            <p className="text-sm font-semibold">{HEALTH_LABEL[s.check]} — {s.status.toUpperCase()}</p>
            <p className="text-xs text-muted-foreground">{s.detail}</p>
          </li>
        ))}
      </ul>
      <button
        onClick={() => admin.setSafetyEngineAvailable(!admin.safetyEngineAvailable)}
        className="mt-4 w-full rounded-full border border-border py-2.5 text-sm font-semibold"
      >
        Simulate safety engine {admin.safetyEngineAvailable ? "outage" : "recovery"}
      </button>
    </AdminShell>
  );
}
