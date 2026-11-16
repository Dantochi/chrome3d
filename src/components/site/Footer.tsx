import Link from "next/link";
import { TetrisForge } from "@/components/footer/TetrisForge";
import { container, textLink } from "@/components/ui/styles";
import { INSTAGRAM_HANDLE } from "@/lib/env";
import { Logo } from "./Logo";

const link = textLink;

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink">
      <div className={`${container} pt-16`}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="max-w-xl font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            Anything can be built, <span className="text-steel">one piece at a time.</span>
          </h2>
          <p className="label">Blocks → object → outline</p>
        </div>
        <TetrisForge />
        <div className="grid gap-10 border-t border-line py-12 sm:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-steel">
              Additive manufacturing, taught by people who print for a living.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="label">Learn</p>
            <Link href="/courses" className={link}>
              All courses
            </Link>
            <Link href="/dashboard" className={link}>
              My courses
            </Link>
            <Link href="/login" className={link}>
              Sign in
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="label">Follow</p>
            <a href={`https://www.instagram.com/${INSTAGRAM_HANDLE}/`} target="_blank" rel="noreferrer" className={link}>
              Instagram
            </a>
            <Link href="/#reels" className={link}>
              Latest reels
            </Link>
          </div>
        </div>
        <p className="label border-t border-line py-6">© {new Date().getFullYear()} Chrome3d</p>
      </div>
    </footer>
  );
}
