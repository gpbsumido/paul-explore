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
                partly. ci.yml has a quality job — lint, typecheck, dead-code,
                unit tests — that gates everything. it&apos;s the fast tier
              </Sent>
              <Sent pos="last">
                the e2e + accessibility job needs: quality, so the slow Playwright
                run only starts once the cheap checks pass. that&apos;s the split
                already in action
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
          they reach the shared branch.
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
          that&apos;s the Playwright <code className={code}>public</code> project,
          axe accessibility scans included.
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
          The split already exists in{" "}
          <code className={code}>.github/workflows/ci.yml</code>, as two jobs
          with a dependency between them.
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
          The <code className={code}>e2e-accessibility</code> job is the slow
          tier. It declares <code className={code}>needs: quality</code>, so the
          Playwright run — browser install included — never even starts until the
          cheap checks are green. There&apos;s no point spending E2E minutes on a
          change that doesn&apos;t typecheck.
        </p>
        <p className="mt-3 text-muted">
          The obvious next step is cadence. Right now the E2E tier runs on the
          same triggers as the fast tier. Moving the heaviest flows to a nightly
          schedule (a <code className={code}>schedule</code> trigger) or a
          pre-release gate, and keeping only a thin smoke subset on every PR,
          would push this repo from a two-job gate toward a true tiered schedule.
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
