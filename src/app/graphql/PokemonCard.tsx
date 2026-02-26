import type { Pokemon } from "@/types/graphql";
import {
  spriteUrl,
  formatDexId,
  formatPokemonName,
  getStat,
  POKEMON_TYPE_COLORS,
  DEFAULT_TYPE_COLOR,
} from "@/lib/graphql";

/** Max HP value in the games — used to scale the HP bar. */
const MAX_HP = 255;

/** Max Attack value — used to scale the Attack bar. */
const MAX_ATTACK = 190;

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

/** A labelled progress bar for a single base stat. */
function StatBar({ label, value, max, color }: StatBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] text-muted">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-1 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface PokemonCardProps {
  pokemon: Pokemon;
}

/**
 * Displays a single Pokémon: dex number, sprite, name, type badges,
 * and HP + Attack bars. Stat bars are scaled to the in-game maximums
 * so the bar length is actually meaningful relative to other Pokémon.
 */
export default function PokemonCard({ pokemon }: PokemonCardProps) {
  const types = pokemon.pokemon_v2_pokemontypes.map(
    (t) => t.pokemon_v2_type.name,
  );
  const hp = getStat(pokemon, "hp");
  const attack = getStat(pokemon, "attack");

  return (
    <div className="rounded-xl border border-border bg-surface p-3 flex flex-col gap-2.5 hover:border-muted/40 transition-colors">
      {/* dex number + type badges */}
      <div className="flex items-start justify-between gap-1 min-h-[20px]">
        <span className="text-[10px] font-mono text-muted/60">
          {formatDexId(pokemon.id)}
        </span>
        <div className="flex gap-1 flex-wrap justify-end">
          {types.map((t) => (
            <span
              key={t}
              className={`text-[9px] px-1.5 py-px rounded-full font-semibold uppercase border ${POKEMON_TYPE_COLORS[t] ?? DEFAULT_TYPE_COLOR}`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* sprite */}
      <div className="flex justify-center py-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={spriteUrl(pokemon.id)}
          alt={pokemon.name}
          width={64}
          height={64}
          className="object-contain"
          loading="lazy"
        />
      </div>

      {/* name */}
      <p className="text-sm font-semibold text-foreground text-center leading-tight">
        {formatPokemonName(pokemon.name)}
      </p>

      {/* stat bars */}
      <div className="space-y-1.5 pt-0.5">
        <StatBar label="HP" value={hp} max={MAX_HP} color="bg-emerald-500" />
        <StatBar label="ATK" value={attack} max={MAX_ATTACK} color="bg-red-500" />
      </div>
    </div>
  );
}
