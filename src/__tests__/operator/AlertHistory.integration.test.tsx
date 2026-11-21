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

describe("AlertsTab list", () => {
  /** Serves exactly these alerts for the store and renders the tab. */
  function renderWith(alerts: ReturnType<typeof buildAlert>[]) {
    server.use(
      http.get(`/api/operator/stores/${STORE_ID}/alerts`, () => HttpResponse.json({ alerts })),
    );
    const { container } = render(<AlertsTab storeId={STORE_ID} />, { wrapper: makeWrapper() });
    return within(container);
  }

  it("narrows the active list to one severity from the filter pills", async () => {
    const user = userEvent.setup();
    const view = renderWith([
      buildAlert({ message: "WarnMsg", severity: "warning", acknowledged: false }),
      buildAlert({ message: "CritMsg", severity: "critical", acknowledged: false }),
      buildAlert({ message: "InfoMsg", severity: "info", acknowledged: false }),
    ]);
    await view.findByText("CritMsg");

    await user.click(view.getByRole("button", { name: "Warning" }));

    expect(view.getByText("WarnMsg")).toBeInTheDocument();
    expect(view.queryByText("CritMsg")).not.toBeInTheDocument();
    expect(view.queryByText("InfoMsg")).not.toBeInTheDocument();
  });

  it("lists the most severe alerts first", async () => {
    const view = renderWith([
      buildAlert({ message: "InfoMsg", severity: "info", acknowledged: false }),
      buildAlert({ message: "CritMsg", severity: "critical", acknowledged: false }),
      buildAlert({ message: "WarnMsg", severity: "warning", acknowledged: false }),
    ]);
    await view.findByText("CritMsg");

    expect(view.getAllByText(/Msg$/).map((el) => el.textContent)).toEqual([
      "CritMsg",
      "WarnMsg",
      "InfoMsg",
    ]);
  });

  it("dismisses the alert whose button was clicked and moves it out of the active count", async () => {
    const user = userEvent.setup();
    const dismissed: string[] = [];
    const target = buildAlert({ id: "alert-target", message: "TargetMsg", severity: "warning", acknowledged: false });
    const other = buildAlert({ id: "alert-other", message: "OtherMsg", severity: "info", acknowledged: false });
    // The server remembers the dismissal, so the refetch after it agrees.
    server.use(
      http.get(`/api/operator/stores/${STORE_ID}/alerts`, () =>
        HttpResponse.json({
          alerts: [{ ...target, acknowledged: dismissed.includes(target.id) }, other],
        }),
      ),
      http.patch("/api/operator/alerts/:id/dismiss", ({ params }) => {
        dismissed.push(String(params.id));
        return HttpResponse.json({ alert: { ...target, acknowledged: true } });
      }),
    );
    const { container } = render(<AlertsTab storeId={STORE_ID} />, { wrapper: makeWrapper() });
    const view = within(container);
    await view.findByText("TargetMsg");

    const row = view.getByText("TargetMsg").closest("div") as HTMLElement;
    await user.click(within(row).getByRole("button", { name: "Dismiss" }));

    await waitFor(() => expect(view.getByRole("button", { name: "Active (1)" })).toBeInTheDocument());
    expect(dismissed).toEqual(["alert-target"]);
    expect(view.queryByText("TargetMsg")).not.toBeInTheDocument();
    expect(view.getByText("OtherMsg")).toBeInTheDocument();
  });

  it("says all is clear when a store has no alerts at all", async () => {
    const view = renderWith([]);

    expect(await view.findByText("All clear")).toBeInTheDocument();
  });

  it("says nothing has been resolved yet when only active alerts exist", async () => {
    const user = userEvent.setup();
    const view = renderWith([buildAlert({ message: "ActiveOnly", acknowledged: false })]);
    await view.findByText("ActiveOnly");

    await user.click(view.getByRole("button", { name: "Resolved (0)" }));

    expect(view.getByText(/no resolved alerts yet/i)).toBeInTheDocument();
  });

  it("shows the error rather than an empty store when alerts fail to load", async () => {
    server.use(
      http.get(`/api/operator/stores/${STORE_ID}/alerts`, () =>
        HttpResponse.json({ error: "down" }, { status: 500 }),
      ),
    );
    const { container } = render(<AlertsTab storeId={STORE_ID} />, { wrapper: makeWrapper() });

    expect(await within(container).findByText("Failed to fetch alerts")).toBeInTheDocument();
    expect(within(container).queryByText("All clear")).not.toBeInTheDocument();
  });
});
