import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { AccessTokenError, AccessTokenErrorCode } from "@auth0/nextjs-auth0/errors";

vi.mock("@/lib/auth0", () => ({
  auth0: { getAccessToken: vi.fn() },
}));
vi.mock("@/lib/upstream", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

import { auth0 } from "@/lib/auth0";
import { fetchUpstream } from "@/lib/upstream";
import { API_URL } from "@/lib/apiUrl";
import { GET, PUT, DELETE } from "./route";

const params = (id: string) => ({ params: Promise.resolve({ id }) });

const countdown = {
  id: "cd-1",
  title: "Trip",
  targetDate: "2026-06-01",
  color: "#ef4444",
  createdAt: "2026-03-15T00:00:00Z",
};

const upstreamAnswers = (body: unknown, status = 200) =>
  vi.mocked(fetchUpstream).mockResolvedValue({
    ok: true,
    response: new Response(
      body === null ? null : typeof body === "string" ? body : JSON.stringify(body),
      { status },
    ),
  });

function sentUpstream() {
  expect(fetchUpstream).toHaveBeenCalledTimes(1);
  const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
  return { url, init: init ?? {}, headers: (init?.headers ?? {}) as Record<string, string> };
}

const put = (body: unknown) =>
  new NextRequest("http://localhost/api/calendar/countdowns/cd-1", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const anyRequest = () => new NextRequest("http://localhost/api/calendar/countdowns/cd-1");

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(auth0.getAccessToken).mockResolvedValue({
    token: "tok",
    expiresAt: Date.now() / 1000 + 3600,
    scope: "openid",
  } as Awaited<ReturnType<typeof auth0.getAccessToken>>);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("/api/calendar/countdowns/:id", () => {
  describe.each([
    ["GET", () => GET(anyRequest(), params("cd-1"))],
    ["PUT", () => PUT(put({ title: "x" }), params("cd-1"))],
    ["DELETE", () => DELETE(anyRequest(), params("cd-1"))],
  ])("%s when signed out", (_method, call) => {
    it("answers 401 and never calls the backend", async () => {
      vi.mocked(auth0.getAccessToken).mockRejectedValue(
        new AccessTokenError(AccessTokenErrorCode.MISSING_SESSION, "no session"),
      );

      const res = await call();

      expect(res.status).toBe(401);
      expect(fetchUpstream).not.toHaveBeenCalled();
    });
  });

  describe("GET", () => {
    it("reads the countdown from the backend with the caller's token", async () => {
      upstreamAnswers({ countdown });

      const res = await GET(anyRequest(), params("cd-1"));

      const { url, headers } = sentUpstream();
      expect(url).toBe(`${API_URL}/api/calendar/countdowns/cd-1`);
      expect(headers.Authorization).toBe("Bearer tok");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ countdown });
    });

    it("encodes the id rather than letting it reshape the path", async () => {
      upstreamAnswers({ countdown });

      await GET(anyRequest(), params("a b?c"));

      expect(sentUpstream().url).toBe(`${API_URL}/api/calendar/countdowns/a%20b%3Fc`);
    });

    it("answers 400 for an id that is a path traversal, without calling the backend", async () => {
      const res = await GET(anyRequest(), params("../admin"));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Invalid identifier" });
      expect(fetchUpstream).not.toHaveBeenCalled();
    });

    it("keeps the backend's status but not its error body", async () => {
      upstreamAnswers({ error: "SELECT * FROM countdowns failed", stack: "..." }, 404);

      const res = await GET(anyRequest(), params("cd-1"));

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Failed to fetch countdown" });
    });

    it("answers 504 when the backend times out", async () => {
      vi.mocked(fetchUpstream).mockResolvedValue({ ok: false, cause: "timeout", message: "slow" });

      const res = await GET(anyRequest(), params("cd-1"));

      expect(res.status).toBe(504);
    });
  });

  describe("PUT", () => {
    it("forwards the validated fields as JSON and returns the backend's answer", async () => {
      upstreamAnswers({ countdown: { ...countdown, title: "Holiday" } });

      const res = await PUT(put({ title: "Holiday" }), params("cd-1"));

      const { url, init, headers } = sentUpstream();
      expect(url).toBe(`${API_URL}/api/calendar/countdowns/cd-1`);
      expect(init.method).toBe("PUT");
      expect(headers.Authorization).toBe("Bearer tok");
      expect(headers["Content-Type"]).toBe("application/json");
      expect(JSON.parse(String(init.body))).toEqual({ title: "Holiday" });
      expect(res.status).toBe(200);
      expect((await res.json()).countdown.title).toBe("Holiday");
    });

    it("drops fields the schema doesn't know before they reach the backend", async () => {
      upstreamAnswers({ countdown });

      await PUT(put({ title: "Holiday", id: "other", createdAt: "2000-01-01" }), params("cd-1"));

      expect(JSON.parse(String(sentUpstream().init.body))).toEqual({ title: "Holiday" });
    });

    it("answers 400 for an invalid body and never calls the backend", async () => {
      const res = await PUT(put({ title: "" }), params("cd-1"));

      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: "Invalid request body" });
      expect(fetchUpstream).not.toHaveBeenCalled();
    });

    it("answers 400 for a body that isn't JSON", async () => {
      const res = await PUT(
        new NextRequest("http://localhost/x", { method: "PUT", body: "not json" }),
        params("cd-1"),
      );

      expect(res.status).toBe(400);
      expect(fetchUpstream).not.toHaveBeenCalled();
    });

    it("passes the backend's own error body and status through", async () => {
      upstreamAnswers({ error: "Countdown not found" }, 404);

      const res = await PUT(put({ title: "x" }), params("cd-1"));

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Countdown not found" });
    });

    it("falls back to a plain message when the backend's error isn't JSON", async () => {
      upstreamAnswers("<html>bad gateway</html>", 500);

      const res = await PUT(put({ title: "x" }), params("cd-1"));

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Failed to update countdown" });
    });

    it("answers 400 for a malformed id without touching the body or the backend", async () => {
      const res = await PUT(put({ title: "x" }), params("a/b"));

      expect(res.status).toBe(400);
      expect(fetchUpstream).not.toHaveBeenCalled();
    });

    it("answers 504 when the backend times out and 502 when it can't be reached", async () => {
      vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "timeout", message: "slow" });
      expect((await PUT(put({ title: "x" }), params("cd-1"))).status).toBe(504);

      vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "unreachable", message: "down" });
      expect((await PUT(put({ title: "x" }), params("cd-1"))).status).toBe(502);
    });
  });

  describe("DELETE", () => {
    it("deletes at the countdown's path and answers 204 with no body", async () => {
      upstreamAnswers(null, 204);

      const res = await DELETE(anyRequest(), params("cd-1"));

      const { url, init, headers } = sentUpstream();
      expect(url).toBe(`${API_URL}/api/calendar/countdowns/cd-1`);
      expect(init.method).toBe("DELETE");
      expect(headers.Authorization).toBe("Bearer tok");
      expect(res.status).toBe(204);
      expect(await res.text()).toBe("");
    });

    it("passes the backend's error status and body through", async () => {
      upstreamAnswers({ error: "Not yours" }, 403);

      const res = await DELETE(anyRequest(), params("cd-1"));

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "Not yours" });
    });

    it("falls back to a plain message when the backend's error isn't JSON", async () => {
      upstreamAnswers("oops", 500);

      const res = await DELETE(anyRequest(), params("cd-1"));

      expect(await res.json()).toEqual({ error: "Failed to delete countdown" });
    });

    it("answers 504 when the backend times out", async () => {
      vi.mocked(fetchUpstream).mockResolvedValue({ ok: false, cause: "timeout", message: "slow" });

      expect((await DELETE(anyRequest(), params("cd-1"))).status).toBe(504);
    });

    it("answers 400 for a malformed id", async () => {
      const res = await DELETE(anyRequest(), params(".."));

      expect(res.status).toBe(400);
      expect(fetchUpstream).not.toHaveBeenCalled();
    });
  });
});
