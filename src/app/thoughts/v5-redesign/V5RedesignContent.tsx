import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  Update,
  UpdateTimeline,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";

const code =
  "rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground";

/** Dev-notes write-up for v5: the palette, the primitives, and the landing they were built for. */
export default function V5RedesignContent() {
  return (
    <ThoughtLayout
      breadcrumb="V5 Redesign"
      title="V5 Redesign: a landing page with a job"
      intro={
        <>
          v4 put a slot machine at{" "}
          <Link
            href="/"
            className="underline underline-offset-2 hover:opacity-80"
          >
            the root of the site
          </Link>
          . I still like it, and it is still running. It was also the first
          thing a hiring manager saw,
          and what it told them was that I enjoy building toys. v5 is three
          pull requests: move the museum off the root, give the site a visual
          identity that is mine rather than the framework&rsquo;s, then write a
          landing page whose only job is to argue that I can lead a front-end
          team.
        </>
      }
    >
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-08-15-everywhere",
            date: "Aug 15, 2026",
            title: "The palette stopped being a landing-page feature",
          },
        ]}
      />

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The root page was doing the wrong job
        </h2>
        <p className="text-muted">
          Every landing page I have shipped here has been a demo of a technique.
          v1 was a card grid, v2 a scroll-driven poster, v3 a node graph of the
          whole site, v4 a slot machine over the same data. Each one was fun to
          build and each one answered a question nobody visiting had asked.
          Someone who lands here from a job application has maybe ten minutes,
          and in v4 the first thing they had to do with those minutes was work
          out what the machine was for. That is a page optimised for me.
        </p>
        <p className="mt-3 text-muted">
          So the first PR moved the whole registry to{" "}
          <Link
            href="/discover"
            className="underline underline-offset-2 hover:opacity-80"
          >
            /discover
          </Link>{" "}
          and left the root rendering exactly one generation. Nothing about how
          v1 through v4 draw themselves changed, which was the point: the next
          redesign should be able to swap the landing without touching the
          history. This PR is the first time that bet paid off. Replacing{" "}
          <code className={code}>/</code> was a two-line import change in{" "}
          <code className={code}>page.tsx</code>, and every old landing kept
          working at its own URL through it.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The palette was the framework&rsquo;s, not mine
        </h2>
        <p className="text-muted">
          Before writing a single line of the new page I had to admit the site
          was wearing the palette every generated app wears: Tailwind&rsquo;s
          stock blue for primary, violet for secondary, cold grey neutrals, and
          one typeface doing every job. No amount of layout work survives that.
          The second PR replaced the identity ramps with a teal-green primary
          against an apricot secondary on warm ink-and-paper neutrals, and every
          value went through a WCAG relative-luminance calculation before it was
          written down rather than after. Two of them moved because of it:
          secondary-600 from the obvious <code className={code}>#bd6314</code>{" "}
          to <code className={code}>#b25c12</code>, and warning-700 off the
          shared package entirely, because the package value measured 4.49:1 on
          the new paper background. Under AA by a hundredth is still under AA.
        </p>
        <p className="mt-3 text-muted">
          Two things in that PR looked finished and were not, and both taught me
          something about where a token actually has to live. The shared CSS
          package styles its own components from{" "}
          <code className={code}>--paul-*</code> variables directly rather than
          from the app&rsquo;s <code className={code}>--color-*</code> aliases,
          so every shared button stayed stock blue while the app around it went
          green. And the display face was applied through a variable set on{" "}
          <code className={code}>body</code>, while{" "}
          <code className={code}>@theme</code> composes at{" "}
          <code className={code}>:root</code>, where that variable is empty. The
          utility resolved to nothing and every heading quietly stayed on Geist,
          with the token work looking entirely correct. Both were found by
          measuring the rendered page in a browser. Neither was findable by
          reading the diff.
        </p>
        <p className="mt-3 text-muted">
          For the display face I went to Bricolage Grotesque rather than the
          serif that suggests itself for an editorial direction. There are two
          display serifs that every model reaches for the moment a brief sounds
          creative, and reaching for one of them is the exact tell this release
          exists to remove.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Eight primitives, and the rule that shaped them
        </h2>
        <p className="text-muted">
          The same PR built eight motion primitives with no new runtime
          dependency: TextReveal, TextScramble, ScrollProgress, MagneticButton,
          AnimatedNumber, BlobBackground, SpotlightCard and GradientMesh. They
          are documented and demoed on{" "}
          <Link
            href="/design-system#motion-primitives"
            className="underline underline-offset-2 hover:opacity-80"
          >
            /design-system
          </Link>
          , and until this PR not one of them rendered in production. Building a
          component library for a page that does not exist yet is a good way to
          build the wrong components, so the risk was real. It mostly worked out
          because one hard rule shaped every one of them.
        </p>
        <p className="mt-3 text-muted">
          The rule is that nothing ships above-the-fold content as{" "}
          <code className={code}>opacity: 0</code> in the server HTML. A
          framer-motion <code className={code}>initial</code> on a headline puts
          the largest text on the page into the markup invisible, and LCP then
          waits for hydration, which on throttled mobile is worth about four
          seconds. So TextReveal keeps the full string at full opacity and
          switches on a CSS animation through a data attribute once the element
          reports itself in view. AnimatedNumber renders the real figure on the
          server through{" "}
          <code className={code}>useSyncExternalStore</code> and only hands over
          to the count-up after mount, so a crawler never reads a zero. On the
          new landing the hero goes further and uses no framer at all: the name,
          the role, the sentence and the buttons are four{" "}
          <code className={code}>.reveal-up</code> elements with an inline{" "}
          <code className={code}>animation-delay</code> each. That is a
          stylesheet the browser already has, staggering four elements, and it
          costs nothing.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Writing a brief against my own defaults
        </h2>
        <p className="text-muted">
          A page whose argument is &ldquo;I can lead front-end work&rdquo; fails
          completely if it looks like it came out of a template. So before any
          layout I wrote down what I was not allowed to do, and most of the list
          was things I would otherwise have reached for without noticing: a
          centred hero with two buttons over a gradient, a row of three equal
          feature cards, a small uppercase label above every section heading, a
          different accent colour per section, a scroll cue at the bottom of the
          hero.
        </p>
        <p className="mt-3 text-muted">
          Two of those I did not trust myself to audit by eye, so they are a
          test. <code className={code}>copyDiscipline.test.ts</code> reads every
          source file the landing renders from and fails on any em-dash, and
          counts uppercase micro-labels against a budget of one per three
          sections. The page ships zero of them, because a section&rsquo;s
          position already says what it is. The first version of the featured
          grid still slipped through and came out with a middle row of three
          equal cells, and I only caught it by screenshotting the running page
          and looking. The rows are four and two, then three and three, then two
          and four now. Reading the code would not have shown me that; the code
          was a loop over an array of spans and looked fine.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Ten traits, not three cards</h2>
        <p className="text-muted">
          The spine of the page is the whole{" "}
          <Link
            href="/craft"
            className="underline underline-offset-2 hover:opacity-80"
          >
            /craft
          </Link>{" "}
          matrix: all ten traits a lead is measured on, each with its principle
          and each with the pages in this project that prove it. The obvious
          landing-page move is to cut ten down to three and call it a feature
          row. I kept all ten because the evidence links are the entire
          argument. The first cut was ten glass cards with a cursor glow, and
          using the page told me what a screenshot had not: the glow sat under
          the text at exactly the moment someone leaned in to read it. It is
          now a numbered ledger against the sticky rail, one row per trait,
          and the count in the rail copy is derived from the array rather than
          typed, so the sentence cannot rot when an eleventh trait lands.
        </p>
        <p className="mt-3 text-muted">
          Colour is where that section could have gone wrong. Each trait
          carries its own accent, and ten accents on one page is how a design
          falls apart. In the ledger they only ever touch things that are not
          text: the oversized index numeral, a rule that slides in along the
          left edge on hover, and a wash held to seven percent on its own
          layer under the copy. The page has exactly one accent for anything a
          reader acts on, and the ten trait colours behave like a legend
          rather than a second palette.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The 3D object is garnish</h2>
        <p className="text-muted">
          There is sand inside a geodesic cage beside the headline. Fifteen
          hundred particles, sampled uniformly along each shape&rsquo;s
          wireframe edges, and every seven seconds they swarm into the next
          stand-in for something built here: a torus knot for the codebase, a
          low-poly globe for the Toronto world, a ball for the NBA console, a
          card for the TCG browser, an octahedron for the old node-graph
          landing, a fat torus for the slot machine reel. Each particle owns
          a stagger offset and a swirl vector fixed at mount, leaves in its
          own wave, and flies a bowed path to slot i on the next shape, which
          is what reads as sand rearranging rather than a crossfade. The
          pointer is a magnet over iron filings, pushing nearby particles
          aside to spring back after it passes, and that is the only thing
          hover does. The clock lives in useFrame, so scrolling the hero away
          pauses the whole show, and when nothing is morphing and no filings
          are displaced the per-frame pass skips entirely, which is what took
          the header menu&rsquo;s click from 240ms to 72ms. It is React Three
          Fiber, built in code with no model file, and two conditions send it
          to a static SVG instead: reduced motion, and no WebGL context.
          Phones run the real thing, because points at a capped DPR, mounted
          after first paint and paused offscreen, are a budget a phone GPU
          shrugs at. The WebGL check asks a canvas for a context rather than
          feature-detecting the constructor, which is the only honest version
          of that test and has the useful side effect that jsdom answers
          null, so the unit tests exercise the fallback without staging
          anything. The sampling and the stagger maths are pure modules with
          their own tests, because three&rsquo;s geometry classes are plain
          maths that run fine where WebGL cannot.
        </p>
        <p className="mt-3 text-muted">
          It also mounts after first paint, behind{" "}
          <code className={code}>next/dynamic</code> with SSR off and inside the
          same <code className={code}>ModelLazyMount</code> the Toronto world
          uses, so three.js never sits on the path to the headline. The design
          constraint I set was that the hero has to be finished without it, and
          that turned out to be the useful part: the first two versions of the
          object were unreadable at that size, and knowing the page was fine
          without it made it easy to keep cutting geometry until it read. Four
          radial segments, not forty. A wireframe smooth enough to look round is
          a scribble at hero scale.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          What /discover means now
        </h2>
        <p className="text-muted">
          One consequence I did not think through until the swap was live: once
          v5 owns the root, v4 is history too, and the retired-version banner on
          discover was written to warn you that you had landed on something
          stale. Nothing there is a wrong turn any more. It is a museum, so the
          banner is a caption on all four generations rather than a warning on
          three, and it says so. That decision lives in a small pure module
          instead of a branch inside the page, because the page is an async
          server component behind a session lookup and almost impossible to test
          through.
        </p>
      </section>

      <Update
        id="update-2026-08-15-everywhere"
        date="August 15, 2026"
        title="The palette stopped being a landing-page feature"
      >
        <p>
          The redesign shipped with the new language on the landing, the shared
          chrome and the registries, and stock Tailwind everywhere else &mdash;
          which is the state most redesigns quietly stay in. The follow-up
          swept every live surface: the wash behind all sixty write-ups, the
          per-page ambient accents, the slot machine&apos;s chrome, the
          calendar&apos;s colour picker, the work-portfolio demos down to
          their JSON syntax colours.
        </p>
        <p>
          Two guard tests now read the actual source and fail on any stock
          colour utility or any hex outside the palette&apos;s tone band, so
          the sweep cannot quietly regress. The exclusions are named in the
          test with their reasons: the archived landing generations keep their
          stock look because that look is the exhibit, and identity colour
          &mdash; NBA team colours, Pok&eacute;mon types, Web Vitals
          thresholds &mdash; stays, because a Lakers purple means something a
          token does not. The conversion itself needed judgment a formula
          alone gets wrong: greys map onto the warm neutral steps rather than
          picking up a hue, and a night-sky illustration stays a night sky,
          just in warm ink.
        </p>
        <p>
          The packages adopted the palette upstream in the same round, so the
          local overrides that bootstrapped all of this are now living on
          borrowed time &mdash; the design-system write-up has that half of
          the story.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "A root page that states the role, backs it with the full craft matrix and its evidence links, and closes with a way to get in touch. The old landing is one click away and still runs.",
          "Two anti-slop rules enforced by a test rather than by my own eye, after finding that the one I audited by eye was the one that slipped through.",
          "All eight motion primitives rendering in production, which is what they were built for and what a component library is worth nothing without.",
        ]}
        couldImprove={[
          "The proof strip counts tests, apps and write-ups. Those are all measures of volume, and none of them is a measure of quality. The vitals link is the only figure on the page I do not control.",
          "There is no way to tell whether this page actually converts better than the slot machine did, because nothing measures where visitors go from the root.",
          "The site-wide social-card alt text still describes this as a personal playground and portfolio, which is the positioning the new landing moves away from.",
        ]}
        upcoming={[
          "Real field data on the new landing, since the whole hero is built around an LCP rule and the only honest check on that is the number /vitals collects from real loads.",
        ]}
      />
    </ThoughtLayout>
  );
}
