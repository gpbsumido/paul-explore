import { describe, it, expect, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { readBest, recordBest, usePersonalBest } from "./personalBest";

afterEach(() => {
  window.localStorage.clear();
});

describe("personal bests", () => {
  it("forgets bests set on the first phantom, whose anatomy has since changed", () => {
    window.localStorage.setItem("evar-best:medium:long-neck", "400");
    window.localStorage.setItem("evar-best:hard:giant-sac", "820");
    expect(readBest("medium", "long-neck")).toBeNull();
    expect(window.localStorage.getItem("evar-best:medium:long-neck")).toBeNull();
    expect(window.localStorage.getItem("evar-best:hard:giant-sac")).toBeNull();
  });

  it("has nothing before the first finish", () => {
    expect(readBest("medium", "long-neck")).toBeNull();
  });

  it("keeps the highest score for a level and case", () => {
    recordBest("medium", "long-neck", 400);
    recordBest("medium", "long-neck", 250);
    expect(readBest("medium", "long-neck")).toBe(400);
    recordBest("medium", "long-neck", 610);
    expect(readBest("medium", "long-neck")).toBe(610);
  });

  it("keeps each level and case separately", () => {
    recordBest("medium", "long-neck", 400);
    expect(readBest("easy", "long-neck")).toBeNull();
    expect(readBest("medium", "short-neck")).toBeNull();
  });

  it("treats garbage in storage as no best, and writes over it", () => {
    window.localStorage.setItem("evar-best:medium:long-neck", "not a number");
    expect(readBest("medium", "long-neck")).toBeNull();
    recordBest("medium", "long-neck", 120);
    expect(readBest("medium", "long-neck")).toBe(120);
  });

  it("re-renders a reader when a new best is recorded", () => {
    const { result } = renderHook(() => usePersonalBest("hard", "hostile-neck"));
    expect(result.current).toBeNull();
    act(() => recordBest("hard", "hostile-neck", 900));
    expect(result.current).toBe(900);
  });
});
