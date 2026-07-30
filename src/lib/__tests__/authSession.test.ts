import { describe, it, expect } from "vitest";
import { SESSION_DURATION_SECONDS, sessionConfig } from "@/lib/authSession";

describe("auth session lifetime", () => {
  it("expires six hours after login", () => {
    expect(SESSION_DURATION_SECONDS).toBe(6 * 60 * 60);
  });

  it("caps both the absolute and inactivity windows at six hours", () => {
    // rolling + inactivity == absolute means the cookie always expires at
    // login + 6h, whether or not the user stays active, so returning after
    // six hours always lands them logged out.
    expect(sessionConfig.rolling).toBe(true);
    expect(sessionConfig.absoluteDuration).toBe(SESSION_DURATION_SECONDS);
    expect(sessionConfig.inactivityDuration).toBe(SESSION_DURATION_SECONDS);
  });
});
