"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; notice?: string };

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  if (!hasSupabase) return { error: "Accounts are not connected yet." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email")),
    password: String(form.get("password")),
  });
  if (error) return { error: "That email and password do not match an account." };
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  if (!hasSupabase) return { error: "Accounts are not connected yet." };
  const password = String(form.get("password"));
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  const next = safeNext(form.get("next"));
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(form.get("email")),
    password,
    options: {
      data: { full_name: String(form.get("full_name") ?? "") },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: error.message };
  if (!data.session) return { notice: "Check your inbox and confirm your email to finish creating your account." };
  redirect(next);
}

export async function signOut() {
  if (hasSupabase) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
