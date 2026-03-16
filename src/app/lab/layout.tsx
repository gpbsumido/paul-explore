import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <nav
        className="sticky top-0 z-30 h-14 border-b border-border"
        style={{
          background: "color-mix(in srgb, var(--color-background) 80%, transparent)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="mx-auto flex h-full max-w-[1400px] items-center gap-4 px-4 sm:px-6">
          <Link
            href="/protected"
            className="flex shrink-0 items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden>
              <path d="M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Dashboard
          </Link>
          <span className="rounded-md bg-surface-raised px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted">
            Lab
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
