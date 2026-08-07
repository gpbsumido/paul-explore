import { NextResponse, type NextRequest } from "next/server";
import { buildSearchTerm } from "@/lib/research/pubmed";
import { toEuropePmcQuery } from "@/lib/research/europepmc";
import { buildDiscussion } from "@/lib/research/journalClub";
import { europePmcSearch, isFailure } from "@/lib/research/eutils";

const CACHE_CONTROL = "public, s-maxage=21600, stale-while-revalidate=86400";

/** "Recent enough to still be worth arguing about" — two years, as asked. */
const WINDOW_YEARS = 2;

const PAGE_SIZE = 20;

/**
 * Papers from the last two years, each arriving with discussion material.
 *
 * Europe PMC rather than PubMed because this is the one place the abstract
 * itself is the product: it returns abstract text and NLM publication types as
 * JSON, and without both there is nothing to build a grounded prompt from.
 * PubMed offers the same only as XML.
 *
 * Papers with no abstract are dropped rather than handed generic prompts. A
 * citation with three questions that could apply to any paper is worse than
 * leaving it out, because it looks like preparation and isn't.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;

  const term = buildSearchTerm({
    topicId: params.get("topic") ?? undefined,
    meshTerm: params.get("mesh") ?? undefined,
  });
  if (!term) {
    return NextResponse.json(
      { error: "Unknown or missing topic" },
      { status: 400 },
    );
  }

  const scoped = toEuropePmcQuery(term);
  if (!scoped) {
    return NextResponse.json(
      { error: "Unusable topic query" },
      { status: 400 },
    );
  }

  const toYear = new Date().getFullYear();
  const fromYear = toYear - WINDOW_YEARS;
  const query = `${scoped} AND (SRC:"MED") AND (HAS_ABSTRACT:"Y") AND (FIRST_PDATE:[${fromYear}-01-01 TO ${toYear}-12-31])`;

  const result = await europePmcSearch(query, {
    pageSize: PAGE_SIZE,
    core: true,
  });
  if (isFailure(result)) return result.error;

  let records: unknown[];
  try {
    const parsed = result as {
      resultList?: { result?: unknown[] };
    };
    records = parsed.resultList?.result ?? [];
  } catch {
    return NextResponse.json(
      { error: "Europe PMC returned an unexpected payload" },
      { status: 502 },
    );
  }

  const papers = records
    .map((raw) => {
      const r = raw as {
        id?: string;
        source?: string;
        title?: string;
        abstractText?: string;
        authorString?: string;
        firstPublicationDate?: string;
        pubYear?: string;
        doi?: string;
        journalInfo?: { journal?: { title?: string } };
        pubTypeList?: { pubType?: string[] };
      };

      if (!r.id || !r.title || !r.abstractText) return null;

      const journal = r.journalInfo?.journal?.title ?? "";
      const pubDate = r.firstPublicationDate ?? r.pubYear ?? "";
      const discussion = buildDiscussion({
        title: r.title,
        journal,
        pubDate,
        abstract: r.abstractText,
        pubTypes: r.pubTypeList?.pubType ?? [],
      });

      return {
        id: `europepmc-${r.id}`,
        title: r.title
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim(),
        journal,
        pubDate,
        authors: (r.authorString ?? "")
          .replace(/\.$/, "")
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        doi: r.doi ?? null,
        url: `https://europepmc.org/article/${r.source ?? "MED"}/${r.id}`,
        ...discussion,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return NextResponse.json(
    { papers, window: { fromYear, toYear } },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
