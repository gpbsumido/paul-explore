import { describe, it, expect } from "vitest";
import { VISITOR_COOKIE, VISITOR_COOKIE_MAX_AGE, newVisitorId } from "./visitor";

describe("visitor identity", () => {
  it("names the first-party cookie", () => {
    expect(VISITOR_COOKIE).toBe("visitor_id");
  });

  it("keeps the cookie for a year so a visitor's rollout bucket stays stable", () => {
    expect(VISITOR_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 365);
  });

  it("mints a fresh, non-empty id each time", () => {
    const a = newVisitorId();
    const b = newVisitorId();
    expect(a).not.toHaveLength(0);
    expect(a).not.toBe(b);
  });
});
