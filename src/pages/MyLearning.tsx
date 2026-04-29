import { Link } from "react-router-dom";
import { courses } from "@/data/courses";
import { useApp } from "@/store/useApp";
import { useProgress } from "@/lib/progress";
import { Award, BookOpen } from "lucide-react";

export default function MyLearning() {
  const { user, completed } = useApp();

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

  const enrolled = courses.filter((c) =>
    Object.keys(completed).some((k) => k.startsWith(`${c.id}:`) && completed[k])
  );
  const others = courses.filter((c) => !enrolled.includes(c));

  return (
    <div className="space-y-6 px-4 py-5">
      <header>
        <h1 className="font-serif text-2xl font-bold">My Learning</h1>
        <p className="text-sm text-muted-foreground">Pick up where you left off</p>
      </header>

      {enrolled.length === 0 ? (
        <div className="rounded-2xl bg-secondary p-6 text-center">
          <p className="text-sm text-muted-foreground">You haven't started any lesson yet.</p>
          <Link to="/courses" className="mt-3 inline-block text-sm font-semibold text-primary">Explore courses →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {enrolled.map((c) => <ProgressRow key={c.id} course={c} />)}
        </div>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Recommended</h2>
          <div className="space-y-3">
            {others.slice(0, 2).map((c) => <ProgressRow key={c.id} course={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ProgressRow({ course }: { course: typeof courses[number] }) {
  const p = useProgress(course);
  return (
    <Link to={`/courses/${course.slug}`} className="block rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={`h-12 w-12 flex-none rounded-xl bg-gradient-to-br ${course.cover}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{course.title}</p>
          <p className="text-xs text-muted-foreground">{p.done}/{p.total} lessons</p>
        </div>
        {p.pct === 100 && <Award className="h-5 w-5 text-accent" />}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full gradient-primary" style={{ width: `${p.pct}%` }} />
      </div>
    </Link>
  );
}
