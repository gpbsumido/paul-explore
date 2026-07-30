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
          is its own reel-1 entry. These categories have no app to open, though,
          so their middle reel is a single greyed-out{" "}
          <span className="font-semibold text-foreground">Write-up only</span>{" "}
          marker, disabled and skipped by the spin, and the write-ups
          themselves stack in reel 3, where they belong. Pick{" "}
          <span className="font-semibold text-foreground">Build &amp; Tooling</span>{" "}
          and the middle greys out while deployment, bundlers, and the rest fill
          the right-hand reel. Deprecated notes get the same treatment through a
          trailing{" "}
          <span className="font-semibold text-foreground">Deprecated</span>{" "}
          category, each wearing a small amber tag so the state is obvious.
          There are two things called &ldquo;Features&rdquo; on the category
          reel, and that&rsquo;s deliberate: the Apps bucket holds the features
          themselves, while the Features write-up category holds the notes about
          building them. When an app has no write-up at all, reel 3 shows a
          friendly empty state with a link to browse everything instead of a
          blank wheel.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The spin</h2>
        <p className="text-muted">
          Spin picks a random valid combination first, then, like a real
          machine, all three reels start turning at once and lock in left to
          right: reel 1 lands, then reel 2 within the landed category, then reel
          3. A column that hasn&rsquo;t reached its turn free-wheels on fast,
          even steps so the reels to the right of whatever is landing are always
          visibly moving, and every still-turning column wears a vertical motion
          blur that snaps sharp the instant it stops. The landing itself steps
          through a handful of rows on timeouts with widening gaps, so it reads
          as a wheel losing momentum rather than a value snapping into place. The
          trick that keeps it clean is that reels 2 and 3 lock their{" "}
          <em>contents</em> to the chosen target the moment the pull starts, so
          while they spin they cycle their own frozen options rather than
          thrashing through every category reel 1 passes on the way down. It all
          stays fast, and input is off mid-spin so a stray click can&rsquo;t
          desync the three indices. Under{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            prefers-reduced-motion
          </code>{" "}
          all of that is skipped: the reels jump straight to the target with no
          stepping and no transitions. The tested logic in the motion path is a
          pair of tiny pure helpers,{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            wrapIndex
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            shortestDelta
          </code>
          , that treat every list as a wrapping wheel.
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
          . Up and Down move the selection within a reel (wrapping), Left and
          Right hop focus between the three columns and skip any greyed-out reel,
          Home and End jump, and Enter opens whatever the focused reel points at,
          including the category reel, which opens the landed destination so the
          leftmost column is never a dead end. A polite live region announces the
          combination after every spin or selection, and{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            &#8984;K
          </code>{" "}
          opens a command palette for jumping straight to any page or note. The
          result bar under the machine is still the primary navigation: ordinary
          links stating exactly where they go, so nobody has to operate the
          novelty UI to get anywhere. Selection is never colour alone: the landed
          row sits large and sharp under a glass magnifier bar while its
          neighbours soften, and once a column settles a small hand-drawn arrow
          draws itself in to name the result in place of a static header.
          Everything focusable has a visible ring.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Later: the win, and fixing it on phones
        </h2>
        <p className="text-muted">
          The payout animation from the list below has since shipped: line three
          reels up on a feature and its write-up and the window fills with a fall
          of party confetti, colour-matched to what you landed on. It looked
          great on my laptop and stuttered on my phone. The first pass just cut
          the piece count, and it still stuttered, because count wasn&rsquo;t the
          real cost. Each piece carried a translucent foil sheen, and a phone
          re-blends that alpha across dozens of overlapping, tumbling layers
          every single frame, which an emulator on a laptop&rsquo;s GPU never
          shows you. So on a phone I drop the sheen for a solid fill, thin the
          burst further, and promote every piece with{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            will-change: transform
          </code>{" "}
          up front so the layers don&rsquo;t all get allocated at burst
          start, which was the jump on the first frame. Desktop keeps the full
          count and the foil.
        </p>
        <p className="mt-4 text-muted">
          I wanted to measure the fix before trusting it, so I benched the real
          confetti in headless and headed Chromium at an iPhone-class viewport,
          with the CPU throttled four to six times and the device-pixel-ratio
          pushed from 3 all the way to 14. Every single run held a locked 60fps.
          That sounds like a pass, but it isn&rsquo;t: it&rsquo;s the bench
          failing to reproduce the bug. A transform-only animation runs entirely
          on the compositor thread, so CPU throttling never touches it, and a GPU
          trace confirmed it &mdash; under a millisecond of raster across the
          whole burst, because nothing repaints, it only re-composites. The cost
          is fill-rate: blending translucent pixels, which a desktop GPU has so
          much headroom for that it never breaks a sweat. That headroom is the
          whole reason the stutter only ever showed up on the actual phone and
          never in an emulator, which is a good lesson to write down: emulating a
          phone&rsquo;s screen is not emulating a phone&rsquo;s GPU.
        </p>
        <p className="mt-4 text-muted">
          So I measured the thing that is real and does carry over to the phone:
          the per-frame work the fix removes. The burst drops from 45 tumbling
          layers to 26, and because the sheen is gone on mobile, the count of
          translucent gradient layers the GPU re-blends every frame goes from 45
          to zero. Put in pixels at a 3x DPR, the alpha-blended area the compositor
          touches per frame falls from about 99,000 device-pixels to about 28,000
          &mdash; roughly a 72% cut in exactly the work that was dropping frames.
          The decision I settled on: I can&rsquo;t prove smoothness in an emulator
          for a bug an emulator can&rsquo;t feel, but I can show the fix removes
          most of the per-frame GPU load that causes it, and confirm the rest on a
          real device. The mobile count lives in one constant,{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            MOBILE_CONFETTI_COUNT
          </code>
          , so if 26 still isn&rsquo;t enough on some older phone, there&rsquo;s
          one number to turn.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">What I&rsquo;d do next</h2>
        <p className="text-muted">
          A weighted spin that favours things the visitor hasn&rsquo;t landed
          on yet, and an on-device pass to tune the mobile confetti count against
          a few real phones rather than one number I picked by reasoning.
        </p>
      </section>
    </ThoughtLayout>
  );
}
