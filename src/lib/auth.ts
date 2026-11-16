import { cache } from "react";
import { notFound } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** The signed-in visitor's profile, or null. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  if (!hasSupabase) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("id, email, full_name, role").eq("id", user.id).maybeSingle();
  return (
    (data as Profile | null) ?? { id: user.id, email: user.email ?? "", full_name: null, role: "student" }
  );
});

/** Admin pages and actions call this first. Everyone else gets a 404. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") notFound();
  return profile;
}
