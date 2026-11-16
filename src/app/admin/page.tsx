import Link from "next/link";
import { btnPrimary, panel } from "@/components/ui/styles";
import { requireAdmin } from "@/lib/auth";
import { getCourses } from "@/lib/data/courses";
import { formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverview() {
  await requireAdmin();
  const supabase = await createClient();
  const [courses, { data: enrollments }] = await Promise.all([
    getCourses(true),
    supabase
      .from("enrollments")
      .select("id, amount_cents, created_at, course_id, profiles:user_id (email)")
      .order("created_at", { ascending: false }),
  ]);
  const rows = (enrollments ?? []) as unknown as {
    id: string;
    amount_cents: number;
    created_at: string;
    course_id: string;
    profiles: { email: string } | null;
  }[];
  const revenue = rows.reduce((sum, r) => sum + r.amount_cents, 0);
  const lessons = courses.reduce((sum, c) => sum + c.lessons.length, 0);
  const stats: [string, string][] = [
    ["Courses", `${courses.filter((c) => c.published).length} live · ${courses.filter((c) => !c.published).length} draft`],
    ["Lessons", String(lessons)],
    ["Enrolments", String(rows.length)],
    ["Revenue", revenue ? formatPrice(revenue) : "$0"],
  ];
  const titleOf = (id: string) => courses.find((c) => c.id === id)?.title ?? "Deleted course";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 py-10">
        <h1 className="font-display text-4xl font-medium tracking-tight">Overview</h1>
        <Link href="/admin/courses" className={btnPrimary}>
          Manage courses
        </Link>
      </div>
      <dl className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([name, value]) => (
          <div key={name} className="bg-panel p-6">
            <dt className="label">{name}</dt>
            <dd className="mt-3 font-display text-2xl font-medium tracking-tight">{value}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-12 font-display text-2xl font-medium tracking-tight">Recent enrolments</h2>
      <ul className={`${panel} mt-5 divide-y divide-line overflow-hidden`}>
        {rows.length === 0 && <li className="p-5 text-sm text-steel">No enrolments yet.</li>}
        {rows.slice(0, 12).map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-4 p-5 text-sm">
            <span className="min-w-0 flex-1 truncate">{r.profiles?.email ?? "Unknown"}</span>
            <span className="text-steel">{titleOf(r.course_id)}</span>
            <span className="label tabular-nums">{formatPrice(r.amount_cents)}</span>
            <span className="label tabular-nums">{new Date(r.created_at).toLocaleDateString("en-GB")}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
