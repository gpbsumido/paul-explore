import { NextRequest, NextResponse } from "next/server";
import TCGdex from "@tcgdex/sdk";
import { toPlain } from "@/lib/tcg";

const tcgdex = new TCGdex("en");

// Set detail is immutable once published — CDN can hold it for an hour and revalidate lazily
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  const { setId } = await params;
  const set = await tcgdex.set.get(setId);
  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(toPlain(set), {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
