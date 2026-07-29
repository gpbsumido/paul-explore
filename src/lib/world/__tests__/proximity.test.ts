import { describe, it, expect } from "vitest";
import { nearestExhibit, INTERACT_RADIUS } from "../proximity";

const exhibitAt = (featureId: string, x: number, z: number) => ({
  featureId,
  landmark: "",
  blurb: "",
  position: { x, z },
});

describe("nearestExhibit", () => {
  const cnTower = exhibitAt("particles", 0, 0);
  const cityHall = exhibitAt("calendar", 10, 0);

  it("returns null when nothing is within reach", () => {
    const player = { x: 0, z: INTERACT_RADIUS + 5 };
    expect(nearestExhibit(player, [cnTower, cityHall])).toBeNull();
  });

  it("returns the exhibit the player is standing next to", () => {
    expect(nearestExhibit({ x: 1, z: 1 }, [cnTower, cityHall])).toBe(cnTower);
  });

  it("picks the closest when two are in range", () => {
    const between = { x: 5.4, z: 0 };
    expect(nearestExhibit(between, [cnTower, cityHall], 6)).toBe(cityHall);
  });

  it("includes an exhibit exactly at the interaction radius", () => {
    const player = { x: INTERACT_RADIUS, z: 0 };
    expect(nearestExhibit(player, [cnTower])).toBe(cnTower);
  });

  it("returns null for an empty catalog", () => {
    expect(nearestExhibit({ x: 0, z: 0 }, [])).toBeNull();
  });
});
