import { Suspense } from "react";
import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import EventDetailSkeleton from "./EventDetailSkeleton";
import EventDetailWithData from "./EventDetailWithData";

const TITLE = "Event";
const DESCRIPTION = "View event details and attached Pokémon cards.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/calendar/events`,
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

/**
 * Event detail page. Fetches event and cards server-side so the first paint
 * shows real content instead of a blank skeleton. The Suspense fallback streams
 * in the skeleton while the two backend fetches resolve in parallel.
 */
export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<EventDetailSkeleton />}>
      <EventDetailWithData id={id} />
    </Suspense>
  );
}
