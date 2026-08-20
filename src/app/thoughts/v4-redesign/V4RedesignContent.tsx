import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

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
          Land somewhere random, read the result bar, open it or spin again. The
          playful frame also earns the dependent-selection model: nobody
          questions why the middle wheel changes when the left one does, because
          that&rsquo;s just how these machines work.
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
          arrays the graph reads, including the same bridge rule: a feature only
          pulls its write-up into reel 3 when that write-up is still active. Add
          a feature or a note and the machine picks it up without anyone
          touching v4 code, and the graph and the slots can never drift apart.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Nothing becomes unreachable</h2>
        <p className="text-muted">
          A machine that only surfaced feature write-ups would strand the
          standalone ones, so every write-up category from the /thoughts index
          is its own reel-1 entry. These categories have no app to open, though,
          so their middle reel is a single greyed-out{" "}
          <span className="font-semibold text-foreground">Write-up only</span>{" "}
          marker, disabled and skipped by the spin, and the write-ups themselves
          stack in reel 3, where they belong. Pick{" "}
          <span className="font-semibold text-foreground">
            Build &amp; Tooling
          </span>{" "}
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
          as a wheel losing momentum rather than a value snapping into place.
          The trick that keeps it clean is that reels 2 and 3 lock their{" "}
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
          Right hop focus between the three columns and skip any greyed-out
          reel, Home and End jump, and Enter opens whatever the focused reel
          points at, including the category reel, which opens the landed
          destination so the leftmost column is never a dead end. A polite live
          region announces the combination after every spin or selection, and{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            &#8984;K
          </code>{" "}
          opens a command palette for jumping straight to any page or note. The
          result bar under the machine is still the primary navigation: ordinary
          links stating exactly where they go, so nobody has to operate the
          novelty UI to get anywhere. Selection is never colour alone: the
          landed row sits large and sharp under a glass magnifier bar while its
          neighbours soften, and once a column settles a small hand-drawn arrow
          draws itself in to name the result in place of a static header.
          Everything focusable has a visible ring.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Later: the win, and giving up on it for phones
        </h2>
        <p className="text-muted">
          The payout animation from the list below has since shipped: line three
          reels up on a feature and its write-up and the window fills with a
          fall of party confetti, colour-matched to what you landed on. It
          looked great on my laptop and stuttered on my phone, and the story of
          chasing that stutter is worth keeping, because it ends in a compromise
          rather than a clever fix.
        </p>
        <p className="mt-4 text-muted">
          The first pass just cut the piece count, and it still stuttered,
          because count wasn&rsquo;t the whole cost. Each piece carried a
          translucent foil sheen, and a phone re-blends that alpha across dozens
          of overlapping, tumbling layers every single frame. So the second pass
          went after the real work: drop the sheen for a solid fill on mobile,
          thin the burst further, and promote every piece with{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            will-change: transform
          </code>{" "}
          up front so the layers don&rsquo;t all get allocated at burst start,
          which was the jump on the first frame.
        </p>
        <p className="mt-4 text-muted">
          I wanted to measure that before trusting it, so I benched the real
          confetti in headless and headed Chromium at an iPhone-class viewport,
          CPU throttled four to six times, device-pixel-ratio pushed from 3 all
          the way to 14. Every run held a locked 60fps &mdash; which sounds like
          a pass but is really the bench failing to reproduce the bug. A
          transform-only animation runs entirely on the compositor thread, so
          CPU throttling never touches it, and a GPU trace confirmed it: under a
          millisecond of raster across the whole burst, because nothing
          repaints, it only re-composites. The cost is fill-rate, blending
          translucent pixels, and a desktop GPU has so much headroom for that it
          never breaks a sweat. That headroom is the whole reason the stutter
          only ever showed up on the actual phone. The lesson worth writing
          down: emulating a phone&rsquo;s screen is not emulating a
          phone&rsquo;s GPU.
        </p>
        <p className="mt-4 text-muted">
          What I could measure was the work the second pass removed &mdash;
          about a 72% cut in alpha-blended pixels per frame, from roughly 99,000
          device pixels down to 28,000 at a 3x DPR. So I shipped it to a preview
          build and tried it on the real phone. It still froze and lagged. That
          was the deciding data point: the approach itself, a fall of dozens of
          independently tumbling layers, is more than a phone GPU will carry,
          and shaving the per-piece cost only moves the threshold, it
          doesn&rsquo;t cross it. Rather than keep chasing a smooth version that
          may not exist on mid-range hardware, I made the call to disable the
          confetti on mobile entirely.
        </p>
        <p className="mt-4 text-muted">
          The compromise is easier to accept once you notice the confetti was
          never load-bearing. It&rsquo;s decoration layered <em>behind</em> the
          reels; a win already reads without it, through the reels locking into
          place, the result bar naming what you landed on, and the jingle. So on
          a phone the celebration is those three things, and the confetti is
          desktop-only, where the GPU has the room for it and it still falls in
          full with its foil sheen. When the choice is a janky effect or no
          effect, no effect wins &mdash; a dropped-frame stutter reads as the
          whole page being broken, which is a worse first impression than a
          clean win with no paper. The desktop-only threshold lives behind one{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
            useIsMobile
          </code>{" "}
          check, so if I ever build a genuinely cheap mobile celebration &mdash;
          a handful of pieces, or a CSS-only flash &mdash; it&rsquo;s a small,
          honest place to add it.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">What I&rsquo;d do next</h2>
        <p className="text-muted">
          A weighted spin that favours things the visitor hasn&rsquo;t landed on
          yet, and a genuinely cheap mobile win celebration &mdash; a handful of
          pieces or a CSS-only flash &mdash; to replace the confetti a phone GPU
          couldn&rsquo;t carry.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Update, Aug 2026: the settings menu and a phone that fits
        </h2>
        <p className="text-muted">
          Two things nagged at me once the machine had been live for a while.
          The first: every other page carries the little theme dropdown &mdash;
          system, light, dark, plus a Settings link tucked inside &mdash; and
          the landing didn&rsquo;t. The signed-in hub had quietly grown a bare
          Settings button sitting next to Log out instead, which is exactly the
          kind of one-off that the shared menu exists to prevent. So I pulled
          the same <code>HeaderMenu</code> the rest of the site uses into a
          small
          <code> LandingActions</code> cluster and dropped it into both the
          guest and signed-in variants. Settings now lives only inside the menu,
          and the standalone button is gone.
        </p>
        <p className="mt-3 text-muted">
          The second was a report that the landing looked &ldquo;zoomed
          in&rdquo; on a phone &mdash; you had to pinch out to see the whole
          thing. My first instinct was a viewport bug, but the meta tag is the
          ordinary
          <code> width=device-width, initial-scale=1</code> and the visual
          viewport measured a scale of exactly 1. Nothing was zooming. The
          machine was just taller than a short phone screen: at 390&times;640
          the result caption and the bottom nav sat 147px past the fold, so the
          part you actually click was the part you had to scroll to find. The
          reels carry the spin animation&rsquo;s pixel math, so I left their
          geometry alone and reclaimed the space from everything around them
          &mdash; top and bottom padding, the data line, the spin button, the
          caption &mdash; all trimmed on mobile and restored to their old sizing
          at the
          <code> sm</code> breakpoint. It fits in one screen now, which is the
          only honest way to answer &ldquo;are we zooming or does it just not
          fit&rdquo;: it wasn&rsquo;t zooming, and now it fits.
        </p>
      </section>
      <WhatsNext
        nowShipped={[
          "A slot machine that never makes anything unreachable, which was the constraint that made the idea acceptable rather than merely fun.",
          "A listbox underneath the costume, so the whole thing is operable and announced properly rather than being a visual toy.",
          "The feature registry as its data source, so a new feature appears without being registered twice.",
        ]}
        couldImprove={[
          "Novelty has a cost for repeat visitors — the spin is a delight once and a delay on the tenth visit, and there is no way to skip straight to a destination.",
          "Nothing measures whether people actually reach features through it or route around it via the palette.",
        ]}
        upcoming={[
          "A way to bypass the spin for anyone who knows where they are going, which the write-up already lists as the next thing and is the strongest of these.",
        ]}
      />
    </ThoughtLayout>
  );
}
