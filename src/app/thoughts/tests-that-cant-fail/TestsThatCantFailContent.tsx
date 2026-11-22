import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { Update, WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

/** Inline code chip, matching the rest of the write-ups. */
const C = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
    {children}
  </code>
);

const pre =
  "mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground";

const beat = "mt-6 mb-2 text-[15px] font-semibold text-foreground";

const linkClass = "text-primary-600 hover:underline dark:text-primary-400";

/**
 * The write-up on the test audit: three files that only passed in order, tests
 * that tested themselves, every way a green run hid something, the guards that
 * make it harder, and what to verify when an AI wrote the tests or reported on
 * them.
 */
export default function TestsThatCantFailContent() {
  return (
    <ThoughtLayout
      breadcrumb="Tests That Can't Fail"
      title="Tests that can't fail"
      intro={
        <>
          A CI run printed 137 dots and a green check, and I asked what it had
          actually run. Answering that turned into running every test file by
          itself, in a random order, and judging each test on one question:
          if the behaviour it is named for broke, would this fail? About one
          test in seven would not. The suite had 4,561 tests when I started and
          more than 7,400 when I stopped, and the interesting part is not the
          number that went up. It is how many different ways a green run can say nothing.
        </>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">
          Three files only passed in the order they were written
        </h2>
        <p className="text-muted">
          Vitest already isolates each file, so I expected nothing from running
          them alone. I ran all 504 with their tests shuffled, under two seeds.
          Three failed, every one of them green in the normal run:
        </p>
        <pre className={pre}>
          {`ResearchContent  refreshes the evidence scan on demand
  AssertionError: expected 6 to be 1

MindReaderContent  mounts the Svelte game into the page and tears it down on leave
  AssertionError: expected "vi.fn()" to be called 1 times, but got 4 times

DesignSystemShowcaseContent  opens and closes the live dialog from the keyboard
  Error: Unable to find role="button" and name \`/open the dialog/i\``}
        </pre>
        <p className="mt-3 text-muted">
          My first diagnosis of the first one was wrong. I said an earlier
          test&rsquo;s request was still in flight and landing on the next
          test&rsquo;s handler, which is a real thing that happens and looked
          right. The cause was a hook with a module-level cache that{" "}
          <C>localStorage.clear()</C> never reset, so custom topics leaked from
          one test into the next. The second left mocks uncleared. The third
          let the page URL, which the explorer writes with{" "}
          <C>replaceState</C>, carry a filter into whichever test ran after it.
          None of the three was a bug in the page. All three were tests
          borrowing state from their neighbours, which is exactly the kind of
          dependence a fixed order never shows.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          What breaking the code showed that a green run didn&rsquo;t
        </h2>
        <p className="text-muted">
          Reading a test tells you what it intends. Breaking the code under it
          tells you what it does. For each file I changed the source in a small
          way (negate a condition, move a boundary, drop an error branch),
          reran just that file, and recorded whether anything went red, then
          put the source back. Roughly 5,700 of those across the suite, by the
          reviewers&rsquo; own tallies. On the write-up page tests alone, I
          also ran 63 mutations against the original versions of the tests and
          53 of them survived.
        </p>
        <h3 className={beat}>The rollback tests that passed with the rollback removed</h3>
        <p className="text-muted">
          The optimistic-update tests for calendar events and countdowns said
          they checked that a failed write puts the old data back. Twelve of
          them passed with every <C>onError</C> rollback deleted. After a
          failure the query refetches, the refetch returns the real data, and
          the screen is correct again, so the test could not tell a working
          rollback from a missing one. They only failed once they looked at the
          screen before the refetch landed.
        </p>
        <h3 className={beat}>Tests that tested themselves</h3>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-muted">
          <li>
            Nine inventory tests re-implemented the component&rsquo;s rules
            inside the test, or asserted a constant declared in the test. Two
            accessibility checks ran axe on an empty portal container.
          </li>
          <li>
            The &ldquo;Run tests&rdquo; cases on the from-scratch page run
            inline copies of the algorithm, not the code shown on the page, so
            they cannot fail when the shown code is wrong.
          </li>
          <li>
            A page test mocked an SDK the page stopped importing, so it passed
            against a module nothing used.
          </li>
          <li>
            Two tests of the mock-server handlers read the handler source
            instead of calling it. The old file passed with the real
            registration deleted.
          </li>
          <li>
            Several default mock handlers answer every request, so the tests
            named for the fallback path never reached the fallback.
          </li>
        </ul>
        <h3 className={beat}>Two tests that asserted nothing, today</h3>
        <p className="text-muted">
          One looped over the features that have no write-up and checked each
          had an empty reel. Every feature has a write-up now, so the loop ran
          zero times and the test passed on no evidence. Another guarded that a
          minor release has a public update entry, and returned early for any
          patch version, so on 9.2.28 it asserted nothing at all. Both read as
          rules in the file and were silent in practice.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Every place a green result was hiding something
        </h2>
        <p className="text-muted">
          This is the part I did not expect. The weak tests were the obvious
          kind of finding. The rest were around the tests, and I hit most of
          them myself while checking my own work:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-muted">
          <li>
            A 9-minute job printed 137 dots. The reporter named nothing, so
            there was no way to say which of the 62 routes in one spec took the
            time.
          </li>
          <li>
            A job was green with a red annotation in it, because a quarantine
            step with nothing in it ended in{" "}
            <C>Error: No tests found</C> and the step was allowed to fail.
          </li>
          <li>
            Neither e2e job produced a report, so a red run would have had
            nothing to download. The upload step warned about it on every run.
          </li>
          <li>
            Lint exited 0 with warnings in it. I added{" "}
            <C>--max-warnings 0</C>, planted a warning to prove it, and my
            shell reported exit 0 again.
          </li>
          <li>
            The accessibility scan listed 62 of the 143 public pages by hand.
            Nothing said so.
          </li>
          <li>
            46 route files had no test in the unit or integration coverage.
          </li>
          <li>
            Vitest does not typecheck. Every batch passed its tests, and the
            combined branch had 10 type errors in three files.
          </li>
        </ul>
        <p className="mt-3 text-muted">
          The one I keep coming back to is my own. I wrote a test for the new
          reporter config, ran it, and read this:
        </p>
        <pre className={pre}>
          {` Tests  4 passed (4)
 Errors  1 error
exit=1`}
        </pre>
        <p className="mt-3 text-muted">
          Four green tests and a failing run, from an unhandled{" "}
          <C>NetworkError</C> the config import triggered in a browser-like
          environment. I had read only the first line the first time. Then the
          opposite happened: the same <C>pnpm lint</C> run through my
          output-compressing shell wrapper said{" "}
          <C>ESLint: 0 errors, 1 warnings</C> and exited 0, and run unfiltered
          it said this:
        </p>
        <pre className={pre}>
          {`  1:7  warning  'unusedOnPurpose' is assigned a value but never used.
✖ 1 problem (0 errors, 1 warning)
ESLint found too many warnings (maximum: 0).
 ELIFECYCLE  Command failed with exit code 1.`}
        </pre>
        <p className="mt-3 text-muted">
          An exit code and a summary line are each a tool&rsquo;s opinion of the
          run. The log is the run.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Making it harder for a green to lie
        </h2>
        <p className="text-muted">
          Finding these once is not worth much if the next one gets in the same
          way, so each of them became something that fails the build:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-muted">
          <li>
            <C>expect.requireAssertions</C> for every test. It found three
            tests in 7,447 that asserted nothing:{" "}
            <C>expected any number of assertion, but got none</C>.
          </li>
          <li>
            Tests run in a random order on CI, and the seed is printed, so a red
            run replays with <C>VITEST_SEED=&lt;n&gt;</C>.
          </li>
          <li>
            A guard that fails on any skipped, todo or <C>.only</C> test, and on
            an expected failure that does not say which bug it is waiting on.
          </li>
          <li>
            A guard that every BFF route is imported by some test, so a new
            route without one fails the same way a missing test file would.
          </li>
          <li>
            The accessibility route list moved to a helper with a guard against
            the real public routes, so a new page has to be scanned or excluded
            with a reason.
          </li>
          <li>
            A guard that checks every write-up&rsquo;s internal links and
            anchors, including the pages with no test of their own.
          </li>
          <li>
            Lint fails on any warning, and the e2e log names every test with its
            time and keeps an HTML report per step.
          </li>
        </ul>
        <p className="mt-3 text-muted">
          Each guard was proved the same way the tests were: I planted the
          failure (a skipped test, an untested route, a lint warning) and
          watched it go red, then took it out.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          What held up, and what I would not do again
        </h2>
        <h3 className={beat}>Patterns that held up</h3>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-muted">
          <li>
            Mutating the code, because it measures the test, not my opinion of
            it.
          </li>
          <li>
            A test that builds the case it is about, with a fixture, instead of
            looping over data that may be empty.
          </li>
          <li>
            Per-test state through the code&rsquo;s own setters, and a mock
            server whose handlers are reset between tests.
          </li>
          <li>
            Guards that read the repository and compare it with a list a person
            keeps by hand.
          </li>
          <li>
            <C>it.fails</C> with a comment naming the bug. It keeps a known bug
            visible and red in the right way, and it turns the build red when
            someone fixes it without removing the marker.
          </li>
        </ul>
        <h3 className={beat}>Patterns that did not</h3>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-muted">
          <li>
            Asserting on the exact wording of a page. 134 of the write-up tests
            do, and they fail on any rewording. I left them because those pages
            only grow and the tests do catch a deleted section, but it is a
            choice, not a free pass.
          </li>
          <li>
            A mock that answers everything, so the failure path is unreachable.
          </li>
          <li>
            Relying on a refetch, a retry or a fallback to hide the thing the
            test is supposed to be watching.
          </li>
          <li>
            Counting. More than 7,400 tests is a figure, and the three files that
            only passed in order were part of it.
          </li>
        </ul>
        <h3 className={beat}>Twenty bugs the audit found and did not fix</h3>
        <p className="text-muted">
          Each is held as an expected failure with its reason, so the suite
          stays green and the bug stays written down. I flipped all twenty back
          to ordinary tests to check they fail for the reason they name, not
          for a typo. A few of the failures, as they read:
        </p>
        <pre className={pre}>
          {`expected 503 to be 400            a store id that climbs out of the path
expected 'stalefresh' to be 'fresh'   a second start() leaves the first stream running
expected 502 to be 204            a backend 204 turned into a 502
expected 404 to be 400            a malformed id on the restock routes
expected [ 10, 29, 23, 59 ] to deeply equal [ 10, 30, 23, 59 ]
                                  a date range off by one day west of UTC
expected '//evil.example/x' not to match /^\\/\\//
                                  a protocol-relative return path`}
        </pre>
      </section>

      <section id="ai-tests">
        <h2 className="mb-3 text-lg font-bold">
          Watch for this when an AI is writing the tests, or reporting on them
        </h2>
        <p className="text-muted">
          A generated test suite looks thorough. The count is high, every test
          has a plausible name, the run is green, and the summary that comes
          with it is confident. Nearly all of what I found here fits that
          description, and none of it would have shown up by reading the output.
          It is the same shape I wrote about in{" "}
          <Link href="/thoughts/green-checks" className={linkClass}>
            Green Checks
          </Link>
          , where each check was measuring something other than what it
          claimed, and in the section on AI-written code in{" "}
          <Link href="/thoughts/error-messages" className={linkClass}>
            Errors people can read
          </Link>
          . A model is good at producing the form of a verification. Whether the
          verification can fail is a separate question that someone has to ask.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
          <li>
            <strong className="text-foreground">Break the code and watch.</strong>{" "}
            Change one condition in the thing under test. If the test stays
            green, it was never testing that.
          </li>
          <li>
            <strong className="text-foreground">Ask what the test asserts that it did not set up.</strong>{" "}
            A constant declared in the test, a mock&rsquo;s own return value and
            a re-implementation of the rule are all the test agreeing with
            itself.
          </li>
          <li>
            <strong className="text-foreground">Look for the loop over nothing and the early return.</strong>{" "}
            A test that passes with zero assertions is the commonest result of
            code that was right when it was written.
          </li>
          <li>
            <strong className="text-foreground">Run it alone and shuffled.</strong>{" "}
            State a test inherited from its neighbours is invisible in file
            order.
          </li>
          <li>
            <strong className="text-foreground">Read the log, not the exit code or the summary.</strong>{" "}
            Warnings, skipped counts, annotations and stderr are where the
            result is qualified. A wrapper in between can change either.
          </li>
          <li>
            <strong className="text-foreground">Check the report as well as the work.</strong>{" "}
            Every batch told me its tests passed, and they did. The combined
            branch still had type errors, because passing tests are not a
            typecheck. Some counts came with &ldquo;tallied from my log, allow
            a few either way&rdquo;, which was honest, and I wrote them down as
            approximate. My own first explanation of a failing test was wrong
            too. Rerun the whole thing on the merged result before saying it
            works.
          </li>
          <li>
            <strong className="text-foreground">Make a known failure a test.</strong>{" "}
            When an AI finds a bug it is not asked to fix, the finding lives in
            a chat unless it is written as an expected failure with its reason.
          </li>
        </ul>
      </section>

      <Update
        id="update-2026-11-21-twenty-fixed"
        date="November 21, 2026"
        title="The twenty bugs, fixed, and the three I got wrong on the way"
      >
        <p>
          All twenty expected failures are ordinary tests now and the suite
          exits 0. Fifteen root causes, one commit each. Most were a line or
          two. Three of them were not what the note on the test said.
        </p>

        <h3 className={beat}>
          The SSE bug was not about the trailing newline. It was about state.
        </h3>
        <p className="text-muted">
          The note blamed the empty string after a final <C>\n</C> being read
          as a blank line. True, but fixing only that would have left the
          other half: <C>eventType</C> and <C>dataLines</C> were declared
          inside <C>feed()</C>, so a chunk that ended between two lines of one
          event started the next call with a fresh event. The fix moved them
          up beside the buffer and kept only the unfinished last line in it.
        </p>

        <h3 className={beat}>
          I returned null from the login path check. The test wanted a string.
        </h3>
        <p className="text-muted">
          My first fix rejected a <C>{"//evil.example/x"}</C> pathname outright. It
          looked right and failed the test, because the assertion is{" "}
          <C>expect(result).not.toMatch(...)</C> and that matcher throws on a
          null:
        </p>
        <pre className={pre}>
          {`Tests  1 failed | 45 passed (46)
 FAIL  never hands back a protocol-relative path`}
        </pre>
        <p className="text-muted">
          So I collapsed the leading slashes to one instead, which keeps the
          result on this origin. Then I noticed I had done that after the{" "}
          <C>/auth/</C> check, so <C>{"//auth/login"}</C> would have come back as{" "}
          <C>/auth/login</C> and looped into the auth routes. The collapse now
          runs before both checks.
        </p>

        <h3 className={beat}>
          The stream test helper was lying about what a cancelled source does.
        </h3>
        <p className="text-muted">
          Cancelling the old reader in <C>start()</C> is the fix, but the test
          then calls <C>sendEvent</C> on the first stream after it was
          cancelled, and a real source cannot do that:
        </p>
        <pre className={pre}>
          {`throws Invalid state: Controller is already closed`}
        </pre>
        <p className="text-muted">
          I made the helper skip the enqueue once cancelled. The assertion did
          not change, and it still fails without the fix because the stale
          token only arrives if the first reader is left open. The read loop
          also leaves state alone once it is no longer the current reader,
          otherwise the old loop finishing would have switched{" "}
          <C>isStreaming</C> off in the middle of the new run.
        </p>

        <h3 className={beat}>What I left alone</h3>
        <p className="text-muted">
          The shared test helpers are unchanged: the operator seed and
          factories still use <C>Math.random</C> and the real clock, and the
          reset between tests leaves some state behind. One file failed once
          under shuffle seed 1234 on a loaded machine and passed nine reruns. I
          could not reproduce it, so I have not written a fix for it.
        </p>
      </Update>

      <Update
        id="update-2026-11-21-left-alone"
        date="November 21, 2026"
        title="The thing I could not reproduce was a timeout, and the helpers were less random than I thought"
      >
        <p>
          The update above ends with a list of things I left alone. Leaving them
          was the wrong call, since each one was a way for a green run to lie.
          So I went back for them: the shared helpers, and the one file that
          failed once under shuffle seed 1234.
        </p>

        <h3 className={beat}>
          I said I could not reproduce it. I had been running it on an idle
          machine.
        </h3>
        <p className="text-muted">
          The failure was reported on a loaded machine and passed nine reruns on
          a quiet one. Seed 1234 on its own passes. Running the whole suite
          under it passes too, all 7,207 tests. What changed it was putting load
          under the file: eight busy processes per core, and the same seed.
        </p>
        <pre className={pre}>
          {` × has no axe violations 7663ms
   → Test timed out in 5000ms.
 × lists the newest update first, and the oldest first once the order is flipped 6608ms
   → Test timed out in 5000ms.`}
        </pre>
        <p className="text-muted">
          It was never about order. Each test in <C>UpdatesContent</C> renders
          or re-renders every update card, about 76 of them and one more every
          release, and idle that takes a few hundred milliseconds. Under load it
          is ten to twenty times that.
        </p>

        <h3 className={beat}>
          My first fix covered the two tests that failed. Four more were at 4.7
          seconds.
        </h3>
        <p className="text-muted">
          I put a longer timeout on the axe test and the sort test, reran under
          the same load, and it went green. Then I read the other durations in
          that run: the category chip, the expand toggle and the tag filter were
          all above four seconds. Fixing the two that happened to cross the line
          would have moved the flake to whichever test lost the next toss, so
          the timeout is on the whole <C>describe</C> instead.
        </p>

        <h3 className={beat}>
          Pinning the factories was easy. Pinning them without the clock would
          have been a trap.
        </h3>
        <p className="text-muted">
          The operator factories now take a random function and a clock, and the
          test setup pins both before the mock server loads, since loading it is
          what builds the seed. Everything else is the default it was: the demo
          seed that serves the app when the backend is asleep still uses the
          real dice and the real time. I pinned the factories first and ran the
          suite:
        </p>
        <pre className={pre}>
          {`FAIL  operator aggregation parity > product performance category index and dead SKU
AssertionError: expected [ [ 'Kombucha', +0, false ] ] to deeply equal [ [ 'Cola', 200, true ], …(2) ]`}
        </pre>
        <p className="text-muted">
          The seed was dated June 17 and the code under test windows{" "}
          <C>the last 7 days</C> against the real clock, so every sale fell
          outside it. A seed fixed at one instant and read against another is
          empty by the next day, which is the real-clock bug turned inside out.
          The setup now pins <C>Date</C> to the same instant, and the failures
          went away without touching the code that does the windowing.
        </p>

        <h3 className={beat}>
          One test only passed because it was already past July.
        </h3>
        <p className="text-muted">
          With the clock pinned, a bff fallback test failed on a promotion it
          created with a start date of July 1, 2026 and expected to be active:
        </p>
        <pre className={pre}>
          {`AssertionError: expected { id: 'promo-001', …(6) } to match object { percent: 15, status: 'active' }
-   "status": "active",
+   "status": "scheduled",`}
        </pre>
        <p className="text-muted">
          It had been written when July was behind us. It would have gone red
          the other way for anyone who ran it earlier in the year. The dates are
          now June 1, in the past of the pinned instant, and they stay there.
        </p>

        <h3 className={beat}>
          The delay test I wrote first could not fail for the right reason.
        </h3>
        <p className="text-muted">
          The handlers waited a random 100 to 300 milliseconds, and the handler
          tests worked around it by mocking <C>Math.random</C> to 0. I replaced
          the delay with a constant tick and asserted that a request never rolls
          the dice. That failed after the fix:
        </p>
        <pre className={pre}>
          {`AssertionError: expected "random" to not be called at all, but actually been called 2 times`}
        </pre>
        <p className="text-muted">
          MSW rolls <C>Math.random</C> itself to id each request, once per
          fetch. My first attempt to mock the <C>delay</C> export did nothing
          either, because the setup had already loaded the module. The test now
          records only the rolls whose stack starts in the handler file, and I
          ran it against the old handlers to see it fail before trusting it.
        </p>

        <h3 className={beat}>The reset did not reset.</h3>
        <p className="text-muted">
          <C>resetOperatorWriteState</C> cleared sessions and promotions and
          nothing else, but the handlers also mutate the seed in place:
          dismissing an alert, restocking an item, rearranging a planogram. A
          test that did any of those left it for the next test in the file. It
          now restores a copy of the seed taken at load, and there is a test per
          mutation. The shared <C>/api/me</C> handler was also missing{" "}
          <C>isFlagAdmin</C>, which the real route has always returned.
        </p>
      </Update>

      <Update
        id="update-2026-11-21-act-noise"
        date="November 21, 2026"
        title="The run I had called clean printed 94 act warnings and 25 unmatched requests"
      >
        <p>
          A changelog entry from weeks ago says the test run is clean: zero
          unmatched requests, zero <C>act()</C> warnings. I compared this PR&apos;s CI
          log with develop&apos;s to check I had not made the output worse, and
          neither was clean. Both had the same noise.
        </p>

        <h3 className={beat}>
          I replayed the CI seed locally and saw nothing, and almost concluded
          it was a CI-only timing problem.
        </h3>
        <p className="text-muted">
          I ran <C>VITEST_SEED=1795280842425 pnpm test</C>, the seed from the CI
          log, and got a green run with no warnings. I then ran it under heavy
          CPU load and got the same. The log it wrote was 18 lines long, which I
          should have read as the clue: when it detects an agent, Vitest swaps to
          a reporter that hides the output of passing tests. My local runs had
          never shown a console line. With the default reporter named, the
          replay matched CI to the count:
        </p>
        <pre className={pre}>
          {`$ VITEST_SEED=1795280842425 vitest run --reporter=default
act warnings          94
unmatched requests    25`}
        </pre>

        <h3 className={beat}>
          Noise nobody reads is a failure that has not been written yet.
        </h3>
        <p className="text-muted">
          Cleaning 94 warnings by hand would last until the next test. So the
          setup now records every <C>act()</C> warning and every unmatched
          request and fails the test that caused it. I wrote that first, so I
          had the list instead of an estimate:
        </p>
        <pre className={pre}>
          {` Test Files  19 failed | 560 passed (579)
      Tests  31 failed | 7200 passed (7231)`}
        </pre>

        <h3 className={beat}>
          Fifty-seven of the warnings were one count-up in one test.
        </h3>
        <p className="text-muted">
          The ZeroProof live-update test jumps fake timers forward 31 seconds,
          and the win celebration&apos;s count-up sets state on every frame of
          it. Each frame logged its own warning. Advancing the timers inside{" "}
          <C>act()</C> fixed that test, and the same one-line helper fixed the
          polling hook tests and the calendar banner. The axe scans needed the
          same treatment, since a page with a timer updates while axe waits, so
          the shared <C>axe</C> helper runs the scan inside <C>act()</C>.
        </p>

        <h3 className={beat}>
          Two files still warned after I fixed the helper, because they never
          used it.
        </h3>
        <p className="text-muted">
          The gallery wall and the slot machine imported <C>axe</C> straight
          from <C>vitest-axe</C>, so my wrapper did nothing for them. They
          import the shared one now. The remaining fixes were smaller: four
          ZeroProof endpoints the tour tests never mocked, a card endpoint the
          event modal asks for, toast dismissals done with a bare{" "}
          <C>.click()</C>, and three sleeps used to assert that something never
          appears. One of those was my own collection test from earlier in this
          PR. It now waits for the error message instead of for fifty
          milliseconds.
        </p>

        <h3 className={beat}>
          I waited for the lazy import before it had started.
        </h3>
        <p className="text-muted">
          The reduced-motion hydration test warned about{" "}
          <C>LazyMotion</C> on some orderings and not others. LazyMotion starts
          its import in an effect, and effects flush when the hydrating{" "}
          <C>act()</C> ends. I put <C>vi.dynamicImportSettled()</C> inside that
          same act, where there was no import yet to wait for, and the failure
          stayed:
        </p>
        <pre className={pre}>
          {`An update to LazyMotion inside a test was not wrapped in act(...).`}
        </pre>
        <p className="text-muted">
          The wait belongs in a second act, after the first has started the
          import. Setting <C>IS_REACT_ACT_ENVIRONMENT</C> once in the setup
          also ended the &quot;not configured to support act&quot; warnings from
          the two hydration files that call React&apos;s act without Testing
          Library.
        </p>

        <h3 className={beat}>The test timeout is now a default, not a patch.</h3>
        <p className="text-muted">
          While running these under load, a plain render in the design-system
          gallery timed out at five seconds, the same failure as the updates
          list. I had patched that one file. The default is fifteen seconds now,
          and the per-file patch is gone.
        </p>
      </Update>

      <Update
        id="update-2026-11-21-stderr-blocks"
        date="November 21, 2026"
        title="The hundred error lines I called a different class were hiding three bugs"
      >
        <p>
          After the act() work I wrote that about a hundred blocks of error
          output were &quot;a different class&quot;, the app logging on paths a
          test provokes on purpose, and left them. I was wrong about the word
          &quot;mostly&quot;. I widened the guard to every{" "}
          <C>console.error</C> and <C>console.warn</C> and the first run told me
          what they were.
        </p>
        <pre className={pre}>
          {`120 blocks of stderr, in 33 files
 52  operator fallback: "fell back to seed data"
 15  Auth0 client with no config
 14  chart "width(-1) and height(-1)"
 11  two children with the same key
  1  Body has already been read
 27  a failure the test caused on purpose`}
        </pre>

        <h3 className={beat}>
          Eleven duplicate-key warnings were one bug in the app, not in a test.
        </h3>
        <p className="text-muted">
          Card tests, collection tests and pack tests all warned about two
          children with the key <C>5</C>. It was not the fixtures. A card draws
          two background blobs from a hash, each a number from 1 to 6, and
          the blob component used that number as its React key. About one card
          in six gets the same number twice. The same number was also used for
          the gradient id, so two cards on one page shared a gradient and the
          second colour never showed. Keys are the position now, and the
          gradient id comes from <C>useId</C>.
        </p>
        <pre className={pre}>
          {`Encountered two children with the same key, \`5\`. Keys should be unique so
that components maintain their identity across updates.`}
        </pre>

        <h3 className={beat}>
          A test passed for a reason it never looked at.
        </h3>
        <p className="text-muted">
          The leagues route test called the route twice with one mocked{" "}
          <C>Response</C>. A body can be read once, so the second call threw and
          the route quietly answered 502. The test only checked the request
          headers, so it stayed green. Each call gets its own response now.
        </p>
        <pre className={pre}>
          {`[BFF] GET /zeroproof/leagues — fetch threw: TypeError: Body is unusable: Body has already been read`}
        </pre>
        <p className="text-muted">
          Four card-pack tests did the same thing in a smaller way. They only
          wanted to know which loader the route called, and they handed back an
          empty slate, so each one also ran the &quot;empty pool&quot; branch.
          Two inventory tests answered the store request with{" "}
          <C>{"{ store: null }"}</C>, which fails the schema, so the component
          logged a ZodError while the test was about something else.
        </p>

        <h3 className={beat}>
          Stubbing the observer did not fix the charts, and I only learned why
          from the library&apos;s source.
        </h3>
        <p className="text-muted">
          jsdom measures every element as 0 by 0, so Recharts printed that the
          chart had no size and drew nothing. My first try was a{" "}
          <C>ResizeObserver</C> that answers with 800 by 400. The warning stayed.
          Recharts renders once at a default of -1, then reads{" "}
          <C>getBoundingClientRect()</C>, which is 0, and warns on both before
          the observer matters. What works is replacing the container with one
          that hands its chart a width and height. The charts now draw, so the
          accessibility scans look at a real chart instead of an empty box.
        </p>

        <h3 className={beat}>
          The rest became assertions, not mutes.
        </h3>
        <p className="text-muted">
          Where the app logs on purpose, the test now says what it expects. A
          401 test asserts the line <C>[zeroproof join league] auth failed</C>,
          and the operator fallback file allows exactly one sentence,{" "}
          <C>fell back to seed data</C>, and fails on any other. A missing
          log is a failure too, and a mute button cannot do that. The Auth0
          warning went away by giving the tests the same placeholder config the
          CI build uses.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "Every test file has been run alone, shuffled, under two seeds, and every test has a verdict. About one in seven was weak, tautological, leaky, misnamed or redundant, and those were strengthened or replaced.",
          "Tests that assert nothing, run in an order they depend on, are skipped, or are expected to fail without saying why now fail the build, as does a BFF route nobody tests.",
          "Lint fails on a warning. The e2e log names every test and each step keeps a report.",
          "The untested BFF routes and the logic files nothing touched got real tests.",
          "The operator factories and the test clock are pinned, the handlers wait a constant tick, and the reset restores the seed. The default test timeout is fifteen seconds, so a page-sized render survives a loaded machine.",
          "An act() warning, an unmatched mock request, or any console error or warning fails the test that caused it. The run printed 94 act warnings, 25 unmatched requests and 120 blocks of stderr before, and prints none now. A test that logs on purpose asserts the line.",
          "The per-push smoke and axe job runs on two workers. Playwright named the accessibility file at 9.0 minutes of a 10.2 minute run, and the same 141 tests now take 6.2 minutes with no retries.",
          "A card with two blobs of the same shape no longer shares a key or a gradient with itself, and charts draw in tests instead of an empty box.",
        ]}
        couldImprove={[
          "Run mutation testing in CI on the code that handles money and auth. It only runs on the NFL projection math today.",
          "Fail on console.log and console.info too. The guard covers error and warn, and the one stdout line left was an e2e setup message that now has an assertion.",
          "Decide what to do about tests that pin exact prose. Rewording a write-up should not break a build.",
          "A coverage floor for logic files, so a new one cannot arrive without a test.",
        ]}
      />
    </ThoughtLayout>
  );
}
