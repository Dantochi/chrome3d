import Link from "next/link";
import { CourseCard } from "@/components/courses/CourseCard";
import { Hero } from "@/components/hero/Hero";
import { ReelsRail } from "@/components/site/ReelsRail";
import { btnGhost, btnPrimary, container } from "@/components/ui/styles";
import { getCourses, getEnrolledCourseIds } from "@/lib/data/courses";

const PROCESS = [
  ["Design", "Model parts that want to be printed: orientation, overhangs, tolerances."],
  ["Slice", "Turn geometry into toolpaths you understand and control."],
  ["Print", "Run filament, resin and metal machines with repeatable results."],
  ["Finish", "Take a raw print to a surface that looks moulded."],
];

export default async function Home() {
  const [courses, enrolled] = await Promise.all([getCourses(), getEnrolledCourseIds()]);
  return (
    <>
      <Hero />

      <section className="border-b border-line py-20 sm:py-28">
        <div className={container}>
          <p className="label">What you learn</p>
          <h2 className="mt-4 max-w-3xl font-display text-3xl font-medium leading-tight tracking-tight sm:text-5xl">
            The whole workflow, <span className="text-steel">from a blank CAD file to a finished part.</span>
          </h2>
          <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map(([name, text], i) => (
              <li key={name} className="bg-ink p-6 sm:p-8">
                <p className="label !text-blueprint">0{i + 1}</p>
                <h3 className="mt-8 font-display text-2xl font-medium tracking-tight">{name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-steel">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-line py-20 sm:py-28">
        <div className={container}>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="label">Courses</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-5xl">Start printing with intent</h2>
            </div>
            <Link href="/courses" className={btnGhost}>
              Browse courses
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} owned={enrolled.has(course.id)} />
            ))}
          </div>
        </div>
      </section>

      <ReelsRail />

      <section className="bg-grid py-20 sm:py-28">
        <div className={`${container} flex flex-col items-start gap-8`}>
          <h2 className="max-w-3xl font-display text-4xl font-medium leading-[1.02] tracking-tight sm:text-6xl">
            <span className="text-chrome">Your first lesson is free.</span>
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-steel sm:text-lg">
            Every course opens with a free lesson. Watch it here on the site, then decide.
          </p>
          <Link href="/courses" className={btnPrimary}>
            Browse courses
          </Link>
        </div>
      </section>
    </>
  );
}
