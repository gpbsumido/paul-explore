import TCGdex from "@tcgdex/sdk";
import { serveTcg } from "@/lib/tcg-route";

const tcgdex = new TCGdex("en");

export async function GET() {
  return serveTcg("Failed to fetch series", async () => {
    const resumes = await tcgdex.serie.list();
    if (!resumes) return null;
    // Fetch full series data (includes sets) in parallel, dropping any misses.
    const series = await Promise.all(resumes.map((s) => tcgdex.serie.get(s.id)));
    return series.filter(Boolean);
  });
}
