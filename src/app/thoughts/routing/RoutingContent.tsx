"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function RoutingContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <nav
        className="sticky top-0 z-20 h-14 border-b border-border"
        style={{
          background: "color-mix(in srgb, var(--color-background) 80%, transparent)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="mx-auto flex h-full max-w-3xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden="true">
              <path d="M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Hub
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground">
            Route Restructure
          </span>
          <div className="ml-auto flex items-center gap-3">
            <ViewToggle view={view} setView={setView} />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {view === "summary" ? (
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <header className="mb-10">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted/50">
              Dev notes
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Route Restructure
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Moving the authenticated hub from <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/protected</code> to{" "}
              <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/</code>, eliminating the redirect, and promoting sub-routes to top-level paths.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">

            <section>
              <h2 className="mb-3 text-lg font-bold">Why this change</h2>
              <p className="text-muted">
                The original routing pattern had a problem: logged-in users who navigated to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/</code> were immediately redirected to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/protected</code> by the middleware. This meant the URL in the browser always reflected an implementation detail, not a meaningful destination. The hub at <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/protected</code> was just an awkward artifact of how auth-gating was wired up, not a real route users would want to bookmark or share.
              </p>
              <p className="mt-3 text-muted">
                The fix is straightforward: make <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/</code> context-aware. Unauthenticated visitors see the landing page. Logged-in users see the hub. Same URL, different content. Vitals and settings move to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/vitals</code> and <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/settings</code> — paths that actually describe what they are.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">The force-static trade-off</h2>
              <p className="text-muted">
                The previous setup worked because <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/page.tsx</code> had <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">export const dynamic = &quot;force-static&quot;</code>. The landing page was baked into the CDN at build time and the middleware handled the redirect for authenticated users. No auth call touched the page component itself.
              </p>
              <p className="mt-3 text-muted">
                Once the root page needs to branch on authentication, <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">force-static</code> is gone. The page becomes a dynamic server component that calls <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">auth0.getSession()</code> on every request.
              </p>
              <p className="mt-3 text-muted">
                In practice this trade-off is negligible. <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">auth0.getSession()</code> does not make a network call — it decrypts the session cookie locally using the <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">AUTH0_SECRET</code> key. The cost is a few microseconds of CPU work. The hub content is still fetched client-side via TanStack Query exactly as before. For a personal portfolio, clean URLs are worth more than static generation on the root route.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Security model</h2>
              <p className="text-muted">
                The middleware still enforces auth — it just protects different paths now. <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/vitals</code> and <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/settings</code> get the same treatment <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/protected</code> did: unauthenticated requests redirect to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/auth/login?returnTo=&#123;pathname&#125;</code> before any page code runs. Authenticated requests go through <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">auth0.middleware()</code> for rolling session refresh. CSP headers are applied on every response, same as before.
              </p>
              <p className="mt-3 text-muted">
                The root <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/</code> route is not middleware-gated because it intentionally renders for both states. There is nothing sensitive in the landing page for unauthenticated users and the hub content only renders after the server confirms a valid session. An unauthenticated request can never reach the hub code path.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What changed in the code</h2>
              <ul className="mt-2 space-y-2 text-muted">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span><code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">src/proxy.ts</code> — removed the <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/</code> redirect block and the <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/protected</code> protection block, added equivalent protection for <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/vitals</code> and <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/settings</code></span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span><code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">src/app/page.tsx</code> — converted from a static export to an async server component; now calls <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">auth0.getSession()</code> and renders either <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">LandingContent</code> or <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">FeatureHub</code></span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>9 files moved: <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">FeatureHub.tsx</code>, <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">vitals/*</code>, and <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">settings/*</code> from the <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">protected/</code> folder to their new top-level locations</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>22 files updated: all back-to-hub links changed from <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">href=&quot;/protected&quot;</code> to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">href=&quot;/&quot;</code> across feature pages and thoughts pages</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span><code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">src/types/protected.ts</code> renamed to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">src/types/hub.ts</code></span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">One external dependency</h2>
              <p className="text-muted">
                The Express backend constructs the Google Calendar OAuth callback URL as <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">&#123;origin&#125;/protected/settings?gcal=connected</code>. After this migration the correct path is <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">&#123;origin&#125;/settings?gcal=connected</code>. Until the backend is updated, the <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">?gcal=connected</code> success banner won&apos;t fire after connecting Google Calendar — but the middleware will catch the old URL gracefully. Deploy order: frontend first, then backend.
              </p>
            </section>

          </div>
        </main>
      ) : (
        <div className="flex justify-center">
          <div className={styles.phone} style={{ minHeight: "calc(100dvh - 56px)" }}>
            <div className={styles.chat}>
              <Timestamp>Today 3:00 PM</Timestamp>

              <Received pos="first">
                why was the hub at /protected in the first place
              </Received>
              <Received pos="last">
                that URL always felt off
              </Received>

              <Sent pos="first">
                it was just how the auth gating got wired up initially. Next.js
                middleware can only redirect, it can&apos;t conditionally render —
                so the pattern was: land on <code>/</code>, middleware detects a
                session, redirects to <code>/protected</code>
              </Sent>
              <Sent pos="last">
                the problem is that&apos;s an implementation detail in the URL.
                <code>/protected</code> doesn&apos;t mean anything to a user. it
                means &quot;this is where the auth redirect dumps you&quot;
              </Sent>

              <Timestamp>3:03 PM</Timestamp>

              <Received>so how do you make / context-aware without middleware</Received>

              <Sent pos="first">
                you don&apos;t need middleware for it. <code>page.tsx</code> becomes
                an async server component that calls <code>auth0.getSession()</code>
                directly — no network call, just a cookie decrypt — and renders either
                the hub or the landing page based on what comes back
              </Sent>
              <Sent pos="last">
                same URL, different content. the redirect is completely gone. if
                you&apos;re logged in you see the hub at <code>/</code>. if not, you
                see the landing page at <code>/</code>. no visible transition, no URL
                change
              </Sent>

              <Received>doesn&apos;t that break static generation</Received>

              <Sent pos="first">
                yes, <code>/</code> becomes dynamic. it can&apos;t be baked into the
                CDN at build time anymore because the content depends on a cookie
              </Sent>
              <Sent pos="middle">
                but the cost is basically nothing. <code>auth0.getSession()</code>
                decrypts a cookie locally using <code>AUTH0_SECRET</code>. no round
                trip to Auth0, no database call — a few microseconds of CPU
              </Sent>
              <Sent pos="last">
                for a personal portfolio, clean URLs are worth more than static
                generation on the root route. the hub content is still fetched
                client-side via TanStack Query the same as it always was
              </Sent>

              <Timestamp>3:09 PM</Timestamp>

              <Received>what happened to /vitals and /settings</Received>

              <Sent pos="first">
                they moved out of the <code>protected/</code> folder to top-level
                routes. <code>/protected/vitals</code> becomes <code>/vitals</code>,
                <code>/protected/settings</code> becomes <code>/settings</code>
              </Sent>
              <Sent pos="last">
                middleware still protects them — unauthenticated requests get
                redirected to <code>/auth/login?returnTo=/vitals</code> before
                any page code runs. same security guarantee, better URLs
              </Sent>

              <Received>
                but the middleware now runs <code>auth0.middleware()</code> for those
                routes — doesn&apos;t that add latency
              </Received>

              <Sent pos="first">
                only when there&apos;s a valid session. the proxy checks
                <code>auth0.getSession(req)</code> first — that&apos;s the
                proxy-safe overload that reads from <code>req.cookies</code>, no
                network call. if there&apos;s no session it redirects immediately and
                <code>auth0.middleware()</code> never runs
              </Sent>
              <Sent pos="last">
                if there is a session, <code>auth0.middleware()</code> runs after
                to handle rolling session refresh. that&apos;s the one network call
                — but it only happens for authenticated requests to protected routes,
                same as the old behavior
              </Sent>

              <Timestamp>3:15 PM</Timestamp>

              <Received>
                what about the Google Calendar callback — that was hardcoded to
                /protected/settings
              </Received>

              <Sent pos="first">
                yeah, that&apos;s the one external dependency. the Express backend
                builds the OAuth callback URL as{" "}
                <code>{"{origin}"}/protected/settings?gcal=connected</code>
              </Sent>
              <Sent pos="middle">
                after the migration the correct path is{" "}
                <code>{"{origin}"}/settings?gcal=connected</code>. until the backend
                is updated the success banner won&apos;t fire after connecting Google
                Calendar — but the middleware catches the old URL gracefully, the
                OAuth flow itself still completes
              </Sent>
              <Sent pos="last">
                deploy order: frontend first, then backend. the old callback URL
                still works during the gap, it just doesn&apos;t trigger the banner
              </Sent>

              <Timestamp>3:21 PM</Timestamp>

              <Received>
                how many files actually changed
              </Received>

              <Sent pos="first">
                9 files moved — <code>FeatureHub.tsx</code>, the vitals folder, the
                settings folder — out of <code>protected/</code> to their new
                top-level locations
              </Sent>
              <Sent pos="middle">
                22 files updated — every back-to-hub link that pointed to{" "}
                <code>href=&quot;/protected&quot;</code> changed to{" "}
                <code>href=&quot;/&quot;</code>. feature pages, thoughts pages, nav
                components
              </Sent>
              <Sent pos="last">
                and <code>src/types/protected.ts</code> got renamed to{" "}
                <code>src/types/hub.ts</code>. the type name was leaking the
                same implementation detail as the route
              </Sent>

              <Received>clean. the URL finally matches what it actually is</Received>

              <Sent>
                that&apos;s the whole point. URLs are user-facing. they should
                describe what&apos;s there, not how the auth routing works
              </Sent>

              {/* Typing indicator */}
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
