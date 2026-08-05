import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import LossReport from "@/components/operator/LossReport";

const TITLE = "Shrink & Loss";
const DESCRIPTION =
  "Fleet shrink and loss: unexplained shrink reconciled against reasoned removals from completed restock counts, ranked worst store first.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/operator/loss`,
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

export default function LossPage() {
  return (
    <PageShell colorA="#8b5cf6" colorB="#38bdf8" className="font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Operator", href: "/operator" },
          { label: "Shrink & loss" },
        ]}
      />

      <main className="reveal-up mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Shrink &amp; loss</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Where the margin leaks. Every completed restock count reconciled: the
            stock that went missing with no reason logged, kept apart from what
            was pulled for a reason. Stores are ranked by the shrink worth
            chasing first.
          </p>
        </div>

        <LossReport />
      </main>
    </PageShell>
  );
}
