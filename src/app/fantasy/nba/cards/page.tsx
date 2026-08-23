import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import { fetchUpstream } from "@/lib/upstream";
import {
  cardsFromLeaguePayload,
  nbaFantasyLeagueUrl,
} from "@/lib/espn-performances";
import { loadNightlySlate } from "@/lib/espn-nightly";
import { loadNflWeek } from "@/lib/espn-nfl";
import type { GeneratedCard, Sport } from "@/lib/fantasy-cards";
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
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function resolveSeason(raw: string | undefined): string {
  return raw && SEASON_RE.test(raw) ? raw : DEFAULT_SEASON;
}

function resolveSport(raw: string | undefined): Sport {
  return raw === "wnba" || raw === "nfl" ? raw : "nba";
}

/** WNBA is nightly-only (no ESPN fantasy season); NBA defaults to nightly. */
function resolveMode(raw: string | undefined, sport: Sport): "nightly" | "season" {
  return sport === "nba" && raw === "season" ? "season" : "nightly";
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
  searchParams: Promise<{
    season?: string;
    sport?: string;
    mode?: string;
    date?: string;
    week?: string;
  }>;
}) {
  const params = await searchParams;
  const season = resolveSeason(params.season);
  const sport = resolveSport(params.sport);
  const mode = resolveMode(params.mode, sport);
  const date = params.date && DATE_RE.test(params.date) ? params.date : undefined;

  if (sport === "nfl") {
    const week = params.week && /^\d{1,2}$/.test(params.week) ? Number(params.week) : undefined;
    const slate = await loadNflWeek({ season, week });
    return (
      <CardLabContent
        cards={slate.cards}
        sport="nfl"
        mode="nightly"
        season={season}
        error={slate.error}
        weeks={{ current: slate.week, latest: slate.latestWeek }}
      />
    );
  }

  if (mode === "season") {
    const { cards, error } = await loadCards(season);
    return (
      <CardLabContent
        cards={cards}
        sport="nba"
        mode="season"
        season={season}
        error={error}
      />
    );
  }

  const slate = await loadNightlySlate({ sport, season, date });

  // Off-season fallback: NBA's default view has no slate to show between June and
  // October, so unless a night was explicitly asked for, fall back to the season
  // view rather than a bare empty page. WNBA is in season when NBA isn't.
  const offSeasonDefault =
    sport === "nba" &&
    !params.mode &&
    !date &&
    !slate.error &&
    slate.cards.length === 0;

  if (offSeasonDefault) {
    const { cards, error } = await loadCards(season);
    return (
      <CardLabContent
        cards={cards}
        sport="nba"
        mode="season"
        season={season}
        error={error}
      />
    );
  }

  return (
    <CardLabContent
      cards={slate.cards}
      sport={sport}
      mode="nightly"
      season={season}
      date={slate.date}
      error={slate.error}
    />
  );
}
