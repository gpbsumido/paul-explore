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
          My first fix rejected a <C>//evil.example/x</C> pathname outright. It
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
          <C>/auth/</C> check, so <C>//auth/login</C> would have come back as{" "}
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

      <WhatsNext
        nowShipped={[
          "Every test file has been run alone, shuffled, under two seeds, and every test has a verdict. About one in seven was weak, tautological, leaky, misnamed or redundant, and those were strengthened or replaced.",
          "Tests that assert nothing, run in an order they depend on, are skipped, or are expected to fail without saying why now fail the build, as does a BFF route nobody tests.",
          "Lint fails on a warning. The e2e log names every test and each step keeps a report.",
          "The untested BFF routes and the logic files nothing touched got real tests.",
        ]}
        couldImprove={[
          "Run mutation testing in CI on the code that handles money and auth. It only runs on the NFL projection math today.",
          "Make the operator seed and factories deterministic. Three reviewers found the same unseeded random and real clock.",
          "Find out why one file failed once under shuffle seed 1234. It passed nine reruns and I have not reproduced it.",
          "Decide what to do about tests that pin exact prose. Rewording a write-up should not break a build.",
          "A coverage floor for logic files, so a new one cannot arrive without a test.",
        ]}
      />
    </ThoughtLayout>
  );
}
