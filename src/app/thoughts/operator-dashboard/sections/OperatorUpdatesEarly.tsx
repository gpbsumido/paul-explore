import Link from "next/link";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

/** Dated continuation entries (earlier half). */
export function OperatorUpdatesEarly() {
  return (
    <>
      <section
        id="update-2026-08-05-maintainability"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 5, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          A maintainability pass: factoring the read hooks and splitting this
          write-up
        </h2>
        <p className="text-muted">
          I ran a whole-project review looking for bad engineering, overfit
          architecture, and anything that made the code harder than it needs to
          be &mdash; the full pass and its reasoning live in{" "}
          <Link
            href="/thoughts/refactor-pass"
            className="text-primary-600 hover:underline dark:text-primary-400"
          >
            the refactor write-up
          </Link>
          . The operator subsystem was the densest footprint in the repo, so two
          of its findings landed here.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Five read hooks that were the same hook five times
        </h3>
        <p className="text-muted">
          <code className={code}>useOperatorSales</code>,{" "}
          <code className={code}>useOperatorStores</code>,{" "}
          <code className={code}>useOperatorInventory</code>,{" "}
          <code className={code}>useOperatorActivity</code> and{" "}
          <code className={code}>useOperatorPlanogram</code> each wrote the same
          React Query wrapper &mdash; fetch, throw on a bad response,{" "}
          <code className={code}>schema.parse</code>, expose{" "}
          <code className={code}>{"{ data, loading, error }"}</code> &mdash;
          differing only in the key, the URL, the schema, the response field,
          and the error text. That&apos;s now one{" "}
          <code className={code}>useOperatorResource</code> factory, and each
          hook is an ~8-line adapter over it.
        </p>
        <p className="text-muted">
          <strong>The how, and the two decisions that mattered.</strong> Each
          adapter keeps its own public return shape (
          <code className={code}>{"{ sales }"}</code>,{" "}
          <code className={code}>{"{ items }"}</code>) so not a single component
          that consumes them had to change &mdash; the refactor stops at the
          hook boundary. The response field is passed as a{" "}
          <code className={code}>select</code> function, not a magic string,
          because a string key quietly assumes every endpoint has the same
          envelope shape; a function lets an odd one out map itself without
          breaking the abstraction. And the polling tiers stay as explicit
          per-hook config rather than a shared default: they&apos;re{" "}
          <em>intentional</em> &mdash; 15s for urgent alerts, 30s for store
          status, 60s for inventory, none for historical activity &mdash; and
          hiding them in the factory would erase a real decision. The tradeoff I
          accepted is a slightly larger call site per hook in exchange for the
          tiers staying legible. The existing hook contract test passed
          unchanged, which is how I know the behaviour held.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          This write-up was 5,113 lines in one file
        </h3>
        <p className="text-muted">
          This page had grown into the single biggest file in the repo &mdash;
          the chat view plus forty summary sections in one component, too big to
          read or edit in a single pass and genuinely expensive for an AI to
          load just to touch one paragraph. It&apos;s now a 32-line orchestrator
          plus five focused section files (the chat, the timeline and overview,
          the original build write-up, and the dated updates in two halves).
        </p>
        <p className="text-muted">
          <strong>Why it was safe.</strong> I cut only at{" "}
          <code className={code}>{"<section>"}</code> sibling boundaries, so
          every chunk is balanced JSX and no prose was edited &mdash; the
          content is byte-identical, just relocated. The proof is that this
          page&apos;s test suite is unusually strict (72 assertions on exact
          wording, the order of the sections, and that every timeline and index
          anchor still resolves), and it passed completely unchanged after the
          split. A pure rearrangement with no behaviour change is exactly the
          kind of review-churn that earns its own PR rather than riding along
          with logic, so it did. The remaining 1,000&ndash;2,000-line write-ups
          are the same job for another day.
        </p>
      </section>

      <section
        id="update-2026-08-04-review-fixes"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 4, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Reviewing my own work, and fixing what the review found
        </h2>
        <p className="text-muted">
          After wiring the features to the real backend I went back over the
          whole thing the way I&apos;d review someone else&apos;s stack, and it
          turned up real problems &mdash; some of which I&apos;d shipped.
          Writing them down is only worth anything if the ones that can be fixed
          get fixed, so here is what I found and what I did about it.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The shrink report was blank against the real backend
        </h3>
        <p className="text-muted">
          The worst one. The shrink report reconciles completed restock counts,
          the app&apos;s seed generates them, and the <em>database</em> seed did
          not &mdash; only stores, inventory, sales and alerts. So the feature
          I&apos;d done the most groundwork for rendered a perfectly honest
          empty page against the very backend I&apos;d just built for it, while
          showing rich data on the seed fallback. A feature that only works on
          the fallback is not wired up. The API&apos;s seed builder now
          generates the same completed-session history the app does &mdash; a
          shortfall, a reasoned removal, a skipped count, a clean count, scaled
          per store &mdash; and two tests pin that the seed carries real
          unexplained shrink to find.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The same arithmetic in two repos, and nothing checking it agreed
        </h3>
        <p className="text-muted">
          To make the live numbers equal the seed ones I&apos;d mirrored the
          app&apos;s models into the API by hand. That is a deliberate
          duplication with a precedent here, but the precedent came with a test
          pinning the copies agree, and I hadn&apos;t written one. The only
          thing that would have caught a drift was the heavy live-backend E2E.
          So both repos now carry a parity test that runs the same canonical
          scenarios against the same expected outputs, the literals identical on
          both sides. Change a formula in one repo and its parity test fails
          against the shared expectation, in milliseconds instead of a
          ten-minute browser run. The honest fix for the duplication is one
          shared package; the parity test is the cheaper guard that buys most of
          the safety today, and I said so.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Two smaller things the review caught
        </h3>
        <p className="text-muted">
          Six of the seven stacked frontend PRs were getting no CI at all,
          because this app&apos;s workflow only triggers on pull requests into{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            develop
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            main
          </code>
          , and a stacked PR targets a feature branch. The API repo already
          triggers on every branch; the app now does too. And the
          product-performance loader had been mapping a range id to a day count
          and back to call the API, which is lossy the moment a caller passes a
          window that isn&apos;t 7, 30 or 90 &mdash; it passes the range id
          straight through now, so the two sides can&apos;t disagree on what
          &ldquo;30d&rdquo; means.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          What I deliberately did not &ldquo;fix&rdquo;
        </h3>
        <p className="text-muted">
          Not every finding wants code. The platform fee assumes one unit per
          store because there is no unit count in the schema; a migration to add
          one is more machinery than a demo&apos;s fee nuance earns, so I made
          the assumption an explicit, named constant in both repos and left it
          at that &mdash; honest and one line to change later, rather than
          gold-plated now. Revenue Protect stays out until there is
          failed-transaction data to reconcile it from. &ldquo;Average sold per
          day&rdquo; stays units-over-window until there is stock-availability
          history to make it units-while-in-stock. The shrink query loads raw
          lines and groups in the app, which is fine at demo scale and worth
          pushing into SQL only at fleet scale. And the stack ended up seven
          deep for features that are mostly independent &mdash; a structure
          I&apos;d avoid next time, but not one worth unpicking after the fact.
          Knowing which findings to leave documented is the other half of a
          review.
        </p>
      </section>
      <section
        id="update-2026-08-04-live-backend"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 4, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          The five features had no backend, so I gave them one
        </h2>
        <p className="text-muted">
          An honest admission first: the five features I&apos;d just built
          &mdash; the planner, product performance, shrink, search and finance
          &mdash; all computed their numbers in the BFF from the in-memory seed.
          Every one carried a comment promising a production build would compute
          it in SQL, and none of them did. Unlike the reads that came before
          them, they never even tried the real API; they read the seed directly,
          with no live path at all. So this pass closes that gap for real,
          across both repos.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Five SQL endpoints, mirroring the models that already existed
        </h3>
        <p className="text-muted">
          In the API, each feature becomes a grouped query: benchmarks and
          finance sum sales in one pass, product performance groups by product
          within a window, shrink joins completed restock lines to their store
          and the item&apos;s price, search returns stores plus distinct
          products. The trick was not writing the SQL &mdash; it was making the
          live numbers equal the seed ones. So the API grew a pure{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            aggregations
          </code>{" "}
          module that mirrors the app&apos;s pure models line for line, fed by
          the grouped rows. The database does the fan-in; the same arithmetic
          shapes the result on both sides, so switching a feature from seed to
          live cannot change what it shows.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The fallback is what makes it safe to ship in either order
        </h3>
        <p className="text-muted">
          On the app side, each loader stops reading the seed directly and does
          what every other operator read does: try the API, and on any failure
          log the fallback and serve the seed. That one pattern is why the two
          pull requests don&apos;t have to land together. If the app ships
          first, its loaders 404 against the older API and fall back &mdash; the
          demo is unchanged. If the API ships first, nothing calls the new
          routes yet. Only once both are live does the data become real, and no
          intermediate state is broken. The paired branches share a name, so the
          app&apos;s live-backend CI builds the matching API branch from source
          and drives the whole thing against a real Postgres, which is the only
          tier that ever parses this SQL before production.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The contract is the schema, on both ends
        </h3>
        <p className="text-muted">
          The response shape is not described twice and hoped to match. The API
          returns it, and the BFF parses it through the exact Zod schema the
          feature already defined, so a drift in either repo surfaces as a
          validation error the fallback catches rather than as quietly wrong
          numbers on a chart. Which is the same lesson this whole page keeps
          arriving at: a boundary you can&apos;t see is a boundary that&apos;s
          lying to you, so make it speak.
        </p>
      </section>
      <section
        id="update-2026-08-04-csv"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 4, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          A CSV export, and the comma that breaks everything
        </h2>
        <p className="text-muted">
          The last stacked feature is the smallest, and it is the one whose bug
          would be quietest: a &ldquo;Download CSV&rdquo; on the product
          performance page, so the numbers can leave the app and land in a
          bookkeeper&apos;s spreadsheet. Export is where a dashboard stops being
          a wall someone reads and starts being data someone uses.
        </p>
        <p className="mt-3 text-muted">
          The reason it is a tested module and not a one-line{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            join(&quot;,&quot;)
          </code>{" "}
          is the failure mode. A product called &ldquo;Nuts, Mixed&rdquo; run
          through a naive join puts a comma in the middle of a row, and every
          column after it shifts one to the right &mdash; silently, with no
          error, in a file nobody opens until it is wrong in someone else&apos;s
          system. So the serializer follows RFC 4180: any field with a comma, a
          quote or a newline is wrapped in quotes and its inner quotes doubled,
          and five tests hold it to that. The download itself is a Blob and an
          anchor click, but the escaping is the part worth writing down, because
          it is the part that fails without telling you.
        </p>
        <p className="mt-3 text-muted">
          That closes the arc I set out to build from the Micromart scan: plan a
          location, see what sells, find what walks, jump anywhere, read what
          landed, and take it with you. Six stacked pull requests, each merging
          onto the last.
        </p>
      </section>
      <section
        id="update-2026-08-04-finance"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 4, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          What actually landed, and the fee that ties two features together
        </h2>
        <p className="text-muted">
          The fifth stacked feature is finance: weekly payouts at{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            /operator/finance
          </code>
          , reconciled from real sales. Gross revenue is the number an operator
          already knows; the useful one is what lands after fees, and the useful
          skill is showing the fees rather than folding them into a single
          figure. A slow week and an expensive week can net to the same payout,
          and an operator needs to tell them apart.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          One fee model, two features, no drift
        </h3>
        <p className="text-muted">
          The interesting part is where the fee numbers come from. The location
          planner already projects payback using a transaction cut and a
          platform fee; the finance page pays out using the same two. If those
          lived in two places they would drift, and the planner would quote a
          return the finance page never delivers. So there is one{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            FEE_MODEL
          </code>
          , imported by both. The number you are sold on and the number you are
          paid are the same number by construction, which is the kind of
          consistency that is invisible when it holds and infuriating when it
          doesn&apos;t.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The line I did not fake
        </h3>
        <p className="text-muted">
          Micromart&apos;s finance page has a Revenue Protect line &mdash; money
          auto-credited back for failed transactions and card declines. I left
          it out, on purpose. The demo&apos;s sales are all successful sales;
          there is no record of a decline anywhere in the data, so any
          &ldquo;protected revenue&rdquo; figure I printed would be a number I
          invented and dressed as a measurement. That is exactly the thing this
          whole project refuses to do. Revenue Protect is honest to build the
          day there is failed-transaction data to reconcile it from, and
          dishonest to fake before then, so it is a labelled gap rather than a
          fabricated total.
        </p>
      </section>
      <section
        id="update-2026-08-04-search"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 4, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Find anything, and the keyboard problem underneath it
        </h2>
        <p className="text-muted">
          Micromart&apos;s platform has a global search &mdash; find any store,
          product, cabinet or promotion from one box, fast. An operator running
          thirty stores does not want to scroll a grid to reach one; they want
          to type three letters and be there. So the fourth stacked feature is a
          quick-search at{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            /operator/search
          </code>{" "}
          over stores, fleet products and the operator tools themselves.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The ranker is small on purpose
        </h3>
        <p className="text-muted">
          No search library. The whole matcher is a scoring function: a prefix
          beats a word-boundary hit beats any substring beats a loose
          subsequence, and a match in the category or status counts for a
          fraction, never enough to outrank a real hit on the name. That last
          tier &mdash; subsequence &mdash; is what makes fast typing feel right:
          &ldquo;cbc&rdquo; finds Cold Brew Coffee because the letters appear in
          order, even though it is nobody&apos;s substring. A dependency would
          have done the same thing less legibly, and this is thirty lines I can
          test exhaustively.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Where the accessibility actually lives
        </h3>
        <p className="text-muted">
          A search box that only works with a mouse is half a feature, and the
          honest version of keyboard support here is the ARIA combobox pattern,
          which has a counter-intuitive core: as you arrow through the results,
          focus never leaves the input. The input carries{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            aria-activedescendant
          </code>{" "}
          pointing at the highlighted option, so a screen reader announces the
          moving selection while the caret stays put and you can keep typing. It
          is the right pattern precisely because the naive one &mdash; moving
          DOM focus onto each result &mdash; breaks the moment the user types
          another character.
        </p>
        <p className="mt-3 text-muted">
          That same fact settled a lint complaint honestly rather than by
          reflex. The result rows have a mouse click but no key handler, which
          the accessibility linter flags. The reflex is to bolt a key handler
          onto each row; the truth is that focus never lands on a row, so a key
          handler there could never fire &mdash; the keyboard lives on the
          input, where it belongs. So the rule is suppressed on that line with a
          comment saying exactly why, which is the difference between silencing
          a warning and answering it.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A component that cannot navigate
        </h3>
        <p className="text-muted">
          The combobox has no idea what a route is. It ranks, highlights, and
          calls{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            onSelect
          </code>{" "}
          with the chosen item; a thin page wrapper is the only thing that turns
          a pick into a route change. That split is not ceremony. It means the
          component tests drive real keystrokes &mdash; type, arrow, enter
          &mdash; and assert the callback fires with the right target, with no
          router to mock and no navigation to stub. The one integration seam
          that needs a router is ten lines that barely do anything, and
          everything interesting is tested without it. Four stacked pull
          requests now, each a piece an operator would actually open.
        </p>
      </section>
      <section
        id="update-2026-08-04-shrink"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 4, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          The loss report, and building the data it needed first
        </h2>
        <p className="text-muted">
          When I scanned the field for what micro-market operators actually ask
          for, one answer drowned out the rest: shrink. Not another calculator,
          not a nicer chart &mdash; where the stock is going. Every vendor
          writing about this sells against theft, and the thing they all
          describe is the same reconciliation: the count the system reports
          against the count on the shelf. So this is the feature I most wanted
          to build, and it is the one that made me do the groundwork before I
          could.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The distinction the whole feature rests on
        </h3>
        <p className="text-muted">
          A missing unit is not a missing unit. If a restocker pulled six
          yogurts because they expired and logged the reason, that is a loss,
          but an accounted one &mdash; you know where it went. If the system
          expected ten and a physical count found seven, and nobody logged
          anything, those three are <strong>unexplained shrink</strong>: the
          theft-or-miscount signal, the money that leaves without a trace. The
          report keeps the two apart and leads with the unexplained number,
          because netting them together &mdash; &quot;total loss $40&quot;
          &mdash; buries the one figure an operator is supposed to chase under
          the one they already expected.
        </p>
        <p className="mt-3 text-muted">
          A surplus never counts as negative shrink, either. Counting more than
          expected is its own miscount, not a credit against a real shortfall
          somewhere else, so the two never quietly cancel.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The feature had no data, so I built the data
        </h3>
        <p className="text-muted">
          Then I went to wire it up and found the hole I had already flagged:
          the restock sessions that carry the counts are only ever created at
          runtime. A fresh seed has none, so the report would have rendered a
          perfectly honest empty page on a demo anyone can open &mdash; correct,
          and useless. So the first half of this work was seeding history: a
          couple of completed sessions per store, each walking a few slots,
          cycling deterministically through a shortfall, a reasoned removal, a
          skipped count, and a clean match. Deterministic on purpose &mdash; the
          counts are generated from the slot index, not{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            Math.random
          </code>
          , so the report shows the same numbers every server start and the
          tests can trust them. This is the shrink page I sequenced behind the
          product one for exactly this reason, and here it is.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Counting the skips as data, not silence
        </h3>
        <p className="text-muted">
          The subtle honesty is coverage. A slot the restocker skipped counting
          cannot reveal shrink &mdash; it says nothing either way. A report that
          quietly treated skipped slots as zero shrink would read a shelf nobody
          checked as a clean one, which is the same fabrication the rest of this
          dashboard exists to avoid. So skipped counts are their own line, and
          the page tells you what share of slots were actually counted. Low
          coverage is not low shrink; it is not knowing.
        </p>
        <p className="mt-3 text-muted">
          The rest is the pattern the last two features already set: a pure
          reconciliation model with the arithmetic under test, the fleet rollup
          aggregated in the BFF with the standing caveat that a production build
          would push it into SQL, a semantic table ranked worst-first, and loss
          framed in dollars because units are what happened but dollars are what
          it cost. Three stacked pull requests now &mdash; plan a location, see
          what sells, find what walks &mdash; each merging in order onto the
          last.
        </p>
      </section>
      <section
        id="update-2026-08-04-products"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 4, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Which products to cut, judged fairly
        </h2>
        <p className="text-muted">
          The planner answers a question about a store that doesn&apos;t exist
          yet. This one answers a question about the stores that do: what is
          actually selling, and what is dead weight on the shelf. Micromart
          ships it as &quot;Sales by Product,&quot; with an average sales rate
          and a performance figure against the category. A new{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            /operator/products
          </code>{" "}
          page ranks every product across the fleet by revenue, over a 7, 30 or
          90 day window.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The one decision that makes the number mean something
        </h3>
        <p className="text-muted">
          Ranking by raw revenue is easy and nearly useless: the sandwiches
          always win and the gum always loses, and you learn nothing you
          didn&apos;t already know from the prices. So the performance figure is{" "}
          <strong>relative to the product&apos;s own category</strong> &mdash;
          revenue against the average product revenue in its category, where 100
          is average. A gum that outsells other gum reads as above average even
          though it earns a fraction of a sandwich&apos;s revenue. Judging a
          snack against a snack is the only version of the number that tells you
          something actionable.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The rows a sold-only report would have hidden
        </h3>
        <p className="text-muted">
          A report that lists what sold cannot tell you what to cut, because the
          things worth cutting are the ones that didn&apos;t sell. So a stocked
          product with no sales in the window stays in the table, flagged,
          rather than dropping out. It is the same honesty rule as the rest of
          this dashboard: an absence is information, and letting it vanish is a
          quiet lie. Those flagged rows are the entire point of the page.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          What I simplified, and said so
        </h3>
        <p className="text-muted">
          Micromart&apos;s &quot;Avg Sold&quot; is the rate while a product was{" "}
          <em>available</em>. I don&apos;t keep per-product stock history, so
          mine is units per day over the whole window, which reads a
          slow-selling product and an often-out-of-stock one the same way. That
          is a real limitation and I would rather write it down than dress the
          number up as something it isn&apos;t. The honest version needs an
          availability signal this demo doesn&apos;t carry yet.
        </p>
        <p className="mt-3 text-muted">
          The table is a plain{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            table
          </code>{" "}
          with scoped headers and a caption, not a data-grid component. A few
          dozen rows sorted server-side do not need virtualisation or a grid
          runtime, and the semantic table is what a screen reader actually
          wants. The aggregation is the same coarse fleet rollup as the planner
          benchmarks, computed in the BFF with the same caveat: a production
          build would push it into SQL rather than fold every store&apos;s sales
          in the app.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Why this one, and not the one operators shout loudest for
        </h3>
        <p className="text-muted">
          The scan said the loudest real demand is shrink &mdash; reconciling
          the count the system reports against the shelf. I wanted to build it,
          and then I looked: the restock sessions that would feed it are only
          ever created at runtime, so a fresh seed has no completed counts, and
          a shrink report would render an honest but empty page on a demo anyone
          can open. Shipping a feature that shows nothing is worse than
          sequencing it. So this went first, because it stands on data the fleet
          already has, and shrink is next once there is count history to seed it
          from. Both shipped as stacked pull requests, in the order they have to
          merge.
        </p>
      </section>
      <section
        id="update-2026-08-04-planner"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 4, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Planning a location before buying it
        </h2>
        <p className="text-muted">
          I went back through Micromart&apos;s site the way a competitor would,
          listing everything they ship that this dashboard does not, and one gap
          stood out as pure frontend: the payback calculator on their pricing
          page. Every other gap needed a backend I don&apos;t have &mdash; team
          roles, a payout ledger, an AR visualiser. This one is the first
          question a real operator asks before opening store number six: will it
          pay for itself, and how fast. So I built it. A new{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            /operator/planner
          </code>{" "}
          page: foot traffic and conversion drive orders, a basket size and
          price drive revenue, a margin and the platform&apos;s fees drive
          profit, and the payback period falls out of hardware cost over monthly
          net profit. Move a slider, the whole projection moves.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The model is one pure function, and it can refuse to answer
        </h3>
        <p className="text-muted">
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            projectLocation
          </code>{" "}
          takes the six inputs and returns every figure derived, nothing stored,
          so there is no second ledger of numbers to drift out of sync with the
          sliders. The one part I care about is the payback field: it is a
          number, or it is null. When net profit after the platform fee and the
          per-order transaction cut is zero or negative, the hardware never
          earns itself back, and the honest thing is to say exactly that rather
          than print a payback of 900 months that reads like a real estimate.
          That is the same rule the rest of this dashboard already holds to
          &mdash; a zero is a claim, and so is a fabricated month count.
        </p>
        <p className="mt-3 text-muted">
          I also capped margin at 100%. Their calculator lets it run to 120%,
          but a gross margin above total revenue is not a margin, so mine clamps
          and I wrote down why. Copying a competitor&apos;s input range is not
          the same as copying a correct one.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Defaults from the real fleet, and the compromise in where I computed
          them
        </h3>
        <p className="text-muted">
          A calculator full of round-number defaults invites the reader to
          distrust it, so the planner offers the fleet&apos;s own averages:{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            GET /api/operator/planner/benchmarks
          </code>{" "}
          derives the mean basket price and items per order from real sales
          history. This is the backend part, and I made a deliberate compromise
          in it. Every other read here proxies a single store through to the
          API; a benchmark is one coarse fleet-wide number, and fanning a read
          out per store to build it would be N calls for a single average. So I
          aggregate it in the BFF instead. A production version would compute it
          in SQL in the API next to the fleet sales aggregation that already
          lives there, and I said so in the code rather than pretending the BFF
          is where this belongs. It is offered as a nudge, not forced &mdash; a
          shared link keeps the sender&apos;s numbers and never overwrites them.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The libraries I reached for, and the ones I did not
        </h3>
        <p className="text-muted">
          The payback bar is a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            div
          </code>{" "}
          with a width and a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            role=&quot;img&quot;
          </code>{" "}
          label, not a chart component; one value against a fixed horizon does
          not need a charting runtime, and adding one would have been weight for
          nothing. No date library, because there is no date math here, only
          arithmetic. I did keep react-query for the single benchmarks call, not
          because one fetch needs it but because matching how every other read
          in this dashboard works buys the caching and dedup for free and costs
          the next reader no surprise. And the shareable-link state uses{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            history.replaceState
          </code>{" "}
          rather than the Next router, which keeps the component free of a
          router dependency so it tests exactly like the pricing tab does, with
          no navigation mock, while the URL still carries the whole scenario.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          What went wrong, and what it taught me twice
        </h3>
        <p className="text-muted">
          The revenue test hung, and I read the failure as &quot;the value
          isn&apos;t rendering.&quot; It was rendering &mdash; twice. At one
          unit, gross revenue per year and revenue per unit per year are the
          same number, so a bare text query matched two elements and threw
          inside the retry loop, which looks identical to a value that never
          appeared. The fix was to scope the assertion to the specific figure,
          and the lesson was that &quot;not found&quot; and &quot;found more
          than once&quot; wear the same face in a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            waitFor
          </code>
          .
        </p>
        <p className="mt-3 text-muted">
          Then my pushes looked like they landed while the remote sat a commit
          behind, because the tool that filters my command output was swallowing
          the one line that would have told me. A green &quot;ok&quot; proving
          nothing is the exact failure this whole page keeps circling, and here
          it was again in my own workflow. I confirmed the push against the
          remote ref directly, the way I now check everything I cannot see the
          raw bytes of.
        </p>
        <p className="mt-3 text-muted">
          The scan turned up more than I built. The loudest thing real operators
          ask for, across every forum and vendor writing about micro-markets, is
          not another calculator &mdash; it is theft and shrink: reconciling the
          count the system reports against the count on the shelf, and a report
          of what walked. The restock sessions already capture the raw material
          for it. That is the next one.
        </p>
      </section>
      <section
        id="update-2026-08-03-two-causes"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 3, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          The same bug twice, for two different reasons
        </h2>
        <p className="text-muted">
          &ldquo;Turkey Club Sandwich out of stock&rdquo; came back. I had
          already fixed it, written it up, and moved on. It had two causes and I
          had fixed one of them.
        </p>
        <p className="mt-3 text-muted">
          The first is the more embarrassing. The API stopped inventing alerts a
          release ago; this app has its own copy of the seed, and that copy
          still picked a random message from a fixed list. It is the copy that
          serves the demo whenever the backend is asleep, which for something
          anyone can open without an account is most of the time &mdash; so I
          had fixed the path fewer people take and declared the bug closed.
          Duplicated logic is a known cost; what I underrated is that fixing one
          copy feels exactly like fixing the bug.
        </p>
        <p className="mt-3 text-muted">
          The second is that the backend was serving stale rows. Its code was
          correct and its data predated the fix, because nothing had re-seeded
          since. A correct migration of behaviour does not migrate the records
          already written under the old behaviour, and a fix that only applies
          to future writes will look broken for as long as the old data outlives
          it. Checking the deployed data found eleven contradictions across six
          stores.
        </p>
        <p className="mt-3 text-muted">
          Worth stating plainly, since it is the part I would want a reviewer to
          press on: the reseed job exists, but I have not confirmed it is
          deployed as a scheduled service, and an earlier note of mine claims
          the demo data reseeds nightly. If that claim is wrong, this returns on
          its own. A fix that depends on an unverified cron is a fix with a
          countdown on it.
        </p>
      </section>

      <section
        id="update-2026-08-03-visitor-identity"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 3, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Three questions, three answers, and one that has none
        </h2>
        <p className="text-muted">
          I had written that auth here was deferred rather than solved: a shared
          service token stops anyone writing to the API directly, but it
          authenticates the app, not a person, so the audit trail recorded the
          same hardcoded actor for everybody and per-visitor rate limiting was
          impossible. The obvious next question is whether a mix would fix it,
          and the answer is mostly yes, as long as you are clear about which
          layer does what.
        </p>
        <p className="mt-3 text-muted">
          The mistake would be thinking of these as &quot;more auth&quot;. They
          answer different questions. The service token answers{" "}
          <em>can this caller write at all</em>, which is a security boundary. A
          visitor id answers <em>which visitor is this</em>, which is fairness.
          And optional sign-in answers <em>who is this, really</em>, which is
          identity. Stacking them only helps because they are not the same
          thing.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          What shipped
        </h3>
        <p className="text-muted">
          The app already minted a stable, opaque, httpOnly cookie in the proxy
          so server-side flag rollouts could put a visitor in the same bucket
          every visit. The operator routes now forward that to the API alongside
          the service token, where it becomes the rate limit key and the actor
          on anything written. Nothing derived from the person goes into it: no
          fingerprint, no IP hash, no name, just a value the server issues and
          later reads.
        </p>
        <p className="mt-3 text-muted">
          Sign-in is wired but optional. A signed-in caller is attributed
          properly, an anonymous one carries on, and the demo still works
          without an account because that is the entire point of it.
        </p>

        <p className="mt-3 text-muted">
          It reuses that cookie because I first built it as a second one, and
          that was wrong twice over. Two ids for one browser means two lifetimes
          to keep in step and a second thing to explain, for no gain. And the
          file I put it in was a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            middleware.ts
          </code>{" "}
          &mdash; a convention Next 16 renamed to{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            proxy
          </code>
          , and this app already had a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            proxy.ts
          </code>
          . Having both is a boot-time fatal: the dev server refused to start
          and every route returned a 404.
        </p>
        <p className="mt-3 text-muted">
          Worth sitting with how far that got. The unit tests passed, the
          integration tests passed, the typecheck passed, the linter passed, the
          dead-export check passed. Not one of them starts Next, so not one of
          them could see it. It took the first real browser request to find a
          bug that broke the entire application. That is the argument for
          end-to-end tests in a sentence: the layers below verify the pieces,
          and this was a fault in how the pieces are assembled. I had been
          carrying these specs as written-but-never-run, which is the same as
          not having them.
        </p>

        <p className="mt-3 text-muted">
          Running them turned up a second thing, quieter than the crash and
          worse in the long run. The specs navigated to a hardcoded seed id,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            store-002
          </code>
          . With the backend up the real fleet comes back as UUIDs, the API
          returns a 404 for that id, and the BFF falls back to the seed exactly
          as designed &mdash; so the tests passed identically whether or not the
          backend worked. A test that cannot fail when the thing it covers is
          broken is not a test. It is the same blind spot that let a missing
          sales endpoint sit unnoticed for weeks: the fallback that keeps the
          demo alive when the API is asleep also hides whether the real path
          works at all.
        </p>
        <p className="mt-3 text-muted">
          So I pointed them at the real fleet, and CI went red. The test was
          right: the deployed API is on an older release with no restock-session
          routes and no migrations applied, so the flow genuinely could not open
          a session. But it was answering a question this tier should not be
          asking. These specs exist to catch the seam between two components
          &mdash; the bug where &ldquo;Start restock&rdquo; led to another
          &ldquo;Start restock&rdquo; &mdash; and pinning a UI-composition test
          to a separately-deployed service means the suite reports somebody
          else&apos;s deploy state and changes colour for reasons that have
          nothing to do with the change under review. A test that fails for
          reasons unrelated to the diff gets ignored, and an ignored test is
          worse than no test.
        </p>
        <p className="mt-3 text-muted">
          The settled answer is two modes: the seed by default, chosen
          deliberately and written down rather than arrived at by accident,
          because it is the one fixture that is deterministic and always
          present; and an opt-in live mode that resolves the store off the fleet
          and drives whatever is really serving. That is how the flow was
          verified end to end against Postgres, six real restock sessions,
          before any of this landed. The difference between this and where it
          started is not the default &mdash; it is that the file now says out
          loud what it does not cover, instead of letting a silent fallback
          imply otherwise.
        </p>
        <p className="mt-3 text-muted">
          Which left one thing still not honest. Choosing the seed and writing
          down why is better than drifting into it, but a documented blind spot
          is still a blind spot: nothing would have run the live mode, so an
          integration regression had nowhere to fail. So there is now a CI tier
          that stands up Postgres, builds the API from source, applies the
          migrations, seeds the operator tables, points this app at it and
          drives the whole restock flow. It picks up an API branch of the same
          name when one exists, so a frontend change that needs a backend change
          gets tested as the pair it actually is instead of against whatever
          shipped last week. The distinction I care about: the earlier change
          made the gap visible, and this one closes it. Only the second is a
          fix.
        </p>
        <p className="mt-3 text-muted">
          It went green on its first working run, which is exactly when to be
          suspicious. If the API had not come up, the BFF would have fallen
          back, served seed ids, and every assertion would still have passed
          &mdash; a green run proving nothing, which is the precise failure the
          tier was built to prevent. So live mode now asserts the fleet gave it
          a real UUID and names the seed id it got instead. The lesson I keep
          relearning here is that a passing test is a claim, and a claim is
          worth checking when the cost of it being wrong is that you stop
          looking.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          What that actually buys
        </h3>
        <p className="text-muted">
          <strong>Rate limiting that works.</strong> Every operator request
          reaches the API server-side from this app, so limiting by IP put the
          whole world in one bucket: one person in a loop could have started
          returning 429s to everyone else. Keyed by visitor, a runaway caller
          now only exhausts their own budget.
        </p>
        <p className="mt-3 text-muted">
          <strong>An audit trail that says something.</strong> Every restock
          session used to record{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            operator@smartstore.example
          </code>
          , which is worse than useless: it looks like an answer. Sessions now
          carry either a real signed-in subject or{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            anonymous:v_…
          </code>
          , deliberately prefixed so nobody mistakes it for a username. Two
          restocks sharing one are the same browser, which is a real and useful
          fact about a shift.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          What it is not, and cannot be
        </h3>
        <p className="text-muted">
          The visitor id is self-asserted. Clear the cookie and you are a
          stranger with a fresh budget. That sounds fatal until you notice the
          service token already decides who can reach these endpoints at all, so
          this never has to resist an attacker; it has to tell honest visitors
          apart, which is all a fairness limit needs. It would be the wrong
          thing to hang a security decision on and I have not hung one on it.
        </p>
        <p className="mt-3 text-muted">
          And the thing it genuinely cannot do:{" "}
          <strong>
            you cannot have both no login and trustworthy attribution for the
            same action
          </strong>
          . That is definitional, not an engineering gap. An anonymous id tells
          you two actions came from the same browser and can never tell you who
          was holding the phone. So the honest answer is real attribution for
          people who identify themselves, honest labelling for people who do
          not, and no pretending the second is the first.
        </p>
        <p className="mt-3 text-muted">
          The service token also stays a bearer secret. Anyone who obtains it
          has full write access, there is no revoking one caller without
          revoking all of them, and rotating it means coordinating two deploys.
          Fixing that properly means short-lived signed tokens or mutual TLS,
          and neither is worth it for a demo.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Where that leaves it
        </h3>
        <p className="text-muted">
          Solved now: writes are closed to anything but this app, limits are per
          visitor rather than per egress IP, and the audit trail distinguishes
          callers instead of naming a constant.
        </p>
        <p className="mt-3 text-muted">
          Not yet, and roughly in the order I would do it: roles, so a restocker
          cannot read finances; a real login for operators, which turns{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            anonymous:v_…
          </code>{" "}
          into a name and is now a small change rather than a redesign, because
          the plumbing that carries identity already exists; token rotation
          without a synchronised deploy; and per-tenant isolation the day there
          is more than one operator. None of that is blocked on anything. It is
          waiting for a reason, which is a better position than being blocked on
          plumbing.
        </p>
      </section>

      <section
        id="update-2026-08-02-honest-states"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 2, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          A zero is a claim, and I was making it by accident
        </h2>
        <p className="text-muted">
          Someone looked at the fleet page and every store reported 0%
          inventory. Nothing had errored on screen. The cards rendered, the
          numbers were formatted, the layout was fine. It just was not true.
        </p>
        <p className="mt-3 text-muted">
          Three separate places had each decided, reasonably on its own, to keep
          going quietly. The summary request failed and the fallback said
          nothing. The response was cast rather than parsed, so nothing checked
          it. And a store with no summary rendered{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            ?? 0
          </code>
          , which is the line that turns an absence into a fact. Any one of
          those alone is defensible. Together they produced a confident
          dashboard full of zeroes.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Why this matters more than it looks
        </h3>
        <p className="text-muted">
          An operator who opens the Tax tab and sees nothing concludes the store
          made no sales. That is a conclusion they act on: not chasing a
          remittance, not questioning a number that should have been there. A
          fleet reporting zero critical alerts and zero average fill reads as
          good news, so they stop looking. The failure mode of a silent error is
          not confusion, it is misplaced confidence, and it costs more than an
          error message ever would.
        </p>
        <p className="mt-3 text-muted">
          So the rule I settled on is that the interface has to distinguish
          three states it had been collapsing into one. Loading is not knowing
          yet. Absent is not knowing at all. Zero is a measurement. Only the
          third is a number, and the other two now render as a pulsing
          placeholder and an em dash respectively. There is a test asserting the
          word &quot;null&quot; never reaches the screen, because it briefly
          did.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Failures now say what failed, and offer a way out
        </h3>
        <p className="text-muted">
          An empty list from a failed request is a lie with a plausible shape,
          so the layer that produced it stopped producing it. When the API is
          unreachable and the seeded demo data has nothing for that store, the
          response is a 503 saying so rather than a 200 with an empty array. The
          tab shows that it could not load, states plainly that this is an error
          and not an empty store, reassures that nothing was changed, and offers
          a retry.
        </p>
        <p className="mt-3 text-muted">
          It also offers a way to tell me. That is not boilerplate. Anyone can
          use this dashboard without an account, which is the whole point of it,
          and the flip side is that nobody has a support channel by default.
          Without a contact route their only options are to assume the zero is
          real or to close the tab, and both of those lose the person and the
          bug report at once.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          And the charts now answer the question they raise
        </h3>
        <p className="text-muted">
          The charts drawn with divs had no way to get a number out of them. You
          could see that one month was taller than another and never find out by
          how much, which makes a chart decorative rather than useful: the shape
          is the summary and the value is the answer. The ones built on a chart
          library already had tooltips, so the hand-rolled half of the same
          dashboard was quietly worse for no reason anyone had decided on.
        </p>
        <p className="mt-3 text-muted">
          They all have hover values now. Deliberately not focusable, though:
          making every bar a tab stop would add seven to twelve of them per
          chart, and it buys nothing for anyone using a screen reader, because
          each chart already carries a list of the same values beside it. The
          tooltip is a mouse affordance layered on an accessible path that
          existed first, rather than the only way to read the number.
        </p>
      </section>

      <section
        id="update-2026-08-02-real-vs-fake"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 2, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Which of these bugs would a real operator have hit
        </h2>
        <p className="text-muted">
          Wiring this to a database turned up a run of bugs in a couple of
          hours. Rather than list them, I want to sort them, because the
          interesting question is which ones were real and which ones only
          existed because I had spent months faking the data and had built
          habits around that.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Real. A live deployment hits these too
        </h3>
        <p className="text-muted">
          <strong>Two queries no database would accept.</strong> Making the
          buckets timezone-aware left the{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            GROUP BY
          </code>{" "}
          repeating an interpolated expression. Drizzle re-emits a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            sql
          </code>{" "}
          fragment with fresh parameter numbers each time it is used, so the
          GROUP BY copy read $5 and $6 where the SELECT read $1 and $2. Postgres
          compares parse trees, decided those were two different expressions,
          and rejected both queries for selecting an ungrouped column. Nothing
          about fake data caused that and nothing about real data would have
          prevented it.
        </p>
        <p className="mt-3 text-muted">
          <strong>Every time bucket was UTC.</strong> A Toronto store&apos;s day
          started at 8pm the previous evening. That is a correctness bug about
          the world, not about my fixtures, and it would have been quietly wrong
          in production for as long as nobody checked which day a sale landed
          on.
        </p>
        <p className="mt-3 text-muted">
          <strong>A cast where a parse belonged.</strong> The fleet summary was
          read with{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            res.json() as FleetSummaryResponse
          </code>
          . A blind assertion at a trust boundary, with the Zod schema for it
          sitting unused in the same codebase. Real data drifts more than
          fixtures do, so this is worse in production, not better.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Artefacts of faking it. But each points at something real
        </h3>
        <p className="text-muted">
          <strong>Alerts that contradicted the inventory.</strong> Every store
          was stamped with the same four alerts, so a store with a full shelf
          still reported a sandwich out of stock and a store at 4C still warned
          it had reached 8.2C. That specific bug only exists because I wrote the
          alert text by hand; a real deployment generates alerts from the same
          readings the inventory tab shows, so they agree by construction.
        </p>
        <p className="mt-3 text-muted">
          Except the failure it imitates is extremely real. The moment alerts
          come from a separate service, or a cached rollup, or a nightly job
          reading a snapshot, you get exactly this: two screens describing the
          same shelf and disagreeing. I have now written tests that assert an
          alert can never contradict the row it describes, and those tests would
          keep earning their keep against a real pipeline.
        </p>
        <p className="mt-3 text-muted">
          <strong>Store cards showing 0% everywhere.</strong> The frontend falls
          back to seeded data when the API is unreachable, which is what keeps
          the demo working. When the fleet summary started failing, the store
          list still came from the API with real ids while the summaries fell
          back to seeded ones with different ids. Nothing matched, and the UI
          rendered absent as zero.
        </p>
        <p className="mt-3 text-muted">
          A production deployment has no seed to fall back to, so it would have
          shown an error instead. But strip the fixtures away and the real
          lesson stands: a partial failure produced a page that looked fine and
          was entirely wrong, and no layer said anything. The fallback was
          silent, so nothing logged. The response was cast rather than parsed,
          so nothing validated. Absent data rendered as a real number, so
          nothing looked broken. Three separate places each chose to keep going
          quietly, and the result was a confident dashboard full of zeroes.
        </p>
        <p className="mt-3 text-muted">
          <strong>The seeded store outliving its own shape.</strong> The
          fixtures live on{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            globalThis
          </code>{" "}
          so one dev server shares a copy, which means they survive hot reloads.
          A store created before a collection existed kept coming back without
          it, and writes failed while reads worked. Purely a development
          artefact, since a real process starts clean. It is still a cache
          invalidation bug, and it still cost me twenty minutes of blaming the
          wrong thing.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          What I actually take from it
        </h3>
        <p className="text-muted">
          The fixture-shaped bugs were the cheap ones. The expensive pattern was
          that I had trained myself, across months of building against fake
          data, to treat every failure as survivable. Fall back, cast, carry on.
          That is a reasonable instinct when the only thing behind the wire is a
          file of made-up stores. It becomes a liability the moment something
          real is on the other end, because the same instinct turns a loud
          failure into a quiet lie.
        </p>
        <p className="mt-3 text-muted">
          So the fixes were less about the individual bugs and more about
          deciding, in each place, whether silence was still the right answer.
          An unreachable API stays survivable, because that is what the fallback
          is for and the demo has to work. A rejected token does not, because
          that is a configuration mistake pretending to be an outage. Absent
          data now renders as absent rather than as zero. And SQL gets executed
          against a real Postgres in a test, because a mocked repository will
          cheerfully return rows for a query no database would ever accept.
        </p>
      </section>

      <section
        id="update-2026-08-02-service-token"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 2, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Locking the writes without making anyone log in
        </h2>
        <p className="text-muted">
          The instinct is to put user auth on the writes, and I had to be honest
          with myself about who this is actually for before I could see why that
          was wrong. This dashboard exists so somebody evaluating my work can
          open a link and use it. That is the whole brief. A hiring manager with
          ten minutes is not going to create an account to find out whether my
          restock flow is any good, and if the interesting half of the product
          sits behind a login then for that reader the interesting half does not
          exist.
        </p>
        <p className="mt-3 text-muted">
          So &quot;anyone can land on this cold and drive the real thing
          immediately&quot; is not a nice-to-have I am trading away for
          security. It is the requirement. Requiring a token from the visitor
          would have returned 401 on every write, the frontend would have fallen
          back to its in-memory seed, and the dashboard would have gone back to
          looking real while persisting nothing, which is the one thing this
          whole run has been about removing.
        </p>
        <p className="mt-3 text-muted">
          But the hole I actually had was a different one. Anyone could point
          curl at the API and change the data directly, never touching the app.
          Those are two separate problems and I had been treating them as one.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          What I did instead
        </h3>
        <p className="text-muted">
          Writes now carry a shared secret that only the backend-for-frontend
          holds. The browser never sees it, because the browser never calls the
          API directly; it calls my Next server, which calls the API on its
          behalf. So a visitor is unaffected and a direct caller gets a 401. The
          comparison is constant time after a length check, and with no secret
          configured the guard is a deliberate no-op so a fresh clone and local
          development still work. There is nothing to forge when there is no
          secret.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          What it buys, and what it doesn&apos;t
        </h3>
        <p className="text-muted">
          The case for it is short. It closes the direct-write hole, it costs
          one header and one environment variable, it needs no session handling
          or token refresh, and it does not ask anything of the person using the
          dashboard. For a demo that has to stay open, that is most of the value
          of auth at almost none of the cost.
        </p>
        <p className="mt-3 text-muted">
          The case against it is longer and worth being straight about. It
          authenticates a <em>service</em>, not a person, and that has
          consequences I can point at in my own code. The restock audit trail I
          was so pleased with records an actor for every session, and that actor
          is the same hardcoded string for everybody, because the API genuinely
          does not know who is on the other end. I built a feature whose entire
          purpose is answering &quot;who changed this and why&quot; and I can
          currently only answer half of it.
        </p>
        <p className="mt-3 text-muted">
          It is a bearer secret, so anyone who obtains it has full write access
          and there is no revoking one caller without revoking all of them.
          Rotating it means coordinating two deploys, or teaching the API to
          accept two secrets during a changeover window, which is exactly the
          sort of thing that gets skipped and then bites a year later.
        </p>
        <p className="mt-3 text-muted">
          It also introduced a failure mode I had not thought through until I
          wrote it down. Set the secret on the API and forget it here, and every
          write comes back 401 while reads carry on fine. Worse, the
          backend-for-frontend caught that 401 in the same handler it uses for
          &quot;the API is asleep&quot; and fell through to the seed, so the
          write would have looked like it succeeded and persisted nothing. I had
          rebuilt the exact fiction I keep saying I removed, inside the code
          meant to protect it.
        </p>
        <p className="mt-3 text-muted">
          Those two cases deserve opposite treatment. An unreachable API is
          expected, and falling back is the right answer. A rejected token is my
          own mistake and should be loud. So the fallback now only catches the
          first: a 401 or 403 is rethrown with a message naming the variable to
          check, and the write fails visibly instead of pretending. A silent
          success is worse than an error, and it took writing the tradeoffs down
          to notice I had shipped one.
        </p>
        <p className="mt-3 text-muted">
          None of that makes it the wrong call for what this is. A portfolio
          piece has a different threat model from a product: the data is fake,
          it restores itself nightly, and the cost of a bad actor is a demo
          store showing odd numbers for a few hours. The cost of a login wall is
          that the person I built this for closes the tab. Weigh those honestly
          and the service credential is not a compromise, it is the right shape
          for the problem.
        </p>
        <p className="mt-3 text-muted">
          What I would want to be asked about it is what changes when it stops
          being a demo, and the answer is that real user auth, per-user limits
          and a truthful actor on the audit trail are one piece of work,
          starting the moment there is a real operator to protect rather than a
          reader to convince.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Two smaller things while I was in here
        </h3>
        <p className="text-muted">
          The seed was building each shelf by picking a random product per slot,
          so a six-slot store routinely showed the same sandwich three times and
          the pricing table looked broken. Real planograms do not stock one
          product in three slots and call it variety. It now walks the product
          list in order and only repeats once it runs out.
        </p>
        <p className="mt-3 text-muted">
          And I finally wrote the fallback tests. The BFF prefers the live API
          and drops to the in-memory seed when it is unreachable, which is what
          keeps the demo working when the backend is asleep. I had put that test
          in three separate plans and written it zero times. It exists now, and
          it drives whole features through the fallback rather than checking
          that a try/catch is present, because the thing worth pinning is that
          the seed can actually satisfy the same contract the API does.
        </p>
      </section>
    </>
  );
}
