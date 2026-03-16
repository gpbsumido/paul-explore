"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Sent, Received, Timestamp } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function UIRedesignContent() {
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
            UI Redesign
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
              UI Redesign
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Why the zero-dependency constraint gave way to Framer Motion, how the B&W + pastel system works, and what&apos;s measurably better versus what&apos;s a design bet.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">

            <section>
              <h2 className="mb-3 text-lg font-bold">Why Framer Motion</h2>
              <p className="text-muted">
                The zero-dependency constraint forced understanding what the browser can do on its own — that was worth doing. But it had a real limitation: exit animations don&apos;t exist in CSS. When a modal closes it just vanishes. CSS transitions only animate between states that are both in the DOM. Framer Motion solves that with <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">AnimatePresence</code> — it holds the element in the tree long enough for the exit animation to finish, then removes it.
              </p>
              <p className="mt-3 text-muted">
                The old approach also had spring configs scattered everywhere — inline <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">transition</code> objects with different stiffness values in every file. The new system has a single <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">src/lib/animations.ts</code> with named spring presets: <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">snappy</code>, <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">smooth</code>, <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">bounce</code>, <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">gentle</code>. Change one value there and every component that references it updates.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">B&W + pastel accent system</h2>
              <p className="text-muted">
                The old design treated all eight features the same — same card color, same border, same typography. Assigning each feature its own pastel fixes that: calendar is mint, TCG is rose, vitals is violet, NBA is amber. The colors are Tailwind 200-level — light enough not to dominate on black, saturated enough to be distinct from each other. Putting them on a black base instead of neutral gray means the pastels actually read as color. On a white background they look washed out.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Glassmorphism</h2>
              <p className="text-muted">
                Frosted glass cards let the dark background and the pastel tints bleed through, which ties everything together visually. A solid <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">bg-surface</code> card on a black background would just look like a white rectangle — disconnected. Technically: <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">backdrop-filter: blur()</code> is GPU composited. It&apos;s not a layout property, so it doesn&apos;t affect CLS. That mattered — no vitals regression for a visual effect.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">ShaderGradient hero</h2>
              <p className="text-muted">
                The Three.js particle network was moved from the hero to <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/lab/particles</code> — it was ~40kb of canvas code loading on every landing page visit. ShaderGradient takes its place with a black CSS fallback, so LCP fires on the H1 text immediately while the gradient loads behind it. The interactive mouse parallax maps cursor position to camera angles (<code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">cAzimuthAngle</code> and <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">cPolarAngle</code>), RAF-throttled so there&apos;s one setState per frame maximum.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What&apos;s measurably better</h2>
              <p className="text-muted">
                The provable improvements: bundle size (Three.js disappears from the landing chunk), exit animations (they literally didn&apos;t exist before), reduced-motion support (the app had none, now there&apos;s a provider), animation config centralization (all spring objects in one file). The web vitals dashboard gives a before/after on LCP, CLS, and INP since every version gets its own trend line — real user data, not synthetic Lighthouse scores.
              </p>
              <p className="mt-3 text-muted">
                What&apos;s not provable: whether glassmorphism looks better than flat cards, whether per-section animations are more engaging than a uniform stagger, whether the pastel palette is more memorable than a primary color scheme. Those are bets. The constraint changed from &quot;zero dependencies&quot; to &quot;earn every dependency&quot; — Framer earned it, ShaderGradient earned it, everything else is still the platform.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Particle lab</h2>
              <p className="text-muted">
                Moving the particle network to its own page at <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/lab/particles</code> turns it from silent background decoration into a feature you can interact with — controls, color themes, mouse attraction toggle. A second lab page at <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">/lab/motion</code> documents the Framer Motion API with six interactive sections: spring physics, stagger grids, drag-to-reorder, scroll-driven parallax, gesture variants, and shared layout transitions. The spring playground was the first place to feel the difference between stiffness and damping with sliders rather than just reading about it.
              </p>
            </section>

          </div>
        </main>
      ) : (
        <div className="flex justify-center">
          <div className={styles.phone} style={{ minHeight: "calc(100dvh - 56px)" }}>
            <div className={styles.chat}>
              <Timestamp>Today 10:00 AM</Timestamp>

              {/* ---- The decision ---- */}
              <Received pos="first">
                the old landing page used pure CSS keyframes and zero animation
                dependencies — you were proud of that
              </Received>
              <Received pos="last">why did you change it</Received>

              <Sent pos="first">
                the zero-dependency constraint made sense when I was building it. it
                forced me to understand what the browser can actually do on its own.
                that was worth doing
              </Sent>
              <Sent pos="middle">
                but it had a real limitation: <strong>exit animations don{"'"}t
                exist in CSS</strong>. when a modal closes it just vanishes. when you
                navigate away from a section it cuts. CSS transitions only animate
                between states that are both in the DOM
              </Sent>
              <Sent pos="last">
                Framer Motion solves that with{" "}
                <code>AnimatePresence</code> — it holds the element in the tree long
                enough for the exit animation to finish, then removes it. you can{"'"}t
                do that without JS
              </Sent>

              <Received>so the main reason was exit animations</Received>

              <Sent pos="first">
                that and consistency. the old approach had spring configs scattered
                everywhere — inline <code>transition</code> objects with different
                stiffness values in every file. no way to retune them all at once
              </Sent>
              <Sent pos="last">
                the new system has a single <code>src/lib/animations.ts</code> with
                named spring presets: <code>snappy</code>, <code>smooth</code>,{" "}
                <code>bounce</code>, <code>gentle</code>. change one value there and
                every component that references it updates. the old way that was a grep
                and replace job
              </Sent>

              <Timestamp>10:06 AM</Timestamp>

              {/* ---- Design direction ---- */}
              <Received pos="first">
                why B&W with pastel accents — that{"'"}s a pretty specific direction
              </Received>
              <Received pos="last">
                most portfolio sites just do dark mode or light mode with a primary
                color
              </Received>

              <Sent pos="first">
                the project has eight distinct features and the old design treated them
                all the same — same card color, same border, same typography. nothing
                told you that the calendar and the TCG browser were different things at
                a glance
              </Sent>
              <Sent pos="middle">
                assigning each feature its own pastel fixes that. calendar is mint,
                TCG is rose, vitals is violet, NBA is amber. the colors are{" "}
                <strong>Tailwind 200-level</strong> — light enough to not dominate on
                black, saturated enough to be distinct from each other. you could swap
                any two and notice immediately
              </Sent>
              <Sent pos="last">
                and putting them on a black base instead of a neutral gray means the
                pastels actually read as color. on a white background they just look
                washed out
              </Sent>

              <Received>and the glassmorphism — that{"'"}s a trend</Received>

              <Sent pos="first">
                it is. I thought about that. the honest answer is it{"'"}s a bet on
                taste, not a technical win
              </Sent>
              <Sent pos="middle">
                what I can justify: frosted glass cards let the dark background and the
                pastel tints bleed through, which ties everything together visually. a
                solid <code>bg-surface</code> card on a black background would just
                look like a white rectangle — disconnected
              </Sent>
              <Sent pos="last">
                also, <code>backdrop-filter: blur()</code> is GPU composited. it{"'"}s
                not a layout property, so it doesn{"'"}t affect CLS. that mattered —
                I wasn{"'"}t willing to take a vitals regression for a visual effect
              </Sent>

              <Timestamp>10:14 AM</Timestamp>

              {/* ---- Per-section animations ---- */}
              <Received>
                the plan has a different Framer animation for every landing section —
                that seems like a lot
              </Received>

              <Sent pos="first">
                I wanted to avoid the thing where every section does the exact same
                stagger-up fade. you{"'"}ve seen it — every card enters the same way,
                the whole page feels like a template
              </Sent>
              <Sent pos="middle">
                the idea was each section{"'"}s animation should reflect what the
                section is about. the calendar grid builds cell by cell, left to right,
                because that{"'"}s literally how a calendar renders. the TCG cards
                fly out from a central point like they{"'"}re being dealt. the GraphQL
                query types itself in because it{"'"}s a query panel
              </Sent>
              <Sent pos="last">
                it{"'"}s more work upfront but it makes each section feel considered
                rather than generated. and since they all use the same spring presets
                from <code>animations.ts</code>, the physics still feel consistent even
                though the motion is different
              </Sent>

              <Received>how do you know they{"'"}re actually better</Received>

              <Sent pos="first">
                for the subjective stuff I don{"'"}t — that{"'"}s the honest answer.
                you can{"'"}t A/B test animation personality without a real user base
                and analytics
              </Sent>
              <Sent pos="last">
                what I can measure is whether they cause regressions. every animation
                uses only <code>transform</code> and <code>opacity</code>, which are
                GPU composited and don{"'"}t trigger layout recalc. the vitals dashboard
                will show whether INP or CLS moved after each phase
              </Sent>

              <Timestamp>10:21 AM</Timestamp>

              {/* ---- Three.js move ---- */}
              <Received pos="first">
                why move the Three.js particle network out of the hero
              </Received>
              <Received pos="last">it was a good effect</Received>

              <Sent pos="first">
                it was, and it{"'"}s still in the project — just at{" "}
                <code>/lab/particles</code> now instead of behind everything on the
                landing page
              </Sent>
              <Sent pos="middle">
                the reason: ShaderGradient does the visual job for the hero with a
                smaller footprint. the Three.js scene was ~40kb of canvas code loading
                on every landing page visit, even for users who scrolled straight past
                it without noticing it
              </Sent>
              <Sent pos="last">
                moving it to its own page means it only loads when someone explicitly
                navigates to <code>/lab/particles</code>. first-load JS for the landing
                shrinks. and as its own page it becomes a feature you can actually
                interact with — controls, color themes, mouse attraction toggle — instead
                of silent background decoration
              </Sent>

              <div className={styles.codeBubble}>
                {`// before: loaded on every landing page visit
// HeroSection.tsx
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

// after: only loads at /lab/particles
// src/app/lab/particles/page.tsx — self-contained R3F page`}
              </div>

              <Received>and ShaderGradient is lighter</Received>

              <Sent pos="first">
                lighter to write, at least. the actual bundle is comparable since
                ShaderGradient needs <code>@react-three/fiber</code> as a peer. but
                both are behind <code>next/dynamic</code> so neither blocks the initial
                render
              </Sent>
              <Sent pos="last">
                the real win is the black CSS fallback. ShaderGradient renders a pure{" "}
                <code>bg-black</code> div while WebGL loads. that means LCP happens
                immediately — the H1 is on a black background from the first paint.
                with the old Three.js setup the hero background was the neutral
                fallback gradient until the canvas appeared, which caused a flash
              </Sent>

              <Timestamp>10:29 AM</Timestamp>

              {/* ---- What can be proven ---- */}
              <Received>
                so what can you actually prove improved vs what{"'"}s just different
              </Received>

              <Sent pos="first">
                the provable stuff: bundle size (run{" "}
                <code>ANALYZE=true npm run build</code> before and after — three.js
                disappears from the landing chunk), exit animations (they literally
                didn{"'"}t exist before), reduced-motion support (the app had none,
                now there{"'"}s a provider), animation config centralization (grep for
                inline spring objects before vs after)
              </Sent>
              <Sent pos="middle">
                the web vitals dashboard gives a before/after on LCP, CLS, and INP
                since every version gets its own trend line. that{"'"}s the most honest
                signal — real user data, not synthetic Lighthouse scores
              </Sent>
              <Sent pos="last">
                what{"'"}s not provable: whether glassmorphism looks better than flat
                cards, whether per-section animations are more engaging than a uniform
                stagger, whether the pastel palette is more memorable than a primary
                color scheme. those are bets. the plan acknowledges that upfront
              </Sent>

              <Received>clean</Received>

              <Sent>
                the constraint changed from {'"'}zero dependencies{'"'} to {'"'}earn
                every dependency{'"'}. framer earned it. shadergradient earned it.
                everything else is still the platform
              </Sent>

              <Timestamp>10:38 AM</Timestamp>

              {/* ---- Interactive gradient ---- */}
              <Received pos="first">
                you made the hero gradient interactive — mouse moves shift the light
                source
              </Received>
              <Received pos="last">how does that fit with the B&W direction</Received>

              <Sent pos="first">
                ShaderGradient{"'"}s camera angles are live props —{" "}
                <code>cAzimuthAngle</code> and <code>cPolarAngle</code> update every
                frame based on where the mouse is on the section. the library{"'"}s{" "}
                <code>smoothTime</code> prop eases the camera to the target so it
                doesn{"'"}t snap
              </Sent>
              <Sent pos="middle">
                it fits the B&W direction because it{"'"}s not adding color — it{"'"}s
                adding depth. the waves catch light differently depending on your viewing
                angle, the same way brushed metal or fabric does. it rewards curiosity
                without breaking the palette
              </Sent>
              <Sent pos="last">
                practically: a dark scrim at <code>bg-black/50</code> sits between the
                gradient and the text so legibility never breaks even when the gradient
                sweeps bright. the gradient earns the interaction, the scrim earns the
                readability
              </Sent>

              <Received>performance concern — mouse events + WebGL every frame</Received>

              <Sent pos="first">
                the mouse handler itself is RAF-throttled. <code>onMouseMove</code>{" "}
                writes to refs, and a <code>requestAnimationFrame</code> callback
                flushes them to React state once per frame maximum. no setState spam on
                every pixel of cursor movement
              </Sent>
              <Sent pos="last">
                the WebGL side is ShaderGradient{"'"}s problem — it{"'"}s already
                running an animation loop for the wave motion. the camera update is just
                a uniform change, not a re-render. no extra draw calls, no geometry
                changes
              </Sent>

              <Timestamp>10:47 AM</Timestamp>

              {/* ---- Motion Lab ---- */}
              <Received pos="first">
                you added a second lab page — the motion demo. what{"'"}s that for
              </Received>
              <Received pos="last">
                it{"'"}s not a feature, it{"'"}s just demos
              </Received>

              <Sent pos="first">
                it{"'"}s documentation that runs. six sections, each isolating one
                Framer API: spring physics, stagger grids, drag-to-reorder,
                scroll-driven parallax, gesture variants, shared layout transitions
              </Sent>
              <Sent pos="middle">
                every one of those has a subtle configuration problem that only shows
                up in practice. the spring playground was the first time I had sliders
                that let you feel the difference between stiffness and damping rather
                than just reading about it. mass is the one that surprised me — it
                doesn{"'"}t change the spring rate, it changes inertia. a heavy puck
                starts slow and overshoots more even at the same stiffness
              </Sent>
              <Sent pos="last">
                the shared layout demo got interesting because of the{" "}
                <code>LayoutGroup</code> wrapper. without it, each card{"'"}s{" "}
                <code>layoutId</code> animates independently and the siblings snap
                instead of yielding space. with it, Framer knows the whole group is
                transitioning and coordinates the reflow
              </Sent>

              <Received>
                and <code>AnimatePresence mode="wait"</code> breaking with{" "}
                <code>next/dynamic</code> — you mentioned that earlier. what was the
                actual issue
              </Received>

              <Sent pos="first">
                <code>mode="wait"</code> holds the exiting component in the React
                tree until its exit animation finishes. <code>next/dynamic</code>{" "}
                suspends when a chunk hasn{"'"}t loaded yet. those two mechanisms both
                try to control when a component is mounted and unmounted, and they
                disagree
              </Sent>
              <Sent pos="last">
                React{"'"}s Suspense cleanup fires while the exiting fiber is still
                mounted, logs a warning about async info that{" "}
                {"\""}was not on the parent Suspense boundary{"\""}. the fix is to
                drop <code>mode="wait"</code> — exit and enter run concurrently
                instead of sequentially, which is fine for a slide transition. the
                overlap is barely visible and the warning disappears
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
