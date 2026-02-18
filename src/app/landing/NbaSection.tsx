import { type RefObject } from "react";
import { useInView } from "./useInView";
import Section, { reveal } from "./Section";

function StatRow({
  name,
  team,
  pts,
  reb,
  ast,
  odd,
}: {
  name: string;
  team: string;
  pts: string;
  reb: string;
  ast: string;
  odd?: boolean;
}) {
  return (
    <tr className={odd ? "bg-surface-raised/50" : ""}>
      <td className="px-3 py-2 text-sm font-medium text-foreground">{name}</td>
      <td className="px-3 py-2 text-sm text-muted">{team}</td>
      <td className="px-3 py-2 text-right text-sm font-semibold text-primary-500">
        {pts}
      </td>
      <td className="px-3 py-2 text-right text-sm text-foreground">{reb}</td>
      <td className="px-3 py-2 text-right text-sm text-foreground">{ast}</td>
    </tr>
  );
}

export default function NbaSection() {
  const [ref, visible] = useInView();

  return (
    <Section className="bg-gradient-to-br from-secondary-600 to-primary-700 dark:from-secondary-900 dark:to-primary-950">
      <div ref={ref as RefObject<HTMLDivElement>}>
        <h2
          className={`text-center text-3xl font-bold tracking-tight text-white md:text-4xl ${reveal(visible)}`}
        >
          NBA Stats
        </h2>
        <p
          className={`mx-auto mt-3 max-w-lg text-center text-white/70 ${reveal(visible, "delay-100")}`}
        >
          Live player statistics proxied through the API layer with batch
          loading and error recovery.
        </p>

        {/* mock table */}
        <div
          className={`mt-10 overflow-hidden rounded-xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-sm ${reveal(visible, "delay-200")}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-white">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/60">
                  <th className="px-3 py-3">Player</th>
                  <th className="px-3 py-3">Team</th>
                  <th className="px-3 py-3 text-right">PTS</th>
                  <th className="px-3 py-3 text-right">REB</th>
                  <th className="px-3 py-3 text-right">AST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <StatRow
                  name="Luka Doncic"
                  team="LAL"
                  pts="28.4"
                  reb="8.3"
                  ast="8.1"
                  odd
                />
                <StatRow
                  name="Jayson Tatum"
                  team="BOS"
                  pts="27.0"
                  reb="8.5"
                  ast="4.6"
                />
                <StatRow
                  name="Shai Gilgeous"
                  team="OKC"
                  pts="31.2"
                  reb="5.5"
                  ast="6.0"
                  odd
                />
                <StatRow
                  name="Nikola Jokic"
                  team="DEN"
                  pts="26.3"
                  reb="12.4"
                  ast="9.0"
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* feature highlights */}
        <div
          className={`mt-8 grid gap-4 md:grid-cols-3 ${reveal(visible, "delay-300")}`}
        >
          {[
            [
              "Live API Proxy",
              "Server-side proxy hides API keys from the client.",
            ],
            [
              "Batch Loading",
              "Multiple players fetched in parallel with loading states.",
            ],
            [
              "Error Handling",
              "Granular error recovery per player, not per page.",
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
