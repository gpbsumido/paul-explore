import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { parseBody } from "@/lib/parseBody";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";

/**
 * Ask a model about a paper.
 *
 * This is a BFF route rather than a browser call for one reason: the API key
 * must never reach the client. Anything in NEXT_PUBLIC_ is in the bundle and
 * therefore public, so the key stays server-side and the browser only ever
 * talks to this route.
 *
 * Note for anyone setting this up: a ChatGPT Plus or Pro subscription does NOT
 * include API access. The API is billed separately and needs its own key from
 * platform.openai.com. Without OPENAI_API_KEY set this returns 503 with a
 * message saying so, rather than failing in a way that looks like a bug.
 */

const askSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  paper: z.object({
    title: z.string().max(500),
    journal: z.string().max(300).optional().default(""),
    pubDate: z.string().max(40).optional().default(""),
    abstract: z.string().max(20_000).optional().default(""),
  }),
});

const MODEL = "gpt-4o-mini";

/** Answers are per-question, so nothing here is cacheable. */
const CACHE_CONTROL = "no-store";

const SYSTEM_PROMPT = [
  "You are helping a vascular surgery resident prepare for a journal club.",
  "Answer only from the paper's title and abstract given below.",
  "If the abstract does not contain what was asked, say so plainly rather than",
  "filling the gap from general knowledge, and name what would be needed from",
  "the full text. Be concise and specific. Do not invent numbers.",
].join(" ");

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Ask is not configured. Set OPENAI_API_KEY on the server — note that a ChatGPT subscription does not include API access; the key comes from platform.openai.com and is billed separately.",
      },
      { status: 503, headers: { "Cache-Control": CACHE_CONTROL } },
    );
  }

  const parsed = await parseBody(request, askSchema);
  if (!parsed.ok) return parsed.response;

  const { question, paper } = parsed.data;

  const context = [
    `Title: ${paper.title}`,
    paper.journal && `Journal: ${paper.journal}`,
    paper.pubDate && `Published: ${paper.pubDate}`,
    paper.abstract && `Abstract: ${paper.abstract}`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await fetchUpstream(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `${context}\n\nQuestion: ${question}` },
        ],
      }),
      timeoutMs: 30_000,
    },
  );

  if (!result.ok) return upstreamErrorResponse(result);

  if (!result.response.ok) {
    // Pass the status through, and the API's own message with it. A 429 means
    // either "no credits" or "slow down", which call for opposite responses;
    // a bare status number tells the reader neither. This is the one place
    // relaying an upstream message earns its keep, because it is the only
    // thing that says what to actually do about it.
    let detail = "";
    try {
      const body = (await result.response.json()) as {
        error?: { message?: string };
      };
      detail = body.error?.message?.trim() ?? "";
    } catch {
      // No parseable body; the status alone will have to do.
    }

    return NextResponse.json(
      {
        error: detail || `The model API returned ${result.response.status}.`,
      },
      {
        status: result.response.status,
        headers: { "Cache-Control": CACHE_CONTROL },
      },
    );
  }

  try {
    const json = (await result.response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const answer = json.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return NextResponse.json(
        { error: "The model returned an empty answer." },
        { status: 502, headers: { "Cache-Control": CACHE_CONTROL } },
      );
    }
    return NextResponse.json(
      { answer },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
  } catch {
    return NextResponse.json(
      { error: "The model returned an unreadable response." },
      { status: 502, headers: { "Cache-Control": CACHE_CONTROL } },
    );
  }
}
