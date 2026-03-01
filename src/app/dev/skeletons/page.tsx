// Dev-only hub for all skeleton states. Navigate here in the browser to inspect
// any skeleton without having to catch the loading flash. 404s in production.
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MonthSkeleton,
  DaySkeleton,
  WeekSkeleton,
  YearSkeleton,
} from "@/app/calendar/CalendarSkeletons";
import ThoughtsSkeleton from "@/components/ThoughtsSkeleton";
import EventListSkeleton from "@/app/calendar/events/EventListSkeleton";
import EventDetailSkeleton from "@/app/calendar/events/[id]/EventDetailSkeleton";

export const metadata = { title: "Skeleton Preview" };

// Full-page skeletons that need their own route to render correctly
// (they have min-h-dvh + their own sticky navs).
const FULL_PAGE = [
  {
    label: "ProtectedLoading",
    href: "/dev/skeletons/protected",
    note: "/protected hub — sticky header, feature card grid, dev-notes cards",
  },
  {
    label: "SetsLoading",
    href: "/dev/skeletons/tcg-sets",
    note: "/tcg/pokemon/sets — sticky nav, title, 3 series sections with set cards",
  },
  {
    label: "PocketLoading",
    href: "/dev/skeletons/tcg-pocket",
    note: "/tcg/pocket — sticky nav, indigo hero, expansion group cards",
  },
  {
    label: "CardDetailLoading",
    href: "/dev/skeletons/tcg-card",
    note: "/tcg/pokemon/card/[id] — nav, card image, name/HP, type pills, abilities, attacks",
  },
  {
    label: "SetDetailLoading",
    href: "/dev/skeletons/tcg-set-detail",
    note: "/tcg/pokemon/sets/[id] — nav, set header, card grid",
  },
];

export default function SkeletonHub() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 space-y-16">

        {/* Page header */}
        <div className="border-b border-border pb-6">
          <h1 className="text-2xl font-bold mb-1">Skeleton Preview</h1>
          <p className="text-sm text-muted">
            Dev only. All skeleton states in one place — no loading flash to catch.
            Full-page skeletons (with their own navs) open in their own route.
          </p>
        </div>

        {/* Full-page skeleton links */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-1">Full-page skeletons</h2>
          <p className="text-xs text-muted mb-4">
            These have their own sticky nav + min-h-dvh so they need a dedicated URL.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FULL_PAGE.map(({ label, href, note }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4 hover:bg-surface-raised transition-colors"
              >
                <span className="font-mono text-sm font-semibold text-foreground">{label}</span>
                <span className="text-xs text-muted">{note}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ---- Inline/component-level skeletons ---- */}

        <InlineSection
          label="MonthSkeleton"
          note="loading.tsx during SSR + month view's own loading state when switching back"
        >
          {/* MonthSkeleton has its own max-w + padding wrapper built in, pull it out */}
          <div className="-mx-4">
            <MonthSkeleton />
          </div>
        </InlineSection>

        <InlineSection
          label="DaySkeleton"
          note="loading fallback for the DayView next/dynamic chunk on first switch"
        >
          <DaySkeleton />
        </InlineSection>

        <InlineSection
          label="WeekSkeleton"
          note="loading fallback for WeekView, includes the always-present all-day row"
        >
          <WeekSkeleton />
        </InlineSection>

        <InlineSection
          label="YearSkeleton"
          note="loading fallback for YearView, 12 mini month cards in a responsive grid"
        >
          <YearSkeleton />
        </InlineSection>

        <InlineSection
          label="ThoughtsSkeleton"
          note="shown once during the RSC fetch when navigating to any /thoughts/* page"
        >
          <ThoughtsSkeleton />
        </InlineSection>

        <InlineSection
          label="EventListSkeleton"
          note="shown in the /calendar/events list while the event data loads"
        >
          <EventListSkeleton />
        </InlineSection>

        <InlineSection
          label="EventDetailSkeleton"
          note="loading.tsx for /calendar/events/[id] — breadcrumb, title, card grid"
        >
          <EventDetailSkeleton />
        </InlineSection>

        <InlineSection
          label="FeatureHub header bones"
          note="/protected sticky header (sm+) and greeting h1 while /api/me is in-flight"
        >
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs text-muted mb-2">header user info (hidden on mobile)</p>
              <div className="flex flex-col gap-0.5">
                <div className="h-[11px] w-[88px] rounded bg-surface animate-pulse" />
                <div className="h-[10px] w-[120px] rounded bg-surface animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted mb-2">greeting first-name slot in the page h1</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold">Hey</span>
                <span className="inline-block h-4 w-16 translate-y-0.5 rounded bg-surface animate-pulse" />
              </div>
            </div>
          </div>
        </InlineSection>

      </div>
    </div>
  );
}

function InlineSection({
  label,
  note,
  children,
}: {
  label: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="font-mono text-sm font-semibold text-foreground">{label}</h2>
        <p className="text-xs text-muted mt-0.5">{note}</p>
      </div>
      <div className="rounded-xl border border-border bg-background overflow-hidden p-4">
        {children}
      </div>
    </section>
  );
}
