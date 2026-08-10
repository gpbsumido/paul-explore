import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { server } from "@/test/server";

vi.mock("@/lib/auth0", () => ({ auth0: { getSession: vi.fn() } }));

import { auth0 } from "@/lib/auth0";
import { POST as askPOST } from "./ask/route";
import { __resetAskLimiter } from "./ask/route";

type Session = Awaited<ReturnType<typeof auth0.getSession>>;
const signedIn = {
  user: {
    sub: "auth0|123",
    email: "allowed@example.com",
    email_verified: true,
  },
} as Session;

const OPENAI = "https://api.openai.com/v1/chat/completions";

const post = (body: unknown) =>
  new NextRequest("http://localhost/api/research/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const valid = {
  question: "What is the main weakness of this study?",
  paper: {
    title: "Limb salvage on dialysis.",
    journal: "Annals of Vascular Surgery",
    pubDate: "2025-04-02",
    abstract: "We reviewed 412 patients.",
  },
};

beforeEach(() => {
  __resetAskLimiter();
  vi.mocked(auth0.getSession).mockResolvedValue(signedIn);
  vi.stubEnv("OPENAI_API_KEY", "sk-test-key");
  vi.stubEnv(
    "RESEARCH_ASK_ALLOWED_EMAILS",
    "allowed@example.com, second@example.com",
  );
  server.use(
    http.post(OPENAI, () =>
      HttpResponse.json({
        choices: [{ message: { content: "Confounding by indication." } }],
      }),
    ),
  );
});

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/research/ask", () => {
  it("answers a question about a paper", async () => {
    const res = await askPOST(post(valid));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      answer: "Confounding by indication.",
      model: "gpt-4.1",
    });
  });

  it("sends the paper as context so the answer is about this paper", async () => {
    let sent = "";
    server.use(
      http.post(OPENAI, async ({ request }) => {
        sent = JSON.stringify(await request.json());
        return HttpResponse.json({
          choices: [{ message: { content: "ok" } }],
        });
      }),
    );
    await askPOST(post(valid));
    expect(sent).toContain("Limb salvage on dialysis.");
    expect(sent).toContain("412 patients");
  });

  it("never sends the key to the browser, only to OpenAI", async () => {
    let auth: string | null = null;
    server.use(
      http.post(OPENAI, ({ request }) => {
        auth = request.headers.get("authorization");
        return HttpResponse.json({ choices: [{ message: { content: "ok" } }] });
      }),
    );
    const res = await askPOST(post(valid));
    expect(auth).toBe("Bearer sk-test-key");
    expect(JSON.stringify(await res.json())).not.toContain("sk-test-key");
  });

  it("says plainly when no key is configured rather than failing obscurely", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const res = await askPOST(post(valid));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/not configured/i);
  });

  it("400s on a missing or empty question", async () => {
    expect((await askPOST(post({ ...valid, question: "" }))).status).toBe(400);
    expect((await askPOST(post({ paper: valid.paper }))).status).toBe(400);
  });

  it("502s when OpenAI is unreachable", async () => {
    server.use(http.post(OPENAI, () => HttpResponse.error()));
    const res = await askPOST(post(valid));
    expect(res.status).toBe(502);
  });

  it("passes an OpenAI error status through rather than pretending it worked", async () => {
    server.use(
      http.post(OPENAI, () =>
        HttpResponse.json({ error: { message: "quota" } }, { status: 429 }),
      ),
    );
    const res = await askPOST(post(valid));
    expect(res.status).toBe(429);
  });

  it("relays what the API actually said, since the reason is the actionable part", async () => {
    // A 429 is either "no credits" or "slow down", and those need opposite
    // responses from the reader. A bare status number tells them neither.
    server.use(
      http.post(OPENAI, () =>
        HttpResponse.json(
          {
            error: {
              type: "insufficient_quota",
              message:
                "You have no credits remaining. Add credits to continue.",
            },
          },
          { status: 429 },
        ),
      ),
    );
    const res = await askPOST(post(valid));
    const body = await res.json();
    expect(body.error).toContain("no credits remaining");
  });

  it("still says something useful when the API sends no message", async () => {
    server.use(
      http.post(OPENAI, () => new HttpResponse(null, { status: 500 })),
    );
    const res = await askPOST(post(valid));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/500/);
  });

  it("is never cached, since answers are per-question", async () => {
    const res = await askPOST(post(valid));
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });
});

