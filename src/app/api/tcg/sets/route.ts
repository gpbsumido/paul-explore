import { NextResponse } from "next/server";
import TCGdex from "@tcgdex/sdk";
import { toPlain } from "@/lib/tcg";

const tcgdex = new TCGdex("en");

// Set list changes only when a new set releases — an hour of CDN cache is fine
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET() {
  const sets = await tcgdex.set.list();
  return NextResponse.json(toPlain(sets ?? []), {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
