import { describe, it, expect } from "vitest";
import {
  SESSION_IDLE_SECONDS,
  SESSION_ABSOLUTE_SECONDS,
  sessionConfig,
  isSessionTimeout,
} from "@/lib/authSession";

describe("auth session lifetime", () => {
  it("times out after six hours of inactivity", () => {
    expect(SESSION_IDLE_SECONDS).toBe(6 * 60 * 60);
  });

  it("rolls the idle window on activity, up to a longer absolute ceiling", () => {
    // rolling + inactivity < absolute means each request pushes expiry to
    // now + 6h, so doing things keeps you signed in; the absolute is just an
    // upper bound so a session can't live forever.
    expect(sessionConfig.rolling).toBe(true);
    expect(sessionConfig.inactivityDuration).toBe(SESSION_IDLE_SECONDS);
    expect(sessionConfig.absoluteDuration).toBe(SESSION_ABSOLUTE_SECONDS);
    expect(SESSION_ABSOLUTE_SECONDS).toBeGreaterThan(SESSION_IDLE_SECONDS);
  });
});

describe("isSessionTimeout", () => {
  it("is true when the session is gone but the marker says there was one", () => {
    expect(isSessionTimeout(false, "1")).toBe(true);
  });

  it("is false while a session is still live", () => {
    expect(isSessionTimeout(true, "1")).toBe(false);
  });

  it("is false for someone who was never logged in", () => {
    expect(isSessionTimeout(false, undefined)).toBe(false);
  });
});
