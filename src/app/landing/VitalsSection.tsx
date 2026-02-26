import { type RefObject } from "react";
import { useInView } from "./useInView";
import Section, { reveal } from "./Section";

type Rating = "good" | "needs-improvement" | "poor";

/** Mock metric data used in the preview — values are illustrative, not live. */
const MOCK_METRICS: {
  name: string;
  value: string;
  rating: Rating;
}[] = [
  { name: "LCP",  value: "1.8s",   rating: "good" },
  { name: "FCP",  value: "0.9s",   rating: "good" },
  { name: "INP",  value: "145ms",  rating: "good" },
  { name: "CLS",  value: "0.041",  rating: "good" },
  { name: "TTFB", value: "320ms",  rating: "good" },
];

/** Mock by-page rows shown in the preview table. */
const MOCK_ROWS: { page: string; lcp: string; rating: Rating }[] = [
  { page: "/protected/vitals", lcp: "1.8s",  rating: "good" },
  { page: "/calendar",         lcp: "2.1s",  rating: "good" },
  { page: "/tcg/browse",       lcp: "2.9s",  rating: "needs-improvement" },
];

const RATING_DOT: Record<Rating, string> = {
  "good":              "bg-green-400",
  "needs-improvement": "bg-yellow-400",
  "poor":              "bg-red-400",
};

const RATING_TEXT: Record<Rating, string> = {
  "good":              "text-green-300",
  "needs-improvement": "text-yellow-300",
  "poor":              "text-red-300",
};

export default function VitalsSection() {
  const [ref, visible] = useInView();

  return (
    <Section className="bg-gradient-to-br from-green-950 to-neutral-900 dark:from-green-950 dark:to-neutral-950">
      <div ref={ref as RefObject<HTMLDivElement>}>
        <h2
          className={`text-center text-3xl font-bold tracking-tight text-white md:text-4xl ${reveal(visible)}`}
        >
          Web Vitals Dashboard
        </h2>
        <p
          className={`mx-auto mt-3 max-w-lg text-center text-white/70 ${reveal(visible, "delay-100")}`}
        >
          Real-user Core Web Vitals collected from every page load. P75 scores
          aggregated in Postgres and displayed on a protected dashboard — field
          data, not lab simulations.
        </p>

        {/* Mock dashboard UI */}
        <div
          className={`mt-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm ${reveal(visible, "delay-200")}`}
        >
          {/* Mock nav bar */}
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
            <div className="h-4 w-4 rounded bg-white/20" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white/80">
              Web Vitals
            </span>
            <div className="ml-auto h-5 w-5 rounded-full bg-white/15" />
          </div>

          {/* Mock metric cards */}
          <div className="grid grid-cols-5 gap-0 divide-x divide-white/10 border-b border-white/10">
            {MOCK_METRICS.map(({ name, value, rating }) => (
              <div key={name} className="flex flex-col items-center gap-1 px-2 py-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">
                  {name}
                </span>
                <div className="flex items-center gap-1">
                  <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${RATING_DOT[rating]}`} />
                </div>
                <span className={`text-[11px] font-bold tabular-nums ${RATING_TEXT[rating]}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Mock by-page table */}
          <div className="p-3">
            <div className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/30">
              By page
            </div>
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-2.5 py-1.5 text-left text-[9px] font-bold uppercase tracking-wider text-white/30">
                      Page
                    </th>
                    <th className="px-2.5 py-1.5 text-center text-[9px] font-bold uppercase tracking-wider text-white/30">
                      LCP
                    </th>
                    <th className="px-2.5 py-1.5 text-right text-[9px] font-bold uppercase tracking-wider text-white/30">
                      P75
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ROWS.map((row, i) => (
                    <tr
                      key={row.page}
                      className={`border-b border-white/5 last:border-b-0 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                    >
                      <td className="px-2.5 py-1.5 text-[10px] font-medium text-white/60">
                        {row.page}
                      </td>
                      <td className={`px-2.5 py-1.5 text-center text-[10px] font-semibold tabular-nums ${RATING_TEXT[row.rating]}`}>
                        {row.lcp}
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <div className={`h-1.5 w-1.5 rounded-full ${RATING_DOT[row.rating]}`} />
                          <span className="text-[9px] text-white/30">75th</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div
          className={`mt-8 grid gap-4 md:grid-cols-3 ${reveal(visible, "delay-300")}`}
        >
          {[
            [
              "Real-user Collection",
              "The web-vitals package fires each metric from real browsers over real connections. sendBeacon guarantees delivery even when the user navigates away before the metric fires.",
            ],
            [
              "P75 in Postgres",
              "PERCENTILE_CONT(0.75) aggregates the 75th percentile natively in SQL — no extra tooling. P75 is the same threshold Google uses for search ranking.",
            ],
            [
              "End-to-end Ownership",
              "BFF proxy keeps auth tokens server-side. Data lives in our own DB so the dashboard can be embedded anywhere, not just a third-party UI.",
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
