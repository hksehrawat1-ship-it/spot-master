import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ChevronRight, Download, FileText } from "lucide-react";
import { getCourse, allLessons } from "@/data/courses";
import { useApp } from "@/store/useApp";
import { toast } from "sonner";

export default function LessonPlayer() {
  const { slug, lessonId } = useParams();
  const navigate = useNavigate();
  const course = slug ? getCourse(slug) : undefined;
  const { user, completed, toggleLesson } = useApp();

  if (!course || !lessonId) return null;
  if (!user) {
    navigate("/sign-in");
    return null;
  }

  const lessons = allLessons(course);
  const idx = lessons.findIndex((l) => l.id === lessonId);
  const lesson = lessons[idx];
  const next = lessons[idx + 1];
  const key = `${course.id}:${lesson.id}`;
  const isDone = !!completed[key];

  const markDone = () => {
    toggleLesson(key, !isDone);
    if (!isDone) toast.success("Lesson marked complete");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="relative bg-black">
        <button
          onClick={() => navigate(`/courses/${course.slug}`)}
          className="absolute left-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/20 text-white backdrop-blur"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <video
          key={lesson.id}
          src={lesson.videoUrl}
          controls
          playsInline
          className="aspect-video w-full bg-black"
        />
      </div>

      <div className="flex-1 space-y-5 px-4 py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Lesson {idx + 1} of {lessons.length}
          </p>
          <h1 className="mt-1 font-serif text-xl font-bold leading-tight">{lesson.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{lesson.duration} • {course.title}</p>
        </div>

        <button
          onClick={markDone}
          className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-colors ${
            isDone
              ? "bg-success text-success-foreground"
              : "gradient-primary text-primary-foreground shadow-elevated"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          {isDone ? "Completed" : "Mark as complete"}
        </button>

        {lesson.resources.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-bold">Resources</h2>
            <ul className="space-y-2">
              {lesson.resources.map((r) => (
                <a
                  key={r.name}
                  href={r.url}
                  className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-soft"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm">{r.name}</span>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </ul>
          </div>
        )}

        {next ? (
          <Link
            to={`/courses/${course.slug}/lesson/${next.id}`}
            className="flex items-center justify-between rounded-2xl bg-secondary p-4"
          >
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Up next</p>
              <p className="text-sm font-semibold">{next.title}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-primary" />
          </Link>
        ) : (
          <Link
            to={`/courses/${course.slug}/certificate`}
            className="block rounded-2xl gradient-primary p-4 text-center text-sm font-semibold text-primary-foreground"
          >
            🎓 Finish course & get certificate
          </Link>
        )}
      </div>
    </div>
  );
}
