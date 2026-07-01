import { Suspense } from "react";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import StoreDetail from "./StoreDetail";
import StoreDetailLoading from "./loading";

const TITLE = "Store Detail";
const DESCRIPTION =
  "Live store health, sensor status, inventory, and alerts for a single micro-retail unit.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/operator/stores`,
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

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Operator", href: "/operator" },
          { label: "Store" },
        ]}
      />

      <Suspense fallback={<StoreDetailLoading />}>
        <StoreDetail storeId={storeId} />
      </Suspense>
    </div>
  );
}
