"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

export default function DesignSystemShowcaseThoughtsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Design System Showcase"
      title="Design System Showcase"
      intro={
        <>
          The shared design system already lived in three npm packages and a set
          of thin wrappers, but nobody could <em>see</em> it. This is the story
          of building a live, in-app gallery at <code className={code}>/design-system</code>{" "}
          that renders every primitive for real, lets you play with its props,
          and links out to the pages where it already ships.
        </>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">Why a live showcase</h2>
        <p className="text-muted">
          A design system only pays off when people reach for it instead of
          hand-rolling another button. The write-up on{" "}
          <a href="/thoughts/design-system" className="underline">
            extracting the packages
          </a>{" "}
          explained the plumbing, but plumbing does not convince anyone. What
          convinces people is seeing the real component, poking at it, and
          noticing it already handles the accessibility they were about to
          reinvent.
        </p>
        <p className="mt-3 text-muted">
          So the goal was not a screenshot wall. Every card on the page mounts
          the actual published component from{" "}
          <code className={code}>@/components/ui</code>. If a primitive breaks,
          the showcase breaks — which is exactly the pressure that keeps a
          gallery honest.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">A data-driven catalog</h2>
        <p className="text-muted">
          The page is declarative. A single{" "}
          <code className={code}>catalog.ts</code> lists every primitive with
          its tagline, a usage note, its accessibility guarantees, and the real
          routes it appears on. The page just maps over that data, so adding a
          component is a data edit, not a layout rewrite.
        </p>
        <p className="mt-3 text-muted">
          Keeping it as plain data unlocked the check I cared about most: a test
          asserts the documented set is <strong className="text-foreground">exactly</strong>{" "}
          the set exported from the shared UI barrel. Add a primitive to the
          system and forget to document it, or document one that no longer
          exists, and CI goes red. The gallery can never quietly drift out of
          date.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
          <li>
            <strong className="text-foreground">Integrity</strong>: catalog ids
            line up with barrel exports; every &ldquo;used on&rdquo; link points
            at a real route.
          </li>
          <li>
            <strong className="text-foreground">Snippet builder</strong>: a pure
            function turns playground state into the exact JSX you would write,
            so it is trivially unit tested.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The playground</h2>
        <p className="text-muted">
          The Button playground dogfoods the system to build itself: the
          controls are the design system&rsquo;s own{" "}
          <code className={code}>Select</code>, <code className={code}>Input</code>,
          and <code className={code}>FilterBar</code>. Change the variant, size,
          loading, or disabled state and both the live button and a generated
          code snippet update together. The snippet omits any prop left at its
          default, so what you copy reads like real, minimal code rather than an
          exhaustive prop dump.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Tooltips that teach</h2>
        <p className="text-muted">
          Each card carries two layers of explanation, both built from the
          system&rsquo;s own overlays. An <code className={code}>InfoTip</code>{" "}
          next to the name opens a rich, multi-line note on how and when to reach
          for the component, and the live preview itself is wrapped in a{" "}
          <code className={code}>Tooltip</code> that surfaces a one-line hint on
          hover or focus. Using the real overlays here matters: it proves they
          escape the card&rsquo;s <code className={code}>overflow</code>, open on
          keyboard focus, and dismiss on Escape.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Accessibility as the pitch</h2>
        <p className="text-muted">
          Accessibility is not a section tacked on the end — it is the argument.
          Each card spells out what its primitive guarantees (labelled controls,
          focus rings, focus traps, live regions), and the page ships a{" "}
          <code className={code}>vitest-axe</code> test that fails on any
          violation. The showcase respects{" "}
          <code className={code}>prefers-reduced-motion</code> through the same
          shared hook the rest of the app uses, and the whole thing is keyboard
          traversable end to end.
        </p>
        <p className="mt-3 text-muted">
          The most persuasive line on the page is the one you cannot see: tab
          through it and every control takes focus and shows it. That is the
          whole reason to adopt a system instead of shipping the tenth bespoke
          dropdown.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">What I&rsquo;d revisit</h2>
        <p className="text-muted">
          The catalog validates that links start with a route path, not that the
          route resolves — a future pass could cross-check against the app&rsquo;s
          real route table the way the landing graph test already validates
          category anchors. And the playground only drives Button today; the same
          pattern would extend cleanly to a controls surface per primitive.
        </p>
      </section>
    </ThoughtLayout>
  );
}
