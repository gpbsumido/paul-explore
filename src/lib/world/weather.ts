import type { WeatherCondition } from "@/hooks/useWeather";

// Real weather over the model city: the same condition the site already
// detects for the visitor drives rain, snow, thicker fog, and the odd flash
// of lightning.

export type Precipitation = "none" | "rain" | "snow";

export type WeatherDressing = {
  readonly label: string;
  readonly precipitation: Precipitation;
  // 0..1, how much of the particle budget this condition uses.
  readonly density: number;
  // World units per second the particles fall.
  readonly fallSpeed: number;
  // Multiplier on the sky preset's fog distances; below 1 closes the city in.
  readonly fogScale: number;
  readonly lightning: boolean;
};

export const MAX_PARTICLES = 1400;

export const WEATHER_DRESSING: Record<WeatherCondition, WeatherDressing> = {
  clear: { label: "Clear", precipitation: "none", density: 0, fallSpeed: 0, fogScale: 1, lightning: false },
  "partly-cloudy": {
    label: "Partly cloudy",
    precipitation: "none",
    density: 0,
    fallSpeed: 0,
    fogScale: 0.92,
    lightning: false,
  },
  fog: { label: "Fog", precipitation: "none", density: 0, fallSpeed: 0, fogScale: 0.45, lightning: false },
  rain: { label: "Rain", precipitation: "rain", density: 0.75, fallSpeed: 26, fogScale: 0.78, lightning: false },
  snow: { label: "Snow", precipitation: "snow", density: 0.6, fallSpeed: 3.2, fogScale: 0.7, lightning: false },
  storm: { label: "Thunderstorm", precipitation: "rain", density: 1, fallSpeed: 32, fogScale: 0.6, lightning: true },
  unknown: { label: "Clear", precipitation: "none", density: 0, fallSpeed: 0, fogScale: 1, lightning: false },
};

/**
 * How many particles to draw: the condition's share of the budget, scaled by
 * the fidelity slider but never so low that visible weather disappears.
 */
export function precipitationCount(condition: WeatherCondition, fidelity: number): number {
  const { density } = WEATHER_DRESSING[condition];
  if (density === 0) return 0;
  const scale = 0.35 + Math.min(Math.max(fidelity, 0), 1) * 0.65;
  return Math.round(MAX_PARTICLES * density * scale);
}
