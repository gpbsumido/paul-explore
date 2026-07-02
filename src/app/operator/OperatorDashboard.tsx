"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQueries } from "@tanstack/react-query";
import { useOperatorStores } from "@/hooks/useOperatorStores";
import { fadeInUp, spring } from "@/lib/animations";
import { queryKeys } from "@/lib/queryKeys";
import {
  sortStores,
  filterStores,
  computeFleetStats,
} from "@/lib/operator-utils";
import type { Alert, InventoryItem, StoreStatus } from "@/types/operator";
import AlertSummaryBanner from "@/components/operator/AlertSummaryBanner";
import FleetStatsBar from "@/components/operator/FleetStatsBar";
import RefreshBar from "@/components/operator/RefreshBar";
import StoreCard from "@/components/operator/StoreCard";
import FleetAnalytics from "@/components/operator/FleetAnalytics";
import StoreFilters from "@/components/operator/StoreFilters";

/**
 * Client-side operator fleet dashboard. Fetches the store list via
 * useOperatorStores (30s poll), then fans out parallel queries for alerts and
 * inventory per store so the sorting, stats, and card data are all available
 * without waterfall requests.
 */
export default function OperatorDashboard() {
  const {
    stores,
    loading: storesLoading,
    error: storesError,
  } = useOperatorStores();

  const [statusFilter, setStatusFilter] = useState<StoreStatus | "all">("all");
  const [search, setSearch] = useState("");

  // fan out alert queries for every store (15s poll matches useOperatorAlerts)
  const alertQueries = useQueries({
    queries: stores.map((s) => ({
      queryKey: queryKeys.operator.alerts(s.id),
      queryFn: async (): Promise<Alert[]> => {
        const res = await fetch(`/api/operator/stores/${s.id}/alerts`);
        if (!res.ok) throw new Error("Failed to fetch alerts");
        const json = await res.json();
        return json.alerts as Alert[];
      },
      staleTime: 0,
      refetchInterval: 15_000,
    })),
  });

  // fan out inventory queries for every store (60s poll)
  const inventoryQueries = useQueries({
    queries: stores.map((s) => ({
      queryKey: queryKeys.operator.inventory(s.id),
      queryFn: async (): Promise<InventoryItem[]> => {
        const res = await fetch(`/api/operator/stores/${s.id}/inventory`);
        if (!res.ok) throw new Error("Failed to fetch inventory");
        const json = await res.json();
        return json.items as InventoryItem[];
      },
      staleTime: 0,
      refetchInterval: 60_000,
    })),
  });

  // build lookup maps from the parallel queries
  const alertsByStore = useMemo(() => {
    const map = new Map<string, readonly Alert[]>();
    stores.forEach((s, i) => {
      const data = alertQueries[i]?.data;
      if (data) map.set(s.id, data);
    });
    return map;
  }, [stores, alertQueries]);

  const inventoryByStore = useMemo(() => {
    const map = new Map<string, readonly InventoryItem[]>();
    stores.forEach((s, i) => {
      const data = inventoryQueries[i]?.data;
      if (data) map.set(s.id, data);
    });
    return map;
  }, [stores, inventoryQueries]);

  const alertCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const [storeId, alerts] of alertsByStore) {
      map.set(storeId, alerts.filter((a) => !a.acknowledged).length);
    }
    return map;
  }, [alertsByStore]);

  // compute fleet stats from all data
  const fleetStats = useMemo(
    () => computeFleetStats(stores, alertsByStore, inventoryByStore),
    [stores, alertsByStore, inventoryByStore],
  );

  // compute per-store inventory health for cards
  const inventoryHealthByStore = useMemo(() => {
    const map = new Map<string, number>();
    for (const [storeId, items] of inventoryByStore) {
      if (items.length === 0) {
        map.set(storeId, 0);
        continue;
      }
      const total = items.reduce(
        (sum, item) =>
          sum + (item.capacity > 0 ? item.currentStock / item.capacity : 0),
        0,
      );
      map.set(storeId, Math.round((total / items.length) * 100));
    }
    return map;
  }, [inventoryByStore]);

  // filter then sort
  const visibleStores = useMemo(() => {
    const filtered = filterStores(stores, { status: statusFilter, search });
    return sortStores(filtered, alertCounts);
  }, [stores, statusFilter, search, alertCounts]);

  if (storesError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <p className="text-sm text-error-500">{storesError}</p>
      </div>
    );
  }

  return (
    <motion.main
      className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={spring.smooth}
    >
      {/* Global refresh bar */}
      <RefreshBar />

      {/* Alert summary banner */}
      <AlertSummaryBanner
        criticalCount={fleetStats.criticalAlerts}
        warningCount={fleetStats.warningAlerts}
        onFilterCritical={() => setStatusFilter("degraded")}
        onFilterWarning={() => setStatusFilter("degraded")}
      />

      {/* Fleet stats bar */}
      <FleetStatsBar stats={fleetStats} />

      {/* Fleet analytics (collapsible charts) */}
      <FleetAnalytics
        stores={stores}
        alertsByStore={alertsByStore}
        inventoryByStore={inventoryByStore}
      />

      {/* Filters */}
      <StoreFilters
        status={statusFilter}
        onStatusChange={setStatusFilter}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Store card grid */}
      {storesLoading && stores.length === 0 ? (
        <StoreGridSkeleton />
      ) : visibleStores.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          No stores match the current filters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleStores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              alertCount={alertCounts.get(store.id) ?? 0}
              inventoryHealth={inventoryHealthByStore.get(store.id) ?? 0}
            />
          ))}
        </div>
      )}
    </motion.main>
  );
}

// ---------------------------------------------------------------------------
// Inline skeleton for the initial load state
// ---------------------------------------------------------------------------

function Bone({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background: "var(--color-surface-raised)",
        borderRadius: 6,
        animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        ...style,
      }}
    />
  );
}

function StoreCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <Bone style={{ height: 14, width: 140 }} />
          <Bone style={{ height: 12, width: 100 }} />
        </div>
        <Bone style={{ height: 20, width: 64, borderRadius: 999 }} />
      </div>
      <div className="flex gap-4">
        <Bone style={{ height: 12, width: 60 }} />
        <Bone style={{ height: 12, width: 40 }} />
        <Bone style={{ height: 12, width: 48 }} />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <Bone style={{ height: 11, width: 52 }} />
          <Bone style={{ height: 11, width: 28 }} />
        </div>
        <Bone style={{ height: 6, width: "100%", borderRadius: 999 }} />
      </div>
      <Bone style={{ height: 12, width: 80 }} />
    </div>
  );
}

function StoreGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <StoreCardSkeleton key={i} />
      ))}
    </div>
  );
}
