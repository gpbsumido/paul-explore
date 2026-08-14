/** Landing-page write-up summary (first half). */
export function LandingSummaryOne() {
  return (
    <>
      <section>
        <h2 className="mb-3 text-lg font-bold">Zero-dependency first</h2>
        <p className="text-muted">
          The constraint was no Framer Motion, no GSAP, no animation library.
          Scroll animations use a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useInView
          </code>{" "}
          hook wrapping{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            IntersectionObserver
          </code>
          . The observer is one-shot — once an element becomes visible it
          disconnects, so animations only fire once. A{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            reveal()
          </code>{" "}
          helper toggles Tailwind classes between{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            opacity-0 translate-y-8
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            opacity-100 translate-y-0
          </code>{" "}
          with a 700ms CSS transition.
        </p>
        <p className="mt-3 text-muted">
          The hero entrance uses pure CSS{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            @keyframes
          </code>{" "}
          with{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            animation-fill-mode: forwards
          </code>{" "}
          and staggered{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            animation-delay
          </code>{" "}
          values. No JS state needed — the elements start at{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            opacity: 0
          </code>{" "}
          and the animation drives them to their final state.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Server / client split</h2>
        <p className="text-muted">
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            page.tsx
          </code>{" "}
          is a server component. It calls{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            auth0.getSession()
          </code>{" "}
          — a local cookie decrypt, no network call — and renders either the hub
          for logged-in users or{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            {"<LandingContent />"}
          </code>{" "}
          for everyone else. Same URL, different content, no redirect to{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            /protected
          </code>
          .
        </p>
        <p className="mt-3 text-muted">
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            LandingContent
          </code>{" "}
          is a thin orchestrator. Each section is its own component
          under{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            src/app/landing/
          </code>
          , each owning its own scroll observer, markup, and data. Shared
          utilities like{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useInView
          </code>
          ,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            reveal()
          </code>
          , and the{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            Section
          </code>{" "}
          wrapper live in the same folder.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Theming</h2>
        <p className="text-muted">
          Every color uses the project&apos;s design token system — semantic
          classes like{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            bg-background
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            text-foreground
          </code>{" "}
          resolve to CSS custom properties that swap based on{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            data-theme
          </code>
          . Sections that need to be the opposite of the current theme use
          explicit palette tokens like{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            bg-neutral-950 dark:bg-neutral-100
          </code>
          . Feature cards use the{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            group
          </code>{" "}
          hover pattern — the gradient layer transitions from{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            opacity-0
          </code>{" "}
          to{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            opacity-100
          </code>{" "}
          on hover. No event handlers, no state — pure CSS.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Water ripple simulation</h2>
        <p className="text-muted">
          The hero background — and every section below it — runs an interactive
          water ripple simulation in a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            {"<canvas>"}
          </code>
          . The physics is the discrete 2D wave equation: each cell&apos;s new
          height is the average of its four neighbors minus its previous height,
          then damped by{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            h -= h {">>"} 5
          </code>{" "}
          (multiply by 31/32 per frame). Two{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            Int32Array
          </code>{" "}
          buffers double-buffer the simulation — no float allocation in the hot
          loop. The simulation runs at 1/3 canvas resolution and is
          bilinear-upscaled via{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            drawImage
          </code>{" "}
          to fill the element.
        </p>
        <p className="mt-3 text-muted">
          Rendering converts height-field gradients into a surface normal and
          applies two-light Phong shading: a cool moonlight key from upper-left
          (high-exponent specular for tight glints) and a warm rim fill from
          upper-right. The four color stops —{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            base
          </code>
          ,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            diffuse
          </code>
          ,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            spec1
          </code>
          ,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            spec2
          </code>{" "}
          — are a prop, so every section can express a distinct color while
          sharing the same physics. Mouse position is tracked on{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            window
          </code>{" "}
          and converted to canvas-local coords via{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            getBoundingClientRect
          </code>
          . An{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            IntersectionObserver
          </code>{" "}
          pauses each section&apos;s RAF loop when scrolled off-screen, so at
          most two or three simulations are active at any time.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Per-section water identity</h2>
        <p className="text-muted">
          The{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            Section
          </code>{" "}
          wrapper accepts a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            waterColors
          </code>{" "}
          prop. When provided it renders the{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            WaterRipple
          </code>{" "}
          canvas as an{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            absolute inset-0
          </code>{" "}
          background, a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            bg-black/52
          </code>{" "}
          veil for legibility, and sets{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            data-theme=&quot;dark&quot;
          </code>{" "}
          on the element so all CSS token variables (
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            text-foreground
          </code>
          ,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            text-muted
          </code>
          , etc.) resolve to their light/readable dark-mode values. No text
          colors had to be changed in any section file — one attribute does all
          the token remapping.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Weather canvas and performance
        </h2>
        <p className="text-muted">
          The landing page background switched from per-section water ripple
          canvases to a single fixed{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            WeatherCanvas
          </code>{" "}
          that picks one of six effects (rain, clear, storm, snow, clouds, fog)
          based on the visitor&apos;s real weather. An{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            IntersectionObserver
          </code>{" "}
          pauses the RAF loop when the canvas scrolls out of view, so the sim
          only burns CPU while someone can actually see it.
        </p>
        <p className="mt-3 text-muted">
          The snow and cloud effects originally allocated{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            createRadialGradient
          </code>{" "}
          per particle per frame: 260 flakes at 60 fps is 15k+ gradient objects
          per second. Now both effects pre-render sprites to offscreen canvases
          at init time and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            drawImage
          </code>{" "}
          them each frame. Zero per-frame allocation.
        </p>
        <p className="mt-3 text-muted">
          The wave propagation, double-buffering, and Phong shading code was
          duplicated between{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            WaterRipple
          </code>{" "}
          and the rain weather effect. That&apos;s now extracted into a shared{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            WaveSim
          </code>{" "}
          class in{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            waveSim.ts
          </code>
          . Both consumers configure it differently (different disturbance
          radii, different drop patterns) but share the same hot loop.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Shared animation variants</h2>
        <p className="text-muted">
          Seven section files were each defining identical{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            headingWipe
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            fadeUp
          </code>{" "}
          Framer Motion variant objects. Those now live in{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            animations.ts
          </code>{" "}
          alongside the other shared presets. The old custom{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useInView
          </code>{" "}
          hook was also retired. Every section now uses Framer Motion&apos;s{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useInView
          </code>{" "}
          for consistency, including the footer which was the last holdout.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">ESPN fantasy matchups</h2>
        <p className="text-muted">
          A new matchup page at{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            /fantasy/nba/matchups
          </code>{" "}
          shows head-to-head weekly matchups pulled from the ESPN fantasy API.
          The schedule is a flat array where every{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            teamsCount / 2
          </code>{" "}
          entries make one week, so playoff weeks are derived by comparing the
          week number against{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            matchupPeriodCount
          </code>{" "}
          from the schedule settings. Each matchup card shows total points, a
          category breakdown across seven stat columns, and an animated win
          probability bar using Framer Motion&apos;s{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useSpring
          </code>
          . A shared{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            FantasyNav
          </code>{" "}
          tab bar now links Matchups, League History, and Player Stats so you
          can move between the three ESPN pages without going back to the hub.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Player comparison radar chart
        </h2>
        <p className="text-muted">
          The Player Stats page now has a comparison tool built with{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            recharts
          </code>
          . Two dropdowns let you pick players from the loaded roster, and a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            RadarChart
          </code>{" "}
          plots six dimensions (PTS, REB, AST, STL, BLK, FG%) normalized to a
          0-100 scale where 100 equals twice the league average. The
          normalization lives in{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            fantasyHelpers.ts
          </code>{" "}
          so it can be reused elsewhere. A raw stat table below the chart
          highlights category winners in the same orange/cyan scheme used by the
          matchup cards.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Court Vision heatmap</h2>
        <p className="text-muted">
          An SVG half-court at{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            /fantasy/nba/court-vision
          </code>{" "}
          renders six shooting zones whose fill color maps to FG%: blue for
          cold, yellow for average, red for hot. Each zone is a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            &lt;path&gt;
          </code>{" "}
          with Framer Motion staggered fade-in and a hover tooltip showing the
          exact percentage and attempts per game. The backend endpoint currently
          returns deterministic mock data seeded by player ID because the
          NBA&apos;s{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            shotchartdetail
          </code>{" "}
          endpoint times out from server environments. The response shape is
          ready for a drop-in swap once access is sorted.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Predictions panel</h2>
        <p className="text-muted">
          A &ldquo;Prediction for&rdquo; selector in the matchup toolbar reveals
          a predictions widget below the matchup grid. It has four sections,
          each with a left-border accent heading: Start/Sit recommendations rank
          every rostered player by a projected-points model that factors in
          opponent defensive ranking, with a color-coded confidence bar per row.
          Waiver Wire surfaces bench players from other teams that project
          higher than yours. Weekly Outlook gives a 1-5 star rating and a short
          summary of matchup difficulty. Injury Watch lists anyone on your
          roster with an ESPN injury flag (DTD, OUT, Questionable, Doubtful).
          Everything is algorithmic using a deterministic seeded random so the
          same player always gets the same projection, no external AI involved.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">R3F section models</h2>
        <p className="text-muted">
          Two landing sections now have interactive 3D models: the NBA section
          has a rotating basketball and the auth section has an oscillating
          padlock. Both use{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            @react-three/fiber
          </code>{" "}
          with a shared{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            SectionModelScene
          </code>{" "}
          canvas that sets{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            frameloop=&quot;demand&quot;
          </code>{" "}
          so the GPU only works when OrbitControls or a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useFrame
          </code>{" "}
          animation is active. Each canvas is dynamically imported with{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            ssr: false
          </code>{" "}
          and wrapped in a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            ModelLazyMount
          </code>{" "}
          IntersectionObserver that defers WebGL context creation until the
          section is 200px from the viewport. Remote HDR environment maps were
          replaced with explicit{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            ambientLight
          </code>{" "}
          +{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            directionalLight
          </code>{" "}
          primitives to eliminate the network dependency.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          NBA bleed layout and carousel
        </h2>
        <p className="text-muted">
          The basketball canvas is positioned absolutely with{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            left: &quot;52%&quot;; right: &quot;-20vw&quot;
          </code>{" "}
          so the ball bleeds off the right edge of the viewport, clipped by{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            overflow-x: clip
          </code>{" "}
          on the body. Two non-obvious constraints had to be solved. The text
          content div uses{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            md:w-[52%]
          </code>{" "}
          rather than padding — padding would extend the element&apos;s hit area
          over the canvas, causing text selection on drag. The canvas wrapper is{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            pointer-events-none
          </code>{" "}
          but the R3F{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            Canvas
          </code>{" "}
          sets{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            pointerEvents: &quot;auto&quot;
          </code>{" "}
          explicitly to override the inherited value and give OrbitControls a
          clean event surface.
        </p>
        <p className="mt-3 text-muted">
          Feature highlights are a plain-HTML carousel — not R3F{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            Html
          </code>{" "}
          overlays. Three.js{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            Html
          </code>{" "}
          positions elements in world space, so they orbit with the camera
          rather than staying fixed on screen. The carousel uses{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            AnimatePresence
          </code>{" "}
          for slide transitions and pill-shaped{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            {"<button>"}
          </code>{" "}
          dot indicators — active dot is wider ({" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            w-5
          </code>
          ) via a CSS transition, no JS animation needed.
        </p>
      </section>
    </>
  );
}
