import Link from "next/link";
import { NewCourseForm } from "@/components/admin/CourseForm";
import { panel } from "@/components/ui/styles";
import { requireAdmin } from "@/lib/auth";
import { getCourses } from "@/lib/data/courses";
import { formatPrice } from "@/lib/format";

export default async function AdminCourses() {
  await requireAdmin();
  const courses = await getCourses(true);
  return (
    <>
      <h1 className="py-10 font-display text-4xl font-medium tracking-tight">Courses</h1>
      <div className={`${panel} p-6`}>
        <NewCourseForm />
      </div>
      <ul className={`${panel} mt-8 divide-y divide-line overflow-hidden`}>
        {courses.length === 0 && <li className="p-5 text-sm text-steel">No courses yet. Create the first one above.</li>}
        {courses.map((course) => (
          <li key={course.id}>
            <Link href={`/admin/courses/${course.id}`} className="flex flex-wrap items-center gap-4 p-5 text-sm transition-colors hover:bg-raised">
              <span className="min-w-0 flex-1 truncate font-medium">{course.title}</span>
              <span className={`label ${course.published ? "!text-blueprint" : ""}`}>{course.published ? "Live" : "Draft"}</span>
              <span className="label tabular-nums">
                {course.lessons.filter((l) => l.has_video).length}/{course.lessons.length} videos
              </span>
              <span className="label w-14 text-right tabular-nums">{formatPrice(course.price_cents, course.currency)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
