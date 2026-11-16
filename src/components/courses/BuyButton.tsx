"use client";

import { useActionState } from "react";
import { buyCourse, type BuyState } from "@/app/courses/actions";
import { btnPrimary } from "@/components/ui/styles";

export function BuyButton({ courseId, label }: { courseId: string; label: string }) {
  const [state, action, pending] = useActionState<BuyState, FormData>(buyCourse, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="course_id" value={courseId} />
      <button className={`${btnPrimary} w-full`} disabled={pending}>
        {pending ? "One moment…" : label}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
