"use client";

import { useActionState, useState } from "react";
import { btnPrimary, field, fieldLabel } from "@/components/ui/styles";
import { signIn, signUp, type AuthState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState<AuthState, FormData>(signIn, {});
  const [upState, upAction, upPending] = useActionState<AuthState, FormData>(signUp, {});
  const state = mode === "in" ? inState : upState;
  const pending = inPending || upPending;

  return (
    <form action={mode === "in" ? inAction : upAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      {mode === "up" && (
        <div>
          <label htmlFor="full_name" className={fieldLabel}>
            Name
          </label>
          <input id="full_name" name="full_name" autoComplete="name" className={field} />
        </div>
      )}
      <div>
        <label htmlFor="email" className={fieldLabel}>
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={field} />
      </div>
      <div>
        <label htmlFor="password" className={fieldLabel}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "up" ? 8 : undefined}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          className={field}
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.notice && (
        <p role="status" className="text-sm text-blueprint">
          {state.notice}
        </p>
      )}
      <button className={btnPrimary} disabled={pending}>
        {pending ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}
      </button>
      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="text-sm text-steel transition-colors hover:text-chrome"
      >
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
