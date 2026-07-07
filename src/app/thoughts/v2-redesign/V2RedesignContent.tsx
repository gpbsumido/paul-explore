"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Sent, Received, Timestamp } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function V2RedesignContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "V2 Redesign" }]}
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
              V2 Redesign
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              URL-based version routing, bundle splitting with next/dynamic, and
              a clean slate for v2 without touching a single line of v1 code.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">The problem</h2>
              <p className="text-muted">
                The landing page and feature hub depend on Three.js, R3F, drei,
                shader-gradient, and WeatherCanvas. That&apos;s a lot of JS for
                users who just want to see what&apos;s here. Redesigning in
                place means either maintaining two code paths in the same files
                or doing a risky big-bang swap. Neither is great.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Version routing via searchParams
              </h2>
              <p className="text-muted">
                The solution is a URL parameter:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ?version=v1
                </code>{" "}
                serves the original experience, and the default path (no param
                or any other value) serves v2. The server component reads{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  searchParams.version
                </code>{" "}
                from the page props and branches on it. No middleware, no
                cookies, no feature flags -- just a query string that anyone can
                type.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Bundle splitting</h2>
              <p className="text-muted">
                The v1 components (LandingContent and FeatureHub) are wrapped in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  next/dynamic
                </code>
                . That means their heavy dependencies -- Three.js, R3F,
                shader-gradient, WeatherCanvas -- are split into separate chunks
                that only load when the URL includes{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ?version=v1
                </code>
                . The v2 components are statically imported because they&apos;re
                lightweight -- no 3D dependencies to defer.
              </p>
              <p className="mt-3 text-muted">
                This is the key win: the default path ships zero Three.js bytes.
                Users who want the original experience can still get it, and the
                bundle cost only hits when they ask for it.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Why not a feature flag or cookie
              </h2>
              <p className="text-muted">
                A URL parameter is transparent and shareable. You can send
                someone a link to the v1 experience and they see exactly what
                you see. Cookies are invisible and sticky -- they create
                debugging nightmares where &quot;it works for me&quot; is
                literally true because your cookie state differs. Feature flags
                add infrastructure (a provider, an API call, a dashboard) for
                what is fundamentally a two-value switch.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Zero changes to v1</h2>
              <p className="text-muted">
                LandingContent.tsx and FeatureHub.tsx are completely untouched.
                They still work exactly as before -- they&apos;re just loaded
                through{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  next/dynamic
                </code>{" "}
                instead of a static import. The v2 components live in their own{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  src/app/v2/
                </code>{" "}
                directory. No shared state, no conditional rendering within
                components, no risk of a v2 change breaking v1.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">NavBar</h2>
              <p className="text-muted">
                The v2 nav is a fixed bar that starts fully transparent and
                picks up a frosted-glass treatment (
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  backdrop-blur-xl bg-background/80
                </code>
                ) once you scroll past 50px. A scroll listener flips a boolean
                in state and the background change runs through{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  transition-all duration-300
                </code>
                .
              </p>
              <p className="mt-3 text-muted">
                The right side is auth-aware: unauthenticated users see a
                &quot;Log in&quot; link pointing at{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /auth/login
                </code>
                , authenticated users see a settings gear linking to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /settings
                </code>
                . The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  authenticated
                </code>{" "}
                prop is a boolean passed from the server component that already
                has the session -- no client-side auth check needed.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">HeroSection</h2>
              <p className="text-muted">
                The v2 hero replaces the Three.js globe and ShaderGradient with
                a CSS-only ambient gradient -- two overlapping radial gradients
                (violet and blue tints) on a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  background-size: 400% 400%
                </code>{" "}
                canvas that drifts on a 20-second keyframe loop. Dark mode
                pushes the tint opacity slightly higher so the color reads
                against a near-black base. Light mode keeps them barely visible.
                No canvas, no WebGL, no JS cost for the background.
              </p>
              <p className="mt-3 text-muted">
                The headline uses Framer Motion&apos;s staggered word reveal --
                each word in &quot;Hey, I&apos;m Paul. / I build things / people
                use.&quot; fades up from 20px below with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  spring.wordReveal
                </code>{" "}
                physics. The subtitle and CTA button fade in after the headline
                completes, timed off the word count so the delay stays correct
                if the copy changes.
              </p>
              <p className="mt-3 text-muted">
                LCP safety comes from the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useSyncExternalStore
                </code>{" "}
                mounted flag -- the same pattern v1 uses. SSR renders the H1
                text visible (
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  initial=&#123;false&#125;
                </code>{" "}
                server-side), and the entrance animation only runs after
                hydration. The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useReducedMotion()
                </code>{" "}
                guard replaces all spring transitions with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  instantTransition
                </code>{" "}
                when the user has requested reduced motion.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">ProjectCard</h2>
              <p className="text-muted">
                Each project gets a full-width card with a two-column layout on
                desktop -- 60% preview area, 40% text content. The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  reversed
                </code>{" "}
                prop swaps the columns so alternating cards zigzag down the
                page. On mobile the columns stack vertically with the preview on
                top.
              </p>
              <p className="mt-3 text-muted">
                The preview area gets a subtle background tinted with the
                feature&apos;s color at ~5% opacity. The text side has a
                category dot (matching the color), the title, a description, and
                one or two links: &quot;View project →&quot; always, &quot;Read
                about it →&quot; when there&apos;s a matching thoughts page. The
                card accepts a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  preview
                </code>{" "}
                ReactNode so it can render the same mini-preview components the
                v1 hub uses -- no new preview code needed.
              </p>
              <p className="mt-3 text-muted">
                Animation is scroll-triggered via{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  whileInView
                </code>{" "}
                with a -10% viewport margin so cards start animating slightly
                before they enter the viewport. Each card staggers by{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  index * 0.1s
                </code>
                . Hover lifts the card 4px. All motion respects{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useReducedMotion()
                </code>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">StatsStrip</h2>
              <p className="text-muted">
                A full-bleed horizontal strip that shows four key stats: 14
                features, 108+ tests, 17 write-ups, and 5 CWV metrics tracked.
                The numbers count up from 0 to their target over 1.5 seconds
                with ease-out cubic easing when the section scrolls into view.
                The animation is driven by the existing{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useCountUp
                </code>{" "}
                hook, extended with an optional{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  inView
                </code>{" "}
                parameter wired to Framer Motion&apos;s{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useInView
                </code>
                .
              </p>
              <p className="mt-3 text-muted">
                SSR renders the final values using the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useSyncExternalStore
                </code>{" "}
                mounted flag -- same pattern as the hero. The server pass shows
                &quot;14&quot;, &quot;108+&quot;, etc. so crawlers and no-JS
                users see real content. After hydration the client resets to 0
                and waits for scroll intersection before counting up. Users with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  prefers-reduced-motion
                </code>{" "}
                see the final values immediately with no animation.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">FeatureHubV2</h2>
              <p className="text-muted">
                The authenticated hub got the same treatment as the landing
                page. NavBar with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  authenticated=&#123;true&#125;
                </code>
                , a generous header section with a personalized greeting
                (&quot;Hey &#123;firstName&#125;.&quot;), feature count
                subtitle, and inline stats line. Same{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useQuery
                </code>{" "}
                pattern as v1 -- server-seeded{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  initialMe
                </code>{" "}
                so the name renders on first paint, background refresh after 5
                minutes.
              </p>
              <p className="mt-3 text-muted">
                Below the header: pill-shaped category filter tabs (All, NBA,
                Pokemon, Calendar, Engineering, Labs) that filter the FEATURES
                array client-side. Active tab gets{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  bg-foreground text-background
                </code>
                , inactive tabs get{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  bg-surface text-muted
                </code>
                . The tab bar scrolls horizontally on mobile with a hidden
                scrollbar. The filtered grid re-staggers on category change via
                a Framer Motion{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  key=&#123;active&#125;
                </code>{" "}
                swap. Dev thoughts section reuses the same ThoughtCard and
                scroll-triggered reveal as v1.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Landing composition</h2>
              <p className="text-muted">
                LandingContentV2 was a placeholder div. Now it composes all six
                sections in order: NavBar (unauthenticated), HeroSection,
                ProjectsSection, StatsStrip, ThoughtsPreview, FooterSection. The
                outer wrapper applies{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  scroll-smooth bg-background
                </code>{" "}
                so the hero&apos;s &quot;Explore my work&quot; CTA and the
                footer&apos;s anchor links animate smoothly rather than jumping.
              </p>
              <p className="mt-3 text-muted">
                No changes to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  page.tsx
                </code>{" "}
                -- it already rendered LandingContentV2 for unauthenticated
                non-v1 visitors. The hero is a full-viewport section (
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  min-h-dvh
                </code>
                ) so the fixed NavBar overlaps it naturally without needing
                explicit top padding.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">FooterSection</h2>
              <p className="text-muted">
                A minimal server component footer -- no client JS, no
                animations. Three elements in a row on desktop: the
                &quot;paul-explore&quot; wordmark, a copyright year, and a nav
                with links to GitHub, the thoughts index, and a &quot;View v1
                →&quot; link that appends{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ?version=v1
                </code>{" "}
                to the URL. On mobile the three elements stack vertically and
                center-align. The GitHub link opens in a new tab with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  rel=&quot;noopener noreferrer&quot;
                </code>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">ThoughtsPreview</h2>
              <p className="text-muted">
                A &quot;How it&apos;s built&quot; section that renders every
                entry from the shared THOUGHTS array as a linked card in a
                responsive grid -- single column on mobile, two on tablet, three
                on desktop. Each card has a 3px left accent border in the
                thought&apos;s color, a bold title, and preview text. Hover
                darkens the border and adds a subtle shadow.
              </p>
              <p className="mt-3 text-muted">
                The grid entrance uses Framer Motion&apos;s{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  staggerContainer
                </code>{" "}
                with 50ms delay per card and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  whileInView
                </code>{" "}
                so cards fade up as the section scrolls into view. All motion is
                guarded by{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useReducedMotion()
                </code>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">ProjectsSection</h2>
              <p className="text-muted">
                The projects section is the main showcase -- it renders all 14
                features as ProjectCard components, grouped by category. Six
                groups: Fantasy &amp; NBA (5 cards), Pok&eacute;mon (3),
                Productivity (1), Engineering (2), Labs &amp; Learning (2), and
                Social (1). Each group gets a sticky category label (
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  text-xs uppercase tracking-widest text-muted font-bold
                </code>
                ) with a thin horizontal rule underneath. The label sticks to
                the top of the viewport as you scroll through that group&apos;s
                cards, so you always know which category you&apos;re in.
              </p>
              <p className="mt-3 text-muted">
                Cards within each group alternate the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  reversed
                </code>{" "}
                prop so the preview/text sides zig-zag down the page. The
                section has{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  id=&quot;projects&quot;
                </code>{" "}
                so the hero&apos;s &quot;Explore my work&quot; CTA scrolls
                directly to it. Features are looked up by ID from the shared
                FEATURES array and PREVIEW_MAP, so the grouping order is defined
                entirely by the GROUPS config -- independent of the array&apos;s
                own order.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Shared data extraction</h2>
              <p className="text-muted">
                The v1 FeatureHub had ~1000 lines of inline data: the FEATURES
                and THOUGHTS arrays, 14 mini-preview components, all the static
                data those previews depend on, the PREVIEW_MAP and FEATURE_TOKEN
                lookups, and the FeatureCard and ThoughtCard presentational
                components. All of that lived in FeatureHub.tsx because it was
                the only consumer.
              </p>
              <p className="mt-3 text-muted">
                With v2, there are two consumers. Extracting everything into{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  src/app/_shared/featureData.tsx
                </code>{" "}
                lets both v1&apos;s FeatureHub and v2&apos;s ProjectCard layout
                import the same feature list, preview components, and card
                components. FeatureHub.tsx drops to just its default export and
                internal logic -- no behavioral change, just a different import
                path.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What&apos;s next</h2>
              <p className="text-muted">
                The v2 placeholders are intentionally empty -- just divs with
                text. The plan is to build v2 incrementally: landing page first,
                then the authenticated hub. Each piece can be built and tested
                independently while v1 continues to serve as the production
                default for anyone who appends{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ?version=v1
                </code>
                . Once v2 is ready, v1 becomes the escape hatch instead of the
                default.
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
                you&apos;re doing a v2 of the landing page and hub
              </Received>
              <Received pos="last">why not just redesign in place</Received>

              <Sent pos="first">
                the current landing page pulls in Three.js, R3F, drei,
                shader-gradient, and a custom WeatherCanvas. that&apos;s a lot
                of JS that loads on the default path
              </Sent>
              <Sent pos="last">
                redesigning in place means either maintaining two code paths in
                the same files or doing a big-bang swap where you hope nothing
                breaks. version routing avoids both
              </Sent>

              <Received>how does the version routing work</Received>

              <Sent pos="first">
                URL parameter. <code>?version=v1</code> gives you the original
                experience -- Three.js hero, ShaderGradient, the whole thing. no
                param or any other value gives you v2
              </Sent>
              <Sent pos="last">
                the server component reads <code>searchParams.version</code> and
                branches. no middleware, no cookies, no feature flag service.
                just a query string
              </Sent>

              <Received>
                and the bundle splitting -- how does that save bytes
              </Received>

              <Sent pos="first">
                the v1 components are wrapped in <code>next/dynamic</code>.
                their chunks only load when the URL says{" "}
                <code>?version=v1</code>. the v2 components are statically
                imported because they have no heavy deps
              </Sent>
              <Sent pos="last">
                default path ships zero Three.js bytes. that&apos;s the whole
                point -- the 3D stuff becomes opt-in instead of mandatory
              </Sent>

              <Timestamp>2:08 PM</Timestamp>

              <Received>
                why a URL param instead of a cookie or feature flag
              </Received>

              <Sent pos="first">
                URL params are transparent. you can send someone a link to v1
                and they see exactly what you see. cookies are invisible and
                sticky -- &quot;it works for me&quot; is literally true because
                your cookie differs
              </Sent>
              <Sent pos="last">
                feature flags add infrastructure for what is fundamentally a
                boolean. a query string is the simplest thing that works
              </Sent>

              <Received>and v1 code is completely untouched</Received>

              <Sent pos="first">
                not a single line changed in LandingContent.tsx or
                FeatureHub.tsx. they&apos;re just loaded through{" "}
                <code>next/dynamic</code> now instead of a static import
              </Sent>
              <Sent pos="last">
                v2 lives in its own <code>src/app/v2/</code> directory. no
                shared state, no conditional rendering inside components. a
                change to v2 can&apos;t break v1
              </Sent>

              <Timestamp>2:15 PM</Timestamp>

              <Received>what about the nav</Received>

              <Sent pos="first">
                fixed bar, starts transparent. once you scroll past 50px it
                picks up a frosted-glass background --{" "}
                <code>backdrop-blur-xl</code> and <code>bg-background/80</code>.
                the transition is 300ms so it fades in instead of snapping
              </Sent>
              <Sent pos="last">
                right side is auth-aware. guests see a &quot;Log in&quot; link,
                authenticated users see a gear icon to <code>/settings</code>.
                the server component passes an <code>authenticated</code>{" "}
                boolean so the client never needs to check auth itself
              </Sent>

              <Received>what about the hero</Received>

              <Sent pos="first">
                CSS-only background. two overlapping radial gradients -- violet
                and blue tints -- on a <code>background-size: 400% 400%</code>{" "}
                canvas that drifts on a 20-second keyframe loop. no canvas, no
                WebGL, no JS for the background at all
              </Sent>
              <Sent pos="last">
                the headline staggers each word in with{" "}
                <code>spring.wordReveal</code>. subtitle and CTA fade in after.
                uses the same <code>useSyncExternalStore</code> mounted flag as
                v1 for LCP safety -- SSR renders text visible, animation only
                runs after hydration
              </Sent>

              <Received>and the project cards</Received>

              <Sent pos="first">
                each project gets a full-width card with a 60/40 split --
                preview on one side, text on the other. the{" "}
                <code>reversed</code> prop swaps them so the cards zigzag down
                the page. on mobile they just stack
              </Sent>
              <Sent pos="middle">
                the preview area is tinted with the feature&apos;s color at ~5%
                opacity. text side has a category dot, title, description, and
                links. the card accepts a <code>preview</code> ReactNode so it
                can reuse the same mini-preview components from v1
              </Sent>
              <Sent pos="last">
                animation is <code>whileInView</code> with stagger delay per
                index. hover lifts 4px. all guarded by{" "}
                <code>useReducedMotion()</code>
              </Sent>

              <Received>what about the authenticated hub</Received>

              <Sent pos="first">
                same NavBar but with <code>authenticated=&#123;true&#125;</code>
                . hero header with &quot;Hey &#123;firstName&#125;.&quot; and
                inline stats. same <code>useQuery</code> pattern as v1 --
                server-seeded <code>initialMe</code> so the name renders on
                first paint
              </Sent>
              <Sent pos="middle">
                category filter tabs below the header -- All, NBA, Pokemon,
                Calendar, Engineering, Labs. pill-shaped buttons, active gets{" "}
                <code>bg-foreground text-background</code>. horizontal scroll on
                mobile with hidden scrollbar
              </Sent>
              <Sent pos="last">
                the filtered grid re-staggers when you switch categories via a
                Framer Motion <code>key</code> swap. dev thoughts section reuses
                ThoughtCard and scroll-triggered reveal from v1
              </Sent>

              <Received>so the landing page is fully wired up now</Received>

              <Sent pos="first">
                LandingContentV2 composes all six sections: NavBar, Hero,
                Projects, StatsStrip, ThoughtsPreview, Footer. the wrapper div
                adds <code>scroll-smooth</code> so anchor links animate across
                the whole page
              </Sent>
              <Sent pos="last">
                page.tsx already rendered it for unauthenticated non-v1 visitors
                so no routing changes. the hero is full-viewport height so the
                fixed nav overlaps it naturally
              </Sent>

              <Received>and the footer</Received>

              <Sent pos="first">
                server component, no client JS at all. wordmark on the left,
                copyright year in the center, links on the right -- GitHub,
                Thoughts index, and a &quot;View v1&quot; link that adds{" "}
                <code>?version=v1</code> to the URL
              </Sent>
              <Sent pos="last">
                stacks vertically on mobile, single row on desktop. just{" "}
                <code>border-t border-border</code> for separation. dark mode
                aware through the design tokens, no extra work needed
              </Sent>

              <Received>and the thoughts preview</Received>

              <Sent pos="first">
                a &quot;How it&apos;s built&quot; section with every dev
                write-up in a responsive grid -- 1 column on mobile, 2 on
                tablet, 3 on desktop. each card has a colored left accent
                border, bold title, and preview text
              </Sent>
              <Sent pos="last">
                entrance is a staggered fade-up with 50ms between cards,
                triggered by <code>whileInView</code>. imports the THOUGHTS
                array from the same shared module as the project cards
              </Sent>

              <Received>what about the stats strip</Received>

              <Sent pos="first">
                full-bleed band with four numbers: 14 features, 108+ tests, 17
                write-ups, 5 CWV metrics tracked. they count up from 0 when you
                scroll to them -- 1.5 seconds with ease-out cubic
              </Sent>
              <Sent pos="last">
                the existing <code>useCountUp</code> hook got a new{" "}
                <code>inView</code> param so it waits for scroll intersection.
                SSR renders the final values via the{" "}
                <code>useSyncExternalStore</code> mounted flag so there is no
                hydration mismatch. reduced-motion users see the numbers
                immediately
              </Sent>

              <Received>how does the projects section work</Received>

              <Sent pos="first">
                all 14 features rendered as ProjectCards, grouped into six
                categories -- Fantasy &amp; NBA, Pok&eacute;mon, Productivity,
                Engineering, Labs &amp; Learning, and Social. each group gets a
                sticky label that stays at the top of the viewport as you scroll
                through its cards
              </Sent>
              <Sent pos="last">
                cards alternate the <code>reversed</code> prop so the
                preview/text sides zig-zag. features are looked up by ID from
                the shared FEATURES array so the display order is defined by the
                GROUPS config, not the array order
              </Sent>

              <Received>
                you mentioned sharing preview components between v1 and v2
              </Received>

              <Sent pos="first">
                everything that was inline in FeatureHub.tsx -- the FEATURES
                array, THOUGHTS array, all 14 mini-preview components, the
                preview data, FEATURE_TOKEN, PREVIEW_MAP, FeatureCard,
                ThoughtCard -- moved into{" "}
                <code>src/app/_shared/featureData.tsx</code>
              </Sent>
              <Sent pos="last">
                FeatureHub just imports from there now. same behavior, different
                import path. v2 can import the same stuff without duplicating
                ~1000 lines of preview components
              </Sent>

              <Timestamp>2:34 PM</Timestamp>

              <Received>what&apos;s the v2 plan</Received>

              <Sent pos="first">
                right now v2 is just placeholder divs. the plan is to build it
                incrementally -- landing first, then the hub. each piece gets
                built and tested independently
              </Sent>
              <Sent pos="last">
                once v2 is solid, flip the default. v1 becomes the escape hatch
                at <code>?version=v1</code> instead of the main path. eventually
                remove it entirely
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
