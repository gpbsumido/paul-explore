import { describe, it, expect } from "vitest";
import {
  isOverCarRoof,
  landsOnRoof,
  ROOF_HEIGHT,
  CAR_HALF_LENGTH,
  type StreetcarState,
} from "../transit";

const car: StreetcarState = { x: 0, z: -12, direction: 1, dwelling: false };

describe("isOverCarRoof", () => {
  it("knows when you're above the car", () => {
    expect(isOverCarRoof({ x: 0, z: -12 }, car)).toBe(true);
    expect(isOverCarRoof({ x: CAR_HALF_LENGTH - 0.2, z: -12 }, car)).toBe(true);
  });

  it("knows when you're beside or past it", () => {
    expect(isOverCarRoof({ x: 0, z: -9 }, car)).toBe(false);
    expect(isOverCarRoof({ x: CAR_HALF_LENGTH + 2, z: -12 }, car)).toBe(false);
  });
});

describe("landsOnRoof", () => {
  const over = { x: 0, z: -12 };

  it("catches a jump coming down onto the roof", () => {
    expect(landsOnRoof(over, ROOF_HEIGHT + 0.2, -3, car)).toBe(true);
  });

  it("ignores the way up so you don't snap on mid-launch", () => {
    expect(landsOnRoof(over, ROOF_HEIGHT + 0.2, 6, car)).toBe(false);
  });

  it("ignores someone walking past at street level", () => {
    expect(landsOnRoof(over, 0, 0, car)).toBe(false);
  });

  it("ignores a jump that sails way over the roof", () => {
    expect(landsOnRoof(over, ROOF_HEIGHT + 5, -2, car)).toBe(false);
  });

  it("ignores a descent that isn't above the car at all", () => {
    expect(landsOnRoof({ x: 20, z: -12 }, ROOF_HEIGHT, -3, car)).toBe(false);
  });
});
