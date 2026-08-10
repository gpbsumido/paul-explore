import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import { plannerInputsFromParams } from "@/lib/operator-planner";
import LocationPlanner from "@/components/operator/LocationPlanner";

const TITLE = "Plan a Location";
const DESCRIPTION =
  "Model a new smart-store location's revenue and payback before you commit. Adjust foot traffic, conversion, basket size and margin and watch the projection update live.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/operator/planner`,
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

interface PlannerPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PlannerPage({ searchParams }: PlannerPageProps) {
  // The URL is the source of truth on load: a shared link deep-links to a
  // specific set of assumptions, a fresh visit falls back to defaults and gets
  // the fleet's own averages offered.
  const { inputs, hasQuery } = plannerInputsFromParams(await searchParams);

  return (
    <PageShell colorA="#8b5cf6" colorB="#38bdf8" className="font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Operator", href: "/operator" },
          { label: "Plan a location" },
        ]}
      />

      <main className="reveal-up mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Plan a location</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Deciding whether to open another store? Model its revenue and
            payback before you commit. Move the assumptions and the projection
            updates live — including the honest answer when a location never
            pays back. Share the link to send someone the exact scenario.
          </p>
        </div>

        <LocationPlanner initialInputs={inputs} prefillFromFleet={!hasQuery} />
      </main>
    </PageShell>
  );
}
