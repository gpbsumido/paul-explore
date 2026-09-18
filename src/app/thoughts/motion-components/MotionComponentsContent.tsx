import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { Update, WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import { ChatThread, Timestamp, Sent, Received } from "@/lib/threads";

/** Inline monospace token, matches the code styling used across thoughts pages. */
function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
      {children}
    </code>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
      <span>{children}</span>
    </li>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function MotionComponentsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Motion Components"
      title="Motion Components"
      intro={
        <>
          Three motion-driven surfaces added to the shared design system, and
          the one rule that shaped all of them: the animation is the treat, the
          static version is the contract. Everything works without a single
          moving pixel, then gets richer if the browser and the user allow it.
        </>
      }
      chat={
        <ChatThread>
          <Timestamp>Today 9:14 AM</Timestamp>

          <Received pos="first">saw the new tilt card thing</Received>
          <Received pos="last">
            the one that leans toward the mouse with the shine on it
          </Received>

          <Sent pos="first">
            yeah, TiltCard. it reads the pointer position, maps it to a rotate
            on two axes, and moves a glare highlight to follow the cursor.
            pointer-only though
          </Sent>
          <Sent pos="last">
            keyboard users never trigger it, and reduced-motion flattens it to a
            plain static card. no tilt, no glare
          </Sent>

          <Received>
            so did you write the reduced-motion check three times, once per
            component
          </Received>

          <Sent pos="first">
            no. that was the refactor. i pulled it into one exported hook,
            usePrefersReducedMotion, and moved the Ticker onto it too so
            there&apos;s one source of truth
          </Sent>
          <Sent pos="last">
            GradientBackground doesn&apos;t even need it in JS, the animation is
            pure CSS and a media query just stops it. no javascript runs for
            that one at all
          </Sent>

          <Received>and the spotlight one?</Received>

          <Sent pos="first">
            soft radial glow that chases the cursor. under reduced motion it
            pins to center and stops tracking, so it&apos;s a static vignette
            instead of a moving one
          </Sent>
          <Sent pos="last">
            all three take children and are SSR-stable, so they&apos;re just
            backgrounds you wrap around anything. tokens fill in the colors if
            you don&apos;t pass your own
          </Sent>

          <Received>tests?</Received>

          <Sent pos="last">
            red-green per component, plus axe on all three. 146 in the react
            package, 139 in css. angular ports deferred, same as the last few
          </Sent>
        </ChatThread>
      }
    >
      <Section title="What shipped">
        <p className="mb-3 text-muted">
          Three content-agnostic surfaces landed in <C>@paul-portfolio/css</C>{" "}
          and <C>@paul-portfolio/react</C>, plus a shared-hook refactor. Each
          one wraps arbitrary <C>children</C> and is stable on the server, so
          they behave like backgrounds you drop around any content.
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            <strong className="text-foreground">TiltCard</strong> — a 3D surface
            that tilts toward the pointer with a cursor-tracking glare
            highlight. Props: <C>maxTilt</C>, <C>glare</C>.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">GradientBackground</strong> — a
            flowing multi-stop gradient, animated entirely in CSS. Props:{" "}
            <C>colors</C>, <C>angle</C>, <C>speed</C>, <C>animate</C>; falls
            back to the brand token palette.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">Spotlight</strong> — a soft
            radial glow that follows the cursor across a background. Props:{" "}
            <C>size</C>, <C>color</C>.
          </Bullet>
        </ul>
      </Section>

      <Section title="Reduced motion is the default, not a fallback">
        <p className="mb-3 text-muted">
          The rule for all three: the static version is the contract, and the
          motion is the enhancement layered on top. If the browser or the user
          says no to movement, what&apos;s left still works and still looks
          intentional.
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            <strong className="text-foreground">TiltCard</strong> flattens to a
            plain static card — no rotation, no glare.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">Spotlight</strong> pins its glow
            to the center and stops tracking the cursor, so it reads as a static
            vignette.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">GradientBackground</strong> is
            the cleanest case: the animation is a CSS keyframe gated behind{" "}
            <C>prefers-reduced-motion</C>, so it goes static with{" "}
            <em>no JavaScript running at all</em>.
          </Bullet>
        </ul>
      </Section>

      <Section title="Pointer, not keyboard">
        <p className="mb-3 text-muted">
          TiltCard and Spotlight react to the pointer, and only the pointer.
          There&apos;s a real accessibility reason for that line: yanking a
          card&apos;s rotation or throwing a glow around on focus would be
          distracting noise for someone navigating by keyboard, and it&apos;d
          fight assistive tech for attention.
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            Keyboard users are simply unaffected — the surfaces sit still and
            let the content take focus normally.
          </Bullet>
          <Bullet>
            Every component ships with an axe a11y test alongside its unit
            tests, so the accessible-by-default promise is asserted, not
            assumed.
          </Bullet>
        </ul>
      </Section>

      <Section title="One hook, shared across every animation">
        <p className="mb-3 text-muted">
          The obvious trap was three copies of the same reduced-motion listener.
          Instead the check became a single exported hook,{" "}
          <C>usePrefersReducedMotion</C>, and the existing <C>Ticker</C> was
          refactored onto it too.
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            One source of truth for &quot;should this move?&quot; means a fix to
            the media-query handling lands everywhere at once.
          </Bullet>
          <Bullet>
            It&apos;s exported from the package, so anything built on top of the
            design system gets the same behavior for free.
          </Bullet>
        </ul>
      </Section>

      <Section title="Verification and housekeeping">
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            TDD per component: CSS and React tests written first, each cycle
            going red then green.
          </Bullet>
          <Bullet>
            <C>packages/react</C>: 146 tests passing (unit + axe for all three).{" "}
            <C>packages/css</C>: 139 tests passing. The React build runs a clean{" "}
            <C>tsc</C> typecheck.
          </Bullet>
          <Bullet>
            Storybook stories added for each component, and versions bumped:{" "}
            <C>@paul-portfolio/css</C> 0.4.5→0.4.6, <C>@paul-portfolio/react</C>{" "}
            0.4.4→0.4.5, with a changelog entry.
          </Bullet>
          <Bullet>
            Angular ports deferred — the same call made for Select, FilterBar,
            and Ticker. The React and CSS surfaces come first; Angular follows
            when there&apos;s demand.
          </Bullet>
        </ul>
      </Section>

      <Section title="The takeaway">
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            Motion that can&apos;t be turned off isn&apos;t a feature, it&apos;s
            a liability. Designing the static state first makes reduced-motion
            trivial instead of an afterthought.
          </Bullet>
          <Bullet>
            When three components need the same environmental check, that check
            wants to be one shared, tested hook — not three quietly-drifting
            copies.
          </Bullet>
        </ul>
      </Section>
      <Update
        id="update-2026-09-18-reactbits-originkit"
        date="September 18, 2026"
        title="Twenty effects from ReactBits and OriginKit, rebuilt so the library still costs nothing to install"
      >
        <p>
          Three surfaces became twenty. I went through the components I liked on
          ReactBits and OriginKit and rebuilt the ones I wanted into the design
          system &mdash; sparks, blur reveals, star borders, a liquid-glass
          surface, a segmented control that rubber-bands, a lattice loader, a
          drifting 3D wall, galleries, hero compositions, particle text. The
          hard rule the whole batch had to obey: a consumer who imports a Button
          shouldn&rsquo;t pay for any of it.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Reimplement, don&rsquo;t install.
        </h3>
        <p className="text-muted">
          The originals reach for libraries; the point of putting them in the
          system is that mine don&rsquo;t. Each effect is a small React
          component plus a token-driven stylesheet, and the animated parts are
          CSS the tokens already describe. The star border, for instance, is a
          conic gradient that takes its colour from <code>currentColor</code>,
          so a caller tints it by setting the text colour &mdash; no prop, no
          config, no dependency.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`.star-border__ring {
  background: conic-gradient(from 0deg,
    transparent, currentColor, transparent, currentColor, transparent);
  animation: paul-star-spin 4s linear infinite;
}`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The WebGL ones became CSS.
        </h3>
        <p className="text-muted">
          A few originals are fragment shaders or WebGL scenes &mdash; a light
          bloom, a circular gallery. Pulling a renderer into a design system to
          reproduce them exactly would break the rule above, so I reinterpreted
          them: the bloom is a breathing radial gradient whose origin chases the
          pointer, and the circular gallery is a <code>preserve-3d</code>{" "}
          cylinder you spin with a drag. Not pixel-identical to a shader, but the
          same idea with nothing to download.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`// each card sits on the cylinder; the ring rotates in a rAF loop
transform: rotateY(i * angleStep) translateZ(radius);`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Canvas without a dependency, and a guard for the corners.
        </h3>
        <p className="text-muted">
          Where an effect genuinely needs a canvas &mdash; particle text
          assembling out of a cloud &mdash; the browser&rsquo;s built-in 2D
          canvas does it, so there&rsquo;s still nothing to install. And once
          every surface had rounded corners, I wanted them to be the Apple
          squircle rather than a plain arc, everywhere and on purpose. A base
          rule sets <code>corner-shape: squircle</code> system-wide, and a test
          fails the build if any component ships a radius without a deliberate
          corner shape beside it.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`// every rule with a border-radius must also declare a corner-shape;
// a full-round radius must stay round, not a squircle of a circle
if (!shape) missing.push(rule);
expect(missing).toEqual([]);`}
        </pre>
      </Update>

      <Update
        id="update-2026-09-18-corner-coverage"
        date="September 18, 2026"
        title="The corner rule existed, but half the entry points missed it"
      >
        <p>
          I added a global squircle rule and tested that it existed. That proved
          the declaration was in a file, not that the components imported it.
          The components-only entry deliberately skips base.css, so buttons,
          inputs, and cards used through that entry kept ordinary rounded corners.
        </p>
        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The failing test needed to follow the public entry point.
        </h3>
        <p className="text-muted">
          I replaced the base-file presence check with an AST audit of every
          radius in the exported component styles. It found 68 declarations
          without a corner shape. Each component now carries its own shape;
          circles and capsules explicitly stay round, while overlays inherit.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`FAIL src/components/__tests__/squircle.test.ts
AssertionError: expected [ …(68) ] to deeply equal []

/* Components-only consumers now receive both declarations. */
.btn {
  border-radius: var(--paul-radius-md);
  corner-shape: squircle;
}`}
        </pre>
        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The liquid button keeps its velocity when the pointer reverses.
        </h3>
        <p className="text-muted">
          The unfinished button used a radial CSS mask and an always-running
          animation loop. I replaced it with a subtractive SVG mask and separate
          critically damped springs for position and radius. New input changes
          the target without discarding velocity. The loop stops at rest and
          cancels when the component unmounts, becomes disabled, or reduced
          motion is enabled. Keyboard activation stays native.
        </p>
        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The hero is a composition, so the copy and actions stay in charge.
        </h3>
        <p className="text-muted">
          Hero06 arranges supplied images in a spiral; Hero13 uses CSS perspective
          to interpret the public OriginKit poster. Both accept copy, navigation,
          and action slots. The pointer moves only the decorative gallery by at
          most ten pixels, and reduced motion keeps it still. Missing imagery
          never removes the heading or actions. These are original token-based
          interpretations, not imports of the vendor runtime.
        </p>
        <p className="mt-3 text-muted">
          The implementation and verification live in{" "}
          <a className="text-primary-600 hover:underline dark:text-primary-400"
            href="https://github.com/gpbsumido/paul-design-system/pull/91">
            paul-design-system PR 91
          </a>. Native corner-shape support is still required for continuous
          corners; unsupported browsers retain border-radius. A green source
          test does not turn that into universal browser support, and an open PR
          is not a deployed update.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "Reduced motion as the default rather than a fallback, so the accessible path is the one that runs unless something opts out.",
          "Motion behind components rather than scattered animation calls, which is what makes a policy like that enforceable at all.",
          "A batch of twenty effect components rebuilt from ReactBits and OriginKit onto the tokens — sparks, blur reveals, star borders, liquid glass, a rubber-band segmented control, a lattice loader, a drifting 3D wall, galleries, hero compositions, particle text — none of which add a runtime dependency.",
          "Squircle corners system-wide via a base rule, with a guard test that fails the build if a component ships a radius without a deliberate corner shape.",
        ]}
        couldImprove={[
          "Adoption is incomplete, though less than I assumed. The 3D scenes animate in a render loop that never touches a motion component, so they answer the preference through their own hook instead — the world already did, the particle lab did not until it was fixed.",
          "There is no test that a new animation went through the components rather than around them.",
        ]}
        upcoming={[
          "Review the liquid button, portrait sections, and component corner fix in paul-design-system PR 91 before merging and releasing. Seven renderer/library-heavy effects remain deferred; no new WebGL, physics, or icon dependency was added.",
          "A check that any new animated component answers prefers-reduced-motion somehow — through these components or its own hook — since the gap is not knowing, rather than any one page.",
        ]}
      />
    </ThoughtLayout>
  );
}
