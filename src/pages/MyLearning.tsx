import { Link } from "react-router-dom";
import { courses } from "@/data/courses";
import { useApp } from "@/store/useApp";
import { useProgress } from "@/lib/progress";
import { Award, BookOpen, ArrowRight, Trophy, PlayCircle } from "lucide-react";
import ResourceVault from "@/components/ResourceVault";

export default function MyLearning() {
  const { user, purchases, completed } = useApp();

  if (!user) {
    return (
      <div className="px-4 py-12 text-center">
        <BookOpen className="mx-auto h-12 w-12 text-primary/50" />
        <h1 className="mt-3 font-serif text-xl font-bold">Sign in to track learning</h1>
        <p className="mt-1 text-sm text-muted-foreground">Resume lessons, see progress, earn certificates.</p>
        <Link to="/sign-in" className="mt-5 inline-block rounded-full gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          Sign in
        </Link>
      </div>
    );
  }

  const owned = courses.filter((c) => purchases[c.id]);
  const others = courses.filter((c) => !purchases[c.id]);

  // Aggregate progress across owned courses for the top achievement slider
  const totals = owned.reduce(
    (acc, c) => {
      const lessons = c.modules.flatMap((m) => m.lessons);
      const done = lessons.filter((l) => completed[`${c.id}:${l.id}`]).length;
      acc.done += done;
      acc.total += lessons.length;
      return acc;
    },
    { done: 0, total: 0 }
  );
  const overallPct = totals.total === 0 ? 0 : Math.round((totals.done / totals.total) * 100);
  const remaining = 100 - overallPct;

  return (
    <div className="space-y-6 px-4 py-5">
      <header>
        <h1 className="font-serif text-2xl font-bold">My Learning</h1>
        <p className="text-sm text-muted-foreground">Pick up where you left off</p>
      </header>

      {/* Green achievement slider */}
      <section className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-elevated">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <Trophy className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wider text-white/80">Your achievement</p>
            <p className="font-serif text-lg font-bold leading-tight">
              {overallPct}% completed
            </p>
          </div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold backdrop-blur">
            {totals.done}/{totals.total} lessons
          </span>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white shadow-inner transition-all duration-700"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] font-semibold text-white/90">
          {remaining === 0 ? "🎉 All caught up — you're a champion!" : `${remaining}% more to finish all your courses`}
        </p>
      </section>

      {/* My courses */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          My courses
        </h2>

        {owned.length === 0 ? (
          <div className="rounded-2xl bg-secondary p-6 text-center">
            <p className="text-sm text-muted-foreground">You haven't bought any course yet.</p>
            <Link to="/courses" className="mt-3 inline-block text-sm font-semibold text-primary">
              Explore courses →
            </Link>
          </div>
        ) : (
          owned.map((c) => <PurchasedCourseCard key={c.id} course={c} />)
        )}
      </section>

      {/* Recommended */}
      {others.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Recommended for you
          </h2>
          <div className="space-y-3">
            {others.slice(0, 2).map((c) => (
              <Link
                key={c.id}
                to={`/courses/${c.slug}`}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft"
              >
                <div className={`h-12 w-12 flex-none rounded-xl bg-gradient-to-br ${c.cover}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.level} · {c.hours}h</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PurchasedCourseCard({ course }: { course: typeof courses[number] }) {
  const p = useProgress(course);
  const nextLesson = p.lessons.find((l) => !useApp.getState().completed[`${course.id}:${l.id}`]) || p.lessons[0];

  return (
    <article className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={`h-14 w-14 flex-none rounded-xl bg-gradient-to-br ${course.cover}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-sm font-bold">{course.title}</p>
          <p className="text-xs text-muted-foreground">
            {p.done}/{p.total} lessons · {p.pct}% done
          </p>
        </div>
        {p.pct === 100 && <Award className="h-5 w-5 text-accent" />}
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${p.pct}%` }} />
      </div>

      <div className="flex gap-2">
        <Link
          to={nextLesson ? `/courses/${course.slug}/lesson/${nextLesson.id}` : `/courses/${course.slug}`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full gradient-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-soft"
        >
          <PlayCircle className="h-4 w-4" />
          {p.pct === 0 ? "Start course" : p.pct === 100 ? "Review" : "Resume"}
        </Link>
        {p.pct === 100 && (
          <Link
            to={`/courses/${course.slug}/certificate`}
            className="inline-flex items-center justify-center gap-1 rounded-full bg-accent px-4 py-2.5 text-xs font-semibold text-accent-foreground"
          >
            <Award className="h-4 w-4" /> Certificate
          </Link>
        )}
      </div>

      {/* Inline Resource Vault for this course */}
      <ResourceVault courseId={course.id} />
    </article>
  );
}
