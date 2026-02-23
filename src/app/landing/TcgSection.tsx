import { type RefObject } from "react";
import { useInView } from "./useInView";
import Section, { reveal } from "./Section";

const MOCK_CARDS = [
  { name: "Charizard", color: "from-orange-500 to-red-600" },
  { name: "Pikachu", color: "from-yellow-400 to-amber-500" },
  { name: "Mewtwo", color: "from-purple-500 to-violet-700" },
  { name: "Blastoise", color: "from-blue-500 to-cyan-600" },
  { name: "Gengar", color: "from-purple-700 to-indigo-800" },
  { name: "Eevee", color: "from-amber-400 to-orange-400" },
];

const TYPE_PILLS = ["Fire", "Water", "Grass", "Lightning", "Psychic"];

export default function TcgSection() {
  const [ref, visible] = useInView();

  return (
    <Section className="bg-gradient-to-br from-neutral-900 to-red-950 dark:from-neutral-950 dark:to-red-950">
      <div ref={ref as RefObject<HTMLDivElement>}>
        <h2
          className={`text-center text-3xl font-bold tracking-tight text-white md:text-4xl ${reveal(visible)}`}
        >
          Pokémon TCG Browser
        </h2>
        <p
          className={`mx-auto mt-3 max-w-lg text-center text-white/70 ${reveal(visible, "delay-100")}`}
        >
          Full card browser with infinite scroll, URL-synced filters, per-set
          grids, and deep card detail — built on the TCGdex SDK.
        </p>

        {/* Mock browser UI */}
        <div
          className={`mt-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm ${reveal(visible, "delay-200")}`}
        >
          {/* Mock filter bar */}
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <div className="h-7 w-36 rounded-md bg-white/10 shrink-0" />
            <div className="h-4 w-px bg-white/20 shrink-0" />
            <div className="flex gap-2 overflow-hidden">
              {TYPE_PILLS.map((t) => (
                <span
                  key={t}
                  className={`shrink-0 rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    t === "Fire"
                      ? "bg-red-500/30 text-red-300 border border-red-500/30"
                      : "border border-white/10 text-white/40"
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Mock card grid */}
          <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-6">
            {MOCK_CARDS.map((card) => (
              <div
                key={card.name}
                className="overflow-hidden rounded-lg border border-white/10"
              >
                <div
                  className={`bg-gradient-to-br ${card.color} flex items-end justify-start p-2`}
                  style={{ aspectRatio: "2.5/3.5" }}
                >
                  <span className="rounded bg-black/30 px-1 text-[9px] font-bold text-white">
                    {card.name}
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
              "Infinite Scroll",
              "IntersectionObserver sentinel loads next pages as you scroll — reconnects after each fetch so wide viewports never stall.",
            ],
            [
              "URL-Synced State",
              "Search, type filter, and page number live in the URL. Shareable, bookmarkable, and back/forward navigable.",
            ],
            [
              "Server / Client Split",
              "Set metadata fetched server-side via TCGdex SDK. Paginated card grids are client components with Suspense boundaries.",
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
