"use client";

import { useState } from "react";
import { Badge } from "@paul-portfolio/react";
import { RARITY_META, type Rarity } from "@/lib/fantasy-cards";
import TiltCard from "@/components/motion/TiltCard";
import SpotlightCard from "@/components/motion/SpotlightCard";
import GradientMesh from "@/components/motion/GradientMesh";
import BlobBackground from "@/components/motion/BlobBackground";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import Chip from "@/components/ui/Chip";
import { cardBackdrop, type CardBackdrop } from "./cardBackdrop";

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

/** The mesh/blob layers behind the card, chosen per card so each looks its own. */
function Backdrop({ backdrop }: { backdrop: CardBackdrop }) {
  const mesh = (
    <GradientMesh colors={backdrop.colors} className="opacity-60" />
  );
  const blob = (
    <BlobBackground
      seeds={backdrop.seeds}
      colors={backdrop.colors}
      parallax={24}
      className="opacity-50"
    />
  );
  if (backdrop.variant === "mesh") return mesh;
  if (backdrop.variant === "blob") return blob;
  return (
    <>
      {mesh}
      {blob}
    </>
  );
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
      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted" aria-hidden>
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
 * collection, and the pack reveal. Rarity reads the same each time (a bold
 * colour-coded band with the tier spelled out, a border and glow that scale with
 * rarity), and each card carries its own living backdrop: a rarity-tinted glass
 * surface with a cursor-following glow, a per-card mesh/blob layer, the points
 * counting up as a big overlay, and a hover tilt that turns the card to face the
 * pointer. Every effect is decorative and reduced-motion aware, and the text
 * sits above a scrim so it keeps its contrast.
 */
export default function FantasyCard({ card }: { card: FantasyCardData }) {
  const meta = RARITY_META[card.rarity];
  const backdrop = cardBackdrop(
    `${card.playerName}|${card.subtitle}|${card.rarity}`,
    card.rarity,
  );
  const points = Math.round(card.points);
  const owned = card.count && card.count > 1 ? card.count : null;

  return (
    <TiltCard className="h-full">
      <SpotlightCard
        accent={meta.color}
        size={260}
        className="block h-full !rounded-xl border-0"
      >
        <article
          className="relative flex h-full flex-col overflow-hidden rounded-xl border-2"
          style={{ borderColor: meta.color, boxShadow: glow(card.rarity, meta.color) }}
          aria-label={`${card.playerName}, ${points} points, ${meta.label}${owned ? `, ${owned} copies` : ""}`}
        >
          <Backdrop backdrop={backdrop} />

          {/* Content sits above the backdrop; the scrim keeps text readable. */}
          <div className="relative z-10 flex h-full flex-col">
            {/* Bold rarity band — colour plus the label, so tier is never colour-only. */}
            <div
              className="flex items-center justify-between px-2.5 py-1"
              style={{ backgroundColor: meta.color }}
            >
              <span className="text-[11px] font-bold uppercase tracking-widest text-white drop-shadow">
                {meta.label}
              </span>
              {owned ? <Badge variant="info">×{owned}</Badge> : null}
            </div>

            <div className="relative aspect-[2.5/3.5] w-full overflow-hidden">
              <CardImage name={card.playerName} url={card.imageUrl} />
              {/* Points count up as a big jersey-style overlay — the figure in
                  the background the brief asked for, legible over a soft scrim. */}
              <div
                className="pointer-events-none absolute bottom-1.5 right-2.5 flex flex-col items-end leading-none"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
              >
                <AnimatedNumber
                  value={points}
                  className="text-5xl font-black tabular-nums text-white"
                />
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                  pts
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-1.5 bg-surface/55 p-3 backdrop-blur-sm">
              <h3 className="truncate text-[13px] font-semibold leading-snug text-foreground">
                {card.playerName}
              </h3>
              <p className="text-[11px] text-muted">{card.subtitle}</p>
              {card.boosts && card.boosts.length > 0 ? (
                <ul className="mt-0.5 flex flex-wrap gap-1">
                  {card.boosts.map((b) => (
                    <li key={b}>
                      <Chip
                        label={b}
                        size="sm"
                        className="border border-border bg-surface/80 text-muted"
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </article>
      </SpotlightCard>
    </TiltCard>
  );
}
