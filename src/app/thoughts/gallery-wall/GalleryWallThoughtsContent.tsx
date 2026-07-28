"use client";

import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";

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

export default function GalleryWallThoughtsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Gallery Wall"
      title="Gallery Wall"
      intro={
        <>
          Hanging a picture wall is a measuring problem before it&rsquo;s a taste
          problem. The{" "}
          <Link href="/gallery-wall" className="underline underline-offset-2">
            gallery wall arranger
          </Link>{" "}
          takes a pile of photos, frames each one, and lays them out to scale
          against a wall you describe, so you can see whether it fits before a
          single nail goes in. This is how it&rsquo;s built, and why almost all
          of it is a pure function.
        </>
      }
    >
      <Section title="A pure core, then a thin component">
        <p>
          The parts worth getting right — which frame suits a photo, where every
          frame lands on the wall, what happens when you change one — are all
          plain functions with no React in sight. There are three small modules:{" "}
          <C>frames</C> knows the standard sizes and picks one, <C>arrange</C>{" "}
          packs frames onto the wall, and <C>state</C> is a reducer over the
          uploaded photos plus a selector that turns the whole thing into a
          layout. The component is left holding the boring end: a file input, some
          number fields, and the buttons that dispatch into the reducer.
        </p>
        <p className="mt-3">
          That split is the reason the tests read like a spec of the behaviour
          rather than a tour of the DOM. The auto-framer, the packing, the
          overflow rules, and every reducer action are checked directly, and the
          component test just confirms the wiring by seeding a state and poking
          the controls.
        </p>
      </Section>

      <Section title="Auto-framing follows the photo, not a preference">
        <p>
          Every photo arrives with one number that matters: its width over
          height. Orientation falls straight out of it — wider than tall goes
          landscape, everything else (squares included) goes portrait. The size
          is the standard frame whose aspect ratio, in that orientation, sits
          closest to the photo&rsquo;s.
        </p>
        <ul className="mt-3 space-y-2">
          <Bullet>
            Sizes are stored short-side-first (<C>4×6</C>, <C>8×10</C>,{" "}
            <C>16×20</C> …). Portrait keeps the short side as the width; landscape
            swaps it. One list serves both orientations.
          </Bullet>
          <Bullet>
            A few sizes share an aspect ratio — <C>8×10</C> and <C>16×20</C> are
            both 4:5 — so ties break toward the medium <C>8×10</C> default. A
            standard photo lands on a sensible frame instead of the biggest match.
          </Bullet>
          <Bullet>
            It&rsquo;s only a starting point. Each photo carries its own frame
            choice, so changing one size or flipping one orientation never
            touches the others.
          </Bullet>
        </ul>
      </Section>

      <Section title="Packing the wall in centered rows">
        <p>
          The layout is a shelf pack, the way most real gallery walls actually
          read: frames fill a row left to right, and when the next one would spill
          past the wall width the row wraps. Each row is centered horizontally,
          and within a row every frame is centered vertically, so a short frame
          sits level with a tall neighbour instead of dropping to the floor.
        </p>
        <p className="mt-3">
          Fit is reported, not enforced. The arranger hands back a{" "}
          <C>contentHeight</C> and an <C>overflows</C> flag — true when the stacked
          rows are taller than the wall, or when one frame is simply wider than
          the wall — and the UI turns that into a plain warning. It never silently
          shrinks a frame to make the math work, because the frames are real sizes
          you&rsquo;re going to buy.
        </p>
      </Section>

      <Section title="Inches inside, centimetres only at the edge">
        <p>
          Frames are sold in inches, so the whole core reasons in inches and
          nothing else. The unit toggle lives entirely at the input boundary: a
          centimetre you type is converted to inches before it reaches state, and
          an inch from state is converted back only to fill the field. The layout
          math never sees a unit at all, which is exactly why it stays simple —
          it&rsquo;s unit-agnostic arithmetic that happens to run in inches.
        </p>
      </Section>

      <Section title="A preview that is literally to scale">
        <p>
          The preview is one SVG whose <C>viewBox</C> is the wall&rsquo;s physical
          size in inches. A frame that&rsquo;s eight inches wide is eight units
          wide; there is no pixel conversion anywhere, and the browser scales the
          whole wall to whatever width the column gives it. Each frame is a white
          mat with a dark border and the photo cropped to fill (
          <C>preserveAspectRatio=&quot;xMidYMid slice&quot;</C>, the SVG spelling
          of object-fit cover).
        </p>
        <p className="mt-3">
          For a screen reader the stage is a single labelled <C>img</C> region —
          &ldquo;Gallery wall preview: 4 frames on a 96 by 60 inch wall&rdquo; —
          rather than a heap of announced rectangles. The controls carry their
          weight for accessibility: real <C>label</C>s on every field, each
          photo&rsquo;s controls grouped in a <C>fieldset</C>, orientation as a
          pair of <C>aria-pressed</C> buttons, and the overflow notice sat in a
          live region with an icon so it isn&rsquo;t colour alone.
        </p>
      </Section>

      <Section title="The gotcha, and what I&rsquo;d revisit">
        <p>
          One trap worth flagging: the packing module started life as{" "}
          <C>layout.ts</C> co-located under <C>app/gallery-wall/</C>, and Next
          promptly treated it as a route <em>layout</em> and demanded a default
          export. The fix was to move the pure modules into a private{" "}
          <C>_lib/</C> folder (the underscore opts the whole folder out of routing)
          and rename the file to <C>arrange.ts</C>. Filenames under <C>app/</C>{" "}
          are never just filenames.
        </p>
        <p className="mt-3">
          The layout is deliberately a shelf pack, not a true mason&rsquo;s wall
          with staggered heights and a hung centre line. Drag-to-rearrange,
          saving a wall, printing a hang sheet with measurements, and mat-colour
          choices are all natural next steps — but the point of the first version
          was to make the measuring problem disappear, and to keep the part that
          does the measuring a function you can test.
        </p>
      </Section>
    </ThoughtLayout>
  );
}
