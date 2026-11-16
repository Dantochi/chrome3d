import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/components/ui/styles";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div className={`${container} pb-20 pt-24`}>
      <nav className="flex items-center gap-6 border-b border-line pb-4" aria-label="Admin">
        <p className="label !text-blueprint">Admin</p>
        <Link href="/admin" className="text-sm text-steel transition-colors hover:text-chrome">
          Overview
        </Link>
        <Link href="/admin/courses" className="text-sm text-steel transition-colors hover:text-chrome">
          Courses
        </Link>
      </nav>
      {children}
    </div>
  );
}
