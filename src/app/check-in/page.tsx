import type { Metadata } from "next";
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import CheckInContent from "./CheckInContent";

const TITLE = "Volunteer check-in";
const DESCRIPTION =
  "Confirm you've arrived on site by entering the code showing on the display at the entrance.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/check-in`,
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

export default function CheckInPage() {
  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "Check-in" }]}
      />
      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">Check in</h1>
        <p className="mt-1 mb-6 text-sm text-muted">
          Type the six digits showing on the display at the entrance. The code
          changes every couple of minutes, so it only works while you&apos;re
          here.
        </p>
        {/* useSearchParams needs a Suspense boundary to keep the route static. */}
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <CheckInContent />
        </Suspense>
      </main>
    </PageShell>
  );
}
