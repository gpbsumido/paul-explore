import { describe, it, expect } from "vitest";
import { teamAccentColor } from "./teamAccent";

describe("teamAccentColor", () => {
  it("is deterministic — the same team always reads the same colour", () => {
    expect(teamAccentColor("Celtics")).toBe(teamAccentColor("Celtics"));
  });

  it("gives different teams different hues", () => {
    expect(teamAccentColor("Celtics")).not.toBe(teamAccentColor("Lakers"));
  });

  it("stays in the app's tone band — an hsl() string, no raw hex", () => {
    const color = teamAccentColor("Thunder");
    expect(color).toMatch(/^hsl\(\d{1,3} \d{1,2}% \d{1,2}%\)$/);
    expect(color).not.toContain("#");
    const [, , , l] = color.match(/^hsl\((\d+) (\d+)% (\d+)%\)$/) ?? [];
    expect(Number(l)).toBeGreaterThanOrEqual(33);
    expect(Number(l)).toBeLessThanOrEqual(62);
  });

  it("handles an empty name without throwing", () => {
    expect(() => teamAccentColor("")).not.toThrow();
  });
});
