import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyButton } from "@/components/courses/BuyButton";
import { LessonPlayer } from "@/components/player/LessonPlayer";
import { btnGhost, container, panel } from "@/components/ui/styles";
import { getProfile } from "@/lib/auth";
import { canWatch, getCourseBySlug, getEnrolledCourseIds, getProgress } from "@/lib/data/courses";
import { formatDuration, formatPrice } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/learn/[slug]/[lesson]">): Promise<Metadata> {
  const { slug, lesson: lessonId } = await params;
  const course = await getCourseBySlug(slug);
  const lesson = course?.lessons.find((l) => l.id === lessonId);
  return lesson ? { title: `${lesson.title} · ${course!.title}` } : {};
}

export default async function LessonPage({ params }: PageProps<"/learn/[slug]/[lesson]">) {
  const { slug, lesson: lessonId } = await params;
  const course = await getCourseBySlug(slug);
  const index = course?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  if (!course || index < 0) notFound();
  const lesson = course.lessons[index];

  const [profile, enrolledIds, progress] = await Promise.all([getProfile(), getEnrolledCourseIds(), getProgress()]);
  const enrolled = enrolledIds.has(course.id);
  const isAdmin = profile?.role === "admin";
  const open = canWatch(lesson, course, enrolled, isAdmin);
  const next = course.lessons.slice(index + 1).find((l) => canWatch(l, course, enrolled, isAdmin));
  const free = course.price_cents === 0;

  return (
    <div className={`${container} grid gap-8 pb-16 pt-24 lg:grid-cols-[1fr_22rem]`}>
      <div className="min-w-0">
        {open ? (
          <LessonPlayer
            key={lesson.id}
            lessonId={lesson.id}
            title={lesson.title}
            startAt={progress[lesson.id]?.completed ? 0 : (progress[lesson.id]?.last_position_seconds ?? 0)}
            nextHref={next ? `/learn/${course.slug}/${next.id}` : null}
          />
        ) : (
          <div className="bg-grid grid aspect-video w-full place-items-center rounded-2xl border border-line bg-panel p-6">
            <div className="flex max-w-sm flex-col items-center gap-4 text-center">
              <p className="label">Locked lesson</p>
              <p className="font-display text-2xl font-medium tracking-tight">
                {free ? "Enrol to watch this lesson" : `Unlock the full course for ${formatPrice(course.price_cents, course.currency)}`}
              </p>
              <div className="w-full max-w-60">
                <BuyButton courseId={course.id} label={free ? "Enrol for free" : "Buy this course"} />
              </div>
            </div>
          </div>
        )}
        <p className="label mt-7">
          <Link href={`/courses/${course.slug}`} className="transition-colors hover:text-chrome">
            {course.title}
          </Link>{" "}
          · Lesson {index + 1} of {course.lessons.length}
        </p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">{lesson.title}</h1>
        {open && lesson.body && (
          <div className="mt-6 max-w-2xl whitespace-pre-line text-base leading-relaxed text-steel">{lesson.body}</div>
        )}
        {open && next && (
          <Link href={`/learn/${course.slug}/${next.id}`} className={`${btnGhost} mt-8`}>
            Next: {next.title}
          </Link>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <h2 className="label">Lessons</h2>
        <ol className={`${panel} mt-3 divide-y divide-line overflow-hidden`}>
          {course.lessons.map((l, i) => {
            const current = l.id === lesson.id;
            const watchable = canWatch(l, course, enrolled, isAdmin);
            return (
              <li key={l.id}>
                <Link
                  href={`/learn/${course.slug}/${l.id}`}
                  aria-current={current ? "page" : undefined}
                  className={`flex items-center gap-3 p-4 text-sm transition-colors hover:bg-raised ${current ? "bg-raised" : ""} ${watchable ? "" : "text-steel"}`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${
                      progress[l.id]?.completed ? "border-blueprint bg-blueprint text-ink" : current ? "border-chrome" : "border-line"
                    }`}
                  >
                    {progress[l.id]?.completed ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {i + 1}. {l.title}
                  </span>
                  <span className="label shrink-0 tabular-nums">{watchable ? formatDuration(l.duration_seconds) : "Locked"}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
