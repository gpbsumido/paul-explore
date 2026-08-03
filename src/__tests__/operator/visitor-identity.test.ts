import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { cookies } from "next/headers";
import {
  VISITOR_COOKIE,
  VISITOR_HEADER,
  newVisitorId,
  readVisitorId,
} from "@/lib/operator-visitor";

beforeEach(() => vi.clearAllMocks());

describe("newVisitorId", () => {
  it("is opaque and carries nothing about the person", () => {
    const id = newVisitorId();
    // No name, no IP, no fingerprint: a random value the server issues.
    expect(id).toMatch(/^v_[a-f0-9]{24}$/);
  });

  it("is different every time", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newVisitorId()));
    expect(ids.size).toBe(50);
  });

  it("fits the bound the API enforces on the header", () => {
    // The API rejects anything over 64 chars or outside [A-Za-z0-9_-].
    const id = newVisitorId();
    expect(id.length).toBeLessThanOrEqual(64);
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("readVisitorId", () => {
  it("returns the cookie the middleware set", async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) =>
        name === VISITOR_COOKIE ? { value: "v_abc123" } : undefined,
    } as never);

    expect(await readVisitorId()).toBe("v_abc123");
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
