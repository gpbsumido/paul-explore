import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

export default function WebVitalsContent() {
  return (
    <div className={styles.phone}>
      {/* ---- Top bar ---- */}
      <div className={styles.topBar}>
        <Link href="/protected" className={styles.backLink}>
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path
              d="M9 1L2 8l7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          &nbsp;Back
        </Link>
        <div className={styles.contactInfo}>
          <span className={styles.contactName}>Web Vitals</span>
          <span className={styles.contactSub}>iMessage</span>
        </div>
        <div className={styles.themeBtn}>
          <ThemeToggle />
        </div>
      </div>

      {/* ---- Chat ---- */}
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
          dashboard at <code>/protected/vitals</code> aggregates that into P75
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
          <code>cache: &quot;no-store&quot;</code> on both fetches so the
          numbers are always live when you open the page — vitals data should
          never be served stale from a CDN
        </Sent>

        <div className={styles.codeBubble}>
          {`// both aggregations in one server render
const [summaryRes, byPageRes] = await Promise.all([
  fetch(\`\${API_URL}/api/vitals/summary\`, {
    headers, cache: "no-store"
  }),
  fetch(\`\${API_URL}/api/vitals/by-page\`, {
    headers, cache: "no-store"
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
          the landing page was calling <code>auth0.getSession()</code> on every
          request — just to redirect logged-in users to the hub. that one line
          makes Next.js treat the page as dynamic, which means a fresh server
          render on every request instead of serving a cached static file
        </Sent>
        <Sent pos="middle">
          the fix: move the redirect to the middleware. middleware already runs
          on every request anyway, so the session check isn&apos;t extra work —
          it just moved. with that call out of the page component, Next.js can
          statically pre-render the landing page at build time and serve the
          same HTML file to every visitor
        </Sent>
        <Sent pos="last">
          the page itself is pure static content — no per-request data, no user
          state. it never needed to be dynamic. the pattern applies anywhere you
          call <code>getSession()</code> only for a redirect: that belongs in
          middleware, not in the page
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

        {/* Typing indicator */}
        <div className={styles.typingDots}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
