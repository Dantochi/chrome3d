"use client";

import { useActionState, useState } from "react";
import { createLesson, deleteLesson, moveLesson, removeLessonVideo, updateLesson, type FormState } from "@/app/admin/actions";
import { btnPrimary, btnSmall, btnSmallDanger, check, field, fieldLabel, textarea } from "@/components/ui/styles";
import { formatDuration } from "@/lib/format";
import type { Lesson } from "@/lib/types";
import { Feedback } from "./CourseForm";
import { VideoUpload } from "./VideoUpload";

export function LessonEditor({ lesson, index, count }: { lesson: Lesson; index: number; count: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateLesson, {});
  const [open, setOpen] = useState(false);
  const ids = (
    <>
      <input type="hidden" name="id" value={lesson.id} />
      <input type="hidden" name="course_id" value={lesson.course_id} />
    </>
  );

  return (
    <li className="p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="label w-6 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{lesson.title}</p>
        <span className={`label ${lesson.is_free ? "!text-blueprint" : ""}`}>{lesson.is_free ? "Free" : "Paywalled"}</span>
        <span className="label tabular-nums">{lesson.has_video ? formatDuration(lesson.duration_seconds) : "No video"}</span>
        <form action={moveLesson} className="flex gap-1">
          {ids}
          <button name="direction" value="up" disabled={index === 0} className={btnSmall} aria-label={`Move ${lesson.title} up`}>
            ↑
          </button>
          <button name="direction" value="down" disabled={index === count - 1} className={btnSmall} aria-label={`Move ${lesson.title} down`}>
            ↓
          </button>
        </form>
        <button type="button" className={btnSmall} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Close" : "Edit"}
        </button>
      </div>

      {open && (
        <div className="mt-5 grid gap-6 border-t border-line pt-5 lg:grid-cols-[1fr_16rem]">
          <form action={action} className="flex flex-col gap-5">
            {ids}
            <div>
              <label htmlFor={`title-${lesson.id}`} className={fieldLabel}>
                Lesson title
              </label>
              <input id={`title-${lesson.id}`} name="title" required defaultValue={lesson.title} className={field} />
            </div>
            <fieldset>
              <legend className={fieldLabel}>Who can watch</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["paywalled", "Paywalled", "Only people who bought the course"],
                  ["free", "Free", "Anyone, without buying"],
                ].map(([value, name, hint]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-panel p-3 text-sm transition-colors has-[:checked]:border-blueprint"
                  >
                    <input
                      type="radio"
                      name="access"
                      value={value}
                      defaultChecked={lesson.is_free === (value === "free")}
                      className={`${check} mt-0.5`}
                    />
                    <span>
                      {name}
                      <span className="mt-0.5 block text-xs text-steel">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor={`body-${lesson.id}`} className={fieldLabel}>
                Notes · shown under the video
              </label>
              <textarea id={`body-${lesson.id}`} name="body" defaultValue={lesson.body} className={textarea} />
            </div>
            <div className="flex items-center gap-4">
              <button className={btnPrimary} disabled={pending}>
                {pending ? "Saving…" : "Save lesson"}
              </button>
              <Feedback state={state} />
            </div>
          </form>

          <div className="flex flex-col gap-4">
            <div>
              <p className={fieldLabel}>Video</p>
              <p className="mb-3 text-sm text-steel">
                {lesson.has_video ? `Uploaded · ${formatDuration(lesson.duration_seconds)}` : "No video uploaded yet."}
              </p>
              <VideoUpload courseId={lesson.course_id} lessonId={lesson.id} hasVideo={lesson.has_video} />
            </div>
            {lesson.has_video && (
              <form action={removeLessonVideo}>
                {ids}
                <button className={btnSmall}>Remove video</button>
              </form>
            )}
            <form
              action={deleteLesson}
              onSubmit={(e) => {
                if (!confirm(`Delete the lesson "${lesson.title}" and its video?`)) e.preventDefault();
              }}
              className="mt-auto"
            >
              {ids}
              <button className={btnSmallDanger}>Delete lesson</button>
            </form>
          </div>
        </div>
      )}
    </li>
  );
}

export function NewLessonForm({ courseId }: { courseId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createLesson, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="course_id" value={courseId} />
      <label htmlFor="new-lesson-title" className={fieldLabel}>
        New lesson title
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input id="new-lesson-title" name="title" required key={String(state.saved)} placeholder="e.g. Calibrating flow rate" className={field} />
        <label className="flex shrink-0 items-center gap-2 text-sm">
          <input type="checkbox" name="is_free" className={check} />
          Free lesson
        </label>
        <button className={`${btnPrimary} shrink-0`} disabled={pending}>
          {pending ? "Adding…" : "Add lesson"}
        </button>
      </div>
      <Feedback state={state} saved="Lesson added" />
    </form>
  );
}

export function DeleteCourseForm({ id, title, action }: { id: string; title: string; action: (form: FormData) => void }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete "${title}", all its lessons and videos? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className={btnSmallDanger}>Delete course</button>
    </form>
  );
}
