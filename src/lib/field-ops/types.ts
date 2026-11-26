/** The shapes portfolio_api's /api/field-ops endpoints send. */

export type FieldOpsTrackKind = "vehicle" | "aircraft" | "vessel";
export type FieldOpsAlertSeverity = "critical" | "warning" | "info";

export type FieldOpsTrack = {
  id: string;
  callsign: string;
  kind: FieldOpsTrackKind;
  eastMeters: number;
  northMeters: number;
  altitudeMeters: number;
  headingDegrees: number;
  speedMetersPerSecond: number;
  /** When this position was reported. Older than now means the track went quiet. */
  lastReportedAtMs: number;
};

export type FieldOpsAlert = {
  id: string;
  trackId: string;
  severity: FieldOpsAlertSeverity;
  message: string;
  raisedAtMs: number;
};

export type FieldOpsSnapshot = {
  serverTimeMs: number;
  tracks: FieldOpsTrack[];
  alerts: FieldOpsAlert[];
};
