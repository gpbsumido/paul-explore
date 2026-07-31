import { describe, it, expect } from "vitest";
import {
  isPermissionDenied,
  permissionDeniedReturnTo,
} from "@/lib/authCallback";

const BASE = "https://paulsumido.com";

describe("isPermissionDenied", () => {
  it("is true when a wrapping error's cause is access_denied", () => {
    // This is the real shape Auth0 hands onCallback: an AuthorizationError
    // whose cause is an OAuth2Error carrying the access_denied code.
    const error = {
      code: "authorization_error",
      cause: { code: "access_denied" },
    };
    expect(isPermissionDenied(error)).toBe(true);
  });

  it("is true when the top-level code is access_denied", () => {
    expect(isPermissionDenied({ code: "access_denied" })).toBe(true);
  });

  it("is false for other SDK errors", () => {
    expect(isPermissionDenied({ code: "discovery_error" })).toBe(false);
  });

  it("is false for null and non-objects", () => {
    expect(isPermissionDenied(null)).toBe(false);
    expect(isPermissionDenied("access_denied")).toBe(false);
  });
});

describe("permissionDeniedReturnTo", () => {
  it("sends the user back to their page with the toast flag", () => {
    expect(permissionDeniedReturnTo("/calendar", BASE)).toBe(
      "https://paulsumido.com/calendar?authError=permissions",
    );
  });

  it("falls back to the root when there is no returnTo", () => {
    expect(permissionDeniedReturnTo(undefined, BASE)).toBe(
      "https://paulsumido.com/?authError=permissions",
    );
  });

  it("preserves an existing query string on the returnTo", () => {
    expect(permissionDeniedReturnTo("/calendar?tab=week", BASE)).toBe(
      "https://paulsumido.com/calendar?tab=week&authError=permissions",
    );
  });
});
