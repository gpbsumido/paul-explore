"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";

/** Dev-notes write-up for the v4 slot-machine landing: the reels, the spin, and the a11y model. */
export default function V4RedesignContent() {
  return (
    <ThoughtLayout
      breadcrumb="V4 Redesign"
      title="V4 Redesign: the whole site as a slot machine"
      intro={
        <>
          v4 swaps the node graph for a slot machine: three vertical reels where
          the left one picks a category, the middle one an option inside it, and
          the right one the write-up behind that option. Same data as the graph,
          a very different way to wander through it, plus a spin button for when
          you don&rsquo;t know what you&rsquo;re looking for.
        </>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">Why a slot machine</h2>
        <p className="text-muted">
          The graph in v3 was great at showing how everything connects, but it
          asked the visitor to do the exploring. A slot machine flips that: it
          hands you one concrete combination at a time, and the{" "}
          <span className="font-semibold text-foreground">Spin</span> button
          turns &ldquo;I don&rsquo;t know where to start&rdquo; into a feature.
          Land somewhere random, read the result bar, open it or spin again.
          The playful frame also earns the dependent-selection model: nobody
          questions why the middle wheel changes when the left one does,
          because that&rsquo;s just how these machines work.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Three dependent reels, one data source
        </h2>
        <p className="text-muted">
          Reel 1 is the category: an{" "}
          <span className="font-semibold text-foreground">Apps</span> bucket for
          the features, a résumé bucket, then one bucket per write-up category.
          Reel 2 holds that category&rsquo;s options, and reel 3 the write-up
          behind the selected option. All of it is built by{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            buildSlots()
          </code>{" "}
          from the same{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            FEATURES
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            THOUGHTS
          </code>{" "}
          arrays the graph reads, including the same bridge rule: a feature
          only pulls its write-up into reel 3 when that write-up is still
          active. Add a feature or a note and the machine picks it up without
          anyone touching v4 code, and the graph and the slots can never drift
          apart.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Nothing becomes unreachable
        </h2>
        <p className="text-muted">
          A machine that only surfaced feature write-ups would strand the
          standalone ones, so every write-up category from the /thoughts index
          is its own reel-1 entry: pick{" "}
          <span className="font-semibold text-foreground">Testing &amp; Quality</span>{" "}
          and reel 2 lists those write-ups directly. Deprecated notes get the
          same treatment through a trailing{" "}
          <span className="font-semibold text-foreground">Deprecated</span>{" "}
          category, each wearing a small amber tag so the state is obvious.
          There are two things called &ldquo;Features&rdquo; on that reel, and
          that&rsquo;s deliberate: the Apps bucket holds the features
          themselves, while the Features write-up category holds the notes
          about building them. When an option has no write-up at all, reel 3
          shows a friendly empty state with a link to browse everything instead
          of a blank wheel.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The spin</h2>
        <p className="text-muted">
          Spin picks a random valid combination first, then animates toward it:
          reel 1 settles, then reel 2 within the landed category, then reel 3.
          Each reel steps through a handful of intermediate rows on timeouts
          with widening gaps, so it reads as a wheel losing momentum rather
          than a value snapping into place, and a CSS transform transition
          glides between steps. While it runs, the reels blur slightly and stop
          taking input so a mid-spin click can&rsquo;t desync the three
          indices. Under{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            prefers-reduced-motion
          </code>{" "}
          all of that is skipped: the reels jump straight to the target with no
          stepping, no blur, and no transitions. The only tested logic in the
          motion path is{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            wrapIndex
          </code>
          , the tiny pure function that treats every list as a wrapping wheel.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">A listbox in a costume</h2>
        <p className="text-muted">
          Underneath the chrome each reel is a plain{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            listbox
          </code>
          : focusable, labelled, with{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            aria-activedescendant
          </code>{" "}
          pointing at the selected row and every row a real{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            option
          </code>
          . Arrow keys move the selection (wrapping), Home and End jump, Enter
          opens whatever a reel-2 or reel-3 row points at, and a polite live
          region announces the combination after every spin or selection. The
          result bar under the machine is the primary navigation: ordinary
          links stating exactly where they go, so nobody has to operate the
          novelty UI to get anywhere. Selection is never colour alone, the
          centred row is also bigger, bolder, and framed by the window band,
          and everything focusable has a visible ring.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">What I&rsquo;d do next</h2>
        <p className="text-muted">
          A weighted spin that favours things the visitor hasn&rsquo;t landed
          on yet, a little payout animation when all three reels line up on a
          feature and its own write-up, and sound, obviously off by default.
        </p>
      </section>
    </ThoughtLayout>
  );
}
