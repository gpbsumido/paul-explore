import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

const link =
  "font-medium text-primary-600 hover:underline dark:text-primary-400";

/**
 * Dev-notes write-up for the Budget feature. Summary-only (no chat), so it
 * renders as a server component with no layout JS.
 */
export default function BudgetThoughtsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Budget"
      title="Three taps to log a spend"
      intro={
        <>
          Every budgeting app I have tried dies the same way: logging a coffee
          takes a form, and after a week I stop bothering. So for{" "}
          <Link href="/budget" className={link}>
            /budget
          </Link>{" "}
          I decided the add flow <em>was</em> the product, and everything else —
          the analytics, the sharing — had to fall out of that without getting in
          its way.
        </>
      }
    >
      <section>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          The add flow is the whole thing
        </h2>
        <p className="text-muted">
          Adding an expense is a bottom sheet that springs up and asks three
          questions in order: which category, how much, and — only if you care —
          when and how to tag it. The category step is a grid of big tap targets,
          the amount step focuses the field the moment it appears, and the date
          and time default to now. The common case is a category tap, a number,
          and done. The third step exists so that logging last night&apos;s taxi
          this morning is still possible, not so that every add has to walk
          through it.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          Money is integer cents, and it caught me out
        </h2>
        <p className="text-muted">
          Everything internal is integer cents, so no stored amount is ever a
          float. The one place that matters is the edge where a typed
          &ldquo;12.34&rdquo; becomes cents, and my first version got it wrong:{" "}
          <code className={code}>1.005 * 100</code> is{" "}
          <code className={code}>100.4999…</code> in JavaScript, so it rounded a
          penny <em>down</em>. The fix was to stop multiplying and append{" "}
          <code className={code}>e2</code> to the string instead —{" "}
          <code className={code}>Number(&quot;1.005e2&quot;)</code> parses to
          exactly 100.5, which rounds the way a person expects. A test pins that
          case so I do not undo it later.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          The analytics take the clock as an argument
        </h2>
        <p className="text-muted">
          Last-30-days, the current billing cycle, and the by-category and
          by-person splits are all pure functions in{" "}
          <code className={code}>lib/budget/analytics.ts</code>. None of them
          reach for the clock — the page passes <code className={code}>now</code>{" "}
          in — so the same function serves the live page and a fixed-date test,
          and &ldquo;what does this month look like on the 3rd of next month&rdquo;
          is a unit test rather than a thing I wait a month to see. The cycle
          boundary is computed in UTC so it lines up with the stored timestamps
          no matter what timezone the browser is in.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          Inviting someone, without a server to invite them to
        </h2>
        <p className="text-muted">
          The budget lives in the browser, so &ldquo;invite someone to
          share&rdquo; had to mean something honest. The invite link carries the
          budget itself — base64url-encoded into the query string — and opening it
          loads that budget and adds you to it as a new person. It is a
          point-in-time share, not live sync, and the page says so rather than
          implying a shared ledger that updates on its own. That is the one piece
          genuinely waiting on a backend.
        </p>
        <p className="mt-3 text-muted">
          Which is why the persistence sits behind pure reducers that take their{" "}
          <code className={code}>Storage</code> as an argument, exactly like the
          updates ticket board. Swapping the browser for a real API later is a
          change in one file, and the invite link becomes a real invitation
          rather than a snapshot.
        </p>
      </section>

      <WhatsNext
        nowShipped={[
          "A three-step add flow — category, amount, optional date/time and tags — in a spring-loaded bottom sheet.",
          "A budget shared by several people with an active-person selector; each expense is attributed to whoever is active.",
          "Analytics: last-30-day total, current billing cycle with a list, and splits by category and by person.",
          "Invite links that carry the budget so two people can land on the same one before a backend exists.",
        ]}
        couldImprove={[
          "Editing a logged item, and re-tagging it after the fact — marked as later in the brief, deferred to a follow-up.",
          "Splitting a single expense across people, rather than attributing it to one — the data shape leaves room for it.",
        ]}
        upcoming={[
          "Real persistence in portfolio_api behind the BFF, dropped in where the localStorage reducers sit now, turning the invite link into live shared sync.",
        ]}
      />
    </ThoughtLayout>
  );
}
