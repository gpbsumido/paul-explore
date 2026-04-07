"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function PerfContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Hub", href: "/" },
          { label: "Performance Improvements" },
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
              Performance Improvements
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              A systematic pass through each Core Web Vital — what was wrong,
              why, and what changed.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">The five vitals</h2>
              <p className="text-muted">
                Google measures web performance with five field metrics
                collected from real users — not lab simulations. Each has a
                threshold: good, needs improvement, or poor. The P75 value (75th
                percentile across all visits) is what counts.
              </p>
              <ul className="mt-4 space-y-2 text-muted">
                {[
                  [
                    "LCP",
                    "Largest Contentful Paint",
                    "how fast the main content loads",
                  ],
                  [
                    "FCP",
                    "First Contentful Paint",
                    "how fast something first appears on screen",
                  ],
                  [
                    "CLS",
                    "Cumulative Layout Shift",
                    "how much content jumps around during load",
                  ],
                  [
                    "INP",
                    "Interaction to Next Paint",
                    "how fast the page responds to clicks and taps",
                  ],
                  [
                    "TTFB",
                    "Time to First Byte",
                    "how fast the server starts sending a response",
                  ],
                ].map(([abbr, name, desc]) => (
                  <li key={abbr} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                    <span>
                      <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                        {abbr}
                      </code>{" "}
                      — {name}: {desc}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                FCP + CLS: the dark mode flash
              </h2>
              <p className="text-muted">
                The biggest quick win. Every user with dark mode saved had a
                visible flash from light to dark on every page load.
              </p>
              <p className="mt-3 text-muted">
                The root cause:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ThemeProvider
                </code>{" "}
                sets{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  data-theme
                </code>{" "}
                on{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  &lt;html&gt;
                </code>{" "}
                via{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useEffect
                </code>
                . That runs after the first paint. The browser already rendered
                the page with the light theme CSS applied before the dark theme
                switch happened.
              </p>
              <p className="mt-3 text-muted">
                The fix is a blocking inline script in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  &lt;head&gt;
                </code>{" "}
                that reads{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  localStorage
                </code>{" "}
                and sets{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  data-theme
                </code>{" "}
                synchronously before CSS parses. The script is a self-contained
                IIFE wrapped in try/catch so it silently does nothing in
                environments where{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  localStorage
                </code>{" "}
                is unavailable (private browsing, SSR).
              </p>
              <ul className="mt-4 space-y-2 text-muted">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    FCP improves because the browser doesn&apos;t need to
                    repaint after the theme swap
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    CLS improves because any layout dimensions that differ
                    between themes no longer shift after first paint
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    The{" "}
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      useEffect
                    </code>{" "}
                    in ThemeProvider still runs but it&apos;s now a no-op — the
                    attribute is already set to the right value
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                TTFB: ISR on static pages
              </h2>
              <p className="text-muted">
                Without an explicit revalidation strategy, Next.js re-renders
                pages on every request. For pages with no dynamic data, that
                means the origin server rebuilds HTML that will be identical to
                the last build — wasted work on every request.
              </p>
              <p className="mt-3 text-muted">
                The fix is{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  export const revalidate
                </code>{" "}
                at the page level. Next.js caches the rendered HTML at the CDN
                edge and serves it from there, only rebuilding when the interval
                expires.
              </p>
              <ul className="mt-4 space-y-2 text-muted">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    All 14 thoughts pages:{" "}
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      revalidate = 86400
                    </code>{" "}
                    — static write-ups
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Fantasy NBA pages:{" "}
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      revalidate = 3600
                    </code>{" "}
                    — the page shell is static, client fetches live ESPN data on
                    mount
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                TTFB: cache headers on the geo API route
              </h2>
              <p className="text-muted">
                The TCG and GraphQL proxy routes already had{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  Cache-Control
                </code>{" "}
                headers. The geo route was the only public API route missing
                them. A geolocation result for a given IP is stable for a
                session — no reason to hit the upstream service on every weather
                canvas load.
              </p>
              <p className="mt-3 text-muted">
                Added{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  private, max-age=300
                </code>{" "}
                — private so CDNs don&apos;t share geo results between users,
                five minutes so the browser reuses the response within a
                session.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                LCP: lazy-loading below-fold landing sections
              </h2>
              <p className="text-muted">
                The landing page (unauthenticated view) imported all eleven
                sections eagerly — HeroSection, FeaturesSection, AuthSection,
                and eight more. They all landed in the same initial JavaScript
                chunk and hydrated together.
              </p>
              <p className="mt-3 text-muted">
                The LCP element is the H1 in HeroSection. The browser has to
                download, parse, and execute the full landing bundle before it
                can evaluate LCP candidates. Eleven sections worth of Framer
                Motion variants, canvas effects, and animated previews all
                competing for that first frame.
              </p>
              <p className="mt-3 text-muted">
                The fix: HeroSection stays eager. The other ten are wrapped in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  next/dynamic
                </code>{" "}
                with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ssr: true
                </code>
                . Their HTML is still included in the server-rendered stream for
                SEO, but their JavaScript loads in separate async chunks after
                the initial bundle. The hero renders and LCP fires before those
                chunks even begin downloading.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                INP: WeatherCanvas throttle + input yielding
              </h2>
              <p className="text-muted">
                The weather canvas ran at 60fps on the main thread — Phong rain
                simulation, 260-particle snow, animated fog bands. Any click or
                tap had to wait for the current canvas frame to finish before
                the browser could respond. That wait is INP.
              </p>
              <p className="mt-3 text-muted">
                Two changes landed without moving work off-thread:
              </p>
              <ul className="mt-4 space-y-2 text-muted">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    <strong className="text-foreground">30fps cap</strong> — the
                    animation loop now checks{" "}
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      timestamp - lastFrameTime
                    </code>{" "}
                    against a 33ms budget and skips frames that arrive too
                    early. Halves main-thread load with no visible quality drop
                    for a weather effect.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    <strong className="text-foreground">
                      <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                        scheduler.isInputPending
                      </code>{" "}
                      yield
                    </strong>{" "}
                    — when the browser has queued pointer or keyboard events,
                    the loop skips that frame entirely. The browser dispatches
                    the event immediately instead of queuing it behind canvas
                    work. This is a non-standard API (Chrome only) so it
                    degrades gracefully where absent.
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                LCP: FeatureHub SSR seeding
              </h2>
              <p className="text-muted">
                The authenticated hub fetched the user&apos;s name and email
                from{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/me
                </code>{" "}
                on the client with no initial data. The header showed skeleton
                bones until the fetch resolved — a skeleton-to-content swap
                visible on every authenticated page load.
              </p>
              <p className="mt-3 text-muted">
                The session was already available in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  page.tsx
                </code>{" "}
                —{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  auth0.getSession()
                </code>{" "}
                runs there to decide whether to render the hub or the landing
                page. The name and email were already in hand.
              </p>
              <p className="mt-3 text-muted">
                The fix: extract them from the session and pass them as{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  initialMe
                </code>{" "}
                to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  FeatureHub
                </code>
                , which seeds the TanStack Query cache via{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  initialData
                </code>
                . The query still runs in the background and refreshes after 5
                minutes. The user name renders on first paint — no skeleton.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Navigation: BrowseContent URL sync guard
              </h2>
              <p className="text-muted">
                The Pokémon browser syncs search filters to the URL via a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useEffect
                </code>{" "}
                that calls{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  router.replace
                </code>
                . When the user clicked a card to navigate away,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  router.replace
                </code>{" "}
                fired concurrently with the Link navigation and canceled it —
                the card detail page never loaded.
              </p>
              <p className="mt-3 text-muted">
                Fixed by guarding the effect with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  usePathname
                </code>
                . If the current path is no longer{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /tcg/pokemon
                </code>
                , the effect returns early and lets the navigation complete.
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
                what did you actually change for the web vitals stuff
              </Received>
              <Received pos="last">
                like what was broken and what did you do
              </Received>

              <Sent pos="first">
                six things shipped across two separate passes
              </Sent>
              <Sent pos="last">
                biggest one first: every dark mode user was seeing a flash on
                every page load
              </Sent>

              <Received>what kind of flash</Received>

              <Sent pos="first">
                light background, then dark background. the whole page. every
                time you navigate or hard reload
              </Sent>
              <Sent pos="middle">
                the root cause is that <code>ThemeProvider</code> sets the{" "}
                <code>data-theme</code> attribute on <code>&lt;html&gt;</code>{" "}
                in a <code>useEffect</code>. that runs after the first paint. so
                the browser paints the page once with light theme CSS, then the
                effect fires, switches to dark, and repaints
              </Sent>
              <Sent pos="last">
                this hurts FCP because there&apos;s a repaint cycle before the
                meaningful content is stable. it also contributes to CLS if any
                element dimensions differ between themes
              </Sent>

              <Received>how did you fix it</Received>

              <Sent pos="first">
                blocking inline script in <code>&lt;head&gt;</code>. runs
                synchronously before CSS parses, before React hydrates, before
                anything
              </Sent>

              <div className={styles.codeBubble}>
                {`(function(){
  try {
    var p = localStorage.getItem('theme-preference') || 'system';
    var t = p === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark' : 'light')
      : p;
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {}
})();`}
              </div>

              <Sent pos="first">
                it reads the stored preference, resolves &apos;system&apos;
                against <code>matchMedia</code>, and sets the attribute. the
                try/catch handles private browsing where{" "}
                <code>localStorage</code> throws
              </Sent>
              <Sent pos="last">
                the <code>useEffect</code> in ThemeProvider still runs but
                it&apos;s now a no-op — the attribute is already the right value
                by the time React touches the DOM
              </Sent>

              <Timestamp>2:09 PM</Timestamp>

              <Received>what else</Received>

              <Sent pos="first">TTFB. two things there</Sent>
              <Sent pos="middle">
                first: fourteen thoughts pages and four fantasy pages had no
                revalidation strategy. Next.js was re-rendering them on every
                request even though their content never changes between deploys
              </Sent>
              <Sent pos="last">
                added <code>export const revalidate = 86400</code> to all
                thoughts pages and <code>3600</code> to the fantasy pages. now
                the CDN serves cached HTML and the origin only rebuilds when the
                interval expires
              </Sent>

              <Received>what about the api routes</Received>

              <Sent pos="first">
                TCG and GraphQL proxy routes already had{" "}
                <code>Cache-Control</code> headers. the only one missing was the
                geo route
              </Sent>
              <Sent pos="middle">
                that route forwards IP geolocation requests to the backend for
                the weather canvas on the landing page. a geo result for a given
                IP doesn&apos;t change mid-session
              </Sent>
              <Sent pos="last">
                added <code>private, max-age=300</code>. private so CDNs
                don&apos;t share results between users, five minutes so the
                browser reuses it within a session
              </Sent>

              <Timestamp>2:18 PM</Timestamp>

              <Received pos="first">
                you mentioned the landing page was the main LCP problem
              </Received>
              <Received pos="last">what was wrong there</Received>

              <Sent pos="first">
                the landing page imported all eleven sections eagerly.
                HeroSection, FeaturesSection, AuthSection, and eight more — all
                in the same initial JS chunk, all hydrating together
              </Sent>
              <Sent pos="middle">
                the LCP element is the H1 in HeroSection. but the browser has to
                download and execute the full bundle — including Framer Motion
                variants for every section, the shader gradient, the canvas
                weather effects — before it can evaluate LCP candidates
              </Sent>
              <Sent pos="last">
                eleven sections competing for that first frame
              </Sent>

              <Received>what did you change</Received>

              <Sent pos="first">
                HeroSection stays as a regular import. the other ten get wrapped
                in <code>next/dynamic</code>
              </Sent>

              <div className={styles.codeBubble}>
                {`// before -- all in the same chunk
import HeroSection from "./landing/HeroSection";
import FeaturesSection from "./landing/FeaturesSection";
import AuthSection from "./landing/AuthSection";
// ... eight more

// after -- only HeroSection is eager
import HeroSection from "./landing/HeroSection";

const FeaturesSection = dynamic(
  () => import("./landing/FeaturesSection"),
  { ssr: true }
);
// ... ten more wrapped the same way`}
              </div>

              <Sent pos="first">
                <code>ssr: true</code> keeps the HTML in the server-rendered
                stream so the sections are still present for SEO and the page
                doesn&apos;t visually pop in
              </Sent>
              <Sent pos="last">
                what changes is the JavaScript. those ten chunks load
                asynchronously after the initial bundle. the hero renders, LCP
                fires, and only then do the below-fold sections hydrate
              </Sent>

              <Timestamp>2:29 PM</Timestamp>

              <Received>what about INP</Received>

              <Sent pos="first">
                INP came from the weather canvas. runs Phong rain simulation,
                260-particle snow, animated fog bands at 60fps on the main
                thread. every click had to wait for the current frame to finish
              </Sent>
              <Sent pos="last">
                two fixes without moving to OffscreenCanvas
              </Sent>

              <Received>what were they</Received>

              <Sent pos="first">
                first: capped the loop at 30fps. it checks the timestamp against
                a 33ms budget and skips frames that arrive too early. halves
                main-thread load — no visible quality drop for a weather effect
              </Sent>
              <Sent pos="last">
                second: <code>scheduler.isInputPending</code>. if the browser
                has queued pointer or keyboard events, skip the frame entirely.
                the browser dispatches the input immediately instead of queuing
                it behind canvas work. Chrome-only but degrades gracefully
              </Sent>

              <Timestamp>2:38 PM</Timestamp>

              <Received>and the hub skeleton thing</Received>

              <Sent pos="first">
                hub was fetching name and email from <code>/api/me</code> on the
                client with no initial data. header showed skeleton bones on
                every authenticated page load
              </Sent>
              <Sent pos="middle">
                <code>page.tsx</code> already calls{" "}
                <code>auth0.getSession()</code> to decide which page to render.
                the name and email are right there in that session object
              </Sent>
              <Sent pos="last">
                extracted them and passed down as <code>initialMe</code>. seeds
                the TanStack Query cache, still refreshes after 5 minutes in the
                background. user name on first paint, no skeleton
              </Sent>

              <Received>anything else</Received>

              <Sent pos="first">
                one bug fix. the pokemon browser syncs search filters to the URL
                in a <code>useEffect</code> via <code>router.replace</code>
              </Sent>
              <Sent pos="middle">
                clicking a card to navigate away would trigger that effect
                concurrently with the Link navigation.{" "}
                <code>router.replace</code> canceled the Link. card detail page
                never loaded
              </Sent>
              <Sent pos="last">
                guarded the effect with <code>usePathname</code>. if the path is
                no longer <code>/tcg/pokemon</code>, early return and let the
                navigation finish
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
