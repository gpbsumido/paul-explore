"use client";

import { useState, useMemo } from "react";
import { useOperatorActivity } from "@/hooks/useOperatorActivity";
import ActivityEventRow from "./ActivityEventRow";

interface ActivityTabProps {
  storeId: string;
}

const PAGE_SIZE = 50;

/**
 * Activity tab showing a chronological feed of recent store events.
 * Sorted newest-first with alternating row backgrounds. Shows 50 events
 * at a time with a "Load more" button.
 */
export default function ActivityTab({ storeId }: ActivityTabProps) {
  const { events, loading, error } = useOperatorActivity(storeId);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    [events],
  );

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  if (error) {
    return <p className="text-sm text-error-500 py-4">{error}</p>;
  }

  if (loading && events.length === 0) {
    return <ActivityTabSkeleton />;
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted py-8 text-center">
        No activity recorded for this store yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-border">
        {visible.map((event, i) => (
          <ActivityEventRow key={event.id} event={event} even={i % 2 === 0} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="rounded-md border border-border bg-surface-raised px-4 py-2 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Bone({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--color-surface-raised)",
        borderRadius: 6,
        animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        ...style,
      }}
    />
  );
}

function ActivityTabSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-3 ${
            i % 2 === 0 ? "bg-surface" : "bg-surface-raised/40"
          }`}
        >
          <Bone style={{ height: 14, width: 14 }} />
          <Bone style={{ height: 11, width: 64 }} />
          <Bone style={{ height: 14, width: 180, flex: 1 }} />
          <Bone style={{ height: 12, width: 100 }} />
          <Bone style={{ height: 12, width: 72 }} />
        </div>
      ))}
    </div>
  );
}
