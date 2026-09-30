import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import ZeroProofTracker from "./ZeroProofTracker";

vi.mock("next/navigation", () => ({ usePathname: () => "/zeroproof" }));
vi.mock("@/lib/zeroproof/anonId", () => ({
  getAnonId: vi.fn(async () => "anon-hash"),
  getSessionId: () => "sess-1",
}));

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

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(beacon).toHaveBeenCalledTimes(1);
    const call = beacon.mock.calls[0];
    if (!call) throw new Error("beacon was not called");
    expect(call[0]).toBe("/api/zeroproof/track");
    expect(typeof call[1]).toBe("string");
  });
});
