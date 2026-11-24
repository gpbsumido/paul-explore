import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";

/** Default maximum accepted body size: 64 KB. */
export const DEFAULT_MAX_BYTES = 65_536;

type ParseBodyOptions = {
  /**
   * Answer a schema failure with a sentence about its first field, like "Max
   * members must be a number", in place of the "Invalid request body" label.
   * For routes whose `{ error }` a form shows on screen.
   */
  explainFirstIssue?: boolean;
};

const EXPECTED_IN_WORDS: Record<string, string> = {
  number: "a number",
  int: "a whole number",
  string: "text",
  boolean: "yes or no",
};

/**
 * The field an issue is about, the way a form labels it: "maxMembers" reads as
 * "Max members". A trailing "Cents" goes, since people type dollars.
 */
function fieldLabel(path: readonly PropertyKey[]): string {
  const key = path.findLast((part): part is string => typeof part === "string");
  if (!key) return "The request";
  const words = key.replace(/Cents$/, "").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** One zod issue as a sentence a person can act on, built from its code rather than zod's own wording. */
function describeIssue(issue: z.core.$ZodIssue): string {
  const field = fieldLabel(issue.path);
  switch (issue.code) {
    case "invalid_type":
      return `${field} must be ${EXPECTED_IN_WORDS[issue.expected] ?? issue.expected}`;
    case "too_small":
      if (issue.origin === "string" && Number(issue.minimum) <= 1) return `${field} can't be empty`;
      if (issue.origin === "string") return `${field} must be at least ${issue.minimum} characters`;
      return `${field} must be ${issue.inclusive ? "at least" : "more than"} ${issue.minimum}`;
    case "too_big":
      if (issue.origin === "string") return `${field} must be at most ${issue.maximum} characters`;
      return `${field} must be ${issue.inclusive ? "at most" : "less than"} ${issue.maximum}`;
    case "invalid_value":
      return `${field} must be one of ${issue.values.join(", ")}`;
    case "invalid_format":
      return `${field} isn't in the right format`;
    default:
      return `${field} isn't valid`;
  }
}

/**
 * Reads, size-checks, and Zod-validates a JSON request body in one step.
 *
 * Size is verified two ways:
 *   1. Content-Length header — fast rejection before the body is read.
 *   2. Re-serialized byte length after parsing — catches chunked encoding
 *      where Content-Length is absent.
 *
 * Returns `{ ok: true, data }` on success or `{ ok: false, response }` on any
 * failure. Callers should return `result.response` immediately when `ok` is false.
 */
export async function parseBody<T>(
  request: NextRequest,
  schema: z.ZodType<T>,
  maxBytes = DEFAULT_MAX_BYTES,
  { explainFirstIssue = false }: ParseBodyOptions = {},
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  const cl = Number(request.headers.get("content-length") ?? 0);
  if (cl > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Payload too large" },
        { status: 413 },
      ),
    };
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }

  if (new TextEncoder().encode(JSON.stringify(raw)).length > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Payload too large" },
        { status: 413 },
      ),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const [firstIssue] = parsed.error.issues;
    const error = explainFirstIssue && firstIssue ? describeIssue(firstIssue) : "Invalid request body";
    return {
      ok: false,
      response: NextResponse.json(
        { error, details: parsed.error.issues },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
