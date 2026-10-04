import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  TEST_COUNT,
  UNIT_TEST_COUNT,
  E2E_TEST_COUNT,
} from "@/app/_shared/testCount.generated";
import {
  UpdateTimeline,
  Update,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";
import styles from "@/app/thoughts/_shared/chat.module.css";
import { ChatThread, Timestamp, Sent, Received } from "@/lib/threads";

export default function TestingContent() {
  return (
    <ThoughtLayout
      breadcrumb="Testing"
      title="Testing"
      intro={
        <>
          {TEST_COUNT}+ tests ({UNIT_TEST_COUNT} unit + {E2E_TEST_COUNT} e2e) —
          Vitest, Testing Library, MSW, and Playwright. Pure functions first,
          then hooks with fetch mocking, with
          a specific technique for proving that optimistic updates actually fire
          before the server responds.
        </>
      }
      chat={
        <ChatThread>
          <Timestamp>Today 10:00 AM</Timestamp>

          <Received pos="first">why did this codebase have no tests</Received>
          <Received pos="last">
            the dev guidelines say TDD is non-negotiable
          </Received>

          <Sent pos="first">
            yeah that was the most visible contradiction in the codebase. the
            docs declare test-driven development as the fundamental practice,
            and then there are zero test files
          </Sent>
          <Sent pos="last">
            any engineer reading it would eventually search for a .test.ts file,
            find nothing, and that gap would be harder to explain than just not
            having the docs at all
          </Sent>

          <Received>so what did you add</Received>

          <Sent pos="first">
            108 tests across 7 files. Vitest as the runner, Testing Library for
            the hook tests, MSW for intercepting fetch calls
          </Sent>
          <Sent pos="last">
            the targets were the parts actually worth testing: the rate limiter,
            the calendar layout algorithm, vitals formatting, the proxy rule
            table, and the two main hooks
          </Sent>

          <Timestamp>10:04 AM</Timestamp>

          <Received>why those specifically</Received>

          <Sent pos="first">
            pure functions first because they&apos;re the easiest to test and
            the most satisfying. the rate limiter has real edge cases — window
            resets, IP isolation, bucket isolation. the calendar layout
            algorithm assigns column positions to overlapping events and has
            enough branching to be worth specifying
          </Sent>
          <Sent pos="middle">
            vitals formatting is simple but it&apos;s also the kind of thing
            that breaks silently — if formatValue starts returning
            &quot;1000ms&quot; instead of &quot;1.0s&quot; for a value over
            1000, you won&apos;t notice until someone reads the dashboard
          </Sent>
          <Sent pos="last">
            the hooks are where the interesting behavior is. optimistic updates,
            rollbacks on failure, cursor-based pagination flattened across pages
            — that&apos;s the stuff a hiring engineer actually wants to see
            tested
          </Sent>

          <Timestamp>10:09 AM</Timestamp>

          <Received pos="first">how does MSW work in tests</Received>
          <Received pos="last">I thought it was a browser thing</Received>

          <Sent pos="first">
            MSW has two adapters. the browser adapter uses a service worker to
            intercept requests. the node adapter patches the global fetch and
            http modules directly — same handler syntax, different runtime
          </Sent>
          <Sent pos="middle">
            the setup is a shared server in src/test/server.ts. each test file
            calls server.use() to register handlers for that test&apos;s
            specific scenario. server.resetHandlers() runs after each test so
            handlers don&apos;t bleed between tests
          </Sent>
          <Sent pos="last">
            it&apos;s configured with onUnhandledRequest: &quot;error&quot; —
            any fetch that doesn&apos;t match a registered handler throws
            instead of returning an empty response. that forces you to be
            explicit about every network call a hook makes, including the
            refetch that fires after a mutation settles
          </Sent>

          <Timestamp>10:14 AM</Timestamp>

          <Received>
            what&apos;s the delay() trick for optimistic updates
          </Received>

          <Sent pos="first">
            the first version of the optimistic update tests used a fetchCount
            variable. the GET handler returned different data on the first vs
            subsequent calls — initial list, then the list with the new item
            included
          </Sent>
          <Sent pos="middle">
            it worked, but it was testing the wrong thing. it was verifying the
            final state after the full mutation cycle completed, not whether the
            cache updated before the server responded. calling the behavior
            &quot;optimistic&quot; and then only checking the end state is not a
            useful test
          </Sent>
          <Sent pos="last">
            the fix: add delay(300) to the POST handler in MSW. fire the
            mutation without awaiting it. the server is paused 300ms so the
            mutation is still in-flight when waitFor runs. the only way the
            assertion can pass that fast is if onMutate wrote to the cache
            synchronously — which is exactly what &quot;optimistic&quot; means
          </Sent>

          <div className={styles.codeBubble}>
            {`// mutation is in-flight — server delayed 300ms
act(() => { void result.current.createEvent(newEvent); });

// passes immediately because onMutate fires synchronously
await waitFor(() =>
  expect(result.current.events.some(
    (e) => e.title === "New Event"
  )).toBe(true),
);`}
          </div>

          <Timestamp>10:20 AM</Timestamp>

          <Received>tell me about the layout algorithm tests</Received>

          <Sent pos="first">
            layoutDayEvents takes a list of same-day timed events and assigns
            each one a column index and a total column count. the calendar grid
            uses those to absolutely position events side by side when they
            overlap — same visual as Google Calendar
          </Sent>
          <Sent pos="middle">
            the tests cover: a single event gets column 0 of 1. two
            non-overlapping events share column 0 because they never compete for
            space. two overlapping events get separate columns. three
            simultaneous events each report totalColumns: 3
          </Sent>
          <Sent pos="last">
            then pixel geometry: an event starting at hour 2 with a rowHeight of
            60 should have topPx of 120. a two-hour event should have heightPx
            of 120. a five-minute event enforces a 20px minimum so it&apos;s
            still clickable. that&apos;s the kind of math that&apos;s easy to
            get slightly wrong and hard to notice visually
          </Sent>

          <Timestamp>10:26 AM</Timestamp>

          <Received>why factory functions instead of beforeEach</Received>

          <Sent pos="first">
            shared mutable state is the main source of test interdependence. if
            a beforeEach sets up an object and a test mutates it, the next test
            in the block might run with corrupted state
          </Sent>
          <Sent pos="middle">
            factory functions return a fresh object every call. you can pass
            overrides for the fields you care about and ignore everything else.
            no let declarations at the describe level, no beforeEach that runs
            setup you didn&apos;t ask for
          </Sent>
          <Sent pos="last">
            crypto.randomUUID() for the id means every event and countdown is
            distinct by default. tests that check &quot;does this specific event
            appear&quot; use a fixed id override. tests that check &quot;does
            any event appear&quot; just use the default random id and match on
            title
          </Sent>

          <Timestamp>10:31 AM</Timestamp>

          <Received>how do the tests run automatically</Received>

          <Sent pos="first">
            GitHub Actions. there&apos;s a workflow that triggers on every push
            to main and develop, and on any PR targeting main. it runs typecheck
            first, then the full test suite
          </Sent>
          <Sent pos="last">
            Vercel watches the GitHub check status. if the workflow fails, the
            deploy is blocked — you can&apos;t push a broken commit to
            production without explicitly overriding the branch protection rule
            in GitHub settings
          </Sent>

          <Timestamp>10:36 AM</Timestamp>

          <Received>what would you add next</Received>

          <Sent pos="first">
            Playwright is already in — auth redirects, TCG browsing, calendar
            CRUD, and axe-core accessibility scans on every public route. that
            covers the integration layer
          </Sent>
          <Sent pos="middle">
            what&apos;s still missing is component tests. the hooks are tested,
            the pure functions are tested, but the UI components aren&apos;t.
            Modal focus trap behavior, Button aria-busy state, Input
            aria-invalid wiring — those belong in Vitest with Testing Library,
            not in Playwright
          </Sent>
          <Sent pos="last">
            after that, mutation testing with Stryker on the calendar layout
            algorithm and the vitals formatting. running it would tell you which
            assertions are just checking that the code runs, not that it runs
            correctly
          </Sent>

          <div className={styles.typingDots}>
            <span />
            <span />
            <span />
          </div>
        </ChatThread>
      }
    >
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-10-03-mutation",
            date: "Oct 3, 2026",
            title: "Mutation testing, and the survivor that was my own test file",
          },
          {
            id: "update-2026-08-16-never-ran",
            date: "Aug 16, 2026",
            title: "A suite in another repo that nothing was running",
          },
        ]}
      />
      <section>
        <h2 className="mb-3 text-lg font-bold">The gap</h2>
        <p className="text-muted">
          One principle that should be followed and be non-negotiable is
          Test-Driven Development (TDD). This codebase, before the change, had
          zero test files. The goal was to close that gap by targeting the parts
          of the codebase that are actually worth testing: the rate limiter, the
          calendar layout algorithm, the vitals formatting, and the hooks with
          their optimistic update behavior.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Setup</h2>
        <ul className="mt-2 space-y-2 text-muted">
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
            <span>
              <strong className="text-foreground">Vitest</strong> as the runner
              with jsdom environment — same config format as Vite, fast, no Jest
              compatibility layer needed
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
            <span>
              <strong className="text-foreground">Testing Library</strong> for{" "}
              <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                renderHook
              </code>{" "}
              and{" "}
              <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                waitFor
              </code>{" "}
              — both are needed for anything that touches React Query
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
            <span>
              <strong className="text-foreground">MSW</strong> in node mode for
              intercepting fetch calls in the hooks — the same library used for
              browser mocking, just with the node adapter. Configured with{" "}
              <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                onUnhandledRequest: &quot;error&quot;
              </code>{" "}
              so any fetch without a registered handler fails the test
              immediately instead of silently passing
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">What got tested</h2>
        <ul className="mt-2 space-y-2 text-muted">
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
            <span>
              <strong className="text-foreground">Rate limiter</strong> —
              allow/block behavior, remaining count, window reset, IP isolation,
              bucket isolation. Pure function, fake timers advance the clock
              without sleeping
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
            <span>
              <strong className="text-foreground">
                Calendar pure functions
              </strong>{" "}
              — event filtering by day, all-day vs timed event classification,
              spanning event ordering, and the overlap layout algorithm that
              assigns column positions so simultaneous events appear side by
              side
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
            <span>
              <strong className="text-foreground">Vitals formatting</strong> —
              millisecond vs second display, CLS decimal formatting, and the
              good/needs improvement/poor color thresholds for all five metrics
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
            <span>
              <strong className="text-foreground">Proxy rule matching</strong> —
              the rate limit rule table is tested in isolation without importing
              the full proxy module, which would pull in{" "}
              <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                next/server
              </code>{" "}
              and Auth0 and require a Next.js runtime
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
            <span>
              <strong className="text-foreground">
                useCalendarEvents and useCountdowns
              </strong>{" "}
              — fetch, SSR seeding, error states, and create/update/delete with
              both optimistic updates and rollback on failure
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Testing optimistic updates properly
        </h2>
        <p className="text-muted">
          The first attempt at testing optimistic updates used a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            fetchCount
          </code>{" "}
          variable to make the GET handler return different data on first vs
          subsequent calls. It worked, but it was testing the wrong thing — it
          verified the end state after a completed mutation cycle, not whether
          the cache updated before the server responded.
        </p>
        <p className="mt-3 text-muted">
          The fix is{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            delay()
          </code>{" "}
          from MSW. Add a 300ms pause to the POST/PUT/DELETE handler, then fire
          the mutation without awaiting it. The mutation is still in-flight when
          the assertion runs, so the test is checking the actual optimistic
          state — what the user sees before the server has responded.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The overlap layout algorithm</h2>
        <p className="text-muted">
          The calendar&apos;s{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            layoutDayEvents
          </code>{" "}
          function takes a list of same-day timed events and assigns each one a
          column index and a total column count, so they can be absolutely
          positioned side by side in the time grid. The tests cover: a single
          event gets column 0 of 1, two non-overlapping events share column 0,
          two overlapping events get separate columns, three simultaneous events
          get three columns each reporting{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            totalColumns: 3
          </code>
          , and pixel positions derived from the row height constant. This is
          the kind of logic that looks simple but has enough edge cases to be
          worth specifying in tests.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">CI and deploy gates</h2>
        <p className="text-muted">
          Tests only matter if they run automatically. A GitHub Actions workflow
          runs typecheck and the full unit suite on every push to{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            main
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            develop
          </code>
          , and on every PR targeting{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            main
          </code>
          . A second job runs after the first passes: it installs Chromium,
          boots the dev server, and runs the public Playwright suite — which
          includes axe-core accessibility scans on the landing page, TCG
          browser, and card detail page. A WCAG 2.1 AA violation blocks the
          merge just like a failing unit test. Vercel deploys are gated on both
          checks passing.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Factory functions</h2>
        <p className="text-muted">
          Every test uses factory functions instead of shared fixtures.{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            makeEvent()
          </code>
          ,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            makeCountdown()
          </code>
          , and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            makePage()
          </code>{" "}
          accept optional overrides and return fresh objects with randomized
          IDs. No{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            let
          </code>{" "}
          declarations, no{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            beforeEach
          </code>{" "}
          mutations. Each test constructs exactly what it needs and nothing is
          shared between tests.
        </p>
      </section>
      <Update
        id="update-2026-08-16-never-ran"
        date="August 16, 2026"
        title="A suite in another repo that nothing was running"
      >
        <p>
          The section above ends on the line that tests only matter if they run
          automatically, and I believed it enough to gate this app&rsquo;s
          deploys on it. The design system repo, which publishes packages to npm
          the moment anything reaches its main branch, had a suite spread across
          four workspaces &mdash; the palette contrast gate, the component
          contrast pairs, the token shape checks &mdash; and no workflow that
          ran any of it. Its workflows directory held a Chromatic job, a publish
          job and a tag job, and nothing else.
        </p>
        <p>
          <strong>
            And every one of them was green because I had remembered to run it.
          </strong>{" "}
          That is not a small distinction dressed up as a large one. A suite
          nothing runs is documentation of an intent, and it degrades exactly
          like documentation does: silently, at whatever rate the code moves,
          with no signal at the moment it stops being true. This one happened to
          still pass when I finally pointed a pipeline at it, which is luck
          rather than evidence.
        </p>
        <p>
          Adding the workflow was ten minutes. The part worth keeping is what I
          did before merging it: a new gate that has only ever been green has
          been shown to run, not shown to fail, and those look identical in a
          checks list. So I reintroduced a regression the suite is meant to
          catch &mdash; reverting one chart palette slot to a colour that
          collides under deuteranopia &mdash; watched it exit non-zero with the
          ratio it objected to, and reverted the revert. A gate I have never
          seen fail is a gate I have no reason to trust.
        </p>
        <p>
          The same repo also had a test count that{" "}
          <strong>doubled after a build</strong>, because its tokens package
          compiled its own tests into an output directory that the runner
          did not exclude, and then published that directory. The pipeline gap
          and the count are two of four findings of the same shape that week,
          written up in{" "}
          <a
            href="/thoughts/green-checks"
            className="text-primary-600 hover:underline dark:text-primary-400"
          >
            green checks
          </a>
          .
        </p>
      </Update>

      <Update
        id="update-2026-10-03-mutation"
        date="October 3, 2026"
        title="Mutation testing, and the survivor that was my own test file"
      >
        <p>
          The line at the bottom of this page said there was no mutation
          testing, so the suite proved the tests run rather than that they
          would fail on a real break. I added Stryker and pointed it at the
          NFL live-projection math: the share of a game left on the clock, the
          scoreboard parser, and the win-probability model. It&rsquo;s pure
          arithmetic full of boundaries, the kind of code where a test that
          only checks typical values passes against broken logic. And it
          hadn&rsquo;t been checked against a live game yet, so the tests were
          all it had.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The first run came in at 79%, against a break line of 80
        </h3>
        <p className="text-muted">
          Stryker makes small edits to the code (flip a comparison, drop a
          condition, swap <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">Math.max</code> for 
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">Math.min</code>), runs the tests against each one, and
          counts the edits the tests failed to notice. Of 191 mutants, 28 survived
          and 12 ran code no test touched.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`File               | % score | killed | survived | no cov
games.ts           |   83.33 |     35 |        6 |      1
matchups.ts        |   75.37 |     98 |       22 |     11
winProbability.ts  |  100.00 |     15 |        0 |      0
Final mutation score 79.06 under breaking threshold 80`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          One surviving branch was dead code
        </h3>
        <p className="text-muted">
          Deleting <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">if (period &gt; 4) return 0</code>, the overtime
          check in the game-clock share, changed nothing. An OT clock never runs
          longer than a quarter, so (4 &minus; period) quarters plus the clock is
          already zero or negative from period 5 on, and the clamp after it
          returns 0 anyway. The check only looked like it was doing the work, so
          I deleted it and pinned the clamp with a 15-minute playoff OT test.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Another was the &ldquo;projections too high&rdquo; bug waiting to happen
        </h3>
        <p className="text-muted">
          Replacing the week check in the stat lookup with <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">true</code> 
          also survived. Every fixture held a single week&rsquo;s stats, so
          nothing proved the parser ignores ESPN&rsquo;s season-total line that
          sits right beside the weekly one. Picking that up would show a
          300-point projection for one game. One fixture with the season line
          first killed it.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`[Survived] ConditionalExpression  src/lib/nfl/matchups.ts:99
-   (s) => s.scoringPeriodId === week && s.statSourceId === statSourceId,
+   (s) => true && s.statSourceId === statSourceId,`}
        </pre>
        <p className="mt-3 text-muted">
          The parser&rsquo;s &ldquo;degrades on a payload that isn&apos;t a
          league&rdquo; test was hollow in the same way. It passed 
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">{"{ nope: true }"}</code>, which every optional field in
          the schema accepts, so the failure branch never ran. A 
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">null</code> payload exercises it.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The strangest survivor was a bug in my test file
        </h3>
        <p className="text-muted">
          Emptying out <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">playerLine</code>&rsquo;s whole body, which
          should break every roster, &ldquo;survived&rdquo;, and Stryker flagged
          it as static. Applying the mutant by hand showed why. A 
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">describe</code> block parsed its fixture at collection
          time, outside any test, so with the parser broken the suite crashed
          before a single test ran. Vitest reported that as no tests, and Stryker
          read no failures as a survivor.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`FAIL  src/lib/nfl/matchups.test.ts
TypeError: Cannot read properties of undefined (reading 'started')
 ❯ src/lib/nfl/matchups.test.ts:313:17
Tests  no tests`}
        </pre>
        <p className="mt-3 text-muted">
          A real regression there would have looked like a suite that
          didn&apos;t run, not one that failed. Building the fixture inside a
          factory each test calls fixed it, which is also what the
          factory-function rule further up this page already asked for.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Some mutants can&apos;t be killed, so I wrote down why
        </h3>
        <p className="text-muted">
          A few mutants change nothing observable. Replacing an absent list
          with a list of junk parses to nothing either way, because the schema
          skips every entry. Those get a disable comment with the reason, rather
          than a test that pins trivia or a higher threshold that hides them.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`// Stryker disable next-line ArrayDeclaration: a missing list and a list of junk
// both parse to nothing, so the default can't be observed.`}
        </pre>
        <p className="mt-3 text-muted">
          The run now ends at 100%: 177 killed and none surviving, in 36
          seconds. The break threshold went up to 90, so a regression fails
          without one new mutant tripping it. A separate CI job runs Stryker
          whenever that code, its tests or the config change, and uploads the
          HTML report even when it fails.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "Factory functions instead of shared fixtures, so a test says what matters to it and nothing else.",
          "The overlap layout algorithm tested as pure logic, which is why the hardest part of the calendar is also the best covered.",
          "CI and deploy gates, so the suite blocks rather than informs.",
          "Mutation testing with Stryker on the NFL live-projection math, held at a 90% break threshold and run in CI when that code changes: it found dead code, a hollow parser test, a missing week check and a test file that crashed before running.",
        ]}
        couldImprove={[
          "Coverage is uneven by design and not by decision — the parts written test-first are well covered and the earlier features are not.",
          "Mutation testing covers one area so far, the NFL projection math; everywhere else the suite still only proves the tests run, not that they would fail on a real break.",
        ]}
        upcoming={[
          "Run mutation testing against the pure cores — the layout engine, the flag engine, the evidence classifier — where it is cheapest and most likely to find a hollow test.",
        ]}
      />
    </ThoughtLayout>
  );
}
