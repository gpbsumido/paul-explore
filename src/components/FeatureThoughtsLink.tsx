"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { counterpartFor } from "@/lib/featureThoughts";

/**
 * A one-hop link between a feature and its dev-thoughts write-up.
 *
 * The two are halves of the same thing, but getting from one to the other used
 * to mean going back to the hub. Renders nothing on pages that aren't half of a
 * pair, so it's safe to drop into a shared header.
 */
export default function FeatureThoughtsLink() {
  const pathname = usePathname();
  const counterpart = counterpartFor(pathname);
  if (!counterpart) return null;

  const toThoughts = counterpart.direction === "to-thoughts";

  return (
    <Link
      href={counterpart.href}
      aria-label={
        toThoughts
          ? `Read the write-up on ${counterpart.title}`
          : `Open the ${counterpart.title} app`
      }
      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[12px] font-medium text-muted transition-colors hover:border-foreground/30 hover:text-foreground sm:min-h-0"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {toThoughts ? (
          <>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </>
        ) : (
          <>
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M21 14v7H3V3h7" />
          </>
        )}
      </svg>
      {toThoughts ? "Write-up" : "Open app"}
    </Link>
  );
}
