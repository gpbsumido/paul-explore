import { describe, it, expect, vi, afterEach } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AccessTokenError, AccessTokenErrorCode } from "@auth0/nextjs-auth0/errors";
import { ResponseError, requestJson, responseError } from "./responseError";
import { upstreamErrorResponse } from "./upstream";
import { parseBody } from "./parseBody";
import { withBackend } from "./backendFetch";
import { InvalidSegmentError } from "./safeSegment";
import { auth0 } from "./auth0";
import { forgiveUnexpectedOutput } from "@/test/unexpectedOutput";

vi.mock("./auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

afterEach(() => vi.restoreAllMocks());

/**
 * The BFF answers a failure with `{ error }`, written for the person who
 * clicked. That sentence should reach the screen, and anything else falls back
 * to the caller's own wording.
 */
describe("responseError", () => {
  it("uses the server's error message", async () => {
    const error = await responseError(
      jsonResponse({ error: "You already have an active season wallet" }, 409),
      "Couldn't open the wallet.",
    );

    expect(error).toBeInstanceOf(ResponseError);
    expect(error.message).toBe("You already have an active season wallet");
  });

  it("keeps the status so a caller can word a known one itself", async () => {
    const error = await responseError(jsonResponse({}, 402), "Couldn't open a pack.");

    expect(error.status).toBe(402);
  });

  it.each([
    ["an HTML error page", new Response("<html>Bad gateway</html>", { status: 502 })],
    ["an empty body", new Response(null, { status: 500 })],
    ["a body with no error field", jsonResponse({ ok: false }, 500)],
    ["a blank error", jsonResponse({ error: "  " }, 500)],
    ["an error that isn't a string", jsonResponse({ error: { code: 1 } }, 500)],
  ])("falls back on %s", async (_name, res) => {
    const error = await responseError(res, "Failed to create event");

    expect(error.message).toBe("Failed to create event");
  });
});

/**
 * The shared route helpers answer with labels written for the logs. They are
 * built here from the real helpers rather than typed out, so renaming one of
 * those labels can't quietly put it back on the screen.
 */
describe("responseError on the shared route helpers' labels", () => {
  const post = (body: string) =>
    new NextRequest("http://localhost/api/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
  const schema = z.object({ title: z.string() });
  const failedBody = async (request: NextRequest, maxBytes?: number) => {
    const result = await parseBody(request, schema, maxBytes);
    if (result.ok) throw new Error("expected parseBody to refuse the body");
    return result.response;
  };
  const guest = () =>
    vi
      .mocked(auth0.getAccessToken)
      .mockRejectedValue(new AccessTokenError(AccessTokenErrorCode.MISSING_SESSION, "no session"));
  const signedIn = () =>
    vi.mocked(auth0.getAccessToken).mockResolvedValue({ token: "t", expiresAt: 0 });
  const backendRoute = (fail: () => never) =>
    withBackend("x", async () => {
      fail();
      return NextResponse.json({});
    })(post("{}"), undefined);

  it.each([
    ["a timed-out upstream", async () => upstreamErrorResponse({ ok: false, cause: "timeout", message: "deadline" })],
    ["an unreachable upstream", async () => upstreamErrorResponse({ ok: false, cause: "unreachable", message: "refused" })],
    ["a body that fails the schema", () => failedBody(post(JSON.stringify({ title: 1 })))],
    ["a body that isn't JSON", () => failedBody(post("{"))],
    ["a body over the size cap", () => failedBody(post(JSON.stringify({ title: "x".repeat(50) })), 10)],
    ["a signed-out visitor", () => {
      guest();
      return backendRoute(() => { throw new Error("unreachable"); });
    }],
    ["a malformed path segment", () => {
      signedIn();
      return backendRoute(() => { throw new InvalidSegmentError("id"); });
    }],
  ])("keeps the caller's wording for %s", async (_name, produce) => {
    const res = await produce();
    expect(res.ok).toBe(false);

    const error = await responseError(res, "Failed to create event");

    expect(error.message).toBe("Failed to create event");
    expect(error.status).toBe(res.status);
  });

  it("keeps the caller's wording when a backend call throws", async () => {
    signedIn();
    const res = await backendRoute(() => { throw new Error("ECONNRESET"); });

    const error = await responseError(res, "Failed to create event");

    expect(error.message).toBe("Failed to create event");
    expect(forgiveUnexpectedOutput()).toEqual(["[x] backend unavailable: Error: ECONNRESET"]);
  });
});

describe("requestJson", () => {
  it("sends JSON and returns the parsed body", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ budgets: [] }, 200));

    const body = await requestJson<{ budgets: unknown[] }>("/api/budget", {
      method: "POST",
      body: JSON.stringify({ name: "Home" }),
    });

    expect(body).toEqual({ budgets: [] });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/budget");
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
    expect(init?.method).toBe("POST");
  });

  it("throws the server's message on a failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "Budget not found" }, 404),
    );

    await expect(requestJson("/api/budget/b1")).rejects.toMatchObject({
      message: "Budget not found",
      status: 404,
    });
  });

  it("names the status when the server says nothing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 503 }));

    await expect(requestJson("/api/practice")).rejects.toThrow("Request failed (503)");
  });
});

/** Every non-test source file under a directory. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

/**
 * Check-in's backend answers with `message`, not `error`, and the two screens
 * read the body on success too, so they keep their own parsing.
 */
const READS_ITS_OWN_BODY = new Set([
  "src/app/check-in/CheckInContent.tsx",
  "src/app/check-in/display/DisplayContent.tsx",
]);

describe("browser code reading a failed response", () => {
  it("goes through responseError instead of parsing the body by hand", () => {
    const root = process.cwd();
    const offenders = sourceFiles(path.join(root, "src"))
      .map((file) => path.relative(root, file))
      .filter((file) => !file.startsWith("src/app/api/") && !file.startsWith("src/app/thoughts/"))
      .filter((file) => !READS_ITS_OWN_BODY.has(file))
      .flatMap((file) =>
        readFileSync(path.join(root, file), "utf8")
          .split("\n")
          .flatMap((line, index) =>
            /\.json\(\)\.catch\(/.test(line) ? [`${file}:${index + 1}`] : [],
          ),
      );

    expect(offenders).toEqual([]);
  });
});
