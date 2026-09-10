"use client";

import { createContext, useContext, useState } from "react";
import { LazyMotion, useReducedMotion } from "framer-motion";
import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";
import { Toaster } from "@paul-portfolio/react";
import dynamic from "next/dynamic";
import { notifyMutationError } from "@/lib/mutationErrorToast";

// Dev-only, and loaded through a dynamic import guarded by NODE_ENV so the
// devtools module can never reach the production bundle (a static import leaves
// it in the graph for the bundler to maybe keep; this makes it a literal `null`
// component in prod).
const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? dynamic(() =>
        import("@tanstack/react-query-devtools").then(
          (m) => m.ReactQueryDevtools,
        ),
      )
    : () => null;

// ---------------------------------------------------------------------------
// ReducedMotionProvider — reads prefers-reduced-motion once at the app root
// so every animated component can access it without calling the hook itself.
// ---------------------------------------------------------------------------

const ReducedMotionContext = createContext(false);

/** Returns true when the user has requested reduced motion. */
export function useHubReducedMotion() {
  return useContext(ReducedMotionContext);
}

function ReducedMotionProvider({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion() ?? false;
  return (
    <ReducedMotionContext.Provider value={prefersReduced}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

/**
 * Client-side provider wrapper. Sits just inside the root layout and gives
 * every page access to TanStack Query's cache and the reduced-motion flag.
 *
 * QueryClient lives in useState so each server render gets a fresh instance
 * while the browser keeps a stable singleton across navigations. The devtools
 * only mount in development, so there's no bundle impact in production.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // Any failed write (mutation) raises an error toast, so no API failure
        // is silent, wherever it happens. A screen that shows its own inline
        // error opts out with `meta: { silent: true }` on the mutation.
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) =>
            notifyMutationError(error, mutation.meta),
        }),
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
      <ReducedMotionProvider>
        {/* LazyMotion lets components use the lighter `m` components instead of
            `motion`. domMax (not domAnimation) because the app uses layout and
            drag animations. Non-strict during the migration so files still on
            `motion` keep working. See /thoughts/react-doctor.

            Passed as a loader, not a static import. domMax is the largest
            feature bundle framer-motion ships -- drag, layout projection and
            every gesture -- and importing it here put all of it in the root
            layout's synchronous chunk on every route, which is the one thing
            LazyMotion exists to avoid. */}
        <LazyMotion features={() => import("framer-motion").then((m) => m.domMax)}>
          {children}
        </LazyMotion>
      </ReducedMotionProvider>
      {/* One app-wide notification region. The global mutation-error handler
          above raises error toasts here, and any screen can call toast.* too. */}
      <Toaster />
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
