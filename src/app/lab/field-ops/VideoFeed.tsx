type VideoFeedProps = {
  callsign: string | null;
  isPaused: boolean;
};

/**
 * A stand-in for a camera: nothing is streamed, it is a styled tile. Low
 * bandwidth pauses it first because video is the expensive thing on a thin link.
 */
export default function VideoFeed({ callsign, isPaused }: VideoFeedProps) {
  return (
    <figure className="rounded-2xl border border-border bg-surface p-3">
      <figcaption className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
        <span>Camera: {callsign ?? "none selected"}</span>
        <span>{isPaused ? "Paused" : "Simulated feed"}</span>
      </figcaption>
      <div className="flex aspect-video items-center justify-center rounded-lg bg-neutral-900 text-sm text-neutral-300">
        {isPaused ? (
          <p>Video paused to save data</p>
        ) : callsign ? (
          <p className="motion-safe:animate-pulse">Receiving video from {callsign}</p>
        ) : (
          <p>Select a track to see its camera</p>
        )}
      </div>
    </figure>
  );
}
