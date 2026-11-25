import type { FieldOpsTrack } from "@/lib/field-ops/types";

type VideoFeedProps = {
  track: FieldOpsTrack | null;
  nowMs: number;
  isStale: boolean;
  isPaused: boolean;
};

const SCANLINES =
  "repeating-linear-gradient(to bottom, transparent 0, transparent 3px, rgb(255 255 255 / 0.04) 3px, rgb(255 255 255 / 0.04) 4px)";

function timecode(timeMs: number): string {
  return new Date(timeMs).toISOString().slice(11, 19);
}

/**
 * A stand-in for a camera: nothing is streamed, it is a styled frame with the
 * selected track's telemetry over it. It follows the same rules as the map:
 * a stale track freezes and says NO SIGNAL with the age of the last frame,
 * rather than claiming to receive. Low bandwidth pauses it first because video
 * is the expensive thing on a thin link.
 */
export default function VideoFeed({ track, nowMs, isStale, isPaused }: VideoFeedProps) {
  const secondsSinceFrame = track ? Math.round((nowMs - track.lastReportedAtMs) / 1000) : 0;

  return (
    <figure className="rounded-2xl border border-border bg-surface p-3">
      <figcaption className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
        <span>Camera: {track?.callsign ?? "none selected"}</span>
        <span>{isPaused ? "Paused" : isStale ? "No signal" : "Simulated feed"}</span>
      </figcaption>

      <div
        className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-neutral-900 font-mono text-sm text-neutral-200"
        style={{ backgroundImage: SCANLINES }}
      >
        {!track ? (
          <p>Select a track to see its camera</p>
        ) : isPaused ? (
          <p>Video paused to save data</p>
        ) : (
          <>
            <div
              aria-hidden="true"
              className={`absolute inset-0 ${isStale ? "bg-black/60" : ""}`}
            />
            <div
              aria-hidden="true"
              className="h-10 w-10 rounded-full border border-neutral-400/70 after:absolute after:left-1/2 after:top-1/2 after:h-px after:w-16 after:-translate-x-1/2 after:bg-neutral-400/70"
            />
            <p className="absolute left-3 top-2 text-xs">
              {track.callsign} · {track.kind.toUpperCase()}
            </p>
            <p className="absolute right-3 top-2 text-xs">
              {isStale ? "FROZEN" : timecode(nowMs)}
            </p>
            <p className="absolute bottom-2 left-3 text-xs">
              HDG {String(Math.round(track.headingDegrees)).padStart(3, "0")} ·{" "}
              {Math.round(track.speedMetersPerSecond)} m/s · ALT {Math.round(track.altitudeMeters)} m
            </p>
            <p
              role="status"
              className={`absolute bottom-2 right-3 text-xs font-semibold ${isStale ? "text-warning-200" : ""}`}
            >
              {isStale
                ? `NO SIGNAL, last frame ${secondsSinceFrame}s ago`
                : `Receiving, frame ${secondsSinceFrame}s old`}
            </p>
          </>
        )}
      </div>
    </figure>
  );
}
