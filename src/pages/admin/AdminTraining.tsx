import AdminShell from "@/components/admin/AdminShell";
import StatusBadge from "@/components/admin/StatusBadge";
import { currentAdminUser, useAdmin } from "@/store/useAdmin";

export default function AdminTraining() {
  const admin = useAdmin();
  const user = useAdmin(currentAdminUser);

  return (
    <AdminShell section="training" title="Training and competency">
      <p className="mt-3 rounded-xl bg-secondary p-3 text-xs">
        Every module must reference an approved knowledge version. Training content cannot invent a procedure that the knowledge
        base has not approved.
      </p>

      <ul className="mt-4 space-y-2">
        {admin.training.map((m) => (
          <li key={m.moduleId} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.competency} · trainer {m.trainer}</p>
              </div>
              <StatusBadge status={m.status} />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Knowledge version {m.knowledgeVersionRef} · countries {m.countries.join(", ")} · expires after {m.expiryMonths} months
            </p>
            <p className="text-[11px] text-muted-foreground">
              Product families: {m.productFamilies.join(", ") || "—"} · Equipment: {m.equipment.join(", ") || "—"}
            </p>
            <button
              onClick={() => admin.upsertTraining({ ...m, status: m.status === "published" ? "needs_review" : m.status }, user.userId)}
              className="mt-2 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold"
            >
              Flag for review after knowledge change
            </button>
          </li>
        ))}
      </ul>

      <section aria-labelledby="competency" className="mt-5">
        <h2 id="competency" className="font-serif text-base font-bold">Competency register</h2>
        <ul className="mt-2 space-y-2">
          {admin.users.map((u) => (
            <li key={u.userId} className="rounded-xl border border-border bg-card p-3 text-xs">
              <p className="text-sm font-semibold">{u.name}</p>
              {u.competencies.length === 0 ? (
                <p className="text-muted-foreground">No competencies recorded.</p>
              ) : (
                u.competencies.map((c) => (
                  <p key={c.name} className={c.expiresAt < new Date().toISOString() ? "text-destructive" : ""}>
                    {c.name} — expires {c.expiresAt.slice(0, 10)}
                  </p>
                ))
              )}
              <p className="mt-1 text-muted-foreground">Completed: {u.trainingCompleted.join(", ") || "—"}</p>
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}
