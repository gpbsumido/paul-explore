import { describe, it, expect } from "vitest";
import {
  streetcarAt,
  STREETCAR_STOPS,
  nearestStop,
  carIsAtStop,
  BOARD_RADIUS,
  RIDE_OFFSET,
  STREETCAR_SPEED,
  DWELL_SECONDS,
  ROUTE_CYCLE,
} from "../transit";
import { STREETCAR_ROUTE } from "../cityLayout";

describe("streetcarAt", () => {
  it("stays on the Queen St route", () => {
    for (const t of [0, 3, 17, 40, 99, 250]) {
      const car = streetcarAt(t);
      expect(car.x).toBeGreaterThanOrEqual(STREETCAR_ROUTE.minX - 1e-9);
      expect(car.x).toBeLessThanOrEqual(STREETCAR_ROUTE.maxX + 1e-9);
      expect(car.z).toBe(STREETCAR_ROUTE.z);
    }
  });

  it("is deterministic — the same time is the same place", () => {
    expect(streetcarAt(42)).toEqual(streetcarAt(42));
  });

  it("travels at the route speed between stops", () => {
    // The run out of the west terminus, before the first stop.
    const a = streetcarAt(0.2);
    const b = streetcarAt(0.7);
    expect(Math.abs(b.x - a.x)).toBeCloseTo(STREETCAR_SPEED * 0.5, 1);
  });

  it("turns around instead of leaving the map", () => {
    expect(streetcarAt(ROUTE_CYCLE * 0.25).direction).toBe(1);
    expect(streetcarAt(ROUTE_CYCLE * 0.75).direction).toBe(-1);
  });

  it("loops forever without drifting off the rails", () => {
    const far = streetcarAt(100_000);
    expect(far.x).toBeGreaterThanOrEqual(STREETCAR_ROUTE.minX - 1e-9);
    expect(far.x).toBeLessThanOrEqual(STREETCAR_ROUTE.maxX + 1e-9);
  });

  it("pauses at every stop long enough to board", () => {
    for (const stop of STREETCAR_STOPS) {
      // Sample a full cycle and count how long the car sits within reach.
      const dwellTime = Array.from({ length: Math.ceil(ROUTE_CYCLE * 10) }, (_, i) => i / 10)
        .map((t) => streetcarAt(t))
        .filter((car) => car.dwelling && carIsAtStop(car, stop)).length / 10;
      expect(dwellTime, `${stop.name} has no dwell`).toBeGreaterThanOrEqual(DWELL_SECONDS);
    }
  });

  it("reports dwelling only while actually stopped", () => {
    const moving = streetcarAt(0.5);
    expect(moving.dwelling).toBe(false);
  });

  it("arrives at the first stop and stops there", () => {
    // The west terminus is at -72 and the first stop at -60, so it pulls in
    // 12 units later.
    const arrivalSeconds = 12 / STREETCAR_SPEED;
    const justIn = streetcarAt(arrivalSeconds + 0.1);
    expect(justIn.x).toBeCloseTo(STREETCAR_STOPS[0].x);
    expect(justIn.dwelling).toBe(true);
    expect(streetcarAt(arrivalSeconds - 0.1).dwelling).toBe(false);
  });

  it("stays put for a few seconds at each stop", () => {
    const arrivalSeconds = 12 / STREETCAR_SPEED;
    const early = streetcarAt(arrivalSeconds + 0.2);
    const late = streetcarAt(arrivalSeconds + 3);
    expect(late.dwelling).toBe(true);
    expect(late.x).toBeCloseTo(early.x);
  });

  it("runs the clock backwards the same way it runs forwards", () => {
    expect(streetcarAt(-5)).toEqual(streetcarAt(ROUTE_CYCLE - 5));
  });
});

describe("stops", () => {
  it("names real Queen St corners", () => {
    const names = STREETCAR_STOPS.map((s) => s.name);
    expect(names).toContain("Queen & Yonge");
    expect(names).toContain("Queen & Spadina");
  });

  it("puts every stop on the route", () => {
    for (const stop of STREETCAR_STOPS) {
      expect(stop.x).toBeGreaterThan(STREETCAR_ROUTE.minX);
      expect(stop.x).toBeLessThan(STREETCAR_ROUTE.maxX);
    }
  });

  it("finds the stop you're standing at", () => {
    const stop = STREETCAR_STOPS[1];
    expect(nearestStop({ x: stop.x, z: STREETCAR_ROUTE.z + 2 })).toBe(stop);
  });

  it("finds a stop from the edge of boarding range but not from beyond it", () => {
    const stop = STREETCAR_STOPS[2];
    const z = STREETCAR_ROUTE.z;
    expect(nearestStop({ x: stop.x + BOARD_RADIUS * 0.9, z })).toBe(stop);
    expect(nearestStop({ x: stop.x + BOARD_RADIUS * 1.5, z })).toBeNull();
  });

  it("only counts the car as at a stop when it is within boarding range", () => {
    const stop = STREETCAR_STOPS[0];
    const car = { x: stop.x, z: STREETCAR_ROUTE.z, direction: 1, dwelling: true } as const;
    expect(carIsAtStop(car, stop)).toBe(true);
    expect(carIsAtStop({ ...car, x: stop.x + BOARD_RADIUS * 3 }, stop)).toBe(false);
  });

  it("finds nothing when you're nowhere near the tracks", () => {
    expect(nearestStop({ x: 0, z: -70 })).toBeNull();
    expect(
      nearestStop({ x: STREETCAR_STOPS[0].x, z: STREETCAR_ROUTE.z + BOARD_RADIUS * 3 }),
    ).toBeNull();
  });
});

describe("riding", () => {
  it("seats the rider beside the tracks, not inside the car", () => {
    expect(Math.abs(RIDE_OFFSET)).toBeGreaterThan(0.5);
  });
});
