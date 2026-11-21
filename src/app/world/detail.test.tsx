import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { DetailContext, useDetail, useSegments } from "./detail";

const atFidelity = (fidelity: number) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <DetailContext.Provider value={fidelity}>{children}</DetailContext.Provider>;
  };

describe("useSegments", () => {
  it("gives chunky solids at the lowest fidelity and smooth ones at the highest", () => {
    const low = renderHook(() => useSegments(20), { wrapper: atFidelity(0) });
    const high = renderHook(() => useSegments(20), { wrapper: atFidelity(1) });

    expect(low.result.current).toBe(7);
    expect(high.result.current).toBe(35);
  });

  it("adds segments as fidelity rises", () => {
    const counts = [0, 0.25, 0.5, 0.75, 1].map(
      (fidelity) =>
        renderHook(() => useSegments(24), { wrapper: atFidelity(fidelity) }).result.current,
    );

    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    expect(new Set(counts).size).toBe(counts.length);
  });

  it("never drops below four segments, however small the base", () => {
    const { result } = renderHook(() => useSegments(1), { wrapper: atFidelity(0) });

    expect(result.current).toBe(4);
  });

  it("starts at a middling fidelity when nothing provides one", () => {
    const { result } = renderHook(() => useSegments(20));

    // 20 * (0.35 + 0.6 * 1.4) = 23.8
    expect(result.current).toBe(24);
  });
});

describe("useDetail", () => {
  it("passes the fidelity through untouched", () => {
    const { result } = renderHook(() => useDetail(), { wrapper: atFidelity(0.8) });

    expect(result.current).toBe(0.8);
  });
});
