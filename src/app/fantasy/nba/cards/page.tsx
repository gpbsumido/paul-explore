import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import { fetchUpstream } from "@/lib/upstream";
import {
  cardsFromLeaguePayload,
  nbaFantasyLeagueUrl,
} from "@/lib/espn-performances";
import type { GeneratedCard } from "@/lib/fantasy-cards";
import CardLabContent from "./CardLabContent";

const TITLE = "Card Lab";
const DESCRIPTION =
  "Turn ESPN fantasy roster performances into rarity-tiered trading cards.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/fantasy/nba/cards`,
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

// League data changes at most daily during a season — cache the shell for an hour
export const revalidate = 3600;

const DEFAULT_SEASON = "2025";
const SEASON_RE = /^\d{4}$/;

function resolveSeason(raw: string | undefined): string {
  return raw && SEASON_RE.test(raw) ? raw : DEFAULT_SEASON;
}

async function loadCards(
  season: string,
): Promise<{ cards: GeneratedCard[]; error: boolean }> {
  const result = await fetchUpstream(nbaFantasyLeagueUrl(season), {
    next: { revalidate: 3600 },
  });
  if (!result.ok || !result.response.ok) return { cards: [], error: true };
  try {
    const payload = await result.response.json();
    return { cards: cardsFromLeaguePayload(payload, { season }), error: false };
  } catch {
    return { cards: [], error: true };
  }
}

export default async function CardLabPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season: seasonParam } = await searchParams;
  const season = resolveSeason(seasonParam);
  const { cards, error } = await loadCards(season);

  return <CardLabContent cards={cards} season={season} error={error} />;
}
