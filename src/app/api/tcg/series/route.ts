import { NextResponse } from "next/server";
import TCGdex from "@tcgdex/sdk";
import { toPlain } from "@/lib/tcg";

const tcgdex = new TCGdex("en");

// Series list is append-only and rarely changes — safe to cache aggressively at the CDN
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET() {
  const resumes = await tcgdex.serie.list();
  if (!resumes) return NextResponse.json([]);

  // Fetch full series data (includes sets) in parallel
  const series = await Promise.all(resumes.map((s) => tcgdex.serie.get(s.id)));
  const valid = series.filter(Boolean);

  return NextResponse.json(toPlain(valid), {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
