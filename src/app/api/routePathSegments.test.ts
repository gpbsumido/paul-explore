import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

vi.mock("@/lib/upstream", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn(), getSession: vi.fn() },
}));

import { NextRequest } from "next/server";
import { fetchUpstream } from "@/lib/upstream";
import { auth0 } from "@/lib/auth0";

const request = (init?: { method: string; body: string }) => new NextRequest("http://localhost/api/x", init);
const params = <P,>(values: P) => ({ params: Promise.resolve(values) });
const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });

type Case = { name: string; run: () => Promise<Response> };

/**
 * Next decodes `%2e%2e` in a dynamic segment to `..` before the handler runs.
 * encodeURIComponent leaves `..` alone, and fetch() then resolves it, so
 * `/api/zeroproof/leagues/../join` goes out as `/api/zeroproof/join` with the
 * caller's token on it. Every id that ends up in an upstream path has to be
 * rejected before the request leaves.
 */
const CASES: Case[] = [
  {
    name: "GET walls/:id",
    run: async () => (await import("./walls/[id]/route")).GET(request(), params({ id: ".." })),
  },
  {
    name: "PUT walls/:id",
    run: async () =>
      (await import("./walls/[id]/route")).PUT(request(json("PUT", { name: "wall" })), params({ id: ".." })),
  },
  {
    name: "DELETE walls/:id",
    run: async () => (await import("./walls/[id]/route")).DELETE(request(), params({ id: ".." })),
  },
  {
    name: "GET zeroproof/leagues/:id",
    run: async () => (await import("./zeroproof/leagues/[id]/route")).GET(request(), params({ id: ".." })),
  },
  {
    name: "POST zeroproof/leagues/:id/join",
    run: async () =>
      (await import("./zeroproof/leagues/[id]/join/route")).POST(
        request(json("POST", { code: "ABC" })),
        params({ id: ".." }),
      ),
  },
  {
    name: "POST zeroproof/leagues/:id/espn-leagues",
    run: async () =>
      (await import("./zeroproof/leagues/[id]/espn-leagues/route")).POST(
        request(json("POST", { espnLeagueId: "1" })),
        params({ id: ".." }),
      ),
  },
  {
    name: "DELETE zeroproof/leagues/:id/espn-leagues/:espnId (league id)",
    run: async () =>
      (await import("./zeroproof/leagues/[id]/espn-leagues/[espnId]/route")).DELETE(
        request(),
        params({ id: "..", espnId: "1" }),
      ),
  },
  {
    name: "DELETE zeroproof/leagues/:id/espn-leagues/:espnId (espn id)",
    run: async () =>
      (await import("./zeroproof/leagues/[id]/espn-leagues/[espnId]/route")).DELETE(
        request(),
        params({ id: "lg-1", espnId: ".." }),
      ),
  },
  {
    name: "DELETE zeroproof/espn-leagues/:id",
    run: async () => (await import("./zeroproof/espn-leagues/[id]/route")).DELETE(request(), params({ id: ".." })),
  },
  {
    name: "GET check-in/sites/:id/arrivals",
    run: async () => (await import("./check-in/sites/[id]/arrivals/route")).GET(request(), params({ id: ".." })),
  },
  {
    name: "GET check-in/sites/:id/code",
    run: async () => (await import("./check-in/sites/[id]/code/route")).GET(request(), params({ id: ".." })),
  },
  {
    name: "PUT calendar/calendars/:id/members/:memberSub",
    run: async () =>
      (await import("./calendar/calendars/[id]/members/[memberSub]/route")).PUT(
        request(json("PUT", { role: "viewer" })),
        params({ id: "cal-1", memberSub: ".." }),
      ),
  },
  {
    name: "DELETE calendar/calendars/:id/members/:memberSub",
    run: async () =>
      (await import("./calendar/calendars/[id]/members/[memberSub]/route")).DELETE(
        request(),
        params({ id: "cal-1", memberSub: ".." }),
      ),
  },
];

beforeEach(() => {
  vi.stubEnv("FLAG_ADMIN_ALLOWED_EMAILS", "admin@example.com");
  vi.mocked(auth0.getSession).mockResolvedValue({
    user: { email: "admin@example.com", email_verified: true },
  } as never);
  vi.mocked(auth0.getAccessToken).mockResolvedValue({ token: "tok" } as never);
  vi.mocked(fetchUpstream).mockResolvedValue({
    ok: true,
    response: new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("route ids that go into an upstream path", () => {
  it.each(CASES)("$name rejects `..` with a 400 and never calls the backend", async ({ run }) => {
    const res = await run();

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid identifier" });
    expect(fetchUpstream).not.toHaveBeenCalled();
  });
});

/** Every route handler file under src/app/api. */
function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(full);
    return entry.name === "route.ts" ? [full] : [];
  });
}

describe("upstream path building", () => {
  it("never puts an id into a path with encodeURIComponent; safeSegment is the only safe way", () => {
    const apiDir = path.join(process.cwd(), "src/app/api");
    const offenders = routeFiles(apiDir).flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, index) =>
          /\/\$\{encodeURIComponent\(/.test(line)
            ? [`${path.relative(process.cwd(), file)}:${index + 1}`]
            : [],
        ),
    );

    expect(offenders).toEqual([]);
  });
});
