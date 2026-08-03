import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { cookies } from "next/headers";
import { VISITOR_HEADER, readVisitorId } from "@/lib/operator-visitor";
import { VISITOR_COOKIE, newVisitorId } from "@/lib/visitor";

beforeEach(() => vi.clearAllMocks());

describe("the visitor id the operator routes forward", () => {
  it("is the app-wide cookie, not a second one minted for operator", () => {
    // One browser, one id. A separate operator cookie would have meant two
    // lifetimes to keep in step for no gain, since this one is already stable
    // and already minted on first contact by the proxy.
    expect(VISITOR_COOKIE).toBe("visitor_id");
  });

  it("is opaque and carries nothing about the person", () => {
    expect(newVisitorId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("fits the bound the API enforces on the header", () => {
    // The API rejects anything over 64 chars or outside [A-Za-z0-9_-].
    const id = newVisitorId();
    expect(id.length).toBeLessThanOrEqual(64);
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("readVisitorId", () => {
  it("returns the cookie the proxy set", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) =>
        name === VISITOR_COOKIE ? { value: "abc-123" } : undefined,
    } as never);

    expect(await readVisitorId()).toBe("abc-123");
  });

  it("returns null rather than throwing outside a request", async () => {
    // Unit tests and any non-request caller should not need a Next mock.
    vi.mocked(cookies).mockRejectedValue(new Error("no request scope"));
    expect(await readVisitorId()).toBeNull();
  });

  it("returns null when no cookie has been issued yet", async () => {
    vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as never);
    expect(await readVisitorId()).toBeNull();
  });
});

describe("the header contract", () => {
  it("matches the name the API reads", () => {
    // Both sides hardcode this string; if one drifts the visitor silently falls
    // back to the shared bucket, which is exactly the bug this replaced.
    expect(VISITOR_HEADER).toBe("x-operator-visitor");
  });
});
