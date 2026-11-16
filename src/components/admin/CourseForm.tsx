"use client";

import { useActionState } from "react";
import { createCourse, updateCourse, type FormState } from "@/app/admin/actions";
import { btnPrimary, field, fieldLabel, textarea } from "@/components/ui/styles";
import type { Course } from "@/lib/types";

export function Feedback({ state, saved = "Saved" }: { state: FormState; saved?: string }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm text-danger">
        {state.error}
      </p>
    );
  if (state.saved)
    return (
      <p role="status" className="text-sm text-blueprint">
        {saved}
      </p>
    );
  return null;
}

export function NewCourseForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createCourse, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="new-course-title" className={fieldLabel}>
        New course title
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id="new-course-title" name="title" required placeholder="e.g. Printing with carbon fibre" className={field} />
        <button className={`${btnPrimary} shrink-0`} disabled={pending}>
          {pending ? "Creating…" : "Create course"}
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function CourseForm({ course }: { course: Course }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateCourse, {});
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <input type="hidden" name="id" value={course.id} />
      <div className="sm:col-span-2">
        <label htmlFor="title" className={fieldLabel}>
          Title
        </label>
        <input id="title" name="title" required defaultValue={course.title} className={field} />
      </div>
      <div>
        <label htmlFor="slug" className={fieldLabel}>
          Web address · /courses/…
        </label>
        <input id="slug" name="slug" required defaultValue={course.slug} className={field} />
      </div>
      <div>
        <label htmlFor="topic" className={fieldLabel}>
          Topic
        </label>
        <input id="topic" name="topic" defaultValue={course.topic} placeholder="FDM, Resin, Metal…" className={field} />
      </div>
      <div>
        <label htmlFor="level" className={fieldLabel}>
          Level
        </label>
        <select id="level" name="level" defaultValue={course.level} className={field}>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
      </div>
      <div>
        <label htmlFor="price" className={fieldLabel}>
          Price · USD, 0 for a free course
        </label>
        <input id="price" name="price" type="number" min="0" step="0.01" required defaultValue={course.price_cents / 100} className={field} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="summary" className={fieldLabel}>
          Summary · shown on course cards
        </label>
        <input id="summary" name="summary" defaultValue={course.summary} className={field} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="description" className={fieldLabel}>
          Description
        </label>
        <textarea id="description" name="description" defaultValue={course.description} className={textarea} />
      </div>
      <label className="flex items-center gap-3 text-sm sm:col-span-2">
        <input type="checkbox" name="published" defaultChecked={course.published} className="h-4 w-4 accent-[var(--blueprint)]" />
        Published · visible on the site
      </label>
      <div className="flex items-center gap-4 sm:col-span-2">
        <button className={btnPrimary} disabled={pending}>
          {pending ? "Saving…" : "Save course"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}
