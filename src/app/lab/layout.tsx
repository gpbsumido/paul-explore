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
        <div className="mx-auto flex h-full max-w-5xl items-center gap-3 px-4">
          <Link
            href="/protected"
            className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            ← Dashboard
          </Link>
          <span className="rounded-md bg-surface-raised px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted">
            Lab
          </span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
