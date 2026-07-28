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
          against a wall you describe. Drag the frames where you want them,
          untangle any overlaps, and print a hang sheet with the exact
          measurements before a single nail goes in. This is how it&rsquo;s built,
          and why almost all of it is a pure function.
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
          of object-fit cover). The preview window is a fixed size no matter the
          wall or the zoom &mdash; the wall is fit and centred inside it, and
          zooming (type a percentage or use the buttons) scales the content past
          the edges so the window scrolls to pan. Because the SVG has no fixed
          pixel sizes it stays razor-sharp at any zoom, a little minimap shows
          which slice of the wall you&rsquo;re looking at, and the drag math
          divides the pointer delta by the one uniform fit-scale so a frame stays
          under the cursor even when the window letterboxes the wall.
        </p>
        <p className="mt-3">
          The stage has two accessibility shapes. A static preview is a single
          labelled <C>img</C> region — &ldquo;Gallery wall preview: 4 frames on a
          96 by 60 inch wall&rdquo; — so a screen reader hears one summary. Once
          it&rsquo;s interactive each frame becomes a named button, so the SVG
          switches from <C>role=&quot;img&quot;</C> to <C>role=&quot;group&quot;</C>
          &mdash; an image with focusable children is a nested-interactive axe
          violation. The rest of the controls carry their weight too: real{" "}
          <C>label</C>s on every field, each photo&rsquo;s controls in a{" "}
          <C>fieldset</C>, and warnings in a live region with an icon so they
          aren&rsquo;t colour alone.
        </p>
      </Section>

      <Section title="Drag anywhere, or nudge with the keyboard">
        <p>
          Auto layout is only the starting point. Every frame can be dragged
          anywhere on the wall with a pointer, and the same frame is a focusable
          button you can move with the arrow keys (hold <C>Shift</C> for a
          five-inch step instead of one). Dragging with a mouse and nudging with
          the keyboard both funnel through one <C>move-image</C> action, so
          there&rsquo;s a single clamp keeping frames on the wall and a single
          place the position changes.
        </p>
        <p className="mt-3">
          Two quiet decisions make it feel right. The pixel delta from a pointer
          drag is converted into wall inches through a tiny pure helper (
          <C>clientDeltaToWall</C>) using the rendered size of the SVG, so a frame
          tracks the cursor at any zoom. And the first time you drag <em>any</em>{" "}
          frame, every frame is frozen at its current auto spot — otherwise moving
          one would let the shelf pack reflow all the others out from under you.
        </p>
      </Section>

      <Section title="Overlap is a hard stop">
        <p>
          A gallery wall where two frames occupy the same nail is not a plan you
          can hang. So overlap isn&rsquo;t a warning you can ignore — it blocks
          the save. A pure <C>findOverlaps</C> does an all-pairs rectangle
          intersection (edges that merely touch don&rsquo;t count, so a tidy flush
          layout stays valid), <C>findOutOfBounds</C> catches frames dragged off
          the wall, and <C>computeValidation</C> folds both into an{" "}
          <C>invalidIds</C> list and a single <C>canSave</C> boolean.
        </p>
        <p className="mt-3">
          The UI reads straight off that: offending frames turn red in the
          preview, a warning pops over the wall, and the Save button is disabled
          until it&rsquo;s clean. One <C>role=&quot;alert&quot;</C> so a screen
          reader is told once, not per frame. Auto-arrange is always one click
          away to untangle everything back into a valid layout.
        </p>
      </Section>

      <Section title="Rows or masonry">
        <p>
          The auto layout comes in two shapes. Rows is the original shelf pack;
          masonry is a true staggered wall — fixed-width columns with each next
          frame dropped into the shortest column, so the rows never line up and it
          reads like a real salon hang. Both are pure functions over the same
          input, and the layout mode just picks which one seeds the un-dragged
          frames, so dragging and validation work identically on top of either.
        </p>
      </Section>

      <Section title="The hang sheet does the arithmetic">
        <p>
          Knowing where a frame sits on screen isn&rsquo;t the same as knowing
          where to put the nail. <C>computeHangSheet</C> turns each placement into
          the numbers you actually measure on the wall: the hook sits at the
          frame&rsquo;s top-centre, dropped a little for a taut wire, and the sheet
          gives its distance from the left edge and from the top edge. It renders
          as a plain table you can print (the values follow the unit toggle), so
          the on-screen plan becomes a tape-measure checklist.
        </p>
      </Section>

      <Section title="Saving a wall">
        <p>
          A finished arrangement serialises to JSON and lands in{" "}
          <C>localStorage</C>; a Restore button reads it back through a{" "}
          <C>replace</C> action. The save is gated on the same <C>canSave</C> — you
          can&rsquo;t persist an invalid wall — and the read happens after mount,
          not during render, so the server and client agree on first paint. The
          honest caveat: photos are held as object URLs that don&rsquo;t survive a
          reload, so a restored wall keeps its frames and measurements but wants
          its images re-added.
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
          The throughline across drag, overlap, masonry, the hang sheet, and save
          is the same as the first version: every hard part is a pure function
          you can test, and the component is just the accessible wiring around
          them. Left for later: mat and frame-colour choices, snapping to a shared
          baseline while dragging, and persisting the photos themselves so a saved
          wall reloads whole.
        </p>
      </Section>
    </ThoughtLayout>
  );
}
