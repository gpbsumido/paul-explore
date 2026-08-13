import { NextResponse } from "next/server";
import { loadAuditLog } from "@/lib/flags-bff";
import { maskActor } from "@/lib/maskActor";

/**
 * GET /api/flags/audit
 *
 * Public so the flags console renders its change log signed-out. The actor is
 * masked on the way out: in production that field holds a real allowlisted
 * address, and this endpoint would otherwise republish the one thing the
 * config deliberately keeps out of a public repo.
 */
export async function GET() {
  const { audit } = await loadAuditLog();
  return NextResponse.json({
    audit: audit.map((entry) => ({ ...entry, actor: maskActor(entry.actor) })),
  });
}
