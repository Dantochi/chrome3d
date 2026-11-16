import { NextResponse } from "next/server";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { signedPlaybackUrl } from "@/lib/video";

/**
 * Returns a short-lived video URL if this visitor may watch the lesson
 * (free lesson, enrolled, or admin). The database policies make the decision.
 */
export async function GET(_: Request, { params }: RouteContext<"/api/lessons/[id]/playback">) {
  if (!hasSupabase) return NextResponse.json({ error: "Video is not connected" }, { status: 503 });
  const { id } = await params;
  const supabase = await createClient();

  const { data: allowed } = await supabase.rpc("can_view_lesson", { target: id });
  if (!allowed) return NextResponse.json({ error: "This lesson is locked" }, { status: 403 });

  const { data: video } = await supabase.from("lesson_videos").select("video_path").eq("lesson_id", id).maybeSingle();
  if (!video) return NextResponse.json({ error: "No video has been uploaded yet" }, { status: 404 });

  const url = await signedPlaybackUrl(supabase, video.video_path);
  if (!url) return NextResponse.json({ error: "Video is unavailable" }, { status: 502 });
  return NextResponse.json({ url }, { headers: { "Cache-Control": "private, no-store" } });
}
