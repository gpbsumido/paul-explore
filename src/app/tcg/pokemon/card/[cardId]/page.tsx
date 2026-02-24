import TCGdex from "@tcgdex/sdk";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { typeStyle } from "@/lib/tcg";
import { Chip } from "@/components/ui";

const tcgdex = new TCGdex("en");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cardId: string }>;
}): Promise<Metadata> {
  const { cardId } = await params;
  const card = await tcgdex.card.get(cardId);
  if (!card) return { title: "Card | Pokémon TCG" };
  return {
    title: `${card.name} | Pokémon TCG`,
    description: card.set?.name
      ? `${card.name} from the ${card.set.name} set.`
      : `${card.name} — Pokémon TCG card details.`,
  };
}

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const card = await tcgdex.card.get(cardId);
  if (!card) notFound();

  const backHref = card.set?.id
    ? `/tcg/pokemon/sets/${card.set.id}`
    : "/tcg/pokemon";
  const backLabel = card.set?.name ?? "Browse";

  return (
    <div className="min-h-dvh bg-background font-sans">
      <nav className="sticky top-0 z-20 h-14 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors shrink-0 max-w-[160px] truncate"
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" className="shrink-0">
              <path d="M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {backLabel}
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground truncate">
            {card.name}
          </span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Card image — sticky on wide screens */}
          {card.image && (
            <div className="lg:sticky lg:top-20 lg:self-start flex justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${card.image}/high.webp`}
                alt={card.name}
                className="w-72 lg:w-80 rounded-2xl shadow-2xl"
              />
            </div>
          )}

          {/* Card details */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">
            {/* Name + HP + types */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-4xl font-black uppercase tracking-tight text-foreground leading-none">
                  {card.name}
                </h1>
                {card.hp && (
                  <span className="text-2xl font-black text-muted shrink-0">
                    {card.hp} <span className="text-base font-semibold">HP</span>
                  </span>
                )}
              </div>
              {card.types && card.types.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {card.types.map((type) => (
                    <Chip
                      key={type}
                      label={type}
                      size="md"
                      className={`font-bold uppercase tracking-wide ${typeStyle(type)}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Meta grid */}
            <div className="rounded-xl border border-border bg-surface p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {card.stage && <Stat label="Stage" value={card.stage} />}
              {card.rarity && <Stat label="Rarity" value={card.rarity} />}
              {card.set?.name && <Stat label="Set" value={card.set.name} />}
              {card.illustrator && <Stat label="Illustrator" value={card.illustrator} />}
              {card.evolveFrom && <Stat label="Evolves from" value={card.evolveFrom} />}
              {card.dexId && card.dexId.length > 0 && (
                <Stat label="Pokédex" value={`#${card.dexId[0]}`} />
              )}
              {card.regulationMark && <Stat label="Regulation" value={card.regulationMark} />}
              {card.retreat !== undefined && (
                <Stat
                  label="Retreat"
                  value={
                    card.retreat === 0
                      ? "Free"
                      : Array.from({ length: card.retreat }).map((_, i) => (
                          <EnergyIcon key={i} type="Colorless" />
                        ))
                  }
                />
              )}
            </div>

            {/* Abilities */}
            {card.abilities && card.abilities.length > 0 && (
              <Section title="Abilities">
                {card.abilities.map((ability, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-400">
                        {ability.type}
                      </span>
                      <span className="text-sm font-bold text-foreground">{ability.name}</span>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{parseEnergyText(ability.effect)}</p>
                  </div>
                ))}
              </Section>
            )}

            {/* Attacks */}
            {card.attacks && card.attacks.length > 0 && (
              <Section title="Attacks">
                {card.attacks.map((attack, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {attack.cost && attack.cost.length > 0 && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            {attack.cost.map((type, j) => (
                              <EnergyIcon key={j} type={type} />
                            ))}
                          </div>
                        )}
                        <span className="text-sm font-bold text-foreground truncate">{attack.name}</span>
                      </div>
                      {attack.damage && (
                        <span className="text-lg font-black text-foreground shrink-0">{attack.damage}</span>
                      )}
                    </div>
                    {attack.effect && (
                      <p className="text-sm text-muted leading-relaxed">{parseEnergyText(attack.effect)}</p>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {/* Weaknesses & Resistances */}
            {((card.weaknesses && card.weaknesses.length > 0) ||
              (card.resistances && card.resistances.length > 0)) && (
              <div className="rounded-xl border border-border bg-surface p-5 flex gap-8">
                {card.weaknesses && card.weaknesses.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase tracking-widest text-muted font-bold">
                      Weakness
                    </span>
                    {card.weaknesses.map((w) => (
                      <span key={w.type} className="flex items-center gap-1 text-sm font-bold text-foreground">
                        <EnergyIcon type={w.type} />
                        {w.value}
                      </span>
                    ))}
                  </div>
                )}
                {card.resistances && card.resistances.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase tracking-widest text-muted font-bold">
                      Resistance
                    </span>
                    {card.resistances.map((r) => (
                      <span key={r.type} className="flex items-center gap-1 text-sm font-bold text-foreground">
                        <EnergyIcon type={r.type} />
                        {r.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trainer/Energy effect */}
            {card.effect && (
              <Section title={card.trainerType ?? card.energyType ?? "Effect"}>
                <p className="text-sm text-muted leading-relaxed">{parseEnergyText(card.effect)}</p>
              </Section>
            )}

            {/* Flavor text */}
            {card.description && (
              <p className="text-sm text-muted leading-relaxed italic border-t border-border pt-5">
                {card.description}
              </p>
            )}

            {/* Legality */}
            <div className="flex gap-2 pt-1">
              <LegalBadge label="Standard" legal={card.legal?.standard} />
              <LegalBadge label="Expanded" legal={card.legal?.expanded} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EnergyIcon({ type }: { type: string }) {
  return (
    <Image
      src={`/energy/${type}.png`}
      alt={type}
      title={type}
      width={20}
      height={20}
      unoptimized
      className="object-contain inline align-middle"
    />
  );
}

const ENERGY_CODE: Record<string, string> = {
  C: "Colorless",
  D: "Darkness",
  N: "Dragon",
  Y: "Fairy",
  F: "Fighting",
  R: "Fire",
  G: "Grass",
  L: "Lightning",
  M: "Metal",
  P: "Psychic",
  W: "Water",
};

function parseEnergyText(text: string): React.ReactNode[] {
  return text.split(/(\{[A-Z]\})/).map((part, i) => {
    const match = part.match(/^\{([A-Z])\}$/);
    if (match && ENERGY_CODE[match[1]]) {
      return <EnergyIcon key={i} type={ENERGY_CODE[match[1]]} />;
    }
    return part;
  });
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-widest text-muted font-bold">{label}</span>
      <span className="text-sm text-foreground font-semibold flex items-center gap-0.5">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-4">
      <h2 className="text-[10px] uppercase tracking-widest font-bold text-muted">{title}</h2>
      {children}
    </div>
  );
}

function LegalBadge({ label, legal }: { label: string; legal: boolean | undefined }) {
  return (
    <span
      className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${
        legal
          ? "bg-green-500/15 text-green-400 border-green-500/20"
          : "bg-surface text-muted border-border"
      }`}
    >
      {label} {legal ? "✓" : "✗"}
    </span>
  );
}