describe("POST /api/research/ask is not an open door to a paid API", () => {
  it("refuses anyone who is not signed in", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(null);
    const res = await askPOST(post(valid));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/sign in/i);
  });

  it("does not call the paid API at all when signed out", async () => {
    vi.mocked(auth0.getSession).mockResolvedValue(null);
    let called = false;
    server.use(
      http.post(OPENAI, () => {
        called = true;
        return HttpResponse.json({ choices: [{ message: { content: "x" } }] });
      }),
    );
    await askPOST(post(valid));
    expect(called).toBe(false);
  });

  it("caps how much one person can spend in a burst", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      statuses.push((await askPOST(post(valid))).status);
    }
    expect(statuses.filter((s) => s === 200).length).toBeLessThanOrEqual(10);
    expect(statuses).toContain(429);
  });

  it("counts the limit per person, not globally", async () => {
    for (let i = 0; i < 10; i += 1) await askPOST(post(valid));
    expect((await askPOST(post(valid))).status).toBe(429);

    vi.mocked(auth0.getSession).mockResolvedValue({
      user: {
        sub: "auth0|someone-else",
        email: "second@example.com",
        email_verified: true,
      },
    } as Session);
    expect((await askPOST(post(valid))).status).toBe(200);
  });
});

describe("POST /api/research/ask is limited to named people", () => {
  const asUser = (user: Record<string, unknown>) =>
    vi.mocked(auth0.getSession).mockResolvedValue({ user } as Session);

  it("lets an allowed address through", async () => {
    asUser({ sub: "a", email: "second@example.com", email_verified: true });
    expect((await askPOST(post(valid))).status).toBe(200);
  });

  it("turns away a signed-in address that is not on the list", async () => {
    asUser({ sub: "b", email: "stranger@example.com", email_verified: true });
    const res = await askPOST(post(valid));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/not enabled/i);
  });

  it("ignores case and padding in the address", async () => {
    asUser({ sub: "c", email: "  Allowed@Example.COM ", email_verified: true });
    expect((await askPOST(post(valid))).status).toBe(200);
  });

  it("refuses an unverified address, which the holder may not own", async () => {
    asUser({ sub: "d", email: "allowed@example.com", email_verified: false });
    expect((await askPOST(post(valid))).status).toBe(403);
  });

  it("fails closed when no allowlist is configured", async () => {
    vi.stubEnv("RESEARCH_ASK_ALLOWED_EMAILS", "");
    asUser({ sub: "e", email: "allowed@example.com", email_verified: true });
    expect((await askPOST(post(valid))).status).toBe(403);
  });

  it("never reaches the paid API for a stranger", async () => {
    let called = false;
    server.use(
      http.post(OPENAI, () => {
        called = true;
        return HttpResponse.json({ choices: [{ message: { content: "x" } }] });
      }),
    );
    asUser({ sub: "f", email: "stranger@example.com", email_verified: true });
    await askPOST(post(valid));
    expect(called).toBe(false);
  });
});

describe("POST /api/research/ask model choice", () => {
  const modelSent = async (body: unknown) => {
    let sent = "";
    server.use(
      http.post(OPENAI, async ({ request }) => {
        sent = ((await request.json()) as { model: string }).model;
        return HttpResponse.json({ choices: [{ message: { content: "x" } }] });
      }),
    );
    await askPOST(post(body));
    return sent;
  };

  it("defaults to the recommended model, not the cheapest", async () => {
    expect(await modelSent(valid)).toBe("gpt-4.1");
  });

  it("honours one of the three offered", async () => {
    expect(await modelSent({ ...valid, model: "gpt-5" })).toBe("gpt-5");
    expect(await modelSent({ ...valid, model: "gpt-4o-mini" })).toBe(
      "gpt-4o-mini",
    );
  });

  it("ignores a model that is not on the list rather than forwarding it", async () => {
    expect(await modelSent({ ...valid, model: "gpt-4-turbo" })).toBe("gpt-4.1");
  });

  it("tells the caller which model actually answered", async () => {
    const res = await askPOST(post({ ...valid, model: "gpt-5" }));
    expect((await res.json()).model).toBe("gpt-5");
  });
});
