import { describe, it, expect } from "vitest";
import { isSessionTimeout, isLogoutPath } from "@/lib/authSession";

describe("isLogoutPath", () => {
  it("recognises the SDK's logout route", () => {
    expect(isLogoutPath("/auth/logout")).toBe(true);
  });

  it("ignores the other auth routes, which must keep the marker", () => {
    // Login and callback both end with a session; clearing the marker there
    // would be harmless but pointless, and clearing it on callback would
    // undo the one that markSessionActive just set.
    expect(isLogoutPath("/auth/login")).toBe(false);
    expect(isLogoutPath("/auth/callback")).toBe(false);
    expect(isLogoutPath("/auth/profile")).toBe(false);
  });

  it("is not fooled by a path that merely contains the word", () => {
    expect(isLogoutPath("/thoughts/logout-redirect")).toBe(false);
    expect(isLogoutPath("/auth/logout-everywhere")).toBe(false);
  });
});

describe("isSessionTimeout", () => {
  it("is a timeout when the session is gone but the marker lingers", () => {
    expect(isSessionTimeout(false, "1")).toBe(true);
  });

  it("is not a timeout for someone who was never signed in", () => {
    expect(isSessionTimeout(false, undefined)).toBe(false);
  });

  it("is not a timeout while the session is still alive", () => {
    expect(isSessionTimeout(true, "1")).toBe(false);
  });

  it("is not a timeout once a deliberate logout has cleared the marker", () => {
    // This is the whole point of clearing it on the way out: a logout and a
    // timeout look identical afterwards unless the marker goes with the
    // session, and the user gets told their session expired when they chose
    // to leave.
    expect(isSessionTimeout(false, "")).toBe(false);
  });
});
