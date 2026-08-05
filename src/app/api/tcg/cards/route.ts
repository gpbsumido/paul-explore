import { type NextRequest } from "next/server";
import TCGdex, { Query } from "@tcgdex/sdk";
import { serveTcg } from "@/lib/tcg-route";

const tcgdex = new TCGdex("en");
const PER_PAGE = 20;

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

  return serveTcg("Failed to fetch cards", () => tcgdex.card.list(query));
}
