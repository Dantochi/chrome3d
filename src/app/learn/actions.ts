"use server";

import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** Remembers where the viewer is in a lesson, and marks it complete at the end. */
export async function saveProgress(lessonId: string, seconds: number, completed: boolean) {
  if (!hasSupabase) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const row: Record<string, unknown> = {
    user_id: user.id,
    lesson_id: lessonId,
    last_position_seconds: Math.max(0, Math.floor(seconds)),
    updated_at: new Date().toISOString(),
  };
  if (completed) row.completed_at = new Date().toISOString();
  await supabase.from("lesson_progress").upsert(row, { onConflict: "user_id,lesson_id" });
}
