import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import ProductPerformance from "@/components/operator/ProductPerformance";

const TITLE = "Product Performance";
const DESCRIPTION =
  "Fleet-wide product performance: every product ranked by revenue with its daily sales rate and an index against its category average, dead SKUs included.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/operator/products`,
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

export default function ProductsPage() {
  return (
    <PageShell colorA="#8b5cf6" colorB="#38bdf8" className="font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Operator", href: "/operator" },
          { label: "Products" },
        ]}
      />

      <main className="reveal-up mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Product performance
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Which products carry the fleet, and which are dead weight. Ranked by
            revenue, judged against each product&apos;s own category average, so
            a cheap snack isn&apos;t measured against a sandwich. Stocked
            products with no sales stay in the list &mdash; those are the ones
            to cut.
          </p>
        </div>

        <ProductPerformance />
      </main>
    </PageShell>
  );
}
