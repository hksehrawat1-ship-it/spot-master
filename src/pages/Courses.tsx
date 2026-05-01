import { useState } from "react";
import { useTranslation } from "react-i18next";
import { courses } from "@/data/courses";
import CourseCard from "@/components/CourseCard";
import { Search, X, SlidersHorizontal } from "lucide-react";

const levels = ["All", "Beginner", "Intermediate", "Advanced"] as const;

// Google color per filter chip
const chipColor: Record<(typeof levels)[number], string> = {
  All: "hsl(217 89% 51%)",         // blue
  Beginner: "hsl(142 71% 35%)",    // green
  Intermediate: "hsl(45 100% 42%)",// yellow
  Advanced: "hsl(4 90% 58%)",      // red
};

export default function Courses() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<(typeof levels)[number]>("All");

  const filtered = courses.filter(
    (c) =>
      (level === "All" || c.level === level) &&
      (c.title.toLowerCase().includes(q.toLowerCase()) ||
        c.tagline.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-5 px-4 pt-5 pb-8">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="font-sans text-[26px] font-normal leading-tight text-foreground">
          {t("courses.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("courses.available", { count: filtered.length })}
        </p>
      </header>

      {/* Google-style search bar */}
      <div className="group relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("courses.searchPlaceholder")}
          className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-12 text-[14px] outline-none transition-all placeholder:text-muted-foreground hover:shadow-soft focus:border-[hsl(217_89%_51%)] focus:shadow-elevated focus:ring-4 focus:ring-[hsl(217_89%_51%)]/15"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            aria-label="Clear"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter chips row */}
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
        </span>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {levels.map((l) => {
            const active = level === l;
            const color = chipColor[l];
            return (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className="whitespace-nowrap rounded-full border px-4 py-1.5 text-[13px] font-medium transition-all"
                style={
                  active
                    ? {
                        background: color,
                        borderColor: color,
                        color: "white",
                      }
                    : {
                        background: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        color: "hsl(var(--foreground))",
                      }
                }
              >
                {t(`courses.levels.${l}` as const)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map((c, i) => (
          <CourseCard key={c.id} course={c} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card py-12 text-center">
            <p className="text-sm text-muted-foreground">{t("courses.none")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
