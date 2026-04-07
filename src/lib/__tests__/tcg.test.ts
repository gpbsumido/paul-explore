import { describe, it, expect } from "vitest";
import { typeStyle, toPlain, DEFAULT_TYPE_COLOR, TYPE_COLORS } from "../tcg";

describe("typeStyle", () => {
  it("returns the correct class for a known type", () => {
    expect(typeStyle("Fire")).toBe(TYPE_COLORS["Fire"]);
  });

  it("returns the default color for an unknown type", () => {
    expect(typeStyle("Unknown")).toBe(DEFAULT_TYPE_COLOR);
  });

  it("returns the correct class for every defined type", () => {
    for (const [type, expected] of Object.entries(TYPE_COLORS)) {
      expect(typeStyle(type)).toBe(expected);
    }
  });

  it("is case-sensitive — lowercase type falls back to default", () => {
    expect(typeStyle("fire")).toBe(DEFAULT_TYPE_COLOR);
  });
});

describe("toPlain", () => {
  it("returns a plain object with the same data fields", () => {
    const input = { id: "base1-1", name: "Bulbasaur", hp: 70 };
    expect(toPlain(input)).toEqual(input);
  });

  it("strips keys named 'sdk'", () => {
    const input = {
      id: "xy1-1",
      name: "Pikachu",
      sdk: { someCircularRef: true },
    };
    const result = toPlain(input) as Record<string, unknown>;
    expect(result).not.toHaveProperty("sdk");
    expect(result.id).toBe("xy1-1");
  });

  it("strips keys named 'tcgdex'", () => {
    const input = { id: "sv1-1", name: "Sprigatito", tcgdex: {} };
    const result = toPlain(input) as Record<string, unknown>;
    expect(result).not.toHaveProperty("tcgdex");
  });

  it("preserves nested objects that don't contain sdk/tcgdex", () => {
    const input = {
      card: { id: "a1", attacks: [{ name: "Scratch", damage: 10 }] },
    };
    expect(toPlain(input)).toEqual(input);
  });

  it("handles arrays of objects", () => {
    const input = [{ id: "1" }, { id: "2" }];
    expect(toPlain(input)).toEqual(input);
  });
});
