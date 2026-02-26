"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import type {
  MetricName,
  MetricSummary,
  PageMetricData,
  PageVitals,
  VitalsResponse,
} from "@/types/vitals";

// render order follows the typical CWV audit sequence
const METRIC_ORDER: MetricName[] = ["LCP", "FCP", "INP", "CLS", "TTFB"];

type MetricConfig = {
  name: MetricName;
  label: string;
  // "ms" for timing metrics, "" for dimensionless scores like CLS
  unit: "ms" | "";
  // Google's Good threshold — at or below this is green
  good: number;
  // Google's Poor threshold — above this is red, between is yellow
  poor: number;
};

const METRIC_CONFIGS: Record<MetricName, MetricConfig> = {
  LCP: { name: "LCP", label: "Largest Contentful Paint", unit: "ms", good: 2500, poor: 4000 },
  FCP: { name: "FCP", label: "First Contentful Paint",   unit: "ms", good: 1800, poor: 3000 },
  INP: { name: "INP", label: "Interaction to Next Paint", unit: "ms", good: 200,  poor: 500  },
  CLS: { name: "CLS", label: "Cumulative Layout Shift",  unit: "",   good: 0.1,  poor: 0.25 },
  TTFB:{ name: "TTFB",label: "Time to First Byte",       unit: "ms", good: 800,  poor: 1800 },
};

type Rating = "good" | "needs-improvement" | "poor";

const RATING_STYLES: Record<
  Rating,
  { bg: string; text: string; dot: string; label: string }
