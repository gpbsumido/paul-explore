import { describe, it, expect } from "vitest";
import { directionFromKeys } from "../input";

const keys = (...codes: string[]) => new Set(codes);

describe("directionFromKeys", () => {
  it("returns no movement when nothing is pressed", () => {
    expect(directionFromKeys(keys())).toEqual({ x: 0, z: 0, running: false });
  });

  it("maps WASD to camera-space directions", () => {
    expect(directionFromKeys(keys("KeyW"))).toEqual({ x: 0, z: -1, running: false });
    expect(directionFromKeys(keys("KeyS"))).toEqual({ x: 0, z: 1, running: false });
    expect(directionFromKeys(keys("KeyA"))).toEqual({ x: -1, z: 0, running: false });
    expect(directionFromKeys(keys("KeyD"))).toEqual({ x: 1, z: 0, running: false });
  });

  it("maps arrow keys the same as WASD", () => {
    expect(directionFromKeys(keys("ArrowUp"))).toEqual(directionFromKeys(keys("KeyW")));
    expect(directionFromKeys(keys("ArrowDown"))).toEqual(directionFromKeys(keys("KeyS")));
    expect(directionFromKeys(keys("ArrowLeft"))).toEqual(directionFromKeys(keys("KeyA")));
    expect(directionFromKeys(keys("ArrowRight"))).toEqual(directionFromKeys(keys("KeyD")));
  });

  it("normalizes diagonals so they are not faster than straight lines", () => {
    const diagonal = directionFromKeys(keys("KeyW", "KeyD"));
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(1);
    expect(diagonal.x).toBeGreaterThan(0);
    expect(diagonal.z).toBeLessThan(0);
  });

  it("cancels opposing keys", () => {
    expect(directionFromKeys(keys("KeyW", "KeyS"))).toEqual({ x: 0, z: 0, running: false });
    expect(directionFromKeys(keys("KeyA", "KeyD", "KeyW"))).toEqual({ x: 0, z: -1, running: false });
  });

  it("flags running while shift is held", () => {
    expect(directionFromKeys(keys("KeyW", "ShiftLeft")).running).toBe(true);
    expect(directionFromKeys(keys("KeyW", "ShiftRight")).running).toBe(true);
    expect(directionFromKeys(keys("KeyW")).running).toBe(false);
  });

  it("ignores unrelated keys", () => {
    expect(directionFromKeys(keys("KeyQ", "Space", "Enter"))).toEqual({
      x: 0,
      z: 0,
      running: false,
    });
  });
});
