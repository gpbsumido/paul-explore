"use client";

import { useState } from "react";
import { RARITY_META, type Rarity } from "@/lib/fantasy-cards";

export type FantasyCardData = {
  playerName: string;
  points: number;
  rarity: Rarity;
  subtitle: string;
  imageUrl: string;
  boosts?: string[];
  /** How many copies are owned (collection view). */
  count?: number;
};

/** A glow that gets stronger with rarity, so the rare pulls jump off the page. */
function glow(rarity: Rarity, color: string): string | undefined {
  if (rarity === "sir") return `0 0 26px -2px ${color}`;
  if (rarity === "rare") return `0 0 16px -6px ${color}`;
  return undefined;
}

/** Headshot with an initials fallback so a missing photo still reads as a card. */
function CardImage({ name, url }: { name: string; url: string }) {
  const [broken, setBroken] = useState(false);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  if (broken) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface text-2xl font-bold text-muted" aria-hidden>
        {initials}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ESPN CDN base URL, not a next/image source
    <img
      src={url}
      alt={`${name} headshot`}
      loading="lazy"
      className="h-full w-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

/**
 * The one card presentation used everywhere cards show — the Card Lab grid, the
 * collection, and the pack reveal — so rarity reads the same each time: a bold
 * colour-coded band with the tier spelled out (never colour alone), a border and
 * glow that scale with rarity, and the points up front.
 */
export default function FantasyCard({ card }: { card: FantasyCardData }) {
  const meta = RARITY_META[card.rarity];
  return (
    <article
      className="glass-card flex h-full flex-col overflow-hidden rounded-xl border-2"
      style={{ borderColor: meta.color, boxShadow: glow(card.rarity, meta.color) }}
      aria-label={`${card.playerName}, ${Math.round(card.points)} points, ${meta.label}${card.count && card.count > 1 ? `, ${card.count} copies` : ""}`}
    >
      {/* Bold rarity band — colour plus the label, so tier is obvious and not colour-only. */}
      <div
        className="flex items-center justify-between px-2.5 py-1"
        style={{ backgroundColor: meta.color }}
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-white drop-shadow">
          {meta.label}
        </span>
        {card.count && card.count > 1 ? (
          <span className="tabular-nums text-[11px] font-bold text-white/90">×{card.count}</span>
        ) : null}
      </div>

      <div className="aspect-[2.5/3.5] w-full overflow-hidden bg-surface">
        <CardImage name={card.playerName} url={card.imageUrl} />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-[13px] font-semibold leading-snug text-foreground">
            {card.playerName}
          </h3>
          <span className="shrink-0 tabular-nums text-sm font-bold text-foreground">
            {Math.round(card.points)}
            <span className="ml-0.5 text-[10px] font-medium text-muted">PTS</span>
          </span>
        </div>
        <p className="text-[11px] text-muted">{card.subtitle}</p>
        {card.boosts && card.boosts.length > 0 ? (
          <ul className="mt-1 flex flex-wrap gap-1">
            {card.boosts.map((b) => (
              <li
                key={b}
                className="rounded border border-border bg-surface px-1.5 py-0.5 text-[9px] font-medium text-muted"
              >
                {b}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
