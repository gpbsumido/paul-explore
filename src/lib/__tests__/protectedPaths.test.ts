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

  it.each([
    "/to-do",
    "/interviewee",
    "/zeroproof/admin",
    "/zeroproof/admin/leagues",
    "/check-in/sites",
    "/check-in/display",
  ])("keeps %s behind a login", (path) => {
    expect(isSessionProtectedPath(path)).toBe(true);
  });

  it("leaves the public front doors of gated areas open", () => {
    // A volunteer arriving from a poster link should see what the page is for,
    // not a redirect they can't place.
    expect(isSessionProtectedPath("/check-in")).toBe(false);
    expect(isSessionProtectedPath("/zeroproof")).toBe(false);
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
