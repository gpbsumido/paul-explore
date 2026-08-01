"use client";

import { useCallback, useSyncExternalStore } from "react";
import nextDynamic from "next/dynamic";
import { AnimatePresence, m } from "framer-motion";
import type { Store, AlertTrendBucket } from "@/types/operator";
import { ChevronDownIcon } from "./icons";

// The charts are the only thing on the operator page that pulls in recharts
// (~66KB), and this whole section defaults to collapsed, so that weight was
// pure unused JS on first load. Loading the three chart components through
// next/dynamic keeps recharts out of the operator bundle until someone actually
// opens the section. ssr:false because they render client-side only anyway.
const chartFallback = (
  <div className="h-56 animate-pulse rounded-lg bg-surface-raised" />
);
const FleetHealthChart = nextDynamic(() => import("./FleetHealthChart"), {
  ssr: false,
  loading: () => chartFallback,
});
const AlertTrendChart = nextDynamic(() => import("./AlertTrendChart"), {
  ssr: false,
  loading: () => chartFallback,
});
const InventoryComparisonChart = nextDynamic(
  () => import("./InventoryComparisonChart"),
  { ssr: false, loading: () => chartFallback },
);

interface InventoryComparisonDatum {
  readonly name: string;
  readonly health: number;
}

interface FleetAnalyticsProps {
  stores: readonly Store[];
  alertTrend: readonly AlertTrendBucket[];
  inventoryComparison: readonly InventoryComparisonDatum[];
}

const STORAGE_KEY = "operator-fleet-analytics-collapsed";

/**
 * Reads the persisted collapse state from localStorage. Falls back to
 * collapsed (true) so the section doesn't push store cards down by default.
 */
function readCollapsed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

// A tiny external store for the collapse preference. useSyncExternalStore reads
// localStorage on the client and a fixed collapsed=true on the server, so the
// hydrated HTML always matches; no localStorage read happens in the initial
// render. Toggling writes localStorage and notifies subscribers so the same tab
// re-reads immediately (the storage event only fires in *other* tabs).
const collapseListeners = new Set<() => void>();

function subscribeCollapsed(callback: () => void): () => void {
  collapseListeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    collapseListeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function writeCollapsed(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // storage full or unavailable -- no-op
  }
  for (const listener of collapseListeners) listener();
}

/**
 * Collapsible analytics section housing fleet health, alert trend, and
 * inventory comparison charts. Collapse state persists in localStorage
 * so operators who prefer the compact view don't re-collapse every visit.
 */
export default function FleetAnalytics({
  stores,
  alertTrend,
  inventoryComparison,
}: FleetAnalyticsProps) {
  // Server snapshot is always collapsed, so the hydrated HTML matches; the
  // client snapshot reads the stored preference. No hydration divergence.
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    () => true,
  );

  const toggle = useCallback(() => writeCollapsed(!readCollapsed()), []);

  return (
    <section className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-t-xl px-4 py-3 text-left transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500"
        aria-expanded={!collapsed}
      >
        <span className="text-sm font-semibold">Fleet Analytics</span>
        <ChevronDownIcon
          className={`h-4 w-4 text-muted transition-transform ${collapsed ? "" : "rotate-180"}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <m.div
            key="fleet-analytics-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="border-t border-border px-4 py-5">
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
                <FleetHealthChart stores={stores} />
                <AlertTrendChart data={alertTrend} />
                <InventoryComparisonChart data={inventoryComparison} />
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}
