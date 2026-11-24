import { describe, it, expect, vi, afterEach } from "vitest";
import { LIST_QUERY, LIST_BY_TYPE_QUERY } from "@/lib/graphql";

vi.mock("@/lib/upstream", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/upstream")>("@/lib/upstream");
  return { ...actual, fetchUpstream: vi.fn() };
});

import { fetchUpstream } from "@/lib/upstream";

const upstreamOk = () =>
  ({
    ok: true as const,
    response: new Response(JSON.stringify({ data: { pokemon_v2_pokemon: [] } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

/** The upstream answering with a given status and a raw body. */
const upstreamReplies = (status: number, rawBody: string) =>
  ({
    ok: true as const,
    response: new Response(rawBody, { status }),
  }) as unknown as Awaited<ReturnType<typeof fetchUpstream>>;

function post(body: unknown) {
  return new Request("http://localhost:3000/api/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const variables = { limit: 24, offset: 0, name: "%", type: "fire" };

afterEach(() => vi.clearAllMocks());

describe("POST /api/graphql", () => {
  it("forwards the pokemon list query the app actually sends", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstreamOk());
    const { POST } = await import("@/app/api/graphql/route");

    const res = await POST(post({ query: LIST_QUERY, variables }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { pokemon_v2_pokemon: [] } });
    const [url, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(url).toBe("https://beta.pokeapi.co/graphql/v1beta");
    expect(JSON.parse(String(init?.body))).toEqual({ query: LIST_QUERY, variables });
  });

  it("forwards the by-type query the app actually sends", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstreamOk());
    const { POST } = await import("@/app/api/graphql/route");

    const res = await POST(post({ query: LIST_BY_TYPE_QUERY, variables }));

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, max-age=60");
    const [, init] = vi.mocked(fetchUpstream).mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({
      query: LIST_BY_TYPE_QUERY,
      variables,
    });
  });

  it("ignores incidental whitespace differences in a known query", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstreamOk());
    const { POST } = await import("@/app/api/graphql/route");

    const reindented = `\n\n   ${LIST_QUERY.trim().replace(/\s+/g, "  ")}  \n`;
    const res = await POST(post({ query: reindented, variables }));

    expect(res.status).toBe(200);
    expect(fetchUpstream).toHaveBeenCalledTimes(1);
  });

  it("refuses a query the app never sends, without calling upstream", async () => {
    const { POST } = await import("@/app/api/graphql/route");

    const res = await POST(
      post({ query: "query { pokemon_v2_pokemon { id } }" }),
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toMatch(/not allowed/i);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("refuses a deeply nested query built to be expensive", async () => {
    const { POST } = await import("@/app/api/graphql/route");

    const res = await POST(
      post({
        query:
          "query { a { b { c { d { e { f { g { h { i { j { k } } } } } } } } } } }",
      }),
    );

    expect(res.status).toBe(403);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("refuses a request with no query at all", async () => {
    const { POST } = await import("@/app/api/graphql/route");

    const res = await POST(post({ variables }));

    expect(res.status).toBe(403);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("still rejects malformed JSON before it looks at the query", async () => {
    const { POST } = await import("@/app/api/graphql/route");

    const res = await POST(
      new Request("http://localhost:3000/api/graphql", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{not json",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("refuses an oversized body with 413 before reading it", async () => {
    const { POST } = await import("@/app/api/graphql/route");

    const res = await POST(
      new Request("http://localhost:3000/api/graphql", {
        method: "POST",
        headers: { "content-type": "application/json", "content-length": "70000" },
        body: JSON.stringify({ query: LIST_QUERY, variables }),
      }),
    );

    expect(res.status).toBe(413);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("refuses a body that is large once read, whatever its header says", async () => {
    const { POST } = await import("@/app/api/graphql/route");

    const res = await POST(
      post({ query: LIST_QUERY, variables: { name: "x".repeat(70_000) } }),
    );

    expect(res.status).toBe(413);
    expect(fetchUpstream).not.toHaveBeenCalled();
  });

  it("passes an upstream error status through with its body", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(
      upstreamReplies(429, JSON.stringify({ error: "slow down" })),
    );
    const { POST } = await import("@/app/api/graphql/route");

    const res = await POST(post({ query: LIST_QUERY, variables }));

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "slow down" });
  });

  it("does not throw when the upstream error body is not JSON", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(
      upstreamReplies(503, "<html>Service Unavailable</html>"),
    );
    const { POST } = await import("@/app/api/graphql/route");

    const res = await POST(post({ query: LIST_QUERY, variables }));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Upstream error" });
  });

  it("answers 504 when PokeAPI times out", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue({
      ok: false,
      cause: "timeout",
      message: "timed out",
    });
    const { POST } = await import("@/app/api/graphql/route");

    const res = await POST(post({ query: LIST_QUERY, variables }));

    expect(res.status).toBe(504);
  });
});
