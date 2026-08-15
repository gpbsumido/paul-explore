import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import FinanceReport from "@/components/operator/FinanceReport";

const TITLE = "Finance";
const DESCRIPTION =
  "Weekly payout history reconciled from sales, with a transparent fee breakdown: what the fleet earned, what it was charged, and what actually landed.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/operator/finance`,
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

export default function FinancePage() {
  return (
    <PageShell colorA="var(--color-feature-operator)" colorB="var(--color-secondary-500)" className="font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Operator", href: "/operator" },
          { label: "Finance" },
        ]}
      />

      <main className="reveal-up mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Finance</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            What actually landed. Weekly payouts reconciled from sales, with the
            transaction and platform fees shown rather than folded in &mdash; so
            a slow week reads differently from an expensive one.
          </p>
        </div>

        <FinanceReport />
      </main>
    </PageShell>
  );
}