> = {
  "good":              { bg: "bg-green-500/10",  text: "text-green-600 dark:text-green-400",  dot: "bg-green-500",  label: "Good" },
  "needs-improvement": { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", dot: "bg-yellow-500", label: "Needs work" },
  "poor":              { bg: "bg-red-500/10",    text: "text-red-600 dark:text-red-400",       dot: "bg-red-500",    label: "Poor" },
};

/** Derives a CWV rating from a raw P75 value and the metric's thresholds. */
function getRating(value: number, config: MetricConfig): Rating {
  if (value <= config.good) return "good";
  if (value <= config.poor) return "needs-improvement";
  return "poor";
}

/**
 * Formats a metric value for display.
 * Timing metrics: values >= 1000ms get displayed as seconds (e.g. "2.4s"),
 * smaller values as milliseconds (e.g. "340ms").
 * CLS (unit = "") stays as a decimal like "0.042".
 */
function formatValue(value: number, unit: "ms" | ""): string {
  if (unit === "") return value.toFixed(3);
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;
}

// ---- MetricCard ----

interface MetricCardProps {
  config: MetricConfig;
  data: MetricSummary | undefined;
}

/** Top-level summary card for a single metric — shows P75, rating, and sample count. */
function MetricCard({ config, data }: MetricCardProps) {
  const rating = data ? getRating(data.p75, config) : null;
  const styles = rating ? RATING_STYLES[rating] : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {config.name}
          </span>
          <p className="mt-0.5 text-[11px] leading-tight text-muted/60">
            {config.label}
          </p>
        </div>

        {styles && (
          <div
            className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 ${styles.bg} ${styles.text}`}
          >
            <div className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
            <span className="text-[10px] font-semibold">{styles.label}</span>
          </div>
        )}
      </div>

      <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
        {data ? formatValue(data.p75, config.unit) : "--"}
      </p>

      <p className="mt-1 text-[11px] text-muted">
        {data
          ? `P75 · ${data.total.toLocaleString()} sample${data.total !== 1 ? "s" : ""}`
          : "No data yet"}
      </p>
    </div>
  );
}

// ---- TableCell ----

interface TableCellProps {
  data: PageMetricData | undefined;
  config: MetricConfig;
}

/** A single cell in the by-page table, color-coded by rating. */
function TableCell({ data, config }: TableCellProps) {
  if (!data) {
    return (
      <td className="px-3 py-3 text-center text-[12px] text-muted/30">--</td>
    );
  }

  const rating = getRating(data.p75, config);
  const { text } = RATING_STYLES[rating];

  return (
    <td className={`px-3 py-3 text-center tabular-nums text-[12px] font-medium ${text}`}>
      {formatValue(data.p75, config.unit)}
    </td>
  );
}

// ---- IMPROVEMENTS ----

// one card per metric explaining what's in the codebase to improve that score
const IMPROVEMENTS: { metric: MetricName; what: string; how: string }[] = [
  {
    metric: "LCP",
    what: "ISR + static pre-rendering",
    how: "High-traffic TCG/Pokedex pages use revalidate = 86400 and generateStaticParams, so the largest painted element is already in a CDN-cached HTML file before the first request arrives.",
  },
  {
    metric: "FCP",
    what: "Code splitting + streaming SSR",
    how: "next/dynamic with a ThoughtsSkeleton loading fallback splits each write-up into its own chunk. Suspense boundaries stream the skeleton immediately while data fetches resolve in parallel on the server.",
  },
  {
    metric: "INP",
    what: "Memo + stable callbacks throughout the calendar",
    how: "All four calendar view components are wrapped in React.memo. useCallback on every callback passed to them prevents memo from being silently bypassed. useMemo on layoutDayEvents keeps the overlap algorithm from running on unrelated state changes.",
  },
  {
    metric: "CLS",
    what: "Pixel-identical skeletons, no unsized content",
    how: "ThoughtsSkeleton reuses the exact same CSS module classes as the real chat bubbles, so widths and spacing are identical before and after hydration. No layout shift on reveal.",
  },
  {
    metric: "TTFB",
    what: "CDN caching on proxy routes + connection pooling",
    how: "NBA and TCG API proxy routes set public, s-maxage=300/3600 so repeat requests hit the CDN instead of origin. ISR pages skip the server entirely. Railway Postgres is accessed through a pg pool so there is no per-request connection handshake.",
  },
];

// ---- VitalsContent ----

/**
 * Protected vitals dashboard. Shows five metric cards at the top (global P75
 * per metric) and a page-by-page breakdown table below.
 *
 * All data comes from the server component so there's no client-side fetch —
 * this component just handles the presentation layer.
 */
export default function VitalsContent({ summary, byPage }: VitalsResponse) {
  const hasData = byPage.length > 0;

  return (
    <div className="min-h-dvh bg-background">
      {/* Sticky nav — mirrors the calendar events layout pattern */}
      <nav className="sticky top-0 z-20 h-14 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-5xl items-center gap-4 px-4">
          <Link
            href="/protected"
            className="flex shrink-0 items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path
                d="M5 1L1 5l4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Dashboard
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground">
            Web Vitals
          </span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Core Web Vitals
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            P75 scores from real users. Pages need at least 5 samples to appear in the table.
          </p>
        </div>

        {/* Metric summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {METRIC_ORDER.map((name) => (
            <MetricCard
              key={name}
              config={METRIC_CONFIGS[name]}
              data={summary[name]}
            />
          ))}
        </div>

        {/* By-page table */}
        <div className="mt-8">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted/50">
            By page
          </h2>

          {hasData ? (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                      Page
                    </th>
                    {METRIC_ORDER.map((name) => (
                      <th
                        key={name}
                        className="px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-muted"
                      >
                        {name}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-muted">
                      Samples
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {byPage.map((row, i) => (
                    <tr
                      key={row.page}
                      className={`border-b border-border/50 last:border-b-0 ${
                        i % 2 === 0 ? "bg-background" : "bg-surface"
                      }`}
                    >
                      <td className="px-3 py-3 text-[12px] font-medium text-foreground">
                        {row.page}
                      </td>
                      {METRIC_ORDER.map((name) => (
                        <TableCell
                          key={name}
                          data={row.metrics[name]}
                          config={METRIC_CONFIGS[name]}
                        />
                      ))}
                      <td className="px-3 py-3 text-right tabular-nums text-[12px] text-muted">
                        {row.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // shown until enough real-user data comes in
            <div className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
              <p className="text-[14px] font-medium text-foreground">No data yet</p>
              <p className="mt-1 text-[13px] text-muted">
                Visit a few pages and check back — pages need 5+ samples to show up here.
              </p>
            </div>
          )}
        </div>

        {/* Improvement notes — what's actively being done per metric */}
        <div className="mt-10">
          <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-muted/50">
            What I&apos;m doing to improve these
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {IMPROVEMENTS.map(({ metric, what, how }) => (
              <div
                key={metric}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  {metric}
                </span>
                <p className="mt-1.5 text-[13px] font-semibold leading-snug text-foreground">
                  {what}
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                  {how}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
