import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { Update, WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

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
          A history that compares this period to the last
        </h2>
        <p className="text-muted">
          The 30-day and billing-cycle totals answer &ldquo;where am I now&rdquo;;
          the history answers &ldquo;am I trending up&rdquo;. The same expenses
          roll up by week, month, or year into a small bar chart, and the current
          period is compared to the one before it — this month against last, and
          the same for weeks and years. It is all pure bucketing over the injected
          clock, so &ldquo;what does September look like standing in October&rdquo;
          is a unit test, not a wait.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          Sharing, in honest steps
        </h2>
        <p className="text-muted">
          The budget lives in the browser, so every level of sharing had to mean
          something true. The invite link carries the budget itself —
          base64url-encoded into the query string — and opening it loads that
          budget and adds you as a person. Making a budget public records the
          account email others use to ask to join, and the owner sees each request
          and approves or denies it. What none of it does yet is deliver a request
          across accounts on its own — that needs the backend, and the page says
          so instead of implying a shared ledger that updates itself.
        </p>
        <p className="mt-3 text-muted">
          Which is why the persistence sits behind pure reducers that take their{" "}
          <code className={code}>Storage</code> as an argument, exactly like the
          updates ticket board. Swapping the browser for a real API later is a
          change in one file, and the invite link and the join request both become
          real rather than local stand-ins.
        </p>
      </section>

      <Update
        id="update-2026-09-14-editing"
        date="September 14, 2026"
        title="The two things I said were &ldquo;later&rdquo;, done"
      >
        <p>
          The tracker could add fast but not fix a mistake, and it pinned a shared
          dinner on whoever happened to log it. Both are fixed now: any item opens
          in an edit sheet — category, amount, when, tags, or delete — and an
          expense can be split across people.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The odd cent has to go somewhere
        </h3>
        <p className="text-muted">
          A £10 dinner three ways isn&apos;t 333 + 333 + 333 — that loses a penny.
          The even split hands the leftover cents to the earliest people one at a
          time, so the parts always sum back to the whole. It is a pure function
          with a test that pins exactly that.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`const base = Math.floor(amountCents / n);
let remainder = amountCents - base * n;
return ids.map((personId) => {
  const extra = remainder > 0 ? 1 : 0;
  remainder -= extra;
  return { personId, amountCents: base + extra };
});`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A new field that changes nothing already stored
        </h3>
        <p className="text-muted">
          Splitting added an optional <code className={code}>splits</code> list to
          an expense. Every item logged before it simply doesn&apos;t have one, and
          the person breakdown reads a missing split as &ldquo;the whole amount
          belongs to its one owner&rdquo; — the old meaning, unchanged — so nothing
          had to migrate.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "A three-step add flow — category, amount, optional date/time and tags — in a spring-loaded bottom sheet.",
          "Editing any logged item, deleting it, re-tagging it, and splitting one expense across several people.",
          "A budget shared by several people with an active-person selector; each expense is attributed to whoever is active.",
          "Analytics: last-30-day total, current billing cycle with a list, splits by category and by person, and a week/month/year history that compares this period to the last.",
          "Invite links that carry the budget, plus public budgets where people ask to join with your email and you approve.",
        ]}
        couldImprove={[
          "A join request can't reach another person's browser — cross-account delivery is honestly a local stand-in until the backend lands.",
        ]}
        upcoming={[
          "Real persistence in portfolio_api behind the BFF, dropped in where the localStorage reducers sit now, turning the invite link and the join request into live shared sync.",
        ]}
      />
    </ThoughtLayout>
  );
}
