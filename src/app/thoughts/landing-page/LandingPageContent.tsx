"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Sent, Received, Timestamp } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function LandingPageContent() {
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
            Landing Page
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
              Landing Page
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Scroll-driven, section-by-section, zero new dependencies — then extended with a WebGL ShaderGradient hero and interactive mouse parallax.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">

            <section>
              <h2 className="mb-3 text-lg font-bold">Zero-dependency first</h2>
              <p className="text-muted">
                The constraint was no Framer Motion, no GSAP, no animation library. Scroll animations use a <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">useInView</code> hook wrapping <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">IntersectionObserver</code>. The observer is one-shot — once an element becomes visible it disconnects, so animations only fire once. A <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">reveal()</code> helper toggles Tailwind classes between <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">opacity-0 translate-y-8</code> and <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">opacity-100 translate-y-0</code> with a 700ms CSS transition.
              </p>
              <p className="mt-3 text-muted">
                The hero entrance uses pure CSS <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">@keyframes</code> with <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">animation-fill-mode: forwards</code> and staggered <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">animation-delay</code> values. No JS state needed — the elements start at <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">opacity: 0</code> and the animation drives them to their final state.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Server / client split</h2>
              <p className="text-muted">
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">page.tsx</code> is a server component. It calls <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">auth0.getSession()</code> — a local cookie decrypt, no network call — and renders either the hub for logged-in users or <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">{"<LandingContent />"}</code> for everyone else. Same URL, different content, no redirect to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/protected</code>.
              </p>
              <p className="mt-3 text-muted">
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">LandingContent</code> is a thin orchestrator. Each of the six sections is its own component under <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">src/app/landing/</code>, each owning its own scroll observer, markup, and data. Shared utilities like <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">useInView</code>, <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">reveal()</code>, and the <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">Section</code> wrapper live in the same folder.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Theming</h2>
              <p className="text-muted">
                Every color uses the project&apos;s design token system — semantic classes like <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">bg-background</code> and <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">text-foreground</code> resolve to CSS custom properties that swap based on <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">data-theme</code>. Sections that need to be the opposite of the current theme use explicit palette tokens like <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">bg-neutral-950 dark:bg-neutral-100</code>. Feature cards use the <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">group</code> hover pattern — the gradient layer transitions from <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">opacity-0</code> to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">opacity-100</code> on hover. No event handlers, no state — pure CSS.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">ShaderGradient hero</h2>
              <p className="text-muted">
                The hero background is a WebGL water-plane shader with animated waves — a rolling B&W gradient that responds to mouse movement. <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">ShaderGradient</code> accepts <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">cAzimuthAngle</code> and <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">cPolarAngle</code> as live React props. The cursor&apos;s normalized position within the element maps to angle ranges: X to azimuth 180–270, Y to polar 85–125.
              </p>
              <p className="mt-3 text-muted">
                Mouse updates are RAF-throttled — a <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">useRef</code> holds the target angles and a <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">requestAnimationFrame</code> callback writes them to state once per frame. The component is loaded with <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">next/dynamic</code> and <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">ssr: false</code> since WebGL needs a canvas and a window. The fallback is a plain <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">bg-black</code> div — LCP fires on the H1 text immediately while the gradient loads behind it. A <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">bg-black/50</code> scrim between the gradient and the text keeps the white text legible at all camera angles.
              </p>
            </section>

          </div>
        </main>
      ) : (
        <div className="flex justify-center">
          <div className={styles.phone} style={{ minHeight: "calc(100dvh - 56px)" }}>
            <div className={styles.chat}>
              <Timestamp>Today 2:30 PM</Timestamp>

              {/* ---- The brief ---- */}
              <Received pos="first">
                the old landing page was just a heading and a login button
              </Received>
              <Received pos="last">what was the goal with the redesign</Received>

              <Sent pos="first">
                the page needed to serve two purposes — introduce the project to
                anyone who lands on it, and act as a portfolio piece that demonstrates
                real front-end skills
              </Sent>
              <Sent pos="middle">
                i wanted something scroll-driven, section-by-section, similar to how
                Apple does their product pages. each section reveals as you scroll and
                showcases a different part of the project
              </Sent>
              <Sent pos="last">
                the constraint: <strong>zero new dependencies</strong>. no framer
                motion, no GSAP, no animation library.
              </Sent>

              <Timestamp>2:33 PM</Timestamp>

              {/* ---- Architecture ---- */}
              <Received pos="first">how did you structure it</Received>
              <Received pos="last">the whole thing is one big component?</Received>

              <Sent pos="first">
                no — that was a deliberate choice. <code>page.tsx</code> is a{" "}
                <strong>server component</strong>. it calls{" "}
                <code>auth0.getSession()</code> — a local cookie decrypt, no network
                call — and renders either the hub for logged-in users or{" "}
                <code>&lt;LandingContent /&gt;</code> for everyone else. same URL,
                different content
              </Sent>
              <Sent pos="middle">
                that{"'"}s the boundary — server handles auth, client handles
                interactivity. logged-in users never see the landing page, and the
                URL stays clean: no redirect to <code>/protected</code> or anywhere
                else
              </Sent>
              <Sent pos="last">
                then <code>LandingContent</code> itself is just a thin orchestrator.
                each of the 6 sections is its own component under{" "}
                <code>src/app/landing/</code>
              </Sent>

              <div className={styles.codeBubble}>
                {`// page.tsx (server) — renders hub or landing based on session
export default async function Home() {
  const session = await auth0.getSession();
  if (session) return <FeatureHub />;
  return <LandingContent />;
}

// LandingContent.tsx (client)
export default function LandingContent() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <AuthSection />
      <DesignSection />
      <NbaSection />
      <FooterSection />
    </>
  );
}`}
              </div>

              <Received>why split every section into its own file</Received>

              <Sent pos="first">
                readability. a single 500-line component with six sections is hard to
                scan. each file is ~80 lines and self-contained — owns its own scroll
                observer, its own markup, its own data
              </Sent>
              <Sent pos="last">
                shared utilities like <code>useInView</code>, <code>reveal()</code>,
                and the <code>Section</code> wrapper live in their own modules under
                the same <code>landing/</code> folder
              </Sent>

              <Timestamp>2:37 PM</Timestamp>

              {/* ---- Scroll animations ---- */}
              <Received pos="first">talk me through the scroll animations</Received>
              <Received pos="last">how do elements fade in as you scroll</Received>

              <Sent pos="first">
                i wrote a <code>useInView</code> hook that wraps{" "}
                <code>IntersectionObserver</code>. you attach the returned ref to a
                section, and it gives you a boolean that flips to <code>true</code>{" "}
                once 15% of the element is visible
              </Sent>
              <Sent pos="middle">
                it{"'"}s <strong>one-shot</strong> — once triggered, the observer
                disconnects. the animation only fires once, so you don{"'"}t get
                elements flickering in and out as you scroll back up
              </Sent>
              <Sent pos="last">
                then a <code>reveal()</code> helper toggles Tailwind classes between{" "}
                <code>opacity-0 translate-y-8</code> and{" "}
                <code>opacity-100 translate-y-0</code> with a 700ms CSS transition.
                staggered children just add <code>delay-100</code>,{" "}
                <code>delay-200</code>, etc.
              </Sent>

              <div className={styles.codeBubble}>
                {`// useInView.ts — one-shot scroll observer
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(entry.target);
        }
      },
      { threshold },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}`}
              </div>

              <Received>
                why IntersectionObserver instead of a scroll event listener
              </Received>

              <Sent pos="first">
                performance. scroll listeners fire on every frame during scroll — you
                {"'"}d need to throttle or debounce and manually calculate element
                positions with <code>getBoundingClientRect()</code>
              </Sent>
              <Sent pos="last">
                IntersectionObserver is asynchronous and runs off the main thread. the
                browser handles the geometry checks natively. it{"'"}s the right tool
                for {'"'}is this element visible{'"'}
              </Sent>

              <Timestamp>2:41 PM</Timestamp>

              {/* ---- Hero animation choice ---- */}
              <Received>
                the hero section animates on mount, not on scroll — why is that
                different
              </Received>

              <Sent pos="first">
                the hero is the first thing users see. it needs to animate immediately
                on page load, not when you scroll to it — you{"'"}re already looking
                at it
              </Sent>
              <Sent pos="middle">
                initially i used <code>useState</code> + <code>useEffect</code> to
                flip a <code>mounted</code> flag. but React{"'"}s linter flagged
                calling <code>setState</code> synchronously inside an effect — it
                causes a cascading re-render
              </Sent>
              <Sent pos="last">
                the fix: pure CSS <code>@keyframes</code>. the elements start at{" "}
                <code>opacity: 0; translate-y: 8</code> and the animation runs{" "}
                <code>forwards</code> to the final state. staggered delays are set
                with <code>[animation-delay:100ms]</code> etc. no JS needed
              </Sent>

              <div className={styles.codeBubble}>
                {`/* CSS-only hero entrance */
@keyframes hero-fade-in {
  to { opacity: 1; transform: translateY(0); }
}

/* applied via Tailwind arbitrary value */
className="opacity-0 translate-y-8
  animate-[hero-fade-in_0.7s_ease-out_forwards]
  [animation-delay:100ms]"`}
              </div>

              <Timestamp>2:44 PM</Timestamp>

              {/* ---- Design tokens ---- */}
              <Received pos="first">
                how does the theming work across all the sections
              </Received>
              <Received pos="last">some sections are dark, some are light</Received>

              <Sent pos="first">
                every color in the page uses the project{"'"}s design token system.
                semantic classes like <code>bg-background</code>,{" "}
                <code>text-foreground</code>, <code>bg-surface</code> resolve to CSS
                custom properties that swap based on <code>data-theme</code>
              </Sent>
              <Sent pos="middle">
                for sections that need to be the opposite of the current theme — like
                the {'"'}What I Built{'"'} section — i used explicit palette tokens:{" "}
                <code>bg-neutral-950 dark:bg-neutral-100</code>. this guarantees it
                {"'"}s dark in light mode and light in dark mode
              </Sent>
              <Sent pos="last">
                other sections use gradient backgrounds with primary/secondary palette
                tokens. the NBA section uses{" "}
                <code>from-secondary-600 to-primary-700</code> with dark mode
                overrides. each section feels distinct but the palette stays cohesive
              </Sent>

              <Timestamp>2:47 PM</Timestamp>

              {/* ---- Hover effects ---- */}
              <Received>
                the feature cards have a hover effect — how does that work without JS
              </Received>

              <Sent pos="first">
                Tailwind{"'"}s <code>group</code> pattern. the card is the group
                container, and an inner div acts as the hover background layer
              </Sent>
              <Sent pos="last">
                on hover, the gradient layer transitions from <code>opacity-0</code>{" "}
                to <code>opacity-100</code> with <code>group-hover:opacity-100</code>.
                the content sits above it with <code>relative z-10</code>. no event
                handlers, no state — pure CSS
              </Sent>

              {/* ---- Button glow ---- */}
              <Received>and the glowing login button</Received>

              <Sent pos="first">
                a <code>@keyframes glow-pulse</code> that animates{" "}
                <code>box-shadow</code> between 8px and 24px spread using the primary
                color token
              </Sent>
              <Sent pos="last">
                the tricky part: the button also has the hero entrance animation. CSS
                lets you stack multiple animations on one element with commas — the
                fade-in runs once with <code>forwards</code>, then the glow loops{" "}
                <code>infinite</code> starting after a 1.2s delay so it doesn{"'"}t
                pulse before the button is visible
              </Sent>

              <Timestamp>2:50 PM</Timestamp>

              {/* ---- Mobile ---- */}
              <Received pos="first">what about mobile</Received>
              <Received pos="last">the auth section had overflow issues</Received>

              <Sent pos="first">
                the main layout is full-width sections with content capped at{" "}
                <code>max-w-[1000px]</code> and <code>px-6</code> padding. cards use{" "}
                <code>md:grid-cols-3</code> so they stack to single column on mobile
              </Sent>
              <Sent pos="middle">
                the auth section had a code snippet that overflowed on narrow screens.
                two fixes: changed <code>overflow-hidden</code> to{" "}
                <code>overflow-x-auto</code> so the code block scrolls horizontally,
                and added <code>min-w-0</code> on the grid child to prevent it from
                blowing out of its column
              </Sent>
              <Sent pos="last">
                also reduced font size to <code>text-xs</code> on mobile with{" "}
                <code>sm:text-sm</code> breakpoint. small details but they{"'"}re the
                difference between {'"'}looks polished{'"'} and {'"'}looks broken on
                my phone{'"'}
              </Sent>

              <Timestamp>2:53 PM</Timestamp>

              {/* ---- Trade-offs ---- */}
              <Received>any trade-offs with this approach</Received>

              <Sent pos="first">
                the <code>&lt;style&gt;</code> tag for keyframes is inline in the
                component. ideally those would live in the global CSS, but for two
                small keyframes scoped to the landing page it{"'"}s fine — keeps them
                co-located with the component that uses them
              </Sent>
              <Sent pos="middle">
                the scroll animations are one-shot, so if you scroll past a section
                quickly you might miss the entrance. that{"'"}s intentional — replay
                animations on every scroll feel janky. once is enough
              </Sent>
              <Sent pos="last">
                and the page is 100% client-rendered (below the auth check). for a
                marketing-style landing page you{"'"}d normally want SSR for SEO. but
                this is a portfolio project, not a product page — the scroll
                interactivity matters more than crawler indexability here
              </Sent>

              <Timestamp>2:56 PM</Timestamp>

              {/* ---- Improvements ---- */}
              <Received>anything you{"'"}d improve</Received>

              <Sent pos="first">
                could add <code>prefers-reduced-motion</code> support — disable
                animations for users who{"'"}ve opted out in their OS settings
              </Sent>
              <Sent pos="middle">
                could lazy-load the heavier sections with <code>Suspense</code> +{" "}
                <code>dynamic()</code> so the initial JS bundle is smaller
              </Sent>
              <Sent pos="last">
                could also add parallax to the decorative blurred circles in the hero
                for depth. but every effect you add is complexity to maintain — ship
                the simplest version that looks good and iterate from feedback
              </Sent>

              <Received>clean work</Received>

              <Sent>
                that{"'"}s the approach — zero dependencies, semantic tokens,
                IntersectionObserver for scroll, CSS keyframes for mount. let the
                platform do the work
              </Sent>

              <Timestamp>3:10 PM</Timestamp>

              <Received pos="first">wait you said you wanted parallax on the hero blobs</Received>
              <Received pos="last">did you ever add that</Received>

              <Sent pos="first">
                went further. replaced the particle network with a ShaderGradient — a
                WebGL water-plane shader with animated waves. the hero background is now
                a rolling B&W gradient that responds to mouse movement
              </Sent>
              <Sent pos="last">
                move the mouse and the light source shifts with your cursor. the camera
                azimuth maps to horizontal movement, polar angle to vertical. feels like
                the surface is reacting to where you{"'"}re looking
              </Sent>

              <Received>how does the mouse parallax actually work</Received>

              <Sent pos="first">
                ShaderGradient accepts <code>cAzimuthAngle</code> and{" "}
                <code>cPolarAngle</code> as live React props — they control the camera
                orbit around the gradient surface. update those props and the library
                smoothly repositions the view
              </Sent>
              <Sent pos="middle">
                <code>onMouseMove</code> fires on the hero section. the cursor{"'"}s
                normalized position within the element maps to angle ranges: X to
                azimuth 180–270, Y to polar 85–125. so moving left to right sweeps the
                camera 90 degrees around the surface
              </Sent>
              <Sent pos="last">
                updates are RAF-throttled — a <code>useRef</code> holds the target
                angles and a <code>requestAnimationFrame</code> callback writes them to
                state once per frame. <code>smoothTime={"{0.18}"}</code> on the
                ShaderGradient handles the easing so it{"'"}s not jittery
              </Sent>

              <div className={styles.codeBubble}>
                {`// RAF-throttled mouse handler — one setState per frame
const handleMouseMove = useCallback((e) => {
  const { left, top, width, height } =
    e.currentTarget.getBoundingClientRect();
  const nx = (e.clientX - left) / width;
  const ny = (e.clientY - top) / height;
  azimuthRef.current = 180 + nx * 90;
  polarRef.current   = 85  + ny * 40;

  if (rafRef.current === null) {
    rafRef.current = requestAnimationFrame(() => {
      setCameraAngles({ azimuth: azimuthRef.current,
                        polar: polarRef.current });
      rafRef.current = null;
    });
  }
}, []);`}
              </div>

              <Received>Three.js in a Next.js hero — how does that work without SSR exploding</Received>

              <Sent pos="first">
                <code>next/dynamic</code> with <code>ssr: false</code>. ShaderGradient
                needs a canvas and a window — neither exist on the server. the dynamic
                import keeps WebGL completely out of the server render
              </Sent>
              <Sent pos="last">
                the fallback is a plain <code>bg-black</code> div, so LCP fires on the
                H1 text immediately — the gradient loads in behind it without blocking
                the first paint
              </Sent>

              <Timestamp>3:22 PM</Timestamp>

              <Received>what about the text being unreadable over the bright gradient</Received>

              <Sent pos="first">
                there{"'"}s a <code>bg-black/50</code> scrim between the gradient and
                the text — <code>absolute inset-0 z-[1]</code>. the gradient shows
                through at half opacity, the white text stays legible
              </Sent>
              <Sent pos="last">
                the text and button are <code>relative z-10</code>, above the scrim.
                the scrim sits above the gradient at <code>z-[1]</code>. pointer events
                on the canvas are disabled so clicks still reach the UI elements
              </Sent>

              <Received>would you add anything to it</Received>

              <Sent pos="first">
                could widen the angle sweep for more dramatic movement. right now it{"'"}s
                90 degrees of azimuth — you could go 180 for a full half-orbit across
                one mouse swipe
              </Sent>
              <Sent pos="last">
                <code>prefers-reduced-motion</code> check would be good too — lock the
                camera to the default angles and skip the mouse handler entirely when
                the user has reduced motion on. the gradient animation itself should
                also pause in that case
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
