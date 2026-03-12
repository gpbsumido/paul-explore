import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { auth0 } from "@/lib/auth0";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import type { CountdownPage } from "@/types/calendar";
import CountdownContent from "./CountdownContent";

const TITLE = "Countdowns";
const DESCRIPTION = "Track upcoming dates and how long until they arrive.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/calendar/countdown`,
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Fetches all countdowns server-side so the list renders with real data on
 * first paint. Calls the backend directly rather than through the BFF route
 * to avoid a loopback HTTP call on the same server.
 *
 * Falls back gracefully if auth fails or the backend is down. CountdownContent
 * will client-fetch on mount via useCountdowns in that case.
 */
async function CountdownsWithData() {
  let initialPage: CountdownPage | undefined;

  try {
    const { token } = await auth0.getAccessToken();
    if (token) {
      const res = await fetch(`${API_URL}/api/calendar/countdowns`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        initialPage = (await res.json()) as CountdownPage;
      }
    }
  } catch {
    // auth error or backend down, CountdownContent handles it
  }

  return <CountdownContent initialPage={initialPage} />;
}

export default function CountdownPage() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <nav className="sticky top-0 z-20 h-14 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
          <Link
            href="/calendar"
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors shrink-0"
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path
                d="M5 1L1 5l4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Calendar
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground">
            Countdowns
          </span>
          <div className="ml-auto flex items-center gap-5">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <Suspense
        fallback={
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="h-8 w-40 rounded-lg bg-surface-raised animate-pulse" />
              <div className="h-8 w-32 rounded-lg bg-surface-raised animate-pulse" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-surface-raised animate-pulse"
                />
              ))}
            </div>
          </div>
        }
      >
        <CountdownsWithData />
      </Suspense>
    </div>
  );
}
