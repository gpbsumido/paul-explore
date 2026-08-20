import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  UpdateTimeline,
  Update,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";

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
          of building a live, in-app gallery at{" "}
          <code className={code}>/design-system</code> that renders every
          primitive for real, lets you play with its props, and links out to the
          pages where it already ships.
        </>
      }
    >
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-08-10-published",
            date: "Aug 10, 2026",
            title: "Following the published package rather than describing it",
          },
        ]}
      />

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
          <code className={code}>@paul-portfolio/react</code>. If a primitive
          breaks, the showcase breaks — which is exactly the pressure that keeps
          a gallery honest.
        </p>
        <p className="mt-3 text-muted">
          That matters because the package is shared. The same primitives back
          this Next.js app, a sibling{" "}
          <strong className="text-foreground">Angular</strong> app, and{" "}
          <strong className="text-foreground">Ketsup</strong>, so a component
          can ship and get adopted in one place before it lands in another. A
          card for a primitive this app hasn&rsquo;t wrapped yet says so
          honestly under <em>Availability</em> instead of inventing an in-app
          link.
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
          asserts the documented set is{" "}
          <strong className="text-foreground">exactly</strong> the component set
          exported from <code className={code}>@paul-portfolio/react</code>{" "}
          (minus the one non-component export, the{" "}
          <code className={code}>cx</code> helper). Add a primitive to the
          package and forget to document it, or document one that no longer
          exists, and CI goes red. This is the check that caught the gallery
          falling behind: the package had grown a{" "}
          <code className={code}>Ticker</code>, a{" "}
          <code className={code}>Card</code>, a{" "}
          <code className={code}>Switch</code> and more, and anchoring the test
          to the package — not this app&rsquo;s thin wrapper barrel — is what
          makes that drift fail loudly instead of going unnoticed.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
          <li>
            <strong className="text-foreground">Integrity</strong>: documented
            components equal the package&rsquo;s exports; every &ldquo;used
            on&rdquo; link is a real route, and every card carries provenance —
            an in-app route or an <em>Availability</em> note.
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
          <code className={code}>Select</code>,{" "}
          <code className={code}>Input</code>, and{" "}
          <code className={code}>FilterBar</code>. Change the variant, size,
          loading, or disabled state and both the live button and a generated
          code snippet update together. The snippet omits any prop left at its
          default, so what you copy reads like real, minimal code rather than an
          exhaustive prop dump.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Tooltips that teach</h2>
        <p className="text-muted">
          An <code className={code}>InfoTip</code> next to each name opens a
          rich, multi-line note on how and when to reach for the component.
          Using the real overlay here matters: it proves the system&rsquo;s own
          popover escapes the card&rsquo;s{" "}
          <code className={code}>overflow</code>, opens on keyboard focus, and
          dismisses on Escape.
        </p>
        <p className="mt-3 text-muted">
          An earlier version also wrapped every live preview in a{" "}
          <code className={code}>Tooltip</code> repeating the tagline. On the
          Tooltip and InfoTip cards — whose previews are themselves an overlay —
          that stacked a second popover on top of the first and read as a
          glitch, and everywhere else it just echoed text already sitting above
          the preview. So it came out. The tagline stays as plain text, the{" "}
          <code className={code}>InfoTip</code> carries the depth, and Tooltip
          is still demonstrated live by its own card. Less is the fix.
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
          route resolves — a future pass could cross-check against the
          app&rsquo;s real route table the way the landing graph test already
          validates category anchors. And the playground only drives Button
          today; the same pattern would extend cleanly to a controls surface per
          primitive.
        </p>
      </section>
      <Update
        id="update-2026-08-10-published"
        date="August 10, 2026"
        title="Following the published package rather than describing it"
      >
        <p>
          A showcase has one failure mode that matters: drifting from the thing
          it documents. A gallery showing how a button looked two releases ago
          is worse than no gallery, because people trust it.
        </p>
        <p>
          So the page renders components straight out of the published{" "}
          <code>@paul-portfolio</code> packages rather than reimplementing them
          for display. Adopting 0.5.0 was then a version bump plus documenting
          what it added, rather than a hunt for every place the showcase kept a
          private copy of a primitive. That is the whole argument for consuming
          your own published artefact instead of importing from source: the
          upgrade tells you what broke.
        </p>
      </Update>
      <WhatsNext
        nowShipped={[
          "The gallery renders the published package rather than a local reimplementation, so it cannot drift from what actually ships.",
          "A props playground per primitive, since the question is usually what a component does under a prop rather than how it looks at rest.",
          "Design tokens shown alongside the components that consume them.",
        ]}
        couldImprove={[
          "Nothing catches visual regressions. The showcase is the obvious place to snapshot, and it does not.",
          "No accessibility check runs per primitive here, even though this is the one place every component is rendered in isolation — the cheapest possible place to run axe.",
          "It documents what exists but not when to use which, so two similar primitives give no guidance on choosing.",
        ]}
        upcoming={[
          "Run axe against every primitive in the gallery. Everything is already rendered in isolation, so it is close to free and would catch regressions at the source rather than once per feature.",
        ]}
      />
    </ThoughtLayout>
  );
}
