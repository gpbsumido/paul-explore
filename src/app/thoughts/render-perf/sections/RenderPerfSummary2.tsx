/** RenderPerf write-up summary. */
export function RenderPerfSummary2() {
  return (
    <>
      <section>
        <h2 className="mb-3 text-lg font-bold">
          Learn pages code-split with dynamic imports
        </h2>
        <p className="text-muted">
          All 13 learn topic pages eagerly imported their full content component
          (500-1400 lines each, 13k lines total). Since{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            page.tsx
          </code>{" "}
          is a server component that rendered the client component directly,
          Next.js bundled the entire content component into the route chunk
          &mdash; all demo logic, SVG data, and animation code downloaded before
          anything appeared.
        </p>
        <p className="mt-3 text-muted">
          Each page now wraps its content in{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            next/dynamic
          </code>{" "}
          with{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            ssr: false
          </code>
          . The content components are entirely interactive and require
          client-side JavaScript anyway, so there&apos;s no SEO cost. The route
          chunk now contains only metadata, and the heavy content loads
          asynchronously.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          React.memo on frequently-rerendering list items
        </h2>
        <p className="text-muted">
          Three list-item components were missing{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            React.memo
          </code>
          : the operator dashboard&apos;s{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            StoreCard
          </code>
          , the TCG browser&apos;s{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            CardTile
          </code>
          , and the GraphQL grid&apos;s{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            PokemonCard
          </code>
          .
        </p>
        <p className="mt-3 text-muted">
          The operator dashboard polls every 30 seconds. When the parent
          re-renders with fresh data, all 4+ store cards reconcile even if only
          one store&apos;s data changed. Similarly, when the TCG browser loads
          the next page, every card on every previous page re-renders because
          the parent state changed.
        </p>
        <p className="mt-3 text-muted">
          Wrapping each in{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            React.memo
          </code>{" "}
          lets React skip reconciliation for items whose props haven&apos;t
          changed. The calendar components already used memo correctly &mdash;
          these three were the gaps.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          whileHover object literals hoisted to module scope
        </h2>
        <p className="text-muted">
          Each of the 11{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            FeatureCard
          </code>{" "}
          instances passed an inline object to Framer Motion&apos;s{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            whileHover
          </code>{" "}
          prop:{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            {`{{ y: -4, transition: { ...spring.snappy } }}`}
          </code>
          . Every render created a new object and spread{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            spring.snappy
          </code>{" "}
          into a new transition object. Framer Motion internally diffs gesture
          handler objects to detect changes, so 11 fresh objects meant 11
          unnecessary diffs per render.
        </p>
        <p className="mt-3 text-muted">
          The fix: extract to a single module-level constant{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            HOVER_ANIMATION
          </code>
          . One allocation at module load, stable reference across all renders
          and all card instances.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          WebGL context lifecycle: bidirectional unmount
        </h2>
        <p className="text-muted">
          The landing page can have up to 7 separate R3F Canvas instances
          &mdash; one per section model. While{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            ModelLazyMount
          </code>{" "}
          deferred creation and{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            PauseWhenOffscreen
          </code>{" "}
          paused rendering, each context still consumed GPU memory for its
          framebuffer even when paused. Browsers limit WebGL contexts to roughly
          8&ndash;16 before evicting old ones. On mobile devices with stricter
          limits (often 4&ndash;8), scrolling the full page could trigger
          context loss events &mdash; models flickering or going black.
        </p>
        <p className="mt-3 text-muted">
          The previous{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            ModelLazyMount
          </code>{" "}
          was one-shot: it mounted on first intersection and never unmounted.
          The fix makes it bidirectional. It now uses a single
          IntersectionObserver with a 1000px root margin. When the container
          enters that margin the canvas mounts; when it leaves, the canvas
          unmounts and the WebGL context is released. The hero globe stays
          always-mounted (it&apos;s the first thing users see), so the worst
          case is 1 permanent context plus at most 2&ndash;3 nearby section
          contexts &mdash; well within every device&apos;s limit.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Skipped: framer-motion bundle weight (41 imports)
        </h2>
        <p className="text-muted">
          The review flagged that 41 components import from{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            framer-motion
          </code>{" "}
          (~32kb gzipped). Because it&apos;s imported in the root layout&apos;s
          providers and in so many leaf components, it&apos;s in the shared
          chunk and loaded on every page. Pages like{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            /learn/two-pointers
          </code>{" "}
          pull in the full motion library for just fadeInUp entrance animations
          that could be CSS.
        </p>
        <p className="mt-3 text-muted">
          The potential fix would be CSS{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            @starting-style
          </code>{" "}
          transitions or Framer Motion&apos;s{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            m
          </code>{" "}
          +{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            LazyMotion
          </code>{" "}
          pattern to tree-shake unused features. But the tradeoff doesn&apos;t
          justify the churn: refactoring 41 files for a library that&apos;s
          already in the shared chunk of a portfolio site. The cost is paid once
          on first load and cached. Leaving this as a documented decision rather
          than a fix.
        </p>
        <p className="mt-3 text-muted">
          <span className="font-semibold text-foreground">
            Since reversed, and the measurement is the point.
          </span>{" "}
          The sweep did land later, during the{" "}
          <a
            href="/thoughts/react-doctor"
            className="underline underline-offset-2 hover:text-foreground"
          >
            React Doctor pass
          </a>
          . It moved total client JS by about 2.8&nbsp;KB gzipped, roughly 0.1%
          &mdash; so the call above was right about the size of the prize and
          wrong only about whether it was worth doing anyway. Worth leaving both
          halves here: the reasoning for skipping it was sound, and the number
          that came out the other side is the thing that settles it.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Empty array reference stability in operator hooks
        </h2>
        <p className="text-muted">
          All four operator hooks (
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useOperatorStores
          </code>
          ,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useOperatorAlerts
          </code>
          ,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useOperatorInventory
          </code>
          ,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useOperatorActivity
          </code>
          ) used{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            data ?? []
          </code>{" "}
          as a fallback during loading. The inline{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            []
          </code>{" "}
          creates a new array reference on every render when{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            data
          </code>{" "}
          is{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            undefined
          </code>
          . Any consumer using the result in a dependency array or memo
          comparison sees a &ldquo;change&rdquo; on every render during the
          loading phase.
        </p>
        <p className="mt-3 text-muted">
          The fix: each hook now has a module-level typed{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            EMPTY
          </code>{" "}
          constant. Same stable reference across all renders, no unnecessary
          downstream re-renders during initial load.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          HeroSection inline style objects hoisted
        </h2>
        <p className="text-muted">
          The hero section had three inline style objects that depended on the
          current theme (dark vs light): the radial vignette gradient, the H1
          text-shadow, and the subtitle text-shadow. Each created a new object
          reference on every render, triggering Framer Motion&apos;s internal
          prop diffing unnecessarily.
        </p>
        <p className="mt-3 text-muted">
          The fix: six module-level constants (dark and light variants for
          each). The component selects the right one with a ternary. Stable
          references, zero allocations per render.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Learn page intervals paused in background tabs
        </h2>
        <p className="text-muted">
          Nine learn pages use{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            setInterval
          </code>{" "}
          for their &ldquo;Play&rdquo; auto-step feature (15 intervals total
          across demos like binary search, sliding window, trees, etc.). All
          properly clear intervals via refs, but none paused when the tab was
          hidden. A user clicking Play and switching tabs would have the
          animation silently complete in the background.
        </p>
        <p className="mt-3 text-muted">
          The fix: a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            document.hidden
          </code>{" "}
          guard at the top of each interval callback. When the tab is hidden the
          callback returns immediately, skipping the step advancement. The
          interval keeps ticking (so cleanup is unchanged) but no state updates
          fire until the user is actually watching.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">What&apos;s next</h2>
        <p className="text-muted">
          The review identified additional rendering optimizations still to be
          addressed. These will be documented here as they land.
        </p>
      </section>
    </>
  );
}
