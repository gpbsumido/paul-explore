"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

export default function TestTiersContent() {
  return (
    <ThoughtLayout
      breadcrumb="Tiered Testing Strategy"
      title="Tiered Testing Strategy"
      intro={
        <>
          You should not run every test on every commit. Once a suite grows into
          the thousands, running all of it on every push burns feedback time and
          compute for no extra signal. The fix is to split tests by cost and run
          each tier where it pays for itself: fast unit tests on every push,
          heavier integration and end-to-end tests less often, and flaky ones
          quarantined so they never block a build.
        </>
      }
      chat={
        <div className="flex justify-center">
          <div
            className={styles.phone}
            style={{ minHeight: "calc(100dvh - 56px)" }}
          >
            <div className={styles.chat}>
              <Timestamp>Today 10:00 AM</Timestamp>

              <Received pos="first">
                should CI just run the whole test suite every time
              </Received>
              <Received pos="last">feels safest</Received>

              <Sent pos="first">
                safest in theory, slowest in practice. every second a developer
                waits to merge is a second the pipeline is the bottleneck, not
                the code
              </Sent>
              <Sent pos="last">
                and you pay cloud minutes to re-run heavy e2e flows that didn&apos;t
                change. same signal, higher bill
              </Sent>

              <Timestamp>10:04 AM</Timestamp>

              <Received>so what runs when</Received>

              <Sent pos="first">
                split by cost. fast unit tests on every push and PR — seconds,
                they catch the dumb bugs instantly
              </Sent>
              <Sent pos="middle">
                integration tests on merge or on a schedule — they prove parts
                talk to each other but they&apos;re heavier
              </Sent>
              <Sent pos="last">
                full end-to-end nightly or right before a release — real
                browser, real flows, slowest of all
              </Sent>

              <Timestamp>10:09 AM</Timestamp>

              <Received>what about the ones that randomly fail</Received>

              <Sent pos="first">
                quarantine them. a flaky test in the blocking path teaches people
                to ignore red, which is worse than no test at all
              </Sent>
              <Sent pos="last">
                move it to an on-demand or background job, keep the main gate
                green and trustworthy, and fix the flake on its own clock
              </Sent>

              <Timestamp>10:12 AM</Timestamp>

              <Received>does this repo already do that</Received>

              <Sent pos="first">
                yep. ci.yml has a quality job — lint, typecheck, dead-code, unit
                tests — that gates everything. it&apos;s the fast tier on every push
              </Sent>
              <Sent pos="middle">
                e2e-smoke runs just the @smoke tests on every PR, so pull requests
                keep a real-browser signal without the full cost
              </Sent>
              <Sent pos="middle">
                the integration job — component + data-layer vitest tests — is so
                fast here we just keep it on every PR too, not only merge/nightly.
                the cadence rule only pays off when a tier is actually slow
              </Sent>
              <Sent pos="last">
                and e2e-full — the whole public + authenticated suite — runs
                nightly on a schedule, with flaky tests quarantined off the
                blocking path. four jobs, one file, each on its own clock
              </Sent>

              <div className={styles.typingDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">
          Why not run everything every time
        </h2>
        <p className="text-muted">
          Running the whole suite on every commit feels like the safe default,
          but it stops scaling the moment the suite gets large. Three costs grow
          together.
        </p>
        <p className="mt-3 text-muted">
          <strong>Speed.</strong> A long pipeline is a queue in front of every
          merge. When the only way to know if a change is good is a twenty-minute
          run, developers batch changes, context-switch away, and come back cold.
          Fast feedback is the whole point of CI, and heavy tests are what erode
          it.
        </p>
        <p className="mt-3 text-muted">
          <strong>Cost.</strong> Integration and end-to-end tests spin up real
          browsers, servers, and sometimes databases. Re-running that fleet on
          every push means paying cloud compute for work that mostly re-confirms
          what the last run already proved.
        </p>
        <p className="mt-3 text-muted">
          <strong>Signal.</strong> Most commits break something small and
          local — a type error, a null check, an off-by-one. Fast unit tests
          catch that class of bug in seconds. Reserving the expensive tiers for
          the changes and moments that actually need them keeps the fast signal
          fast.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The tiers</h2>
        <p className="text-muted">
          Divide tests by how much they cost to run and how often that cost is
          worth paying. Each tier runs at a different cadence.
        </p>

        <h3 className="mb-1 mt-5 font-semibold text-foreground">
          Fast unit tests
        </h3>
        <p className="text-muted">
          Run on <strong>every push and every pull request</strong>. They take
          seconds and exercise small, isolated pieces of code. This is the tier
          that gives instant feedback, so nothing heavier should ever sit in
          front of it. In this repo that&apos;s <code className={code}>pnpm test</code>{" "}
          (Vitest) alongside lint, typecheck, and the dead-code check.
        </p>

        <h3 className="mb-1 mt-5 font-semibold text-foreground">
          Integration tests
        </h3>
        <p className="text-muted">
          Run on <strong>pull request merges or scheduled builds</strong>. They
          test how parts work together — a route plus its handler, a component
          plus its data layer — so they&apos;re slower than unit tests but still
          worth running regularly. Gating them on merge, rather than every push,
          keeps the per-push loop fast while still catching wiring problems before
          they reach the shared branch. In this repo they&apos;re the Vitest tests
          that render a component or route against its real data layer
          (react-query + MSW), tagged with a{" "}
          <code className={code}>.integration.test.tsx</code> suffix and run with{" "}
          <code className={code}>pnpm test:integration</code>.
        </p>

        <h3 className="mb-1 mt-5 font-semibold text-foreground">
          End-to-end tests
        </h3>
        <p className="text-muted">
          Run <strong>nightly or right before a release</strong>. They drive full
          user flows in a real browser against a real environment, which makes
          them the slowest and most fragile tier. Running them on a schedule (or
          as a release gate) means the whole app gets exercised end to end
          regularly, without that cost landing on every individual commit. Here
          that&apos;s the Playwright <code className={code}>public</code> and{" "}
          <code className={code}>authenticated</code> projects, axe accessibility
          scans included, wired to a <code className={code}>schedule</code>{" "}
          trigger. Every push and PR still runs a thin{" "}
          <code className={code}>@smoke</code>-tagged subset so pull requests keep
          a real-browser signal without the full cost.
        </p>

        <h3 className="mb-1 mt-5 font-semibold text-foreground">
          Flaky and slow tests
        </h3>
        <p className="text-muted">
          <strong>Isolate them so they can&apos;t break regular builds.</strong>{" "}
          A test that fails intermittently — a race, a timing assumption, an
          external dependency — trains everyone to ignore a red build, which
          quietly destroys the value of the whole suite. Move it to a background
          or on-demand job, keep the blocking gate deterministic, and fix the
          underlying flake on its own schedule.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">What this repo does today</h2>
        <p className="text-muted">
          The split lives in{" "}
          <code className={code}>.github/workflows/ci.yml</code>, as four jobs,
          each running as often as its cost is worth paying.
        </p>
        <p className="mt-3 text-muted">
          The <code className={code}>quality</code> job is the fast tier: it
          installs, lints, typechecks, runs the dead-code check, and runs the
          unit suite with <code className={code}>pnpm test</code>. It runs on
          every push and pull request to <code className={code}>main</code> and{" "}
          <code className={code}>develop</code>, and it&apos;s cheap enough to be
          the thing developers wait on.
        </p>
        <p className="mt-3 text-muted">
          The <code className={code}>e2e-smoke</code> job runs a thin
          real-browser subset on every push and PR. It declares{" "}
          <code className={code}>needs: quality</code>, so it never starts until
          the cheap checks are green, and it runs only the{" "}
          <code className={code}>@smoke</code>-tagged Playwright tests
          (<code className={code}>--grep @smoke</code>). PRs keep a fast
          end-to-end signal without paying for the whole suite.
        </p>
        <p className="mt-3 text-muted">
          The <code className={code}>integration</code> job is the middle tier: the
          Vitest tests that render a component or route against its real data
          layer (<code className={code}>pnpm test:integration</code>), gated on{" "}
          <code className={code}>needs: quality</code>. The textbook cadence would
          gate these on merge, but here&apos;s a deliberate deviation: this
          repo&apos;s integration tests run in milliseconds (Vitest + MSW, no real
          browser), so we keep them on <strong>every push and PR</strong> as well
          as nightly, rather than merge-only. When a tier is that cheap, the
          reason to defer it disappears — it&apos;s better to catch a wiring bug
          on the PR than after it lands on the shared branch. The cadence rule
          still bites where the cost is real: the genuinely slow end-to-end flows
          below are what move off the per-commit path.
        </p>
        <p className="mt-3 text-muted">
          The <code className={code}>e2e-full</code> job is the heavy tier: the
          full <code className={code}>public</code> and{" "}
          <code className={code}>authenticated</code> flows plus axe scans. It&apos;s
          gated behind <code className={code}>needs: quality</code> too, but it
          only runs on a nightly <code className={code}>schedule</code> or via{" "}
          <code className={code}>workflow_dispatch</code> before a release — never
          on an individual commit. Anything tagged{" "}
          <code className={code}>@flaky</code> is held off the blocking path with{" "}
          <code className={code}>--grep-invert @flaky</code> and re-run in a
          separate <code className={code}>continue-on-error</code> step, so a
          flaky test gets exercised nightly but can never fail a build.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          What tiering does not protect you from
        </h2>
        <p className="text-muted">
          Two things went wrong here that no amount of tier discipline would
          have caught, and both are worth more than the tiering itself.
        </p>
        <p className="mt-3 text-muted">
          The first is that a tier can be green for reasons unrelated to what it
          claims to check. A set of end-to-end specs targeted a seeded store id,
          and when a real backend was serving, the API returned a 404, the app
          fell back to its seed exactly as designed, and the specs passed
          identically whether or not the backend worked. A test that cannot fail
          when the thing it covers is broken is not a test. The fix was not a new
          tier; it was making the specs assert which backend they had actually
          reached.
        </p>
        <p className="mt-3 text-muted">
          The second is that a tier can quietly stop running. The accessibility
          specs waited on{" "}
          <code className={code}>networkidle</code>, which is a promise about
          whichever third party the page happens to call rather than about the
          page. When one of those upstreams stalled, two routes timed out, which
          reads as a slow test rather than an absent one. They had never actually
          run the scan. Replacing the wait with the page&apos;s own{" "}
          <code className={code}>load</code>, its{" "}
          <code className={code}>main</code> landmark and{" "}
          <code className={code}>document.fonts.ready</code> made axe run on
          them for the first time, and it immediately found real
          serious-impact contrast failures that had been shipping. The suite
          reported those routes as covered for as long as they were broken.
        </p>
        <p className="mt-3 text-muted">
          Both have the same moral, and it is not about cost or cadence: a
          passing tier is a claim. It is worth occasionally checking what a green
          run actually exercised, because the failure mode is not a red build —
          it is that you stop looking.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Update: the same mistake keeps arriving in different clothes
        </h2>
        <p className="text-muted">
          A week of this turned up four separate versions of one failure, and
          none of them showed up as a red build. Every one was a suite passing
          while measuring something other than what it claimed.
        </p>
        <ul className="mt-3 space-y-3 text-muted">
          <li>
            <strong className="text-foreground">
              Handlers that never matched.
            </strong>{" "}
            Mocks registered on bare paths, while the code under test called an
            absolute URL. Nothing matched, the app fell back to seeded data by
            design, and a file of route tests asserted against fixtures while
            claiming to cover the API.
          </li>
          <li>
            <strong className="text-foreground">
              The same bug again, after the fix.
            </strong>{" "}
            The repair used a pattern that only saw registrations written on one
            line, so four written across several lines kept their bare paths for
            another round. A partial fix and a complete one produce identical
            test output.
          </li>
          <li>
            <strong className="text-foreground">
              Dependencies that were not the ones installed.
            </strong>{" "}
            A suite run against an older build of a package than the manifest
            asked for &mdash; proving a fix that was not present. Twice.
          </li>
          <li>
            <strong className="text-foreground">
              A browser suite reusing a server from another branch.
            </strong>{" "}
            The runner is configured to reuse an already-running dev server, so
            a full pass was reported against code that was not the code under
            review.
          </li>
        </ul>
        <p className="mt-3 text-muted">
          What ties them together is that a test run against the wrong inputs
          does not fail. It passes, which is the only outcome nobody
          investigates. Tiering is about spending test time where it pays;
          nothing in that idea protects you from measuring the wrong thing
          carefully.
        </p>
        <p className="mt-3 text-muted">
          There was a fifth, and it is the one I had been walking past. A full
          run carried thirty React warnings about state updated outside a test&apos;s
          control, forty-five lines about a missing canvas, and forty-odd
          unmatched network calls. I had been reading all of it as noise. It was
          not: the warnings were the visible half of two endpoints that had no
          mock at all, so every component touching them updated state after the
          test had finished; the canvas lines came from an assertion that would
          have thrown in any browser without 2d support; and one of the
          unmatched calls was a test reaching for a public blockchain node on
          the open internet, prevented from leaving the machine only because the
          mocker happens to reject anything unmatched.
        </p>
        <p className="mt-3 text-muted">
          Noise is not a category of output. It is a decision to stop reading,
          and it is made once and then held. The unmatched mocks that cost days
          to find were sitting in that same stream the whole time. Everything
          here now runs clean, so the next unexpected line is worth looking at.
        </p>
        <p className="mt-3 text-muted">
          So each one now has a guard that fails loudly rather than a note
          asking people to remember. Mock registrations are asserted against the
          source file, since the symptom is invisible in results. The installed
          package version is checked against the manifest, with a message naming
          the fix. Live-mode browser runs assert they reached a real database
          rather than a fixture. Each guard was checked by making it fail on
          purpose first &mdash; a guard nobody has seen fail is just another
          claim.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The principle</h2>
        <p className="text-muted">
          Match test cost to how often the answer changes. Cheap tests that catch
          the common failures run constantly. Expensive tests that catch rare,
          system-wide failures run rarely — but they still run. Flaky tests run
          nowhere near the blocking path until they&apos;re fixed. The goal
          isn&apos;t to run fewer tests overall; it&apos;s to make the pipeline a
          fast, trustworthy signal instead of a slow, expensive tax on every
          commit.
        </p>
      </section>
    </ThoughtLayout>
  );
}
