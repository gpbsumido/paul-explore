"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function E2eContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "E2E Testing" }]}
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
              End-to-End Testing
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Playwright covering three user flows — auth redirects, TCG card
              browsing, and calendar CRUD — with a dedicated test calendar that
              gets created and deleted automatically around every run.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">
                Why unit tests miss this
              </h2>
              <p className="text-muted">
                The calendar user flows are hard to unit test meaningfully.
                Creating an event involves clicking a time slot, filling a
                modal, saving, and confirming the result appears in the grid —
                across a server component that fetches events, a client
                component that manages modal state, a React Query mutation, and
                an API route. You can test each piece in isolation, but the
                interesting failures happen at the seams. The same is true for
                the auth redirect: the middleware cookie check, the redirect URL
                construction, and the Auth0 handoff are all trivially
                unit-testable, and none of those tests would catch a
                misconfigured{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  returnTo
                </code>{" "}
                param dropping users on the landing page after login.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Setup</h2>
              <ul className="mt-2 space-y-2 text-muted">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    <strong className="text-foreground">Playwright</strong> was
                    already a dev dependency, so there was no install step —
                    just a{" "}
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      playwright.config.ts
                    </code>{" "}
                    to wire everything up
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Two Playwright projects:{" "}
                    <strong className="text-foreground">public</strong> (no auth
                    state, runs smoke + TCG + auth redirect specs) and{" "}
                    <strong className="text-foreground">authenticated</strong>{" "}
                    (loads a saved session cookie, runs calendar specs)
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      webServer
                    </code>{" "}
                    in the config starts{" "}
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      next dev
                    </code>{" "}
                    and waits for{" "}
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      http://localhost:3000
                    </code>{" "}
                    before any test runs. Locally it reuses an existing server
                    if one is already running; CI always starts fresh
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Auth and isolation</h2>
              <p className="text-muted">
                The hardest part of E2E testing an Auth0-protected app is
                getting a valid session without doing a real OAuth dance on
                every test. The approach here: a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  globalSetup
                </code>{" "}
                script that runs once before all tests. It launches a headless
                browser, navigates to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /auth/login
                </code>
                , fills in test credentials against the real Auth0 Universal
                Login page, and waits until the URL is back on the app domain.
                At that point the session cookie exists and the context is saved
                to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  e2e/.auth/user.json
                </code>{" "}
                via{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  context.storageState()
                </code>
                . The authenticated Playwright project loads that file as its
                starting state, so every calendar test begins already logged in
                with no additional overhead.
              </p>
              <p className="mt-3 text-muted">
                Test data isolation uses a dedicated test calendar. After saving
                the session, globalSetup calls{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  POST /api/calendar/calendars
                </code>{" "}
                with the auth context to create a calendar named{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  [E2E] Test Calendar
                </code>{" "}
                and saves its ID to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  e2e/.auth/test-state.json
                </code>
                . A matching{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  globalTeardown
                </code>{" "}
                deletes that calendar after the suite finishes. No test data
                leaks into the real account.
              </p>
              <p className="mt-3 text-muted">
                When{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  E2E_TEST_EMAIL
                </code>{" "}
                and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  E2E_TEST_PASSWORD
                </code>{" "}
                are absent, globalSetup writes an empty{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  storageState
                </code>{" "}
                file so the config stays valid, and the calendar tests self-skip
                with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  test.skip
                </code>
                . The public tests still run.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">The three suites</h2>
              <ul className="mt-2 space-y-4 text-muted">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    <strong className="text-foreground">Auth redirects</strong>{" "}
                    — navigates to{" "}
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      /calendar
                    </code>
                    ,{" "}
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      /vitals
                    </code>
                    , and{" "}
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      /settings
                    </code>{" "}
                    as an unauthenticated user and asserts that each one
                    redirects to the Auth0 login page. No credentials needed,
                    just confirming the middleware fires. The three tests are
                    generated from a single array so adding a new protected
                    route means adding one string
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    <strong className="text-foreground">TCG browsing</strong> —
                    three tests on the public{" "}
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      /tcg/pokemon
                    </code>{" "}
                    page: searching for a card name filters the grid, scrolling
                    the sentinel element to the viewport triggers the
                    IntersectionObserver and loads the next page, and clicking a
                    card tile navigates to its detail page with the card name
                    visible
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    <strong className="text-foreground">Calendar CRUD</strong> —
                    two authenticated tests. The first drives the UI: clicks
                    today&apos;s cell to open the event modal, fills in a title,
                    saves, verifies the chip appears in the grid, then clicks
                    the chip to open the edit modal, clicks Delete, confirms,
                    and verifies the chip is gone. The second creates an event
                    via the API directly (keeping the test focused on the read
                    path), switches to week view, and asserts the event renders
                    there
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Infinite scroll in tests
              </h2>
              <p className="text-muted">
                The TCG page uses an IntersectionObserver with a sentinel div at
                the bottom of the card grid. When the sentinel enters the
                viewport, fetchNextPage fires. Playwright can&apos;t trigger
                IntersectionObserver events directly, but{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  scrollIntoViewIfNeeded()
                </code>{" "}
                on the sentinel element does the same thing the browser does
                naturally — it scrolls the element into view and lets the
                observer fire on its own. The test then waits for the card count
                to increase. No mocks, no synthetic events, no polling — just
                the real mechanism at real speed.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What this improves</h2>
              <p className="text-muted">
                Before this, the only automated check on a full user flow was
                the unit tests on individual functions. Those tests are valuable
                but they can&apos;t catch a broken modal interaction, a missing
                query invalidation after a mutation, or a redirect that lands on
                the wrong page. The E2E suite catches those. It also serves as
                living documentation — reading the calendar spec tells you
                exactly what the create and delete flows look like step by step,
                in a way that no README can stay in sync with.
              </p>
              <p className="mt-3 text-muted">
                The public suite runs without credentials, so it can run in CI
                on every pull request with no secrets required. The auth suite
                is gated on the presence of test credentials and designed to
                skip cleanly when they&apos;re absent, so the CI pipeline stays
                green in both configurations.
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
              <Timestamp>Today 2:00 PM</Timestamp>

              <Received pos="first">
                the testing page says playwright is next
              </Received>
              <Received pos="last">so what actually got built</Received>

              <Sent pos="first">
                three suites: auth redirects, TCG browsing, and calendar CRUD.
                plus a globalSetup that logs into Auth0 once and reuses the
                session across every test that needs auth
              </Sent>
              <Sent pos="last">
                and a dedicated test calendar that gets created at the start of
                the run and deleted at the end so no test data ends up in the
                real account
              </Sent>

              <Received>why not just mock the auth</Received>

              <Sent pos="first">
                Auth0 v4 signs the session cookie with a secret. you can&apos;t
                forge it without knowing the key, and even if you did, the
                middleware would have to skip its own verification to accept it
              </Sent>
              <Sent pos="middle">
                so the options are: do a real login once and cache the cookie,
                add a test bypass to the middleware, or skip auth tests entirely
              </Sent>
              <Sent pos="last">
                doing a real login once is cleanest. globalSetup launches a
                headless browser, navigates to /auth/login, fills the
                credentials, waits for the redirect back to the app, and saves
                the storage state. the whole thing takes a few seconds and every
                authenticated test that follows starts already logged in
              </Sent>

              <Timestamp>2:07 PM</Timestamp>

              <Received pos="first">
                how does the test calendar isolation work
              </Received>
              <Received pos="last">
                what stops test events from showing up next to real ones
              </Received>

              <Sent pos="first">
                after saving the session, globalSetup calls POST
                /api/calendar/calendars with the auth context. it creates a
                calendar named [E2E] Test Calendar and saves the id to
                e2e/.auth/test-state.json
              </Sent>
              <Sent pos="middle">
                the calendar tests read that id and scope all their events to
                that calendar. globalTeardown reads the same file and deletes
                the calendar when the suite finishes
              </Sent>
              <Sent pos="last">
                deleting the calendar deletes all its events too, so cleanup is
                one DELETE call regardless of how many tests ran or whether any
                of them failed
              </Sent>

              <Timestamp>2:13 PM</Timestamp>

              <Received>what about when credentials are not set</Received>

              <Sent pos="first">
                globalSetup writes an empty storageState file so the config
                stays valid — playwright requires the file to exist even if it
                has no cookies
              </Sent>
              <Sent pos="last">
                the calendar tests check for E2E_TEST_EMAIL at the top of the
                describe block and call test.skip if it&apos;s missing. the
                public tests run regardless. CI stays green in both
                configurations
              </Sent>

              <Timestamp>2:18 PM</Timestamp>

              <Received>how does the infinite scroll test work</Received>

              <Sent pos="first">
                the TCG page uses an IntersectionObserver on a sentinel div at
                the bottom of the card grid. when the sentinel enters the
                viewport, fetchNextPage fires
              </Sent>
              <Sent pos="middle">
                playwright can&apos;t trigger IntersectionObserver events
                directly, but scrollIntoViewIfNeeded on the sentinel does
                exactly what the browser does naturally. the test calls that,
                then waits for the card count to increase
              </Sent>
              <Sent pos="last">
                no mocks, no synthetic events. just the real mechanism
              </Sent>

              <Timestamp>2:24 PM</Timestamp>

              <Received>what does this actually improve</Received>

              <Sent pos="first">
                the unit tests cover individual functions well. they can&apos;t
                catch a broken modal interaction, a missing query invalidation
                after a delete, or a redirect that puts you on the wrong page
                after login
              </Sent>
              <Sent pos="middle">
                the calendar spec in particular reads like a manual QA script.
                open the modal, fill the title, save, check the chip appears,
                click it, delete, confirm, check it&apos;s gone. that&apos;s the
                flow a user actually runs and unit tests can&apos;t describe it
                at that level
              </Sent>
              <Sent pos="last">
                it also gives you a place to put regression tests when a bug
                shows up. reproduce it in a spec, fix it, watch the spec pass
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
