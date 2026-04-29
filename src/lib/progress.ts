import { useApp } from "@/store/useApp";
import { Course, allLessons } from "@/data/courses";

export function useProgress(course: Course) {
  const { completed } = useApp();
  const lessons = allLessons(course);
  const done = lessons.filter((l) => completed[`${course.id}:${l.id}`]).length;
  const total = lessons.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct, lessons };
}
