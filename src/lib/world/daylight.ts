// The world matches the visitor's clock: day when it's day where they are,
// dusk around sunrise and sunset, night otherwise. When the hour can't be
// trusted, night wins — the city looks its best after dark anyway.

export type TimeOfDay = "day" | "dusk" | "night";

/**
 * Maps a local hour (fractional, 0–24) to a lighting preset. Out-of-range or
 * NaN input falls back to night.
 */
export function timeOfDayFor(hour: number): TimeOfDay {
  if (!Number.isFinite(hour) || hour < 0 || hour >= 24) return "night";
  if (hour >= 6 && hour < 8) return "dusk";
  if (hour >= 8 && hour < 17.5) return "day";
  if (hour >= 17.5 && hour < 20) return "dusk";
  return "night";
}

/** Time of day for the visitor's local clock. */
export function currentTimeOfDay(date: Date = new Date()): TimeOfDay {
  return timeOfDayFor(date.getHours() + date.getMinutes() / 60);
}
