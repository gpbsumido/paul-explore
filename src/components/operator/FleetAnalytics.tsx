"use client";

import { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Store, Alert, InventoryItem } from "@/types/operator";
import FleetHealthChart from "./FleetHealthChart";
import AlertTrendChart from "./AlertTrendChart";
import InventoryComparisonChart from "./InventoryComparisonChart";
import { ChevronDownIcon } from "./icons";

interface FleetAnalyticsProps {
  stores: readonly Store[];
  alertsByStore: ReadonlyMap<string, readonly Alert[]>;
  inventoryByStore: ReadonlyMap<string, readonly InventoryItem[]>;
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

/**
 * Collapsible analytics section housing fleet health, alert trend, and
 * inventory comparison charts. Collapse state persists in localStorage
 * so operators who prefer the compact view don't re-collapse every visit.
 */
export default function FleetAnalytics({
  stores,
  alertsByStore,
  inventoryByStore,
}: FleetAnalyticsProps) {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // storage full or unavailable -- no-op
      }
      return next;
    });
  }, []);

  const allAlerts = useMemo(() => {
    const result: Alert[] = [];
    for (const alerts of alertsByStore.values()) {
      result.push(...alerts);
    }
    return result;
  }, [alertsByStore]);

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
          <motion.div
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
                <AlertTrendChart alerts={allAlerts} />
                <InventoryComparisonChart
                  stores={stores}
                  inventoryByStore={inventoryByStore}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
