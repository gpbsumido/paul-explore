import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import VideoFeed from "./VideoFeed";
import type { FieldOpsTrack } from "@/lib/field-ops/types";

const track: FieldOpsTrack = {
  id: "t1",
  callsign: "Delta 4",
  kind: "aircraft",
  eastMeters: 120,
  northMeters: -40,
  altitudeMeters: 300,
  headingDegrees: 87,
  speedMetersPerSecond: 36,
  lastReportedAtMs: 100_000,
};

describe("VideoFeed", () => {
  it("overlays the selected track's live telemetry on the frame", () => {
    render(<VideoFeed track={track} nowMs={101_000} isStale={false} isPaused={false} />);
    expect(screen.getByText(/Delta 4 · AIRCRAFT/)).toBeInTheDocument();
    expect(screen.getByText(/087/)).toBeInTheDocument();
    expect(screen.getByText(/36 m\/s/)).toBeInTheDocument();
    expect(screen.getByText(/300 m/)).toBeInTheDocument();
  });

  it("says no signal and how old the last frame is when the track goes stale, instead of claiming to receive", () => {
    render(<VideoFeed track={track} nowMs={114_000} isStale isPaused={false} />);
    expect(screen.getByRole("status")).toHaveTextContent(/no signal/i);
    expect(screen.getByRole("status")).toHaveTextContent(/14s/);
    expect(screen.queryByText(/receiving/i)).not.toBeInTheDocument();
  });

  it("says video is paused when low bandwidth is on", () => {
    render(<VideoFeed track={track} nowMs={101_000} isStale={false} isPaused />);
    expect(screen.getByText(/video paused to save data/i)).toBeInTheDocument();
  });

  it("asks for a selection when no track is chosen", () => {
    render(<VideoFeed track={null} nowMs={0} isStale={false} isPaused={false} />);
    expect(screen.getByText(/select a track/i)).toBeInTheDocument();
  });
});
