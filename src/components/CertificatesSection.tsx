import { Link } from "react-router-dom";
import { Award, Lock, Download } from "lucide-react";
import { courses } from "@/data/courses";
import { useApp } from "@/store/useApp";
import { useProgress } from "@/lib/progress";

export default function CertificatesSection() {
  const { user } = useApp();

  return (
    <section className="px-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold">My certificates</h2>
        {!user && (
          <Link to="/sign-in" className="text-xs font-semibold text-primary">
            Sign in
          </Link>
        )}
      </div>

      {!user ? (
        <div className="rounded-2xl bg-secondary p-5 text-center">
          <Award className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-2 text-sm font-semibold">Sign in to track your progress</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Earn a certificate after finishing each course.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => (
            <CertificateRow key={c.id} course={c} />
          ))}
        </div>
      )}
    </section>
  );
}

function CertificateRow({ course }: { course: (typeof courses)[number] }) {
  const { pct, done, total } = useProgress(course);
  const unlocked = pct >= 100;
  const remaining = 100 - pct;

  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        {/* Circular progress */}
        <div className="relative h-14 w-14 flex-none">
          <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke={unlocked ? "hsl(var(--primary))" : "hsl(var(--accent))"}
              strokeWidth="3"
              strokeDasharray={`${pct}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">
            {pct}%
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-sm font-bold">{course.title}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {done} of {total} lessons completed
          </p>
          {!unlocked && (
            <p className="mt-1 text-[11px] font-semibold text-accent">
              {remaining}% more to unlock certificate
            </p>
          )}
        </div>

        {unlocked ? (
          <Link
            to={`/courses/${course.slug}/certificate`}
            className="inline-flex flex-none items-center gap-1 rounded-full gradient-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground shadow-elevated"
          >
            <Download className="h-3 w-3" /> Download
          </Link>
        ) : (
          <span className="inline-flex flex-none items-center gap-1 rounded-full bg-muted px-3 py-2 text-[11px] font-semibold text-muted-foreground">
            <Lock className="h-3 w-3" /> Locked
          </span>
        )}
      </div>
    </div>
  );
}
