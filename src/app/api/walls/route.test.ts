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

import { GET, POST } from "./route";

const upstreamAnswers = (body: unknown, status = 200) =>
  vi.mocked(fetchUpstream).mockResolvedValue({
    ok: true,
    response: new Response(JSON.stringify(body), { status }),
  });

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

const signedOut = () =>
  vi.mocked(auth0.getAccessToken).mockRejectedValue(
    new AccessTokenError(AccessTokenErrorCode.MISSING_SESSION, "no session"),
  );

describe("GET /api/walls", () => {
  it("answers a signed-out caller with 401 and never calls the backend", async () => {
    signedOut();

    const res = await GET(new NextRequest("http://localhost/api/walls"), undefined);

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("lists the caller's walls from the backend, uncached, with their token", async () => {
    upstreamAnswers({ walls: [{ id: "w1", name: "Gallery" }] });

    const res = await GET(new NextRequest("http://localhost/api/walls"), undefined);

    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/walls`);
    expect(init?.headers).toEqual({ Authorization: "Bearer tok" });
    expect(init?.cache).toBe("no-store");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ walls: [{ id: "w1", name: "Gallery" }] });
  });

  it("passes the backend's status and body through when it refuses", async () => {
    upstreamAnswers({ error: "Forbidden" }, 403);

    const res = await GET(new NextRequest("http://localhost/api/walls"), undefined);

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
  });

  it("answers 504 for a timeout and 502 when the backend can't be reached", async () => {
    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "timeout", message: "slow" });
    expect((await GET(new NextRequest("http://localhost/api/walls"), undefined)).status).toBe(504);

    vi.mocked(fetchUpstream).mockResolvedValueOnce({ ok: false, cause: "unreachable", message: "down" });
    expect((await GET(new NextRequest("http://localhost/api/walls"), undefined)).status).toBe(502);
  });
});

describe("POST /api/walls", () => {
  const multipart = () => {
    const form = new FormData();
    form.set("name", "Gallery");
    form.set("state", JSON.stringify({ frames: 2 }));
    form.set("image-1", new Blob(["pixels"], { type: "image/png" }), "wall.png");
    return new Request("http://localhost/api/walls", { method: "POST", body: form });
  };

  it("answers a signed-out caller with 401 and never calls the backend", async () => {
    signedOut();

    const res = await POST(new NextRequest(multipart()), undefined);

    expect(res.status).toBe(401);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("forwards the multipart body byte for byte with its boundary intact", async () => {
    upstreamAnswers({ wall: { id: "w9" } }, 201);
    const original = new NextRequest(multipart());
    const contentType = original.headers.get("content-type") ?? "";
    const expectedBytes = new Uint8Array(await original.clone().arrayBuffer());

    const res = await POST(original, undefined);

    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe(`${API_URL}/api/walls`);
    expect(init?.method).toBe("POST");
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(init?.headers).toEqual({ Authorization: "Bearer tok", "Content-Type": contentType });
    expect(new Uint8Array(init?.body as ArrayBuffer)).toEqual(expectedBytes);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ wall: { id: "w9" } });
  });

  it("falls back to a generic binary type when the request names none", async () => {
    upstreamAnswers({}, 201);
    const bare = new NextRequest("http://localhost/api/walls", { method: "POST", body: new Uint8Array([1, 2, 3]) });
    bare.headers.delete("content-type");

    await POST(bare, undefined);

    const [, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBe("application/octet-stream");
  });

  it("passes the backend's refusal through with its status", async () => {
    upstreamAnswers({ error: "Too many walls" }, 409);

    const res = await POST(new NextRequest(multipart()), undefined);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Too many walls" });
  });

  it("answers 504 for a timeout", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({ ok: false, cause: "timeout", message: "slow" });

    expect((await POST(new NextRequest(multipart()), undefined)).status).toBe(504);
  });
});
