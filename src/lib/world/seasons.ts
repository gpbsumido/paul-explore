// The city dresses for the time of year the same way it dresses for the time
// of day: leaves turn, parks brown off, and December brings snow and lights.

export type Season = "winter" | "spring" | "summer" | "fall";

export type SeasonDressing = {
  readonly label: string;
  readonly foliage: string;
  readonly park: string;
  readonly snow: boolean;
  // Holiday lights strung on City Hall.
  readonly festive: boolean;
};

/** Meteorological seasons, which is close enough for a skyline. */
export function seasonFor(date: Date = new Date()): Season {
  const month = date.getMonth();
  if (month === 11 || month <= 1) return "winter";
  if (month <= 4) return "spring";
  if (month <= 7) return "summer";
  return "fall";
}

export const SEASON_DRESSING: Record<Season, SeasonDressing> = {
  winter: {
    label: "Winter",
    foliage: "#4a5a52",
    park: "#dbe4ea",
    snow: true,
    festive: true,
  },
  spring: {
    label: "Spring",
    foliage: "#4f8f52",
    park: "#2f5c38",
    snow: false,
    festive: false,
  },
  summer: {
    label: "Summer",
    foliage: "#2e6045",
    park: "#255239",
    snow: false,
    festive: false,
  },
  fall: {
    label: "Fall",
    foliage: "#c2622c",
    park: "#4a5233",
    snow: false,
    festive: false,
  },
};
