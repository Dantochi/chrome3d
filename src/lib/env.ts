export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Without Supabase the site runs in demo mode on the sample catalogue. */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);
export const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY);

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const INSTAGRAM_HANDLE = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? "chrome3d";
export const VIDEO_BUCKET = "course-videos";
