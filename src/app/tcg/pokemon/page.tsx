import { Suspense } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import BrowseContent from "./BrowseContent";

export default function PokemonTcgPage() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <nav className="sticky top-0 z-20 h-14 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
          <Link
            href="/protected"
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors shrink-0"
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground">
            Pokémon TCG
          </span>
          <div className="ml-auto flex items-center gap-5">
            <Link
              href="/tcg/pokemon/sets"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Sets
            </Link>
            <Link
              href="/tcg/pocket"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Pocket
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <Suspense>
        <BrowseContent />
      </Suspense>
    </div>
  );
}
