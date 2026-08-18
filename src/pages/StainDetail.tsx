/** Database-backed stain detail page for the imported stain records. */

import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRightLeft, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import LegacyStainRecord from "@/pages/StainRecord";
import {
  NO_APPROVED_METHOD,
  OUTCOME_LABEL,
  riskFlags,
  stateFlags,
  useStainDetail,
  type StainDetail,
} from "@/hooks/useStainLibrary";

function Chip({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "warn" | "risk" }) {
  const cls =
    tone === "warn"
      ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
      : tone === "risk"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${cls}`}>{children}</span>;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function DetailView({ detail }: { detail: StainDetail }) {
  const { record, category, secondaryCategories, reroutes, aliases, sourceDocument } = detail;
  const flags = riskFlags(record);
  const states = stateFlags(record);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 pb-24">
      <Link
        to={category ? `/stain-categories/${category.slug}` : "/stain-categories"}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> {category ? category.canonical_name : "Stain categories"}
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight break-words">{record.canonical_name}</h1>
        <p className="text-xs text-muted-foreground break-all">{record.stable_id}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{OUTCOME_LABEL[record.initial_outcome_class]}</Badge>
          {category && <Chip>{category.canonical_name}</Chip>}
          {flags.map((f) => (
            <Chip key={f} tone="risk">{f}</Chip>
          ))}
        </div>
      </header>

      {record.hidden_test_required && (
        <Card className="border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Concealed test required</p>
              <p className="text-sm text-amber-900/90 dark:text-amber-200/90">
                Test on a hidden area before any treatment. Do not skip this step.
              </p>
            </div>
          </div>
        </Card>
      )}

      {record.mandatory_stop_or_reroute_trigger && (
        <Card className="border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-destructive">Mandatory stop / reroute trigger</p>
              <p className="text-sm">{record.mandatory_stop_or_reroute_trigger}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="space-y-3 p-4">
        <Field label="Primary category" value={category?.canonical_name ?? "Unassigned"} />
        {secondaryCategories.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Secondary categories
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {secondaryCategories.map((c) => (
                <Link key={c.id} to={`/stain-categories/${c.slug}`}>
                  <Chip>{c.canonical_name}</Chip>
                </Link>
              ))}
            </div>
          </div>
        )}
        <Field label="Typical chemistry" value={record.typical_chemistry ?? "Not recorded"} />
        <Field label="Dominant residue" value={record.dominant_residue ?? "Not recorded"} />
        <Field
          label="Initial outcome classification"
          value={OUTCOME_LABEL[record.initial_outcome_class]}
        />
        <Field
          label="Risk indicators"
          value={flags.length ? flags.join(" · ") : "No specific risk indicator recorded"}
        />
        <Field label="Hidden-test requirement" value={record.hidden_test_required ? "Required" : "Not required"} />
        <Field label="Condition states recorded" value={states.length ? states.join(" · ") : "None recorded"} />
        {record.physical_state && <Field label="Physical state" value={record.physical_state} />}
        {aliases.length > 0 && (
          <Field label="Also known as" value={aliases.map((a) => a.alias).join(", ")} />
        )}
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Reroute</p>
        {reroutes.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {reroutes.map((r) => (
                <Link
                  key={r.category.id}
                  to={`/stain-categories/${r.category.slug}`}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                >
                  <ArrowRightLeft className="h-3 w-3" aria-hidden />
                  {r.category.canonical_name}
                </Link>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Continue in the linked category before treating this stain.
            </p>
          </div>
        ) : record.reroute_pending ? (
          <p className="text-sm text-muted-foreground">
            A reroute is indicated for this record, but the destination category is still under review. Treat this
            stain as unresolved and stop for assessment.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">No reroute is recorded for this stain.</p>
        )}
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Treatment method</p>
        <p className="text-sm text-muted-foreground">{NO_APPROVED_METHOD}</p>
      </Card>

      <Card className="space-y-2 p-4 text-xs text-muted-foreground">
        <p>Source document: {sourceDocument ?? "Imported Stain Master category document"}</p>
        <p>Source section: {record.source_section ?? "Not recorded"}</p>
        <p>
          Review status: {record.review_status} · Publication status: {record.publication_status}
          {record.category_version ? ` · Category version ${record.category_version}` : ""}
        </p>
        <p>
          Identification and triage only. No chemical sequence, dilution, temperature, dwell time, product
          recommendation or guarantee of removal is implied.
        </p>
      </Card>
    </div>
  );
}

export default function StainDetailPage() {
  const { stainKey } = useParams();
  const { detail, loading } = useStainDetail(stainKey);

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading stain record…</div>;
  }

  // Imported records come from the database; older static records stay available as a fallback.
  if (!detail) return <LegacyStainRecord />;

  return <DetailView detail={detail} />;
}
