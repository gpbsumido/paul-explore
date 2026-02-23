import { NextRequest, NextResponse } from "next/server";
import TCGdex from "@tcgdex/sdk";
import { toPlain } from "@/lib/tcg";

const tcgdex = new TCGdex("en");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  const card = await tcgdex.card.get(cardId);
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(toPlain(card));
}
