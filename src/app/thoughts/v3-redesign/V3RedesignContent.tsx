"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";

/** Dev-notes write-up for the v3 node-graph landing: the design, the physics, and the audit. */
export default function V3RedesignContent() {
  return (
    <ThoughtLayout
      breadcrumb="V3 Redesign"
      title="V3 Redesign: the whole site as a graph"
      intro={
        <>
          v3 drops the scrolling landing for a single interactive node graph:
          every feature and every write-up as a node, wired by category and by
          each feature&rsquo;s own notes. Two views &mdash; a draggable
          force-directed graph and a flat layered one &mdash; and an audit pass
          across performance, engineering, and accessibility.
        </>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">The shape of it</h2>
            <p className="text-muted">
              A central <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">paul-explore</code>{" "}
              root, an <span className="font-semibold text-foreground">Apps</span>{" "}
              hub for the features, and one hub per write-up category. Edges wire
              the trunk (root to hubs), the leaves (hub to its items), and the
              <em className="text-foreground/80"> bridges</em>: a dashed line from
              each feature to its own write-up, built from the{" "}
              <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">thoughtsHref</code>{" "}
              that already lived in the feature data. The graph is derived, not
              hand-authored &mdash; add a feature or a thought and it just
              appears, wired up.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">
              Two views, one data model
            </h2>
            <p className="text-muted">
              The same nodes and edges render two ways. The{" "}
              <span className="font-semibold text-foreground">force</span> view
              is the playground: draggable nodes, a physics settle, hover to
              highlight a node and its neighbours. The{" "}
              <span className="font-semibold text-foreground">flat</span> view is
              the reference: a tidy grouped-column layout (each hub/category a
              column, its items stacked below) that fits on a screen and is easy
              to scan. A switch in the header flips between them; the data layer
              (<code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">graphData.ts</code>)
              is shared, only the layout and rendering differ.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">
              The physics, and why it&rsquo;s hand-rolled
            </h2>
            <p className="text-muted">
              No graph library. The force simulation is ~150 lines of pure
              functions: pairwise repulsion, spring forces along edges, a pull to
              the origin, and a collision pass, all scaled by an{" "}
              <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">alpha</code>{" "}
              that decays so the graph cools and settles. Keeping it pure means
              it&rsquo;s testable and framework-free; the only new dependency is
              GSAP, for the intro reveal and click sparks.
            </p>
            <p className="mt-3 text-muted">
              The nicest decision: the simulation runs in its own abstract
              coordinate space, and the renderer <em className="text-foreground/80">fits</em>{" "}
              that space to the viewport every frame. So &ldquo;use the available
              space&rdquo; and &ldquo;lay out the graph&rdquo; are decoupled
              &mdash; the physics never has to know the screen size, and resizing
              just re-fits.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Performance</h2>
            <ul className="mt-2 space-y-2 text-muted">
              <li>
                <span className="font-semibold text-foreground">The rAF loop sleeps.</span>{" "}
                Ticking stops once the graph settles (alpha hits its floor) and
                restarts on interaction &mdash; no idle CPU burning a battery.
              </li>
              <li>
                <span className="font-semibold text-foreground">React renders once.</span>{" "}
                Positions are written straight to the DOM each frame (node
                transforms and SVG line coordinates via refs), not through React
                state. 57 nodes moving at 60fps would be a re-render storm
                otherwise.
              </li>
              <li>
                <span className="font-semibold text-foreground">No per-frame allocation.</span>{" "}
                The force and radius buffers are allocated once and reused each
                tick instead of a fresh{" "}
                <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">Float64Array</code>{" "}
                per frame, so the collector isn&rsquo;t chasing garbage mid-drag.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">
              The interaction bugs nobody warns you about
            </h2>
            <p className="text-muted">
              Most of the work was in the last 10%. A tour of the gotchas:
            </p>
            <ul className="mt-2 space-y-2 text-muted">
              <li>
                <span className="font-semibold text-foreground">Dragging a link does nothing.</span>{" "}
                The nodes are anchors, so press-drag triggered the browser&rsquo;s
                native link drag and swallowed the pointer gesture. One{" "}
                <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">draggable={"{false}"}</code>{" "}
                and it works.
              </li>
              <li>
                <span className="font-semibold text-foreground">The graph slides out from under the cursor.</span>{" "}
                When you hover a node its neighbours push away, which grows the
                bounding box, which re-fits the whole graph &mdash; moving the
                node you were pointing at. Fix: freeze the fit while
                dragging or focusing, and pin the focused node.
              </li>
              <li>
                <span className="font-semibold text-foreground">Labels overlap even when dots don&rsquo;t.</span>{" "}
                Collision only knew about the circles. Now a labelled node claims
                its (estimated) label width, so label boxes clear each other too.
              </li>
              <li>
                <span className="font-semibold text-foreground">Push first, or highlight first?</span>{" "}
                Highlighting a node and immediately shoving its neighbours felt
                jumpy, so the push waits about half a second &mdash; the
                selection locks in, then the space opens up.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Accessibility</h2>
            <p className="text-muted">
              An interactive canvas is easy to get wrong for keyboard and screen
              reader users, so the audit leaned here:
            </p>
            <ul className="mt-2 space-y-2 text-muted">
              <li>
                Nodes are real links with real text, so they&rsquo;re in the tab
                order, have accessible names, and open on Enter &mdash; dragging
                is a pointer-only enhancement on top. Every node has a visible
                focus ring.
              </li>
              <li>
                Proper landmarks (<code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">main</code>,{" "}
                <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">header</code>,{" "}
                <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">nav</code>) and a single{" "}
                <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">h1</code>; decorative
                layers (background, legend, sparks) are{" "}
                <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">aria-hidden</code>.
              </li>
              <li>
                <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">prefers-reduced-motion</code>{" "}
                gets a static layout with no drift, no physics, and no intro
                animation.
              </li>
              <li>
                The landing passes the automated axe scan at WCAG 2.1 AA with
                zero violations, and axe&rsquo;s stricter
                <em className="text-foreground/80"> best-practice</em> rules too.
                Flipping best-practice on globally flagged a few older routes
                that predate landmark discipline, so that became its own
                follow-up sweep &mdash; the shared test now enforces
                best-practice, and the routes it caught (a couple of{" "}
                <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">/tcg</code>{" "}
                pages, <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">/calendar</code>)
                got their missing landmarks.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Flat, and mobile</h2>
            <p className="text-muted">
              The flat view started life as one enormous horizontal row &mdash;
              technically a graph, practically unreadable and mostly off-screen.
              Grouped columns fixed that on the desktop. On a phone even eight
              columns don&rsquo;t fit, so under 768px the flat view becomes a
              stacked, grouped list &mdash; the same data, laid out for a thumb.
              Since a feature and its write-up often share a name (there&rsquo;s a{" "}
              <span className="font-semibold text-foreground">Calendar</span>{" "}
              feature and a Calendar write-up), the write-ups wear a{" "}
              <span className="rounded-sm bg-foreground/10 px-1 text-[10px] font-semibold uppercase tracking-wide text-foreground/70">
                notes
              </span>{" "}
              tag so they don&rsquo;t read as duplicates.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">What I&rsquo;d do next</h2>
            <p className="text-muted">
              Give the force view a mobile fallback of its own, and animate the
              cross-fade when toggling views. The best-practice a11y sweep across
              the older routes already landed as a follow-up, so the whole site
              holds the higher bar now, not just this page.
            </p>
          </section>
    </ThoughtLayout>
  );
}
