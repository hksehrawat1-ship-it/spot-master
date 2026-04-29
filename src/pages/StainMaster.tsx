import { useMemo, useState } from "react";
import { Search, Sparkles, AlertTriangle, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STAIN_CATEGORIES, STAINS, type StainCategory } from "@/data/stains";

export default function StainMaster() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<StainCategory | null>(null);

  const q = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!q) return [];
    return STAINS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }, [q]);

  const categoryStains = useMemo(
    () => (activeCategory ? STAINS.filter((s) => s.category === activeCategory) : []),
    [activeCategory],
  );

  return (
    <div className="space-y-5 px-4 pb-28 pt-4">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-5 text-primary-foreground shadow-elevated">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
          <Sparkles className="h-4 w-4" /> GILM Stain Master
        </div>
        <h1 className="mt-1 text-2xl font-bold leading-tight">Find any stain. Fix any stain.</h1>
        <p className="mt-1 text-sm opacity-90">
          Search 100+ stains or browse by category to learn the pro treatment.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stains: blood, coffee, oil…"
          className="h-12 rounded-xl border-2 pl-10 text-base"
        />
      </div>

      {/* Search results */}
      {q && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {searchResults.length} result{searchResults.length === 1 ? "" : "s"} for "{query}"
          </p>
          {searchResults.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">
              No stains found. Try another keyword.
            </Card>
          ) : (
            searchResults.map((s) => <StainCard key={s.id} stain={s} />)
          )}
        </div>
      )}

      {/* Category view */}
      {!q && activeCategory && (
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveCategory(null)}
            className="-ml-2 h-8 text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> All categories
          </Button>
          <h2 className="text-lg font-bold">{activeCategory}</h2>
          {categoryStains.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">
              More stains in this category coming soon.
            </Card>
          ) : (
            categoryStains.map((s) => <StainCard key={s.id} stain={s} />)
          )}
        </div>
      )}

      {/* Categories grid */}
      {!q && !activeCategory && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Browse categories
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {STAIN_CATEGORIES.map((c) => {
              const count = STAINS.filter((s) => s.category === c.name).length;
              return (
                <button
                  key={c.name}
                  onClick={() => setActiveCategory(c.name)}
                  className="group flex flex-col gap-1 rounded-xl border border-border bg-card p-3 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-elevated"
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-[13px] font-semibold leading-tight text-foreground">
                    {c.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{c.blurb}</span>
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {count} stain{count === 1 ? "" : "s"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StainCard({ stain }: { stain: (typeof STAINS)[number] }) {
  return (
    <Card className="space-y-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold">{stain.name}</h3>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {stain.category}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{stain.description}</p>
      <div className="rounded-lg bg-success/10 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-success">
          Treatment
        </p>
        <p className="mt-1 text-sm text-foreground">{stain.treatment}</p>
      </div>
      {stain.caution && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{stain.caution}</span>
        </div>
      )}
    </Card>
  );
}
