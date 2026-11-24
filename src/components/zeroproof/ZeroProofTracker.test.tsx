import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import ZeroProofTracker from "./ZeroProofTracker";

const route = vi.hoisted(() => ({ pathname: "/zeroproof" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("@/lib/zeroproof/anonId", () => ({
  getAnonId: vi.fn(async (): Promise<string | null> => "anon-hash"),
  getSessionId: () => "sess-1",
}));

import { getAnonId } from "@/lib/zeroproof/anonId";

/** Everything the tracker has queued so far this session. */
const queued = (): { name: string; page: string }[] =>
  JSON.parse(window.localStorage.getItem("zp_queue:sess-1") ?? "[]");

const hideTab = () => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => "hidden",
  });
  document.dispatchEvent(new Event("visibilitychange"));
};

const beacon = vi.fn((_url: string, _body?: BodyInit | null) => true);

function setEnv() {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { hostname: "paulsumido.com" },
  });
  Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: beacon });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 202 })),
  );
}

beforeEach(() => {
  route.pathname = "/zeroproof";
  vi.mocked(getAnonId).mockImplementation(async () => "anon-hash");
  window.localStorage.clear();
  window.sessionStorage.clear();
  beacon.mockClear();
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => "visible",
  });
  setEnv();
});
afterEach(() => vi.clearAllMocks());

describe("ZeroProofTracker", () => {
  it("enqueues a page_view once a consenting visitor's anon id resolves", async () => {
    render(<ZeroProofTracker />);

    await waitFor(() => {
      const queue = JSON.parse(window.localStorage.getItem("zp_queue:sess-1") ?? "[]");
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({ name: "page_view", page: "/zeroproof", seq: 1 });
    });
  });

  it("flushes via sendBeacon when the tab is hidden", async () => {
    render(<ZeroProofTracker />);
    await waitFor(() =>
      expect(window.localStorage.getItem("zp_queue:sess-1")).not.toBeNull(),
    );

    hideTab();

    expect(beacon).toHaveBeenCalledTimes(1);
    const call = beacon.mock.calls[0];
    if (!call) throw new Error("beacon was not called");
    expect(call[0]).toBe("/api/zeroproof/track");
    // What was queued is what goes out: the page_view, under an events key.
    const sent = JSON.parse(String(call[1]));
    expect(sent.events).toHaveLength(1);
    expect(sent.events[0]).toMatchObject({ name: "page_view", page: "/zeroproof" });
  });

  it("does not flush while the tab is still visible", async () => {
    render(<ZeroProofTracker />);
    await waitFor(() => expect(queued()).toHaveLength(1));

    document.dispatchEvent(new Event("visibilitychange"));

    expect(beacon).not.toHaveBeenCalled();
  });

  it("flushes on pagehide too, for browsers that skip visibilitychange", async () => {
    render(<ZeroProofTracker />);
    await waitFor(() => expect(queued()).toHaveLength(1));

    window.dispatchEvent(new Event("pagehide"));

    expect(beacon).toHaveBeenCalledTimes(1);
  });

  it("records a page_view for each client navigation inside the segment", async () => {
    const { rerender } = render(<ZeroProofTracker />);
    await waitFor(() => expect(queued()).toHaveLength(1));

    route.pathname = "/zeroproof/leagues";
    rerender(<ZeroProofTracker />);

    await waitFor(() => expect(queued()).toHaveLength(2));
    expect(queued().map((event) => event.page)).toEqual([
      "/zeroproof",
      "/zeroproof/leagues",
    ]);
  });

  it("tracks nobody who has not accepted consent, so there is no anon id", async () => {
    vi.mocked(getAnonId).mockImplementation(async () => null);
    render(<ZeroProofTracker />);
    await waitFor(() => expect(getAnonId).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(queued()).toEqual([]);
    hideTab();
    expect(beacon).not.toHaveBeenCalled();
  });

  it.each(["localhost", "127.0.0.1"])("does not track at all from %s", async (hostname) => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { hostname },
    });
    render(<ZeroProofTracker />);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(getAnonId).not.toHaveBeenCalled();
    expect(queued()).toEqual([]);
  });

  it("stops flushing once it has been unmounted", async () => {
    const { unmount } = render(<ZeroProofTracker />);
    await waitFor(() => expect(queued()).toHaveLength(1));

    unmount();
    hideTab();

    expect(beacon).not.toHaveBeenCalled();
  });
});
