import { Link } from "react-router-dom";
import { Course } from "@/data/courses";
import { Star, Clock, Users } from "lucide-react";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group block overflow-hidden rounded-2xl bg-card shadow-soft transition-transform active:scale-[0.98]"
    >
      <div
        className={`relative h-32 bg-gradient-to-br ${course.cover} p-4`}
      >
        <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          {course.level}
        </span>
        <p className="absolute bottom-3 left-4 max-w-[80%] font-serif text-lg font-semibold leading-tight text-primary-foreground">
          {course.title}
        </p>
      </div>
      <div className="space-y-2 p-3.5">
        <p className="line-clamp-2 text-[13px] text-muted-foreground">{course.tagline}</p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="font-semibold text-foreground">{course.rating}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {course.hours}h
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {course.students.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
