"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  UpdateTimeline,
  Update,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";
import { DesignSystemChat } from "./sections/DesignSystemChat";
import { DesignSystemSummary1 } from "./sections/DesignSystemSummary1";
import { DesignSystemSummary2 } from "./sections/DesignSystemSummary2";

const code =
  "rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground";
const linkClass = "text-primary-600 hover:underline dark:text-primary-400";

export default function DesignSystemContent() {
  return (
    <ThoughtLayout
      breadcrumb="Shared Design System"
      title="Shared Design System"
      intro={
        <>
          Extracting tokens and components out of this app into a shared design
          system, then wiring it back in alongside an Angular consumer. Four npm
          packages, one source of truth.
        </>
      }
      chat={<DesignSystemChat />}
    >
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-08-16-nothing-to-compare",
            date: "Aug 16, 2026",
            title: "The gate I said closed the gap had stopped looking",
          },
          {
            id: "update-2026-08-15-consumers",
            date: "Aug 15, 2026",
            title: "Three consumers, three different kinds of nothing",
          },
          {
            id: "update-2026-08-15-verdigris",
            date: "Aug 15, 2026",
            title: "The palette went upstream, and the gate redesigned it",
          },
        ]}
      />
      <DesignSystemSummary1 />
      <DesignSystemSummary2 />
      <Update
        id="update-2026-08-15-verdigris"
        date="August 15, 2026"
        title="The palette went upstream, and the gate redesigned it"
      >
        <p>
          The Verdigris &amp; Ember redesign started life in this app as local
          overrides of the package variables &mdash; which works, and is
          backwards. The whole point of a tokens package is to be the place
          the palette is decided. So the packages adopted it: primary is
          verdigris, secondary is ember, neutral is warm ink-on-paper, the
          semantic surfaces moved off pure white and near-black, and a display
          font token leads with Bricolage Grotesque. The values are taken
          verbatim from what this app already ships, so the swap lands with no
          visible change here, and the Angular app and Ketsup inherit it on
          their next dependency bump.
        </p>
        <p>
          <strong>
            The interesting part is what the system&apos;s own gates did to the
            design.
          </strong>{" "}
          The chart palette has a test that measures adjacent slots under
          deuteranopia, written after a blue/purple collision. Dropping ember
          in beside amber reproduced that exact failure &mdash; a colour
          distance of 1.3, the same number the test was born from. An
          exhaustive search over every slot order proved no arrangement of the
          existing ramps could pass, so the finding became the design: amber
          leaves the categorical set, a violet supporting ramp joins, and the
          shipped set clears the colour-blind band by a factor of six. The
          warmer surface also exposed that success-600 and warning-600 had
          been under the 3:1 floor all along &mdash; the old palette only
          looked compliant because nobody had moved the background underneath
          it.
        </p>
        <p>
          The &quot;no visual regression testing&quot; gap recorded below is
          also closed: the Storybook build runs through Chromatic now, and its
          review pass earned its keep immediately by flagging a real contrast
          regression this recolour introduced &mdash; that catch has its own
          entry in the accessibility write-up.
        </p>
      </Update>
      <Update
        id="update-2026-08-15-consumers"
        date="August 15, 2026"
        title="Three consumers, three different kinds of nothing"
      >
        <p>
          Publishing the palette was the easy half. The half that told me
          whether this system is real was upgrading the three apps that
          consume it, because a design system only earns the name if a version
          bump lands the change without anyone reopening the components.
        </p>
        <p>
          <strong>This app</strong> had been shipping the palette as local
          overrides &mdash; literal ramps in its own stylesheet, plus a block
          feeding those values back into the package variables because the
          shared CSS styles its components from those directly. Both halves
          became redundant the moment the package shipped the same values, and
          they had to be deleted together: reading a colour from the package
          while writing that same package variable from the colour is a
          circular reference, and CSS resolves that to <em>nothing</em> rather
          than to an error. I caught it as a transparent page body, then found
          a second copy of the same block in the dark-theme half that I had
          missed on the first pass.
        </p>
        <p>
          <strong>The Angular app</strong> repainted nothing at all, and
          proving that was the whole job. Its token bridge deliberately passes
          typography, motion, radii and z-index and never colours, because its
          palette is macOS-simulation identity rather than design language. I
          pixel-diffed three views in both themes before and after: zero
          differing pixels below the menu bar, with the only deltas being
          clock digits ticking between captures. The new palette is provably
          live in its served stylesheet; it simply never reaches the desktop
          chrome. A null result is worth measuring rather than asserting.
        </p>
        <p>
          <strong>Ketsup</strong> is where the bump found a real bug. Its
          bridge covered primary 300 through 700, and the newer button
          stylesheet also reads 50, 100, 200, 900 and 950 for its secondary
          variant &mdash; so those fell through to the package&rsquo;s stock
          ramp. The shared secondary button had been rendering a stock blue
          fill under an ember label, in two live places, and nothing had
          caught it because a missing custom property does not error, it
          inherits. That is the same failure mode as the circular reference
          here and the alias rot in the accessibility notes: CSS variables fail
          quietly, three different ways, in one week.
        </p>
      </Update>

      <Update
        id="update-2026-08-16-nothing-to-compare"
        date="August 16, 2026"
        title="The gate I said closed the gap had stopped looking"
      >
        <p>
          The update above ends by saying the &ldquo;no visual regression
          testing&rdquo; gap recorded below it is closed, because the Storybook
          build runs through Chromatic now.{" "}
          <strong>I recorded that gap as closed and it was not.</strong> The
          check <em>had been comparing nothing for about a month</em> by the
          time I wrote that sentence, and I did not find out by it failing.
        </p>
        <p>
          The snapshot quota is exhausted. The{" "}
          <code className={code}>UI Tests</code> check says so plainly &mdash;{" "}
          <em>update your plan to resume testing</em> &mdash; while the job
          beside it reports pass, because{" "}
          <code className={code}>exitZeroOnChanges</code> is set and a build that never took a
          snapshot has no changes to report. Green on a flag rather than on a
          comparison, and nothing in the checks list distinguishes those.
        </p>
        <p>
          <strong>
            The setting underneath it is the part that should not have been
            left running.
          </strong>{" "}
          <code className={code}>autoAcceptChanges</code> is pointed at the release branch, so a
          build there takes what it sees and makes it the reference for
          everything afterwards. Whatever drift landed during that month &mdash;
          and this was the month of the recolour, so the odds are not
          hypothetical &mdash; was queued to be adopted as the baseline on the
          next release merge and vouched for from then on. A gate that misses a
          regression leaves a gap; one positioned to ratify one and then
          certify it is worse than not having the gate at all.
        </p>
        <p>
          So the honest state of this system is the one recorded before that
          update: it has no visual regression testing, and now it has a check
          claiming otherwise, which is a worse position than the plain gap was.
          I found this while deciding whether to move that workflow to Node 24,
          and the decision became to leave it exactly where it is until there is
          quota &mdash; an unverifiable visual change riding inside a
          CI-configuration change is the wrong trade. It sits with three other
          findings of the same shape in{" "}
          <a href="/thoughts/green-checks" className={linkClass}>
            green checks
          </a>
          , including one that mattered here directly: the tokens package was
          compiling its own tests into the directory it publishes from, so every
          tarball shipped ten test files until this week.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "A published package consumed as a package, rather than shared source imported across projects, so the version boundary is real.",
          "Tokens as the contract between the system and its consumers, which is what lets the theme change without touching components.",
        ]}
        couldImprove={[
          "There is no visual regression testing, so a token change can alter every consumer with nothing catching it.",
          "Adoption is uneven — parts of this app still hand-roll what the system provides, which is how two sources of truth start.",
          "Nothing documents when to use which primitive, only what exists.",
        ]}
        upcoming={[
          "Run axe across the showcase gallery, where every primitive is already rendered in isolation and the check is close to free.",
        ]}
      />
    </ThoughtLayout>
  );
}
