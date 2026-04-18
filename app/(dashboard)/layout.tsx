"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
        active
          ? "bg-[var(--ink)] !text-white hover:!text-white"
          : "border border-[var(--line)] bg-white/80 !text-[var(--ink)] hover:bg-white hover:!text-[var(--ink)]"
      }`}
    >
      {label}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.12),_transparent_28%),linear-gradient(180deg,_#f5f4ed_0%,_#f1f6fb_100%)]">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <header className="panel rounded-[2rem] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href="/" className="text-sm font-medium text-[var(--muted)]">
                Supermarket Finance Console
              </Link>
              <p className="mt-1 text-xl font-semibold">経営管理ダッシュボード</p>
            </div>
            <nav className="flex flex-wrap gap-3">
              <NavLink href="/summary" label="サマリ" active={segment === "summary"} />
              <NavLink href="/data-entry" label="データ登録" active={segment === "data-entry"} />
            </nav>
          </div>
        </header>
        <main className="py-6">{children}</main>
      </div>
    </div>
  );
}
