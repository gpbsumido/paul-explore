import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import ResearchContent from "./ResearchContent";

const TITLE = "Vascular Research Explorer";
const DESCRIPTION =
  "Browse candidate vascular surgery research topics against the literature that already exists, read the recent papers, and find the demographic gaps worth studying.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/research`,
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

export default function ResearchPage() {
  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "Research" }]}
      />
      <main>
        <ResearchContent />
      </main>
    </PageShell>
  );
}
