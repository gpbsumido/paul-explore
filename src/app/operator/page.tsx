import { Suspense } from "react";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import OperatorDashboard from "./OperatorDashboard";
import OperatorLoading from "./loading";

const TITLE = "Operator Dashboard";
const DESCRIPTION =
  "Fleet overview for smart micro-retail stores. Monitor store status, inventory health, and alerts across your entire network in real time.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/operator`,
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

export default function OperatorPage() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Operator" }]}
      />

      <h1 className="sr-only">Fleet Dashboard</h1>

      <Suspense fallback={<OperatorLoading />}>
        <OperatorDashboard />
      </Suspense>
    </div>
  );
}
