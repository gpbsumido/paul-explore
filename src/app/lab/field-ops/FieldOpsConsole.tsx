"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useFieldOpsFeed } from "@/hooks/useFieldOpsFeed";
import { alertsNeedingAttentionFirst, isTrackStale } from "@/lib/field-ops/feedState";
import VideoFeed from "./VideoFeed";

// WebGL needs the browser.
const FieldMap = dynamic(() => import("./FieldMap"), { ssr: false, loading: () => null });

const CONNECTION_LABEL = {
  live: "Live",
  reconnecting: "Reconnecting",
  offline: "Offline",
} as const;

const SEVERITY_LABEL = { critical: "Critical", warning: "Warning", info: "Info" } as const;
const SEVERITY_CLASS = {
  critical: "border-error-600 bg-error-50 text-error-700 dark:bg-error-950 dark:text-error-200",
  warning: "border-warning-600 bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-200",
  info: "border-border bg-surface text-foreground",
} as const;

export default function FieldOpsConsole() {
  const feed = useFieldOpsFeed();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const tracks = Object.values(feed.state.tracksById);
  const staleTrackIds = new Set(
    tracks.filter((track) => isTrackStale(track, feed.nowMs)).map((track) => track.id),
  );
  const alerts = alertsNeedingAttentionFirst(feed.state);
  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) ?? null;
  const callsignOf = (trackId: string) => feed.state.tracksById[trackId]?.callsign ?? trackId;

  return (
    // On wide screens the console fills the window under the 56px header and
    // its 1px rule, so the alert queue scrolls instead of the page.
    <main className="mx-auto max-w-6xl px-4 py-6 lg:flex lg:h-[calc(100dvh-3.5rem-1px)] lg:min-h-[44rem] lg:flex-col">
      <h1 className="text-2xl font-bold">Field Ops</h1>
      <p className="mt-1 text-sm text-muted">
        Simulated tracks, video and alerts. Nothing here is real.
      </p>

      <div role="status" className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold">
          {CONNECTION_LABEL[feed.connection]}
          {feed.connection === "offline" &&
            `: showing the last picture, ${feed.secondsSinceLastUpdate}s old`}
        </span>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={feed.isLowBandwidth}
            onChange={(event) => feed.setLowBandwidth(event.target.checked)}
          />
          Low bandwidth (updates every 5s, video paused)
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4 lg:min-h-0">
          <div
            role="img"
            aria-label={`3D map of ${tracks.length} tracks. The track list has the same information as text.`}
            className="h-96 overflow-hidden rounded-2xl lg:h-auto lg:min-h-0 lg:flex-1 border border-border bg-surface"
          >
            <FieldMap
              tracks={tracks}
              staleTrackIds={staleTrackIds}
              selectedTrackId={selectedTrackId}
            />
          </div>
          <VideoFeed
            track={selectedTrack}
            nowMs={feed.nowMs}
            isStale={selectedTrack ? staleTrackIds.has(selectedTrack.id) : false}
            isPaused={feed.isLowBandwidth}
          />
        </div>

        {/* On wide screens the side column takes the map column's height, so a
            long alert queue scrolls in place instead of stretching the page. */}
        <div className="lg:relative">
          <div className="flex flex-col gap-4 lg:absolute lg:inset-0">
            <div
              role="region"
              aria-labelledby="alerts-heading"
              tabIndex={0}
              className="max-h-96 min-h-0 flex-1 overflow-y-auto rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 lg:max-h-none"
            >
              <h2 id="alerts-heading" className="sticky top-0 z-10 mb-2 bg-background text-lg font-bold">
                Alerts
              </h2>
              <ul className="space-y-2">
                {alerts.map((alert) => {
                  const isAcknowledged = feed.state.acknowledgedAlertIds.includes(alert.id);
                  return (
                    <li
                      key={alert.id}
                      role={alert.severity === "critical" && !isAcknowledged ? "alert" : undefined}
                      className={`rounded-lg border-l-4 p-3 text-sm ${SEVERITY_CLASS[alert.severity]} ${isAcknowledged ? "opacity-60" : ""}`}
                    >
                      <p className="font-semibold">
                        {SEVERITY_LABEL[alert.severity]}: {alert.message}
                      </p>
                      <p>{callsignOf(alert.trackId)}</p>
                      {isAcknowledged ? (
                        <p>Acknowledged</p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => feed.acknowledge(alert.id)}
                          aria-label={`Acknowledge: ${alert.message}, ${callsignOf(alert.trackId)}`}
                          className="paul-touch-target mt-2 rounded-md border border-current px-3 py-1 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                          Acknowledge
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <section aria-labelledby="tracks-heading" className="shrink-0">
              <h2 id="tracks-heading" className="mb-2 text-lg font-bold">Tracks</h2>
              <ul className="space-y-2">
                {tracks.map((track) => {
                  const isStale = staleTrackIds.has(track.id);
                  return (
                    <li key={track.id}>
                      <button
                        type="button"
                        aria-pressed={track.id === selectedTrackId}
                        onClick={() => setSelectedTrackId(track.id)}
                        className="paul-touch-target w-full rounded-lg border border-border bg-surface p-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 aria-pressed:border-primary-600"
                      >
                        <span className="font-semibold">{track.callsign}</span> ({track.kind}),{" "}
                        {Math.round(track.speedMetersPerSecond)} m/s
                        {isStale && (
                          <span className="ml-2 font-semibold text-warning-700 dark:text-warning-200">
                            STALE {Math.round((feed.nowMs - track.lastReportedAtMs) / 1000)}s
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
