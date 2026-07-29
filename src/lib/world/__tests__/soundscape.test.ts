import { describe, it, expect } from "vitest";
import {
  ambienceMix,
  footstepInterval,
  proximityGain,
  LAKE_SHORE_Z,
  MAX_GAIN,
} from "../soundscape";
import { WALK_SPEED } from "../movement";

describe("proximityGain", () => {
  it("is loudest right on top of a source", () => {
    expect(proximityGain(0, 20)).toBe(1);
  });

  it("falls off to silence at the edge of earshot", () => {
    expect(proximityGain(20, 20)).toBe(0);
    expect(proximityGain(40, 20)).toBe(0);
  });

  it("fades smoothly in between", () => {
    const near = proximityGain(5, 20);
    const far = proximityGain(15, 20);
    expect(near).toBeGreaterThan(far);
    expect(far).toBeGreaterThan(0);
  });
});

describe("ambienceMix", () => {
  const downtown = { x: 0, z: -20 };
  const shore = { x: 0, z: LAKE_SHORE_Z - 2 };

  it("never exceeds the gain ceiling on any channel", () => {
    for (const at of [downtown, shore, { x: -70, z: -70 }]) {
      const mix = ambienceMix({ player: at, carX: 0, condition: "storm" });
      for (const gain of Object.values(mix)) {
        expect(gain).toBeGreaterThanOrEqual(0);
        expect(gain).toBeLessThanOrEqual(MAX_GAIN);
      }
    }
  });

  it("puts the waves at the water and not downtown", () => {
    expect(ambienceMix({ player: shore, carX: 999, condition: "clear" }).waves).toBeGreaterThan(0);
    expect(ambienceMix({ player: downtown, carX: 999, condition: "clear" }).waves).toBe(0);
  });

  it("hums with traffic downtown and quiets by the lake", () => {
    const city = ambienceMix({ player: downtown, carX: 999, condition: "clear" }).city;
    const quiet = ambienceMix({ player: shore, carX: 999, condition: "clear" }).city;
    expect(city).toBeGreaterThan(quiet);
  });

  it("brings the streetcar up as it passes and drops it when it's gone", () => {
    const passing = ambienceMix({ player: { x: 0, z: -12 }, carX: 1, condition: "clear" });
    const distant = ambienceMix({ player: { x: 0, z: -12 }, carX: 70, condition: "clear" });
    expect(passing.streetcar).toBeGreaterThan(distant.streetcar);
    expect(distant.streetcar).toBe(0);
  });

  it("only rains when it's raining", () => {
    expect(ambienceMix({ player: downtown, carX: 999, condition: "clear" }).rain).toBe(0);
    expect(ambienceMix({ player: downtown, carX: 999, condition: "rain" }).rain).toBeGreaterThan(0);
    expect(
      ambienceMix({ player: downtown, carX: 999, condition: "storm" }).rain,
    ).toBeGreaterThan(ambienceMix({ player: downtown, carX: 999, condition: "rain" }).rain);
  });

  it("muffles the city under snow", () => {
    const snowy = ambienceMix({ player: downtown, carX: 999, condition: "snow" }).city;
    const clear = ambienceMix({ player: downtown, carX: 999, condition: "clear" }).city;
    expect(snowy).toBeLessThan(clear);
  });
});

describe("footstepInterval", () => {
  it("goes quiet when standing still", () => {
    expect(footstepInterval(0)).toBeNull();
  });

  it("steps faster the quicker you move", () => {
    const walking = footstepInterval(WALK_SPEED)!;
    const running = footstepInterval(WALK_SPEED * 1.8)!;
    expect(running).toBeLessThan(walking);
    expect(walking).toBeGreaterThan(0.15);
  });

  it("never machine-guns at absurd speeds", () => {
    expect(footstepInterval(500)!).toBeGreaterThanOrEqual(0.15);
  });
});
