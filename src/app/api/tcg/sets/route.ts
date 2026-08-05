import TCGdex from "@tcgdex/sdk";
import { serveTcg } from "@/lib/tcg-route";

const tcgdex = new TCGdex("en");

export async function GET() {
  return serveTcg("Failed to fetch sets", () => tcgdex.set.list());
}
