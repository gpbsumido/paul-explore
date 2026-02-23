import { NextRequest, NextResponse } from "next/server";
import TCGdex from "@tcgdex/sdk";
import { toPlain } from "@/lib/tcg";

const tcgdex = new TCGdex("en");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  const { setId } = await params;
  const set = await tcgdex.set.get(setId);
  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(toPlain(set));
}
