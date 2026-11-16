import type { Metadata } from "next";
import Link from "next/link";
import { CourseCard } from "@/components/courses/CourseCard";
import { PageHeader } from "@/components/site/PageHeader";
import { container } from "@/components/ui/styles";
import { getCourses, getEnrolledCourseIds } from "@/lib/data/courses";

export const metadata: Metadata = { title: "Courses" };

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const { level } = await searchParams;
  const active = LEVELS.includes(String(level)) ? String(level) : "All";
  const [courses, enrolled] = await Promise.all([getCourses(), getEnrolledCourseIds()]);
  const shown = active === "All" ? courses : courses.filter((c) => c.level === active);

  return (
    <>
      <PageHeader label="Courses" title="Every course, one workshop.">
        Watch on the site, at your own pace. Each course opens with a free lesson.
      </PageHeader>
      <div className={`${container} py-12 sm:py-16`}>
        <nav className="flex flex-wrap gap-2" aria-label="Filter by level">
          {LEVELS.map((name) => (
            <Link
              key={name}
              href={name === "All" ? "/courses" : `/courses?level=${name}`}
              aria-current={name === active ? "page" : undefined}
              className={`inline-flex h-9 items-center rounded-full border px-4 text-xs font-medium transition-colors ${
                name === active ? "border-chrome bg-chrome text-ink" : "border-line text-steel hover:border-steel hover:text-chrome"
              }`}
            >
              {name}
            </Link>
          ))}
        </nav>
        {shown.length === 0 ? (
          <p className="mt-10 text-steel">No courses at this level yet.</p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((course) => (
              <CourseCard key={course.id} course={course} owned={enrolled.has(course.id)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
