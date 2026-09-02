"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { UPDATE_ENTRIES } from "@/lib/updates/entries.data";
import { SEED_TICKETS } from "@/lib/updates/tickets.data";
import {
  searchEntries,
  filterEntriesByCategory,
  sortEntries,
  collectTags,
} from "@/lib/updates/query";
import {
  UPDATE_CATEGORIES,
  UPDATE_CATEGORY_LABELS,
  type UpdateCategory,
  type UpdateEntry,
} from "@/lib/updates/types";

/** A small accent per category, as a CSS token. Never the only signal — the
 * label sits beside it. */
const CATEGORY_VAR: Record<UpdateCategory, string> = {
  feature: "var(--color-update-feature)",
  improvement: "var(--color-update-improvement)",
  fix: "var(--color-update-fix)",
  experiment: "var(--color-update-experiment)",
};

/** A faint tint of a category accent, for a badge background. */
const tint = (cssVar: string): string =>
  `color-mix(in srgb, ${cssVar} 16%, transparent)`;

const chipClass = (active: boolean): string =>
  [
    "rounded-full px-3 py-1 text-[13px] font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
    active
      ? "bg-foreground text-background"
      : "bg-foreground/5 text-muted hover:text-foreground",
  ].join(" ");

/** A ticket id -> its title, so an entry can name the tickets it closed. */
const TICKET_TITLE = new Map(SEED_TICKETS.map((t) => [t.id, t.title]));

function EntryCard({ entry }: { entry: UpdateEntry }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <article className="glass-card rounded-xl p-0" style={{ borderLeftWidth: 3, borderLeftColor: CATEGORY_VAR[entry.category] }}>
      <h2 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full flex-col items-start gap-1.5 rounded-xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <span className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
            <time dateTime={entry.date} className="tabular-nums">
              {entry.date}
            </time>
            <span aria-hidden="true">·</span>
            <span className="rounded bg-foreground/8 px-1.5 py-0.5 font-semibold text-foreground">
              v{entry.version}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold text-foreground"
              style={{ backgroundColor: tint(CATEGORY_VAR[entry.category]) }}
            >
              {UPDATE_CATEGORY_LABELS[entry.category]}
            </span>
          </span>
          <span className="text-[17px] font-semibold leading-snug text-foreground">
            {entry.title}
          </span>
          <span className="text-[14px] leading-relaxed text-muted">
            {entry.summary}
          </span>
        </button>
      </h2>

      {open ? (
        <div id={panelId} className="space-y-3 px-4 pb-4 text-[14px] leading-relaxed text-foreground">
          {entry.body.map((para, i) => (
            <p key={i} className="text-muted">
              {para}
            </p>
          ))}

          <div className="flex flex-wrap gap-1.5 pt-1">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-foreground/5 px-2 py-0.5 text-[12px] text-muted"
              >
                #{tag}
              </span>
            ))}
          </div>

          {entry.resolvedTicketIds.length > 0 ? (
            <p className="pt-1 text-[13px] text-muted">
              Closed{" "}
              {entry.resolvedTicketIds.map((id, i) => (
                <span key={id}>
                  {i > 0 ? ", " : ""}
                  <Link
                    href={`/updates/tickets#ticket-${id}`}
                    className="font-medium text-primary-600 hover:underline dark:text-primary-400"
                  >
                    {TICKET_TITLE.get(id) ?? id}
                  </Link>
                </span>
              ))}
              .
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/**
 * The public Updates feed: a curated changelog you can search, filter by
 * category or tag, sort, and expand. All the filtering is pure (see
 * lib/updates/query), so this component only holds the controls' state and
 * renders the derived slice.
 */
export default function UpdatesContent() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<UpdateCategory | "all">("all");
  const [tag, setTag] = useState<string | null>(null);
  const [order, setOrder] = useState<"newest" | "oldest">("newest");

  const tags = useMemo(() => collectTags(UPDATE_ENTRIES), []);

  const visible = useMemo(() => {
    let list = filterEntriesByCategory(UPDATE_ENTRIES, category);
    if (tag) list = list.filter((e) => e.tags.includes(tag));
    list = searchEntries(list, query);
    return sortEntries(list, order);
  }, [category, tag, query, order]);

  return (
    <PageShell colorA="var(--color-feature-updates)">
      <PageHeader
        breadcrumbs={[
          { label: "Hub", href: "/" },
          { label: "Updates" },
        ]}
        maxWidth="max-w-3xl"
      />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <header className="mb-8">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
            What&apos;s new
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Updates
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            A running note of what shipped and why, in plain language. Search it,
            filter by what kind of change it was, and open any entry for the
            longer story. Got an idea?{" "}
            <Link
              href="/updates/tickets"
              className="font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              Suggest it on the board
            </Link>
            .
          </p>
        </header>

        <div className="mb-6 space-y-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search updates"
            placeholder="Search updates…"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[15px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="sr-only">Filter by category</span>
            <button
              type="button"
              aria-pressed={category === "all"}
              onClick={() => setCategory("all")}
              className={chipClass(category === "all")}
            >
              All
            </button>
            {UPDATE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={category === cat}
                onClick={() => setCategory(cat)}
                className={chipClass(category === cat)}
              >
                {UPDATE_CATEGORY_LABELS[cat]}
              </button>
            ))}

            <span className="mx-1 hidden h-4 w-px bg-border sm:inline-block" />

            <button
              type="button"
              onClick={() => setOrder((o) => (o === "newest" ? "oldest" : "newest"))}
              className="rounded-full bg-foreground/5 px-3 py-1 text-[13px] font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {order === "newest" ? "Newest first" : "Oldest first"}
            </button>
          </div>

          {tags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="sr-only">Filter by tag</span>
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={tag === t}
                  onClick={() => setTag((cur) => (cur === t ? null : t))}
                  className={[
                    "rounded-full px-2 py-0.5 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                    tag === t
                      ? "bg-primary-600 text-white"
                      : "bg-foreground/5 text-muted hover:text-foreground",
                  ].join(" ")}
                >
                  #{t}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <p aria-live="polite" className="mb-4 text-[13px] text-muted">
          {visible.length} {visible.length === 1 ? "update" : "updates"}
        </p>

        {visible.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-8 text-center text-[14px] text-muted">
            No updates match your search.
          </p>
        ) : (
          <div className="space-y-3">
            {visible.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </main>
    </PageShell>
  );
}
