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

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
      {children}
    </pre>
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

export default function DesignDetoxContent() {
  return (
    <ThoughtLayout
      breadcrumb="Design detox"
      title="Design detox"
      intro={
        <>
          The site worked, but it read a little generated. So I went looking for
          the specific things people point at when they say a UI looks
          vibe-coded, checked each one against what I&apos;d actually built, and
          fixed the ones that were true. The interesting part was that a couple
          of my first fixes were aimed at the wrong thing.
        </>
      }
    >
      <Section title="The colored stripe was the loudest tell">
        <p className="text-muted">
          Every list card had a 3px colored bar down its left edge, keyed to the
          category. It turns out that stripe is the single most-cited &quot;this
          was generated&quot; signal there is. Half my cards already carried the
          same color as a small dot next to the title, so the stripe was pure
          redundancy — I dropped it everywhere and let the dot do the job. The
          rails I kept are the ones that mean something: a calendar event&apos;s
          color, an <C>out-of-stock</C> state, a team&apos;s colors on a pick
          card. Identity color on a card is noise; state color is signal.
        </p>
      </Section>

      <Section title="One page intro, so every page belongs to the same site">
        <p className="text-muted">
          Every interior page had hand-rolled its own header — a slightly
          different eyebrow, a timid <C>text-3xl</C> title — so forty pages had
          quietly drifted apart. I pulled them into one <C>PageIntro</C>: an
          eyebrow, a confident clamp-sized display title in the same face the
          landing uses, and a lede. Now the whole site opens the same way, and
          the type is bold enough to look like a decision.
        </p>
      </Section>

      <Section title="The arrow was on the wrong line — and my first fix missed why">
        <p className="text-muted">
          A little ↗ on the landing links kept dropping to its own line under the
          word instead of sitting next to it. Obvious cause: the space before the
          icon is a line-break point. So I made it a non-breaking space, checked
          the served HTML — the <C> </C> byte was right there — and it{" "}
          <em>still wrapped</em>. The space was never it. I read the computed
          style instead of guessing:
        </p>
        <Pre>{`getComputedStyle(svg).display  ->  "block"`}</Pre>
        <p className="mt-3 text-muted">
          The design-system reset renders a bare <C>svg</C> as{" "}
          <C>display: block</C>, so in any inline-text context the icon fell to
          its own line. Buttons were fine only because they lay out with flex.
          The real fix was one line — <C>display: inline-block</C> on the icon —
          and it corrected every arrow on the site at once. The lesson I keep
          relearning: reproduce is not diagnose, and the screenshot caught my
          wrong fix before I shipped it.
        </p>
      </Section>

      <Section title="Apple&apos;s corner, in one line of CSS">
        <p className="text-muted">
          Default <C>border-radius</C> is a plain circular arc; Apple&apos;s
          corners are a superellipse — the squircle. The new{" "}
          <C>corner-shape</C> property draws it natively, and because{" "}
          <C>border-radius</C> degrades on its own, it&apos;s pure progressive
          enhancement:
        </p>
        <Pre>{`:where([class*="rounded"]):not([class*="rounded-full"]) {
  corner-shape: squircle;
}`}</Pre>
        <p className="mt-3 text-muted">
          Scoped to finite-radius surfaces — circles, pills, dots and avatars
          are excluded, because a squircle visibly distorts a corner whose radius
          is half the side. Subtle by design, which is the whole point.
        </p>
      </Section>

      <Section title="The grain that didn&apos;t help">
        <p className="text-muted">
          Flat, even surfaces are a tell too, so I tried a film grain over
          everything. I spent real time tuning it — it was invisible at low
          opacity, and <C>overlay</C> blend on low-contrast noise washed out, so
          I contrast-boosted the noise until it read. It looked fine. It also
          didn&apos;t move the needle, and I pulled it. Worth keeping in the
          write-up because the lesson was the diagnosis: the site didn&apos;t
          read generated because the surfaces were too clean. It read generated
          because the <em>layout</em> was too even.
        </p>
      </Section>

      <Section title="Too even is its own tell">
        <p className="text-muted">
          That was the real fix. The card grids were perfect three-ups — every
          cell the same size, stamped from one mold. I broke them into an
          irregular bento: a larger featured card plus a repeating wide tile,
          with <C>grid-auto-flow: dense</C> backfilling the gaps so the wide
          tiles alternate sides. Same content, same components — it just stops
          looking like a spreadsheet of cards and starts looking like someone
          laid it out.
        </p>
      </Section>

      <WhatsNext
        upcoming={[
          "Roll the irregular bento to the rest of the hub grids.",
          "Decide whether the interior header keeps its breadcrumb or moves toward the landing's brand-and-nav.",
          "Make a call on how much of the glass-panel look to keep — a change earns its place by making the site look more decided, not just more polished.",
        ]}
      />
    </ThoughtLayout>
  );
}
