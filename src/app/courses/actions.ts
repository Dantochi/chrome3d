"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { getProfile } from "@/lib/auth";
import { getCourseById } from "@/lib/data/courses";
import { hasStripe, hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type BuyState = { error?: string };

/** Starts a purchase: free courses enrol at once, paid courses go to Stripe Checkout. */
export async function buyCourse(_: BuyState, form: FormData): Promise<BuyState> {
  if (!hasSupabase) return { error: "Demo mode: purchases switch on once the database is connected." };
  const course = await getCourseById(String(form.get("course_id")));
  if (!course || !course.published) return { error: "This course is not available." };

  const profile = await getProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`);

  if (course.price_cents === 0) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("enrollments")
      .upsert({ user_id: profile.id, course_id: course.id, amount_cents: 0 }, { onConflict: "user_id,course_id", ignoreDuplicates: true });
    if (error) return { error: "We could not enrol you. Please try again." };
    revalidatePath(`/courses/${course.slug}`);
    redirect(`/learn/${course.slug}`);
  }

  if (!hasStripe) return { error: "Payments are not switched on yet. Please check back soon." };

  const origin = (await headers()).get("origin") ?? "";
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: profile.email || undefined,
    client_reference_id: profile.id,
    metadata: { user_id: profile.id, course_id: course.id },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: course.currency,
          unit_amount: course.price_cents,
          product_data: { name: course.title, description: course.summary || undefined },
        },
      },
    ],
    success_url: `${origin}/checkout/success?course=${course.slug}`,
    cancel_url: `${origin}/courses/${course.slug}`,
  });
  if (!session.url) return { error: "We could not start the checkout. Please try again." };
  redirect(session.url);
}
