import type { Metadata } from "next";
import Link from "next/link";
import { CourseCover } from "@/components/courses/CourseCover";
import { PageHeader } from "@/components/site/PageHeader";
import { btnPrimary, container, panel } from "@/components/ui/styles";
import { getProfile } from "@/lib/auth";
import { getCourses, getEnrolledCourseIds, getProgress } from "@/lib/data/courses";

export const metadata: Metadata = { title: "My courses" };

export default async function Dashboard() {
  const [profile, courses, enrolledIds, progress] = await Promise.all([
    getProfile(),
    getCourses(),
    getEnrolledCourseIds(),
    getProgress(),
  ]);
  const mine = courses.filter((c) => enrolledIds.has(c.id));

  return (
    <>
      <PageHeader label="My courses" title={profile?.full_name ? `Welcome back, ${profile.full_name.split(" ")[0]}.` : "Welcome back."} />
      <div className={`${container} py-12 sm:py-16`}>
        {mine.length === 0 ? (
          <div className={`${panel} flex flex-col items-start gap-5 p-8`}>
            <p className="font-display text-2xl font-medium tracking-tight">No courses yet</p>
            <p className="max-w-md text-sm leading-relaxed text-steel">
              Courses you buy or enrol in appear here, with your progress saved.
            </p>
            <Link href="/courses" className={btnPrimary}>
              Browse courses
            </Link>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((course) => {
              const done = course.lessons.filter((l) => progress[l.id]?.completed).length;
              const pct = course.lessons.length ? Math.round((done / course.lessons.length) * 100) : 0;
              return (
                <li key={course.id}>
                  <Link
                    href={`/learn/${course.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-steel"
                  >
                    <CourseCover slug={course.slug} className="aspect-[16/9]" />
                    <div className="flex flex-col gap-4 border-t border-line p-5">
                      <h2 className="font-display text-xl font-medium tracking-tight">{course.title}</h2>
                      <div className="h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-label={`${course.title} progress`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full bg-blueprint" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="label">
                        {done} of {course.lessons.length} lessons · {pct}%
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
