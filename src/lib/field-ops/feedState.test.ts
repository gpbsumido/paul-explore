import { describe, it, expect } from "vitest";
import {
  emptyFeedState,
  applyUpdate,
  acknowledgeAlert,
  isTrackStale,
  alertsNeedingAttentionFirst,
} from "./feedState";
import type { FieldOpsAlert, FieldOpsTrack } from "./types";

function aTrack(overrides: Partial<FieldOpsTrack> = {}): FieldOpsTrack {
  return {
    id: "t1",
    callsign: "Alpha 1",
    kind: "vehicle",
    eastMeters: 10,
    northMeters: 20,
    altitudeMeters: 0,
    headingDegrees: 90,
    speedMetersPerSecond: 5,
    lastReportedAtMs: 100_000,
    ...overrides,
  };
}

function anAlert(overrides: Partial<FieldOpsAlert> = {}): FieldOpsAlert {
  return {
    id: "a1",
    trackId: "t1",
    severity: "warning",
    message: "Left the corridor",
    raisedAtMs: 100_000,
    ...overrides,
  };
}

describe("feed state", () => {
  it("keeps the last known position of a track the update leaves out", () => {
    const first = applyUpdate(emptyFeedState, {
      tracks: [aTrack()],
      alerts: [],
    });
    const second = applyUpdate(first, { tracks: [], alerts: [] });
    expect(second.tracksById["t1"].eastMeters).toBe(10);
  });

  it("calls a track stale once its last report is more than 10 seconds old", () => {
    const track = aTrack({ lastReportedAtMs: 100_000 });
    expect(isTrackStale(track, 109_000)).toBe(false);
    expect(isTrackStale(track, 111_000)).toBe(true);
  });

  it("puts unacknowledged critical alerts first, newest first within a group", () => {
    const state = applyUpdate(emptyFeedState, {
      tracks: [],
      alerts: [
        anAlert({ id: "info", severity: "info", raisedAtMs: 300 }),
        anAlert({ id: "old-critical", severity: "critical", raisedAtMs: 100 }),
        anAlert({ id: "new-critical", severity: "critical", raisedAtMs: 200 }),
      ],
    });
    expect(alertsNeedingAttentionFirst(state).map((alert) => alert.id)).toEqual([
      "new-critical",
      "old-critical",
      "info",
    ]);
  });

  it("sinks an alert once it is acknowledged, and keeps it acknowledged when the next update repeats it", () => {
    const critical = anAlert({ id: "c", severity: "critical", raisedAtMs: 500 });
    const info = anAlert({ id: "i", severity: "info", raisedAtMs: 100 });
    let state = applyUpdate(emptyFeedState, { tracks: [], alerts: [critical, info] });
    state = acknowledgeAlert(state, "c");
    state = applyUpdate(state, { tracks: [], alerts: [critical, info] });
    expect(alertsNeedingAttentionFirst(state).map((alert) => alert.id)).toEqual(["i", "c"]);
    expect(state.acknowledgedAlertIds).toContain("c");
  });
});
