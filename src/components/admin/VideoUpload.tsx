"use client";

import { useRef, useState } from "react";
import * as tus from "tus-js-client";
import { setLessonVideo } from "@/app/admin/actions";
import { btnSmall } from "@/components/ui/styles";
import { SUPABASE_KEY, SUPABASE_URL, VIDEO_BUCKET } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { videoPath } from "@/lib/video";

function readDuration(file: File) {
  return new Promise<number>((resolve) => {
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      URL.revokeObjectURL(probe.src);
      resolve(Number.isFinite(probe.duration) ? probe.duration : 0);
    };
    probe.onerror = () => resolve(0);
    probe.src = URL.createObjectURL(file);
  });
}

type State = { phase: "idle" } | { phase: "uploading"; pct: number; paused: boolean } | { phase: "saving" } | { phase: "error"; message: string };

/** Resumable upload from the browser straight to private storage, with pause and resume. */
export function VideoUpload({ courseId, lessonId, hasVideo }: { courseId: string; lessonId: string; hasVideo: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useRef<tus.Upload | null>(null);
  const [state, setState] = useState<State>({ phase: "idle" });

  async function start(file: File) {
    if (!file.type.startsWith("video/")) return setState({ phase: "error", message: "Choose a video file (MP4 works best)." });
    const {
      data: { session },
    } = await createClient().auth.getSession();
    if (!session) return setState({ phase: "error", message: "Your session has ended. Sign in again." });

    const [duration, path] = [await readDuration(file), videoPath(courseId, lessonId, file.name)];
    setState({ phase: "uploading", pct: 0, paused: false });
    upload.current = new tus.Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${session.access_token}`, apikey: SUPABASE_KEY },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: { bucketName: VIDEO_BUCKET, objectName: path, contentType: file.type, cacheControl: "3600" },
      onError: (error) => {
        const tooLarge = /413|exceeded|too large/i.test(String(error));
        setState({
          phase: "error",
          message: tooLarge ? "This file is larger than the storage plan allows." : "The upload failed. Check your connection and try again.",
        });
      },
      onProgress: (sent, total) => setState((s) => ({ phase: "uploading", pct: Math.round((sent / total) * 100), paused: s.phase === "uploading" && s.paused })),
      onSuccess: async () => {
        setState({ phase: "saving" });
        try {
          await setLessonVideo(courseId, lessonId, path, duration);
          setState({ phase: "idle" });
        } catch {
          setState({ phase: "error", message: "The video uploaded but could not be attached. Try again." });
        }
      },
    });
    upload.current.start();
  }

  function togglePause() {
    if (state.phase !== "uploading" || !upload.current) return;
    if (state.paused) upload.current.start();
    else void upload.current.abort();
    setState({ ...state, paused: !state.paused });
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={input}
        type="file"
        accept="video/*"
        className="sr-only"
        aria-label="Lesson video file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void start(file);
          e.target.value = "";
        }}
      />
      {state.phase === "uploading" ? (
        <div className="flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={state.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
            <div className="h-full bg-blueprint transition-[width]" style={{ width: `${state.pct}%` }} />
          </div>
          <span className="label w-9 text-right tabular-nums">{state.pct}%</span>
          <button type="button" className={btnSmall} onClick={togglePause}>
            {state.paused ? "Resume" : "Pause"}
          </button>
        </div>
      ) : (
        <button type="button" className={btnSmall} disabled={state.phase === "saving"} onClick={() => input.current?.click()}>
          {state.phase === "saving" ? "Finishing…" : hasVideo ? "Replace video" : "Upload video"}
        </button>
      )}
      {state.phase === "error" && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
    </div>
  );
}
