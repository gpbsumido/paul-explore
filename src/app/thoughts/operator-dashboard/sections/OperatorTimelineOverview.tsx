/** Update timeline nav plus the how-it-works-today and how-it-is-tested overview. */
export function OperatorTimelineOverview() {
  return (
    <>
      <nav
        aria-label="Update timeline"
        className="rounded-xl border border-border bg-surface p-5"
      >
        <h2 className="text-sm font-semibold text-foreground">Timeline</h2>
        <p className="mt-1 text-xs text-muted">
          Newest first &mdash; this write-up has updates, jump to one.
        </p>
        <ol className="mt-3 space-y-2 text-sm">
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 5, 2026
            </span>
            <a
              href="#update-2026-08-05-maintainability"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              A maintainability pass: factoring the read hooks and splitting
              this write-up
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 4, 2026
            </span>
            <a
              href="#update-2026-08-04-review-fixes"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Reviewing my own work, and fixing what the review found
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 4, 2026
            </span>
            <a
              href="#update-2026-08-04-live-backend"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              The five features had no backend, so I gave them one
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 4, 2026
            </span>
            <a
              href="#update-2026-08-04-csv"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              A CSV export, and the comma that breaks everything
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 4, 2026
            </span>
            <a
              href="#update-2026-08-04-finance"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              What actually landed, and the fee that ties two features together
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 4, 2026
            </span>
            <a
              href="#update-2026-08-04-search"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Find anything, and the keyboard problem underneath it
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 4, 2026
            </span>
            <a
              href="#update-2026-08-04-shrink"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              The loss report, and building the data it needed first
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 4, 2026
            </span>
            <a
              href="#update-2026-08-04-products"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Which products to cut, judged fairly
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 4, 2026
            </span>
            <a
              href="#update-2026-08-04-planner"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Planning a location before buying it
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 3, 2026
            </span>
            <a
              href="#update-2026-08-03-two-causes"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              The same bug twice, for two different reasons
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 3, 2026
            </span>
            <a
              href="#update-2026-08-03-visitor-identity"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Three questions, three answers, and one that has none
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 2, 2026
            </span>
            <a
              href="#update-2026-08-02-honest-states"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              A zero is a claim, and I was making it by accident
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 2, 2026
            </span>
            <a
              href="#update-2026-08-02-real-vs-fake"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Which of these bugs would a real operator have hit
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 2, 2026
            </span>
            <a
              href="#update-2026-08-02-service-token"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Locking the writes without making anyone log in
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 2, 2026
            </span>
            <a
              href="#update-2026-08-02-hardening"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              The bit before merging, where I found out I was wrong
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 2, 2026
            </span>
            <a
              href="#update-2026-08-02-promotions"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Promotions: my calculator could predict but never be wrong
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 2, 2026
            </span>
            <a
              href="#update-2026-08-02-restocking"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Restocking: my one button was a fiction
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 2, 2026
            </span>
            <a
              href="#update-2026-08-02-timezones"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Timezones: I went looking for a missing feature and found a bug
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 2, 2026
            </span>
            <a
              href="#update-2026-08-02-pricing"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Pricing &amp; promotions: a profit calculator per store
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 2, 2026
            </span>
            <a
              href="#update-2026-08-02-alerts"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Alert history, analytics, and keeping the demo honest
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Aug 1, 2026
            </span>
            <a
              href="#update-2026-08-01-backend"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Making it real: wiring the dashboard to a database
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Jul 31, 2026
            </span>
            <a
              href="#update-2026-07-31-boxes"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Planogram boxes: move products into empty spots
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Jul 31, 2026
            </span>
            <a
              href="#update-2026-07-31-analytics"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Sales analytics: day/week/month/year, per store and fleet
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Jul 31, 2026
            </span>
            <a
              href="#update-2026-07-31-planogram"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Interactive planogram: rearrange slots and re-sync sensors
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Jul 31, 2026
            </span>
            <a
              href="#update-2026-07-31"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Running the store: arrangement, sales history, tax calculator
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
              Initial
            </span>
            <span className="text-muted">
              Operator dashboard &mdash; fleet monitoring, alerts, inventory
              health, analytics
            </span>
          </li>
        </ol>
      </nav>

      <section
        id="by-kind"
        className="scroll-mt-24 rounded-xl border border-border bg-surface p-5"
      >
        <h2 className="text-sm font-semibold text-foreground">
          Find it by kind
        </h2>
        <p className="mt-1 text-xs text-muted">
          The same write-ups, grouped by what they are rather than when they
          happened.
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-foreground">
              Bugs found and fixed
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Most were found by building something else, not by looking for
              them.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              <li>
                <a
                  href="#update-2026-08-04-review-fixes"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  The shrink report rendered blank against the real backend,
                  because the database seed had no completed counts
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-timezones"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Every time bucket resolved in UTC, so a Toronto day started at
                  8pm the night before
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-real-vs-fake"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Two aggregate queries no database would accept, from a GROUP
                  BY parameter mismatch
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-real-vs-fake"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  The per-store sales endpoint never existed, so Sales and Tax
                  were empty against the real backend
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-real-vs-fake"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Alerts contradicted the inventory they described
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-real-vs-fake"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Every store card read 0% because absent data rendered as zero
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-honest-states"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Loading and absent both rendered as numbers nobody had
                  measured
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-honest-states"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Hand-drawn charts showed a shape with no way to read the value
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-restocking"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Starting a restock took two taps, because two components each
                  offered the button
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-hardening"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  A cache key accepted a timezone and threw it away
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-promotions"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  A Zod schema silently dropped fields the API had started
                  sending
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-real-vs-fake"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  The seeded store outlived its own shape and broke every write
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-service-token"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  A misconfigured token was disguised as a successful write
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-foreground">
              Tradeoffs taken knowingly
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Where I picked a side and can say why.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              <li>
                <a
                  href="#update-2026-08-04-review-fixes"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  The aggregation math duplicated across two repos, pinned by a
                  parity test rather than a shared package
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-04-finance"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Revenue Protect left out, because a protected-revenue figure
                  with no failure data would be invented
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-service-token"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  A service credential instead of user auth, so nobody has to
                  log in to try it
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-03-visitor-identity"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  A pseudonymous visitor id for fairness, deliberately not for
                  security
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-03-visitor-identity"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  A second visitor cookie that should have been the one already
                  there
                </a>
              </li>
              <li>
                <a
                  href="#how-it-is-tested"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  How the whole feature is tested, and what each tier cannot see
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-03-visitor-identity"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  E2E specs that passed against the seed whether or not the
                  backend worked
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-03-visitor-identity"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  A rate limiter an IPv6 user could have walked straight past
                </a>
              </li>
              <li>
                <a
                  href="#how-it-is-tested"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Two repos on different pnpm majors, so CI could not install
                  both
                </a>
              </li>
              <li>
                <a
                  href="#how-it-is-tested"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  An env loader that overwrote the empty value meant to override
                  it
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-03-visitor-identity"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Anonymous attribution is impossible, so it is labelled rather
                  than faked
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-hardening"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Migrations stay manual, and what makes that safe rather than
                  fragile
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-promotions"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  The same arithmetic deliberately duplicated across two
                  repositories
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-timezones"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  No date library, at the cost of caching formatters by hand
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-promotions"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Promotions are per-store, because guessing at fleet grouping
                  is worse than waiting
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-pricing"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  The calculator derives rather than stores, so there is no
                  second price ledger
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-foreground">
              Product and user experience
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Choices about what the operator sees and believes.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              <li>
                <a
                  href="#update-2026-08-04-planner"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  A location that never pays back says so, instead of inventing
                  a month count
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-04-products"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Dead SKUs stay in the performance report, because those are
                  the rows worth cutting
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-04-shrink"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Skipped counts are shown as coverage, so a shelf nobody
                  checked doesn&apos;t read as clean
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-timezones"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  The fleet chart names whose timezone it is using, which is
                  what makes the number honest
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-promotions"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Performance shows before and during side by side rather than a
                  single delta
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-promotions"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  No baseline says so instead of showing a fabricated percentage
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-restocking"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Skipping a count is recorded as a decision, not left blank
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-restocking"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Removals require a reason, because an unexplained one is
                  indistinguishable from theft
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-restocking"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Steppers and 44px targets, because it is used on a phone at a
                  fridge
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-honest-states"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Loading, absent and zero are three states, and only one is a
                  number
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-honest-states"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  A failed load says so, and gives a way to report it
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-honest-states"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Every chart answers the question its shape raises
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-foreground">
              Developer experience
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Choices about the next person, including future me.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              <li>
                <a
                  href="#update-2026-08-04-review-fixes"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  A cross-repo parity test, so the duplicated arithmetic fails
                  fast instead of only in the live E2E
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-04-finance"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  One fee model imported by both the planner and finance, so the
                  quote and the payout can&apos;t drift
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-04-review-fixes"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Stacked pull requests get CI now, after six of them merged
                  unverified
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-hardening"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Expand the schema first, deploy second, and why not to
                  automate migrations
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-service-token"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  A test suite that cannot be broken by what is in your own .env
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-real-vs-fake"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  SQL executed against a real database, because a mocked
                  repository accepts anything
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-service-token"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Integration tests through MSW rather than a stubbed fetch
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-real-vs-fake"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  The seeded store repairs itself when its shape is a version
                  behind
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-real-vs-fake"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Fallbacks say out loud that they happened
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-foreground">
              Performance
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Where the work was moved, and what it bought.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              <li>
                <a
                  href="#update-2026-08-01-backend"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Aggregation pushed into SQL rather than summing rows in the
                  app
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-timezones"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Eight timezone resolutions per chart instead of one per sale
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-promotions"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Promotion performance fetched per promotion, only when opened
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-02-restocking"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  A restock is one transaction, so a dropped connection costs
                  one slot
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-03-visitor-identity"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Rate limits now keyed per visitor rather than per egress IP
                </a>
              </li>
              <li>
                <a
                  href="#update-2026-08-01-backend"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  Polling tiered by how fast each thing actually changes
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section
        id="how-it-works-now"
        className="scroll-mt-24 rounded-xl border border-border bg-surface p-5"
      >
        <h2 className="mb-3 text-lg font-bold">How it works today</h2>
        <p className="text-muted">
          Where it has ended up, before any of the story of getting there. This
          is an operator dashboard for unattended retail: someone runs a few
          dozen smart fridges and micro-markets in lobbies and gyms, and needs
          to know which ones need attention, what sold, what to restock, and
          what it all earned.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The screens, and the fleet tools
        </h3>
        <p className="text-muted">
          The fleet page is the landing: every store as a card sorted
          worst-first, a stats bar, filters by status and name, a health donut,
          a 24-hour alert trend, per-store inventory comparison, and fleet-wide
          sales with a day, week, month or year range.
        </p>
        <p className="mt-3 text-muted">
          Clicking a store opens the detail page, which is eight tabs. Inventory
          has per-slot stock and starts a restock. Alerts has active and
          resolved views with a severity filter and a seven-day trend. Activity
          is the audit feed. Planogram is a drag-and-drop shelf layout with
          per-slot sensor re-sync. Sales is headline totals, a revenue trend,
          top sellers and recent transactions. Pricing is a discount and profit
          calculator plus scheduled promotions. Tax derives GST, HST, PST and
          QST from the store&apos;s province and shows what is owed. Restock
          History is every completed session for the store, with what was
          counted against what was expected.
        </p>
        <p className="mt-3 text-muted">
          Off the fleet page there are now five fleet-wide tools, each its own
          page. <strong>Plan a location</strong> models a new store&apos;s
          revenue and payback before you commit to it.{" "}
          <strong>Product performance</strong> ranks every product by revenue
          against its own category average, dead SKUs included.{" "}
          <strong>Shrink &amp; loss</strong> reconciles completed restock counts
          into unexplained shrink versus reasoned removals.{" "}
          <strong>Finance</strong> is weekly payouts with the fees shown rather
          than folded in. And <strong>Search</strong> is a keyboard-first
          combobox over stores, products and the tools themselves. They mirror
          what Micromart&apos;s own platform ships; the write-ups above cover
          how each was built.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Where the data lives
        </h3>
        <p className="text-muted">
          It is a real backend, not fixtures. Postgres behind an Express
          service, reached through a backend-for-frontend layer in this app so
          the browser never talks to the API directly. Every read and every
          write falls back to an in-memory seed if that service is unreachable,
          so the demo behaves identically whether or not the backend is awake.
          Aggregations that could get expensive (fleet sales, the alert trend,
          promotion performance, and now the planner benchmarks, product
          performance, shrink and finance rollups) are grouped in SQL rather
          than pulled into Node and summed.
        </p>
        <p className="mt-3 text-muted">
          The five fleet tools started life computing their numbers in the BFF
          from the seed, and only later got the real SQL endpoints behind them,
          wired the same live-first-then-fall-back-to-seed way as every other
          read. Because that arithmetic now lives in both repos, a parity test
          asserts the app&apos;s models and the API&apos;s copies produce
          identical numbers for the same canonical inputs, so a drift fails a
          millisecond test rather than surfacing as quietly wrong figures on a
          chart.
        </p>
        <p className="mt-3 text-muted">
          Reads poll on a tier: alerts every 15 seconds because they are what
          you are watching for, stores every 30, inventory and sales and
          planogram every 60. Writes are optimistic with rollback. Nothing polls
          in a background tab.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The three things worth looking at
        </h3>
        <p className="text-muted">
          <strong>
            Every bucket resolves in the store&apos;s own timezone.
          </strong>{" "}
          A Vancouver store&apos;s day starts at midnight in Vancouver, in the
          charts and in the SQL. The fleet view cannot be everyone&apos;s local
          day at once, so it picks one and names it on screen.
        </p>
        <p className="mt-3 text-muted">
          <strong>Restocking is a session, not a button.</strong> Walk the shelf
          slot by slot on a phone, optionally confirm a physical count, add and
          remove with a reason on anything taken out, review, complete. Skipping
          a count is recorded as a decision rather than left blank. Nothing
          touches stock until the session completes, in one transaction, and
          that is the only path that ever writes inventory.
        </p>
        <p className="mt-3 text-muted">
          <strong>Promotions run and then report back.</strong> Schedule a
          discount on a product or a whole store, and afterwards see units and
          revenue against the equal period before it. Both raw numbers, not just
          the delta, with the caveat that it is a comparison and not proof of
          cause.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Who can use it
        </h3>
        <p className="text-muted">
          Anyone, with no account, including the writes. That is deliberate:
          this exists so somebody can open a link and drive the real thing. The
          API instead trusts a shared secret only this app&apos;s server holds,
          so a visitor is unaffected while someone calling the API directly is
          not. Writes are rate limited, and the demo data reseeds nightly.
        </p>
      </section>

      <section
        id="how-it-is-tested"
        className="scroll-mt-24 rounded-xl border border-border bg-surface p-5"
      >
        <h2 className="text-lg font-bold">How it is tested</h2>
        <p className="mt-2 text-muted">
          Worth its own section, because almost every bug in this feature was
          found by a different tier than the one you would expect, and a few
          were found by no tier at all. The useful question about a test suite
          is not how many tests it has. It is what each layer is structurally
          incapable of seeing, and whether anything else covers that.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The tiers, and what each is actually for
        </h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4 font-medium">Tier</th>
                <th className="py-2 pr-4 font-medium">Answers</th>
                <th className="py-2 font-medium">Cannot see</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 align-top text-foreground">Unit</td>
                <td className="py-2 pr-4 align-top">
                  Does this pure function compute the right answer, across
                  timezones, DST and empty input
                </td>
                <td className="py-2 align-top">Whether anything calls it</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 align-top text-foreground">
                  Component
                </td>
                <td className="py-2 pr-4 align-top">
                  Does this component render and behave correctly in isolation
                </td>
                <td className="py-2 align-top">
                  The seam between two components
                </td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 align-top text-foreground">
                  Integration
                </td>
                <td className="py-2 pr-4 align-top">
                  Do the hooks, routes and components agree on a contract, with
                  the network stubbed
                </td>
                <td className="py-2 align-top">
                  Whether the real service honours that contract
                </td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 align-top text-foreground">
                  E2E (seed)
                </td>
                <td className="py-2 pr-4 align-top">
                  Does the whole flow work in a real browser
                </td>
                <td className="py-2 align-top">Anything about the database</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 align-top text-foreground">
                  E2E (live)
                </td>
                <td className="py-2 pr-4 align-top">
                  Does the flow work against a real API and a real Postgres
                </td>
                <td className="py-2 align-top">Production data and scale</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 align-top text-foreground">
                  SQL smoke
                </td>
                <td className="py-2 pr-4 align-top">
                  Will Postgres actually accept these statements
                </td>
                <td className="py-2 align-top">
                  Whether the results are right
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 align-top text-foreground">
                  Cross-repo parity
                </td>
                <td className="py-2 pr-4 align-top">
                  Do this app&apos;s models and the API&apos;s copies compute
                  the same numbers
                </td>
                <td className="py-2 align-top">
                  Whether either is correct on its own
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-muted">
          The last row is newer than the rest, and it exists because the five
          fleet aggregations are computed twice &mdash; once in this app&apos;s
          seed fallback, once in the API&apos;s SQL &mdash; so the live path and
          the demo agree. Nothing structural stops the two copies drifting, and
          the only tier that would otherwise catch it is the live E2E, which is
          slow and needs a database. So both repos assert the same canonical
          inputs against the same expected outputs; a formula changed in one and
          not the other fails a millisecond unit test. It is the cheap guard
          standing in for the shared package the duplication really wants.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Four bugs, and the tier that could never have caught them
        </h3>
        <p className="mt-3 text-muted">
          <strong>
            &ldquo;Start restock&rdquo; led to another &ldquo;Start
            restock&rdquo;.
          </strong>{" "}
          Two taps for one action. The component test rendered the flow on its
          own, so it never saw the button above it. A component test cannot
          catch a seam between components; that is not a gap in the test, it is
          the definition of the tier. It took a screenshot to notice, and an E2E
          spec to pin.
        </p>
        <p className="mt-3 text-muted">
          <strong>Two aggregate queries no database would accept.</strong>
          Every test in that module mocks the repository, and a mocked
          repository will happily return rows for SQL Postgres rejects outright.
          Hence the SQL smoke tier: it executes the real statements against a
          real database, and skips when there is no{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            DATABASE_URL
          </code>
          . They are all SELECTs on purpose, because a developer&apos;s{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            DATABASE_URL
          </code>{" "}
          often points at the deployed database, and a test suite that can write
          is a test suite that can destroy.
        </p>
        <p className="mt-3 text-muted">
          That sentence turned out to be describing my own machine. The API
          repo&apos;s{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            DATABASE_URL
          </code>{" "}
          pointed at the production proxy host, so{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            pnpm dev
          </code>{" "}
          read and wrote live data and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            pnpm migrate
          </code>{" "}
          migrated production. Writing SELECT-only tests was the right instinct
          aimed at the wrong target: I was hardening the tests against the
          hazard instead of removing it.
        </p>
        <p className="mt-3 text-muted">
          The actual cause was smaller and more stupid than it sounds. The
          compose file had a Postgres service but published no host port, so
          nothing running outside the compose network could reach it. There was
          no local database to point at, which made production the path of least
          resistance. One line of YAML, and the alternative exists. Redis had
          been set up correctly this whole time and the README even documented
          the pattern, which is the part I find worth writing down: the fix was
          already in the same file, applied to a different service.
        </p>
        <p className="mt-3 text-muted">
          <strong>The server would not boot.</strong> Two files claiming the
          same Next convention is a startup fatal, and every route 404&apos;d.
          Unit, integration, typecheck, lint and the dead-export check all
          passed, because not one of them starts Next. Same shape on the API
          side: a rate limiter whose key generator used a raw IP was rejected at
          boot by the library, because an IPv6 user is handed a whole /64 and
          could have minted a fresh budget per request by varying the low bits.
          All 271 API tests missed it, since they mock the limiter or never
          construct it. Two real bugs whose only witness was a process starting.
        </p>
        <p className="mt-3 text-muted">
          <strong>An endpoint that never existed.</strong> The Sales and Tax
          tabs called a route the API did not implement. They rendered empty
          against the real backend and perfectly against fixtures, for weeks.
          Which brings up the one that took the longest to see.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The fallback that hid the bugs, and the compromise
        </h3>
        <p className="mt-3 text-muted">
          The BFF falls back to seeded data when the API is unreachable. That is
          a genuinely good feature: the demo stays usable when the backend is
          asleep, which for something anyone can open without an account is most
          of its value. But the same mechanism that keeps the demo alive is the
          mechanism that hides whether the real path works, and I underrated
          that for a long time.
        </p>
        <p className="mt-3 text-muted">
          It went furthest in the E2E specs. They navigated to a hardcoded seed
          store id. With a real backend serving, the fleet comes back as UUIDs,
          the API 404s that id, the BFF falls back, and the specs pass &mdash;
          identically, whether or not the backend works. A test that cannot fail
          when the thing it covers is broken is not a test. That is also,
          exactly, how the missing sales endpoint survived.
        </p>
        <p className="mt-3 text-muted">
          Pointing them at the real fleet made CI go red, correctly: the
          deployed API was on an older release with no restock routes. But that
          was the wrong question for that tier. These specs exist to catch a
          seam between two components; pinning them to a separately-deployed
          service means the suite reports somebody else&apos;s deploy state and
          changes colour for reasons unrelated to the change under review. A
          test that fails for unrelated reasons gets ignored, and an ignored
          test is worse than no test.
        </p>
        <p className="mt-3 text-muted">
          So the compromise, stated rather than stumbled into: the seed is the
          default because it is the one fixture that is deterministic and always
          present, and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            OPERATOR_E2E_LIVE=1
          </code>{" "}
          switches to resolving the store off the fleet and driving whatever is
          really serving. The default does not cover integration. Saying so is
          the whole point &mdash; the previous version implied it did.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Closing it, rather than just labelling it
        </h3>
        <p className="mt-3 text-muted">
          Writing down a blind spot is better than drifting into one, but it is
          not a fix: nothing would ever have run the live mode, so an
          integration regression still had nowhere to fail. So there is a CI
          tier that stands up Postgres, builds the API from source, applies the
          migrations, seeds the operator tables, points this app at it and
          drives the whole restock flow. It picks up an API branch of the same
          name when one exists, so a frontend change that needs a backend change
          is tested as the pair it actually is rather than against whatever
          shipped last week.
        </p>
        <p className="mt-3 text-muted">
          It went green on its first working run, which is exactly when to be
          suspicious. Had the API not come up, the BFF would have fallen back,
          served seed ids, and every assertion would still have passed &mdash; a
          green run proving nothing, which is the precise failure the tier was
          built to prevent. Live mode now asserts the fleet gave it a real UUID
          and names the seed id it got instead. A passing test is a claim, and a
          claim is worth checking when the cost of it being wrong is that you
          stop looking.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Two pieces of friction worth recording
        </h3>
        <p className="mt-3 text-muted">
          The live tier died on its first attempt because the two repos pin
          different pnpm majors &mdash; this one on 8 with a v6 lockfile, the
          API on 10 with a v9 one &mdash; so one pnpm cannot install both. It
          reads the version out of the API&apos;s own{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            packageManager
          </code>{" "}
          field rather than hardcoding it here, where it would drift silently
          the next time the API upgrades and leave someone debugging a lockfile
          error in a repo they never touched.
        </p>
        <p className="mt-3 text-muted">
          And the E2E credential loader checked truthiness rather than presence,
          so setting a variable to empty on purpose was overwritten by the file
          it was meant to override. The effect was that there was no way to run
          the public tier without attempting a real Auth0 login &mdash; a small
          bug with a disproportionate cost, because it made the cheap half of
          the suite depend on the expensive half.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The fix that looked like a fix
        </h3>
        <p className="text-muted">
          The mock-registration bug above got repaired, and then turned up again
          a few days later in a passing build: fifty-four unmatched requests and
          thirteen silent fallbacks, still there. The repair had used a pattern
          that only recognised registrations written on a single line, so the
          four written across several lines kept their bare paths and kept
          missing.
        </p>
        <p className="mt-3 text-muted">
          What makes this one worth recording is that a partial fix and a
          complete one produce identical test output. Everything passed before,
          everything passed after, and the only difference lived in a log nobody
          had a reason to open. So the registrations are asserted against the
          source file now &mdash; not against behaviour, because the behaviour
          is indistinguishable either way.
        </p>
        <p className="mt-3 text-muted">
          The same shape showed up in the dependencies. A suite ran twice
          against an older build of a package than the manifest asked for,
          proving a fix that was not installed, and passed both times. That is
          checked at startup now, with a message naming the fix rather than
          leaving someone to work out why a green run disagreed with reality.
        </p>
        <p className="mt-3 text-muted">
          Both guards were tested by making them fail on purpose before being
          trusted, which is the same standard this page applies to everything
          else. A guard nobody has watched fail is just another claim.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Reading the output, not just the exit code
        </h3>
        <p className="text-muted">
          Every one of those was found by reading a <em>passing</em> build. The
          suite carried thirty React warnings about state settling after a test
          had finished, forty-five lines about a canvas the environment does not
          implement, and forty-odd unmatched requests, and I had been treating
          all of it as background.
        </p>
        <p className="mt-3 text-muted">
          It was not background. The React warnings were the visible half of two
          endpoints with no mock at all. The canvas lines came from a non-null
          assertion that would have thrown in any browser without 2d support.
          One unmatched request was a test reaching for a public blockchain node
          on the open internet, kept off the wire only because the mocker
          rejects anything it does not recognise.
        </p>
        <p className="mt-3 text-muted">
          Noise is not a property of output. It is a decision to stop reading,
          made once and then kept, and it is how the original fallback bug
          survived in plain sight for days. The run is clean now &mdash; no
          unmatched requests, no warnings, no environment chatter &mdash; so the
          next unexpected line is worth the look.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          What is still not covered
        </h3>
        <p className="mt-3 text-muted">
          The heavy tiers run nightly or on demand, not per commit, because
          spending several minutes of CI on every push to catch something twice
          a month is a bad trade. Quarantined flaky tests run nightly and never
          block a merge, on the view that a flake is fixed on its own clock
          rather than by blocking everyone else.
        </p>
        <p className="mt-3 text-muted">
          And one I only found by opening the release PR and watching the heavy
          jobs decline to run. Both of them &mdash; the full accessibility pass
          and the live-backend operator run &mdash; were conditioned on a
          schedule or a manual dispatch. A release PR is neither, so the job
          whose own name ends in <em>pre-release</em> sat out the one merge that
          is actually a release. It had been correct in every situation except
          the one it was named for, which is the sort of thing that survives
          review because the name reads like a guarantee. They now run on any
          pull request into the release branch; releases are rare, so the
          minutes are cheap.
        </p>
        <p className="mt-3 text-muted">
          A related one, found by thinking about what the release run had
          actually proved rather than that it was green: the live tier always
          pulled the API&apos;s development branch. For a release that is the
          wrong target. It would pass against backend code that is not deployed
          and say nothing about whether the version in production can serve the
          release &mdash; green for reasons unrelated to the thing it claims to
          check, which is the same shape as everything else on this page. Both
          branches happened to be identical the day I noticed, which is
          precisely when to fix it rather than after it has quietly waved
          through a release it should have stopped.
        </p>
        <p className="mt-3 text-muted">
          Making the gate run on releases immediately earned its keep, in a way
          I did not enjoy. The restock specs failed there with my own error text
          saying the service token was missing. The code was right: a rejected
          write is a misconfiguration rather than an outage, so it refused to
          fall back and fake success. The job was wrong. It runs against the
          deployed API, and those specs drive writes, so the obvious fix &mdash;
          hand CI the secret &mdash; would have converted a red build into
          scheduled write traffic against the production database. The only
          reason it had never written a real row is that the auth it lacked also
          happened to stop it. That is luck standing in for a decision, and luck
          is not a control. They are tagged and excluded from that job now; the
          live tier already covers them against a database built and thrown away
          per run.
        </p>
        <p className="mt-3 text-muted">
          The real gap is structural and worth naming: CI only triggers for pull
          requests into{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            main
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            develop
          </code>
          . This work shipped as a stack of eight PRs targeting each other, so
          none of them ran CI automatically &mdash; every run in this stack was
          dispatched by hand, and that is the only reason three of these bugs
          were found before merge rather than after. Widening the trigger to the
          branch prefix would fix it and cost CI minutes across every stack.
          That is a spending decision rather than a correctness one, which is
          why it is written down here instead of quietly changed.
        </p>

        <p className="mt-5 text-muted">
          Everything below is how it got here: the decisions behind each of
          those, the reasoning I would want to be asked about, the tradeoffs I
          took knowingly, and the several things I got wrong and had to go back
          and fix.
        </p>
      </section>
    </>
  );
}
