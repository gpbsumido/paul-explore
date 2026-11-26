import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { API_URL } from "@/lib/apiUrl";
import { useFieldOpsFeed } from "./useFieldOpsFeed";
import type { FieldOpsSnapshot } from "@/lib/field-ops/types";

class StubSocket {
  static instances: StubSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  close = vi.fn();
  constructor(public url: string) {
    StubSocket.instances.push(this);
  }
  open() {
    this.onopen?.();
  }
  receive(sequence: number, snapshot: FieldOpsSnapshot) {
    this.onmessage?.({ data: JSON.stringify({ sequence, snapshot }) });
  }
  drop() {
    this.onclose?.();
  }
}

const aSnapshot = (serverTimeMs: number): FieldOpsSnapshot => ({
  serverTimeMs,
  tracks: [
    {
      id: "t1",
      callsign: "Alpha 1",
      kind: "vehicle",
      eastMeters: 1,
      northMeters: 2,
      altitudeMeters: 0,
      headingDegrees: 0,
      speedMetersPerSecond: 3,
      lastReportedAtMs: serverTimeMs,
    },
  ],
  alerts: [],
});

const WS_BASE = API_URL.replace(/^http/, "ws");
const latestSocket = () => StubSocket.instances[StubSocket.instances.length - 1];

beforeEach(() => {
  vi.useFakeTimers();
  StubSocket.instances = [];
  vi.stubGlobal("WebSocket", StubSocket);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useFieldOpsFeed", () => {
  it("connects straight to portfolio_api's socket and goes live on the first frame", () => {
    const { result } = renderHook(() => useFieldOpsFeed());
    expect(latestSocket().url).toBe(`${WS_BASE}/api/field-ops/socket`);

    act(() => {
      latestSocket().open();
      latestSocket().receive(100, aSnapshot(100_000));
    });

    expect(result.current.connection).toBe("live");
    expect(result.current.state.tracksById["t1"]).toBeDefined();
  });

  it("reconnects after a drop, asking for everything since the last sequence it saw", () => {
    const { result } = renderHook(() => useFieldOpsFeed());
    act(() => {
      latestSocket().open();
      latestSocket().receive(100, aSnapshot(100_000));
      latestSocket().drop();
    });
    expect(result.current.connection).toBe("reconnecting");
    expect(StubSocket.instances).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(StubSocket.instances).toHaveLength(2);
    expect(latestSocket().url).toBe(`${WS_BASE}/api/field-ops/socket?since=100`);
  });

  it("waits longer after each failed attempt, up to 10 seconds", () => {
    renderHook(() => useFieldOpsFeed());
    const delaysBeforeEachRetry = [1_000, 2_000, 4_000, 8_000, 10_000, 10_000];

    delaysBeforeEachRetry.forEach((delay, retryIndex) => {
      act(() => latestSocket().drop());
      act(() => {
        vi.advanceTimersByTime(delay - 1);
      });
      expect(StubSocket.instances).toHaveLength(retryIndex + 1);
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(StubSocket.instances).toHaveLength(retryIndex + 2);
    });
  });

  it("starts the wait over once a connection opens again", () => {
    renderHook(() => useFieldOpsFeed());
    act(() => latestSocket().drop());
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    act(() => latestSocket().open());
    act(() => latestSocket().drop());
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(StubSocket.instances).toHaveLength(3);
  });

  it("reopens at the slow rate when low bandwidth is switched on", () => {
    const { result } = renderHook(() => useFieldOpsFeed());
    act(() => result.current.setLowBandwidth(true));
    expect(latestSocket().url).toBe(`${WS_BASE}/api/field-ops/socket?rate=low`);
  });

  it("closes the socket and stops retrying when the page goes away", () => {
    const { unmount } = renderHook(() => useFieldOpsFeed());
    const socket = latestSocket();
    unmount();
    expect(socket.close).toHaveBeenCalled();

    act(() => {
      socket.drop();
      vi.advanceTimersByTime(20_000);
    });
    expect(StubSocket.instances).toHaveLength(1);
  });
});
