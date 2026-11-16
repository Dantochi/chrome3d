import Link from "next/link";
import { courseRuntime } from "@/lib/data/courses";
import { formatPrice, formatRuntime } from "@/lib/format";
import type { Course } from "@/lib/types";
import { CourseCover } from "./CourseCover";

export function CourseCard({ course, owned = false }: { course: Course; owned?: boolean }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-steel"
    >
      <CourseCover slug={course.slug} className="aspect-[16/9] transition-transform duration-700 group-hover:scale-[1.03]" />
      <div className="flex flex-1 flex-col gap-3 border-t border-line p-5">
        <p className="label">
          {course.level} · {course.topic}
        </p>
        <h3 className="font-display text-xl font-medium tracking-tight">{course.title}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-steel">{course.summary}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <p className="label">
            {course.lessons.length} lessons · {formatRuntime(courseRuntime(course))}
          </p>
          <p className="text-sm font-medium">{owned ? "Enrolled" : formatPrice(course.price_cents, course.currency)}</p>
        </div>
      </div>
    </Link>
  );
}
