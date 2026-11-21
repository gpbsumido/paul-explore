import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { WaveSim } from "./waveSim";

// jsdom has no ImageData. The sim only needs a pixel array of the right size.
beforeAll(() => {
  vi.stubGlobal(
    "ImageData",
    class {
      data: Uint8ClampedArray;
      constructor(
        public width: number,
        public height: number,
      ) {
        this.data = new Uint8ClampedArray(width * height * 4);
      }
    },
  );
});
afterAll(() => vi.unstubAllGlobals());

/** Height at a cell of the current frame. */
const at = (sim: WaveSim, x: number, y: number) => sim.buf1[y * sim.simW + x];
const totalEnergy = (sim: WaveSim) =>
  sim.buf1.reduce((sum, h) => sum + Math.abs(h), 0);

describe("WaveSim sizing", () => {
  it("runs at one over the scale of the canvas, and never smaller than 2 by 2", () => {
    const sim = new WaveSim(30, 60, { scale: 3 });
    expect([sim.simW, sim.simH]).toEqual([10, 20]);
    expect(sim.buf1).toHaveLength(200);

    const tiny = new WaveSim(1, 1, { scale: 3 });
    expect([tiny.simW, tiny.simH]).toEqual([2, 2]);
  });

  it("clears every wave and takes the new size when resized", () => {
    const sim = new WaveSim(30, 30, { scale: 3, disturbRadius: 2 });
    sim.disturb(5, 5, 100);
    sim.resize(60, 30);
    expect([sim.simW, sim.simH]).toEqual([20, 10]);
    expect(sim.buf1).toHaveLength(200);
    expect(totalEnergy(sim)).toBe(0);
  });
});

describe("WaveSim.disturb", () => {
  it("lifts the centre by the full strength, tapering to nothing at the radius", () => {
    const sim = new WaveSim(33, 33, { scale: 3, disturbRadius: 2 });
    sim.disturb(5, 5, 100);
    expect(at(sim, 5, 5)).toBe(100);
    expect(at(sim, 6, 5)).toBe(75);
    expect(at(sim, 7, 5)).toBe(0);
    expect(at(sim, 8, 5)).toBe(0);
    // The corner of the bounding square is outside the circle.
    expect(at(sim, 7, 7)).toBe(0);
  });

  it("leaves the border cells and anything off the grid alone", () => {
    const sim = new WaveSim(33, 33, { scale: 3, disturbRadius: 2 });
    sim.disturb(0, 0, 100);
    sim.disturb(-10, -10, 100);
    sim.disturb(500, 500, 100);
    expect(at(sim, 0, 0)).toBe(0);
    expect(at(sim, 1, 1)).toBeGreaterThan(0);
    for (let x = 0; x < sim.simW; x++) {
      expect(at(sim, x, 0)).toBe(0);
      expect(at(sim, x, sim.simH - 1)).toBe(0);
    }
  });
});

describe("WaveSim.propagate", () => {
  it("passes a bump out to its four neighbours, which then lead the centre", () => {
    const sim = new WaveSim(15, 15, { scale: 3, disturbRadius: 1 });
    sim.disturb(2, 2, 100);
    expect(at(sim, 2, 2)).toBe(100);

    sim.propagate();

    // Each neighbour gets half the bump (50), less 1/32 damping (50 >> 5 = 1).
    for (const [x, y] of [
      [1, 2],
      [3, 2],
      [2, 1],
      [2, 3],
    ]) {
      expect(at(sim, x, y)).toBe(49);
    }
    expect(at(sim, 2, 2)).toBe(0);
    expect(at(sim, 1, 1)).toBe(0);
  });

  it("settles back to flat water as the damping takes its toll", () => {
    const sim = new WaveSim(60, 60, { scale: 3, disturbRadius: 3 });
    sim.disturb(10, 10, 2400);
    const start = totalEnergy(sim);
    for (let step = 0; step < 400; step++) sim.propagate();
    expect(totalEnergy(sim)).toBeLessThan(start * 0.05);
  });

  it("settles faster the smaller the damping shift", () => {
    const run = (dampingShift: number) => {
      const sim = new WaveSim(60, 60, { scale: 3, disturbRadius: 3, dampingShift });
      sim.disturb(10, 10, 2400);
      for (let step = 0; step < 40; step++) sim.propagate();
      return totalEnergy(sim);
    };
    expect(run(2)).toBeLessThan(run(6));
  });
});
