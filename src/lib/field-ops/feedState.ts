import type { FieldOpsAlert, FieldOpsTrack } from "./sim";

/** A track nobody has heard from in this long is shown as stale, not hidden. */
export const STALE_AFTER_MS = 10_000;
const ALERTS_KEPT = 20;

export type FeedState = {
  tracksById: Record<string, FieldOpsTrack>;
  alerts: FieldOpsAlert[];
  acknowledgedAlertIds: string[];
};

export const emptyFeedState: FeedState = {
  tracksById: {},
  alerts: [],
  acknowledgedAlertIds: [],
};

/**
 * Folds one update into the picture. A track the update leaves out keeps its
 * last known position, because losing a contact off the map is worse than
 * showing it old.
 */
export function applyUpdate(
  state: FeedState,
  update: { tracks: FieldOpsTrack[]; alerts: FieldOpsAlert[] },
): FeedState {
  const tracksById = { ...state.tracksById };
  for (const track of update.tracks) tracksById[track.id] = track;

  const knownAlertIds = new Set(state.alerts.map((alert) => alert.id));
  const newAlerts = update.alerts.filter((alert) => !knownAlertIds.has(alert.id));
  const alerts = [...state.alerts, ...newAlerts]
    .sort((first, second) => second.raisedAtMs - first.raisedAtMs)
    .slice(0, ALERTS_KEPT);

  return { ...state, tracksById, alerts };
}

/** Marks an alert as seen. Only an operator action does this, never a timeout. */
export function acknowledgeAlert(state: FeedState, alertId: string): FeedState {
  if (state.acknowledgedAlertIds.includes(alertId)) return state;
  return { ...state, acknowledgedAlertIds: [...state.acknowledgedAlertIds, alertId] };
}

export function isTrackStale(track: FieldOpsTrack, nowMs: number): boolean {
  return nowMs - track.lastReportedAtMs > STALE_AFTER_MS;
}

const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 } as const;

/** Unacknowledged first, then by severity, then newest first. */
export function alertsNeedingAttentionFirst(state: FeedState): FieldOpsAlert[] {
  const isAcknowledged = (alert: FieldOpsAlert) => state.acknowledgedAlertIds.includes(alert.id);
  return [...state.alerts].sort(
    (first, second) =>
      Number(isAcknowledged(first)) - Number(isAcknowledged(second)) ||
      SEVERITY_RANK[first.severity] - SEVERITY_RANK[second.severity] ||
      second.raisedAtMs - first.raisedAtMs,
  );
}
