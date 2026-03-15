import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "../styling/styling.module.css";
import { Sent, Received, Timestamp } from "@/lib/threads";

export default function UIRedesignContent() {
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
          <span className={styles.contactName}>UI Redesign</span>
          <span className={styles.contactSub}>iMessage</span>
        </div>
        <div className={styles.themeBtn}>
          <ThemeToggle />
        </div>
      </div>

      {/* ---- Chat ---- */}
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
