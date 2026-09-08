import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import LeagueDetailContent from "./LeagueDetailContent";

const TITLE = "League · ZeroProof";
const DESCRIPTION =
  "A ZeroProof league: the rules, the board ranked by bankroll, and the winner. Simulated dollars, a real ledger.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/zeroproof`,
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

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[
          { label: "Hub", href: "/" },
          { label: "ZeroProof", href: "/zeroproof" },
          { label: "League" },
        ]}
      />
      <main>
        <LeagueDetailContent leagueId={id} />
      </main>
    </PageShell>
  );
}
