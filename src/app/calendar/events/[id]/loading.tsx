import EventDetailSkeleton from "./EventDetailSkeleton";

/** Shown by Next.js while the event detail RSC streams in during navigation. */
export default function EventDetailLoading() {
  return <EventDetailSkeleton />;
}
