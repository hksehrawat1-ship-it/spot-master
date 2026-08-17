import AdminShell from "@/components/admin/AdminShell";
import { useAdmin } from "@/store/useAdmin";

export default function AdminCountries() {
  const admin = useAdmin();
  return (
    <AdminShell section="countries" title="Countries">
      <ul className="mt-4 space-y-2">
        {admin.countries.map((c) => (
          <li key={c.code} className="rounded-xl border border-border bg-card p-3">
            <p className="text-sm font-semibold">{c.name} ({c.code}) — {c.status}</p>
            <p className="text-xs text-muted-foreground">
              Languages {c.languages.join(", ")} · {c.units} units · reviewers {c.countryReviewers.join(", ") || "none"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Emergency: {c.emergencyInfo}</p>
            <p className="text-[11px] text-muted-foreground">Regulatory: {c.regulatoryNotes}</p>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
