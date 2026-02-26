import { type RefObject } from "react";
import { useInView } from "./useInView";
import Section, { reveal } from "./Section";

/** Type pill colors for the mock filter row. */
const TYPE_PILLS: { name: string; active?: boolean }[] = [
  { name: "All", active: true },
  { name: "Fire" },
  { name: "Water" },
  { name: "Grass" },
  { name: "Electric" },
  { name: "Psychic" },
];

/** Mock Pokémon for the preview grid — just enough to read as a browser. */
const MOCK_POKEMON = [
  { id: "001", name: "Bulbasaur", type: "grass", color: "from-green-600 to-emerald-700" },
  { id: "004", name: "Charmander", type: "fire", color: "from-orange-500 to-red-600" },
  { id: "007", name: "Squirtle", type: "water", color: "from-blue-500 to-cyan-600" },
  { id: "025", name: "Pikachu", type: "electric", color: "from-yellow-400 to-amber-500" },
  { id: "039", name: "Jigglypuff", type: "fairy", color: "from-pink-400 to-rose-500" },
  { id: "054", name: "Psyduck", type: "water", color: "from-yellow-500 to-amber-600" },
];

export default function GraphQLSection() {
  const [ref, visible] = useInView();

  return (
    <Section className="bg-gradient-to-br from-indigo-950 to-neutral-900 dark:from-indigo-950 dark:to-neutral-950">
      <div ref={ref as RefObject<HTMLDivElement>}>
        <h2
          className={`text-center text-3xl font-bold tracking-tight text-white md:text-4xl ${reveal(visible)}`}
        >
          GraphQL Pokédex
        </h2>
        <p
          className={`mx-auto mt-3 max-w-lg text-center text-white/70 ${reveal(visible, "delay-100")}`}
        >
          Browse 1,000+ Pokémon via a Hasura GraphQL endpoint — typed queries,
          field selection, and a live query inspector. Plain fetch, no Apollo.
        </p>

        {/* Mock browser UI */}
        <div
          className={`mt-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm ${reveal(visible, "delay-200")}`}
        >
          {/* Mock search + query toggle */}
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <div className="flex-1 h-7 rounded-md bg-white/10" />
            <div className="h-5 w-20 rounded bg-white/10 shrink-0" />
          </div>

          {/* Mock type pills */}
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 overflow-hidden">
            {TYPE_PILLS.map((t) => (
              <span
                key={t.name}
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                  t.active
                    ? "bg-white/20 text-white border border-white/30"
                    : "border border-white/10 text-white/40"
                }`}
              >
                {t.name}
              </span>
            ))}
          </div>

          {/* Mock card grid */}
          <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-6">
            {MOCK_POKEMON.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-white/10 overflow-hidden"
              >
                <div
                  className={`bg-gradient-to-br ${p.color} flex flex-col items-center justify-end pb-1.5 pt-2`}
                  style={{ aspectRatio: "1 / 1.1" }}
                >
                  <span className="text-[8px] text-white/80 font-mono">#{p.id}</span>
                  <span className="rounded bg-black/30 px-1 text-[8px] font-bold text-white mt-0.5">
                    {p.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature highlights */}
        <div
          className={`mt-8 grid gap-4 md:grid-cols-3 ${reveal(visible, "delay-300")}`}
        >
          {[
            [
              "GraphQL Queries",
              "Field selection means the card only fetches id, name, types, and two stats — not the full 40-field REST response.",
            ],
            [
              "No Apollo",
              "Plain fetch with a 10-line wrapper. Apollo earns its cost for normalized caches and subscriptions; for a browser it's just weight.",
            ],
            [
              "Live Query Inspector",
              "A collapsible panel shows the actual GraphQL query and variables as you search and filter — updates in real time.",
            ],
          ].map(([t, d]) => (
            <div
              key={t}
              className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
            >
              <h4 className="text-sm font-semibold text-white">{t}</h4>
              <p className="mt-1 text-xs leading-relaxed text-white/60">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
