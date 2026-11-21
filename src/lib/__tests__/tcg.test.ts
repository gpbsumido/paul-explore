import { describe, it, expect } from "vitest";
import { typeStyle, toPlain, DEFAULT_TYPE_COLOR, POKEMON_TYPES } from "../tcg";

describe("typeStyle", () => {
  it("gives a known type its own colour rather than the default", () => {
    expect(typeStyle("Fire")).not.toBe(DEFAULT_TYPE_COLOR);
  });

  it("returns the default color for an unknown type", () => {
    expect(typeStyle("Unknown")).toBe(DEFAULT_TYPE_COLOR);
  });

  it("colours every type in the filter list, each differently", () => {
    const styles = POKEMON_TYPES.map((type) => typeStyle(type));
    expect(styles).not.toContain(DEFAULT_TYPE_COLOR);
    expect(new Set(styles).size).toBe(POKEMON_TYPES.length);
  });

  // Known bug: TYPE_COLORS is a plain object, so a name that exists on Object.prototype
  // finds a function there instead of falling back. Not reachable with real
  // TCG types today; recorded as a finding.
  it.fails("falls back to the default colour for a type named like an object method", () => {
    expect(typeStyle("constructor")).toBe(DEFAULT_TYPE_COLOR);
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

  it("strips the circular references from nested models and list items too", () => {
    const sdk: Record<string, unknown> = {};
    sdk.self = sdk;
    const input = {
      set: { name: "Base", sdk },
      cards: [{ id: "1", tcgdex: sdk }, { id: "2", sdk }],
    };
    expect(toPlain(input)).toEqual({
      set: { name: "Base" },
      cards: [{ id: "1" }, { id: "2" }],
    });
  });

  it("handles arrays of objects", () => {
    const input = [{ id: "1" }, { id: "2" }];
    expect(toPlain(input)).toEqual(input);
  });
});
