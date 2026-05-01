import { Link } from "react-router-dom";
import { Course, discountPct, formatINR } from "@/data/courses";
import { Star, Clock, Users, ArrowRight, BookOpen, CalendarDays } from "lucide-react";
import { nextClassDate } from "@/data/courses";

// Google color palette per level
const levelStyles: Record<string, { bg: string; text: string; dot: string }> = {
  Beginner: {
    bg: "bg-[hsl(142_71%_95%)]",
    text: "text-[hsl(142_71%_28%)]",
    dot: "bg-[hsl(142_71%_35%)]",
  },
  Intermediate: {
    bg: "bg-[hsl(217_89%_95%)]",
    text: "text-[hsl(217_89%_38%)]",
    dot: "bg-[hsl(217_89%_51%)]",
  },
  Advanced: {
    bg: "bg-[hsl(4_90%_95%)]",
    text: "text-[hsl(4_75%_42%)]",
    dot: "bg-[hsl(4_90%_58%)]",
  },
};

// Google accent rail color per card position
const railColors = [
  "hsl(217 89% 51%)", // blue
  "hsl(4 90% 58%)",   // red
  "hsl(45 100% 51%)", // yellow
  "hsl(142 71% 35%)", // green
];

export default function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const lvl = levelStyles[course.level] ?? levelStyles.Beginner;
  const rail = railColors[index % railColors.length];
  const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group relative block overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.99]"
    >
      {/* Left color rail (Google-style accent) */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: rail }}
      />

      <div className="space-y-3 p-4 pl-5">
        {/* Header row: badge + level chip */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${lvl.bg} ${lvl.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${lvl.dot}`} />
            {course.badge ?? course.level}
          </span>

          <span className="rounded-full bg-[hsl(142_71%_95%)] px-2 py-0.5 text-[10px] font-bold text-[hsl(142_71%_28%)]">
            {discountPct(course)}% OFF
          </span>
        </div>

        {/* Title */}
        <h3 className="font-sans text-base font-semibold leading-snug text-foreground">
          {course.title}
        </h3>

        {/* Tagline */}
        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {course.tagline}
        </p>

        {/* Optional highlight */}
        {course.highlight && (
          <p className="rounded-lg bg-[hsl(217_89%_97%)] px-3 py-2 text-[12px] font-medium text-[hsl(217_89%_38%)]">
            {course.highlight}
          </p>
        )}

        {course.bonus && (
          <p className="rounded-lg bg-[hsl(140_70%_18%)] px-3 py-2 text-[12px] font-extrabold text-[hsl(140_85%_88%)]">
            {course.bonus}
          </p>
        )}

        {course.registerNote && (
          <p className="rounded-lg bg-[hsl(45_100%_95%)] px-3 py-2 text-[12px] font-semibold text-[hsl(35_90%_30%)]">
            🎟️ {course.registerNote}
          </p>
        )}

        {course.slug === "5-day-practical-training" && (
          <p className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(4_90%_95%)] px-3 py-2 text-[12px] font-semibold text-[hsl(4_75%_42%)]">
            <CalendarDays className="h-3.5 w-3.5" />
            Next batch: {nextClassDate()}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-[hsl(45_100%_51%)] text-[hsl(45_100%_51%)]" />
            <span className="font-medium text-foreground">{course.rating}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {course.hours}h
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" /> {lessonCount} lessons
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {course.students.toLocaleString()}
          </span>
        </div>

        {/* Footer: price + CTA */}
        <div className="flex items-end justify-between border-t border-border pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">
              {formatINR(course.price)}
            </span>
            <span className="text-[12px] text-muted-foreground line-through">
              {formatINR(course.originalPrice)}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(217_89%_51%)] px-3.5 py-1.5 text-[12px] font-medium text-white shadow-sm transition-transform group-hover:translate-x-0.5">
            View course
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
