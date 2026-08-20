import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
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
      <WhatsNext
        nowShipped={[
          "Reduced motion as the default rather than a fallback, so the accessible path is the one that runs unless something opts out.",
          "Motion behind components rather than scattered animation calls, which is what makes a policy like that enforceable at all.",
        ]}
        couldImprove={[
          "Adoption is incomplete, though less than I assumed. The 3D scenes animate in a render loop that never touches a motion component, so they answer the preference through their own hook instead — the world already did, the particle lab did not until it was fixed.",
          "There is no test that a new animation went through the components rather than around them.",
        ]}
        upcoming={[
          "A check that any new animated component answers prefers-reduced-motion somehow — through these components or its own hook — since the gap is not knowing, rather than any one page.",
        ]}
      />
    </ThoughtLayout>
  );
}
