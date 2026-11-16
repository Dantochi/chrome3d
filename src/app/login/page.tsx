import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { container, panel } from "@/components/ui/styles";
import { getProfile } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const target = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (await getProfile()) redirect(target);

  return (
    <div className={`${container} bg-grid flex min-h-svh items-center justify-center pb-16 pt-28`}>
      <div className={`${panel} w-full max-w-md p-7 sm:p-9`}>
        <p className="label">Your account</p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight">Sign in to Chrome3d</h1>
        <p className="mt-3 text-sm leading-relaxed text-steel">Buy courses and pick up where you left off.</p>
        {!hasSupabase && (
          <p className="mt-5 rounded-lg border border-line bg-raised p-3 text-sm text-steel">
            Demo mode: accounts switch on once the database is connected.
          </p>
        )}
        <div className="mt-7">
          <LoginForm next={target} />
        </div>
      </div>
    </div>
  );
}
