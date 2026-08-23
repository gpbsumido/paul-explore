"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { RARITY_META, type GeneratedCard, type Rarity } from "@/lib/fantasy-cards";
import FantasyNav from "../FantasyNav";

/** Rarity buckets, rarest first, for the filter bar and grouping. */
const RARITY_ORDER: Rarity[] = ["sir", "rare", "uncommon", "common"];

type Filter = Rarity | "all";

type Props = {
  cards: GeneratedCard[];
  /** The season the cards were generated from, shown in the intro. */
  season: string;
  /** The league couldn't be reached, so distinguish "empty" from "broken". */
  error?: boolean;
};

/** Player headshot with an initials fallback, so a missing photo still reads as a card. */
function CardImage({ card }: { card: GeneratedCard }) {
  const [broken, setBroken] = useState(false);
  const initials = card.playerName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  if (broken) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-surface text-2xl font-bold text-muted"
        aria-hidden
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- ESPN CDN base URL, not a next/image source
    <img
      src={card.imageUrl}
      alt={`${card.playerName} headshot`}
      loading="lazy"
      className="h-full w-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

function Card({ card }: { card: GeneratedCard }) {
  const meta = RARITY_META[card.rarity];
  return (
    <article
      className="glass-card flex h-full flex-col overflow-hidden rounded-xl border-2"
      style={{ borderColor: meta.color }}
      aria-label={`${card.title}, ${meta.label}`}
    >
      <div className="aspect-[2.5/3.5] w-full overflow-hidden bg-surface">
        <CardImage card={card} />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ color: meta.color, borderColor: meta.color }}
          >
            {meta.label}
          </span>
          <span className="tabular-nums text-sm font-bold text-foreground">
            {Math.round(card.points)}
            <span className="ml-0.5 text-[10px] font-medium text-muted">PTS</span>
          </span>
        </div>
        <h3 className="mt-0.5 text-[13px] font-semibold leading-snug text-foreground">
          {card.playerName}
        </h3>
        <p className="text-[11px] text-muted">{card.subtitle}</p>
      </div>
    </article>
  );
}

/** The Card Lab: rostered players turned into rarity-tiered cards, filterable by rarity. */
export default function CardLabContent({ cards, season, error }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const present = RARITY_ORDER.filter((r) => cards.some((c) => c.rarity === r));
  const filtered = filter === "all" ? cards : cards.filter((c) => c.rarity === filter);

  const pill = (value: Filter, label: string, count: number) => {
    const active = filter === value;
    return (
      <button
        key={value}
        type="button"
        aria-pressed={active}
        onClick={() => setFilter(value)}
        className={[
          "rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40",
          active
            ? "border-foreground bg-foreground text-background"
            : "border-border text-muted hover:text-foreground",
        ].join(" ")}
      >
        {label}
        <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
      </button>
    );
  };

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
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Every rostered player&rsquo;s {season} performance, minted as a
            trading card. Rarity is relative: the harder a player went against
            the rest of the pool, the rarer the card.
          </p>
        </header>

        {error ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-6 text-[15px] text-muted">
            Couldn&rsquo;t reach the fantasy league right now. The cards come
            from live ESPN data, so this settles once the league responds again.
          </p>
        ) : cards.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-6 text-[15px] text-muted">
            No performances to mint yet. Cards appear once the week&rsquo;s
            scores settle.
          </p>
        ) : (
          <>
            <div
              role="group"
              aria-label="Filter by rarity"
              className="mb-6 flex flex-wrap gap-2"
            >
              {pill("all", "All", cards.length)}
              {present.map((r) =>
                pill(
                  r,
                  RARITY_META[r].label,
                  cards.filter((c) => c.rarity === r).length,
                ),
              )}
            </div>

            {filtered.length === 0 ? (
              <p className="text-[15px] text-muted">
                No {filter === "all" ? "" : RARITY_META[filter].label} cards this
                week.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((card) => (
                  <li key={card.id}>
                    <Card card={card} />
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
