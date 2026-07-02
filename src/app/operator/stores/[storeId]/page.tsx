import { Suspense } from "react";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import { getStore } from "@/lib/operator-data";
import StoreDetail from "./StoreDetail";
import StoreDetailLoading from "./loading";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeId: string }>;
}): Promise<Metadata> {
  const { storeId } = await params;
  const store = getStore(storeId);
  const storeName = store?.name ?? "Store Detail";
  const title = `${storeName} — Operator`;
  const description = `Live store health, sensor status, inventory, and alerts for ${storeName}.`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      url: `${SITE_URL}/operator/stores/${storeId}`,
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = getStore(storeId);
  const storeName = store?.name ?? "Store";

  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/operator" },
          { label: storeName },
        ]}
      />

      <Suspense fallback={<StoreDetailLoading />}>
        <StoreDetail storeId={storeId} />
      </Suspense>
    </div>
  );
}
