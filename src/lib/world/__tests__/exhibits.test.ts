import { describe, it, expect } from "vitest";
import { EXHIBITS } from "../exhibits";
import { COLLIDERS } from "../cityLayout";
import { WORLD_BOUNDS, PLAYER_RADIUS } from "../movement";
import { INTERACT_RADIUS } from "../proximity";
import { resolveColliders } from "../colliders";
import { FEATURES } from "@/app/_shared/featureData";

describe("world exhibits", () => {
  it("only exhibits features that exist in the hub", () => {
    for (const exhibit of EXHIBITS) {
      const feature = FEATURES.find((f) => f.id === exhibit.featureId);
      expect(feature, `no feature for exhibit ${exhibit.featureId}`).toBeDefined();
    }
  });

  it("never exhibits itself", () => {
    expect(EXHIBITS.some((e) => e.featureId === "world")).toBe(false);
  });

  it("has at most one exhibit per feature", () => {
    const ids = EXHIBITS.map((e) => e.featureId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every exhibit a landmark and a placard blurb", () => {
    for (const exhibit of EXHIBITS) {
      expect(exhibit.landmark.length).toBeGreaterThan(0);
      expect(exhibit.blurb.length).toBeGreaterThan(10);
    }
  });

  it("places every exhibit inside the walkable bounds", () => {
    for (const { position, featureId } of EXHIBITS) {
      expect(position.x, featureId).toBeGreaterThan(WORLD_BOUNDS.minX);
      expect(position.x, featureId).toBeLessThan(WORLD_BOUNDS.maxX);
      expect(position.z, featureId).toBeGreaterThan(WORLD_BOUNDS.minZ);
      expect(position.z, featureId).toBeLessThan(WORLD_BOUNDS.maxZ);
    }
  });

  it("places every exhibit on ground the player can actually reach", () => {
    for (const { position, featureId } of EXHIBITS) {
      const resolved = resolveColliders(position, PLAYER_RADIUS, COLLIDERS);
      expect(resolved, `${featureId} exhibit is buried in a building`).toEqual(position);
    }
  });

  it("spaces exhibits so two placards can never fight over the player", () => {
    for (const a of EXHIBITS) {
      for (const b of EXHIBITS) {
        if (a === b) continue;
        const distance = Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z);
        expect(
          distance,
          `${a.featureId} and ${b.featureId} are too close`,
        ).toBeGreaterThanOrEqual(INTERACT_RADIUS * 2);
      }
    }
  });
});
