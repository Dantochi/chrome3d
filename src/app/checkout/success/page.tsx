import type { Metadata } from "next";
import Link from "next/link";
import { btnGhost, btnPrimary, container, panel } from "@/components/ui/styles";
import { getCourseBySlug, getEnrolledCourseIds } from "@/lib/data/courses";

export const metadata: Metadata = { title: "Payment received" };

export default async function CheckoutSuccess({ searchParams }: PageProps<"/checkout/success">) {
  const { course: slug } = await searchParams;
  const course = typeof slug === "string" ? await getCourseBySlug(slug) : null;
  const ready = course ? (await getEnrolledCourseIds()).has(course.id) : false;

  return (
    <div className={`${container} bg-grid flex min-h-svh items-center justify-center pb-16 pt-28`}>
      <div className={`${panel} w-full max-w-md p-7 sm:p-9`}>
        <p className="label !text-blueprint">Payment received</p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight">
          {course ? `You're in: ${course.title}` : "Thank you"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-steel">
          {ready
            ? "Your course is unlocked and ready to watch."
            : "We are unlocking your course. This usually takes a few seconds; refresh if lessons still show as locked."}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {course && (
            <Link href={`/learn/${course.slug}`} className={btnPrimary}>
              Start watching
            </Link>
          )}
          <Link href="/dashboard" className={btnGhost}>
            My courses
          </Link>
        </div>
      </div>
    </div>
  );
}
