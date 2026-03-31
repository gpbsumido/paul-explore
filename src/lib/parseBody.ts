import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";

/** Default maximum accepted body size: 64 KB. */
export const DEFAULT_MAX_BYTES = 65_536;

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
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
