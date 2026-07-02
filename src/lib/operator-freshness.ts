// ---------------------------------------------------------------------------
// Data freshness helpers: threshold classification and sensor status checks
// ---------------------------------------------------------------------------

export type FreshnessLevel = "fresh" | "aging" | "stale";

const FRESH_THRESHOLD_MS = 2 * 60 * 1000;
const STALE_THRESHOLD_MS = 10 * 60 * 1000;
const SENSOR_OFFLINE_THRESHOLD_MS = 30 * 60 * 1000;

/**
 * Classifies data freshness into a visual tier based on elapsed time.
 * Fresh = under 2 minutes, Aging = 2-10 minutes, Stale = over 10 minutes.
 * Accepts an optional `now` timestamp for deterministic testing.
 */
export function getFreshnessLevel(
  lastPing: string,
  now: number = Date.now(),
): FreshnessLevel {
  const elapsed = now - new Date(lastPing).getTime();

  if (elapsed < FRESH_THRESHOLD_MS) return "fresh";
  if (elapsed < STALE_THRESHOLD_MS) return "aging";
  return "stale";
}

/**
 * Returns true when sensor data is 10 or more minutes old, indicating
 * the store card should show a stale-data border treatment.
 */
export function isStaleData(
  lastPing: string,
  now: number = Date.now(),
): boolean {
  const elapsed = now - new Date(lastPing).getTime();
  return elapsed >= STALE_THRESHOLD_MS;
}

/**
 * Returns true when sensors haven't reported in 30 or more minutes,
 * triggering the "Sensor offline since X" callout on the inventory tab.
 */
export function isSensorOffline(
  lastPing: string,
  now: number = Date.now(),
): boolean {
  const elapsed = now - new Date(lastPing).getTime();
  return elapsed >= SENSOR_OFFLINE_THRESHOLD_MS;
}
