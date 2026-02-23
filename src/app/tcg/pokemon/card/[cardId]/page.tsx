import TCGdex from "@tcgdex/sdk";
import Link from "next/link";
import { notFound } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { typeStyle } from "@/lib/tcg";

const tcgdex = new TCGdex("en");

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const card = await tcgdex.card.get(cardId);
  if (!card) notFound();

  // Back link goes to the set if we know it, otherwise browse
  const backHref = card.set?.id
    ? `/tcg/pokemon/sets/${card.set.id}`
    : "/tcg/pokemon";
  const backLabel = card.set?.name ?? "Browse";

  return (
    <div className="flex flex-col min-h-dvh max-w-[480px] mx-auto font-sans bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-center px-4 py-3 bg-background border-b border-border backdrop-blur-xl">
        <Link
          href={backHref}
          className="absolute left-4 text-[#007aff] text-sm flex items-center gap-0.5 max-w-[120px] truncate"
        >
          <svg
            width="10"
            height="16"
            viewBox="0 0 10 16"
            fill="none"
            className="shrink-0"
          >
            <path
              d="M9 1L2 8l7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          &nbsp;{backLabel}
        </Link>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-base font-semibold text-foreground truncate max-w-[180px]">
            {card.name}
          </span>
          <span className="text-[11px] text-muted">{card.set?.name}</span>
        </div>
        <div className="absolute right-4">
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 py-6">
        {/* Card image */}
        {card.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${card.image}/high.webp`}
            alt={card.name}
            className="w-56 mx-auto rounded-2xl shadow-2xl"
          />
        )}

        {/* Name + HP + types */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">{card.name}</h1>
            {card.hp && (
              <span className="text-sm font-semibold text-muted">
                {card.hp} HP
              </span>
            )}
          </div>
          {card.types && card.types.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {card.types.map((type) => (
                <span
                  key={type}
                  className={`px-3 py-0.5 rounded-full text-xs font-semibold ${typeStyle(type)}`}
                >
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Meta grid */}
        <div className="rounded-2xl border border-border bg-surface p-4 grid grid-cols-2 gap-3">
          {card.stage && <Stat label="Stage" value={card.stage} />}
          {card.rarity && <Stat label="Rarity" value={card.rarity} />}
          {card.set?.name && <Stat label="Set" value={card.set.name} />}
          {card.illustrator && (
            <Stat label="Illustrator" value={card.illustrator} />
          )}
          {card.evolveFrom && (
            <Stat label="Evolves from" value={card.evolveFrom} />
          )}
          {card.dexId && card.dexId.length > 0 && (
            <Stat label="Pokédex" value={`#${card.dexId[0]}`} />
          )}
          {card.regulationMark && (
            <Stat label="Regulation" value={card.regulationMark} />
          )}
          {card.retreat !== undefined && (
            <Stat label="Retreat" value={`${card.retreat} ◆`} />
          )}
        </div>

        {/* Abilities */}
        {card.abilities && card.abilities.length > 0 && (
          <Section title="Abilities">
            {card.abilities.map((ability, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
                    {ability.type}
                  </span>
                  <span className="text-[14px] font-semibold text-foreground">
                    {ability.name}
                  </span>
                </div>
                <p className="text-[13px] text-muted leading-relaxed">
                  {ability.effect}
                </p>
              </div>
            ))}
          </Section>
        )}

        {/* Attacks */}
        {card.attacks && card.attacks.length > 0 && (
          <Section title="Attacks">
            {card.attacks.map((attack, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {attack.cost && attack.cost.length > 0 && (
                      <span className="text-[11px] text-muted shrink-0">
                        {attack.cost.join(" ")}
                      </span>
                    )}
                    <span className="text-[14px] font-semibold text-foreground truncate">
                      {attack.name}
                    </span>
                  </div>
                  {attack.damage && (
                    <span className="text-[14px] font-bold text-foreground shrink-0">
                      {attack.damage}
                    </span>
                  )}
                </div>
                {attack.effect && (
                  <p className="text-[13px] text-muted leading-relaxed">
                    {attack.effect}
                  </p>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Weaknesses & Resistances */}
        {((card.weaknesses && card.weaknesses.length > 0) ||
          (card.resistances && card.resistances.length > 0)) && (
          <div className="rounded-2xl border border-border bg-surface p-4 flex gap-6">
            {card.weaknesses && card.weaknesses.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted font-medium">
                  Weakness
                </span>
                {card.weaknesses.map((w) => (
                  <span
                    key={w.type}
                    className={`text-[13px] font-semibold ${typeStyle(w.type).split(" ")[1]}`}
                  >
                    {w.type} {w.value}
                  </span>
                ))}
              </div>
            )}
            {card.resistances && card.resistances.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted font-medium">
                  Resistance
                </span>
                {card.resistances.map((r) => (
                  <span
                    key={r.type}
                    className={`text-[13px] font-semibold ${typeStyle(r.type).split(" ")[1]}`}
                  >
                    {r.type} {r.value}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trainer/Energy effect */}
        {card.effect && (
          <Section title={card.trainerType ?? card.energyType ?? "Effect"}>
            <p className="text-[13px] text-muted leading-relaxed">
              {card.effect}
            </p>
          </Section>
        )}

        {/* Flavor text */}
        {card.description && (
          <p className="text-[13px] text-muted leading-relaxed italic border-t border-border pt-4">
            {card.description}
          </p>
        )}

        {/* Legal */}
        <div className="flex gap-3 pb-4">
          <LegalBadge label="Standard" legal={card.legal?.standard} />
          <LegalBadge label="Expanded" legal={card.legal?.expanded} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wider text-muted font-medium">
        {label}
      </span>
      <span className="text-[14px] text-foreground font-medium">{value}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3">
      <h2 className="text-[11px] uppercase tracking-wider font-semibold text-muted">
        {title}
      </h2>
      {children}
    </div>
  );
}

function LegalBadge({
  label,
  legal,
}: {
  label: string;
  legal: boolean | undefined;
}) {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
        legal
          ? "bg-green-500/15 text-green-400 border-green-500/20"
          : "bg-surface text-muted border-border"
      }`}
    >
      {label}: {legal ? "✓" : "✗"}
    </span>
  );
}
