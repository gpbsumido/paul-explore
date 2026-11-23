import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import { useUpdateFlag } from "@/hooks/useFlagMutations";
import { userFacingErrorMessage } from "@/lib/userFacingError";

/**
 * Renders the hook under a client whose mutation cache records failures the
 * way the app's does, so a test can read what the app-wide toast would say.
 */
function renderUpdateFlag() {
  const failures: unknown[] = [];
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({ onError: (error) => void failures.push(error) }),
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  const { result } = renderHook(() => useUpdateFlag(), { wrapper: Wrapper });
  return { result, failures };
}

/** What the toast shows for a failure, by the same rule notifyMutationError uses. */
const toastFor = (error: unknown) =>
  userFacingErrorMessage(error, "Something went wrong. Please try again.");

describe("useUpdateFlag when the write fails", () => {
  it("carries the route's may-have-saved sentence on a timeout, so the toast says to reload", async () => {
    const timedOut =
      "The flags API didn't answer in time. The change may have been saved, so reload before trying again.";
    server.use(
      http.patch("/api/flags/:flagKey", () => HttpResponse.json({ error: timedOut }, { status: 504 })),
    );
    const { result, failures } = renderUpdateFlag();

    await act(async () => {
      await expect(
        result.current.updateFlag({ flagKey: "new-checkout", environment: "production", enabled: false }),
      ).rejects.toThrow(timedOut);
    });

    expect(failures.map(toastFor)).toEqual([timedOut]);
  });

  it("falls back to its own wording when the failure has no reason in it", async () => {
    server.use(http.patch("/api/flags/:flagKey", () => new HttpResponse(null, { status: 502 })));
    const { result, failures } = renderUpdateFlag();

    await act(async () => {
      await expect(
        result.current.updateFlag({ flagKey: "new-checkout", environment: "production", enabled: false }),
      ).rejects.toThrow("Failed to update flag");
    });

    expect(failures.map(toastFor)).toEqual(["Failed to update flag"]);
  });
});
