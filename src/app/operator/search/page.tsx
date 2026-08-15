import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import OperatorSearchView from "./OperatorSearchView";

const TITLE = "Operator Search";
const DESCRIPTION =
  "Find anything across the fleet, faster: search stores, products and operator tools from one keyboard-first box.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/operator/search`,
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

export default function OperatorSearchPage() {
  return (
    <PageShell colorA="var(--color-feature-operator)" colorB="var(--color-secondary-500)" className="font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Operator", href: "/operator" },
          { label: "Search" },
        ]}
      />

      <main className="reveal-up mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Search</h1>
          <p className="mx-auto mt-1 max-w-xl text-sm text-muted">
            Find anything, faster. Type to match a store, a product or a tool,
            arrow through the results, and press enter to jump there.
          </p>
        </div>

        <OperatorSearchView />
      </main>
    </PageShell>
  );
}
