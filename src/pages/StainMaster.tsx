import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Sparkles, AlertTriangle, ArrowLeft, Brain, Camera, Clock, Bookmark, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STAIN_CATEGORIES, STAINS, type StainCategory } from "@/data/stains";

export default function StainMaster() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
          <Sparkles className="h-4 w-4" /> {t("stainMaster.badge")}
        </div>
        <h1 className="mt-1 text-2xl font-bold leading-tight">{t("stainMaster.title")}</h1>
        <p className="mt-1 text-sm opacity-90">{t("stainMaster.subtitle")}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("stainMaster.searchPlaceholder")}
          className="h-12 rounded-xl border-2 pl-10 text-base"
        />
      </div>

      {/* Search results */}
      {q && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t(searchResults.length === 1 ? "stainMaster.resultFor" : "stainMaster.resultsFor", {
              count: searchResults.length,
              query,
            })}
          </p>
          {searchResults.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">
              {t("stainMaster.noResults")}
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
            <ArrowLeft className="h-4 w-4" /> {t("stainMaster.allCategories")}
          </Button>
          <h2 className="text-lg font-bold">{activeCategory}</h2>
          {categoryStains.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">
              {t("stainMaster.comingSoon")}
            </Card>
          ) : (
            (() => {
              const groups = categoryStains.reduce<Record<string, typeof categoryStains>>((acc, s) => {
                const k = s.subgroup || "All";
                (acc[k] ||= []).push(s);
                return acc;
              }, {});
              return Object.entries(groups).map(([group, items]) => (
                <div key={group} className="space-y-2">
                  {group !== "All" && (
                    <h3 className="pt-2 text-sm font-semibold text-primary">{group}</h3>
                  )}
                  {items.map((s) => <StainCard key={s.id} stain={s} />)}
                </div>
              ));
            })()
          )}
        </div>
      )}

      {/* Action cards + Categories grid */}
      {!q && !activeCategory && (
        <div className="space-y-5">
          {/* 3 action cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => (document.querySelector<HTMLInputElement>('input[placeholder]')?.focus())}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-glow p-3 text-left text-primary-foreground shadow-elevated transition-transform hover:-translate-y-0.5"
            >
              <Search className="h-5 w-5" />
              <div className="mt-2 text-[13px] font-bold leading-tight">🔍 {t("stainMaster.actions.searchTitle")}</div>
              <div className="text-[10px] opacity-90">{t("stainMaster.actions.searchSub")}</div>
            </button>
            <button
              onClick={() => navigate("/stain-master/identify")}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[hsl(280_70%_45%)] to-[hsl(320_75%_55%)] p-3 text-left text-white shadow-elevated transition-transform hover:-translate-y-0.5"
            >
              <Brain className="h-5 w-5" />
              <div className="mt-2 text-[13px] font-bold leading-tight">🧠 {t("stainMaster.actions.identifyTitle")}</div>
              <div className="text-[10px] opacity-90">{t("stainMaster.actions.identifySub")}</div>
            </button>
            <button
              disabled
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[hsl(25_85%_50%)] to-[hsl(45_90%_55%)] p-3 text-left text-white shadow-elevated opacity-90"
            >
              <Camera className="h-5 w-5" />
              <div className="mt-2 text-[13px] font-bold leading-tight">📸 {t("stainMaster.actions.scanTitle")}</div>
              <div className="text-[10px] opacity-90">{t("stainMaster.actions.scanSub")}</div>
              <span className="absolute right-1.5 top-1.5 rounded-full bg-black/30 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider backdrop-blur">
                {t("stainMaster.actions.comingSoon")}
              </span>
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("stainMaster.browse")}
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
                      {t("stainMaster.stainCount", { count })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick cards bottom */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <Card className="flex flex-col gap-1 p-3">
              <Clock className="h-4 w-4 text-primary" />
              <div className="text-[12px] font-bold leading-tight">{t("stainMaster.quick.recent")}</div>
              <div className="text-[10px] text-muted-foreground">{t("stainMaster.quick.recentSub")}</div>
            </Card>
            <Card className="flex flex-col gap-1 p-3">
              <Bookmark className="h-4 w-4 text-[hsl(280_70%_45%)]" />
              <div className="text-[12px] font-bold leading-tight">{t("stainMaster.quick.saved")}</div>
              <div className="text-[10px] text-muted-foreground">{t("stainMaster.quick.savedSub")}</div>
            </Card>
            <Card className="flex flex-col gap-1 p-3">
              <Flame className="h-4 w-4 text-[hsl(25_85%_50%)]" />
              <div className="text-[12px] font-bold leading-tight">{t("stainMaster.quick.top10")}</div>
              <div className="text-[10px] text-muted-foreground">{t("stainMaster.quick.top10Sub")}</div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function StainCard({ stain }: { stain: (typeof STAINS)[number] }) {
  const { t } = useTranslation();
  const diffColor: Record<string, string> = {
    Light: "bg-success/15 text-success",
    Heavy: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    Industrial: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
    Petroleum: "bg-destructive/15 text-destructive",
  };
  return (
    <Card className="space-y-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold">{stain.name}</h3>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {stain.category}
        </Badge>
      </div>
      {stain.difficulty && (
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${diffColor[stain.difficulty]}`}>
          {stain.difficulty}
        </span>
      )}
      <p className="text-sm text-muted-foreground">{stain.description}</p>
      <div className="rounded-lg bg-success/10 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-success">
          {t("stainMaster.treatment")}
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
