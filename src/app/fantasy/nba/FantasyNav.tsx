"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/fantasy/nba/matchups", label: "Matchups" },
  { href: "/fantasy/nba/playoffs", label: "Playoffs" },
  { href: "/fantasy/nba/league-history", label: "League History" },
  { href: "/fantasy/nba/player/stats", label: "Player Stats" },
  { href: "/fantasy/nba/court-vision", label: "Court Vision" },
] as const;

/** Tab bar shared across ESPN fantasy basketball pages. */
export default function FantasyNav() {
  const pathname = usePathname();

  return (
    <nav
      className="border-b border-border"
      aria-label="Fantasy basketball pages"
    >
      <div className="mx-auto flex max-w-5xl gap-1 px-4 sm:px-6 overflow-x-auto">
        {LINKS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={[
                "relative px-3 py-3 sm:py-2.5 text-[13px] font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted hover:text-foreground/80",
              ].join(" ")}
            >
              {label}
              {active && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-foreground" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
