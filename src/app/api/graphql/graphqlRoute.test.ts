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
    expect(fetchUpstream).toHaveBeenCalled();
  });

  it("forwards the by-type query the app actually sends", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstreamOk());
    const { POST } = await import("@/app/api/graphql/route");

    const res = await POST(post({ query: LIST_BY_TYPE_QUERY, variables }));

    expect(res.status).toBe(200);
    expect(fetchUpstream).toHaveBeenCalled();
  });

  it("ignores incidental whitespace differences in a known query", async () => {
    vi.mocked(fetchUpstream).mockResolvedValue(upstreamOk());
    const { POST } = await import("@/app/api/graphql/route");

    const reindented = `\n\n   ${LIST_QUERY.trim().replace(/\s+/g, "  ")}  \n`;
    const res = await POST(post({ query: reindented, variables }));

    expect(res.status).toBe(200);
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
});
