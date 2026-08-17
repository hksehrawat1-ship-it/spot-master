import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import { inventoryForViewer } from "@/lib/adminEngine";
import { currentAdminUser, useAdmin } from "@/store/useAdmin";

export default function AdminOrganizations() {
  const admin = useAdmin();
  const viewer = useAdmin(currentAdminUser);
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "inventory" ? "inventory" : "organizations";
  const [orgId, setOrgId] = useState(admin.organizations[0]?.organizationId ?? "");

  const visibleInventory = useMemo(() => inventoryForViewer(admin.inventory, viewer), [admin.inventory, viewer]);
  const org = admin.organizations.find((o) => o.organizationId === orgId);

  return (
    <AdminShell section={tab === "inventory" ? "inventory" : "organizations"} title="Organizations and inventory">
      <div role="tablist" aria-label="Organization views" className="mt-3 flex gap-2">
        {(["organizations", "inventory"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setParams(t === "inventory" ? { tab: "inventory" } : {})}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "organizations" ? (
        <>
          <label htmlFor="org-pick" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Organization
          </label>
          <select
            id="org-pick"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            {admin.organizations.map((o) => (
              <option key={o.organizationId} value={o.organizationId}>{o.name}</option>
            ))}
          </select>

          {org && (
            <div className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-4">
              <h2 className="font-serif text-base font-bold">{org.name}</h2>
              <p className="text-xs text-muted-foreground">{org.country} · {org.locations.join(", ")}</p>
              <Field label="Processes" value={org.processes.join(", ")} />
              <Field label="PPE available" value={org.ppeAvailable.join(", ")} />
              <Field label="Equipment" value={org.equipment.join(", ")} />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={org.settings.allowDomesticGuidance}
                  onChange={(e) =>
                    admin.upsertOrganization(
                      { ...org, settings: { ...org.settings, allowDomesticGuidance: e.target.checked } },
                      viewer.userId,
                    )
                  }
                />
                Allow domestic guidance for staff accounts
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={org.settings.requireSupervisorForRed}
                  onChange={(e) =>
                    admin.upsertOrganization(
                      { ...org, settings: { ...org.settings, requireSupervisorForRed: e.target.checked } },
                      viewer.userId,
                    )
                  }
                />
                Require supervisor confirmation for red-risk treatments
              </label>
              <p className="text-[11px] text-muted-foreground">
                Organization settings can restrict guidance further but can never widen it beyond the safety engine.
              </p>
            </div>
          )}
        </>
      ) : (
        <ul className="mt-4 space-y-2">
          {visibleInventory.map((item) => (
            <li key={item.itemId} className="rounded-xl border border-border bg-card p-3">
              <p className="text-sm font-semibold">{item.productId} · v{item.productVersion}</p>
              <p className="text-xs text-muted-foreground">
                {item.packSize} · qty {item.quantity} · batch {item.batch ?? "—"} · expiry {item.expiry ?? "—"}
              </p>
              <p className="mt-1 text-xs">
                {item.approvedForUse ? "Approved for use" : "Not approved — documentation incomplete"}
                {item.documentsAvailable.length === 0 && " (no label, SDS or TDS on file)"}
              </p>
            </li>
          ))}
          {visibleInventory.length === 0 && (
            <li className="text-sm text-muted-foreground">No inventory visible for your organization.</li>
          )}
        </ul>
      )}
    </AdminShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-xs">
      <span className="font-semibold uppercase tracking-wide text-muted-foreground">{label}: </span>
      {value || "—"}
    </p>
  );
}
