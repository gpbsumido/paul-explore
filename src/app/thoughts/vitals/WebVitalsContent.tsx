"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function WebVitalsContent() {
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
            Web Vitals
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
              Web Vitals
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              A self-hosted vitals pipeline that collects real-user data from every page and aggregates it into P75 scores — built because owning the data matters more than reading a third-party dashboard.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">

            <section>
              <h2 className="mb-3 text-lg font-bold">Why custom over Vercel Speed Insights</h2>
              <p className="text-muted">
                Vercel Speed Insights is still in the app — it feeds into their dashboard and that&apos;s useful. But the data lives there, in their UI, not mine. Self-hosted means the data can be queried any way needed, displayed inside the app itself on the protected hub, and extended with version filtering or custom aggregations. Building the pipeline is also the more interesting part: knowing what <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">sendBeacon</code> does and why, how to store and aggregate percentile data in Postgres, how to wire a collection client to a backend — that&apos;s the stuff worth knowing as a developer.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">The collection pipeline</h2>
              <p className="text-muted">
                The <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">web-vitals</code> npm package hooks into browser APIs to detect each metric at the right time and fires a callback with the name, value, and a rating. A <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">WebVitalsReporter</code> client component in the root layout registers all five collectors once on mount and sends each metric to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/api/vitals</code>. That Next.js route validates the shape and forwards it to the Express backend, which inserts one row per metric event into a <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">web_vitals</code> Postgres table.
              </p>
              <p className="mt-3 text-muted">
                Each beacon uses <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">navigator.sendBeacon</code> wrapped in a <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">Blob</code> with explicit <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">application/json</code> content type. Regular fetch gets killed when the browser tears down the page — INP and CLS fire on page hide, which is exactly when a regular fetch would be cancelled. The Blob wrapper forces the content type that Express&apos;s JSON parser expects; sendBeacon defaults to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">text/plain</code> otherwise.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">The five metrics</h2>
              <ul className="mt-2 space-y-2 text-muted">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span><strong className="text-foreground">LCP</strong> — Largest Contentful Paint. How long until the biggest element is visible. Good under 2.5s. The main perceived load speed metric.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span><strong className="text-foreground">FCP</strong> — First Contentful Paint. Time until any content shows up at all. Good under 1.8s.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span><strong className="text-foreground">INP</strong> — Interaction to Next Paint. How quickly the page responds to clicks, taps, and key presses. Replaced FID in 2024. Good under 200ms.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span><strong className="text-foreground">CLS</strong> — Cumulative Layout Shift. A score for how much content jumps around while the page loads. Under 0.1 is good.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span><strong className="text-foreground">TTFB</strong> — Time to First Byte. How long the browser waits for the server to start sending a response. Good under 800ms.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">P75 over average</h2>
              <p className="text-muted">
                Averages hide the tail. If 90% of page loads take 1.2s and 10% take 8s, the average might look fine at 1.9s. P75 means 75% of users had a load time at or below that number — sensitive enough to catch real problems without being dominated by a single extreme outlier. Google uses P75 for the official Core Web Vitals thresholds in search ranking. The by-page table filters to pages with at least 5 samples — one data point isn&apos;t a distribution.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What improved each metric</h2>
              <p className="text-muted">
                <strong>INP</strong> improved by replacing <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">transition-all</code> with explicit property lists across the codebase and wrapping the hub&apos;s mount animation update in <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">startTransition</code>. <strong>LCP</strong> on the hub improved by removing the <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">reveal()</code> wrapper from the H1 heading — browsers exclude <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">opacity: 0</code> elements from LCP consideration entirely. <strong>TTFB</strong> on the hub improved by making <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">page.tsx</code> a plain sync component with no auth calls, so Next.js can statically pre-render it — TTFB drops from ~2.1s to ~50ms. <strong>CLS</strong> on the vitals page improved by extracting a <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">CHART_CONTAINER_HEIGHT</code> constant shared by both the skeleton div and the real chart wrapper so they reserve the same space.
              </p>
            </section>

          </div>
        </main>
      ) : (
        <div className="flex justify-center">
          <div className={styles.phone} style={{ minHeight: "calc(100dvh - 56px)" }}>
            <div className={styles.chat}>
              <Timestamp>Today 9:00 AM</Timestamp>

              <Received pos="first">what&apos;s the web vitals dashboard</Received>
              <Received pos="last">is that like Lighthouse?</Received>

              <Sent pos="first">
                sort of, but opposite — Lighthouse runs in a controlled lab
                environment on a simulated device. the dashboard shows data from real
                users on real connections
              </Sent>
              <Sent pos="middle">
                there&apos;s a collector running on every page that reports the five
                Core Web Vitals back to my Postgres DB whenever someone visits. the
                dashboard at <code>/vitals</code> aggregates that into P75
                scores per metric and per page
              </Sent>
              <Sent pos="last">
                so if somebody loads the calendar on a slow 4G connection in another
                country, that shows up in the numbers. Lighthouse wouldn&apos;t catch
                that
              </Sent>

              <Timestamp>9:03 AM</Timestamp>

              <Received>what are the five metrics</Received>

              <Sent pos="first">
                LCP — Largest Contentful Paint. how long until the biggest element on
                the page is visible. good is under 2.5s. this is the main perceived
                load speed metric
              </Sent>
              <Sent pos="middle">
                FCP — First Contentful Paint. time until any content shows up at all.
                good is under 1.8s
              </Sent>
              <Sent pos="middle">
                INP — Interaction to Next Paint. measures how quickly the page
                responds to clicks, taps, and key presses. replaced FID in 2024 as the
                official interactivity metric. good is under 200ms
              </Sent>
              <Sent pos="middle">
                CLS — Cumulative Layout Shift. a score for how much content jumps
                around while the page loads. score of 0 is perfect, under 0.1 is good.
                the one that makes you click the wrong button because the page shifted
              </Sent>
              <Sent pos="last">
                TTFB — Time to First Byte. how long the browser waits for the server
                to start sending a response. good is under 800ms. a high TTFB usually
                means something slow is happening server-side before any HTML arrives
              </Sent>

              <Timestamp>9:11 AM</Timestamp>

              <Received pos="first">wait, Vercel already has Speed Insights</Received>
              <Received pos="last">why build your own?</Received>

              <Sent pos="first">
                a few reasons. Vercel Speed Insights is still in the app — it feeds
                into their dashboard and that&apos;s useful. but the data lives there,
                in their UI, not mine
              </Sent>
              <Sent pos="middle">
                if I want to display vitals inside the app itself — like on the
                protected hub — I need to own the data. self-hosted means I can query
                it any way I want
              </Sent>
              <Sent pos="last">
                and honestly, building the pipeline is the more interesting part.
                knowing what sendBeacon does and why, how to store and aggregate
                percentile data in Postgres, how to wire a collection client to a
                backend — that&apos;s the stuff that&apos;s worth knowing as a
                developer
              </Sent>

              <Received>how does the pipeline actually work</Received>

              <Sent pos="first">
                the <code>web-vitals</code> npm package is the same one Vercel uses
                under the hood. it hooks into browser APIs to detect each metric at
                the right time and fires a callback with the name, value, and a rating
              </Sent>
              <Sent pos="middle">
                <code>WebVitalsReporter</code> is a client component in the root
                layout. it registers all five collectors once on mount and sends each
                metric to <code>/api/vitals</code> when it fires. that&apos;s a
                Next.js route that validates the shape and forwards it to the Express
                backend
              </Sent>
              <Sent pos="last">
                the backend inserts one row per metric event into a{" "}
                <code>web_vitals</code> Postgres table. no fancy streaming or queues —
                at portfolio traffic levels a straight insert is fine
              </Sent>

              <div className={styles.codeBubble}>
                {`web-vitals
  → WebVitalsReporter (root layout)
  → POST /api/vitals (Next.js proxy)
  → POST /api/vitals (Express)
  → INSERT INTO web_vitals`}
              </div>

              <Timestamp>9:19 AM</Timestamp>

              <Received>why sendBeacon instead of a regular fetch</Received>

              <Sent pos="first">
                reliability. a regular fetch can get cancelled mid-flight when the
                browser tears down the page — navigation, tab close, reload. the
                request just disappears
              </Sent>
              <Sent pos="middle">
                <code>navigator.sendBeacon</code> queues the request at the browser
                level and guarantees it goes out even after the page is gone. it was
                designed specifically for analytics and metrics use cases
              </Sent>
              <Sent pos="last">
                the one catch: sendBeacon sends as <code>text/plain</code> by default,
                which the Express JSON parser won&apos;t read. you need to wrap the
                body in a <code>Blob</code> with an explicit{" "}
                <code>application/json</code> content type — otherwise the payload
                arrives as an unparsed string
              </Sent>

              <div className={styles.codeBubble}>
                {`// Blob forces application/json content-type
// so Express's json() middleware can parse it
navigator.sendBeacon(
  "/api/vitals",
  new Blob([JSON.stringify(payload)], {
    type: "application/json",
  })
);`}
              </div>

              <Timestamp>9:27 AM</Timestamp>

              <Received>when do the individual metrics actually fire</Received>

              <Sent pos="first">
                LCP and FCP fire shortly after the page loads — once the browser has
                painted the relevant content. LCP waits until the element is stable
                (no more candidates) or the user interacts, whichever comes first
              </Sent>
              <Sent pos="middle">
                TTFB fires almost immediately — as soon as the first byte of the
                response arrives
              </Sent>
              <Sent pos="middle">
                INP and CLS are different — they accumulate over the whole page
                session and fire when the page is hidden (tab switch, navigation,
                close). INP reports the worst single interaction, CLS reports the
                total shift score
              </Sent>
              <Sent pos="last">
                this is why sendBeacon matters. if a user clicks a link and
                immediately navigates away, INP and CLS haven&apos;t fired yet — they
                fire on the page hide event, which is exactly when a regular fetch
                would get killed
              </Sent>

              <Timestamp>9:35 AM</Timestamp>

              <Received>why P75 and not the average</Received>

              <Sent pos="first">
                averages hide the tail. if 90% of page loads take 1.2s and 10% take
                8s, the average might look fine at 1.9s. but that 10% of users had a
                bad time
              </Sent>
              <Sent pos="middle">
                P75 means 75% of your users had a load time at or below that number.
                it&apos;s sensitive enough to catch real problems without being
                dominated by a single extreme outlier
              </Sent>
              <Sent pos="last">
                Google uses P75 for the official CWV thresholds in search ranking — so
                it&apos;s also the right metric to optimize against if you care about
                SEO
              </Sent>

              <Received>
                what&apos;s the 5-sample minimum in the by-page table
              </Received>

              <Sent pos="first">
                noise control. if I visit the calendar once, that&apos;s one LCP
                sample. it gets shown as the P75 for the calendar, which is
                technically accurate but completely meaningless — one data point
                isn&apos;t a distribution
              </Sent>
              <Sent pos="last">
                5 samples is a low bar but it&apos;s enough to filter out single-visit
                artifacts. with real traffic you&apos;d want more — 50+, 100+ — but
                for a portfolio site 5 is a reasonable start
              </Sent>

              <Timestamp>9:43 AM</Timestamp>

              <Received>how does the dashboard read the data</Received>

              <Sent pos="first">
                same BFF pattern as the calendar. <code>page.tsx</code> is a server
                component — it calls <code>auth0.getAccessToken()</code> to get a JWT,
                then fetches <code>/api/vitals/summary</code> and{" "}
                <code>/api/vitals/by-page</code> from the Express backend in parallel
                with <code>Promise.all</code>
              </Sent>
              <Sent pos="middle">
                the token never touches the browser. the backend verifies it with the
                same <code>checkJwt</code> middleware as every other protected route
              </Sent>
              <Sent pos="last">
                the summary and by-page fetches use{" "}
                <code>next: {`{ revalidate: 60 }`}</code> instead of{" "}
                <code>no-store</code>. aggregate vitals data doesn&apos;t change
                on every request, it changes when new rows come in. 60 seconds is
                fresh enough and saves a backend round trip for anyone who refreshes
                within the same minute. versions and by-version stay as{" "}
                <code>no-store</code> since those need to reflect a freshly deployed
                version immediately
              </Sent>

              <div className={styles.codeBubble}>
                {`// summary and by-page cached for 60s each
const [summaryRes, byPageRes] = await Promise.all([
  fetch(\`\${API_URL}/api/vitals/summary\`, {
    headers,
    next: { revalidate: 60 },
  }),
  fetch(\`\${API_URL}/api/vitals/by-page\`, {
    headers,
    next: { revalidate: 60 },
  }),
]);`}
              </div>

              <Timestamp>9:51 AM</Timestamp>

              <Received>what would you improve</Received>

              <Sent pos="first">
                version filtering is in now — each beacon includes the{" "}
                <code>app_version</code> from <code>package.json</code>, baked into
                the bundle at build time. the dashboard nav has a dropdown that filters
                all aggregates to &quot;from version X onwards&quot; so you can see
                whether a specific deploy actually moved the numbers
              </Sent>
              <Sent pos="middle">
                there&apos;s also a trend chart now using unovis — one sparkline per
                metric showing P75 across the last 5 versions. line color follows the
                Good/Poor thresholds so you can tell at a glance if things are going
                the right direction
              </Sent>
              <Sent pos="last">
                still want: device and connection breakdown (the{" "}
                <code>web-vitals</code> package gives <code>navigationType</code> but
                not device category or effective connection type — you&apos;d need the
                Network Information API for that), and alert thresholds so a bad P75
                actually notifies you instead of waiting for someone to open the
                dashboard
              </Sent>

              <Received>what does building this show as a dev</Received>

              <Sent pos="first">
                that I think about how code performs in the field, not just in a dev
                environment. Lighthouse scores are a starting point, not the answer.
                real users on real devices with real network conditions are the answer
              </Sent>
              <Sent pos="middle">
                and that I can instrument a full observability pipeline — collection,
                transport, storage, aggregation, display — without reaching for a
                third-party service for every piece. each part of this is standard
                browser and backend technology wired together
              </Sent>
              <Sent pos="last">
                the data pipeline here is the same shape as any event analytics
                system. knowing how to build it for web vitals means you can adapt it
                for custom business events, error tracking, or feature usage metrics
                with minimal changes
              </Sent>

              <Received>that tracks</Received>

              <Sent>
                yeah — and selfishly it&apos;s useful for the site itself. I can
                actually see whether the ISR caching, streaming SSR, and next/dynamic
                lazy loading are making a measurable difference to real users, not
                just green numbers on a report. the version filter makes that
                concrete: pick the version where streaming SSR shipped and see if LCP
                dropped
              </Sent>

              <Timestamp>10:05 AM</Timestamp>

              <Received>you mentioned INP is under 200ms. how do you keep that low</Received>

              <Sent pos="first">
                two things. the obvious one: don&apos;t do expensive work on
                interaction. but the subtler one is CSS — <code>transition-all</code>{" "}
                tells the browser to watch every CSS property for changes on every
                animation frame. even if only opacity changes, the browser still has
                to check border, padding, font-size, everything, every frame
              </Sent>
              <Sent pos="middle">
                I replaced all <code>transition-all</code> with explicit property
                lists. entrance animations use{" "}
                <code>transition-[opacity,transform]</code>, hover effects use{" "}
                <code>transition-[border-color,box-shadow]</code>. the browser only
                watches what actually changes, which cuts the work per frame
                significantly on a page with 15+ animated cards
              </Sent>
              <Sent pos="last">
                the other fix is <code>startTransition</code>. when the hub page
                mounts, setting the &quot;loaded&quot; flag kicks off staggered
                animations across 7 feature cards. wrapping that state update in{" "}
                <code>startTransition</code> marks it as non-urgent — React processes
                any pending input events first before repainting all those cards. same
                pattern in the version selector: <code>router.push()</code> in a
                transition so selecting a different version doesn&apos;t block
                whatever the user was doing
              </Sent>

              <Timestamp>10:17 AM</Timestamp>

              <Received>what about TTFB for the landing page</Received>

              <Sent pos="first">
                the root page now calls <code>auth0.getSession()</code> to branch on
                auth state — logged-in users see the hub, everyone else sees the
                landing page. that makes it dynamic, so it can&apos;t be statically
                pre-rendered anymore
              </Sent>
              <Sent pos="middle">
                the trade-off is acceptable because <code>auth0.getSession()</code>
                is a local cookie decrypt — no network call, just CPU work. the cost
                is microseconds. for a personal portfolio, clean URLs are worth more
                than static generation on the root route
              </Sent>
              <Sent pos="last">
                previously the fix was to move the session check to middleware and
                keep the page static. that worked well when the landing page and hub
                were at separate URLs. once they share the same route, the page has
                to decide which to render — so it has to read the session directly
              </Sent>

              <Timestamp>10:25 AM</Timestamp>

              <Received>what about /protected — that page had bad TTFB too</Received>

              <Sent pos="first">
                same root cause. the page component was calling{" "}
                <code>auth0.getSession()</code> to get the user&apos;s name and email
                to pass down to <code>FeatureHub</code>. that one call makes Next.js
                treat the route as dynamic, so every visit hit a cold serverless
                function with a 1.5–3s startup penalty
              </Sent>
              <Sent pos="middle">
                the fix: make <code>page.tsx</code> a plain sync component with no
                auth calls. Next.js can now statically pre-render it at build time and
                Vercel serves the HTML from CDN edge — TTFB drops from around 2.1s to
                roughly 50ms
              </Sent>
              <Sent pos="last">
                user info (name, email) moves to a small <code>GET /api/me</code> BFF
                route. <code>FeatureHub</code> fetches it on mount and shows skeleton
                bones in the header while in-flight. the cookie decrypt server-side is
                fast — even with network round-trip the user details fill in well
                after first paint, so FCP and LCP are unaffected
              </Sent>

              <div className={styles.codeBubble}>
                {`// page.tsx — plain sync component, no auth, statically pre-rendered
export default function Protected() {
  return <FeatureHub />;
}

// FeatureHub.tsx — fetches user info after the page is already painted
useEffect(() => {
  fetch("/api/me")
    .then((r) => r.json())
    .then(({ name, email }) => {
      setUserName(name ?? "there");
      setUserEmail(email ?? undefined);
    });
}, []);`}
              </div>

              <Timestamp>10:29 AM</Timestamp>

              <Received>what about LCP on /protected, that was bad too</Received>

              <Sent pos="first">
                the entrance animations. the hub page uses a{" "}
                <code>reveal()</code> helper that starts elements at{" "}
                <code>opacity-0 translate-y-8</code> and fades them in after
                hydration. the H1 heading was wrapped in it, same as the cards
              </Sent>
              <Sent pos="middle">
                the problem: browsers exclude <code>opacity: 0</code> elements
                from LCP consideration entirely. the H1 is the biggest text element
                on the page, but it doesn&apos;t count until it becomes visible.
                so LCP was measured after hydration, plus a 700ms CSS transition,
                plus whatever bundle parse time took. easily 2.5s+
              </Sent>
              <Sent pos="last">
                fix was simple: remove the <code>reveal()</code> wrapper from the
                heading div so the H1 is visible in the SSR HTML on first paint.
                cards still animate because they&apos;re below the heading and
                aren&apos;t the LCP element. also swapped the inline skeleton span
                for the loading name state to just say &quot;there&quot; — the
                skeleton span was a minor CLS source when the real name arrived and
                changed the H1&apos;s layout
              </Sent>

              <Timestamp>10:33 AM</Timestamp>

              <Received>
                what about TTFB on the vitals dashboard itself, that page was slow
                too
              </Received>

              <Sent pos="first">
                yeah, that one was a fetch waterfall I introduced. the page needed to
                default to the latest version, so it fetched versions and byVersion
                first, then started the main vitals fetch once those resolved. two
                sequential backend round trips before any HTML could go out
              </Sent>
              <Sent pos="middle">
                the fix was to decouple the data from the version default. pass the
                URL param directly to <code>fetchVitals</code>, undefined if
                there&apos;s no param in the URL. that gives all-time aggregates.
                then all three fetches go into one <code>Promise.all</code> and{" "}
                <code>selectedVersion</code> is derived from the versions result
                after everything resolves
              </Sent>
              <Sent pos="last">
                small trade-off: on first load with no URL param the data is
                technically all-time aggregates, not filtered to the latest version.
                but the dropdown shows the latest version selected so the next pick
                filters correctly. one backend round trip saved on every page load is
                worth that
              </Sent>

              <div className={styles.codeBubble}>
                {`// before: two round trips
const [versions, byVersion] = await Promise.all([...]);
const { summary, byPage } = await fetchVitals(token, versions[0]);

// after: one parallel round trip
const [versions, byVersion, { summary, byPage }] = await Promise.all([
  fetchVersions(token),
  fetchByVersion(token),
  fetchVitals(token, urlVersion), // undefined = all-time aggregates
]);
const selectedVersion = urlVersion ?? versions[0];`}
              </div>

              <Timestamp>10:38 AM</Timestamp>

              <Received>
                what about CLS on the vitals page, that was bad too
              </Received>

              <Sent pos="first">
                the chart skeleton. unovis can&apos;t render server-side so the page
                shows a skeleton grid while hydrating, then swaps in the real charts.
                the skeleton used <code>h-20</code> (80px) for each chart area
              </Sent>
              <Sent pos="middle">
                the real chart uses <code>VisXYContainer height=&#123;80&#125;</code>
                for the plot area, but also includes <code>VisAxis type=&quot;x&quot;</code>{" "}
                which renders version tick labels below that 80px boundary. actual
                rendered height is around 100px. all five metric charts swapping
                simultaneously added about 20px of shift each
              </Sent>
              <Sent pos="last">
                fix: extract <code>CHART_AREA_HEIGHT = 80</code> and{" "}
                <code>CHART_CONTAINER_HEIGHT = CHART_AREA_HEIGHT + 20</code> at the
                top of the file. both the skeleton div and the real chart wrapper use{" "}
                <code>CHART_CONTAINER_HEIGHT</code> so they reserve the same space.
                future height changes only need to happen in one place
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
