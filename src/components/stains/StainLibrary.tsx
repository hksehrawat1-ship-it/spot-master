import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  OUTCOME_LABEL,
  OUTCOME_TONE,
  PAGE_SIZE,
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

/** Every imported record opens its database-backed detail page. */
export function StainRecordCard({ rec, categoryName }: { rec: StainRecordRow; categoryName?: string }) {
  const reroute = rerouteLabel(rec);
  const flags = riskFlags(rec);
  return (
    <Card className="p-4 transition-colors hover:bg-accent">
      <Link to={`/stain/${rec.stable_id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold break-words">{rec.canonical_name}</p>
            {categoryName && <p className="text-xs text-muted-foreground">{categoryName}</p>}
            {rec.typical_chemistry && (
              <p className="mt-0.5 text-xs text-muted-foreground break-words">{rec.typical_chemistry}</p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0">
            {OUTCOME_LABEL[rec.initial_outcome_class]}
          </Badge>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip tone={OUTCOME_TONE[rec.initial_outcome_class]}>{OUTCOME_LABEL[rec.initial_outcome_class]}</Chip>
          {flags.map((f) => (
            <Chip key={f} tone="risk">{f}</Chip>
          ))}
          {reroute && <Chip tone="warn">{reroute}</Chip>}
        </div>
      </Link>
    </Card>
  );
}

function UnknownChemicalNotice() {
  return (
    <Card className="border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-destructive">Unknown chemical — stop and assess</p>
          <p className="text-sm">
            An unknown chemical is not guessed into a stain type. Stop, isolate the garment, ventilate the area and
            record what is known about the exposure before any treatment.
          </p>
          <Link
            to="/stain-categories/chemical-stains-fabric-damage"
            className="inline-block text-sm font-medium text-primary underline"
          >
            Open Chemical Stains / Fabric Damage
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function StainLibraryIndex() {
  const { categories, counts, loading, error } = useStainCategories();
  const [query, setQuery] = useState("");
  const search = useStainSearch(query);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          className="pl-9"
          placeholder="Search stains by name, alternative name or ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search stains by name"
        />
      </div>

      {search.active && (
        <div className="space-y-2">
          {search.unknownChemical && <UnknownChemicalNotice />}
          {search.error && <p className="text-sm text-destructive">Search is unavailable right now.</p>}
          {search.searching && search.hits.length === 0 && (
            <p className="text-xs text-muted-foreground">Searching…</p>
          )}
          {!search.searching && !search.error && search.total === 0 && (
            <p className="text-sm text-muted-foreground">
              No stain record matches that term. Try the canonical name, an alternative name, or browse the
              categories below.
            </p>
          )}
          {search.total > 0 && (
            <p className="text-xs text-muted-foreground">
              {search.total} result{search.total === 1 ? "" : "s"} · showing {search.hits.length}
            </p>
          )}
          {search.hits.map((h) => (
            <StainRecordCard key={h.id} rec={h} categoryName={h.categoryName} />
          ))}
          {search.hasMore && (
            <Button variant="outline" className="w-full" onClick={search.loadMore} disabled={search.searching}>
              {search.searching ? "Loading…" : `Load more (${search.total - search.hits.length} remaining)`}
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">The stain library could not be loaded.</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading categories…</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {categories.map((c) => (
          <Link key={c.id} to={`/stain-categories/${c.slug}`} className="block">
            <Card className="h-full p-4 transition-colors hover:bg-accent">
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden>{CATEGORY_ICON[c.category_number] ?? "🔬"}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold break-words">{c.canonical_name}</p>
                  {c.short_description && (
                    <p className="text-xs text-muted-foreground break-words">{c.short_description}</p>
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
  const { category, records, total, loading, loadingMore, error, loadMore, hasMore } =
    useStainCategoryRecords(slug);
  const [query, setQuery] = useState("");
  const search = useStainSearch(query);

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading stain records…</div>;
  if (error) return <div className="p-4 text-sm text-destructive">This category could not be loaded.</div>;
  if (!category) return <div className="p-4 text-sm text-muted-foreground">Category not found.</div>;

  const inCategory = search.hits.filter((h) => h.primary_category_id === category.id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 pb-24">
      <Link to="/stain-categories" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All categories
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>{CATEGORY_ICON[category.category_number] ?? "🔬"}</span>
          <h1 className="text-2xl font-bold tracking-tight break-words">{category.canonical_name}</h1>
        </div>
        {category.short_description && <p className="mt-1 text-sm">{category.short_description}</p>}
        <p className="mt-2 text-xs text-muted-foreground">
          {total} stain record{total === 1 ? "" : "s"} in this category
        </p>
      </header>

      {category.core_rule && (
        <Card className="border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
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

      {search.active ? (
        <div className="space-y-2">
          {search.searching && inCategory.length === 0 && (
            <p className="text-xs text-muted-foreground">Searching…</p>
          )}
          {!search.searching && inCategory.length === 0 && (
            <p className="text-sm text-muted-foreground">No record in this category matches that term.</p>
          )}
          {inCategory.map((r) => (
            <StainRecordCard key={r.id} rec={r} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <StainRecordCard key={r.id} rec={r} />
          ))}
          {records.length === 0 && (
            <p className="text-sm text-muted-foreground">No stain records are published in this category yet.</p>
          )}
          {hasMore && (
            <Button variant="outline" className="w-full" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading…" : `Load more (${total - records.length} remaining)`}
            </Button>
          )}
          {total > PAGE_SIZE && (
            <p className="text-center text-xs text-muted-foreground">
              Showing {records.length} of {total}
            </p>
          )}
        </div>
      )}

      {category.routing_note && <p className="text-xs text-muted-foreground">{category.routing_note}</p>}
    </div>
  );
}
