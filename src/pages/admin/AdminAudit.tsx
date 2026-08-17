import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdmin } from "@/store/useAdmin";
import { useGovernance } from "@/store/useGovernance";

export default function AdminAudit() {
  const gov = useGovernance();
  const admin = useAdmin();
  const [q, setQ] = useState("");

  const entries = useMemo(() => {
    const rows = [
      ...gov.audit.map((a) => ({ id: a.id, at: a.at, who: a.user, action: a.action, target: a.recordId ?? "—", reason: a.reason ?? "" })),
      ...admin.audit.map((a) => ({ id: a.id, at: a.at, who: a.actor, action: a.action, target: a.target ?? "—", reason: a.reason ?? "" })),
    ].sort((a, b) => b.at.localeCompare(a.at));
    const needle = q.toLowerCase().trim();
    return needle ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(needle)) : rows;
  }, [gov.audit, admin.audit, q]);

  return (
    <AdminShell section="audit" title="Audit history">
      <p className="mt-3 rounded-xl bg-secondary p-3 text-xs">
        The audit log is append-only. Entries cannot be edited or deleted by any role.
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Filter audit entries"
        placeholder="Filter by user, action or record"
        className="mt-3 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
      />
      <ul className="mt-3 space-y-2">
        {entries.slice(0, 100).map((e) => (
          <li key={e.id} className="rounded-xl border border-border bg-card p-3 text-xs">
            <p className="font-semibold">{e.action}</p>
            <p className="text-muted-foreground">{e.at.slice(0, 19).replace("T", " ")} · {e.who} · {e.target}</p>
            {e.reason && <p className="mt-1">Reason: {e.reason}</p>}
          </li>
        ))}
        {entries.length === 0 && <li className="text-sm text-muted-foreground">No audit entries match.</li>}
      </ul>
    </AdminShell>
  );
}
