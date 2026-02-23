import { NextResponse } from "next/server";
import TCGdex from "@tcgdex/sdk";
import { toPlain } from "@/lib/tcg";

const tcgdex = new TCGdex("en");

export async function GET() {
  const sets = await tcgdex.set.list();
  return NextResponse.json(toPlain(sets ?? []));
}
