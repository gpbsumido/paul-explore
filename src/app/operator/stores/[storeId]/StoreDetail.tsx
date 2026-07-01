"use client";

import { Suspense } from "react";
import { useOperatorStore } from "@/hooks/useOperatorStore";
import { ToastProvider } from "@/contexts/ToastContext";
import StoreHeader from "@/components/operator/StoreHeader";
import QuickActions from "@/components/operator/QuickActions";
import StoreTabs from "@/components/operator/StoreTabs";
import ToastNotification from "@/components/operator/ToastNotification";

interface StoreDetailProps {
  storeId: string;
}

/**
 * Client-side store detail view. Fetches the store via useOperatorStore,
 * renders the header with live status, and a tabbed content area synced
 * to URL search params.
 */
export default function StoreDetail({ storeId }: StoreDetailProps) {
  const { store, loading, error } = useOperatorStore(storeId);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-sm text-error-500">{error}</p>
      </div>
    );
  }

  if (loading && !store) {
    return <StoreDetailSkeleton />;
  }

  if (!store) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-sm text-muted">Store not found.</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
        <StoreHeader store={store} />
        <QuickActions storeId={storeId} />
        <Suspense>
          <StoreTabs storeId={storeId} />
        </Suspense>
      </main>
      <ToastNotification />
    </ToastProvider>
  );
}

// ---------------------------------------------------------------------------
// Inline skeleton for client-side loading state
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

function StoreDetailSkeleton() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <Bone style={{ height: 22, width: 220 }} />
            <Bone style={{ height: 16, width: 140 }} />
          </div>
          <Bone style={{ height: 28, width: 80, borderRadius: 999 }} />
        </div>
        <div className="flex gap-5">
          <Bone style={{ height: 14, width: 90 }} />
          <Bone style={{ height: 14, width: 100 }} />
          <Bone style={{ height: 14, width: 120 }} />
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-1 border-b border-border pb-0.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} style={{ height: 32, width: 80, borderRadius: 6 }} />
        ))}
      </div>

      {/* Tab panel skeleton */}
      <Bone style={{ height: 200, width: "100%", borderRadius: 12 }} />
    </main>
  );
}
