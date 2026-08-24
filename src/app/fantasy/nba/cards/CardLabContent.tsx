"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { prettyGameDate, type GeneratedCard, type Sport } from "@/lib/fantasy-cards";
import { sortCards, type CardSort, type RarityFilter } from "@/lib/card-view";
import FantasyNav from "../FantasyNav";
import PackBar from "./PackBar";
import FantasyCard from "./FantasyCard";
import CardControls from "./CardControls";

type Mode = "nightly" | "season";

const SPORTS: { value: Sport; label: string }[] = [
  { value: "nba", label: "NBA" },
  { value: "wnba", label: "WNBA" },
  { value: "nfl", label: "NFL" },
];

type Props = {
  cards: GeneratedCard[];
  /** Which sport's cards these are. */
  sport: Sport;
  /** Nightly (per-game) or season totals. WNBA is nightly only. */
  mode: Mode;
  /** The fantasy season, carried in the toggle links. */
  season: string;
  /** The slate date for a nightly view, e.g. "2026-04-17". */
  date?: string | null;
  /** NFL week context: which week is shown and how many exist, for the picker. */
  weeks?: { current: number | null; latest: number | null };
  /** The source couldn't be reached, so distinguish "empty" from "broken". */
  error?: boolean;
};

/** A Card Lab URL for a given sport/mode. */
function cardsHref(sport: Sport, mode: Mode): string {
  return `/fantasy/nba/cards?sport=${sport}&mode=${mode}`;
}

/** The Card Lab: real performances turned into rarity-tiered cards, filterable and sortable. */
export default function CardLabContent({ cards, sport, mode, season, date, weeks, error }: Props) {
  const [filter, setFilter] = useState<RarityFilter>("all");
  const [sort, setSort] = useState<CardSort>("points");

  const nightly = mode === "nightly";
  const slateLabel = date ? prettyGameDate(date) : null;
  const intro =
    sport === "nfl"
      ? nightly
        ? "Every rostered player's week, minted as a trading card from real fantasy scoring. Rarity is relative: the bigger the week against the rest of the league, the rarer the card."
        : "Every rostered player's weeks across the whole season, rarest first. Filter by rarity to pull, say, every SIR of the year."
      : nightly
        ? `Every ${sport === "wnba" ? "" : "rostered "}player who suited up${slateLabel ? ` on ${slateLabel}` : ""}, minted as a trading card from that night's box score. Rarity is relative: the harder a player went against the rest of the slate, the rarer the card.`
        : `Every rostered player's ${season} season, minted as a trading card. Rarity is relative to the rest of the pool.`;

  const filtered = filter === "all" ? cards : cards.filter((c) => c.rarity === filter);
  const shown = sortCards(filtered, sort);

  return (
    <PageShell colorA="var(--color-feature-nba)" colorB="var(--color-feature-tcg)" className="font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Fantasy NBA", href: "/fantasy/nba" },
          { label: "Card Lab" },
        ]}
        maxWidth="max-w-5xl"
      />
      <FantasyNav />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Card Lab
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{intro}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Sport" className="flex gap-1">
              {SPORTS.map((s) => (
                <Link
                  key={s.value}
                  href={cardsHref(s.value, s.value === "nba" ? mode : "nightly")}
                  aria-current={sport === s.value ? "page" : undefined}
                  className={[
                    "rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
                    sport === s.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted hover:text-foreground",
                  ].join(" ")}
                >
                  {s.label}
                </Link>
              ))}
            </div>

            {sport !== "wnba" && (
              <div role="group" aria-label="View" className="flex gap-1">
                {(["nightly", "season"] as Mode[]).map((m) => (
                  <Link
                    key={m}
                    href={cardsHref(sport, m)}
                    aria-current={mode === m ? "page" : undefined}
                    className={[
                      "rounded-full border px-3 py-1 text-[13px] font-medium capitalize transition-colors",
                      mode === m
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    {sport === "nfl" && m === "nightly" ? "By week" : m}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {sport === "nfl" && mode === "nightly" && weeks?.latest ? (
            <div
              role="group"
              aria-label="Week"
              className="mt-3 flex flex-wrap gap-1"
            >
              <span className="mr-1 self-center text-[13px] text-muted">Week</span>
              {Array.from({ length: weeks.latest }, (_, i) => i + 1).map((w) => (
                <Link
                  key={w}
                  href={`/fantasy/nba/cards?sport=nfl&week=${w}`}
                  aria-current={weeks.current === w ? "page" : undefined}
                  className={[
                    "rounded-full border px-2.5 py-1 text-[13px] font-medium tabular-nums transition-colors",
                    weeks.current === w
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted hover:text-foreground",
                  ].join(" ")}
                >
                  {w}
                </Link>
              ))}
            </div>
          ) : null}
        </header>

        <PackBar slate={{ sport, mode, date, week: weeks?.current }} />

        {error ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-6 text-[15px] text-muted">
            Couldn&rsquo;t reach the live ESPN data right now. The cards come
            straight from it, so this settles once it responds again.
          </p>
        ) : cards.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-6 text-[15px] text-muted">
            {nightly
              ? "No games with box scores on this slate yet. Cards appear once the night's scores settle."
              : "No performances to mint yet. Cards appear once the season's scores settle."}
          </p>
        ) : (
          <>
            <CardControls
              cards={cards}
              filter={filter}
              onFilter={setFilter}
              sort={sort}
              onSort={setSort}
            />

            {shown.length === 0 ? (
              <p className="text-[15px] text-muted">No cards in this set.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {shown.map((card) => (
                  <li key={card.id}>
                    <FantasyCard card={card} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </PageShell>
  );
}
