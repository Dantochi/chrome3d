import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Chrome3d home">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
        <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z" />
        <path d="M3.5 7 12 11.5 20.5 7M12 11.5v10" className="text-blueprint" stroke="currentColor" />
      </svg>
      <span className="font-display text-lg font-medium tracking-tight">
        Chrome<span className="text-steel">3d</span>
      </span>
    </Link>
  );
}
