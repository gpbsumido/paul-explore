"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function SecurityContent() {
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
            CSP &amp; Security
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
              CSP &amp; Security
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Why the landing page sections were blank in production, how the CSP got fixed, and how the middleware was restructured to avoid paying Auth0 latency on every request.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">

            <section>
              <h2 className="mb-3 text-lg font-bold">What CSP does</h2>
              <p className="text-muted">
                A Content Security Policy is an HTTP header that tells the browser which resources it&apos;s allowed to load and execute. The policy had <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">script-src &apos;nonce-&#123;nonce&#125;&apos; &apos;strict-dynamic&apos;</code> — each request generated a random nonce and any script without that nonce attribute was blocked.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">The unsafe-inline problem</h2>
              <p className="text-muted">
                Next.js App Router inlines RSC payload scripts directly into the HTML — they look like <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">self.__next_f.push([...])</code> and hydrate the React tree on the client. These scripts have no nonce attribute. And <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">&apos;strict-dynamic&apos;</code> explicitly ignores <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">&apos;self&apos;</code>, so even same-origin scripts are blocked unless they carry the nonce.
              </p>
              <p className="mt-3 text-muted">
                Locally this was fine because the dev server always re-renders everything. In production the landing page became fully static after moving the auth redirect to middleware, and Vercel served the CSP from the CDN edge. The clue: HeroSection still animated because its animation is pure CSS <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">@keyframes</code> — everything else uses IntersectionObserver which requires JS. JS was simply not running at all.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Why unsafe-inline is still safe here</h2>
              <p className="text-muted">
                The fix is <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">script-src &apos;self&apos; &apos;unsafe-inline&apos;</code>. What <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">&apos;unsafe-inline&apos;</code> actually protects against is reflected XSS — an attacker injecting a <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">{"<script>"}</code> tag into the HTML response. The real XSS protection here is React&apos;s automatic JSX escaping — any value rendered in JSX gets HTML-escaped before it touches the DOM. The attack surface only opens up if you use <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">dangerouslySetInnerHTML</code>, and there is none of that in this codebase.
              </p>
              <p className="mt-3 text-muted">
                To do nonce-based CSP correctly in Next.js you have to make the root layout async and read the nonce from request headers inside it. But reading <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">headers()</code> in any server component opts that route out of static generation — every page goes dynamic. The root layout wraps every page, so every page takes the TTFB hit. It&apos;s not worth it here, and it&apos;s what the Next.js docs recommend for static apps.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Middleware optimization</h2>
              <p className="text-muted">
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">auth0.middleware()</code> makes a network call to Auth0 on every single request — not just auth routes, every page. That showed up in TTFB data immediately and the whole middleware was pulled. Now the proxy runs on every request but <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">auth0.middleware()</code> is only invoked for <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/auth/*</code> and authenticated <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/vitals</code> or <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/settings</code> requests. Everything else hits <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">NextResponse.next()</code> with the CSP header attached and returns immediately.
              </p>
              <p className="mt-3 text-muted">
                For protected routes, <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">auth0.getSession(req)</code> runs first — the proxy-safe overload that reads from <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">req.cookies</code> directly, no network call, just a cookie decrypt. If there&apos;s no session it redirects to login and <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">auth0.middleware</code> never runs. If there is a session, <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">auth0.middleware</code> runs after to handle rolling session refresh.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Other headers</h2>
              <p className="text-muted">
                The remaining directives do meaningful work: <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">default-src &apos;self&apos;</code> blocks loading resources from unknown domains, <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">frame-ancestors &apos;none&apos;</code> blocks clickjacking, <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">object-src &apos;none&apos;</code> blocks Flash and plugins, <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">base-uri &apos;self&apos;</code> blocks base tag injection. <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">connect-src</code> is locked down so JS can only make requests to known endpoints — same origin, plus specific external services: Speed Insights, TCGdex, and GitHub raw for Pokémon sprites.
              </p>
            </section>

          </div>
        </main>
      ) : (
        <div className="flex justify-center">
          <div className={styles.phone} style={{ minHeight: "calc(100dvh - 56px)" }}>
            <div className={styles.chat}>
              <Timestamp>Today 10:00 AM</Timestamp>

              <Received pos="first">
                why were the landing page sections blank in prod?
              </Received>
              <Received pos="last">they worked fine locally</Received>

              <Sent pos="first">
                CSP. the Content Security Policy in middleware was blocking all
                JavaScript from running
              </Sent>
              <Sent pos="middle">
                the policy had{" "}
                <code>script-src &apos;nonce-&#123;nonce&#125;&apos; &apos;strict-dynamic&apos;</code>{" "}
                — each request would generate a random nonce and any script without
                that nonce attribute would be blocked
              </Sent>
              <Sent pos="last">
                locally it was fine because the dev server always re-renders
                everything. in production the landing page became fully static after
                moving the auth redirect to middleware, and Vercel served the CSP from
                the CDN edge
              </Sent>

              <Timestamp>10:03 AM</Timestamp>

              <Received>what does static have to do with it</Received>

              <Sent pos="first">
                Next.js App Router inlines RSC payload scripts directly into the HTML —
                they look like <code>self.__next_f.push([...])</code>. these are what
                hydrate the React tree on the client
              </Sent>
              <Sent pos="middle">
                the problem is they have no nonce attribute. Next.js just inlines them
                as-is. and <code>&apos;strict-dynamic&apos;</code> explicitly ignores{" "}
                <code>&apos;self&apos;</code>, so even loading scripts from your own
                origin stops working unless they carry the nonce
              </Sent>
              <Sent pos="last">
                when the page was dynamic, server-rendered responses may have behaved
                differently. once it went static, Vercel&apos;s edge middleware applied
                the CSP header to every CDN-cached response — and everything broke
              </Sent>

              <Timestamp>10:07 AM</Timestamp>

              <Received>how did you figure that out</Received>

              <Sent pos="first">
                HeroSection still animated. that was the clue — its animation is pure
                CSS (@keyframes in a style tag), no JavaScript involved. everything
                else uses IntersectionObserver which requires JS
              </Sent>
              <Sent pos="last">
                so JS was clearly not running at all. from there it was just DevTools
                → Console → CSP violation errors pointing at the inline RSC scripts
              </Sent>

              <Timestamp>10:10 AM</Timestamp>

              <Received>what&apos;s the fix</Received>

              <Sent pos="first">
                <code>script-src &apos;self&apos; &apos;unsafe-inline&apos;</code>.
                allows scripts from the same origin and allows inline scripts. that
                covers both the RSC payloads and the Next.js chunks loaded from
                /_next/static/
              </Sent>
              <Sent pos="last">
                also had to add <code>https://vitals.vercel-insights.com</code> to{" "}
                <code>connect-src</code> — Speed Insights was silently failing to send
                its beacons because <code>connect-src &apos;self&apos;</code> blocked
                the request to that external domain
              </Sent>

              <Timestamp>10:14 AM</Timestamp>

              <Received pos="first">
                isn&apos;t &apos;unsafe-inline&apos; bad?
              </Received>
              <Received pos="last">
                feels like it defeats the whole point of a CSP
              </Received>

              <Sent pos="first">
                kind of, but it&apos;s more nuanced than the name suggests
              </Sent>
              <Sent pos="middle">
                what <code>&apos;unsafe-inline&apos;</code> actually protects against
                is reflected XSS — an attacker injecting a{" "}
                <code>&lt;script&gt;</code> tag into the HTML response. CSP blocks that
                script from running even if it makes it into the markup
              </Sent>
              <Sent pos="last">
                but the real XSS protection here is React&apos;s automatic JSX
                escaping. any value rendered in JSX gets HTML-escaped before it touches
                the DOM. the attack surface only opens up if you use{" "}
                <code>dangerouslySetInnerHTML</code> — and there&apos;s none of that
                anywhere in this codebase
              </Sent>

              <Timestamp>10:18 AM</Timestamp>

              <Received>what about the calendar? users put data in there</Received>

              <Sent pos="first">
                yeah I checked. calendar events go through the same JSX rendering
                pipeline — event titles, descriptions, card names, all rendered as
                text nodes via React. no raw HTML injection path
              </Sent>
              <Sent pos="middle">
                if I were ever rendering user content as HTML (like a rich text field),
                that would change things. you&apos;d want either a strict sanitizer
                like DOMPurify before passing to dangerouslySetInnerHTML, or a nonce —
                which brings us back to the tradeoff
              </Sent>
              <Sent pos="last">
                for now the threat model doesn&apos;t warrant it, and the performance
                cost is real
              </Sent>

              <Timestamp>10:22 AM</Timestamp>

              <Received>what&apos;s the performance cost of doing it properly</Received>

              <Sent pos="first">
                to do nonce-based CSP correctly in Next.js you have to make the root
                layout async and read the nonce from request headers inside it, so
                Next.js can stamp it onto the RSC inline scripts
              </Sent>
              <Sent pos="middle">
                but reading headers() in any server component opts that route out of
                static generation. it becomes dynamic — re-rendered on every request.
                the root layout wraps every page, so every page goes dynamic
              </Sent>
              <Sent pos="last">
                I actually tried this. ran a build, and every page flipped from ○
                Static to ƒ Dynamic. TTFB, LCP, FCP — all the vitals I&apos;ve been
                optimizing — take a direct hit. it&apos;s not worth it here
              </Sent>

              <Timestamp>10:26 AM</Timestamp>

              <Received>so &apos;unsafe-inline&apos; is actually fine</Received>

              <Sent pos="first">
                for this site, yes. it&apos;s the standard CSP approach for Next.js
                apps with static pages — it&apos;s what the Next.js docs recommend for
                exactly this reason
              </Sent>
              <Sent pos="middle">
                the remaining directives do meaningful work:{" "}
                <code>default-src &apos;self&apos;</code> blocks loading resources from
                unknown domains, <code>frame-ancestors &apos;none&apos;</code> blocks
                clickjacking, <code>object-src &apos;none&apos;</code> blocks Flash and
                plugins, <code>base-uri &apos;self&apos;</code> blocks base tag
                injection
              </Sent>
              <Sent pos="last">
                and connect-src is locked down so JS can only make requests to known
                endpoints — same origin, plus the specific external services that need
                it (Speed Insights, TCGdex, GitHub raw for Pokémon sprites)
              </Sent>

              <Timestamp>10:30 AM</Timestamp>

              <Received>
                so after all that, did the middleware stick around
              </Received>

              <Sent pos="first">
                no, it got removed entirely for a while. after switching to{" "}
                <code>&apos;unsafe-inline&apos;</code> the CSP part was simpler, but
                the bigger issue was <code>auth0.middleware()</code> itself. it makes
                a network call to Auth0 on every single request — not just auth routes,
                every page
              </Sent>
              <Sent pos="middle">
                so the landing page, TCG browser, all of it — every visit was paying
                that latency cost. it showed up in TTFB data immediately. the whole
                middleware got pulled to stop the bleeding
              </Sent>
              <Sent pos="last">
                the protected page&apos;s auth was handled differently during that
                period — <code>page.tsx</code> was calling{" "}
                <code>auth0.getSession()</code> as a redirect guard, which just reads
                a cookie with no network call. but that made the page dynamic, which
                is its own TTFB problem
              </Sent>

              <Timestamp>10:35 AM</Timestamp>

              <Received>is the middleware back now</Received>

              <Sent pos="first">
                yeah, with smarter logic this time. Next.js 16 introduced{" "}
                <code>proxy.ts</code> as the new convention alongside{" "}
                <code>middleware.ts</code> — you can only have one. we were running
                both, which broke the build, so everything got consolidated into{" "}
                <code>proxy.ts</code> with a broad matcher
              </Sent>
              <Sent pos="middle">
                the broad matcher means the proxy runs on every request. but the key
                property from before is still preserved: <code>auth0.middleware()</code>{" "}
                — the one that makes a network call to Auth0 — is only invoked for{" "}
                <code>/auth/*</code> and authenticated <code>/vitals</code> or{" "}
                <code>/settings</code> requests. everything else hits{" "}
                <code>NextResponse.next()</code> with the CSP header attached and
                returns immediately. no network round-trip
              </Sent>
              <Sent pos="middle">
                for <code>/vitals</code> and <code>/settings</code> the logic is:{" "}
                <code>auth0.getSession(req)</code> runs first — that&apos;s the proxy-
                safe overload that reads from <code>req.cookies</code> directly, no
                network call, just a cookie decrypt. if there&apos;s no session it
                redirects to login and <code>auth0.middleware</code> never runs. if
                there is a session, <code>auth0.middleware</code> runs after to handle
                rolling session refresh
              </Sent>
              <Sent pos="last">
                the root <code>/</code> route is a dynamic server component now — it
                calls <code>auth0.getSession()</code> directly and renders either the
                landing page or the hub. no middleware redirect needed. the session
                check is a local cookie decrypt, so there&apos;s no network cost and
                the dynamic render penalty is negligible
              </Sent>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
