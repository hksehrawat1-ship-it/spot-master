import { Link } from "react-router-dom";
import { Course, discountPct, formatINR } from "@/data/courses";
import { Star, Clock, Users, ArrowUpRight } from "lucide-react";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group block overflow-hidden rounded-3xl bg-card shadow-soft ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.98]"
    >
      {/* Cover */}
      <div
        className={`relative h-40 overflow-hidden bg-gradient-to-br ${course.cover} p-4`}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-black/20 blur-2xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />

        {/* Level badge */}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm backdrop-blur">
          {course.level}
        </span>

        {/* Arrow chip */}
        <span className="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md ring-1 ring-white/40 transition-transform group-hover:rotate-45">
          <ArrowUpRight className="h-4 w-4" />
        </span>

        {/* Title */}
        <p className="absolute bottom-3 left-4 right-16 font-serif text-lg font-bold leading-tight text-white drop-shadow-md">
          {course.title}
        </p>
      </div>

      {/* Body */}
      <div className="space-y-3 p-4">
        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {course.tagline}
        </p>

        {course.highlight && (
          <p className="rounded-lg bg-primary/10 px-3 py-2 text-[12px] font-semibold text-primary">
            {course.highlight}
          </p>
        )}

        {course.bonus && (
          <p className="rounded-lg bg-[hsl(140_70%_18%)] px-3 py-2 text-[12px] font-extrabold text-[hsl(140_85%_88%)]">
            {course.bonus}
          </p>
        )}

        {course.registerNote && (
          <p className="rounded-lg bg-accent/15 px-3 py-2 text-[12px] font-semibold text-foreground">
            🎟️ {course.registerNote}
          </p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="font-bold text-foreground">{course.rating}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {course.hours}h
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {course.students.toLocaleString()}
          </span>
        </div>

        <div className="flex items-end justify-between border-t border-dashed border-border pt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-bold text-primary">
              {formatINR(course.price)}
            </span>
            <span className="text-[11px] text-muted-foreground line-through">
              {formatINR(course.originalPrice)}
            </span>
          </div>
          <span className="rounded-full bg-gradient-to-r from-success to-[hsl(145_65%_48%)] px-2.5 py-1 text-[10px] font-bold text-success-foreground shadow-sm">
            {discountPct(course)}% OFF
          </span>
        </div>
      </div>
    </Link>
  );
}
