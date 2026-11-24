import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

import { auth0 } from "@/lib/auth0";
import { GET } from "./route";

type Session = Awaited<ReturnType<typeof auth0.getSession>>;

const signedInAs = (user: Record<string, unknown>) =>
  vi.mocked(auth0.getSession).mockResolvedValue({ user } as Session);

beforeEach(() => {
  vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "admin@example.com");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("GET /api/me", () => {
  it("answers 200 with empty fields, not a 401, when nobody is signed in", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ name: null, email: null, sub: null, isFlagAdmin: false });
  });

  it("returns the signed-in user's name, email and subject", async () => {
    signedInAs({ name: "Paul", email: "someone@example.com", sub: "auth0|1", email_verified: true });

    const body = await (await GET()).json();

    expect(body).toMatchObject({ name: "Paul", email: "someone@example.com", sub: "auth0|1" });
  });

  it("turns a missing name, email or subject into null rather than leaving it out", async () => {
    signedInAs({});

    const body = await (await GET()).json();

    expect(body).toEqual({ name: null, email: null, sub: null, isFlagAdmin: false });
  });

  it("marks a verified address on the allowlist as a flag admin", async () => {
    signedInAs({ email: "admin@example.com", email_verified: true, sub: "auth0|3" });

    expect((await (await GET()).json()).isFlagAdmin).toBe(true);
  });

  it("does not trust an allowlisted address the provider has not verified", async () => {
    signedInAs({ email: "admin@example.com", email_verified: false, sub: "auth0|4" });

    expect((await (await GET()).json()).isFlagAdmin).toBe(false);
  });

  it("does not mark a verified address that is not on the allowlist", async () => {
    signedInAs({ email: "someone@example.com", email_verified: true, sub: "auth0|5" });

    expect((await (await GET()).json()).isFlagAdmin).toBe(false);
  });

  it("treats everyone as a non-admin when the allowlist is unset", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "");
    signedInAs({ email: "admin@example.com", email_verified: true, sub: "auth0|6" });

    expect((await (await GET()).json()).isFlagAdmin).toBe(false);
  });
});
