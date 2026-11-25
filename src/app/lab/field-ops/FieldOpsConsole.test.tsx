import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FieldOpsConsole from "./FieldOpsConsole";
import { emptyFeedState, applyUpdate } from "@/lib/field-ops/feedState";
import type { FieldOpsFeed } from "@/hooks/useFieldOpsFeed";

vi.mock("./FieldMap", () => ({ default: () => <div data-testid="map" /> }));
const feedMock = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@/hooks/useFieldOpsFeed", () => ({
  useFieldOpsFeed: () => feedMock.current,
}));

function aFeed(overrides: Partial<FieldOpsFeed> = {}): FieldOpsFeed {
  const state = applyUpdate(emptyFeedState, {
    tracks: [
      {
        id: "t1",
        callsign: "Alpha 1",
        kind: "vehicle",
        eastMeters: 0,
        northMeters: 0,
        altitudeMeters: 0,
        headingDegrees: 0,
        speedMetersPerSecond: 4,
        lastReportedAtMs: 1000,
      },
    ],
    alerts: [
      {
        id: "a1",
        trackId: "t1",
        severity: "critical",
        message: "Left the corridor",
        raisedAtMs: 1000,
      },
    ],
  });
  return {
    connection: "live",
    state,
    nowMs: 2000,
    secondsSinceLastUpdate: 1,
    isLowBandwidth: false,
    setLowBandwidth: vi.fn(),
    acknowledge: vi.fn(),
    ...overrides,
  };
}

describe("FieldOpsConsole", () => {
  it("announces an unacknowledged critical alert and lets the operator acknowledge it from the keyboard", async () => {
    const feed = aFeed();
    feedMock.current = feed;
    render(<FieldOpsConsole />);

    expect(screen.getByRole("alert")).toHaveTextContent("Left the corridor");
    await userEvent.tab();
    const acknowledge = screen.getByRole("button", { name: /acknowledge.*left the corridor/i });
    acknowledge.focus();
    await userEvent.keyboard("{Enter}");
    expect(feed.acknowledge).toHaveBeenCalledWith("a1");
  });

  it("says plainly when the link is down and how old the picture is", () => {
    feedMock.current = aFeed({ connection: "offline", secondsSinceLastUpdate: 42 });
    render(<FieldOpsConsole />);
    expect(screen.getByRole("status")).toHaveTextContent(/offline/i);
    expect(screen.getByRole("status")).toHaveTextContent(/42/);
  });

  it("marks a stale track in words, not only colour", () => {
    feedMock.current = aFeed({ nowMs: 60_000 });
    render(<FieldOpsConsole />);
    expect(screen.getAllByText(/stale/i).length).toBeGreaterThan(0);
  });
});
