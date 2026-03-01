"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

/**
 * Client-side provider wrapper. Sits just inside the root layout and gives
 * every page access to TanStack Query's cache.
 *
 * QueryClient lives in useState so each server render gets a fresh instance
 * while the browser keeps a stable singleton across navigations. The devtools
 * only mount in development, so there's no bundle impact in production.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 1 minute is a reasonable default for most of the app. Individual
            // queries override this where data is more or less volatile.
            staleTime: 60_000,
            // Keep unused query results in cache for 5 minutes before dropping them.
            gcTime: 5 * 60_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
