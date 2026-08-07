import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { server } from "@/test/server";
import { POST as askPOST } from "./ask/route";

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
  vi.stubEnv("OPENAI_API_KEY", "sk-test-key");
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
    expect(await res.json()).toEqual({ answer: "Confounding by indication." });
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
              message: "You have no credits remaining. Add credits to continue.",
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
