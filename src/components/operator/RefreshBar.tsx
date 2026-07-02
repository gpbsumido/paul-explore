"use client";

import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useReducer } from "react";

/**
 * Global refresh bar shown at the top of the fleet overview. Displays when
 * operator data was last fetched and a manual refresh button that invalidates
 * all operator queries so every poll cycle fires immediately.
 */
export default function RefreshBar() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: ["operator"] });

  // derive "last refreshed" from the query cache's dataUpdatedAt timestamps
  const lastRefreshed = getLatestOperatorUpdate(queryClient);

  // force re-render every 15s so the "X ago" label stays current
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["operator"] });
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2 text-xs text-muted">
      <span>
        Last refreshed{" "}
        <span className="font-medium text-foreground">
          {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
        </span>
      </span>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isFetching > 0}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-raised px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={isFetching > 0 ? "animate-spin" : ""}
          aria-hidden
        >
          <path d="M14 8A6 6 0 1 1 8 2" strokeLinecap="round" />
          <path d="M8 0l3 2-3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {isFetching > 0 ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}

/**
 * Reads the most recent dataUpdatedAt from all operator queries in the cache.
 * Falls back to the current time if no queries have resolved yet.
 */
function getLatestOperatorUpdate(
  queryClient: ReturnType<typeof useQueryClient>,
): Date {
  const queries = queryClient.getQueriesData({ queryKey: ["operator"] });
  let latest = 0;
  for (const [key] of queries) {
    const state = queryClient.getQueryState(key);
    if (state && state.dataUpdatedAt > latest) {
      latest = state.dataUpdatedAt;
    }
  }
  return latest > 0 ? new Date(latest) : new Date();
}
