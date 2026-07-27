import { Suspense } from "react";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import FlagsConsole from "./FlagsConsole";
import FlagsLoading from "./loading";

const TITLE = "Feature Flags";
const DESCRIPTION =
  "A feature-flag management console: per-environment targeting rules, sticky percentage rollouts, a kill switch, an audit log, and a live evaluation playground powered by a deterministic engine.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/flags`,
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

export default function FlagsPage() {
  return (
    <PageShell colorA="#fb923c" colorB="#38bdf8" className="font-sans">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Feature Flags" }]}
      />

      <Suspense fallback={<FlagsLoading />}>
        <FlagsConsole />
      </Suspense>
    </PageShell>
  );
}
