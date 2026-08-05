import { NextResponse } from "next/server";
import { toPlain } from "@/lib/tcg";

// Server-only helpers for the TCG proxy routes. Kept out of lib/tcg.ts because
// that module is imported by client components (typeStyle, TYPE_COLORS); pulling
// next/server in there would drag it into the client bundle.

/** Shared CDN cache window for the read-only TCG routes. */
export const TCG_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=86400";

/**
 * Serves a TCGdex list endpoint. Runs the producer, turns a thrown error or a
 * null/undefined result into a 502 with `errorLabel`, and otherwise strips the
 * SDK's circular refs and forwards the JSON with the shared cache header.
 *
 * Only for the list routes — the detail routes return 404 (not 502) on a miss
 * and deliberately don't catch, so they keep their own handler.
 */
export async function serveTcg<T>(
  errorLabel: string,
  produce: () => Promise<T | null | undefined>,
): Promise<NextResponse> {
  let result: T | null | undefined;
  try {
    result = await produce();
  } catch {
    return NextResponse.json({ error: errorLabel }, { status: 502 });
  }
  if (result == null) {
    return NextResponse.json({ error: errorLabel }, { status: 502 });
  }
  return NextResponse.json(toPlain(result), {
    headers: { "Cache-Control": TCG_CACHE_CONTROL },
  });
}
