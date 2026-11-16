import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { canWatch, getCourseBySlug, getEnrolledCourseIds, getProgress } from "@/lib/data/courses";

/** Opens the course at the first lesson the viewer has not finished. */
export default async function LearnIndex({ params }: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  const [profile, enrolledIds, progress] = await Promise.all([getProfile(), getEnrolledCourseIds(), getProgress()]);
  const enrolled = enrolledIds.has(course.id);
  const open = course.lessons.filter((l) => canWatch(l, course, enrolled, profile?.role === "admin"));
  const target = open.find((l) => !progress[l.id]?.completed) ?? open[0];
  if (!target) redirect(`/courses/${course.slug}`);
  redirect(`/learn/${course.slug}/${target.id}`);
}
