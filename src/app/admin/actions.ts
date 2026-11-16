"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { removeVideo } from "@/lib/video";

export type FormState = { error?: string; saved?: boolean };

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

function refresh(courseId?: string) {
  revalidatePath("/admin", "layout");
  revalidatePath("/courses", "layout");
  revalidatePath("/");
  if (courseId) revalidatePath(`/admin/courses/${courseId}`);
}

export async function createCourse(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const title = String(form.get("title") ?? "").trim();
  if (!title) return { error: "Give the course a title." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({ title, slug: `${slugify(title)}-${Date.now().toString(36).slice(-4)}` })
    .select("id")
    .single();
  if (error || !data) return { error: "The course could not be created." };
  refresh();
  redirect(`/admin/courses/${data.id}`);
}

export async function updateCourse(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(form.get("id"));
  const title = String(form.get("title") ?? "").trim();
  const slug = slugify(String(form.get("slug") ?? ""));
  const price = Number(form.get("price"));
  const level = String(form.get("level"));
  if (!title) return { error: "Give the course a title." };
  if (!slug) return { error: "The web address needs at least one letter or number." };
  if (!Number.isFinite(price) || price < 0) return { error: "Enter a price of 0 or more." };
  if (!LEVELS.includes(level)) return { error: "Choose a level." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({
      title,
      slug,
      summary: String(form.get("summary") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      topic: String(form.get("topic") ?? "").trim() || "General",
      level,
      price_cents: Math.round(price * 100),
      published: form.get("published") === "on",
    })
    .eq("id", id);
  if (error) return { error: error.code === "23505" ? "Another course already uses that web address." : "The course could not be saved." };
  refresh(id);
  return { saved: true };
}

export async function deleteCourse(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const supabase = await createClient();
  const { data: videos } = await supabase.from("lesson_videos").select("video_path, lessons!inner(course_id)").eq("lessons.course_id", id);
  for (const v of videos ?? []) await removeVideo(supabase, v.video_path);
  await supabase.from("courses").delete().eq("id", id);
  refresh();
  redirect("/admin/courses");
}

export async function createLesson(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const courseId = String(form.get("course_id"));
  const title = String(form.get("title") ?? "").trim();
  if (!title) return { error: "Give the lesson a title." };
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("lessons")
    .select("position")
    .eq("course_id", courseId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase
    .from("lessons")
    .insert({ course_id: courseId, title, position: (last?.position ?? -1) + 1, is_free: form.get("is_free") === "on" });
  if (error) return { error: "The lesson could not be added." };
  refresh(courseId);
  return { saved: true };
}

export async function updateLesson(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const title = String(form.get("title") ?? "").trim();
  if (!title) return { error: "Give the lesson a title." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("lessons")
    .update({ title, body: String(form.get("body") ?? ""), is_free: form.get("access") === "free" })
    .eq("id", String(form.get("id")));
  if (error) return { error: "The lesson could not be saved." };
  refresh(String(form.get("course_id")));
  return { saved: true };
}

export async function deleteLesson(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const supabase = await createClient();
  const { data: video } = await supabase.from("lesson_videos").select("video_path").eq("lesson_id", id).maybeSingle();
  if (video) await removeVideo(supabase, video.video_path);
  await supabase.from("lessons").delete().eq("id", id);
  refresh(String(form.get("course_id")));
}

export async function moveLesson(form: FormData) {
  await requireAdmin();
  const courseId = String(form.get("course_id"));
  const id = String(form.get("id"));
  const direction = form.get("direction") === "up" ? -1 : 1;
  const supabase = await createClient();
  const { data } = await supabase.from("lessons").select("id").eq("course_id", courseId).order("position");
  const ids = (data ?? []).map((l) => l.id as string);
  const from = ids.indexOf(id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  await Promise.all(ids.map((lessonId, position) => supabase.from("lessons").update({ position }).eq("id", lessonId)));
  refresh(courseId);
}

/** Called after the browser finishes uploading a video straight to storage. */
export async function setLessonVideo(courseId: string, lessonId: string, path: string, durationSeconds: number) {
  await requireAdmin();
  if (!path.startsWith(`${courseId}/${lessonId}/`)) throw new Error("Unexpected video path");
  const supabase = await createClient();
  const { data: previous } = await supabase.from("lesson_videos").select("video_path").eq("lesson_id", lessonId).maybeSingle();
  const { error } = await supabase
    .from("lesson_videos")
    .upsert({ lesson_id: lessonId, video_path: path, updated_at: new Date().toISOString() }, { onConflict: "lesson_id" });
  if (error) throw new Error("The video could not be attached to the lesson");
  await supabase
    .from("lessons")
    .update({ has_video: true, duration_seconds: Math.max(0, Math.round(durationSeconds)) })
    .eq("id", lessonId);
  if (previous && previous.video_path !== path) await removeVideo(supabase, previous.video_path);
  refresh(courseId);
}

export async function removeLessonVideo(form: FormData) {
  await requireAdmin();
  const lessonId = String(form.get("id"));
  const supabase = await createClient();
  const { data: video } = await supabase.from("lesson_videos").select("video_path").eq("lesson_id", lessonId).maybeSingle();
  if (video) await removeVideo(supabase, video.video_path);
  await supabase.from("lesson_videos").delete().eq("lesson_id", lessonId);
  await supabase.from("lessons").update({ has_video: false, duration_seconds: 0 }).eq("id", lessonId);
  refresh(String(form.get("course_id")));
}
