// ---------------------------------------------------------------------------
// Zone-aware calendar math for the operator dashboard
//
// Every bucket boundary on this dashboard used to be UTC: buildPeriods floored
// with Date.UTC, alertsByDay divided epoch milliseconds by 86.4e6. For a Toronto
// store that put the day boundary at 8pm the previous evening, and for Vancouver
// at 5pm, so the busiest part of an operator's afternoon landed in tomorrow's
// column. This module is the single place that knows how to move between an
// instant and a local wall clock.
//
// No date library on purpose. The only question this asks is "given this instant
// and this zone, what is the local Y/M/D/H", which Intl.DateTimeFormat answers
// using tzdata the runtime already ships. date-fns-tz or Luxon would send a
// second copy of tzdata down the wire to do the same job.
//
// Constructing a formatter is the expensive part, so they are cached per zone.
// ---------------------------------------------------------------------------

import type { ProvinceCode } from "@/types/operator";

export const DEFAULT_ZONE = "UTC";

/** Weekday labels indexed Sun-first, matching `weekdayOf` (0 = Sunday). */
export const WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

/**
 * The zone each province mostly observes. Only a fallback for an API that has
 * not started sending `timezone` yet -- BC, QC and NU all span more than one
 * zone, so the server's per-store value always wins when it is there.
 */
const PROVINCE_ZONE: Record<ProvinceCode, string> = {
  AB: "America/Edmonton",
  BC: "America/Vancouver",
  MB: "America/Winnipeg",
  NB: "America/Moncton",
  NL: "America/St_Johns",
  NS: "America/Halifax",
  NT: "America/Yellowknife",
  NU: "America/Iqaluit",
  ON: "America/Toronto",
  PE: "America/Halifax",
  QC: "America/Toronto",
  SK: "America/Regina",
  YT: "America/Whitehorse",
};

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  const cached = formatters.get(timeZone);
  if (cached) return cached;

  const built = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  formatters.set(timeZone, built);
  return built;
}

/** Whether this runtime's tzdata knows the zone. */
export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The zone the person looking at the dashboard is sitting in. */
export function browserTimeZone(): string {
  const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidTimeZone(resolved) ? resolved : DEFAULT_ZONE;
}

/**
 * The zone a store's day is measured in: what the API sent, else the province
 * default, else UTC. The API value is optional so a browser holding a new bundle
 * against an older API still renders.
 */
export function storeTimeZone(
  store: { province?: ProvinceCode | string; timezone?: string } | undefined,
): string {
  if (!store) return DEFAULT_ZONE;
  if (store.timezone && isValidTimeZone(store.timezone)) return store.timezone;

  const fromProvince = PROVINCE_ZONE[store.province as ProvinceCode];
  return fromProvince ?? DEFAULT_ZONE;
}

/** The local wall clock in a zone at a given instant. */
export function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts = formatterFor(timeZone).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const found = parts.find((part) => part.type === type);
    return found ? Number(found.value) : 0;
  };

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

function offsetMsAt(instant: Date, timeZone: string): number {
  const parts = zonedParts(instant, timeZone);
  const asIfUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asIfUtc - (instant.getTime() - instant.getMilliseconds());
}

/**
 * The instant a given local wall clock happens at.
 *
 * Two passes, because the offset needed depends on the instant being looked for.
 * The second pass is what makes the 23- and 25-hour DST days come out right.
 * Out-of-range values roll over, so day 0 means the last day of the month
 * before, which is what the bucket walkers rely on.
 */
export function zonedInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  timeZone: string,
): Date {
  const naive = Date.UTC(year, month - 1, day, hour);
  const firstPass = naive - offsetMsAt(new Date(naive), timeZone);
  return new Date(naive - offsetMsAt(new Date(firstPass), timeZone));
}

/** Local midnight of the day an instant falls in. */
export function dayStartInZone(instant: Date, timeZone: string): Date {
  const { year, month, day } = zonedParts(instant, timeZone);
  return zonedInstant(year, month, day, 0, timeZone);
}

/**
 * A zone rendered as the place it names. "America/Vancouver" reads as
 * "Vancouver", which is what an operator recognises -- an offset like UTC-7 is
 * accurate and means nothing to someone loading a fridge.
 */
export function zoneLabel(timeZone: string): string {
  const region = timeZone.split("/").pop() ?? timeZone;
  return region.replace(/_/g, " ");
}

/** Day of the week (0 = Sunday) for a local calendar date. */
export function weekdayOf(parts: ZonedParts): number {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}
