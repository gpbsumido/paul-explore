import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { parseBody } from "@/lib/parseBody";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { auth0 } from "@/lib/auth0";
import {
  isAskModel,
  RECOMMENDED_MODEL,
  type AskModelId,
} from "@/lib/research/askModels";

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
  model: z.string().optional(),
  paper: z.object({
    title: z.string().max(500),
    journal: z.string().max(300).optional().default(""),
    pubDate: z.string().max(40).optional().default(""),
    abstract: z.string().max(20_000).optional().default(""),
  }),
});

/**
 * Which model answers.
 *
 * The caller may pick one of three, and anything else is rejected rather than
 * forwarded -- an unvalidated model string would let a crafted request point
 * the account's credit at whatever it liked.
 *
 * The default is the recommended one rather than the cheapest. This shipped on
 * gpt-4o-mini, which was the wrong pick: critical appraisal is a reasoning
 * task, and the mini tier is exactly where that turns vague and agreeable. The
 * volume here is a handful of questions behind a per-minute cap, so the cheaper
 * tier saves pennies and costs the thing the feature exists for.
 *
 * OPENAI_MODEL still overrides the default, for trying something not listed
 * without a deploy.
 */
function resolveModel(requested: unknown): AskModelId {
  if (isAskModel(requested)) return requested;
  const configured = process.env.OPENAI_MODEL;
  return isAskModel(configured) ? configured : RECOMMENDED_MODEL;
}

/**
 * Per-person burst cap.
 *
 * This route spends real money on someone else's account, so the interesting
 * question is not where the code runs but who is allowed to run it and how
 * often. In-memory is honest about its limits: it resets on redeploy and is
 * per-instance, which is enough to stop a runaway loop or an idle tab hammering
 * the API, and is not a substitute for a shared limiter if this ever needs one.
 */
/**
 * Who may spend the credits, as a comma-separated env var.
 *
 * Deliberately NOT hard-coded. This repo is public, and committing a personal
 * email address publishes it to every scraper that walks GitHub -- permanently,
 * since it stays in history even if removed later. Config keeps the addresses
 * out of the source entirely.
 *
 * Unset means nobody, not everybody. An access list that silently opens up when
 * misconfigured is worse than one that locks you out, because only one of those
 * failures is noisy.
 */
function allowedEmails(): string[] {
  return (process.env.RESEARCH_ASK_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

const hits = new Map<string, number[]>();

/** Test seam: the limiter is module state, so tests need it cleared. */
export function __resetAskLimiter(): void {
  hits.clear();
}

function overLimit(who: string, now: number): boolean {
  const recent = (hits.get(who) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(who, recent);
    return true;
  }
  recent.push(now);
  hits.set(who, recent);
  return false;
}

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
  // Signed-in only. The site is public and this route spends money, so leaving
  // it open would let anyone who found the path drain the account -- which is
  // the actual exposure here, not where the handler happens to run.
  const session = await auth0.getSession(request);
  const who = session?.user?.sub;
  if (!who) {
    return NextResponse.json(
      { error: "Sign in to ask about a paper." },
      { status: 401, headers: { "Cache-Control": CACHE_CONTROL } },
    );
  }

  // An email claim is only as trustworthy as the provider's verification of
  // it. An unverified address can be typed in by anyone at signup, so treating
  // it as identity would make the allowlist decorative.
  const email = session.user?.email?.trim().toLowerCase();
  const verified = session.user?.email_verified === true;
  if (!email || !verified || !allowedEmails().includes(email)) {
    return NextResponse.json(
      { error: "Ask is not enabled for this account." },
      { status: 403, headers: { "Cache-Control": CACHE_CONTROL } },
    );
  }

  if (overLimit(who, Date.now())) {
    return NextResponse.json(
      { error: "That's a lot of questions at once — try again in a minute." },
      { status: 429, headers: { "Cache-Control": CACHE_CONTROL } },
    );
  }

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
  const model = resolveModel(parsed.data.model);

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
        model,
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
      { answer, model },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
  } catch {
    return NextResponse.json(
      { error: "The model returned an unreadable response." },
      { status: 502, headers: { "Cache-Control": CACHE_CONTROL } },
    );
  }
}
