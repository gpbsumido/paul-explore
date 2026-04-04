"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function TestingContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "Testing" }]}
        right={<ViewToggle view={view} setView={setView} />}
        showLogout={false}
        maxWidth="max-w-3xl"
      />

      {view === "summary" ? (
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <header className="mb-10">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted/50">
              Dev notes
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Testing
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              108 tests across 7 files — Vitest, Testing Library, and MSW. Pure
              functions first, then hooks with fetch mocking, with a specific
              technique for proving that optimistic updates actually fire before
              the server responds.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">The gap</h2>
              <p className="text-muted">
                One principle that should be followed and be non-negotiable is
                Test-Driven Development (TDD). This codebase, before the change,
                had zero test files. The goal was to close that gap by targeting
                the parts of the codebase that are actually worth testing: the
                rate limiter, the calendar layout algorithm, the vitals
                formatting, and the hooks with their optimistic update behavior.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Setup</h2>
              <ul className="mt-2 space-y-2 text-muted">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    <strong className="text-foreground">Vitest</strong> as the
                    runner with jsdom environment — same config format as Vite,
                    fast, no Jest compatibility layer needed
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    <strong className="text-foreground">Testing Library</strong>{" "}
                    for{" "}
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
                    <strong className="text-foreground">MSW</strong> in node
                    mode for intercepting fetch calls in the hooks — the same
                    library used for browser mocking, just with the node
                    adapter. Configured with{" "}
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
                    allow/block behavior, remaining count, window reset, IP
                    isolation, bucket isolation. Pure function, fake timers
                    advance the clock without sleeping
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    <strong className="text-foreground">
                      Calendar pure functions
                    </strong>{" "}
                    — event filtering by day, all-day vs timed event
                    classification, spanning event ordering, and the overlap
                    layout algorithm that assigns column positions so
                    simultaneous events appear side by side
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    <strong className="text-foreground">
                      Vitals formatting
                    </strong>{" "}
                    — millisecond vs second display, CLS decimal formatting, and
                    the good/needs improvement/poor color thresholds for all
                    five metrics
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    <strong className="text-foreground">
                      Proxy rule matching
                    </strong>{" "}
                    — the rate limit rule table is tested in isolation without
                    importing the full proxy module, which would pull in{" "}
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
                    — fetch, SSR seeding, error states, and create/update/delete
                    with both optimistic updates and rollback on failure
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
                variable to make the GET handler return different data on first
                vs subsequent calls. It worked, but it was testing the wrong
                thing — it verified the end state after a completed mutation
                cycle, not whether the cache updated before the server
                responded.
              </p>
              <p className="mt-3 text-muted">
                The fix is{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  delay()
                </code>{" "}
                from MSW. Add a 300ms pause to the POST/PUT/DELETE handler, then
                fire the mutation without awaiting it. The mutation is still
                in-flight when the assertion runs, so the test is checking the
                actual optimistic state — what the user sees before the server
                has responded.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                The overlap layout algorithm
              </h2>
              <p className="text-muted">
                The calendar&apos;s{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  layoutDayEvents
                </code>{" "}
                function takes a list of same-day timed events and assigns each
                one a column index and a total column count, so they can be
                absolutely positioned side by side in the time grid. The tests
                cover: a single event gets column 0 of 1, two non-overlapping
                events share column 0, two overlapping events get separate
                columns, three simultaneous events get three columns each
                reporting{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  totalColumns: 3
                </code>
                , and pixel positions derived from the row height constant. This
                is the kind of logic that looks simple but has enough edge cases
                to be worth specifying in tests.
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
                accept optional overrides and return fresh objects with
                randomized IDs. No{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  let
                </code>{" "}
                declarations, no{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  beforeEach
                </code>{" "}
                mutations. Each test constructs exactly what it needs and
                nothing is shared between tests.
              </p>
            </section>
          </div>
        </main>
      ) : (
        <div className="flex justify-center">
          <div
            className={styles.phone}
            style={{ minHeight: "calc(100dvh - 56px)" }}
          >
            <div className={styles.chat}>
              <Timestamp>Today 10:00 AM</Timestamp>

              <Received pos="first">
                why did this codebase have no tests
              </Received>
              <Received pos="last">
                the dev guidelines say TDD is non-negotiable
              </Received>

              <Sent pos="first">
                yeah that was the most visible contradiction in the codebase.
                the docs declare test-driven development as the fundamental
                practice, and then there are zero test files
              </Sent>
              <Sent pos="last">
                any engineer reading it would eventually search for a .test.ts
                file, find nothing, and that gap would be harder to explain than
                just not having the docs at all
              </Sent>

              <Received>so what did you add</Received>

              <Sent pos="first">
                108 tests across 7 files. Vitest as the runner, Testing Library
                for the hook tests, MSW for intercepting fetch calls
              </Sent>
              <Sent pos="last">
                the targets were the parts actually worth testing: the rate
                limiter, the calendar layout algorithm, vitals formatting, the
                proxy rule table, and the two main hooks
              </Sent>

              <Timestamp>10:04 AM</Timestamp>

              <Received>why those specifically</Received>

              <Sent pos="first">
                pure functions first because they&apos;re the easiest to test
                and the most satisfying. the rate limiter has real edge cases —
                window resets, IP isolation, bucket isolation. the calendar
                layout algorithm assigns column positions to overlapping events
                and has enough branching to be worth specifying
              </Sent>
              <Sent pos="middle">
                vitals formatting is simple but it&apos;s also the kind of thing
                that breaks silently — if formatValue starts returning
                &quot;1000ms&quot; instead of &quot;1.0s&quot; for a value over
                1000, you won&apos;t notice until someone reads the dashboard
              </Sent>
              <Sent pos="last">
                the hooks are where the interesting behavior is. optimistic
                updates, rollbacks on failure, cursor-based pagination flattened
                across pages — that&apos;s the stuff a hiring engineer actually
                wants to see tested
              </Sent>

              <Timestamp>10:09 AM</Timestamp>

              <Received pos="first">how does MSW work in tests</Received>
              <Received pos="last">I thought it was a browser thing</Received>

              <Sent pos="first">
                MSW has two adapters. the browser adapter uses a service worker
                to intercept requests. the node adapter patches the global fetch
                and http modules directly — same handler syntax, different
                runtime
              </Sent>
              <Sent pos="middle">
                the setup is a shared server in src/test/server.ts. each test
                file calls server.use() to register handlers for that
                test&apos;s specific scenario. server.resetHandlers() runs after
                each test so handlers don&apos;t bleed between tests
              </Sent>
              <Sent pos="last">
                it&apos;s configured with onUnhandledRequest: &quot;error&quot;
                — any fetch that doesn&apos;t match a registered handler throws
                instead of returning an empty response. that forces you to be
                explicit about every network call a hook makes, including the
                refetch that fires after a mutation settles
              </Sent>

              <Timestamp>10:14 AM</Timestamp>

              <Received>
                what&apos;s the delay() trick for optimistic updates
              </Received>

              <Sent pos="first">
                the first version of the optimistic update tests used a
                fetchCount variable. the GET handler returned different data on
                the first vs subsequent calls — initial list, then the list with
                the new item included
              </Sent>
              <Sent pos="middle">
                it worked, but it was testing the wrong thing. it was verifying
                the final state after the full mutation cycle completed, not
                whether the cache updated before the server responded. calling
                the behavior &quot;optimistic&quot; and then only checking the
                end state is not a useful test
              </Sent>
              <Sent pos="last">
                the fix: add delay(300) to the POST handler in MSW. fire the
                mutation without awaiting it. the server is paused 300ms so the
                mutation is still in-flight when waitFor runs. the only way the
                assertion can pass that fast is if onMutate wrote to the cache
                synchronously — which is exactly what &quot;optimistic&quot;
                means
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
                layoutDayEvents takes a list of same-day timed events and
                assigns each one a column index and a total column count. the
                calendar grid uses those to absolutely position events side by
                side when they overlap — same visual as Google Calendar
              </Sent>
              <Sent pos="middle">
                the tests cover: a single event gets column 0 of 1. two
                non-overlapping events share column 0 because they never compete
                for space. two overlapping events get separate columns. three
                simultaneous events each report totalColumns: 3
              </Sent>
              <Sent pos="last">
                then pixel geometry: an event starting at hour 2 with a
                rowHeight of 60 should have topPx of 120. a two-hour event
                should have heightPx of 120. a five-minute event enforces a 20px
                minimum so it&apos;s still clickable. that&apos;s the kind of
                math that&apos;s easy to get slightly wrong and hard to notice
                visually
              </Sent>

              <Timestamp>10:26 AM</Timestamp>

              <Received>why factory functions instead of beforeEach</Received>

              <Sent pos="first">
                shared mutable state is the main source of test interdependence.
                if a beforeEach sets up an object and a test mutates it, the
                next test in the block might run with corrupted state
              </Sent>
              <Sent pos="middle">
                factory functions return a fresh object every call. you can pass
                overrides for the fields you care about and ignore everything
                else. no let declarations at the describe level, no beforeEach
                that runs setup you didn&apos;t ask for
              </Sent>
              <Sent pos="last">
                crypto.randomUUID() for the id means every event and countdown
                is distinct by default. tests that check &quot;does this
                specific event appear&quot; use a fixed id override. tests that
                check &quot;does any event appear&quot; just use the default
                random id and match on title
              </Sent>

              <Timestamp>10:31 AM</Timestamp>

              <Received>what would you add next</Received>

              <Sent pos="first">
                Playwright end-to-end tests for the flows that matter most:
                create an event, share the calendar, verify the event shows up
                in week view. the calendar sharing model is complex enough that
                a full browser test would catch things unit tests miss
              </Sent>
              <Sent pos="middle">
                mutation testing with Stryker to verify the tests actually kill
                the mutations they should. running it would tell you which
                assertions are just checking that the code runs, not that it
                runs correctly
              </Sent>
              <Sent pos="last">
                there&apos;s also a GitHub Actions workflow now that runs the suite
                on every push to main and develop. if tests fail the Vercel
                deploy is blocked — you can&apos;t merge a broken commit without
                explicitly overriding the branch protection rule
              </Sent>

              <div className={styles.typingDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
