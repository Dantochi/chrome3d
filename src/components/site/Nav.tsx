import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { btnSmall, container, textLink } from "@/components/ui/styles";
import { getProfile } from "@/lib/auth";
import { Logo } from "./Logo";

const link = textLink;

export async function Nav() {
  const profile = await getProfile();
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/60 bg-ink/70 backdrop-blur-md">
      <nav className={`${container} flex h-16 items-center justify-between gap-4`} aria-label="Main">
        <Logo />
        <div className="flex items-center gap-4 sm:gap-7">
          <Link href="/courses" className={link}>
            Courses
          </Link>
          <Link href="/#reels" className={`${link} hidden sm:inline`}>
            Reels
          </Link>
          {profile ? (
            <>
              <Link href="/dashboard" className={link}>
                My courses
              </Link>
              {profile.role === "admin" && (
                <Link href="/admin" className={link}>
                  Admin
                </Link>
              )}
              <form action={signOut}>
                <button className={btnSmall}>Sign out</button>
              </form>
            </>
          ) : (
            <Link href="/login" className={btnSmall}>
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
