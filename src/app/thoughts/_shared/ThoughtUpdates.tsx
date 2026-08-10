import type { ReactNode } from "react";

/**
 * The shared shape for a write-up that has been added to since it was written.
 *
 * The operator dashboard grew this format by hand -- a timeline nav at the top,
 * dated sections below, each anchored so the nav can jump to it -- and it works
 * well enough that every write-up should use it. Copying forty lines of markup
 * into fifty files would be the wrong way to get there, so it lives here once.
 *
 * The rule I want to hold: an update exists because something actually
 * happened. A timeline with one manufactured entry per page is worse than no
 * timeline, because it makes a page look maintained when it isn't.
 */

export type UpdateEntry = {
  /** Anchor id, matching the Update section it points at. */
  id: string;
  /** Human date, e.g. "Aug 8, 2026". */
  date: string;
  title: string;
};

const linkClass = "text-primary-600 hover:underline dark:text-primary-400";

/** Jump list for a write-up's dated updates. Renders nothing when there are none. */
export function UpdateTimeline({ entries }: { entries: UpdateEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <nav
      aria-label="Update timeline"
      className="rounded-xl border border-border bg-surface p-5"
    >
      <h2 className="text-sm font-semibold text-foreground">Timeline</h2>
      <p className="mt-1 text-xs text-muted">
        Newest first &mdash; this write-up has updates, jump to one.
      </p>
      <ol className="mt-3 space-y-2 text-sm">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 text-xs tabular-nums text-muted">
              {entry.date}
            </span>
            <a href={`#${entry.id}`} className={linkClass}>
              {entry.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** One dated continuation entry, anchored for the timeline to jump to. */
export function Update({
  id,
  date,
  title,
  children,
}: {
  id: string;
  date: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
        Update &mdash; {date}
      </p>
      <h2 className="mt-1 mb-3 text-lg font-bold">{title}</h2>
      <div className="space-y-3 text-muted">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The closing block: what the current shape actually is, where it falls short,
 * and what is genuinely queued next.
 *
 * Each part is optional and an empty one is dropped rather than rendered as a
 * heading with nothing under it -- a "coming soon" with no content is a promise
 * I have not made.
 */
export function WhatsNext({
  nowShipped,
  couldImprove,
  upcoming,
}: {
  nowShipped?: string[];
  couldImprove?: string[];
  upcoming?: string[];
}) {
  const has = (items?: string[]) => items !== undefined && items.length > 0;
  if (!has(nowShipped) && !has(couldImprove) && !has(upcoming)) return null;

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      {has(nowShipped) && (
        <>
          <h2 className="text-sm font-bold text-foreground">
            What I&apos;d do now, and what I did
          </h2>
          <div className="mt-3 text-sm text-muted">
            <Bullets items={nowShipped as string[]} />
          </div>
        </>
      )}

      {has(couldImprove) && (
        <>
          <h2 className="mt-5 text-sm font-bold text-foreground">
            Where it could go further
          </h2>
          <div className="mt-3 text-sm text-muted">
            <Bullets items={couldImprove as string[]} />
          </div>
        </>
      )}

      {has(upcoming) && (
        <>
          <h2 className="mt-5 text-sm font-bold text-foreground">
            Next on this
          </h2>
          <div className="mt-3 text-sm text-muted">
            <Bullets items={upcoming as string[]} />
          </div>
        </>
      )}
    </section>
  );
}
