import { Suspense } from "react";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import BudgetView from "./BudgetView";
import BudgetLoading from "./loading";

const TITLE = "Budget";
const DESCRIPTION =
  "A fast-add budget tracker: log a spend in a few taps, share a budget with the people you split with, and see where the money goes across the last 30 days, this billing cycle, categories, and people.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/budget`,
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

export default function BudgetPage() {
  return (
    <PageShell colorA="var(--color-feature-budget)" colorB="var(--color-secondary-500)" className="font-sans">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Budget" }]}
      />

      <Suspense fallback={<BudgetLoading />}>
        <BudgetView />
      </Suspense>
    </PageShell>
  );
}
