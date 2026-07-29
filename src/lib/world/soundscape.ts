import type { Vec2 } from "@/types/world";
import type { WeatherCondition } from "@/hooks/useWeather";
import { STREETCAR_ROUTE } from "./cityLayout";
import { WALK_SPEED } from "./movement";

// What the city should sound like from wherever you're standing. Pure mixing
// decisions only — the actual noise is synthesised in the browser, so the
// world stays asset-free.

export const MAX_GAIN = 1;
// South of here you can hear the lake.
export const LAKE_SHORE_Z = 44;
const WAVE_EARSHOT = 26;
const STREETCAR_EARSHOT = 34;

export type AmbienceMix = {
  // Traffic hum, loudest in the core.
  readonly city: number;
  readonly waves: number;
  readonly streetcar: number;
  readonly rain: number;
};

/** Linear falloff to silence at the edge of earshot. */
export function proximityGain(distance: number, earshot: number): number {
  if (distance >= earshot) return 0;
  return 1 - distance / earshot;
}

type MixInput = {
  readonly player: Vec2;
  // Where the streetcar is right now.
  readonly carX: number;
  readonly condition: WeatherCondition;
};

/** The gain for each ambient channel at the player's position. */
export function ambienceMix({ player, carX, condition }: MixInput): AmbienceMix {
  // Downtown is loud; the waterfront and the parks are not.
  const fromCore = Math.hypot(player.x, player.z + 10);
  const density = proximityGain(fromCore, 90);
  const muffled = condition === "snow" ? 0.45 : 1;

  const toShore = Math.max(0, LAKE_SHORE_Z - player.z);
  const waves = proximityGain(toShore, WAVE_EARSHOT);

  const toCar = Math.hypot(player.x - carX, player.z - STREETCAR_ROUTE.z);
  const streetcar = proximityGain(toCar, STREETCAR_EARSHOT);

  const rain = condition === "storm" ? 0.85 : condition === "rain" ? 0.55 : 0;

  return {
    city: Math.min(density * 0.7 * muffled, MAX_GAIN),
    waves: Math.min(waves * 0.6, MAX_GAIN),
    streetcar: Math.min(streetcar * 0.5, MAX_GAIN),
    rain: Math.min(rain, MAX_GAIN),
  };
}

/**
 * Seconds between footsteps at a given speed, or null when standing still.
 * Clamped so a boosted sprint never turns into a drum roll.
 */
export function footstepInterval(speed: number): number | null {
  if (speed < 0.6) return null;
  return Math.max(0.15, 0.42 / (speed / WALK_SPEED));
}
