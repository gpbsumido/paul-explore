import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import AmbientBackground from "@/components/AmbientBackground";
import { workPortfolioRemote } from "@/lib/mfe/remotes";
import RemoteWorkPortfolio from "./RemoteWorkPortfolio";
import RemoteReleaseChip from "./RemoteReleaseChip";

const TITLE = "Work Portfolio";
const DESCRIPTION =
  "Interactive reconstructions of features shipped on past products: analytics dashboards, marketing tooling, onboarding flows, and more, rebuilt as self-contained demos.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/work-portfolio`,
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

// The page is a static shell; everything inside the stage comes from the
// remote at runtime, so a remote release needs no deploy here. Cached at the
// CDN for a day.
export const revalidate = 86400;

export default function WorkPortfolioPage() {
  const remote = workPortfolioRemote();
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background">
      <AmbientBackground colorA="var(--color-feature-work-portfolio)" colorB="var(--color-secondary-500)" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <PageHeader
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Work Portfolio" },
          ]}
          right={remote ? <RemoteReleaseChip /> : undefined}
        />
        {remote ? (
          <RemoteWorkPortfolio remote={remote} />
        ) : (
          <p role="alert" className="m-auto max-w-md p-6 text-center text-muted">
            The work portfolio isn&apos;t configured on this deployment:
            WORK_PORTFOLIO_REMOTE_URL isn&apos;t a URL.
          </p>
        )}
      </div>
    </div>
  );
}
