import type { ReactNode } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function EventsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <nav
        className="sticky top-0 z-20 h-14 border-b border-border"
        style={{
          background: "color-mix(in srgb, var(--color-background) 80%, transparent)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-full flex items-center gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden>
              <path d="M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Dashboard
          </Link>
          <div className="h-4 w-px bg-border" />
          <Link href="/calendar" className="text-sm text-muted transition-colors hover:text-foreground shrink-0">
            Calendar
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground">
            Events
          </span>
          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
            <a
              href="/auth/logout"
              className="text-[13px] font-medium text-muted transition-colors hover:text-foreground"
            >
              Log out
            </a>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
