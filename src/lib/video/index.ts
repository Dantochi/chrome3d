import type { SupabaseClient } from "@supabase/supabase-js";
import { VIDEO_BUCKET } from "@/lib/env";

/**
 * All video hosting calls live here so the host can be swapped (e.g. for a streaming
 * service) without touching pages. Today: a private Supabase Storage bucket.
 */

/** Storage path for a lesson's video. The second segment is what the access policy checks. */
export function videoPath(courseId: string, lessonId: string, fileName: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
  return `${courseId}/${lessonId}/${Date.now()}-${safe}`;
}

/**
 * Short-lived playback URL. The client passed in carries the visitor's own session, so
 * storage policies decide whether they may watch: free lesson, enrolled, or admin.
 */
export async function signedPlaybackUrl(supabase: SupabaseClient, path: string, seconds = 60 * 60 * 2) {
  const { data, error } = await supabase.storage.from(VIDEO_BUCKET).createSignedUrl(path, seconds);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function removeVideo(supabase: SupabaseClient, path: string) {
  await supabase.storage.from(VIDEO_BUCKET).remove([path]);
}
