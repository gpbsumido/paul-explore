import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import {
  CARD_LAB_DEFAULT_SEASON,
  loadNbaSeasonCards,
} from "@/lib/card-lab-pool";
import { loadNightlySlate } from "@/lib/espn-nightly";
import { loadNflWeek, loadNflSeason } from "@/lib/espn-nfl";
import type { Sport } from "@/lib/fantasy-cards";
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

const SEASON_RE = /^\d{4}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function resolveSeason(raw: string | undefined): string {
  return raw && SEASON_RE.test(raw) ? raw : CARD_LAB_DEFAULT_SEASON;
}

function resolveSport(raw: string | undefined): Sport {
  return raw === "wnba" || raw === "nfl" ? raw : "nba";
}

/** WNBA is nightly-only; NBA and NFL also offer a season view. */
function resolveMode(raw: string | undefined, sport: Sport): "nightly" | "season" {
  return sport !== "wnba" && raw === "season" ? "season" : "nightly";
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
    if (mode === "season") {
      const slate = await loadNflSeason({ season });
      return (
        <CardLabContent
          cards={slate.cards}
          sport="nfl"
          mode="season"
          season={season}
          error={slate.error}
          weeks={{ current: slate.week, latest: slate.latestWeek }}
        />
      );
    }
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
    const { cards, error } = await loadNbaSeasonCards(season);
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

  // NBA's default view falls back to the season view whenever it has no night to
  // show: between June and October, or when ESPN's scoreboard can't be read. The
  // season cards come from the league read instead, so they usually still load.
  // A night or the Nightly tab asked for by name still gets its own empty state
  // or error. WNBA is in season when NBA isn't.
  const defaultViewWithNoNight =
    sport === "nba" && !params.mode && !date && slate.cards.length === 0;

  if (defaultViewWithNoNight) {
    const { cards, error } = await loadNbaSeasonCards(season);
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
