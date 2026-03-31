import { NextResponse } from "next/server";
import TCGdex from "@tcgdex/sdk";
import { toPlain } from "@/lib/tcg";

const tcgdex = new TCGdex("en");

// Set list changes only when a new set releases — an hour of CDN cache is fine
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET() {
  let sets;
  try {
    sets = await tcgdex.set.list();
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch sets" },
      { status: 502 },
    );
  }

  if (!sets) {
    return NextResponse.json(
      { error: "Failed to fetch sets" },
      { status: 502 },
    );
  }

  return NextResponse.json(toPlain(sets), {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
