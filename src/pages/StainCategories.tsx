import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Flame, HelpCircle, Search, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CONDITION_TAGS, PRIMARY_CATEGORIES, RISK_TAGS, SOURCE_TYPES, TAG_LABEL,
  type ComponentKey, type ConditionTagKey, type PrimaryCategoryKey, type RiskTagKey,
  type SourceTypeKey, COMPONENTS, COMPONENT_LABEL, SOURCE_TYPE_LABEL, EVIDENCE_LABEL,
  RELEVANCE_LABEL, CATEGORY_BY_KEY,
} from "@/data/taxonomy";
import { categoryCounts, filterLibrary, sourcesForCategory } from "@/lib/classification";
import { StainLibraryIndex, StainLibraryCategoryDetail } from "@/components/stains/StainLibrary";
import type { LibraryClassification } from "@/data/stainClassifications";

/* ------------------------------------------------------------------ */

function Chip({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "warn" | "risk" }) {
  const cls =
    tone === "warn"
      ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
      : tone === "risk"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${cls}`}>{children}</span>;
}

function StainRow({ rec }: { rec: LibraryClassification }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-4">
      <button
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div>
          <p className="font-semibold">{rec.name}</p>
          <p className="text-xs text-muted-foreground">{rec.plain}</p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {rec.primary ? CATEGORY_BY_KEY[rec.primary].name : "Damage diagnosis"}
        </Badge>
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t pt-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why this category</p>
            <p className="text-sm">{rec.primaryReason}</p>
          </div>
          {rec.components.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Components</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {rec.components.map((c) => (
                  <Chip key={c.key}>
                    {COMPONENT_LABEL[c.key]} · {RELEVANCE_LABEL[c.relevance]} · {c.confidence}/10
                  </Chip>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {rec.sources.map((s) => (
              <Chip key={s}>{SOURCE_TYPE_LABEL[s]}</Chip>
            ))}
            {rec.conditionTags.map((t) => (
              <Chip key={t} tone="warn">{TAG_LABEL[t]}</Chip>
            ))}
            {rec.riskTags.map((t) => (
              <Chip key={t} tone="risk">{TAG_LABEL[t]}</Chip>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Evidence: {EVIDENCE_LABEL[rec.evidence]} · Category confidence {rec.primaryConfidence}/10 ·
            Version {rec.version} · Reviewed {rec.reviewDate}
          </p>
          {rec.needsReview && (
            <p className="rounded-lg bg-amber-100 p-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Flagged for reviewer attention: {rec.reviewNote}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Treatment methods and products are not part of this step.
          </p>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function CategoryIndex() {
  return (
    <div className="space-y-4 p-4 pb-24">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Stain categories</h1>
        <p className="text-sm text-muted-foreground">
          Twelve permanent categories. They describe what a stain is made of, not which product to use.
        </p>
      </header>

      <StainLibraryIndex />



      <Card className="border-dashed p-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="mt-0.5 h-5 w-5 text-muted-foreground" aria-hidden />
          <div>
            <p className="font-semibold">Not sure what the stain is?</p>
            <p className="text-xs text-muted-foreground">
              Unknown stains stay unknown. They are never forced into a chemistry to unlock later steps.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link to="/stain-id"><Button size="sm" variant="outline">Identify the stain</Button></Link>
              <Link to="/classify"><Button size="sm">Classify this case</Button></Link>
            </div>
          </div>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        An icon is a visual aid only. It never proves what a stain is made of.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CategoryDetail({ categoryKey }: { categoryKey: PrimaryCategoryKey }) {
  const category = CATEGORY_BY_KEY[categoryKey];
  const counts = categoryCounts();
  const [query, setQuery] = useState("");
  const [component, setComponent] = useState<ComponentKey | "all">("all");
  const [source, setSource] = useState<SourceTypeKey | "all">("all");
  const [condition, setCondition] = useState<ConditionTagKey | "all">("all");
  const [risk, setRisk] = useState<RiskTagKey | "all">("all");

  const records = useMemo(
    () => filterLibrary({ query, category: categoryKey, component, source, condition, risk }),
    [query, categoryKey, component, source, condition, risk],
  );
  const relatedSources = sourcesForCategory(categoryKey);

  return (
    <div className="space-y-4 p-4 pb-24">
      <Link to="/stain-categories" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All categories
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>{category.icon}</span>
          <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
        </div>
        <p className="mt-1 text-sm">{category.plain}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {counts[categoryKey]} published stain{counts[categoryKey] === 1 ? "" : "s"} in this category
        </p>
      </header>

      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Common examples</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {category.examples.map((e) => <Chip key={e}>{e}</Chip>)}
        </div>
      </Card>

      <Card className="border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700 dark:text-amber-300" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Important limitation</p>
            <p className="text-sm text-amber-900/90 dark:text-amber-200/90">{category.limitation}</p>
          </div>
        </div>
      </Card>

      {category.heatWarning && (
        <Card className="border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-start gap-2">
            <Flame className="mt-0.5 h-4 w-4 text-destructive" aria-hidden />
            <p className="text-sm">{category.heatWarning}</p>
          </div>
        </Card>
      )}

      {category.technicalOnly && (
        <Card className="border-destructive/40 p-4">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-destructive" aria-hidden />
            <p className="text-sm">
              This is a technical classification for reviewed professional cases. It is not permission to use any
              chemistry, and it is never shown as an action to domestic users.
            </p>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            className="pl-9"
            placeholder="Search inside this category"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search inside this category"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs">
            <span className="text-muted-foreground">Component</span>
            <select
              className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"
              value={component}
              onChange={(e) => setComponent(e.target.value as ComponentKey | "all")}
            >
              <option value="all">Any component</option>
              {COMPONENTS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </label>
          <label className="text-xs">
            <span className="text-muted-foreground">Source</span>
            <select
              className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"
              value={source}
              onChange={(e) => setSource(e.target.value as SourceTypeKey | "all")}
            >
              <option value="all">Any source</option>
              {SOURCE_TYPES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
          <label className="text-xs">
            <span className="text-muted-foreground">Condition</span>
            <select
              className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"
              value={condition}
              onChange={(e) => setCondition(e.target.value as ConditionTagKey | "all")}
            >
              <option value="all">Any condition</option>
              {CONDITION_TAGS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
          <label className="text-xs">
            <span className="text-muted-foreground">Risk or handling</span>
            <select
              className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"
              value={risk}
              onChange={(e) => setRisk(e.target.value as RiskTagKey | "all")}
            >
              <option value="all">Any handling tag</option>
              {RISK_TAGS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        {records.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground">
            No published stains match these filters yet.
          </Card>
        ) : (
          records.map((r) => <StainRow key={r.key} rec={r} />)
        )}
      </div>

      {relatedSources.length > 0 && (
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Related source types</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {relatedSources.map((s) => <Chip key={s}>{SOURCE_TYPE_LABEL[s]}</Chip>)}
          </div>
        </Card>
      )}

      <Card className="border-dashed p-4">
        <p className="font-semibold">Stain does not fit this category?</p>
        <p className="text-xs text-muted-foreground">
          Record it as Combination or Unknown rather than choosing the closest-looking chemistry.
        </p>
        <Link to="/classify" className="mt-2 inline-block">
          <Button size="sm" variant="outline">Unknown stain route</Button>
        </Link>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function StainCategories() {
  const { categoryKey } = useParams<{ categoryKey: string }>();
  const legacy = PRIMARY_CATEGORIES.some((c) => c.key === categoryKey);
  if (categoryKey && legacy) return <CategoryDetail categoryKey={categoryKey as PrimaryCategoryKey} />;
  if (categoryKey) return <StainLibraryCategoryDetail slug={categoryKey} />;
  return <CategoryIndex />;
}
