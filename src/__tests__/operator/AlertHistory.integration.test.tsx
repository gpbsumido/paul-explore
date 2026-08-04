import { describe, it, expect, beforeEach } from "vitest";
import { render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import AlertsTab from "@/components/operator/AlertsTab";
import { buildAlert } from "@/test/factories/operator";

const STORE_ID = "store-alert-hist";

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => {
  server.use(
    http.get(`/api/operator/stores/${STORE_ID}/alerts`, () =>
      HttpResponse.json({
        alerts: [
          buildAlert({
            message: "ActiveAlertMsg",
            severity: "warning",
            acknowledged: false,
          }),
          buildAlert({
            message: "ResolvedAlertMsg",
            severity: "critical",
            acknowledged: true,
          }),
        ],
      }),
    ),
  );
});

describe("AlertsTab history", () => {
  it("shows active alerts by default and resolved ones behind the toggle", async () => {
    const user = userEvent.setup();
    const { container } = render(<AlertsTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    // Active view: the active alert shows, the resolved one does not.
    expect(await view.findByText("ActiveAlertMsg")).toBeInTheDocument();
    expect(view.queryByText("ResolvedAlertMsg")).not.toBeInTheDocument();

    // The overview counts both.
    expect(
      view.getByRole("button", { name: "Active (1)" }),
    ).toBeInTheDocument();

    // Switch to the resolved history.
    await user.click(view.getByRole("button", { name: "Resolved (1)" }));

    await waitFor(() =>
      expect(view.getByText("ResolvedAlertMsg")).toBeInTheDocument(),
    );
    expect(view.queryByText("ActiveAlertMsg")).not.toBeInTheDocument();
    // resolved rows are read-only: no dismiss button
    expect(
      view.queryByRole("button", { name: "Dismiss" }),
    ).not.toBeInTheDocument();
  });
});
