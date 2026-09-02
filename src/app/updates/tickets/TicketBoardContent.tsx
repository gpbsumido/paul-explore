"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { useTicketBoard } from "./useTicketBoard";
import {
  searchTickets,
  filterTicketsByType,
  ticketsByStatus,
} from "@/lib/updates/query";
import { UPDATE_ENTRIES } from "@/lib/updates/entries.data";
import { TICKET_TYPES, type Ticket, type TicketType } from "@/lib/updates/types";

/** Entry id -> title, so a shipped ticket can name where it landed. */
const ENTRY_TITLE = new Map(UPDATE_ENTRIES.map((e) => [e.id, e.title]));

const TYPE_LABEL: Record<TicketType, string> = { feature: "Feature", bug: "Bug" };
const TYPE_VAR: Record<TicketType, string> = {
  feature: "var(--color-update-feature)",
  bug: "var(--color-ticket-bug)",
};

/** A faint tint of a type accent, for a badge background. */
const tint = (cssVar: string): string =>
  `color-mix(in srgb, ${cssVar} 16%, transparent)`;

function TicketCard({
  ticket,
  voted,
  onVote,
}: {
  ticket: Ticket;
  voted: boolean;
  onVote: (id: string) => void;
}) {
  return (
    <article
      id={`ticket-${ticket.id}`}
      className="glass-card scroll-mt-20 rounded-lg p-3"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span
          className="rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-foreground"
          style={{ backgroundColor: tint(TYPE_VAR[ticket.type]) }}
        >
          {TYPE_LABEL[ticket.type]}
        </span>
        <button
          type="button"
          aria-pressed={voted}
          aria-label={`Upvote ${ticket.title}`}
          onClick={() => onVote(ticket.id)}
          className={[
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[13px] font-semibold tabular-nums transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
            voted
              ? "bg-primary-600 text-white"
              : "bg-foreground/5 text-muted hover:text-foreground",
          ].join(" ")}
        >
          <span aria-hidden="true">▲</span>
          <span>{ticket.votes}</span>
        </button>
      </div>

      <h3 className="text-[14px] font-semibold leading-snug text-foreground">
        {ticket.title}
      </h3>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">{ticket.body}</p>

      {ticket.status === "shipped" && ticket.resolvedByEntryId ? (
        <Link
          href={`/updates#entry-${ticket.resolvedByEntryId}`}
          className="mt-2 inline-block text-[13px] font-medium text-primary-600 hover:underline dark:text-primary-400"
        >
          Shipped in “{ENTRY_TITLE.get(ticket.resolvedByEntryId) ?? "an update"}” →
        </Link>
      ) : null}
    </article>
  );
}

function SuggestForm({
  onAdd,
  onCancel,
}: {
  onAdd: (input: { type: TicketType; title: string; body: string }) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<TicketType>("feature");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const titleId = useId();
  const bodyId = useId();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    onAdd({ type, title, body });
  };

  return (
    <form
      onSubmit={submit}
      className="glass-card mb-6 space-y-3 rounded-xl p-4"
      aria-label="Suggest an idea"
    >
      <fieldset className="flex items-center gap-4">
        <legend className="sr-only">Type</legend>
        {TICKET_TYPES.map((t) => (
          <label key={t} className="flex items-center gap-1.5 text-[14px] text-foreground">
            <input
              type="radio"
              name="ticket-type"
              value={t}
              checked={type === t}
              onChange={() => setType(t)}
            />
            {TYPE_LABEL[t]}
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor={titleId} className="mb-1 block text-[13px] font-medium text-foreground">
          Title
        </label>
        <input
          id={titleId}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[15px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        />
      </div>

      <div>
        <label htmlFor={bodyId} className="mb-1 block text-[13px] font-medium text-foreground">
          Details
        </label>
        <textarea
          id={bodyId}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={3}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[15px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-lg bg-primary-600 px-3 py-1.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          Add suggestion
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-[14px] font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          Cancel
        </button>
      </div>

      <p className="text-[12px] text-muted">
        Saved in your browser — this is a front-end demo of the flow, so your
        suggestions and votes stay on this device.
      </p>
    </form>
  );
}

/**
 * The public ticket board: seeded requests grouped into status columns, with a
 * visitor's own submissions and upvotes layered on top from their browser (see
 * lib/updates/ticketStore). Shipped tickets link back to the update that
 * closed them, closing the loop with the changelog feed.
 */
export default function TicketBoardContent() {
  const { tickets, votedIds, add, vote } = useTicketBoard();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TicketType | "all">("all");
  const [showForm, setShowForm] = useState(false);

  const voted = useMemo(() => new Set(votedIds), [votedIds]);

  const columns = useMemo(() => {
    const narrowed = searchTickets(filterTicketsByType(tickets, type), query);
    return ticketsByStatus(narrowed);
  }, [tickets, type, query]);

  const handleAdd = (input: { type: TicketType; title: string; body: string }) => {
    add(input);
    setShowForm(false);
  };

  return (
    <PageShell colorA="var(--color-feature-updates)">
      <PageHeader
        breadcrumbs={[
          { label: "Hub", href: "/" },
          { label: "Updates", href: "/updates" },
          { label: "Board" },
        ]}
        maxWidth="max-w-5xl"
      />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <header className="mb-8">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
            Suggestions &amp; bugs
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ticket board
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            What people have asked for and what&apos;s wrong, as it moves from an
            idea to shipped. Upvote what you want, or add your own — the ones that
            ship link back to the{" "}
            <Link
              href="/updates"
              className="font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              update
            </Link>{" "}
            that closed them.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search tickets"
            placeholder="Search tickets…"
            className="min-w-[12rem] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-[15px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          />
          <div className="flex items-center gap-1.5" role="group" aria-label="Filter by type">
            {(["all", ...TICKET_TYPES] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={type === t}
                onClick={() => setType(t)}
                className={[
                  "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                  type === t
                    ? "bg-foreground text-background"
                    : "bg-foreground/5 text-muted hover:text-foreground",
                ].join(" ")}
              >
                {t === "all" ? "All" : TYPE_LABEL[t]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            aria-expanded={showForm}
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Suggest an idea
          </button>
        </div>

        {showForm ? (
          <SuggestForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <section key={column.status} aria-label={column.label} className="space-y-2.5">
              <h2 className="flex items-center justify-between text-[12px] font-bold uppercase tracking-[0.12em] text-muted">
                {column.label}
                <span className="rounded-full bg-foreground/8 px-1.5 py-0.5 text-[11px] tabular-nums text-muted">
                  {column.tickets.length}
                </span>
              </h2>
              {column.tickets.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-[12px] text-muted">
                  Nothing here yet.
                </p>
              ) : (
                column.tickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    voted={voted.has(ticket.id)}
                    onVote={vote}
                  />
                ))
              )}
            </section>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
