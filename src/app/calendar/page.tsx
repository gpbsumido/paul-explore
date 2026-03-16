import { Suspense } from "react";
import type { Metadata } from "next";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import PageHeader from "@/components/PageHeader";
import { auth0 } from "@/lib/auth0";
import CalendarContent from "./CalendarContent";
import CalendarLoading from "./loading";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import type { CalendarEvent } from "@/types/calendar";

const TITLE = "Calendar";
const DESCRIPTION =
  "A full-stack personal calendar with day, week, month, and year views. Create events, attach Pokémon cards, and navigate across dates -- all persisted in Postgres per user.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/calendar`,
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
 * Fetches the current month's events server-side so the calendar grid renders
 * with real data on first paint. Falls back gracefully if auth or the backend
 * is unavailable -- CalendarContent will client-fetch on mount instead.
 *
 * Calls the backend directly rather than through /api/calendar/events to avoid
 * a loopback HTTP call on the same server.
 */
async function CalendarWithData() {
  let initialEvents: CalendarEvent[] | undefined;

  try {
    const { token } = await auth0.getAccessToken();
    if (token) {
      const now = new Date();
      const start = startOfWeek(startOfMonth(now)).toISOString();
      const end = endOfWeek(endOfMonth(now)).toISOString();

      const res = await fetch(
        `${API_URL}/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      );

      if (res.ok) {
        const data = await res.json();
        initialEvents = data.events as CalendarEvent[];
      }
    }
  } catch {
    // auth error or backend down -- CalendarContent will client-fetch on mount
  }

  return <CalendarContent initialEvents={initialEvents} />;
}

export default function CalendarPage() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Calendar" }]}
      />

      <Suspense fallback={<CalendarLoading />}>
        <CalendarWithData />
      </Suspense>
    </div>
  );
}
