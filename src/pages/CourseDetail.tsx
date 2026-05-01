import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Star, Clock, Users, PlayCircle, FileText, CheckCircle2, Lock, Download } from "lucide-react";
import { getCourse, discountPct, formatINR } from "@/data/courses";
import { useApp } from "@/store/useApp";
import { useProgress } from "@/lib/progress";
import ResourceVault from "@/components/ResourceVault";

export default function CourseDetail() {
  const { slug } = useParams();
  const course = slug ? getCourse(slug) : undefined;
  const { user, completed } = useApp();
  const progress = course ? useProgress(course) : null;

  if (!course) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Course not found.</p>
        <Link to="/courses" className="mt-4 inline-block text-primary underline">Back</Link>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className={`relative h-44 bg-gradient-to-br ${course.cover} px-4 pt-4 text-primary-foreground`}>
        <Link to="/courses" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/20 backdrop-blur">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="absolute bottom-4 left-4 right-4">
          <span className="rounded-full bg-background/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            {course.level}
          </span>
          <h1 className="mt-2 font-serif text-2xl font-bold leading-tight">{course.title}</h1>
        </div>
      </div>

      <div className="space-y-5 px-4 pt-5">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-accent text-accent" /><b className="text-foreground">{course.rating}</b></span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.hours}h</span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {course.students.toLocaleString()}</span>
        </div>

        <p className="text-sm leading-relaxed text-foreground/80">{course.description}</p>

        {!course.isBundle && (
          <a
            href={`/syllabus/${course.slug}.pdf`}
            download
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
          >
            <Download className="h-4 w-4" />
            Download the syllabus
          </a>
        )}

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-primary">{formatINR(course.price)}</span>
            <span className="text-sm text-muted-foreground line-through">{formatINR(course.originalPrice)}</span>
            <span className="ml-auto rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">
              {discountPct(course)}% OFF
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Lifetime access · Certificate on completion</p>
        </div>

        {user && progress && (
          <div className="rounded-2xl bg-secondary p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Your progress</span>
              <span className="font-bold text-primary">{progress.pct}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${progress.pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {progress.done} of {progress.total} lessons completed
              {progress.pct === 100 && (
                <> — <Link to={`/courses/${course.slug}/certificate`} className="font-semibold text-primary underline">Get certificate</Link></>
              )}
            </p>
          </div>
        )}

        <div>
          <h2 className="mb-3 font-serif text-lg font-bold">Course content</h2>
          <div className="space-y-3">
            {course.modules.map((m, mi) => (
              <details key={m.id} open={mi === 0} className="rounded-2xl bg-card shadow-soft">
                <summary className="flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold">
                  <span>Module {mi + 1}: {m.title}</span>
                  <span className="text-xs font-normal text-muted-foreground">{m.lessons.length} lessons</span>
                </summary>
                <ul className="border-t border-border/60">
                  {m.lessons.map((l) => {
                    const isDone = completed[`${course.id}:${l.id}`];
                    const locked = !user;
                    return (
                      <li key={l.id}>
                        <Link
                          to={locked ? "/sign-in" : `/courses/${course.slug}/lesson/${l.id}`}
                          className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-secondary/60"
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-5 w-5 flex-none text-success" />
                          ) : locked ? (
                            <Lock className="h-5 w-5 flex-none text-muted-foreground" />
                          ) : (
                            <PlayCircle className="h-5 w-5 flex-none text-primary" />
                          )}
                          <span className="flex-1 leading-tight">{l.title}</span>
                          <span className="text-xs text-muted-foreground">{l.duration}</span>
                        </Link>
                        {l.resources.length > 0 && (
                          <div className="px-12 pb-2 text-xs text-muted-foreground">
                            {l.resources.map((r) => (
                              <span key={r.name} className="mr-3 inline-flex items-center gap-1">
                                <FileText className="h-3 w-3" /> {r.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}
          </div>
        </div>

        <ResourceVault courseId={course.id} />

        {!user && (
          <Link
            to="/sign-in"
            className="block rounded-full gradient-primary py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-elevated"
          >
            Sign in to start learning
          </Link>
        )}
      </div>
    </div>
  );
}
