"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function MessengerAuthContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Hub", href: "/" },
          { label: "Messenger Auth Bug" },
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
              Messenger Auth Bug
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              A user reported seeing the feature hub when opening the site from
              Facebook Messenger on mobile, even though they had never logged
              in. Two independent root causes — one about caching, one about
              session validation — that produced the same visible symptom.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">What the user saw</h2>
              <p className="text-muted">
                The site has two top-level views: a public landing page for
                unauthenticated visitors and a feature hub for logged-in users.
                The root{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  page.tsx
                </code>{" "}
                calls{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  auth0.getSession()
                </code>{" "}
                on the server to decide which one to render. The user opened a
                shared link inside Facebook Messenger and landed on the hub
                instead of the landing page. The header showed their name and
                &quot;no email on file&quot; — a confusing logged-in state where
                no identity information was actually available.
              </p>
              <p className="mt-3 text-muted">
                The symptom has two distinct causes that can each produce it
                independently.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Root cause one: missing force-dynamic
              </h2>
              <p className="text-muted">
                The root page had no{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  export const dynamic = &quot;force-dynamic&quot;
                </code>
                . Next.js determines whether a page is dynamic by detecting
                calls to cookies, headers, or similar request-time APIs. The
                session check goes through{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  auth0.getSession()
                </code>
                , which calls{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  cookies()
                </code>{" "}
                from{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  next/headers
                </code>{" "}
                internally — but this detection happens inside the Auth0
                library, not directly in the page file. If Next.js missed the
                indirect call, the page could be treated as statically
                renderable.
              </p>
              <p className="mt-3 text-muted">
                A statically rendered page gets cached at the Vercel edge. If a
                logged-in user visited first and the hub HTML was cached, that
                same response would be served to any subsequent visitor —
                including someone with no session at all opening the link from
                Messenger. The in-app browser gets the hub HTML, hydrates it,
                and the user sees a logged-in interface with no real session
                behind it. Any attempt to use an auth-gated feature would then
                fail or redirect to login.
              </p>
              <p className="mt-3 text-muted">
                The fix is one line:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  export const dynamic = &quot;force-dynamic&quot;
                </code>{" "}
                at the top of{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  src/app/page.tsx
                </code>
                . This is an explicit opt-out from any caching — Next.js will
                always render the page fresh per request, so each visitor gets a
                response built from their own session cookie.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Root cause two: no middleware on the root route
              </h2>
              <p className="text-muted">
                The second cause applies even when caching is not involved. The
                middleware in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  src/proxy.ts
                </code>{" "}
                calls{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  auth0.middleware(request)
                </code>{" "}
                for the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /auth/*
                </code>{" "}
                OIDC routes and for protected routes like{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /calendar
                </code>{" "}
                and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /vitals
                </code>
                . The root{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /
                </code>{" "}
                route had no such handling — it fell straight through to a plain{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  NextResponse.next()
                </code>
                .
              </p>
              <p className="mt-3 text-muted">
                This matters because{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  auth0.getSession()
                </code>{" "}
                reads the encrypted session cookie and trusts it — it does not
                make a network call to Auth0 to validate the underlying tokens.
                If a user logged in some time ago and their Auth0 refresh token
                has since expired, the local cookie still exists, still decrypts
                successfully, and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  getSession()
                </code>{" "}
                returns the session. The page renders the hub. But when the user
                tries to use any feature — clicking through to the calendar,
                loading vitals — the protected route calls{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  auth0.middleware()
                </code>
                , the token refresh fails, the cookie is cleared, and they get
                redirected to login. The hub looked real but was a ghost.
              </p>
              <p className="mt-3 text-muted">
                Facebook Messenger is where this surfaces because its in-app
                browser on iOS uses SFSafariViewController, which shares the
                cookie jar with Safari. If the user ever logged in on Safari —
                even weeks ago — that session cookie is still there. On Android,
                Messenger opens links in Chrome Custom Tabs, which shares
                cookies with Chrome. Either way, an old cookie that passed{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  getSession()
                </code>{" "}
                without being validated against Auth0 produced a hub that
                appeared real but could not do anything.
              </p>
              <p className="mt-3 text-muted">
                The fix: in proxy.ts, when the root route has a session cookie,
                run{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  auth0.middleware(request)
                </code>{" "}
                before letting the page render. If the underlying token is still
                valid, the middleware refreshes it and the hub renders
                correctly. If the token is expired and cannot be refreshed, the
                middleware clears the cookie — and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  page.tsx
                </code>{" "}
                sees no session and renders the landing page instead.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">The UX side</h2>
              <p className="text-muted">
                A separate but related issue: users who authenticated via a
                social provider that does not share email (Facebook OAuth, Apple
                Sign-In) would land on the hub with no email visible in the
                header. The email line was conditionally rendered — it only
                appeared when{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  userEmail
                </code>{" "}
                was truthy. For these users the header showed their name but
                nothing else, which looked broken rather than just private.
              </p>
              <p className="mt-3 text-muted">
                The fix renders the email line unconditionally, falling back to
                &quot;no email on file&quot; when the profile has none. The user
                can see that the field exists and is empty, rather than
                wondering why the header feels incomplete.
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
              <Timestamp>Today 11:22 AM</Timestamp>

              <Received pos="first">
                someone says they see the hub when they open the site from
                facebook messenger
              </Received>
              <Received pos="last">they never logged in</Received>

              <Sent pos="first">
                two separate things that can both produce that. first: the root
                page was missing force-dynamic
              </Sent>
              <Sent pos="middle">
                auth0.getSession() calls cookies() from next/headers internally,
                but that call is inside the Auth0 library. if Next.js missed the
                indirect usage, the page could be treated as statically
                renderable and cached at the edge
              </Sent>
              <Sent pos="last">
                cached means the first logged-in user&apos;s hub HTML gets
                served to everyone after that — including someone with no
                session at all. hub renders, hydrates, looks real, but
                there&apos;s nothing behind it
              </Sent>

              <Timestamp>11:26 AM</Timestamp>

              <Received>what&apos;s the fix for that one</Received>

              <Sent>
                one line: export const dynamic = &quot;force-dynamic&quot; in
                page.tsx. explicit opt-out from caching. every request gets a
                fresh server render against the actual session cookie
              </Sent>

              <Timestamp>11:28 AM</Timestamp>

              <Received>you said two things</Received>

              <Sent pos="first">
                second one: the root route never called auth0.middleware().
                protected routes like /calendar and /vitals do — that&apos;s
                what validates the token and refreshes it. but / just passed
                straight through
              </Sent>
              <Sent pos="middle">
                getSession() reads and decrypts the cookie but does not hit
                Auth0 to check if the underlying token is still valid. if
                someone logged in weeks ago and their refresh token expired, the
                cookie still decrypts fine. getSession() says session exists,
                hub renders
              </Sent>
              <Sent pos="last">
                then they click on calendar, that route calls
                auth0.middleware(), token refresh fails, cookie gets cleared,
                redirect to login. hub looked real but was a ghost
              </Sent>

              <Timestamp>11:32 AM</Timestamp>

              <Received>why does messenger specifically trigger it</Received>

              <Sent pos="first">
                messenger on iOS uses SFSafariViewController which shares the
                cookie jar with Safari. on Android it opens in Chrome Custom
                Tabs which shares with Chrome
              </Sent>
              <Sent pos="last">
                so if the user ever logged in on their main browser — even weeks
                ago — that old cookie is visible in the in-app browser. it
                passes getSession() without being validated and the ghost hub
                shows
              </Sent>

              <Timestamp>11:35 AM</Timestamp>

              <Received>fix for the second one</Received>

              <Sent pos="first">
                in proxy.ts, when the root route has a session cookie, run
                auth0.middleware() before the page renders. valid token gets
                refreshed and hub works. expired token gets cleared and page.tsx
                sees no session, landing page renders instead
              </Sent>
              <Sent pos="last">
                also: the email line in the hub header was conditionally
                rendered — hidden when null. users who logged in via Facebook or
                Apple without sharing email got a header with no identity info.
                changed it to always render, shows &quot;no email on file&quot;
                as fallback so it&apos;s clear rather than just empty
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
