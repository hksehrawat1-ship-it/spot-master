import AdminShell from "@/components/admin/AdminShell";
import { useGovernance } from "@/store/useGovernance";

export default function AdminTranslations() {
  const gov = useGovernance();
  return (
    <AdminShell section="translations" title="Translations">
      <p className="mt-3 rounded-xl bg-secondary p-3 text-xs">
        Safety terms must not be localized loosely. A major source change suspends the translation until a technical reviewer
        re-approves it.
      </p>
      <ul className="mt-4 space-y-2">
        {gov.translations.map((t) => (
          <li key={t.translationId} className="rounded-xl border border-border bg-card p-3">
            <p className="text-sm font-semibold">{t.sourceRecordId} → {t.language.toUpperCase()} ({t.country})</p>
            <p className="text-xs text-muted-foreground">
              source v{t.sourceVersion} · status {t.status.replace(/_/g, " ")} · translator {t.translator}
            </p>
            {t.status !== "published" && (
              <p className="mt-1 text-[11px] font-semibold text-amber-700">Not delivered to users while unpublished.</p>
            )}
          </li>
        ))}
        {gov.translations.length === 0 && <li className="text-sm text-muted-foreground">No translations registered yet.</li>}
      </ul>
    </AdminShell>
  );
}
