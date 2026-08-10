/** Dated continuation entries (later half). */
export function OperatorUpdatesLate() {
  return (
    <>
      <section
        id="update-2026-08-02-hardening"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 2, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          The bit before merging, where I found out I was wrong
        </h2>
        <p className="text-muted">
          Three features were sitting in stacked pull requests waiting to go in.
          Before merging I went back over them the way I&apos;d want someone to
          go over mine, and the most useful thing that came out of it was a
          claim of my own that turned out to be false.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          I said it would degrade gracefully. It wouldn&apos;t.
        </h3>
        <p className="text-muted">
          The timezone work added a nullable{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            timezone
          </code>{" "}
          column, and I&apos;d written in the pull request that the API would
          keep working if the migration hadn&apos;t run yet, because the
          resolver falls back to the province. Nullable column, safe fallback,
          no problem.
        </p>
        <p className="mt-3 text-muted">
          Except migrations in this project are manual. Nothing in CI, the
          Dockerfile or the start script runs them. So the gap between merging
          and migrating is real, and I wanted to know exactly how bad it was
          rather than assume. I generated the SQL Drizzle actually emits:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`select "id", "name", "location", "province", "timezone",
       "status", "temperature", "uptime", "revenue_24h",
       "last_ping", "created_at"
  from "operator_stores"`}
        </pre>
        <p className="mt-3 text-muted">
          An explicit column list, not{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            select *
          </code>
          . Before the migration, Postgres raises 42703 and every store read
          returns a 500, which takes the fleet list, the store detail page, the
          fleet summary and everything that looks a store up on the way to doing
          something else. My fallback never runs, because the query never
          returns a row for it to run on.
        </p>
        <p className="mt-3 text-muted">
          The fix is not complicated once you know: run the migrations first,
          then merge. They&apos;re additive, one nullable column and three new
          tables, and the version currently in production doesn&apos;t select
          the column or know the tables exist, so the schema can sit ahead of
          the code with nothing noticing. Expand first, deploy second. What I
          find worth writing down is that I had the shape of the answer right
          and the direction backwards, and the only reason I caught it was
          checking a claim I was already confident about.
        </p>
        <p className="mt-3 text-muted">
          The obvious alternative is to run migrations automatically as part of
          the deploy, and I decided against it. It reads like better developer
          experience and mostly buys a worse failure mode: two deploys racing
          each other both try to migrate, a destructive migration goes out
          before I have read it, and a migration that fails halfway leaves a
          broken release with no obvious rollback. Keeping it manual costs me
          one command and keeps the ordering something I own rather than
          something that happens to me.
        </p>
        <p className="mt-3 text-muted">
          What makes that cost acceptable rather than a trap is the discipline
          it forces: every migration has to be safe to run against the currently
          deployed code. Add columns nullable, add tables nobody reads yet, and
          never drop or rename in the same release that stops using something.
          Do that and the ordering stops being dangerous, because the schema
          being ahead is always fine and the code being ahead never happens.
          Users notice none of it, which is the point.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Why I didn&apos;t put auth on the write endpoints
        </h3>
        <p className="text-muted">
          By this point the operator module had twenty routes, nine of them
          writes, none of them authenticated or rate limited. The obvious move
          is to add{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            checkJwt
          </code>{" "}
          to the writes, and there&apos;s already a pattern for it in this
          codebase: the feature flags console forwards the visitor&apos;s Auth0
          token through its BFF.
        </p>
        <p className="mt-3 text-muted">
          I didn&apos;t, and the reason is worth more than the change would have
          been. The operator client sends no token. So adding auth would 401
          every restock and every promotion coming from the dashboard, the BFF
          would catch it and fall back to its in-memory seed, and the demo would
          carry on looking like it worked while persisting nothing. That&apos;s
          exactly the fiction I&apos;d spent three features removing.
          Reintroducing it in the name of security would be the worst kind of
          change: defensible in a summary, actively harmful in practice.
        </p>
        <p className="mt-3 text-muted">
          What actually bounds the exposure is a rate limit, so every route got
          one. The blast radius is genuinely only demo data too: the operator
          repository touches nine tables and every one of them is an operator
          table, so there is nothing else in the API for those endpoints to
          reach. Anything an anonymous caller creates cascades off the stores,
          and the nightly reseed deletes the stores.
        </p>
        <p className="mt-3 text-muted">
          Then I got the limiter wrong, which is the more interesting half. I
          copied the numbers from the feature flags module without thinking
          about where the traffic comes from. Flags requests arrive from the
          visitor&apos;s browser, one bucket each. Operator requests do not:
          they all reach the API server side from the dashboard&apos;s own
          backend-for-frontend, so they share a handful of hosting IPs. One open
          dashboard polls about eight times a minute, which meant a 120 per
          minute ceiling would have started refusing real users at roughly
          fifteen concurrent tabs, while doing nothing whatsoever about
          distributed abuse, since anyone calling the API directly gets a fresh
          bucket. The limiter I added to protect the thing would have hurt it
          more than an attacker would.
        </p>
        <p className="mt-3 text-muted">
          So the numbers are much higher now, high enough that no amount of
          normal browsing trips them and low enough to stop a runaway loop, and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            trust proxy
          </code>{" "}
          is set to one hop so the key is the real caller rather than the
          platform&apos;s edge. It&apos;s a backstop, not per-user fairness.
          Doing fairness properly needs the backend-for-frontend to forward who
          the caller is, which is the same plumbing auth would need, and
          that&apos;s the point at which both become one piece of work rather
          than two.
        </p>
        <p className="mt-3 text-muted">
          Auth belongs here the moment there&apos;s a real tenant to protect. It
          just isn&apos;t a decision to make quietly inside a cleanup.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Two smaller things I&apos;d have missed
        </h3>
        <p className="text-muted">
          The promotion performance query had no upper bound. An open-ended
          promotion left running for a year gives you a year-long window, and
          the baseline doubles the fetch, so measuring one would drag two years
          of sales through the app to answer a single question. It clamps to the
          most recent 180 days now, and the response reports the range it
          actually measured plus a note when the clamp applied. A smaller number
          honestly labelled beats a bigger one quietly measured over a period
          the reader didn&apos;t expect.
        </p>
        <p className="mt-3 text-muted">
          And the operator module had zero OpenAPI registrations while the rest
          of the API had 43. Adding twelve was routine. The part that
          wasn&apos;t was realising both new request schemas use{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            .refine()
          </code>
          , and that the library throws on some schema shapes with no symptom
          until the docs page falls over at runtime, long after CI went green.
          So there&apos;s a test now that just generates the document and
          asserts it didn&apos;t throw. Cheap, and it covers a failure that
          would otherwise surface as a support question.
        </p>
        <p className="mt-3 text-muted">
          None of this is glamorous work. It&apos;s the difference between three
          features that demo well and three features I&apos;d be comfortable
          putting in front of real operators, which is the only distinction that
          matters once something is actually running.
        </p>
      </section>

      <section
        id="update-2026-08-02-promotions"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 2, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Promotions: my calculator could predict but never be wrong
        </h2>
        <p className="text-muted">
          The Pricing tab I built models a discount and shows the revenue and
          profit tradeoff. It is careful to say it assumes volume holds, and it
          is a genuinely useful modelling tool. But it persists nothing, which
          means it can never be wrong out loud. You cannot run the promotion,
          and you certainly cannot go back afterwards and find out whether the
          prediction was any good.
        </p>
        <p className="mt-3 text-muted">
          Micromart shipped self-serve promotions about a month ago: create
          them, target by location or product, schedule them, and read built-in
          performance analytics. The scheduling and the after-the-fact
          measurement were the parts I did not have.
        </p>
        <p className="mt-3 text-muted">
          There was also a loose end in my own schema pointing straight at this.
          The{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            price-update
          </code>{" "}
          activity type had been in the enum since the beginning, with a label,
          a colour and an icon in the feed &mdash; and nothing had ever created
          one. Dead configuration waiting for a write path. This is that write
          path.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Two things I deliberately did not build
        </h3>
        <p className="text-muted">
          <strong>No status column.</strong> A promotion looks like it wants one
          &mdash; scheduled, active, ended &mdash; but a stored status needs a
          job to flip it and is wrong in between runs. Status is a comparison
          between the window and the clock, so it is derived on every read. The
          client derives it again rather than trusting the payload, because a
          tab left open overnight should not keep calling a finished promotion
          live. That is one of the tests.
        </p>
        <p className="mt-3 text-muted">
          <strong>No price mutation.</strong> Nothing writes the discounted
          price into{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            operator_inventory.price
          </code>
          . The discount applies at read time, so the list price survives
          &mdash; and the list price is the number every margin calculation
          needs. Overwriting it would mean losing the original the moment a
          promotion starts, and then reconstructing it from an audit log to
          answer the simplest question about profitability. Same
          derive-don&apos;t-store call the Tax tab and the calculator already
          make.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The measurement, and being honest about it
        </h3>
        <p className="text-muted">
          Performance compares units and revenue inside the promotion window
          against an{" "}
          <strong>equal-length baseline immediately before it</strong>. Equal
          length matters: comparing a two-week promotion against the previous
          month would flatter or punish it purely on duration. It is two grouped
          queries filtered in SQL, so measuring a fortnight does not drag
          eighteen months of sales into Node.
        </p>
        <p className="mt-3 text-muted">
          The part I care more about is what it does <em>not</em> claim. This is
          a before-and-after, not attribution. Seasonality, a new product on the
          next shelf, and a fridge that ran warm for a week all move the same
          number. So the API returns both raw totals rather than only a headline
          delta, ships a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            note
          </code>{" "}
          field saying so in words, and the UI repeats it. A dashboard that
          quietly implies causation is worse than one that admits what it is
          showing &mdash; and it is the same instinct as the calculator saying
          it assumes volume holds rather than inventing an elasticity model.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Where the three pieces meet
        </h3>
        <p className="text-muted">
          This is the feature that made the other two worth doing in that order.
          A promotion window is a pair of instants that an operator thinks about
          as &quot;starts Monday morning&quot;, and Monday morning is only
          meaningful in the store&apos;s timezone &mdash; which is why the
          timezone work had to land first, and why the schedule form names the
          zone rather than hoping. And the promotion writes a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            price-update
          </code>{" "}
          into the same activity feed the restock sessions write to, so the
          store&apos;s history reads as one narrative instead of three
          disconnected logs.
        </p>
        <p className="mt-3 text-muted">
          It also forced me to pay a debt. Both earlier features shipped
          deliberately duplicated helpers &mdash; the same arithmetic in the
          Express service and the Next app, on purpose, because two tested
          copies of thirty lines beat coupling two deploys. Both times I wrote
          in the recap that the test justifying the duplication did not exist.
          It exists now: a parity block that runs the same vectors the API
          asserts through the client copies, so a change to one that is not
          mirrored fails the build. A design decision without the test that
          holds it up is just a comment.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Closing the loop
        </h3>
        <p className="text-muted">
          I shipped the measurement endpoint before anything called it, which
          meant the headline claim was true of the API and not of the product.
          That gap is closed now: each promotion that has actually started has a
          Results control, and opening it shows before and during side by side
          rather than only the delta.
        </p>
        <p className="mt-3 text-muted">
          Showing both columns is the whole point. A single number reading
          &quot;up 60%&quot; invites you to read a cause into it. Two columns
          and a labelled change, with the range that was actually measured named
          in the store&apos;s timezone underneath, makes it obvious you are
          looking at two periods rather than an effect. Where there is no
          baseline at all the cell says &quot;no baseline&quot; instead of a
          percentage, because dividing by zero politely is still making
          something up.
        </p>
        <p className="mt-3 text-muted">
          Writing the tests for it turned up a bug I would not have found by
          clicking. The API had gained{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            measuredFrom
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            measuredTo
          </code>{" "}
          when I added the 180 day clamp, and I never added them to the client
          schema. Zod strips unknown keys silently, so the fields arrived and
          were quietly discarded, and the component threw{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            Invalid time value
          </code>{" "}
          on a date that was undefined. Silent stripping is usually the
          behaviour you want from a parser at a trust boundary, right up until
          the thing being dropped is something you added yourself.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Who this helps
        </h3>
        <p className="text-muted">
          <strong>Operators</strong> get a loop instead of a guess. Model a
          discount, schedule it in two clicks with the modelled numbers
          pre-filled, and afterwards see what actually happened next to what was
          predicted. Overlapping promotions resolve to the deepest rather than
          stacking, which is both predictable and the one that favours the
          person standing at the fridge.
        </p>
        <p className="mt-3 text-muted">
          <strong>Developers</strong> get a promotions table with no lifecycle
          job attached to it, which is one fewer thing that can be subtly wrong
          at 3am. Widening it to fleet-wide campaigns is a single migration
          making{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            store_id
          </code>{" "}
          nullable &mdash; I left it NOT NULL because guessing the grouping
          semantics before anyone has asked for them is how you end up
          maintaining a shape nobody wanted.
        </p>
      </section>

      <section
        id="update-2026-08-02-restocking"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 2, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Restocking: my one button was a fiction
        </h2>
        <p className="text-muted">
          Restocking is the single most documented workflow on Micromart&apos;s
          site, and it is documented as a phone task. Pick store, pick cabinet,
          tap a slot, see the expected count, optionally confirm a physical
          count, Add and Remove per slot with a required reason on removals,
          repeat, review, complete. Skipping the count is explicitly supported
          so a team can spot-check rather than count everything.
        </p>
        <p className="mt-3 text-muted">
          Mine was one button. It ran{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            update operator_inventory set current_stock = capacity
          </code>{" "}
          and wrote a single activity row reading &quot;Restocked N item(s) to
          full capacity&quot;.
        </p>
        <p className="mt-3 text-muted">
          That is not a simplification, it is a fiction. It cannot express six
          yogurts binned because they expired, a sensor reading eight where the
          shelf held five, or a case damaged in the van. Shrinkage and miscounts
          are exactly where an unattended-retail operator&apos;s margin goes,
          and my data model had nowhere to put either of them. I had built the
          happy path and called it the feature.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The one decision the rest falls out of
        </h3>
        <p className="text-muted">
          A restock is now a session with one line per product touched, and{" "}
          <strong>inventory is never written directly</strong>. Lines accumulate
          while the restocker works the shelf; completing the session is the
          only thing that touches{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            operator_inventory
          </code>
          , in one transaction. One write path means the audit trail cannot be
          bypassed, which is the whole reason the feature is worth anything.
        </p>
        <p className="mt-3 text-muted">
          The subtle part is that{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            counted_qty
          </code>{" "}
          is nullable, and that is deliberate rather than lazy. Null means the
          restocker chose to skip counting that slot. That is a recorded
          decision, not absent data, and it is what lets a line be classified as
          matches-expected, correction, or not-counted. A spot-checked shelf and
          an unchecked one look identical in a schema that only stores the final
          number, and telling them apart is most of the value.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          What I did with the old button, and why
        </h3>
        <p className="text-muted">
          Three options, all defensible. Delete it and force the full flow; keep
          it as a second, un-audited path; or rewrite it. Deleting it turns
          &quot;top everything up before I leave&quot; into a six-step wizard,
          which is a worse product for a real operator on a real route. Keeping
          it un-audited leaves a hole straight through the feature I just built.
        </p>
        <p className="mt-3 text-muted">
          So I rewrote it. Quick-fill now opens a session, writes a line per
          item marked <em>not counted</em> with the top-up as the add, and
          completes it. The response shape is byte-identical for the existing
          client, so the optimistic mutation on the frontend did not change at
          all &mdash; but the shortcut now leaves the same trail as a walked
          shelf, and honestly labels itself as a fill nobody counted.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          How the backend shaped the frontend, again
        </h3>
        <p className="text-muted">
          The API contract here is not a passive data pipe; it decided the shape
          of the UI in three places.
        </p>
        <p className="mt-3 text-muted">
          <strong>Completing twice is a 409, so the client can be dumb.</strong>{" "}
          A double submit from a phone with a flaky connection is the likeliest
          failure mode in this whole feature, and applying the adds and removes
          twice would silently corrupt the shelf. Because the server refuses the
          second one, the frontend does not need request de-duplication, an
          idempotency key, or a disabled-button race. It needs a disabled button
          for the common case and an error message for the rare one. Pushing
          that invariant server-side removed a category of client state.
        </p>
        <p className="mt-3 text-muted">
          <strong>
            Lines are upserted on{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
              (session_id, item_id)
            </code>
            , so saving is idempotent.
          </strong>{" "}
          That is what makes it safe to push a line on slot-save and retry
          without thinking. And it is why I push on save rather than on every
          tap: per-keystroke writes over a bad connection is the obvious wrong
          design, so the local draft is the source of truth until a slot is
          done, and then exactly one request goes out.
        </p>
        <p className="mt-3 text-muted">
          <strong>
            The session lives in the database, so resume is nearly free.
          </strong>{" "}
          One localStorage key holds the id; a reload re-fetches the session and
          carries on. That sounds like a small thing and is not: the target
          device is a phone in a parking garage or a stairwell, and losing
          twenty slots of counting to a backgrounded tab would make the whole
          feature untrustworthy. Real offline queueing needs conflict rules and
          is a project of its own, so I drew the line at surviving a refresh and
          said so.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Design for a thumb in a cold room
        </h3>
        <p className="text-muted">
          Steppers, not number inputs. Every target at least 44px. The running
          result is in an{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            aria-live=&quot;polite&quot;
          </code>{" "}
          region so it can be confirmed without looking away from the shelf. The
          reason picker is a real radiogroup that becomes required the instant
          anything is removed, with the message tied by{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            aria-describedby
          </code>{" "}
          rather than shown as a floating red string.
        </p>
        <p className="mt-3 text-muted">
          Two of my own component tests failed on the first run and both were
          real bugs, not bad tests. The skip-count control relabelled itself as
          it toggled, which reads as two different buttons; it now keeps one
          label and carries the state in{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            aria-pressed
          </code>
          . And &quot;not counted&quot; appeared twice on the same screen in two
          different meanings. Writing the assertion from the operator&apos;s
          point of view is what surfaced both.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Who this helps
        </h3>
        <p className="text-muted">
          <strong>Operators</strong> get the question they actually have an
          answer to at month end: where did the margin go. &quot;Restocked 6
          items&quot; tells them nothing; &quot;-5 (3 expired, 2 damaged), 2
          corrections&quot; is a sentence they can act on. And the correction
          count is a second, quieter signal &mdash; a slot that keeps
          disagreeing with the sensor is a hardware problem, not a stock
          problem.
        </p>
        <p className="mt-3 text-muted">
          <strong>Developers</strong> get one write path to inventory and a pure
          helper that owns the arithmetic on both sides. Every future feature
          that moves stock &mdash; fill targets, pick lists, returns &mdash;
          writes a session rather than inventing its own update, so the audit
          trail keeps working without anybody maintaining it. The reason codes
          being a constrained enum rather than free text is the same bet: it
          costs a migration to add one, and it makes &quot;how much did we lose
          to expiry last month&quot; a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            GROUP BY
          </code>{" "}
          instead of a research project.
        </p>
      </section>

      <section
        id="update-2026-08-02-timezones"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 2, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Timezones: I went looking for a missing feature and found a bug
        </h2>
        <p className="text-muted">
          I sat down and went through Micromart&apos;s product properly &mdash;
          the platform pages, the help centre, and most usefully their public
          changelog, which is dated and only lists what actually shipped. Their
          operator platform is organised as six areas: stores and monitoring,
          products and pricing, inventory and restocking, marketing and
          promotions, sales and insights, and finances and taxes. About seven
          months ago they shipped a release note that reads: dashboard data,
          timestamps, reports and CSV exports now display in local North
          American timezones.
        </p>
        <p className="mt-3 text-muted">
          I went to compare that against mine, expecting to write down a missing
          feature. What I found instead was that mine was wrong.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The bug
        </h3>
        <p className="text-muted">
          Every bucket boundary in the whole stack was UTC.{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            buildPeriods
          </code>{" "}
          floored with{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            Date.UTC
          </code>
          ,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            alertsByDay
          </code>{" "}
          divided epoch milliseconds by 86,400,000, and on the API side the SQL
          truncated with a bare{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            date_trunc(granularity, occurred_at)
          </code>
          , which resolves in whatever timezone the database session happens to
          be in.
        </p>
        <p className="mt-3 text-muted">
          For a Toronto store in summer that puts the day boundary at 8pm the
          previous evening. For Vancouver it&apos;s 5pm. The busiest part of an
          operator&apos;s afternoon was being filed under tomorrow. Nobody
          noticed because the seed data is spread evenly and every store was
          treated identically &mdash; the bug is invisible right up until you
          care which day a sale landed in, which is the entire reason a sales
          chart exists.
        </p>
        <p className="mt-3 text-muted">
          That&apos;s the honest version of &quot;competitive analysis&quot; for
          me. Reading someone else&apos;s changelog is worth doing not because
          you copy the feature, but because it points a flashlight at the
          assumption you never checked.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Where the timezone lives, and why that&apos;s a product decision
        </h3>
        <p className="text-muted">
          The first real question isn&apos;t technical. A timezone could
          reasonably come from the browser or from the store, and picking wrong
          makes the whole feature feel broken. I went with the store. An
          operator servicing a Vancouver route from a hotel room in Toronto
          should not watch every chart shift three hours because they got on a
          plane. The store&apos;s day belongs to the store.
        </p>
        <p className="mt-3 text-muted">
          That decision is what makes the rest of the design fall out cleanly:
          the zone is resolved server-side, travels in the store DTO, and the
          client only ever formats with it. The frontend never re-derives
          policy, which means there is exactly one place a Vancouver store can
          be told it&apos;s in Vancouver.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          How the backend shaped the frontend
        </h3>
        <p className="text-muted">
          This is the part I find most interesting, because three constraints
          that live entirely in the API ended up dictating frontend code.
        </p>
        <p className="mt-3 text-muted">
          <strong>Postgres 15, not 16.</strong> The clean way to do this in SQL
          is the three-argument{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            date_trunc(field, source, zone)
          </code>
          , which landed in Postgres 16. This project runs 15. So the SQL does
          the round trip by hand: shift the timestamptz into local wall clock
          with{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            AT TIME ZONE
          </code>
          , truncate there, shift the result back. It works on both versions, so
          the fix doesn&apos;t quietly depend on someone bumping a Docker tag.
          The knock-on for the client is that the instants coming back are local
          period starts, not UTC midnights &mdash; which is why the bucket join
          key is now the raw instant rather than a sliced ISO string.
        </p>
        <p className="mt-3 text-muted">
          <strong>Migrations run by hand.</strong> Nothing in CI, the Dockerfile
          or the start script runs the migration. Deploying code that selects a
          column which doesn&apos;t exist yet would 500 the entire stores
          endpoint. So the column is nullable, the API resolves{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            store.timezone ?? timezoneForProvince(store.province)
          </code>
          , and on the client the field is optional in the Zod schema with the
          province as a fallback. A browser holding the new bundle against an
          API that hasn&apos;t deployed yet still renders correctly. That&apos;s
          not defensive padding &mdash; it&apos;s the only reason the two PRs
          can land in either order.
        </p>
        <p className="mt-3 text-muted">
          <strong>The same calendar math had to exist twice.</strong> The API
          buckets for the fleet rollup; the client buckets for per-store views
          over data it already has in cache. I deliberately did not extract a
          shared package for this. Two small, tested, independently-versioned
          copies of about eighty lines beat a shared dependency that couples a
          Next app&apos;s deploy to an Express service&apos;s, for a function
          whose inputs are two dates and a string. The compromise is that the
          two can drift; the mitigation is that the DST cases are pinned by
          tests on both sides, and drift there fails loudly.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          No date library, and what that cost
        </h3>
        <p className="text-muted">
          The only question zone-aware bucketing actually asks is: given this
          instant and this zone, what is the local year, month, day and hour.{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            Intl.DateTimeFormat.formatToParts
          </code>{" "}
          answers exactly that, using tzdata the runtime already ships. Pulling
          in Luxon or date-fns-tz would send 20 to 60kB of a second copy of
          tzdata down the wire, on a release cadence I don&apos;t control, to do
          a job the platform already does.
        </p>
        <p className="mt-3 text-muted">
          The cost is real though, and it&apos;s the thing people get wrong with{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            Intl
          </code>
          : constructing a formatter is genuinely expensive, while calling one
          is cheap. So formatters are built once per zone and cached in a
          module-level Map. But the bigger win is structural rather than a
          cache: rather than asking &quot;what local day is this sale in&quot;
          once per sale,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            dayBoundaries
          </code>{" "}
          resolves the eight local-midnight boundaries up front and then places
          every sale with plain integer comparisons. Over eighteen months of
          history that&apos;s eight zone resolutions instead of tens of
          thousands, and it&apos;s the difference between a chart that renders
          instantly and one that stutters when you flip the range toggle.
        </p>
        <p className="mt-3 text-muted">
          Getting DST right is the whole reason this needs care. A local day is
          not 86,400,000 milliseconds twice a year: in 2026 March 8 is 23 hours
          long and November 1 is 25. The instant lookup runs two passes, because
          the UTC offset you need depends on the instant you&apos;re trying to
          find. Three tests pin exactly that, plus one for Newfoundland, which
          sits at minus three thirty and breaks any code that assumes zone
          offsets are whole hours.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The compromise I actually had to think about
        </h3>
        <p className="text-muted">
          Per-store views have an obvious right answer. The fleet view does not.
          The fleet spans BC through Ontario, so a bucket labelled
          &quot;Tue&quot; cannot simultaneously be Vancouver&apos;s Tuesday and
          Toronto&apos;s &mdash; those are different, three-hour-offset spans of
          real time.
        </p>
        <p className="mt-3 text-muted">
          The tempting answer is to bucket each store in its own zone and add
          the results up. That&apos;s the one genuinely wrong option, and
          it&apos;s wrong in a way that hides: local days are offset spans, so
          the windows overlap and leave gaps, the buckets stop being a partition
          of time, and the bar heights become quietly meaningless. Nothing about
          the chart looks broken. It just isn&apos;t true.
        </p>
        <p className="mt-3 text-muted">
          So the fleet chart buckets in one zone &mdash; the viewer&apos;s,
          because &quot;my Tuesday&quot; is how someone reading a roll-up
          actually thinks &mdash; and the UI says so, in plain text, right under
          the range toggle. The label is not decoration or a disclaimer. It is
          the thing that makes the number honest, and it&apos;s text rather than
          a tooltip so a screen reader gets the same disclosure as a mouse does.
        </p>
        <p className="mt-3 text-muted">
          One more small inconsistency I chose on purpose: the existing{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            granularity
          </code>{" "}
          param falls back silently on garbage, but a bad{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            tz
          </code>{" "}
          returns a 400. A wrong granularity shows you the wrong range and you
          can see that immediately. A wrong zone shifts every boundary in the
          response by hours and looks completely normal. Failing loudly is worth
          breaking a convention for.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Who this actually helps
        </h3>
        <p className="text-muted">
          <strong>Operators</strong> get a day that starts when their day
          starts. The late-afternoon rush shows up on the afternoon it happened,
          the restock they did at 7pm is on that evening, and the 7-day trend is
          seven of their days rather than seven arbitrary 24-hour windows. On
          the fleet view they get something subtler but more valuable: a number
          they can trust, because it tells them what it&apos;s measuring.
        </p>
        <p className="mt-3 text-muted">
          <strong>Developers</strong> get one module that owns the conversion
          between an instant and a local wall clock, on each side, instead of{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            Date.UTC
          </code>{" "}
          scattered through four files. Every new time-bucketed feature takes a
          zone parameter and inherits correct DST behaviour for free. That
          matters immediately, because the next two things I want to build on
          this dashboard are a restock audit trail and scheduled promotions
          &mdash; and both of those are worthless if &quot;when&quot; is wrong.
        </p>
      </section>

      <section
        id="update-2026-08-02-pricing"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 2, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Pricing &amp; promotions: a profit calculator per store
        </h2>
        <p className="text-muted">
          I went and looked at what the commercial smart-store platforms
          actually put in front of an operator, and the same section kept coming
          up that mine didn&apos;t have: products and pricing. Manage what you
          sell and how you price it, run a discount across the shelf, and a
          profit calculator to see what a promotion does to the numbers. My tabs
          could tell an operator what sold and what tax they owed, but nothing
          helped them decide what to charge. So this is a new Pricing tab,
          sitting between Sales and Tax where the revenue tabs cluster.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A calculator, not a price editor
        </h3>
        <p className="text-muted">
          The obvious version of this persists a new price back to the store. I
          deliberately didn&apos;t. Committing a price is a real write with a
          real schema change flowing through the backend, and the question an
          operator actually asks first is &quot;what would happen if I did
          this&quot; &mdash; not &quot;change it now.&quot; So the tab is a
          model: pick a discount per product, or one discount across the whole
          shelf, and watch the projected weekly revenue move. It&apos;s the same
          derive-not-store call I made for tax &mdash; the sales and the list
          prices are the source of truth, and the calculator is a pure function
          over them, so there&apos;s no second price ledger to drift and no
          round-trip to wait on. The{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            price-update
          </code>{" "}
          activity type is already in the model for the day a persisted write
          lands.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The numbers
        </h3>
        <p className="text-muted">
          Everything is in{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            operator-pricing.ts
          </code>
          , pure and unit-tested with no component in sight.{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            promoPrice(list, percent)
          </code>{" "}
          applies and rounds the discount (and clamps a fat-fingered percent
          into 0&ndash;100),{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            weeklyUnitsFor
          </code>{" "}
          pulls the trailing-7-day demand for a product out of the sales list,
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            summarizePricing
          </code>{" "}
          rolls the rows into the headline: projected weekly revenue at list
          versus with the promos, the delta between them, and how many products
          are discounted at what average. Tax-included price per row reuses the
          existing{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            computeTax
          </code>{" "}
          by the store&apos;s province, so the pre-tax and with-tax numbers
          can&apos;t disagree with the Tax tab.
        </p>
        <p className="mt-3 text-muted">
          The one honesty note I made sure to put in the UI: the projection
          assumes volume holds at the new price. A real discount usually lifts
          volume, but modelling elasticity from a demo&apos;s seeded sales would
          be inventing a number. So the tab measures the thing it can actually
          measure &mdash; the revenue you give up (or keep) per week if the same
          units move &mdash; and says so, rather than dressing up a guess as a
          forecast.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          From revenue to profit
        </h3>
        <p className="text-muted">
          The version the commercial platforms actually sell is a{" "}
          <em>profit</em> calculator, not just revenue, and a discount only
          makes sense against what a product costs. My inventory carries a sale
          price but no cost of goods, and I didn&apos;t want to invent a backend
          field for it. So cost is derived from an assumed gross margin the
          operator plugs in &mdash; 30, 40, 50, 60% &mdash; the same &quot;enter
          your numbers&quot; move those calculators make.{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            unitCost(list, margin)
          </code>{" "}
          turns the margin into a cost,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            buildProfitTable
          </code>{" "}
          layers projected weekly profit at list and promo onto each row, and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            summarizeProfit
          </code>{" "}
          totals it and counts anything the discount has pushed below cost.
        </p>
        <p className="mt-3 text-muted">
          That below-cost guard is why the discounts go all the way to a 50%
          clearance cut. A gentle 10% off never threatens a healthy margin, but
          a clearance promotion can absolutely sell a product at a loss, and the
          calculator should say so &mdash; the row turns red and the header
          warns how many products are underwater at the current margin.
          It&apos;s the difference between &quot;here&apos;s a discount&quot;
          and &quot;here&apos;s what the discount does to the bottom line.&quot;
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Usable and accessible
        </h3>
        <p className="text-muted">
          The discount controls are real buttons with{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            aria-pressed
          </code>{" "}
          on the selected step and labels a screen reader can read (&quot;Set
          Coca-Cola 355ml discount to 10%&quot;), the per-product breakdown is a
          proper table with scoped headers and a caption, and the revenue impact
          carries a sign and a label so colour is never the only signal.
          Store-wide &quot;apply to all&quot; is one row of buttons at the top
          so setting a shelf-wide campaign is a single click, then you fine-tune
          individual products from there.
        </p>
      </section>

      <section
        id="update-2026-07-31"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; July 31, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Running the store, not just watching it
        </h2>
        <p className="text-muted">
          Picking this back up today. The original dashboard answers one
          question well: which stores need attention right now. But an operator
          also runs each store as a small business, and the tabs didn&apos;t
          help with any of that. So this is a continuation, not a rewrite
          &mdash; three new capabilities layered onto the same in-memory demo
          data and the same pure-function-plus-schema patterns the rest of the
          feature already uses.
        </p>
        <ul className="mt-3 list-disc pl-5 text-muted space-y-1">
          <li>
            <strong className="text-foreground">Store arrangement</strong>{" "}
            &mdash; know which product is in which spot, and what to refill on
            the next visit.
          </li>
          <li>
            <strong className="text-foreground">Sales history</strong> &mdash;
            see what actually sold, not just what&apos;s in stock.
          </li>
          <li>
            <strong className="text-foreground">Tax calculator</strong> &mdash;
            Canada, so GST/HST/PST/QST worked out per province with a remittance
            history.
          </li>
        </ul>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Store arrangement: slots have addresses now
        </h3>
        <p className="text-muted">
          The planogram already drew the shelves, but a slot was just a box in a
          grid. If I&apos;m standing in front of the fridge, &quot;box three on
          the second shelf&quot; means nothing. So every slot now carries an
          address &mdash; shelf letter plus 1-based position, so the fifth item
          on shelves of four is{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            B1
          </code>
          . One helper,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            slotLabelFor(index, shelfWidth)
          </code>
          , owns that math so the grid and the refill list can&apos;t disagree
          about where something lives.
        </p>
        <p className="mt-3 text-muted">
          On top of that is a &quot;refill run&quot;:{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            getRefillList
          </code>{" "}
          pulls out every slot below the healthy fill line, tags it with its
          address, and sorts most-empty first. That&apos;s the actual job
          &mdash; not &quot;here&apos;s the whole planogram,&quot; but &quot;go
          to A2, then B1, then C4, in that order.&quot; I kept it to addressing
          and a refill list rather than drag-and-drop rearranging. Drag-and-drop
          is a lot of surface area for a demo, it&apos;s fiddly to test, and it
          doesn&apos;t answer the question the operator actually has, which is
          where things are and what needs topping up.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Sales history
        </h3>
        <p className="text-muted">
          New Sales tab, backed by a seeded sales store and a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            GET /api/operator/stores/[storeId]/sales
          </code>{" "}
          route, fetched by a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useOperatorSales
          </code>{" "}
          hook on the same 60-second polling tier as inventory &mdash; sales
          drain stock, so they move at roughly the same cadence. The display
          numbers are all pure functions over the sales list:{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            summarizeSales
          </code>{" "}
          for the headline totals,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            topSellingProducts
          </code>{" "}
          for the per-product rollup ordered by revenue, and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            salesByDay
          </code>{" "}
          for a last-7-days revenue trend. Keeping them pure means they test
          without a component in sight, and the tab is just a thin view over
          their output.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Tax calculator: Canada, by province
        </h3>
        <p className="text-muted">
          This is the piece with real domain logic. Operators are assumed to be
          in Canada for now, so a store gained a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            province
          </code>{" "}
          field and the tax lib carries a table of GST/HST/PST rates for all
          thirteen provinces and territories. Three regimes: HST provinces
          charge one combined rate (Ontario 13%, the Maritimes 15%, Nova
          Scotia&apos;s reduced 14%), GST-only jurisdictions charge the flat 5%
          federal rate, and GST+PST provinces stack the 5% on a provincial rate
          &mdash; including Quebec, whose QST of 9.975% sits in the provincial
          slot.
        </p>
        <p className="mt-3 text-muted">
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            computeTax(subtotal, province)
          </code>{" "}
          rounds each component to the cent independently and then sums them,
          which is how a real invoice itemizes tax &mdash; you don&apos;t round
          the total, you round each line. And{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            buildTaxHistory
          </code>{" "}
          rolls the sales into per-month remittance rows, newest first, so
          there&apos;s a record to file against. On top of that,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            summarizeRemittance
          </code>{" "}
          totals what&apos;s actually owed and splits it into the federal
          portion (GST/HST, off to the CRA) and the provincial portion
          (PST/QST), which is the number the operator really wants: how much do
          I owe, and to whom.
        </p>
        <p className="mt-3 text-muted">
          The decision I&apos;m happiest with here: the tax is derived from the
          sales data, not stored in its own ledger. The sales are the source of
          truth; a second tax store would just be a copy that can fall out of
          sync. Recomputing from the sales every time is cheap at this scale and
          there&apos;s nothing to drift. The rates are the one thing that
          genuinely lives outside the sales &mdash; they&apos;re a small table,
          and if a province changes a rate that&apos;s a one-line edit in{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            operator-tax.ts
          </code>
          .
        </p>
        <p className="mt-3 text-muted">
          Same tradeoffs as the original still apply. The rate table is a
          point-in-time snapshot, not a live tax service, so a real deployment
          would want dated rate schedules and probably a proper accounting
          integration rather than a demo remittance table. But for showing the
          shape of the thing &mdash; the province regimes, the itemized
          breakdown, the monthly history &mdash; a pure lib over seeded sales is
          exactly enough.
        </p>
      </section>

      <section
        id="update-2026-07-31-planogram"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; July 31, 2026 (later the same day)
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Making the planogram do something
        </h2>
        <p className="text-muted">
          The addresses and the refill run were a good start, but the planogram
          was still something you only looked at. Two things it should let you
          actually do: rearrange where products sit, and deal with a slot whose
          sensor has drifted. So I made it interactive.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Rearranging, and why it had to persist
        </h3>
        <p className="text-muted">
          The catch with an editable planogram is the 60-second inventory poll.
          If a rearrange only lived in component state, the next poll would wipe
          it out and the shelf would snap back. So the layout got its own
          persisted store &mdash; an ordered list of slots, each with a sensor
          flag &mdash; behind{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            GET
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            PATCH /api/operator/stores/[storeId]/planogram
          </code>
          . A move optimistically reorders the cached slots so the shelf shifts
          the instant you act, then the PATCH commits it and a rollback restores
          order if the request fails &mdash; the same optimistic pattern the
          restock and dismiss actions already use.
        </p>
        <p className="mt-3 text-muted">
          The reordering itself is a pure function,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            moveSlot(order, from, to)
          </code>
          , and the render-ready grid comes from{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            assemblePlanogram
          </code>
          , which joins the persisted slot order and sensor flags with the live
          inventory. Both are unit-tested with no component in sight, which is
          exactly why I keep the moving parts out of the UI.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Keyboard first, drag second
        </h3>
        <p className="text-muted">
          Drag-and-drop is the obvious way to rearrange a grid, but drag-only
          isn&apos;t accessible &mdash; you can&apos;t tab and drop. So the
          primary control on each slot is a pair of arrow buttons with real
          labels (&quot;Move Cola to the next slot&quot;), fully
          keyboard-operable, and native HTML5 drag is layered on top as a mouse
          convenience that calls the same reorder path. The buttons are also
          what the tests drive, so the behavior I ship is the behavior
          that&apos;s covered.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Doing something about a sensor mismatch
        </h3>
        <p className="text-muted">
          A slot can read as a &quot;mismatch&quot; &mdash; the sensor thinks
          something other than the planned product is there. Before, that was
          just an amber badge with no way to resolve it. Now a mismatched slot
          shows a Re-sync button that clears the flag (optimistically, then
          persisted). Because the sensor state lives on the persisted slot
          rather than being recomputed from the item id on every render, a
          re-sync actually sticks.
        </p>
      </section>

      <section
        id="update-2026-07-31-analytics"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; July 31, 2026 (later still)
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Sales analytics: ranges, and the whole fleet
        </h2>
        <p className="text-muted">
          The Sales tab showed a single &quot;last 7 days&quot; trend, which is
          fine for a glance but useless for spotting a monthly pattern or a
          year-over-year trend. And it was per-store only &mdash; there was no
          way to ask &quot;how is the whole fleet doing.&quot; So two things:
          range views, and a fleet rollup.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          One bucketing function, four ranges
        </h3>
        <p className="text-muted">
          The trend is now driven by{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            salesByPeriod(sales, granularity, now)
          </code>
          , which builds a fixed set of windows &mdash; 7 days, 8 weeks, 12
          months, or 5 years &mdash; ending at now, then drops each sale into
          its window. A Day/Week/Month/Year toggle on the Sales tab just changes
          the granularity argument; the re-bucketing is client-side over the
          sales already in cache, so switching ranges is instant and makes no
          request. Month and year use real calendar boundaries (UTC), day and
          week use fixed-width windows &mdash; same idea, and it takes an
          injectable{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            now
          </code>{" "}
          so every bucket boundary is testable without mocking the clock.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The fleet rollup, aggregated server-side
        </h3>
        <p className="text-muted">
          &quot;Per whole fleet&quot; is where the request count matters. I
          could have fetched every store&apos;s sales and summed them in the
          browser, but that&apos;s N requests that grow with the fleet &mdash;
          the exact fan-out I killed on the dashboard the first time around. So
          the fleet analytics aggregate server-side:{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            GET /api/operator/sales-analytics?granularity=…
          </code>{" "}
          runs{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            aggregateFleetSales
          </code>{" "}
          over every store and returns shared time buckets, a per-store revenue
          ranking, and the fleet total in one response. The dashboard&apos;s
          &quot;Fleet sales&quot; section reads it through a hook keyed by
          granularity, so each range caches on its own.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Counting the calls
        </h3>
        <p className="text-muted">
          The whole point here is efficiency, so it&apos;s worth being explicit
          about the request budget. Fleet analytics is{" "}
          <strong className="text-foreground">one request</strong> regardless of
          fleet size &mdash; the server does the fan-in, not the browser. The
          naive version (fetch every store&apos;s sales and sum in the client)
          is one request per store, so at 30 stores that&apos;s 30 requests
          versus 1. Switching the range on the per-store tab is{" "}
          <strong className="text-foreground">zero requests</strong>: the sales
          are already in cache and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            salesByPeriod
          </code>{" "}
          re-buckets them in memory. Each granularity caches under its own query
          key, so flipping back to a range you&apos;ve already seen is instant
          and makes no call either. It&apos;s the same instinct as the rest of
          the dashboard: the fleet overview already collapsed a 2N+1 per-poll
          fan-out into a single{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            fleet-summary
          </code>{" "}
          request, the tiered polling only asks as often as each data type
          actually changes, and operator actions update optimistically so a
          click never blocks on a round-trip. Fewer calls, and the ones we make
          do more.
        </p>
        <p className="mt-3 text-muted">
          One demo-data note: the seed used to scatter sales across the last
          week, which made the month and year views basically empty. I widened
          it to spread about eighteen months of history per store, so every
          range actually has bars to show. It&apos;s still seeded mock data
          &mdash; the point is the shape of the analytics, not the numbers.
        </p>
      </section>

      <section
        id="update-2026-07-31-boxes"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; July 31, 2026 (last one today)
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Planogram boxes: somewhere to put things
        </h2>
        <p className="text-muted">
          The interactive planogram let you rearrange products, but there was a
          gap I glossed over: the shelf was a dense list of occupied slots, so
          &quot;moving&quot; a product could only reorder or swap things that
          were already placed. There was nowhere <em>empty</em> to put anything.
          A real shelf has empty spots. So the model changed.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A box can be empty
        </h3>
        <p className="text-muted">
          A planogram box is now{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            {"{ itemId, sensorMatch }"}
          </code>{" "}
          where a null{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            itemId
          </code>{" "}
          means the box is empty. Each shelf is seeded with the store&apos;s
          products plus a spare empty shelf, so there&apos;s room to move things
          around. The move itself is one pure function,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            moveToBox(boxes, from, to)
          </code>
          : drop into an empty box and the source is vacated; drop onto an
          occupied box and the two swap. Nulls make{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            assemblePlanogram
          </code>{" "}
          render an empty box as a labelled drop target instead of skipping it,
          so every position keeps its address whether it&apos;s full or not.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          What it costs in calls
        </h3>
        <p className="text-muted">
          Worth being honest about the request pattern here too, since
          that&apos;s a theme across this whole feature. A move is{" "}
          <strong className="text-foreground">one</strong>{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            PATCH
          </code>
          , and it&apos;s optimistic: the client computes the new box layout
          with{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            moveToBox
          </code>
          , writes it straight into the query cache so the shelf moves on the
          same frame, then sends it. The layout is persisted server-side, so it
          survives the 60-second poll instead of snapping back &mdash; but
          nothing about the interaction blocks on the network. It&apos;s the
          same rule the rest of the dashboard follows: read paths are pooled
          into as few requests as possible (one fleet-summary, one
          sales-analytics), write paths update optimistically and reconcile in
          the background, and the poll cadence matches how fast each kind of
          data actually changes. Fewer round-trips, and the UI never waits on
          one.
        </p>
      </section>

      <section
        id="update-2026-08-01-backend"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 1, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Making it real: wiring the dashboard to a database
        </h2>
        <p className="text-muted">
          Everything so far ran on an in-memory store &mdash; seeded factory
          data that resets on restart. Great for a demo, but it was never real.
          So I moved the operator data into{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            portfolio_api
          </code>{" "}
          (the same Node/Express/Postgres backend the rest of the site uses)
          &mdash; real tables for stores, inventory, alerts, activity, sales,
          and the planogram &mdash; and rewired the dashboard to read and write
          it.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A BFF that falls back
        </h3>
        <p className="text-muted">
          Every{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            /api/operator/*
          </code>{" "}
          route is now a thin proxy over the live service, the same shape as the
          feature-flags console:{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            operator-client.ts
          </code>{" "}
          makes the validated HTTP calls and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            operator-bff.ts
          </code>{" "}
          prefers the API but falls back to the in-memory seed when the backend
          is unreachable. So the demo still works, and looks identical, whether
          or not the API is running &mdash; and if you do run it, you get real
          persistence. The client validates every response against the same Zod
          schemas the UI already uses, so a drifting API surfaces as a clear
          error instead of quietly bad state.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Aggregate in the database, not the app
        </h3>
        <p className="text-muted">
          This is where the earlier &quot;fewer calls&quot; instinct pays off
          for real. The fleet-summary and sales-analytics endpoints used to loop
          the in-memory data in JS; now they are grouped SQL on the server
          &mdash; one{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            GROUP BY
          </code>{" "}
          per axis (per store, per time bucket) instead of pulling every alert
          and sale row across the wire to sum them here. The browser still makes
          one request per view; the database does the fan-in. The backend even
          logs the aggregation time, so the win is something you can actually
          measure rather than just assert.
        </p>
        <p className="mt-3 text-muted">
          One small contract change fell out of it: a list read for a store that
          doesn&apos;t exist now returns an empty list, not a 404. The in-memory
          version 404&apos;d because the store simply wasn&apos;t in the map; a
          real list endpoint has no reason to &mdash; &quot;no rows&quot; is a
          fine answer. The store-detail read still 404s, because asking for a
          store that isn&apos;t there is a real not-found.
        </p>
      </section>

      <section
        id="update-2026-08-02-alerts"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 2, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Alert history, analytics, and keeping the demo honest
        </h2>
        <p className="text-muted">
          Going live surfaced a few things worth fixing, and one feature worth
          adding.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The &quot;always offline&quot; bug
        </h3>
        <p className="text-muted">
          As soon as the dashboard read from the database, every store went
          &quot;offline.&quot; A store&apos;s{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            lastPing
          </code>{" "}
          is sensor telemetry &mdash; a real device reports it continuously
          &mdash; but the seed writes it once, so it aged past the 10-minute
          offline threshold and stuck there, with nothing the operator could do.
          The in-memory demo had quietly recomputed a fresh ping on every read;
          the DB path lost that. The fix puts it back where the data lives: the
          backend synthesizes a recent ping per read from the store&apos;s
          status (online reads strong, degraded reads stale), so the freshness
          tiers still mean something. I audited the rest of the read path too
          &mdash;{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            lastPing
          </code>{" "}
          was the only value ever freshened on read, so it was the only place
          with the bug.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A scheduled re-seed, and saying so
        </h3>
        <p className="text-muted">
          Static seed data has a subtler version of the same problem: the
          historical timestamps don&apos;t move, so now-relative windows (the
          24-hour alert trend, the day/week sales ranges) slowly empty out.
          Rather than fake those on read, a cron job re-seeds the whole fleet on
          a schedule &mdash; the same pattern the feature-flags demo uses to
          restore itself. The CLI seed and the job now share one{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            seedOperator()
          </code>{" "}
          so they can&apos;t drift. And because a periodic reset would be
          confusing if it just happened, the dashboard now says so up front:
          your changes are saved for real, but reset periodically to keep the
          demo fresh.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Alert history and analytics
        </h3>
        <p className="text-muted">
          Dismissing an alert used to feel like deleting it. But the backend
          keeps every alert &mdash; the{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            acknowledged
          </code>{" "}
          flag just hides resolved ones from the active list &mdash; so the
          history was already there, unused. The Alerts tab now has an overview
          (active vs resolved, a severity split, the most common categories, a
          7-day trend) and an Active / Resolved toggle so an operator can look
          back at what was dismissed. It&apos;s all derived client-side with two
          pure helpers,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            summarizeAlerts
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            alertsByDay
          </code>
          , from the alerts already fetched &mdash; no new request. The
          cross-store version (fleet-wide alert analytics from a grouped SQL
          query) is the natural next step if it&apos;s useful.
        </p>
      </section>
    </>
  );
}
