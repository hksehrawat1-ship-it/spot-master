import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { adminAnalytics, cardLink, cardTone, dashboardCards, sectionsForUser } from "@/lib/adminEngine";
import { ADMIN_SECTION_META } from "@/data/adminWorkspace";
import { currentAdminUser, useAdmin } from "@/store/useAdmin";
import { useGovernance } from "@/store/useGovernance";
import { useOutcomes } from "@/store/useOutcomes";

const TONE_CLASS: Record<string, string> = {
  neutral: "border-border bg-card",
  attention: "border-amber-300 bg-amber-50",
  critical: "border-destructive/40 bg-destructive/10",
};

export default function AdminDashboard() {
  const gov = useGovernance();
  const admin = useAdmin();
  const user = useAdmin(currentAdminUser);
  const outcomes = useOutcomes();

  useEffect(() => { if (!gov.seeded) gov.seed(); }, [gov]);

  const allowed = useMemo(() => sectionsForUser(user), [user]);

  const cards = useMemo(
    () =>
      dashboardCards({
        records: gov.records,
        documents: gov.documents,
        translations: gov.translations,
        mappingsAwaitingReview: 0,
        unrankedComparisons: 0,
        adverseOutcomes: outcomes.adverse.length,
        hazardReports: outcomes.adverse.filter((a) => a.severity >= 4).length,
        repeatedFailures: 0,
        pendingReleases: gov.releases.filter((r) => r.deployment === "pending").length,
        systemWarnings: admin.safetyEngineAvailable ? 0 : 1,
        reviewerId: user.userId,
      }).filter((c) => allowed.includes(c.section)),
    [gov.records, gov.documents, gov.translations, gov.releases, outcomes.adverse, admin.safetyEngineAvailable, user.userId, allowed],
  );

  const analytics = useMemo(
    () => adminAnalytics({
      records: gov.records, documents: gov.documents, translations: gov.translations,
      importErrors: admin.imports.reduce((n, b) => n + b.rejected, 0),
      permissionDenials: admin.permissionDenials,
    }),
    [gov.records, gov.documents, gov.translations, admin.imports, admin.permissionDenials],
  );

  const openTasks = admin.setupTasks.filter((t) => t.open);

  return (
    <AdminShell section="dashboard" title="Administration workspace">
      {!admin.safetyEngineAvailable && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-semibold text-destructive">
          Safety engine unavailable — publication and live guidance are blocked until it recovers.
        </p>
      )}

      <section aria-labelledby="queues" className="mt-4">
        <h2 id="queues" className="font-serif text-base font-bold">Work queues</h2>
        <p className="text-xs text-muted-foreground">Every count links to the exact filtered list. Zero means the queue is clear.</p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {cards.map((card) => (
            <li key={card.key}>
              <Link to={cardLink(card)} className={`block h-full rounded-xl border p-3 ${TONE_CLASS[cardTone(card)]}`}>
                <span className="flex items-center gap-1 text-xl font-bold">
                  {card.count}
                  {card.count === 0 && <CheckCircle2 aria-hidden className="h-4 w-4 text-emerald-600" />}
                </span>
                <span className="mt-0.5 block text-xs font-semibold leading-tight">{card.label}</span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">{ADMIN_SECTION_META[card.section].label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="setup" className="mt-5">
        <h2 id="setup" className="font-serif text-base font-bold">Setup checklist</h2>
        <ul className="mt-2 space-y-2">
          {openTasks.length === 0 && <li className="text-sm text-muted-foreground">All setup tasks are complete.</li>}
          {openTasks.map((t) => (
            <li key={t.taskId} className="rounded-xl border border-border bg-card p-3">
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.detail}</p>
              <button
                onClick={() => admin.closeSetupTask(t.taskId, user.userId, "Completed from dashboard checklist.")}
                className="mt-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Mark complete
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="analytics" className="mt-5">
        <h2 id="analytics" className="font-serif text-base font-bold">Operational analytics</h2>
        <p className="text-xs text-muted-foreground">Advisory only — analytics never change an approval decision.</p>
        <dl className="mt-2 grid grid-cols-2 gap-2">
          {Object.entries(analytics).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border bg-card p-3">
              <dt className="text-[11px] capitalize text-muted-foreground">{k.replace(/([A-Z])/g, " $1")}</dt>
              <dd className="text-lg font-bold">{v}{k === "dataCompleteness" ? "%" : ""}</dd>
            </div>
          ))}
        </dl>
      </section>
    </AdminShell>
  );
}
