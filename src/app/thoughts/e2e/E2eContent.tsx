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
              browsing, and calendar CRUD — with axe-core accessibility scans
              wired into every public route test and a dedicated test calendar
              that gets created and deleted automatically around every run.
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
                    four tests on the public{" "}
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      /tcg/pokemon
                    </code>{" "}
                    page: an axe scan of the browse page itself, searching for a
                    card name filters the grid, scrolling the sentinel triggers
                    the next page, and a separate test navigates to the first
                    card&apos;s detail URL and runs a second axe scan there
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
                    and verifies the chip is gone — with an axe scan of the
                    month view after the grid loads. The second creates an event
                    via the API directly, switches to week view, and asserts the
                    event renders there
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Accessibility scanning in CI
              </h2>
              <p className="text-muted">
                Each public-route test runs an axe-core scan after the page
                settles. The shared{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  checkA11y()
                </code>{" "}
                helper in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  e2e/helpers/axe.ts
                </code>{" "}
                runs{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  AxeBuilder
                </code>{" "}
                with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  wcag2a
                </code>
                ,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  wcag2aa
                </code>
                , and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  wcag21aa
                </code>{" "}
                tags, then fails the test with a diff of every violation —
                impact level, rule ID, and the first 120 characters of the
                offending element&apos;s HTML. The test output tells you exactly
                what to fix without having to reproduce the scan locally.
              </p>
              <p className="mt-3 text-muted">
                Running axe revealed four real violations. A landing page
                heading was missing{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  text-white
                </code>{" "}
                that every other section heading has — axe computed the dark
                theme foreground color against the page&apos;s root white
                background (not the dark section overlay, which is a sibling
                div, not an ancestor) and flagged the mismatch. A scrollable
                table in the NBA section was missing{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  tabIndex=0
                </code>{" "}
                so keyboard users couldn&apos;t reach its content. The type
                badge colors across the TCG browser and card detail page used
                light{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /300
                </code>{" "}
                palette text on semi-transparent backgrounds — borderline
                against a pure white page. Switching to solid{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  -100
                </code>{" "}
                backgrounds with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  -900
                </code>{" "}
                text (and dark mode counterparts) makes them definitively
                compliant and looks cleaner than the translucent approach
                anyway.
              </p>
              <p className="mt-3 text-muted">
                One fix was in the root layout itself:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  suppressHydrationWarning
                </code>{" "}
                on the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  {"<html>"}
                </code>{" "}
                element. The anti-FOUC script runs in the browser and writes{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  data-theme=&quot;dark&quot;
                </code>{" "}
                to the element before React hydrates. React sees a mismatch
                between the server-rendered HTML (no attribute) and the DOM
                (attribute set by the script) and logs a warning.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  suppressHydrationWarning
                </code>{" "}
                tells React the element intentionally differs — the right fix
                for any element touched by an inline script.
              </p>
              <p className="mt-3 text-muted">
                A dedicated{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  e2e-accessibility
                </code>{" "}
                job in CI runs after the quality checks pass, installs Chromium,
                and runs{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  playwright test --project=public
                </code>
                . A PR that introduces a missing label, a contrast failure, or
                any other WCAG 2.1 AA violation blocks the merge.
              </p>
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
                The accessibility layer catches a different class of bug
                entirely — the kind that passes every functional test but breaks
                the experience for keyboard users or screen reader users.
                Contrast failures, missing landmark roles, inaccessible
                scrollable regions: none of those would ever surface in a unit
                test. Running axe in the same Playwright pass means
                accessibility is automatically re-checked on every public-route
                test run, not just when someone manually audits the page.
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

              <Timestamp>2:30 PM</Timestamp>

              <Received pos="first">you added axe to the tests</Received>
              <Received pos="last">why not a separate audit tool</Received>

              <Sent pos="first">
                because a separate audit is a one-time check. axe in playwright
                runs on every PR, against the real rendered DOM, with actual
                computed styles. it catches regressions, not just the starting
                state
              </Sent>
              <Sent pos="last">
                unit tests can&apos;t evaluate contrast ratios because they
                don&apos;t compute CSS. lighthouse can check contrast but
                it&apos;s not part of a failing test — it&apos;s a score. axe in
                playwright is a hard gate
              </Sent>

              <Timestamp>2:33 PM</Timestamp>

              <Received>what did it actually catch</Received>

              <Sent pos="first">
                four things. a landing page heading was missing text-white —
                every other section heading has it, this one didn&apos;t. axe
                traced the text color up through the DOM and hit the white page
                background, not the dark section overlay, because the overlay is
                a sibling div not a parent. easy to miss visually because the
                overlay is there, but the CSS cascade doesn&apos;t see it
              </Sent>
              <Sent pos="middle">
                a scrollable table in the NBA section was missing tabIndex=0 so
                keyboard users couldn&apos;t reach it. the type badge colors
                across the TCG pages used light /300 palette text on
                semi-transparent backgrounds — borderline against white, and
                axe&apos;s implementation calculated them as failing
              </Sent>
              <Sent pos="last">
                the fix for the badges was to switch from translucent to solid
                -100 backgrounds with -900 text and dark: counterparts. more
                readable and definitively compliant
              </Sent>

              <Timestamp>2:38 PM</Timestamp>

              <Received pos="first">
                there was also a hydration warning
              </Received>
              <Received pos="last">different issue?</Received>

              <Sent pos="first">
                yeah, separate. the anti-FOUC script sets data-theme on the html
                element in the browser before react hydrates. react sees the
                server HTML (no attribute) and the DOM (attribute set by the
                script) and logs a mismatch
              </Sent>
              <Sent pos="last">
                suppressHydrationWarning on the html element tells react the
                element is intentionally touched by an inline script. standard
                pattern for any element the script layer owns before the
                framework boots
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
