import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

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

export default function AppleDesignContent() {
  return (
    <ThoughtLayout
      breadcrumb="Apple Design"
      title="An Apple-design pass across the whole app"
      intro={
        <>
          I took a set of Apple&rsquo;s interface principles &mdash; the WWDC
          &ldquo;fluid interfaces&rdquo; talks, translated to the web &mdash;
          and audited the whole site against them, then fixed the gaps. The
          interesting part wasn&rsquo;t the motion polish. It was finding that a
          site built entirely on frosted glass honoured none of the
          accessibility settings that glass is supposed to respect.
        </>
      }
    >
      <Section title="Audit first, in parallel">
        <p>
          I split the read across three passes &mdash; motion and interaction,
          materials and reduced-motion, typography and foundations &mdash; each
          producing findings tied to real files, not generic advice. The point
          of writing it down first was to separate the real defects from the
          things that were already fine, because a lot of it was already fine:
          reduced-motion is genuinely first-class here, the{" "}
          <Link href="/gallery-wall" className="underline underline-offset-2">
            gallery-wall
          </Link>{" "}
          drag respects the grab offset, and no CSS animation is ever put on a
          grabbable element. The audit is what let me spend the fix budget on
          the gaps instead of re-touching good code.
        </p>
      </Section>

      <Section title="The glass ignored three accessibility settings">
        <p>
          This was the real finding. The app leans hard on translucent
          surfaces, and it responded to <C>prefers-reduced-motion</C> everywhere
          &mdash; but <C>prefers-reduced-transparency</C> and{" "}
          <C>prefers-contrast</C> were handled in exactly zero places. Someone
          who turns on Reduce Transparency because blur makes text hard to read
          got&hellip; all the blur, untouched.
        </p>
        <ul className="mt-3 space-y-2">
          <Bullet>
            Under <C>prefers-reduced-transparency: reduce</C> the glass and modal
            tokens go opaque, and the blur is stripped &mdash; including off the
            chrome that sets <C>backdrop-filter</C> as an inline style, where an{" "}
            <C>!important</C> author rule outranks a non-important inline
            declaration. That last detail is why a pure token swap
            wasn&rsquo;t enough.
          </Bullet>
          <Bullet>
            Under <C>prefers-contrast: more</C> the faint borders (a lot of the
            UI is <C>border-foreground/10</C>) and muted text strengthen.
          </Bullet>
          <Bullet>
            Switching theme used to snap the whole viewport from paper-white to
            near-black in one frame. It now eases &mdash; but gated behind{" "}
            <C>prefers-reduced-motion: no-preference</C>, because a brightness
            cross-fade is still motion, and the whole point is to respect that
            preference.
          </Bullet>
        </ul>
        <p className="mt-3">
          A guard test reads the real CSS and fails if any of the three queries
          goes missing, so the next glass surface can&rsquo;t quietly
          reintroduce the gap.
        </p>
      </Section>

      <Section title="Respond on the press, not the release">
        <p>
          Apple&rsquo;s first rule is that the moment lag appears, directness
          &ldquo;falls off a cliff.&rdquo; Every button in the app gave feedback
          only on hover and on click &mdash; nothing on the press itself. They
          now scale a hair on <C>:active</C>, reusing the design-system&rsquo;s
          own timing tokens so the hover feel is unchanged, and dropping the
          transform entirely under reduced motion.
        </p>
        <p className="mt-3">
          The shared modal was bouncing on entrance. A spring with overshoot
          feels right on something you flicked or threw; on a dialog that just
          faded in, it feels wrong. I added a critically-damped preset (
          <C>spring.settle</C>) and pointed the modal at it, and made its exit
          mirror its entrance. The header menu, which used to blink into
          existence, now springs out of its trigger&rsquo;s corner &mdash;{" "}
          <C>transform-origin: top right</C> &mdash; so the spatial link between
          the button and the panel it opens is obvious.
        </p>
      </Section>

      <Section title="Type that changes with its size">
        <p>
          Tracking should get tighter as display type grows; a 72px hero and a
          30px section header shouldn&rsquo;t share one letter-spacing value, but
          they did. Large headings now tighten with size. The display face is a
          variable font with an optical-size axis that was never being requested
          &mdash; so I asked for the <C>opsz</C> axis in the font load and turned
          on <C>font-optical-sizing: auto</C>, and the px font-size literals
          became <C>rem</C> so they scale when someone bumps their browser text
          size.
        </p>
      </Section>

      <Section title="The two I deferred, then built with guards">
        <p>
          Two of the audit&rsquo;s ideas I first left on the table &mdash; a
          route transition and a drag-to-dismiss sheet &mdash; because the naive
          versions each break something. A global fade fights the LCP work on
          the landing page (the hero paints in the server frame; starting it at
          opacity 0 delays exactly that), and a transform on a page wrapper turns
          every <C>position: sticky</C> header into something relative to the
          wrapper. So the route transition I shipped is opacity-only (sticky
          stays intact) and skips the very first paint of a session (LCP stays
          intact), fading only on later navigations, and not at all under reduced
          motion.
        </p>
        <p className="mt-3">
          The sheet became a real primitive. It slides up, pairs with a scrim,
          and can be flicked away &mdash; and the dismiss decision uses Apple&rsquo;s
          momentum-projection function, the same exponential-decay model iOS
          scroll uses: it projects where the flick <em>would</em> come to rest and
          lets go if that&rsquo;s past the threshold, so a fast flick closes it
          even if it barely moved, while a gentle tug springs back. The{" "}
          <C>project()</C> helper is unit-tested and there&rsquo;s a live demo in
          the motion lab. The lesson both share: the reason to defer wasn&rsquo;t
          &ldquo;too hard,&rdquo; it was &ldquo;the obvious version regresses
          something&rdquo; &mdash; and once the guard is clear, they&rsquo;re
          cheap.
        </p>
      </Section>

      <WhatsNext
        nowShipped={[
          "The three accessibility media queries the glass was ignoring — reduced transparency, more contrast, eased theme change — with a guard test so they can't be dropped.",
          "Press-down feedback on buttons and toggles, a critically-damped modal, and a menu that springs from its trigger.",
          "Size-specific display tracking, optical sizing on the variable face, and rem type that honours the user's text-size setting.",
          "An opacity-only route transition that protects LCP and sticky headers, a formal blur/shadow scale adopted across the chrome, and a drag-to-dismiss Sheet with momentum projection.",
        ]}
        couldImprove={[
          "The command palette keeps focus on its input via aria-activedescendant, but doesn't trap Tab the way the modal does.",
          "The Sheet is a primitive with one demo home; the natural next step is adopting it for the mobile version of a real surface, not just the lab.",
        ]}
        upcoming={[
          "Roll the Sheet into a real mobile flow where a bottom sheet beats a centered modal.",
        ]}
      />
    </ThoughtLayout>
  );
}
