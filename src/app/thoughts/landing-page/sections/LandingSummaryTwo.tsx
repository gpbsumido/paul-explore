/** Landing-page write-up summary (second half). */
export function LandingSummaryTwo() {
  return (
    <>
      <section>
        <h2 className="mb-3 text-lg font-bold">Auth section padlock</h2>
        <p className="text-muted">
          The lock model sits centered at the bottom of the auth section — below
          the text and code snippet. It uses a pendulum animation: a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useFrame
          </code>{" "}
          callback drives{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            rotation.y = Math.sin(elapsed * 0.35) * 0.45
          </code>{" "}
          on an outer group (±26° at 0.35 Hz), while a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            {"<Float>"}
          </code>{" "}
          inside adds a slow vertical bob with no additional rotation.
          OrbitControls remains active so users can drag to inspect the model;
          autoRotate is off to avoid conflicting with the pendulum.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Draco, CSP, and the loader cache
        </h2>
        <p className="text-muted">
          Both GLBs were exported with Draco mesh compression (
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            KHR_draco_mesh_compression
          </code>
          ), which requires a WASM decoder at runtime. That decoder needs{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            &apos;wasm-unsafe-eval&apos;
          </code>{" "}
          in{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            script-src
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            blob:
          </code>{" "}
          in{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            img-src
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            connect-src
          </code>{" "}
          (Three.js creates blob URLs for embedded textures). Rather than carry
          that CSP surface area, the GLBs were stripped of compression using{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            @gltf-transform/core
          </code>{" "}
          +{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            draco3d
          </code>{" "}
          as a one-time offline step. The uncompressed files load with the
          default{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            GLTFLoader
          </code>{" "}
          and no runtime decoder.
        </p>
        <p className="mt-3 text-muted">
          One last catch: Three.js&apos;s loader cache (
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            THREE.Cache
          </code>
          ) keys entries by URL. Earlier failed decode attempts left stale error
          entries under{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            /models/basketball.glb
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            /models/lock.glb
          </code>
          . Even after the files were fixed, the cache returned the old failure.
          Adding{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            ?v=2
          </code>{" "}
          to both URLs gave each a fresh cache key without touching the files on
          disk.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">GraphQL and Vitals 3D models</h2>
        <p className="text-muted">
          Two more sections got R3F models in Phase 5. The GraphQL section uses
          a procedural model: the official GraphQL logo — a regular hexagon
          outer ring plus an equilateral triangle connecting every other vertex
          (12, 4, and 8 o&apos;clock). Six sphere nodes sit at each hex vertex,
          all in{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            #e535ab
          </code>{" "}
          — the GraphQL brand pink. The canvas renders full-bleed at 30% CSS
          opacity so it acts as a depth layer behind the query inspector and
          text rather than competing with it. Because the cluster rotates
          continuously,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            frameloop=&quot;always&quot;
          </code>{" "}
          is required (demand mode would never re-render). The canvas is{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            pointer-events: none
          </code>{" "}
          — no hotspot interactivity; the three feature cards in the section
          cover the same information.
        </p>
        <p className="mt-3 text-muted">
          The Vitals section loads a speedometer GLB with an animated needle
          that lerps from a resting angle to the &ldquo;good&rdquo; zone on
          scroll entry via{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useFrame
          </code>
          . The layout was restructured: speedometer canvas centered at the top
          (360px tall, max-width 520px), three primary stat cards (LCP, INP,
          CLS) in a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            grid-cols-3
          </code>{" "}
          row below, then the existing feature highlights and CTA.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Box3 auto-fit for extreme coordinate models
        </h2>
        <p className="text-muted">
          The speedometer GLB loaded (Suspense resolved, no more orange sphere)
          but was invisible — only the hotspot dots were visible. Inspecting the
          GLB revealed bounding box coordinates like X:&nbsp;&#8722;30000 to
          8000, Z:&nbsp;&#8722;63000 to &#8722;24000. The model existed miles
          from the camera at any fixed scale value.
        </p>
        <p className="mt-3 text-muted">
          The fix is a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            Box3
          </code>{" "}
          auto-fit run in{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useEffect
          </code>{" "}
          after the cloned scene is available. Compute the bounding box, extract
          size and center, then set{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            group.scale = TARGET_SIZE / maxDimension
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            group.position = -center * scale
          </code>
          . The model now centers at the world origin regardless of its native
          coordinate system — a general-purpose pattern for any GLB with unknown
          units.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Speedometer Draco issue and ?v=3
        </h2>
        <p className="text-muted">
          The speedometer GLB initially showed the orange Suspense fallback
          sphere. Same symptom as the basketball and lock models — but a
          different root cause. The file had previously been optimized with{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            gltf-transform optimize
          </code>{" "}
          which applies Draco compression by default, compressing the 55KB raw
          file down to 5.5KB. The project intentionally avoids Draco to keep the
          CSP clean (no{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            wasm-unsafe-eval
          </code>
          , no{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            blob:
          </code>
          ), so{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            GLTFLoader
          </code>{" "}
          had no decoder and silently fell back to the Suspense fallback. Fix:{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            gltf-transform optimize --compress false
          </code>
          , producing a 45KB plain GLB. Bumping the URL from{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            ?v=2
          </code>{" "}
          to{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            ?v=3
          </code>{" "}
          cleared the stale entry from{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            THREE.Cache
          </code>{" "}
          and the browser HTTP cache — same cache-bust pattern as the earlier
          models.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Polish and micro-interactions
        </h2>
        <p className="text-muted">
          A quality pass across all fantasy pages. A{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useCountUp
          </code>{" "}
          hook animates numbers from zero using{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            requestAnimationFrame
          </code>{" "}
          with ease-out cubic easing, and skips the animation entirely when the
          user has{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            prefers-reduced-motion
          </code>{" "}
          enabled. The Player Stats table gained an FPT column for fantasy
          points. Responsive fixes include a horizontally scrollable prediction
          table, overflow-safe nav tabs, and 44px touch targets on mobile.
          Accessibility additions: aria-live regions on all main content areas,
          aria-labels on interactive controls, and a labeled fantasy nav
          landmark. Matchups and Court Vision now have cards in the feature hub
          with mini preview components.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Phase 6 — performance hardening
        </h2>
        <p className="text-muted">
          With all seven section models working, the final phase locked down
          idle behavior and accessibility. Three problems needed solving: the
          always-on canvases burning GPU while scrolled away, Float and
          auto-rotation running regardless of motion preferences, and touch
          users triggering model rotation when they meant to scroll the page.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Pause on scroll-out</h2>
        <p className="text-muted">
          The existing{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            ModelLazyMount
          </code>{" "}
          component defers canvas mount until the user is 200px from the section
          — a one-shot observer that disconnects after first intersection. But
          once mounted, the canvases continued rendering even when scrolled far
          away. The hero globe and GraphQL cluster both run{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            frameloop=&quot;always&quot;
          </code>
          , which means a continuous{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            requestAnimationFrame
          </code>{" "}
          loop even when nothing is visible.
        </p>
        <p className="mt-3 text-muted">
          The fix is a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            PauseWhenOffscreen
          </code>{" "}
          R3F scene component that attaches an{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            IntersectionObserver
          </code>{" "}
          directly to{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            gl.domElement
          </code>{" "}
          — the actual{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            {"<canvas>"}
          </code>{" "}
          element. When the canvas exits the viewport it calls{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            set({"{ frameloop: 'never' }"})
          </code>{" "}
          on the R3F store, which stops the animation loop entirely. When the
          canvas comes back into view, it restores the original frameloop. R3F
          subscribes to store state changes and adjusts the underlying{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            gl.setAnimationLoop
          </code>{" "}
          call accordingly.
        </p>
        <p className="mt-3 text-muted">
          The observer uses{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            rootMargin: &quot;0px&quot;
          </code>{" "}
          so it fires exactly when the canvas element exits the viewport — not
          200px before, which is what{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            ModelLazyMount
          </code>{" "}
          uses for its lookahead. Two observers, two jobs, one each.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Reduced motion and mobile guards
        </h2>
        <p className="text-muted">
          The{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            Float
          </code>{" "}
          component from Drei gives models a gentle idle bob. Four models use
          it: basketball, padlock, clock, and speedometer. The straightforward
          thing is to pass{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            speed={"{0}"}
          </code>{" "}
          when reduced motion is requested — Float still runs its useFrame loop,
          just with zero time advancement. Better to skip the Float wrapper
          entirely so the useFrame callback is never registered at all.
        </p>
        <p className="mt-3 text-muted">
          Each model that uses Float now computes a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            disableFloat
          </code>{" "}
          boolean and conditionally renders either the Float-wrapped content or
          the raw content. Same JSX tree inside, different outer wrapper. The
          check covers both{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            prefers-reduced-motion
          </code>{" "}
          and a mobile breakpoint — Float at 1x DPR on a small screen is wasted
          work since the motion is barely perceptible anyway.
        </p>
        <p className="mt-3 text-muted">
          A note on framer-motion inside R3F: R3F uses{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            react-reconciler
          </code>{" "}
          to create a separate fiber tree for the canvas. Framer Motion&apos;s{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useReducedMotion
          </code>{" "}
          reads from its internal{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            MotionConfigContext
          </code>
          , which isn&apos;t propagated into R3F&apos;s fiber. Models read{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            window.matchMedia(&quot;(prefers-reduced-motion: reduce)&quot;)
          </code>{" "}
          directly — same underlying browser API, no context dependency.
          Standard React hooks (useState, useEffect) work fine inside R3F
          components since those operate through React&apos;s dispatcher, not
          the host element type system.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Touch controls</h2>
        <p className="text-muted">
          OrbitControls defaults to one-finger rotate on touch. A user scrolling
          the page with a single finger would accidentally spin whichever model
          their finger crossed. The fix: map the ONE-finger touch action to PAN
          (which is disabled via{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            enablePan={"{false}"}
          </code>
          ) so single-touch does nothing. TWO-finger gestures use{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            DOLLY_ROTATE
          </code>{" "}
          — with zoom disabled that reduces to pure rotation, letting users
          deliberately spin a model with two fingers without triggering page
          pinch-zoom.
        </p>
        <p className="mt-3 text-muted">
          The Drei OrbitControls component exposes the{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            touches
          </code>{" "}
          property from THREE&apos;s OrbitControls, but JSX prop types can vary
          across drei versions. Setting it imperatively via ref in a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useEffect
          </code>{" "}
          is the safe fallback that works regardless.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Why weather + 3D models together
        </h2>
        <p className="text-muted">
          The weather canvas started as the sole atmospheric layer — a single
          full-bleed 2D canvas filling the page background with rain, snow, or
          sun based on the visitor&apos;s location. It does its job, but weather
          alone is passive. You watch it; it doesn&apos;t know you&apos;re
          there.
        </p>
        <p className="mt-3 text-muted">
          The 3D models invert that. They respond to cursor drag, show hotspot
          tooltips on hover, animate on scroll entry. They&apos;re foreground
          interactive content, not background decoration. The basketball feels
          like you can pick it up and inspect it.
        </p>
        <p className="mt-3 text-muted">
          Both together is better than either alone because they occupy
          different perceptual layers. The weather canvas provides ambient depth
          — your eye reads it as &quot;the environment the content lives
          in.&quot; The 3D models live in that environment as objects you
          interact with. The visual hierarchy is atmospheric layer → section
          card → 3D model → hotspot, each at a different Z-depth in both the
          literal stacking context and the user&apos;s attention.
        </p>
        <p className="mt-3 text-muted">
          One concern was performance: two graphics systems running
          simultaneously. The answer is that they don&apos;t actually overlap in
          time. The weather canvas is a 2D{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            {"<canvas>"}
          </code>{" "}
          painted by a wave-propagation loop in software; the 3D models are
          WebGL rendered through R3F. They run on separate contexts with
          separate paint cycles. The 2D canvas is CPU-bound; the WebGL canvases
          hand off to the GPU. Neither waits for the other.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          frameloop=&quot;demand&quot; + IntersectionObserver — the full picture
        </h2>
        <p className="text-muted">
          The landing page now has seven WebGL contexts: one hero globe, one
          GraphQL cluster, one vitals speedometer, and four section canvases
          (NBA, auth, calendar, TCG, and vitals again). Without lifecycle
          management this would be expensive. The actual cost per idle canvas is
          zero because of two compounding guards.
        </p>
        <p className="mt-3 text-muted">
          Guard one:{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            ModelLazyMount
          </code>
          . The WebGL context doesn&apos;t even exist until the section is 200px
          from the viewport. Every section below the fold has no canvas, no
          context, no memory until the user scrolls near it.
        </p>
        <p className="mt-3 text-muted">
          Guard two:{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            frameloop=&quot;demand&quot;
          </code>{" "}
          on the four section canvases. R3F only renders a frame when{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            invalidate()
          </code>{" "}
          is called — which happens when the user drags OrbitControls or when a
          Float animation emits. A section that&apos;s mounted but not
          interacted with does not paint.
        </p>
        <p className="mt-3 text-muted">
          Guard three:{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            PauseWhenOffscreen
          </code>{" "}
          on all seven canvases. When the user scrolls past a section, the
          observer fires, frameloop switches to{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            &quot;never&quot;
          </code>
          , and the animation loop stops completely. The WebGL context is still
          alive (no allocation/deallocation churn), but the RAF stops. The
          always-on canvases (hero, GraphQL, vitals) are the ones that actually
          needed this: they have no demand trigger, so without the pause
          they&apos;d spin forever at 60fps even while five other sections are
          in view.
        </p>
        <p className="mt-3 text-muted">
          In practice: at any scroll position, at most two or three canvases are
          active. The section currently centered on screen has its canvas
          rendering. Sections 200px above or below have their canvas mounted but
          paused. Everything else has no canvas at all. The page feels alive
          everywhere you look, but the hardware work is proportional to
          what&apos;s actually visible.
        </p>
      </section>
    </>
  );
}
