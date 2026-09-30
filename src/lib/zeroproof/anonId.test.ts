import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAnonId, getSessionId, sha256Hex } from "./anonId";

function clearConsent() {
  document.cookie = "cookie_consent=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  clearConsent();
});
afterEach(clearConsent);

describe("sha256Hex", () => {
  it("matches the known digest for the empty string", async () => {
    expect(await sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });
});

describe("getAnonId", () => {
  it("is null until the visitor accepts the functional-cookie consent", async () => {
    expect(await getAnonId()).toBeNull();
  });

  it("returns a stable 64-char hex hash once consent is accepted", async () => {
    document.cookie = "cookie_consent=accepted; path=/";

    const first = await getAnonId();
    const second = await getAnonId();

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(second).toBe(first);
  });
});

describe("getSessionId", () => {
  it("mints one id per tab and reuses it", () => {
    const a = getSessionId();
    expect(getSessionId()).toBe(a);
    expect(a).toMatch(/[0-9a-f-]{36}/);
  });
});
