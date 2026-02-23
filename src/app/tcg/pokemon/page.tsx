import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import BrowseContent from "./BrowseContent";

export default function PokemonTcgPage() {
  return (
    <div className="flex flex-col min-h-dvh max-w-[480px] mx-auto font-sans bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-center px-4 py-3 bg-background border-b border-border backdrop-blur-xl">
        <Link
          href="/protected"
          className="absolute left-4 text-[#007aff] text-sm flex items-center gap-0.5"
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path
              d="M9 1L2 8l7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          &nbsp;Back
        </Link>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-base font-semibold text-foreground">
            Pokemon TCG
          </span>
          <span className="text-[11px] text-muted">Card Browser</span>
        </div>
        <div className="absolute right-4 flex items-center gap-3">
          <Link
            href="/tcg/pokemon/sets"
            className="text-[#007aff] text-sm font-medium"
          >
            Sets
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <BrowseContent />
    </div>
  );
}
