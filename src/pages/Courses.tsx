import { useState } from "react";
import { useTranslation } from "react-i18next";
import { courses } from "@/data/courses";
import CourseCard from "@/components/CourseCard";
import { Search } from "lucide-react";

const levels = ["All", "Beginner", "Intermediate", "Advanced"] as const;

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
    <div className="space-y-4 px-4 py-5">
      <header>
        <h1 className="font-serif text-2xl font-bold">{t("courses.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("courses.available", { count: filtered.length })}
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("courses.searchPlaceholder")}
          className="w-full rounded-full border border-input bg-card py-2.5 pl-9 pr-4 text-sm outline-none transition-shadow focus:shadow-soft focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {levels.map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              level === l
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {t(`courses.levels.${l}` as const)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("courses.none")}</p>
        )}
      </div>
    </div>
  );
}
