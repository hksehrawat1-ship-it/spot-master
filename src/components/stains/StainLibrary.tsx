import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  OUTCOME_LABEL,
  OUTCOME_TONE,
  PENDING_CATEGORIES,
  riskFlags,
  rerouteLabel,
  useStainCategories,
  useStainCategoryRecords,
  useStainSearch,
  type StainRecordRow,
} from "@/hooks/useStainLibrary";

const CATEGORY_ICON: Record<number, string> = {
  1: "🧪", 2: "🛢️", 3: "💧", 4: "🍵", 5: "🥚", 6: "🪨",
  7: "🎨", 8: "🎽", 9: "🌗", 10: "🔥", 11: "🔩", 12: "⚠️",
};

function Chip({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "warn" | "risk" }) {
  const cls =
    tone === "warn"
      ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
      : tone === "risk"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${cls}`}>{children}</span>;
}

export function StainRecordCard({ rec, categoryName }: { rec: StainRecordRow; categoryName?: string }) {
  const [open, setOpen] = useState(false);
  const reroute = rerouteLabel(rec);
  const flags = riskFlags(rec);
  return (
    <Card className="p-4">
      <button
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="font-semibold">{rec.canonical_name}</p>
          {categoryName && <p className="text-xs text-muted-foreground">{categoryName}</p>}
          {rec.typical_chemistry && (
            <p className="mt-0.5 text-xs text-muted-foreground">{rec.typical_chemistry}</p>
          )}
        </div>
        <Badge variant="secondary" className="shrink-0">
          {OUTCOME_LABEL[rec.initial_outcome_class]}
        </Badge>
      </button>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Chip tone={OUTCOME_TONE[rec.initial_outcome_class]}>{OUTCOME_LABEL[rec.initial_outcome_class]}</Chip>
        {flags.map((f) => (
          <Chip key={f} tone="risk">{f}</Chip>
        ))}
        {reroute && <Chip tone="warn">{reroute}</Chip>}
      </div>

      {open && (
        <div className="mt-3 space-y-2 border-t pt-3 text-sm">
          {rec.mandatory_stop_or_reroute_trigger && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mandatory stop / reroute trigger
              </p>
              <p>{rec.mandatory_stop_or_reroute_trigger}</p>
            </div>
          )}
          {rec.source_section && (
            <p className="text-xs text-muted-foreground">Source section: {rec.source_section}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Identification and triage only. No chemical sequence, product or guarantee of removal is implied.
          </p>
        </div>
      )}
    </Card>
  );
}

export function StainLibraryIndex() {
  const { categories, counts, loading } = useStainCategories();
  const [query, setQuery] = useState("");
  const { hits, active } = useStainSearch(query);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          className="pl-9"
          placeholder="Search stains by name or alternative name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search stains by name"
        />
      </div>

      {active && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{hits.length} match(es)</p>
          {hits.map((h) => (
            <StainRecordCard key={h.id} rec={h} categoryName={h.categoryName} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {categories.map((c) => (
          <Link key={c.id} to={`/stain-categories/${c.slug}`} className="block">
            <Card className="h-full p-4 transition-colors hover:bg-accent">
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden>{CATEGORY_ICON[c.category_number] ?? "🔬"}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.canonical_name}</p>
                  {c.short_description && (
                    <p className="text-xs text-muted-foreground">{c.short_description}</p>
                  )}
                  <div className="mt-2">
                    <Chip>
                      {counts[c.id] ?? 0} stain record{(counts[c.id] ?? 0) === 1 ? "" : "s"}
                    </Chip>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {!loading &&
          PENDING_CATEGORIES.map((p) => (
            <Card key={p.category_number} className="h-full border-dashed p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden>{CATEGORY_ICON[p.category_number]}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.canonical_name}</p>
                  <p className="text-xs text-muted-foreground">Data update pending</p>
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}

export function StainLibraryCategoryDetail({ slug }: { slug: string }) {
  const { category, records, loading } = useStainCategoryRecords(slug);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? records.filter((r) => r.canonical_name.toLowerCase().includes(q)) : records;

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading stain records…</div>;
  if (!category) return <div className="p-4 text-sm text-muted-foreground">Category not found.</div>;

  return (
    <div className="space-y-4 p-4 pb-24">
      <Link to="/stain-categories" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All categories
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>{CATEGORY_ICON[category.category_number] ?? "🔬"}</span>
          <h1 className="text-2xl font-bold tracking-tight">{category.canonical_name}</h1>
        </div>
        {category.short_description && <p className="mt-1 text-sm">{category.short_description}</p>}
        <p className="mt-2 text-xs text-muted-foreground">
          {records.length} stain record{records.length === 1 ? "" : "s"} in this category
        </p>
      </header>

      {category.core_rule && (
        <Card className="border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700 dark:text-amber-300" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Core rule</p>
              <p className="text-sm text-amber-900/90 dark:text-amber-200/90">{category.core_rule}</p>
            </div>
          </div>
        </Card>
      )}

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

      <div className="space-y-2">
        {shown.map((r) => (
          <StainRecordCard key={r.id} rec={r} />
        ))}
      </div>

      {category.routing_note && (
        <p className="text-xs text-muted-foreground">{category.routing_note}</p>
      )}
    </div>
  );
}
