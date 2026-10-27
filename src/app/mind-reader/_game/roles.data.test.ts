import { describe, expect, it } from "vitest";
import { CATEGORIES, ROLES } from "./roles.data";

describe("the Mind Reader deck", () => {
  it("has more than 200 roles to deal", () => {
    expect(ROLES.length).toBeGreaterThan(200);
  });

  it("never repeats a role's id or wording", () => {
    const ids = new Set(ROLES.map((r) => r.id));
    const texts = new Set(ROLES.map((r) => r.text.toLowerCase()));
    expect(ids.size).toBe(ROLES.length);
    expect(texts.size).toBe(ROLES.length);
  });

  it("gives every role a known category and a sentence player A can say", () => {
    for (const role of ROLES) {
      expect(CATEGORIES.map((c) => c.id)).toContain(role.category);
      expect(role.text.startsWith("I am ")).toBe(true);
    }
  });

  it("fills every category with at least ten roles so filtering stays playable", () => {
    for (const { id } of CATEGORIES) {
      expect(ROLES.filter((r) => r.category === id).length).toBeGreaterThanOrEqual(10);
    }
  });
});
