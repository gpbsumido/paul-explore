import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isSessionProtectedPath } from "@/lib/protectedPaths";
import TodoPage from "@/app/to-do/page";
import TodoContent from "@/app/to-do/TodoContent";
import { auth0 } from "@/lib/auth0";

vi.mock("@/lib/auth0", () => ({ auth0: { getSession: vi.fn() } }));
// The list itself is not under test here, only whether it gets rendered.
vi.mock("@/app/to-do/TodoContent", () => ({ default: () => null }));

/**
 * The /to-do page lists what has not been fixed yet across my projects, so who
 * can see it is the whole feature. The page 404s a signed-in non-admin rather
 * than 403ing, and the proxy sends a signed-out visitor to login first.
 */
const OWNER = "owner@example.com";

type Session = Awaited<ReturnType<typeof auth0.getSession>>;

// Only the user claims matter to the page; the token set is not read here.
const signedInAs = (user: { email?: string; email_verified?: boolean } | null) =>
  vi.mocked(auth0.getSession).mockResolvedValue(user ? ({ user } as Session) : null);

beforeEach(() => {
  vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", OWNER);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(auth0.getSession).mockReset();
});

describe("/to-do route gating", () => {
  it("is session protected, so signing out redirects to login rather than 404", () => {
    expect(isSessionProtectedPath("/to-do")).toBe(true);
    expect(isSessionProtectedPath("/to-do/anything")).toBe(true);
  });
});

describe("/to-do page", () => {
  it("shows the list to the owner's verified address", async () => {
    signedInAs({ email: OWNER, email_verified: true });

    const page = await TodoPage();

    expect(page.type).toBe(TodoContent);
  });

  it("404s a signed-in visitor who is not on the list", async () => {
    signedInAs({ email: "someone@else.com", email_verified: true });

    await expect(TodoPage()).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });

  it("404s the owner's address when the provider has not verified it", async () => {
    signedInAs({ email: OWNER, email_verified: false });

    await expect(TodoPage()).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });

  it("404s the owner's address when the verified flag is missing altogether", async () => {
    signedInAs({ email: OWNER });

    await expect(TodoPage()).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });

  it("404s everyone when the allowlist is unset, rather than opening up", async () => {
    vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "");
    signedInAs({ email: OWNER, email_verified: true });

    await expect(TodoPage()).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });

  it("404s everyone when the allowlist variable isn't set at all", async () => {
    vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", undefined);
    signedInAs({ email: OWNER, email_verified: true });

    await expect(TodoPage()).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });

  it("404s when there is no session at all", async () => {
    signedInAs(null);

    await expect(TodoPage()).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });
});
