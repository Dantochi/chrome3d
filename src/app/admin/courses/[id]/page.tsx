import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCourse } from "@/app/admin/actions";
import { CourseForm } from "@/components/admin/CourseForm";
import { DeleteCourseForm, LessonEditor, NewLessonForm } from "@/components/admin/LessonEditor";
import { btnSmall, panel } from "@/components/ui/styles";
import { requireAdmin } from "@/lib/auth";
import { getCourseById } from "@/lib/data/courses";

export default async function AdminCourse({ params }: PageProps<"/admin/courses/[id]">) {
  await requireAdmin();
  const course = await getCourseById((await params).id);
  if (!course) notFound();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 py-10">
        <div>
          <p className="label">{course.published ? "Live" : "Draft"}</p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">{course.title}</h1>
        </div>
        <div className="flex gap-2">
          {course.published && (
            <Link href={`/courses/${course.slug}`} className={btnSmall}>
              View on site
            </Link>
          )}
          <DeleteCourseForm id={course.id} title={course.title} action={deleteCourse} />
        </div>
      </div>

      <section className={`${panel} p-6`} aria-labelledby="details">
        <h2 id="details" className="mb-6 font-display text-2xl font-medium tracking-tight">
          Details
        </h2>
        <CourseForm course={course} />
      </section>

      <section className="mt-12" aria-labelledby="lessons">
        <h2 id="lessons" className="font-display text-2xl font-medium tracking-tight">
          Lessons and videos
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel">
          Upload a video to each lesson and choose who can watch it. Free lessons play for everyone; paywalled lessons
          play only for people who bought the course.
        </p>
        <ol className={`${panel} mt-5 divide-y divide-line overflow-hidden`}>
          {course.lessons.length === 0 && <li className="p-5 text-sm text-steel">No lessons yet. Add the first one below.</li>}
          {course.lessons.map((lesson, i) => (
            <LessonEditor key={lesson.id} lesson={lesson} index={i} count={course.lessons.length} />
          ))}
        </ol>
        <div className={`${panel} mt-5 p-6`}>
          <NewLessonForm courseId={course.id} />
        </div>
      </section>
    </>
  );
}
