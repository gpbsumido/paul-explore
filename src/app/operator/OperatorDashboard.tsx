"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useOperatorStores } from "@/hooks/useOperatorStores";
import { fadeInUp, spring } from "@/lib/animations";
import { queryKeys } from "@/lib/queryKeys";
import {
  sortStores,
  filterStores,
  computeFleetStats,
} from "@/lib/operator-utils";
import type {
  Alert,
  AlertSeverity,
  InventoryItem,
  StoreStatus,
} from "@/types/operator";
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
  const queryClient = useQueryClient();
  const {
    stores,
    loading: storesLoading,
    error: storesError,
  } = useOperatorStores();

  const [statusFilter, setStatusFilter] = useState<StoreStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | null>(
    null,
  );

  // fan out alert queries for every store (15s poll matches useOperatorAlerts).
  // combine selects just the data arrays so structural sharing keeps the
  // reference stable between renders when no query data has changed -- without
  // it useQueries returns a new result array every render, busting every
  // downstream useMemo.
  const alertResults = useQueries({
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
    combine: (results) => ({
      data: results.map((r) => r.data),
      errors: results.map((r) => r.isError),
    }),
  });

  // fan out inventory queries for every store (60s poll)
  const inventoryResults = useQueries({
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
    combine: (results) => ({
      data: results.map((r) => r.data),
      errors: results.map((r) => r.isError),
    }),
  });

  // build lookup maps from the stable data arrays
  const alertsByStore = useMemo(() => {
    const map = new Map<string, readonly Alert[]>();
    stores.forEach((s, i) => {
      const data = alertResults.data[i];
      if (data) map.set(s.id, data);
    });
    return map;
  }, [stores, alertResults.data]);

  const inventoryByStore = useMemo(() => {
    const map = new Map<string, readonly InventoryItem[]>();
    stores.forEach((s, i) => {
      const data = inventoryResults.data[i];
      if (data) map.set(s.id, data);
    });
    return map;
  }, [stores, inventoryResults.data]);

  // track which stores have failing sub-queries
  const storeQueryErrors = useMemo(() => {
    const set = new Set<string>();
    stores.forEach((s, i) => {
      if (alertResults.errors[i] || inventoryResults.errors[i]) {
        set.add(s.id);
      }
    });
    return set;
  }, [stores, alertResults.errors, inventoryResults.errors]);

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
    const bySeverity = severityFilter
      ? filtered.filter((s) => {
          const alerts = alertsByStore.get(s.id);
          return alerts?.some(
            (a) => !a.acknowledged && a.severity === severityFilter,
          );
        })
      : filtered;
    return sortStores(bySeverity, alertCounts);
  }, [
    stores,
    statusFilter,
    search,
    alertCounts,
    severityFilter,
    alertsByStore,
  ]);

  if (storesError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <p className="text-sm text-error-500">{storesError}</p>
        <button
          type="button"
          className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: queryKeys.operator.stores(),
            })
          }
        >
          Retry
        </button>
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
        onFilterCritical={() => setSeverityFilter("critical")}
        onFilterWarning={() => setSeverityFilter("warning")}
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

      {/* Active severity filter chip */}
      {severityFilter && (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              severityFilter === "critical"
                ? "bg-error-100 text-error-700 dark:bg-error-950/40 dark:text-error-400"
                : "bg-warning-100 text-warning-700 dark:bg-warning-950/40 dark:text-warning-400"
            }`}
          >
            {severityFilter} alerts only
            <button
              type="button"
              className="ml-0.5 hover:opacity-70 transition-opacity"
              aria-label="Clear severity filter"
              onClick={() => setSeverityFilter(null)}
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Store card grid */}
      {storesLoading && stores.length === 0 ? (
        <StoreGridSkeleton />
      ) : visibleStores.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted">
            No stores match the current filters.
          </p>
          {(statusFilter !== "all" || search !== "" || severityFilter) && (
            <button
              type="button"
              className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              onClick={() => {
                setStatusFilter("all");
                setSearch("");
                setSeverityFilter(null);
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleStores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              alertCount={alertCounts.get(store.id) ?? 0}
              inventoryHealth={inventoryHealthByStore.get(store.id) ?? 0}
              hasQueryError={storeQueryErrors.has(store.id)}
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

import Bone from "@/components/operator/Bone";

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
