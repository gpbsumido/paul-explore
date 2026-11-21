import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import type { ReactNode } from "react";
import RefreshBar from "@/components/operator/RefreshBar";

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("RefreshBar last-refreshed display", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("displays relative time derived from operator query cache timestamps", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const baseTime = new Date("2026-07-02T12:00:00Z").getTime();

    // seed the cache at baseTime so dataUpdatedAt is recorded as baseTime
    vi.setSystemTime(baseTime);
    const queryClient = makeClient();
    queryClient.setQueryData(["operator", "stores"], { stores: [] });

    // advance Date by 3 minutes -- component should show "3 minutes ago"
    vi.setSystemTime(baseTime + 3 * 60 * 1000);

    render(<RefreshBar />, { wrapper: wrapper(queryClient) });

    expect(screen.getByText("3 minutes ago")).toBeInTheDocument();
  });

  it("uses the most recent dataUpdatedAt when multiple operator queries exist", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const baseTime = new Date("2026-07-02T12:00:00Z").getTime();

    const queryClient = makeClient();

    // first query seeded at baseTime (10 minutes before render)
    vi.setSystemTime(baseTime);
    queryClient.setQueryData(["operator", "stores"], { stores: [] });

    // second query seeded 8 minutes later (2 minutes before render)
    vi.setSystemTime(baseTime + 8 * 60 * 1000);
    queryClient.setQueryData(["operator", "fleet-summary"], {
      summaries: [],
    });

    // render at baseTime + 10 minutes
    vi.setSystemTime(baseTime + 10 * 60 * 1000);

    render(<RefreshBar />, { wrapper: wrapper(queryClient) });

    // should reflect the more recent entry (2 min ago), not the older one (10 min ago)
    expect(screen.getByText("2 minutes ago")).toBeInTheDocument();
  });

  it("falls back to current time when no operator queries exist in cache", () => {
    const queryClient = makeClient();

    render(<RefreshBar />, { wrapper: wrapper(queryClient) });

    expect(screen.getByText("less than a minute ago")).toBeInTheDocument();
  });
});

/** An active operator query next to the bar, the way the dashboard mounts it. */
function BarWithOperatorQuery({
  queryFn,
}: {
  queryFn: () => Promise<unknown>;
}) {
  useQuery({ queryKey: ["operator", "stores"], queryFn });
  return <RefreshBar />;
}

describe("RefreshBar refresh button", () => {
  it("refetches the operator queries when pressed", async () => {
    const user = userEvent.setup();
    const fetchStores = vi.fn().mockResolvedValue({ stores: [] });

    render(<BarWithOperatorQuery queryFn={fetchStores} />, {
      wrapper: wrapper(makeClient()),
    });
    await waitFor(() => expect(fetchStores).toHaveBeenCalledTimes(1));
    await user.click(await screen.findByRole("button", { name: "Refresh" }));

    await waitFor(() => expect(fetchStores).toHaveBeenCalledTimes(2));
  });

  it("leaves queries outside the operator namespace alone", async () => {
    const user = userEvent.setup();
    const queryClient = makeClient();
    await queryClient.fetchQuery({
      queryKey: ["elsewhere"],
      queryFn: () => Promise.resolve("x"),
    });

    render(<RefreshBar />, { wrapper: wrapper(queryClient) });
    await user.click(screen.getByRole("button", { name: "Refresh" }));

    expect(queryClient.getQueryState(["elsewhere"])?.isInvalidated).toBe(false);
  });

  it("disables the button and says so while an operator query is fetching", async () => {
    let finishFetch: (value: unknown) => void = () => {};
    const slowFetch = () =>
      new Promise((resolve) => {
        finishFetch = resolve;
      });

    render(<BarWithOperatorQuery queryFn={slowFetch} />, {
      wrapper: wrapper(makeClient()),
    });

    const busyButton = await screen.findByRole("button", {
      name: "Refreshing...",
    });
    expect(busyButton).toBeDisabled();

    await act(async () => finishFetch({ stores: [] }));
    expect(
      await screen.findByRole("button", { name: "Refresh" }),
    ).toBeEnabled();
  });

  it("stays enabled while only a non-operator query is fetching", async () => {
    const queryClient = makeClient();
    void queryClient.prefetchQuery({
      queryKey: ["elsewhere"],
      queryFn: () => new Promise(() => {}),
    });

    render(<RefreshBar />, { wrapper: wrapper(queryClient) });

    expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled();
  });
});
