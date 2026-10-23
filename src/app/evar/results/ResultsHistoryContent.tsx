"use client";

import { useId } from "react";
import Link from "next/link";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageHeader from "@/components/PageHeader";
import { LEVELS } from "@/lib/evar/levels";
import { EVAR_CASES } from "@/lib/evar/phantom";
import { summarize, useHistory, type HistoryEntry, type LevelSummary } from "@/lib/evar/history";

const link =
  "paul-touch-min inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-[14px] text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

const levelLabel = (id: string) => LEVELS.find((l) => l.id === id)?.label ?? id;
const caseTitle = (id: string) => EVAR_CASES.find((c) => c.id === id)?.title ?? id;
const when = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

/** One level's numbers. A region, so each card can be found by its level. */
function LevelCard({ summary }: { summary: LevelSummary }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="rounded-xl border border-border bg-surface p-4">
      <h3 id={headingId} className="text-[15px] font-semibold text-foreground">
        {levelLabel(summary.levelId)}
      </h3>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-[14px]">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Attempts</dt>
          <dd className="font-mono text-foreground">{summary.attempts}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Average within tolerance</dt>
          <dd className="font-mono text-foreground">{`${summary.meanWithin.toFixed(1)} of 5`}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Best points</dt>
          <dd className="font-mono text-foreground">{summary.bestTotal}</dd>
        </div>
      </dl>
    </section>
  );
}

/**
 * Measurements within tolerance, attempt by attempt. The chart is the shape;
 * the table under it carries the same numbers for anyone not looking at it.
 */
function AccuracyChart({ history }: { history: readonly HistoryEntry[] }) {
  const captionId = useId();
  const data = history.map((e, i) => ({ attempt: i + 1, within: e.within, level: levelLabel(e.levelId) }));
  return (
    <figure aria-labelledby={captionId} className="mt-8 rounded-xl border border-border bg-surface p-4">
      <figcaption id={captionId} className="text-[15px] font-semibold text-foreground">
        Measurements within tolerance over time
      </figcaption>
      <p className="mt-1 text-[13px] text-muted">Out of five, one point per finished case, oldest on the left.</p>
      <div className="mt-4 h-56" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="attempt" tick={{ fontSize: 11, fill: "var(--color-muted)" }} tickLine={false} axisLine={false} />
            <YAxis
              domain={[0, 5]}
              ticks={[0, 1, 2, 3, 4, 5]}
              tick={{ fontSize: 11, fill: "var(--color-muted)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", fontSize: 12 }}
              labelFormatter={(attempt) => `Attempt ${attempt}`}
              formatter={(value, _name, item) => [`${value} of 5 (${item.payload.level})`, "Within tolerance"]}
            />
            <Line
              type="monotone"
              dataKey="within"
              stroke="var(--color-foreground)"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

/**
 * Every EVAR case finished on this device: a card per level played, how
 * accuracy has moved, and the attempts themselves, newest first.
 */
export default function ResultsHistoryContent() {
  const history = useHistory();
  const summaries = summarize(history);
  const newestFirst = [...history].reverse();

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "EVAR Sizing", href: "/evar" }, { label: "Your results" }]}
        maxWidth="max-w-4xl"
      />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">Your EVAR results</h1>
        <p className="mt-2 max-w-prose text-[14px] text-muted">
          Every case you&apos;ve finished on this device. It&apos;s kept in this browser and never sent anywhere, so
          another browser starts empty.
        </p>

        {history.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border bg-surface p-6">
            <p className="text-[15px] text-foreground">You haven&apos;t finished a case on this device yet.</p>
            <Link href="/evar" className={`${link} mt-4`}>
              Go to the practice
            </Link>
          </div>
        ) : (
          <>
            <h2 className="mt-8 text-xl font-bold text-foreground">By level</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {summaries.map((s) => (
                <LevelCard key={s.levelId} summary={s} />
              ))}
            </div>

            {history.length > 1 ? (
              <AccuracyChart history={history} />
            ) : (
              <p className="mt-8 text-[14px] text-muted">One case so far. The chart starts at two.</p>
            )}

            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <caption className="mb-2 text-left text-xl font-bold text-foreground">Every attempt</caption>
                <thead>
                  <tr className="text-[12px] text-muted">
                    <th scope="col" className="py-1.5 pr-3 font-medium">Finished</th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">Level</th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">Case</th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">Within tolerance</th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">Stars</th>
                    <th scope="col" className="py-1.5 font-medium">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {newestFirst.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="py-2 pr-3 text-muted">{when.format(e.finishedAt)}</td>
                      <td className="py-2 pr-3">{levelLabel(e.levelId)}</td>
                      <th scope="row" className="py-2 pr-3 font-normal text-foreground">
                        {caseTitle(e.caseId)}
                        {e.timedOut ? <span className="ml-2 text-[12px] text-muted">(timed out)</span> : null}
                      </th>
                      <td className="py-2 pr-3 font-mono">{`${e.within} of 5`}</td>
                      <td className="py-2 pr-3 font-mono">{`${e.stars} of 3`}</td>
                      <td className="py-2 font-mono">{e.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Link href="/evar" className={`${link} mt-8`}>
              Back to the practice
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
