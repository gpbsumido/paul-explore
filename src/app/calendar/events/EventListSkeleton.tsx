/** Pulse skeleton shown while the events list is loading. */
export default function EventListSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="h-[68px] rounded-lg bg-surface animate-pulse" />
      ))}
    </ul>
  );
}
