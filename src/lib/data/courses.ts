import { cache } from "react";
import { SAMPLE_COURSES } from "@/content/courses";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Course, Lesson } from "@/lib/types";

const COURSE_FIELDS =
  "id, slug, title, summary, description, level, topic, price_cents, currency, published, lessons (id, course_id, position, title, body, duration_seconds, is_free, has_video)";

function sortLessons(course: Course): Course {
  return { ...course, lessons: [...(course.lessons ?? [])].sort((a, b) => a.position - b.position) };
}

/** Published courses (admins also see drafts when `includeDrafts` is set). */
export const getCourses = cache(async (includeDrafts = false): Promise<Course[]> => {
  if (!hasSupabase) return SAMPLE_COURSES;
  const supabase = await createClient();
  let query = supabase.from("courses").select(COURSE_FIELDS).order("created_at");
  if (!includeDrafts) query = query.eq("published", true);
  const { data } = await query;
  return ((data ?? []) as unknown as Course[]).map(sortLessons);
});

export const getCourseBySlug = cache(async (slug: string): Promise<Course | null> => {
  if (!hasSupabase) return SAMPLE_COURSES.find((c) => c.slug === slug) ?? null;
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select(COURSE_FIELDS).eq("slug", slug).maybeSingle();
  return data ? sortLessons(data as unknown as Course) : null;
});

export const getCourseById = cache(async (id: string): Promise<Course | null> => {
  if (!hasSupabase) return SAMPLE_COURSES.find((c) => c.id === id) ?? null;
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select(COURSE_FIELDS).eq("id", id).maybeSingle();
  return data ? sortLessons(data as unknown as Course) : null;
});

/** Course ids the signed-in visitor is enrolled in. */
export const getEnrolledCourseIds = cache(async (): Promise<Set<string>> => {
  if (!hasSupabase) return new Set();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase.from("enrollments").select("course_id").eq("user_id", user.id);
  return new Set((data ?? []).map((r) => r.course_id as string));
});

export type Progress = Record<string, { last_position_seconds: number; completed: boolean }>;

/** The visitor's progress, keyed by lesson id. */
export const getProgress = cache(async (): Promise<Progress> => {
  if (!hasSupabase) return {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};
  const { data } = await supabase
    .from("lesson_progress")
    .select("lesson_id, last_position_seconds, completed_at")
    .eq("user_id", user.id);
  const out: Progress = {};
  for (const r of data ?? []) {
    out[r.lesson_id as string] = {
      last_position_seconds: r.last_position_seconds as number,
      completed: Boolean(r.completed_at),
    };
  }
  return out;
});

export function courseRuntime(course: Course) {
  return course.lessons.reduce((sum, l) => sum + l.duration_seconds, 0);
}

export function canWatch(lesson: Lesson, course: Course, enrolled: boolean, isAdmin: boolean) {
  return isAdmin || enrolled || (lesson.is_free && course.published);
}
