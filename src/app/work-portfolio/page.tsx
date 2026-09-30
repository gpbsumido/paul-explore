import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import AmbientBackground from "@/components/AmbientBackground";
import { loadWorkPortfolioRemoteGate } from "@/lib/flags-gate";
import {
  remoteOverride,
  servesWorkPortfolioRemote,
  workPortfolioRemote,
} from "@/lib/mfe/remotes";
import { VISITOR_COOKIE } from "@/lib/visitor";
import WorkPortfolioContent from "./WorkPortfolioContent";
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

// While the work-portfolio-remote flag decides per visitor which build they
// get, this has to render per request, same as /tcg/pocket. Once the remote is
// at 100% and the in-repo copy is deleted, it goes back to a static shell.
export const dynamic = "force-dynamic";

/**
 * Which build of the portfolio this visitor gets: the remote, if one is
 * configured and the flag (or the override) says so, else the in-repo copy.
 * The flag is only looked up when it can change the answer.
 */
async function chooseRemote() {
  const remote = workPortfolioRemote();
  const override = remoteOverride();
  const flagOn =
    remote && !override
      ? (
          await loadWorkPortfolioRemoteGate(
            (await cookies()).get(VISITOR_COOKIE)?.value ?? "anonymous",
          )
        ).enabled
      : false;
  return servesWorkPortfolioRemote({ remote, override, flagOn }) ? remote : null;
}

export default async function WorkPortfolioPage() {
  const remote = await chooseRemote();
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
          <WorkPortfolioContent />
        )}
      </div>
    </div>
  );
}
