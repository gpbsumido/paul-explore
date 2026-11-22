import { describe, it, expect, vi, afterEach } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { ResponseError, requestJson, responseError } from "./responseError";

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
