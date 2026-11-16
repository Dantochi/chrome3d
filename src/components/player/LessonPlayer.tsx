"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saveProgress } from "@/app/learn/actions";

type Props = {
  lessonId: string;
  title: string;
  startAt: number;
  nextHref: string | null;
};

type Status = "loading" | "ready" | "missing" | "locked" | "error";

const MESSAGES: Record<Exclude<Status, "ready">, string> = {
  loading: "Loading video…",
  missing: "The video for this lesson has not been uploaded yet.",
  locked: "This lesson is locked.",
  error: "The video could not be loaded. Refresh to try again.",
};

/** On-site lesson video. Fetches a short-lived URL, resumes, and saves progress as you watch. */
export function LessonPlayer({ lessonId, title, startAt, nextHref }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(0);
  const [src, setSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/lessons/${lessonId}/playback`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          setSrc((await res.json()).url);
          setStatus("ready");
        } else setStatus(res.status === 403 ? "locked" : res.status === 404 || res.status === 503 ? "missing" : "error");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const save = (completed = false) => {
    const video = videoRef.current;
    if (!video) return;
    lastSaved.current = video.currentTime;
    void saveProgress(lessonId, video.currentTime, completed);
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-ink">
      {status === "ready" && src ? (
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
          aria-label={title}
          className="h-full w-full"
          onLoadedMetadata={(e) => {
            const video = e.currentTarget;
            if (startAt > 5 && startAt < video.duration - 10) video.currentTime = startAt;
          }}
          onTimeUpdate={(e) => {
            if (Math.abs(e.currentTarget.currentTime - lastSaved.current) >= 10) save();
          }}
          onPause={() => save()}
          onEnded={() => {
            save(true);
            if (nextHref) router.push(nextHref);
            else router.refresh();
          }}
        />
      ) : (
        <div className="bg-grid grid h-full w-full place-items-center p-6 text-center">
          <p role={status === "error" ? "alert" : "status"} className={`max-w-xs text-sm ${status === "error" ? "text-danger" : "text-steel"}`}>
            {MESSAGES[status as Exclude<Status, "ready">]}
          </p>
        </div>
      )}
    </div>
  );
}
