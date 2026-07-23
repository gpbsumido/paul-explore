"use client";

import { useState, useMemo } from "react";
import { m } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOperatorStores } from "@/hooks/useOperatorStores";
import { fadeInUp, spring } from "@/lib/animations";
import { queryKeys } from "@/lib/queryKeys";
import { sortStores, filterStores } from "@/lib/operator-utils";
import type {
  AlertSeverity,
  AlertTrendBucket,
  FleetSummaryResponse,
  StoreSummary,
  StoreStatus,
} from "@/types/operator";
import AlertSummaryBanner from "@/components/operator/AlertSummaryBanner";
import FleetStatsBar from "@/components/operator/FleetStatsBar";
import RefreshBar from "@/components/operator/RefreshBar";
import StoreCard from "@/components/operator/StoreCard";
import FleetAnalytics from "@/components/operator/FleetAnalytics";
import StoreFilters from "@/components/operator/StoreFilters";

const MAX_CHART_NAME_LENGTH = 20;

/**
 * Client-side operator fleet dashboard. Fetches the store list via
 * useOperatorStores (30s poll) and aggregated alert/inventory data via a
 * single fleet-summary request (15s poll) instead of fanning out per-store
 * queries. This scales to any fleet size with constant request count.
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

  // single aggregated query replaces the 2N fan-out (alerts + inventory per store)
  const { data: fleetSummary } = useQuery({
    queryKey: queryKeys.operator.fleetSummary(),
    queryFn: async ({ signal }): Promise<FleetSummaryResponse> => {
      const res = await fetch("/api/operator/fleet-summary", { signal });
      if (!res.ok) throw new Error("Failed to fetch fleet summary");
      return res.json() as Promise<FleetSummaryResponse>;
    },
    staleTime: 0,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  // build lookup map from summaries for O(1) per-store access
  const summaryByStore = useMemo(() => {
    const map = new Map<string, StoreSummary>();
    for (const s of fleetSummary?.summaries ?? []) {
      map.set(s.storeId, s);
    }
    return map;
  }, [fleetSummary?.summaries]);

  // alert counts map for sorting
  const alertCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of fleetSummary?.summaries ?? []) {
      map.set(s.storeId, s.alertCount);
    }
    return map;
  }, [fleetSummary?.summaries]);

  // fleet stats for the banner and stats bar, with safe defaults before data loads
  const fleetStats = useMemo(
    () => ({
      totalStores: stores.length,
      needsAttention: stores.filter(
        (s) => s.status === "degraded" || s.status === "offline",
      ).length,
      criticalAlerts: fleetSummary?.fleetStats.criticalAlerts ?? 0,
      warningAlerts: fleetSummary?.fleetStats.warningAlerts ?? 0,
      lowStockItems: fleetSummary?.fleetStats.lowStockItems ?? 0,
      avgInventoryHealth: fleetSummary?.fleetStats.avgInventoryHealth ?? 0,
    }),
    [stores, fleetSummary?.fleetStats],
  );

  // pre-computed alert trend for the chart (from the server)
  const alertTrend: readonly AlertTrendBucket[] =
    fleetSummary?.alertTrend ?? [];

  // derive inventory comparison chart data from summaries + store names
  const inventoryComparison = useMemo(
    () =>
      stores.map((store) => {
        const summary = summaryByStore.get(store.id);
        const name =
          store.name.length > MAX_CHART_NAME_LENGTH
            ? store.name.slice(0, MAX_CHART_NAME_LENGTH - 1) + "\u2026"
            : store.name;
        return { name, health: summary?.inventoryHealth ?? 0 };
      }),
    [stores, summaryByStore],
  );

  // filter then sort
  const visibleStores = useMemo(() => {
    const filtered = filterStores(stores, { status: statusFilter, search });
    const bySeverity = severityFilter
      ? filtered.filter((s) => {
          const summary = summaryByStore.get(s.id);
          if (!summary) return false;
          if (severityFilter === "critical") return summary.hasCritical;
          if (severityFilter === "warning") return summary.hasWarning;
          return false;
        })
      : filtered;
    return sortStores(bySeverity, alertCounts);
  }, [
    stores,
    statusFilter,
    search,
    alertCounts,
    severityFilter,
    summaryByStore,
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
    <m.main
      className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={spring.smooth}
    >
      <h1 className="sr-only">Fleet Dashboard</h1>
      {/* One-line orientation for a cold visitor landing on a dense dashboard */}
      <p className="text-sm text-muted">
        A demo of running a smart-store fleet &mdash; live-style status, alerts,
        inventory health, and analytics. Filter the stores below, or click one to
        drill in.
      </p>
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
        alertTrend={alertTrend}
        inventoryComparison={inventoryComparison}
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
          {visibleStores.map((store) => {
            const summary = summaryByStore.get(store.id);
            return (
              <StoreCard
                key={store.id}
                store={store}
                alertCount={summary?.alertCount ?? 0}
                inventoryHealth={summary?.inventoryHealth ?? 0}
              />
            );
          })}
        </div>
      )}
    </m.main>
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
