import { describe, it, expect } from "vitest";
import {
  accessOf,
  canChangeFlag,
  ACCESS_TIERS,
  ACCESS_LABEL,
  whoCanChange,
  lockReason,
  emptyTierNote,
} from "./flags-access";

const flag = (over: { key?: string; real?: boolean; access?: string } = {}) =>
  ({ real: false, ...over }) as Parameters<typeof accessOf>[0];

describe("accessOf", () => {
  it("uses the tier the flag declares", () => {
    expect(accessOf(flag({ access: "open" }))).toBe("open");
    expect(accessOf(flag({ access: "authed" }))).toBe("authed");
    expect(accessOf(flag({ access: "admin" }))).toBe("admin");
  });

  it("treats a flag gating a live feature as admin when it declares no tier", () => {
    // A backend that predates this field must not hand a live kill switch to
    // everyone, so the unset case falls to the strictest reading of `real`.
    expect(accessOf(flag({ real: true }))).toBe("admin");
  });

  it("treats an undeclared demo flag as open", () => {
    expect(accessOf(flag({ real: false }))).toBe("open");
  });

  it("maps a known key even when the record carries no tier and no real bit", () => {
    // The upstream API sends neither, and serves a different flag set than the
    // seed does. Keying on what both sides always have is what stops the
    // console and the route disagreeing about who may write.
    expect(accessOf(flag({ key: "pocket-tcg" }))).toBe("admin");
    expect(accessOf(flag({ key: "new-checkout" }))).toBe("authed");
    expect(accessOf(flag({ key: "dark-mode" }))).toBe("open");
  });

  it("lets an explicit tier on the record beat the key map", () => {
    expect(accessOf(flag({ key: "dark-mode", access: "admin" }))).toBe("admin");
  });

  it("falls back to open for a key it has never heard of", () => {
    expect(accessOf(flag({ key: "brand-new-flag" }))).toBe("open");
  });
});

describe("canChangeFlag", () => {
  const cases: {
    access: "open" | "authed" | "admin";
    isLoggedIn: boolean;
    isAdmin: boolean;
    expected: boolean;
  }[] = [
    // Open: nobody is turned away.
    { access: "open", isLoggedIn: false, isAdmin: false, expected: true },
    { access: "open", isLoggedIn: true, isAdmin: false, expected: true },
    { access: "open", isLoggedIn: true, isAdmin: true, expected: true },
    // Authed: an account, nothing more.
    { access: "authed", isLoggedIn: false, isAdmin: false, expected: false },
    { access: "authed", isLoggedIn: true, isAdmin: false, expected: true },
    { access: "authed", isLoggedIn: true, isAdmin: true, expected: true },
    // Admin: the allowlist.
    { access: "admin", isLoggedIn: false, isAdmin: false, expected: false },
    { access: "admin", isLoggedIn: true, isAdmin: false, expected: false },
    { access: "admin", isLoggedIn: true, isAdmin: true, expected: true },
  ];

  for (const { access, isLoggedIn, isAdmin, expected } of cases) {
    it(`${access} + ${isLoggedIn ? "signed in" : "signed out"}${isAdmin ? " admin" : ""} => ${expected}`, () => {
      expect(canChangeFlag({ access, isLoggedIn, isAdmin })).toBe(expected);
    });
  }

  it("never lets an admin flag through on the admin bit alone", () => {
    // isAdmin without a session is a contradiction, and treating it as enough
    // would make the session check decorative.
    expect(
      canChangeFlag({ access: "admin", isLoggedIn: false, isAdmin: true }),
    ).toBe(false);
  });
});

describe("copy", () => {
  it("names every tier", () => {
    expect(ACCESS_TIERS).toEqual(["open", "authed", "admin"]);
    for (const tier of ACCESS_TIERS) {
      expect(ACCESS_LABEL[tier].length).toBeGreaterThan(0);
      expect(whoCanChange(tier).length).toBeGreaterThan(0);
    }
  });

  it("explains the lock differently depending on what is missing", () => {
    const signedOut = lockReason("authed", { isLoggedIn: false, isAdmin: false });
    const notAdmin = lockReason("admin", { isLoggedIn: true, isAdmin: false });

    expect(signedOut).toMatch(/sign in/i);
    expect(notAdmin).not.toMatch(/sign in/i);
    expect(notAdmin).toMatch(/owner|admin/i);
  });

  it("explains an empty admin group instead of letting it vanish", () => {
    // A hidden group means the page shows two rungs while the strip promises
    // three, and this is the rung most in need of explaining.
    expect(emptyTierNote("admin")).toMatch(/tcg\/pocket|world/i);
    expect(emptyTierNote("admin").length).toBeGreaterThan(40);
  });

  it("has a note for every tier", () => {
    for (const tier of ACCESS_TIERS) {
      expect(emptyTierNote(tier).length).toBeGreaterThan(0);
    }
  });

  it("gives no lock reason when the flag is changeable", () => {
    expect(lockReason("open", { isLoggedIn: false, isAdmin: false })).toBeNull();
    expect(lockReason("admin", { isLoggedIn: true, isAdmin: true })).toBeNull();
  });
});

describe("accessOf fallback direction", () => {
  it("treats a flag the seed has never heard of as admin, not open", () => {
    // getFlag only searches the local seed while the API serves a wider set,
    // so an upstream-only key arrives with neither `access` nor `real` set.
    expect(accessOf({ key: "some-upstream-flag" })).toBe("admin");
  });

  it("treats a flag with no key at all as admin", () => {
    expect(accessOf({})).toBe("admin");
  });

  it("still opens a flag positively known to be a demo", () => {
    expect(accessOf({ key: "some-upstream-flag", real: false })).toBe("open");
  });

  it("keeps honouring an explicit access from the API", () => {
    expect(accessOf({ key: "some-upstream-flag", access: "authed" })).toBe("authed");
  });
});
