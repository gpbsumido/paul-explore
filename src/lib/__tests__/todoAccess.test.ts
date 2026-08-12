import { describe, it, expect } from "vitest";
import { isAllowedEmail } from "@/lib/emailAllowlist";
import { isSessionProtectedPath } from "@/lib/protectedPaths";

/**
 * The /to-do page lists what has not been fixed yet across my projects, so who
 * can see it is the whole feature. The page 404s a signed-in non-admin rather
 * than 403ing, and the proxy sends a signed-out visitor to login first.
 */
const OWNER = "owner@example.com";

describe("/to-do route gating", () => {
  it("is session protected, so signing out redirects to login rather than 404", () => {
    expect(isSessionProtectedPath("/to-do")).toBe(true);
  });

  it("protects nested paths under it too", () => {
    expect(isSessionProtectedPath("/to-do/anything")).toBe(true);
  });

  it("leaves the public pages alone", () => {
    expect(isSessionProtectedPath("/vitals")).toBe(false);
    expect(isSessionProtectedPath("/thoughts/security")).toBe(false);
  });
});

describe("/to-do admin check", () => {
  it("admits the owner's verified address", () => {
    expect(
      isAllowedEmail({ email: OWNER, emailVerified: true, allowlist: OWNER }),
    ).toBe(true);
  });

  it("refuses a signed-in visitor who is not on the list", () => {
    expect(
      isAllowedEmail({
        email: "someone@else.com",
        emailVerified: true,
        allowlist: OWNER,
      }),
    ).toBe(false);
  });

  it("refuses the owner's address when the provider has not verified it", () => {
    expect(
      isAllowedEmail({ email: OWNER, emailVerified: false, allowlist: OWNER }),
    ).toBe(false);
  });

  it("admits nobody when the allowlist is unset", () => {
    expect(
      isAllowedEmail({ email: OWNER, emailVerified: true, allowlist: undefined }),
    ).toBe(false);
  });

  it("admits nobody when there is no session email at all", () => {
    expect(
      isAllowedEmail({ email: undefined, emailVerified: true, allowlist: OWNER }),
    ).toBe(false);
  });
});
