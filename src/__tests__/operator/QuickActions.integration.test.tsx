import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@paul-portfolio/react";
import { http, HttpResponse } from "msw";
import { notifyMutationError } from "@/lib/mutationErrorToast";
import { server } from "@/test/server";
import { ToastProvider } from "@/contexts/ToastContext";
import QuickActions from "@/components/operator/QuickActions";
import ToastNotification from "@/components/operator/ToastNotification";
import { buildAlert } from "@/test/factories/operator";

const STORE_ID = "store-quick-1";

/** What withOperatorErrors answers when a write ran out of time. */
const TIMED_OUT =
  "The operator API didn't answer in time. The change may have been saved, so reload before trying again.";

/** Same wiring as providers.tsx, so a failed write reaches the app-wide toast. */
function renderQuickActions() {
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => notifyMutationError(error, mutation.meta),
    }),
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <QuickActions storeId={STORE_ID} />
        <ToastNotification />
      </ToastProvider>
      <Toaster />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

describe("QuickActions Acknowledge All against a hung API", () => {
  it("reports the failure once, not once per alert", async () => {
    const alerts = ["a1", "a2", "a3"].map((id) =>
      buildAlert({ id, severity: "warning", acknowledged: false, storeId: STORE_ID }),
    );
    const dismissed: string[] = [];
    server.use(
      http.get(`/api/operator/stores/${STORE_ID}/inventory`, () => HttpResponse.json({ items: [] })),
      http.get(`/api/operator/stores/${STORE_ID}/alerts`, () => HttpResponse.json({ alerts })),
      http.patch("/api/operator/alerts/:alertId/dismiss", ({ params }) => {
        dismissed.push(String(params.alertId));
        return HttpResponse.json({ error: TIMED_OUT }, { status: 504 });
      }),
    );
    const user = renderQuickActions();

    await user.click(await screen.findByRole("button", { name: "Acknowledge All (3)" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Dismiss All" }));

    await waitFor(() => expect(dismissed).toHaveLength(3));
    expect(await screen.findByText(TIMED_OUT)).toBeInTheDocument();
    // Let every rejection land before counting, so a late duplicate is caught.
    await waitFor(() => expect(screen.getByRole("button", { name: "Acknowledge All (3)" })).toBeEnabled());
    expect(screen.getAllByText(TIMED_OUT)).toHaveLength(1);
    expect(screen.queryByText(/^Dismissed \d+ alerts?$/)).not.toBeInTheDocument();
  });
});
