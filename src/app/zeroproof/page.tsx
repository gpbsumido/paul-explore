import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import ZeroProofContent from "./ZeroProofContent";

const TITLE = "ZeroProof";
const DESCRIPTION =
  "A no-loss sportsbook: lock a deposit, bet real lines, get the deposit back at term end, and keep the record. Read-only lobby — the events board, served from a real double-entry ledger with simulated dollars.";

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

export default function ZeroProofPage() {
  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "ZeroProof" }]}
      />
      <main>
        <ZeroProofContent />
      </main>
    </PageShell>
  );
}
