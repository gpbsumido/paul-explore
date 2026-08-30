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

  /**
   * The other direction, which is the one that could actually fail.
   *
   * Five places say the world holds an exhibit for every feature. Nothing
   * checked it, so Research Explorer -- a headline feature with its own hub
   * card -- shipped with no exhibit and the claim quietly became untrue.
   *
   * Exclusions are named rather than counted, so adding a feature fails here
   * until someone either builds it a landmark or says why not. The blurbs and
   * collider placements are hand-made, so this cannot generate the exhibit --
   * only insist that the decision gets made.
   */
  it("exhibits every feature, or names why not", () => {
    const NO_EXHIBIT_ON_PURPOSE = new Set([
      // The world is the thing doing the exhibiting.
      "world",
      // A tiny toy, and the city is already dense around that block.
      "ketsup",
      // The way into the site rather than a place in it. An exhibit for it
      // would send someone out of the world to a page whose whole job is
      // sending them back into it.
      "discover",
      // Only means anything at a real location: without a site link and a
      // display in front of you there is nothing to do on the page, so an
      // exhibit would walk someone to a sign-in wall and an empty list.
      "check-in",
    ]);

    const exhibited = new Set(EXHIBITS.map((e) => e.featureId));
    const missing = FEATURES.filter(
      (f) => !exhibited.has(f.id) && !NO_EXHIBIT_ON_PURPOSE.has(f.id),
    );

    expect(missing.map((f) => f.id)).toEqual([]);
  });

  it("has at most one exhibit per feature", () => {
    const ids = EXHIBITS.map((e) => e.featureId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("crowns exactly one main exhibition", () => {
    const featured = EXHIBITS.filter((e) => e.featured);
    expect(featured.map((e) => e.featureId)).toEqual(["work-portfolio"]);
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
