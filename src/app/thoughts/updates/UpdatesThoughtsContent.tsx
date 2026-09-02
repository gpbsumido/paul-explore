import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

const link =
  "font-medium text-primary-600 hover:underline dark:text-primary-400";

/**
 * Dev-notes write-up for the public Updates feature. Summary-only (no chat),
 * so it renders as a server component with no layout JS.
 */
export default function UpdatesThoughtsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Updates"
      title="A changelog people would actually read"
      intro={
        <>
          I already keep a <code className={code}>CHANGELOG.md</code> — six
          hundred kilobytes of it, one entry per release, written for me. It is
          the wrong thing to point a visitor at: it is dense, it is in the voice
          of a diff, and half of it is internal. So{" "}
          <Link href="/updates" className={link}>
            /updates
          </Link>{" "}
          is a second, deliberately smaller thing — the newsletter version — and{" "}
          <Link href="/updates/tickets" className={link}>
            the board
          </Link>{" "}
          next to it is where the next entries come from.
        </>
      }
    >
      <section>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          Two audiences, two files
        </h2>
        <p className="text-muted">
          The decision that shaped everything else was not to parse the existing
          changelog. It would have been less work up front and worse forever: I
          would have been publishing my own shorthand, and every internal note
          would have needed redacting by hand. Instead the public entries are a
          curated data file — a handful of things worth telling someone about, in
          plain language — and the internal changelog stays exactly what it is.
          The two never have to agree on tone because they are not the same
          document.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          The logic is pure, so it is testable
        </h2>
        <p className="text-muted">
          Search, category and tag filtering, and sorting are plain functions
          over arrays in <code className={code}>lib/updates/query.ts</code>. The
          two pages hold the controls&apos; state and render whatever the
          functions return. That split is the whole reason the feed&apos;s
          behaviour has tests without a browser: I can assert that a search over
          title, summary, tags and body is case-insensitive, and that the
          newest/oldest sort is stable for entries sharing a date, without
          rendering a single component.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          A ticket board with no server, said out loud
        </h2>
        <p className="text-muted">
          The board is honest about what it is. There is no backend behind it:
          a visitor&apos;s suggestions and upvotes live in their own browser,
          layered on top of the seed tickets by{" "}
          <code className={code}>lib/updates/ticketStore.ts</code>. The store
          keeps two keys — the tickets you submitted and the ids you upvoted —
          and recomputes the merged list on every read, so the seeds are never
          copied into storage and can change under a returning visitor without a
          conflict. The page says this in as many words rather than implying a
          shared board that does not exist.
        </p>
        <p className="mt-3 text-muted">
          Shaping it this way was also a bet on the future: the store takes its
          <code className={code}>Storage</code> as an argument, so swapping the
          browser for a real API later is a change in one file, not a rewrite.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          Closing the loop
        </h2>
        <p className="text-muted">
          The point of putting the two next to each other is the link between
          them. A shipped ticket names the update that closed it, and that update
          lists the ticket back. Getting those two halves out of sync would be
          the easy failure, so a data test walks every cross-link in both
          directions and fails the build if a shipped ticket points at an entry
          that does not list it — or at no entry at all.
        </p>
      </section>

      <WhatsNext
        nowShipped={[
          "Curated public entries at /updates — searchable, filterable by category and tag, sortable, with expand-in-place cards.",
          "A ticket board at /updates/tickets with status columns, upvoting, a suggestion form, and localStorage persistence.",
          "Bidirectional cross-links between shipped tickets and the entries that closed them, guarded by a data-integrity test.",
        ]}
        couldImprove={[
          "The vote is one-per-browser, not one-per-person — good enough for a portfolio, not for real prioritisation.",
          "Entries are hand-authored; a small script could lift release highlights from CHANGELOG.md into a draft to curate.",
        ]}
        upcoming={[
          "Real persistence: a public tickets table in portfolio_api behind the BFF, dropped in where the localStorage store sits now.",
          "An RSS feed for the updates page — which is, fittingly, one of the seeded tickets.",
        ]}
      />
    </ThoughtLayout>
  );
}
