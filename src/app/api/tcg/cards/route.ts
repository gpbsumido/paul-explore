import { NextRequest, NextResponse } from "next/server";
import TCGdex, { Query } from "@tcgdex/sdk";
import { toPlain } from "@/lib/tcg";

const tcgdex = new TCGdex("en");
const PER_PAGE = 20;

// TCG card data is stable for hours — CDN serves the cached list and refreshes in the background
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "";
  const setId = searchParams.get("setId") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const query = Query.create().sort("localId", "ASC").paginate(page, PER_PAGE);

  if (q) query.like("name", q);
  if (type) query.contains("types", type);
  if (setId) query.equal("set.id", setId);

  const cards = await tcgdex.card.list(query);
  return NextResponse.json(toPlain(cards ?? []), {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
