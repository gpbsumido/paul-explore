import { type NextRequest, NextResponse } from "next/server";
import TCGdex from "@tcgdex/sdk";
import { toPlain } from "@/lib/tcg";
import { TCG_CACHE_CONTROL } from "@/lib/tcg-route";

const tcgdex = new TCGdex("en");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ setId: string }> },
) {
  const { setId } = await params;
  const set = await tcgdex.set.get(setId);
  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(toPlain(set), {
    headers: { "Cache-Control": TCG_CACHE_CONTROL },
  });
}
