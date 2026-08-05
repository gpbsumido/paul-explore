import { describe, it, expect } from "vitest";
import { isSessionProtectedPath } from "@/lib/protectedPaths";

/**
 * The proxy redirects unauthenticated requests to these routes to login.
 * Web Vitals is deliberately NOT one of them: the dashboard is site-wide,
 * non-personal aggregate data and is public.
 */
describe("isSessionProtectedPath", () => {
  it("keeps /settings behind a login", () => {
    expect(isSessionProtectedPath("/settings")).toBe(true);
    expect(isSessionProtectedPath("/settings/anything")).toBe(true);
  });

  it("keeps /calendar behind a login", () => {
    expect(isSessionProtectedPath("/calendar")).toBe(true);
    expect(isSessionProtectedPath("/calendar/events/123")).toBe(true);
  });

  it("does NOT gate /vitals — Web Vitals is public", () => {
    expect(isSessionProtectedPath("/vitals")).toBe(false);
    expect(isSessionProtectedPath("/vitals?v=major:1")).toBe(false);
  });

  it("does not gate ordinary public routes", () => {
    expect(isSessionProtectedPath("/")).toBe(false);
    expect(isSessionProtectedPath("/thoughts")).toBe(false);
  });
});
