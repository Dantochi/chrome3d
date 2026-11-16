import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyButton } from "@/components/courses/BuyButton";
import { CourseCover } from "@/components/courses/CourseCover";
import { PageHeader } from "@/components/site/PageHeader";
import { btnPrimary, container, panel } from "@/components/ui/styles";
import { getProfile } from "@/lib/auth";
import { canWatch, courseRuntime, getCourseBySlug, getEnrolledCourseIds } from "@/lib/data/courses";
import { formatDuration, formatPrice, formatRuntime } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const course = await getCourseBySlug((await params).slug);
  return course ? { title: course.title, description: course.summary } : {};
}

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  const [profile, enrolledIds] = await Promise.all([getProfile(), getEnrolledCourseIds()]);
  const enrolled = enrolledIds.has(course.id);
  const isAdmin = profile?.role === "admin";
  const free = course.price_cents === 0;

  return (
    <>
      <PageHeader label={`${course.level} · ${course.topic}`} title={course.title}>
        {course.summary}
      </PageHeader>
      <div className={`${container} grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_22rem]`}>
        <div className="min-w-0">
          {course.description && <p className="max-w-2xl text-base leading-relaxed text-steel">{course.description}</p>}
          <h2 className="mt-12 font-display text-2xl font-medium tracking-tight">Curriculum</h2>
          <ol className={`${panel} mt-5 divide-y divide-line overflow-hidden`}>
            {course.lessons.length === 0 && <li className="p-5 text-sm text-steel">Lessons are on their way.</li>}
            {course.lessons.map((lesson, i) => {
              const open = canWatch(lesson, course, enrolled, isAdmin);
              const row = (
                <>
                  <span className="label w-6 shrink-0 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{lesson.title}</span>
                  {lesson.is_free && !enrolled && <span className="label !text-blueprint">Free</span>}
                  {!open && (
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 fill-none stroke-steel" strokeWidth="1.3" aria-label="Locked">
                      <rect x="3" y="7" width="10" height="7" rx="1.5" />
                      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
                    </svg>
                  )}
                  <span className="label w-10 shrink-0 text-right tabular-nums">{formatDuration(lesson.duration_seconds)}</span>
                </>
              );
              return (
                <li key={lesson.id}>
                  {open ? (
                    <Link href={`/learn/${course.slug}/${lesson.id}`} className="flex items-center gap-4 p-5 transition-colors hover:bg-raised">
                      {row}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-4 p-5 text-steel">{row}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className={`${panel} overflow-hidden`}>
            <CourseCover slug={course.slug} className="aspect-[16/9]" />
            <div className="flex flex-col gap-5 border-t border-line p-6">
              <p className="font-display text-4xl font-medium tracking-tight">{formatPrice(course.price_cents, course.currency)}</p>
              {enrolled || isAdmin ? (
                <Link href={`/learn/${course.slug}`} className={`${btnPrimary} w-full`}>
                  {enrolled ? "Continue learning" : "Open course"}
                </Link>
              ) : (
                <BuyButton courseId={course.id} label={free ? "Enrol for free" : "Buy this course"} />
              )}
              <dl className="grid grid-cols-2 gap-4 border-t border-line pt-5">
                <div>
                  <dt className="label">Lessons</dt>
                  <dd className="mt-1 text-sm">{course.lessons.length}</dd>
                </div>
                <div>
                  <dt className="label">Runtime</dt>
                  <dd className="mt-1 text-sm">{formatRuntime(courseRuntime(course))}</dd>
                </div>
              </dl>
              <p className="text-sm leading-relaxed text-steel">One payment, yours to keep. Watch here on the site, on any device.</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
