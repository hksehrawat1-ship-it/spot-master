import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import ConfirmAction from "@/components/admin/ConfirmAction";
import { GOV_ROLES } from "@/data/governance";
import type { GovRole } from "@/data/governance";
import { canChangeUserRoles, expiredCompetencies, sectionsForUser } from "@/lib/adminEngine";
import { ADMIN_SECTION_META } from "@/data/adminWorkspace";
import { currentAdminUser, useAdmin } from "@/store/useAdmin";

export default function AdminUsers() {
  const admin = useAdmin();
  const actor = useAdmin(currentAdminUser);
  const [selected, setSelected] = useState(admin.users[0]?.userId ?? "");
  const [message, setMessage] = useState("");
  const [suspendOpen, setSuspendOpen] = useState(false);

  const target = admin.users.find((u) => u.userId === selected) ?? admin.users[0];
  const roleEditable = target ? canChangeUserRoles(actor, target) : { ok: false, message: "No user selected." };

  const toggleRole = (role: GovRole) => {
    if (!target) return;
    const next = target.roles.includes(role) ? target.roles.filter((r) => r !== role) : [...target.roles, role];
    const res = admin.setUserRoles(actor.userId, target.userId, next, "Role updated from user administration.");
    setMessage(res.message);
  };

  return (
    <AdminShell section="users" title="Users and access">
      <label htmlFor="user-pick" className="mt-3 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        User
      </label>
      <select
        id="user-pick"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
      >
        {admin.users.map((u) => (
          <option key={u.userId} value={u.userId}>{u.name} — {u.status}</option>
        ))}
      </select>

      {target && (
        <>
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <h2 className="font-serif text-base font-bold">{target.name}</h2>
            <p className="text-xs text-muted-foreground">{target.email} · {target.country} · {target.language}</p>
            <p className="mt-1 text-xs">Organization: {target.organizationId ?? "—"} · Status: <strong>{target.status}</strong></p>

            <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Roles</h3>
            {!roleEditable.ok && <p className="mt-1 text-xs text-destructive">{roleEditable.message}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {GOV_ROLES.map((role) => (
                <button
                  key={role}
                  disabled={!roleEditable.ok}
                  onClick={() => toggleRole(role)}
                  aria-pressed={target.roles.includes(role)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50 ${
                    target.roles.includes(role) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {role.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Competency</h3>
            <ul className="mt-1 space-y-1 text-xs">
              {target.competencies.map((c) => (
                <li key={c.name}>
                  {c.name} — expires {c.expiresAt.slice(0, 10)}
                  {expiredCompetencies(target).includes(c.name) && (
                    <span className="ml-1 font-semibold text-destructive">expired: related permissions removed</span>
                  )}
                </li>
              ))}
              {target.competencies.length === 0 && <li className="text-muted-foreground">None recorded.</li>}
            </ul>

            <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Effective access</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {sectionsForUser(target).map((s) => ADMIN_SECTION_META[s].label).join(", ") || "Dashboard only."}
            </p>

            <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Access history</h3>
            <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
              {target.accessHistory.slice(0, 6).map((h, i) => (
                <li key={i}>{h.at.slice(0, 16).replace("T", " ")} — {h.action} — {h.allowed ? "allowed" : "denied"}</li>
              ))}
              {target.accessHistory.length === 0 && <li>No recorded access yet.</li>}
            </ul>

            <button
              onClick={() => setSuspendOpen(true)}
              className="mt-4 w-full rounded-full border border-destructive/40 py-2 text-sm font-semibold text-destructive"
            >
              Suspend user
            </button>
          </div>

          <ConfirmAction
            action="suspend_user"
            open={suspendOpen}
            detail={`${target.name} will lose access immediately. Their authored content and review history are retained.`}
            onCancel={() => setSuspendOpen(false)}
            onConfirm={(reason) => {
              const res = admin.suspendUser(actor.userId, target.userId, reason, true);
              setMessage(res.message);
              setSuspendOpen(false);
            }}
          />
        </>
      )}

      {message && <p role="status" className="mt-3 rounded-xl bg-secondary p-3 text-sm">{message}</p>}
    </AdminShell>
  );
}
