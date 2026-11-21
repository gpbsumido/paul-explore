import { describe, it, expect } from "vitest";
import { centerStagger } from "./easing";

describe("centerStagger", () => {
  it("starts the middle element first and delays the others by how far they are from it", () => {
    const delays = [0, 1, 2, 3, 4].map((index) => centerStagger(index, 5, 50));

    expect(delays).toEqual([100, 50, 0, 50, 100]);
  });

  it("works outward from between the two middle elements when the count is even", () => {
    const delays = [0, 1, 2, 3].map((index) => centerStagger(index, 4, 40));

    expect(delays).toEqual([60, 20, 20, 60]);
  });

  it("does not delay a single element", () => {
    expect(centerStagger(0, 1, 80)).toBe(0);
  });

  it("scales with the step", () => {
    expect(centerStagger(0, 3, 0)).toBe(0);
    expect(centerStagger(0, 3, 25)).toBe(25);
  });
});
