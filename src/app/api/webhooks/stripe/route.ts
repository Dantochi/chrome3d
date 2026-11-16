import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";

/** Stripe calls this after a successful payment; it is what unlocks the course. */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });

  const stripe = new Stripe(key);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const courseId = session.metadata?.course_id;
    if (session.payment_status === "paid" && userId && courseId) {
      const { error } = await createServiceClient()
        .from("enrollments")
        .upsert(
          { user_id: userId, course_id: courseId, stripe_session_id: session.id, amount_cents: session.amount_total ?? 0 },
          { onConflict: "user_id,course_id" },
        );
      // A failure here makes Stripe retry the event later.
      if (error) return NextResponse.json({ error: "Could not record enrolment" }, { status: 500 });
    }
  }
  return NextResponse.json({ received: true });
}
