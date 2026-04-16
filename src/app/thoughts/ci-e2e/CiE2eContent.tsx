"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function CiE2eContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Hub", href: "/" },
          { label: "CI E2E Reliability" },
        ]}
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
              CI E2E Reliability
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Two classes of CI failure that look unrelated but share a root
              cause: the test environment is not your laptop. Auth0 crashing the
              entire middleware, and a search test depending on an external API
              that CI can&apos;t reach reliably. Each one required a different
              fix.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">
                Auth0 and module-level initialization
              </h2>
              <p className="text-muted">
                Auth0&apos;s{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  Auth0Client
                </code>{" "}
                is constructed at module load time in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  src/lib/auth0.ts
                </code>
                . In production or local dev, the environment variables are set
                and the client initializes cleanly. In GitHub Actions, unset
                secrets resolve to empty strings, not undefined — so the
                fallback{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  {"process.env.AUTH0_SECRET ?? ''"}
                </code>{" "}
                was already empty. The SDK read the empty string, failed its own
                validation, and threw during initialization.
              </p>
              <p className="mt-3 text-muted">
                The subtle part: this is a module-level throw, not a
                request-level throw. Node.js caches module evaluation, so the
                first time{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  auth0.ts
                </code>{" "}
                is imported it runs and the error propagates up to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  proxy.ts
                </code>
                , which also fails to initialize. Next.js middleware runs before
                every request, so every route — the TCG browse page, the landing
                page, everything — returned 500.
              </p>
              <p className="mt-3 text-muted">
                The fix is two-part. In{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ci.yml
                </code>
                , each Auth0 env var gets an explicit placeholder fallback:
              </p>
              <pre className="mt-3 overflow-x-auto rounded bg-surface px-4 py-3 text-[13px] font-mono text-foreground">
                {`AUTH0_SECRET: \${{ secrets.AUTH0_SECRET || 'ci-placeholder-secret-32-characters!!' }}
AUTH0_DOMAIN: \${{ secrets.AUTH0_DOMAIN || 'placeholder.auth0.com' }}`}
              </pre>
              <p className="mt-3 text-muted">
                This gives the SDK something valid-looking to initialize
                against. The public E2E tests never hit a real Auth0 endpoint,
                so the placeholder values are never used at runtime — they just
                need to satisfy the startup validation. The second part is a
                try-catch around{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  auth0.middleware(request)
                </code>{" "}
                in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  proxy.ts
                </code>{" "}
                so that even if Auth0 throws at runtime on an{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /auth/*
                </code>{" "}
                request, it falls through to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  NextResponse.next()
                </code>{" "}
                rather than crashing the middleware.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                The TCG search test and external API dependency
              </h2>
              <p className="text-muted">
                After the Auth0 fix, the public E2E suite nearly passed. The
                remaining failure was the TCG search test. The sequence of
                attempts is instructive.
              </p>
              <p className="mt-3 text-muted">
                <strong>Attempt 1 — waitForResponse</strong>: register a
                listener for the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/tcg/cards?q=Pikachu
                </code>{" "}
                response, fill the search input, await the listener. Race
                condition: if the app re-renders quickly enough that the fetch
                completes before the test sets up the listener, the promise
                never resolves.
              </p>
              <p className="mt-3 text-muted">
                <strong>Attempt 2 — expect.poll on DOM hrefs</strong>: instead
                of waiting for the network event, poll the card link elements
                until their hrefs differ from the initial unfiltered set. No
                race on listener setup. But a new problem: React Query clears
                the previous page while loading the new one, producing a brief
                state where the href array is empty. An empty array satisfies{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  not.toEqual(initialHrefs)
                </code>
                , so the poll resolves immediately — then{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  filteredHrefs.length {">"} 0
                </code>{" "}
                fails because the Pikachu results haven&apos;t arrived yet. And
                in CI, where the TCGdex external API was unreachable within the
                10-second timeout, those results never arrived.
              </p>
              <p className="mt-3 text-muted">
                <strong>Attempt 3 — page.route mock</strong>: intercept{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/tcg/cards*
                </code>{" "}
                at the browser level. Requests with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  q=pikachu
                </code>{" "}
                get a fixed mock payload instantly; everything else passes
                through. The poll assertion changes from{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  not.toEqual(initialHrefs)
                </code>{" "}
                to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  toContainEqual(&quot;/tcg/pokemon/card/base1-58&quot;)
                </code>
                . A specific href that only exists in the mock response — the
                poll only resolves when the mock data is actually rendered, not
                on the transient empty state.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Why not mock everything
              </h2>
              <p className="text-muted">
                The initial page load in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  beforeEach
                </code>{" "}
                still hits the real{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/tcg/cards
                </code>{" "}
                route (which in turn hits TCGdex). This is intentional. Mocking
                the initial load would make the browse page axe scan and the
                scroll-to-sentinel test meaningless — they need real rendered
                content to be useful. The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  waitForSelector
                </code>{" "}
                in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  beforeEach
                </code>{" "}
                has a 15-second timeout and the CDN-cached initial response
                consistently arrives within that window.
              </p>
              <p className="mt-3 text-muted">
                The search test is different: it specifically tests that
                filtering works as a user interaction. The interesting behavior
                is the debounce, the URL update, and the DOM transition — not
                whether TCGdex happens to have Pikachu cards today. Mocking the
                search fetch tests the right thing and removes a variable that
                CI has no control over.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">The general pattern</h2>
              <p className="text-muted">
                Both fixes follow the same principle: CI should not depend on
                external services behaving a specific way. Auth0 can fail to
                initialize because secrets aren&apos;t present — give the SDK
                valid-looking values and handle any runtime errors defensively.
                TCGdex can be slow or unreachable — mock the internal API route
                so the test controls the response.
              </p>
              <p className="mt-3 text-muted">
                The right boundary for E2E mocking is your own API surface. The
                Next.js routes at{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/*
                </code>{" "}
                are part of this app. The TCGdex API is not. Mocking at the
                boundary between the two gives you full test control without
                hollowing out what the test actually exercises.
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
              <Timestamp>Today 3:00 PM</Timestamp>

              <Received pos="first">the e2e tests broke in CI</Received>
              <Received pos="last">two separate things you said</Received>

              <Sent pos="first">
                first one: Auth0Client is constructed at module load time. in
                production the env vars are set and it initializes fine. in
                github actions, unset secrets resolve to empty strings — the SDK
                read the empty value, failed its own validation, and threw
                during init
              </Sent>
              <Sent pos="middle">
                module-level throw means node cached the failed module
                evaluation. proxy.ts imports auth0.ts, so proxy.ts also failed
                to load. middleware runs before every request so every route
                returned 500 — not just the auth routes
              </Sent>
              <Sent pos="last">
                fixed it with placeholder fallbacks in ci.yml so the SDK has
                something valid-looking at startup. plus a try-catch around
                auth0.middleware() so a runtime error on /auth/* falls through
                instead of crashing everything
              </Sent>

              <Timestamp>3:07 PM</Timestamp>

              <Received>what was the second thing</Received>

              <Sent pos="first">
                the TCG search test. it was checking that searching for Pikachu
                shows different cards. the test depended on TCGdex responding
                fast enough in CI, which it didn&apos;t
              </Sent>
              <Sent pos="middle">
                first I tried waitForResponse — race condition where the
                response lands before the listener is registered. then I tried
                polling the DOM hrefs until they changed — that passes on the
                empty loading state between renders before the results arrive
              </Sent>
              <Sent pos="last">
                the fix was page.route. intercept /api/tcg/cards* at the browser
                level and return a fixed mock payload for q=pikachu instantly.
                changed the assertion to toContainEqual on a specific href from
                the mock — only resolves when that card is actually in the DOM,
                not on the transient empty state
              </Sent>

              <Timestamp>3:14 PM</Timestamp>

              <Received>why not mock the initial page load too</Received>

              <Sent pos="first">
                the browse axe scan and the scroll sentinel test need real
                rendered content to be meaningful. mocking the initial load
                would make them test the mock, not the page
              </Sent>
              <Sent pos="middle">
                the initial load hits the CDN-cached response which arrives
                consistently within the 15s beforeEach timeout. that&apos;s a
                stable dependency
              </Sent>
              <Sent pos="last">
                the search fetch is different — the interesting behavior is the
                debounce, the URL update, and the DOM transition. whether TCGdex
                happens to have Pikachu cards today is not what the test is
                about. mock that part, keep the rest real
              </Sent>

              <Timestamp>3:19 PM</Timestamp>

              <Received>is there a general rule here</Received>

              <Sent pos="first">
                yeah — CI should not depend on external services behaving a
                specific way. your own /api/* routes are in scope. TCGdex,
                Auth0&apos;s runtime, any third-party — not in scope
              </Sent>
              <Sent pos="middle">
                for auth, that means giving the SDK valid-looking config so it
                boots, not real credentials. the public tests never call Auth0
                at runtime anyway
              </Sent>
              <Sent pos="last">
                for external data APIs, mock at the boundary between your app
                and theirs. everything inside that boundary runs for real.
                everything outside it is a variable you don&apos;t control
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
