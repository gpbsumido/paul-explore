import { describe, it, expect } from "vitest";
import { RACCOONS, raccoonStep, FLEE_RADIUS, type RaccoonState } from "../wildlife";
import { COLLIDERS } from "../cityLayout";
import { PLAYER_RADIUS } from "../movement";
import { resolveColliders } from "../colliders";

const start = (x: number, z: number): RaccoonState => ({
  x,
  z,
  heading: 0,
  fleeing: false,
});

describe("the raccoon population", () => {
  it("puts a few around the city", () => {
    expect(RACCOONS.length).toBeGreaterThanOrEqual(4);
  });

  it("gives every raccoon a patrol it can actually walk", () => {
    for (const raccoon of RACCOONS) {
      for (const point of raccoon.patrol) {
        const resolved = resolveColliders(point, PLAYER_RADIUS, COLLIDERS);
        expect(resolved, `${raccoon.id} patrols into a wall`).toEqual(point);
      }
      expect(raccoon.patrol.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("raccoonStep", () => {
  const home = RACCOONS[0];
  const far = { x: 999, z: 999 };

  it("waddles toward its next patrol point when left alone", () => {
    const state = start(home.patrol[0].x, home.patrol[0].z);
    const after = raccoonStep(state, home, far, 0.5);
    const moved = Math.hypot(after.x - state.x, after.z - state.z);
    expect(moved).toBeGreaterThan(0);
    expect(after.fleeing).toBe(false);
  });

  it("bolts when you get close", () => {
    const state = start(home.patrol[0].x, home.patrol[0].z);
    const player = { x: state.x + 1, z: state.z };
    const after = raccoonStep(state, home, player, 0.2);
    expect(after.fleeing).toBe(true);
    // It should end up further from the player than it started.
    expect(Math.hypot(after.x - player.x, after.z - player.z)).toBeGreaterThan(1);
  });

  it("settles back down once you back off", () => {
    const state: RaccoonState = { ...start(home.patrol[0].x, home.patrol[0].z), fleeing: true };
    const after = raccoonStep(state, home, far, 0.2);
    expect(after.fleeing).toBe(false);
  });

  it("only spooks inside the flee radius", () => {
    const state = start(home.patrol[0].x, home.patrol[0].z);
    const justOutside = { x: state.x + FLEE_RADIUS + 1, z: state.z };
    expect(raccoonStep(state, home, justOutside, 0.2).fleeing).toBe(false);
  });

  it("stays on its feet across a frame-rate change", () => {
    const state = start(home.patrol[0].x, home.patrol[0].z);
    const slow = raccoonStep(state, home, far, 1 / 30);
    const fast = raccoonStep(raccoonStep(state, home, far, 1 / 60), home, far, 1 / 60);
    expect(Math.hypot(slow.x - fast.x, slow.z - fast.z)).toBeLessThan(0.2);
  });
});
