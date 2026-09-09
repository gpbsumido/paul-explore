import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  UpdateTimeline,
  Update,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";
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

/**
 * Counts arrive as props from the server page, which reads them off the
 * catalog. Importing the catalog here would put all 21KB of it in this route's
 * client bundle to render two integers.
 */
export default function WorkPortfolioThoughtsContent({
  featureCount,
  projectCount,
}: {
  featureCount: number;
  projectCount: number;
}) {
  return (
    <ThoughtLayout
      breadcrumb="Work Portfolio"
      title="Work Portfolio"
      intro={
        <>
          How I turned {projectCount} old jobs into a single interactive page,
          and the
          handful of decisions that made it buildable without turning into a
          museum of dead apps.
        </>
      }
      chat={
        <ChatThread>
          <Timestamp>Today 11:02 AM</Timestamp>

          <Received pos="first">saw the work portfolio page</Received>
          <Received pos="last">are those the real apps running?</Received>

          <Sent pos="first">
            no, and that&apos;s on purpose. the real ones have dead backends,
            retired auth, paid licenses, client names i can&apos;t show. a
            portfolio of those is just dead links
          </Sent>
          <Sent pos="last">
            so each feature is rebuilt from scratch as a little self-contained
            demo with fake data. reconstruction, not the old app on life support
          </Sent>

          <Received>
            how do you show client work without showing clients
          </Received>

          <Sent pos="first">
            nothing real ships, no company, no game names, no wallets.
            everything gets a codename. and it&apos;s not just discipline,
            there&apos;s a test that greps the whole feature for banned names
            and fails the build if one slips
          </Sent>
          <Sent pos="last">
            the funny part is the test&apos;s own banned list is the one place
            those words are allowed, so it skips scanning itself
          </Sent>

          <Received>
            bet you pulled in a ton of chart libs to rebuild them
          </Received>

          <Sent pos="first">
            opposite. hard rule: no new deps. the originals used MUI, ECharts, a
            node-graph lib, gridstack. i rebuilt all of it on what was already
            here, tailwind, framer, recharts
          </Sent>
          <Sent pos="last">
            the drag-drop dashboard is just css grid, the node graph is
            hand-drawn svg. and every demo is a lazy chunk so the page only
            loads the one you&apos;re looking at
          </Sent>

          <Received>
            the two scrolling bars are cool but hard to click a moving thing
          </Received>

          <Sent pos="first">
            yeah that was the main risk. hover pauses it, touch freezes it, and
            there&apos;s always arrows + keyboard + deep links as the stable
            path. reduced-motion kills the scroll entirely
          </Sent>
          <Sent pos="last">
            and every chip has an info button that tells you what was real vs
            mocked. i&apos;d rather be upfront that it&apos;s a rebuild
          </Sent>

          <Received>how&apos;d you ship something this big</Received>

          <Sent pos="first">
            one base PR with all the plumbing and placeholders, then each batch
            of demos as its own PR that only touches its own files. they merge
            in any order once the base is in
          </Sent>
          <Sent pos="last">
            turns one scary all-at-once feature into a dozen small reviewable
            ones. that&apos;s the whole trick really
          </Sent>
        </ChatThread>
      }
    >
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-08-10-tickers",
            date: "Aug 10, 2026",
            title:
              "The tickers stopped being bespoke, and three bugs I had been ignoring",
          },
        ]}
      />

      <Section title="The problem with a work portfolio">
        <p className="mb-3 text-muted">
          Past work rots. The apps have dead backends, retired auth, paid
          licenses, and client names you can&apos;t show. A list of &quot;things
          I built&quot; is either a wall of dead links or a wall of screenshots.
          I wanted something you could actually touch.
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            <strong className="text-foreground">
              Reconstruction, not emulation.
            </strong>{" "}
            Each feature is rebuilt as a small self-contained component with
            mock data, not the original app wired to a dead API. It behaves like
            the feature did, in this site&apos;s design system.
          </Bullet>
          <Bullet>
            {featureCount} feature demos drawn from {projectCount} projects,
            because the interesting
            projects had more than one idea worth showing. It launched with 24
            across 11: Economy &amp; Financial Health overlapped the other
            analytics demos without adding an angle, and Streaming Ops went out
            along with the Ops Console project it was the only demo for.
          </Bullet>
        </ul>
      </Section>

      <Section title="Anonymizing without gutting it">
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            Most of these were client and employer projects, so no real names
            ship: not the company, not the games, not the wallets. Projects get
            descriptive codenames (&quot;Analytics Portal v2&quot;,
            &quot;Content Engine&quot;).
          </Bullet>
          <Bullet>
            <strong className="text-foreground">
              The rule is enforced in code.
            </strong>{" "}
            A unit test scans every file in the feature for a banned-name list,
            so a slip fails the build instead of shipping. The interesting
            nuance: the guard&apos;s own list is the one place those strings are
            allowed, so the test skips itself.
          </Bullet>
        </ul>
      </Section>

      <Section title="The no-new-dependencies rule">
        <p className="mb-3 text-muted">
          The originals leaned on MUI, ECharts, AG Grid, a node-graph library,
          gridstack, a code editor. Pulling all of that in to mimic them would
          bloat the bundle for a portfolio page, which is exactly the kind of
          thing the tree-shaking write-up argues against.
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            Every demo is rebuilt on what&apos;s already here: Tailwind,
            framer-motion, and the <C>recharts</C> already in the tree. The
            drag-drop dashboard is CSS grid, the node graph is hand-built SVG,
            the &quot;code editor&quot; is a read-only <C>pre</C>.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">
              Every demo is its own lazy chunk.
            </strong>{" "}
            They load through <C>next/dynamic</C>, so the page ships only the
            demo on screen, never all {featureCount} at once.
          </Bullet>
        </ul>
      </Section>

      <Section title="The dual-ticker UX, and its tradeoffs">
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            Two marquees: projects scrolling one way on top, features the other
            way on the bottom. It&apos;s playful and it fits a lot of entries in
            a small space.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">
              A moving target is hard to click.
            </strong>{" "}
            So hover pauses the marquee, touch freezes it for a few seconds, and
            there are always-stable fallbacks: side arrows, keyboard arrows, and{" "}
            <C>?feature=</C> deep links. <C>prefers-reduced-motion</C> drops the
            animation entirely.
          </Bullet>
          <Bullet>
            Each chip carries an info button that opens an anchored explainer:
            what the feature did, its original stack, and what&apos;s real vs.
            mocked in the reconstruction. That&apos;s where the honesty lives.
          </Bullet>
        </ul>
      </Section>

      <Section title="Shipping it: merge-order-independent PRs">
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            One base PR ships the whole machinery plus a catalog where every
            feature points at a <C>ComingSoonDemo</C> placeholder.
          </Bullet>
          <Bullet>
            Then each demo batch is its own PR that only adds its demo files and
            flips its own lines in the registry. Different PRs touch different
            lines, so they merge in any order once the base lands.
          </Bullet>
          <Bullet>
            The one shared helper (a seeded RNG) is copied byte-for-byte into
            each batch instead of centralized, because an identical add/add
            resolves cleanly where a shared edit would conflict.
          </Bullet>
        </ul>
      </Section>

      <Section title="The takeaway">
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            A portfolio of dead apps is a maintenance trap. Rebuilding the
            <em> ideas</em> as tiny living demos is more work up front and far
            less rot later.
          </Bullet>
          <Bullet>
            Constraints made it tractable: anonymize by default (and enforce
            it), add no dependencies, and structure the work so the big scary
            feature ships as a dozen small, independent, reviewable pieces.
          </Bullet>
        </ul>
      </Section>
      <Update
        id="update-2026-08-10-tickers"
        date="August 10, 2026"
        title="The tickers stopped being bespoke, and three bugs I had been ignoring"
      >
        <p>
          The dual tickers above were written for this page and stayed that way
          for a while. Two things forced the issue. First, they could not
          actually reach every chip &mdash; the loop scrolled but there was no
          way to get to items past the fold, so some of the portfolio was
          unreachable by anything except waiting. That got fixed by pinning the
          tickers, scrolling the demo area beneath them, and driving the loop
          from <code>scrollLeft</code> rather than a transform, which makes the
          same element both the animation and the scroll container instead of
          fighting between the two.
        </p>
        <p>
          Once they scrolled properly they were close enough to the ticker on
          the landing page that keeping two implementations was indefensible, so
          they moved onto the shared component. That is the sequence I would
          repeat: make the bespoke thing correct first, then unify. Unifying
          around a broken shape just spreads the bug.
        </p>
        <p>
          <strong>The drag bugs were the same bug twice.</strong> Dragging an
          NFT between panes and dragging a post between queue columns both
          failed the same way, because a dragged item rendered inside its source
          container is clipped by that container the moment it leaves. The fix
          in both cases is a drag overlay &mdash; render the thing being dragged
          in a layer above the layout rather than in the tree it came from.
          Worth knowing once, because it is the answer every time.
        </p>
        <p>
          <strong>And a class of bug I keep finding.</strong> Side effects had
          crept into state updater functions here, exactly as they had in the
          Learn steppers. An updater must be a pure function of previous state;
          React is allowed to call it twice, and anything with a consequence
          does not belong in it. Two features, two independent authors of the
          same mistake, which tells me it is a shape worth watching for rather
          than a one-off. The referral click tracking moved to the mutation
          where it belongs, and the Escape handling on the explainer dialog
          stopped depending on render timing.
        </p>
      </Update>

      <Update
        id="update-2026-09-09-polish"
        date="September 9, 2026"
        title="A polish pass, from the visitor's chair"
      >
        <p>
          I went back through the demos the way someone landing cold would &mdash;
          at a smaller laptop window, clicking everything. That framing surfaced a
          run of small things that each made a demo read as a mock rather than the
          product it came from.
        </p>
        <p>
          <strong>A chart that escaped its card was a layout bug, and my first
          fix for it was worse than the bug.</strong> The slug-dashboards line
          spilled over the config JSON on a short window. The demo root was pinned
          to <code>h-full</code>, so instead of the stage scrolling, the flex
          column squeezed the card until the chart overflowed it. I switched the
          root to <code>min-h-full</code> so the content could grow and the stage
          scroll &mdash; and the line vanished entirely. It looked fixed on my
          screen and broke on a smaller one, which is the exact trap I keep
          falling into.
        </p>
        <p>
          The chart was not hidden. It was never rendered. recharts&apos;
          ResponsiveContainer only draws once it measures a definite box, and a
          flex-grown height inside a <code>min-h-full</code> root never resolves to
          one, so it measured nothing and returned nothing:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`{ wrapperH: 160, svgPresent: false, linePath: null }`}
        </pre>
        <p>
          The real fix was to stop being clever about the height: a fixed{" "}
          <code>h-44</code> on the chart wrapper, not a flex-grown one. It renders
          at every window size, and the greedy fills that had been stretching short
          demos into empty cards went with it.
        </p>
        <p>
          <strong>The projects looked like one project.</strong> Each was the same
          near-black stage with an eight-percent tint, so switching jobs barely
          changed anything. Now the stage takes on the project&apos;s own accent as
          a corner glow and a texture keyed to its type &mdash; graph-paper grid for
          the mono/data products, a dot field for the sans ones &mdash; so the
          surface re-skins the moment you move between them.
        </p>
        <p>
          <strong>The campaign manager became a Season Board.</strong> The old
          version was a stepped create-modal with a store inspector &mdash;
          honest, but it read like a form. I rebuilt it so the same campaigns
          show two ways: a radial dial for the shape of the year, and a
          run-of-show gantt you can drag to reschedule. One inspector drives
          both. The constraint that shaped it was the house rules, not the
          design: no web fonts, so the poster type is the site&apos;s own
          display face; and the palette sweep forbids raw neon hex on a live
          surface, so the goal colours are hsl &mdash; the same escape hatch the
          generative-art demos already use.
        </p>
        <p>
          <strong>The last stop is this site.</strong> Every other demo is a
          reconstruction of past work; the new final entry is the real thing &mdash;
          a directory of live links to the features I built here, from the operator
          dashboard to the calendar to these write-ups. It is the one demo where
          nothing is mocked.
        </p>
        <p>
          <strong>Adding that one entry set off a chain of guards, which is the
          system working.</strong> A new project and feature tripped the catalog
          counts, the flagship count, the prose that states the totals, and the
          palette sweep &mdash; which caught that my amber accent sat outside the
          tone band and that the styled-JSON config view had reached for stock
          Tailwind colours:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`admin-suite.tsx:518 <span className="text-sky-600 dark:text-sky-300">
this-site.tsx:6 #e08a3c   // saturation 0.73, band max is 0.68`}
        </pre>
        <p>
          Each one was a real thing to correct, not a test being fussy: a
          retuned in-band amber, and inline accent hues in place of the stock
          classes.
        </p>
        <p>
          <strong>Most of the rest was making the demos honest.</strong> The
          wallet lookup gained a net worth, a balance sparkline and a holdings
          breakdown so it reads like an explorer; the campaign builder&apos;s every
          field now moves the preview (a channel model drives reach, installs and
          CPI), not just the name; the NFTs are deterministic generative art
          instead of flat swatches; the AI content module opens on real output
          rather than sitting blank; the wallet lookup opens on a sample already
          resolved instead of one input on an empty stage. And a genuine bug
          &mdash; a referral link created on the develop deploy pointed at
          production, because the API builds the URL against its own host, so I now
          rewrite it onto the current origin and, when there is no API to reach,
          fall back to a local preview link rather than a red network error.
        </p>
        <p>
          <strong>Validation and affordances, everywhere they were missing.</strong>{" "}
          The auth and admin forms disable their action until the input is valid;
          the config tab renders as syntax-coloured JSON; the info icons pulse so
          it is obvious they open an explainer; and the recharts default tooltip is
          gone, replaced by one that matches the rest of the site.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "A polish pass reviewed every demo as a visitor would: a chart that overflowed its card and then rendered nothing once I over-corrected (fixed with a definite height, not a flex-grown one), a referral link that pointed at prod from develop, forms that accepted invalid input, flat NFT swatches, and the raw recharts tooltip — all fixed, plus richer wallet/campaign previews so the demos read like the real product.",
          "Each project now carries its own accent and texture on the stage, so the jobs stop blurring together, and a final This Site entry links out to the real features of this site — the one demo where nothing is mocked.",
          "The tickers are the shared component rather than a bespoke copy — but only after they were made correct, since unifying around a broken shape spreads the bug rather than fixing it.",
          "Both drag bugs solved with a drag overlay: a dragged item rendered inside its source container gets clipped the moment it leaves, so it belongs in a layer above the layout.",
          "Side effects moved out of state updaters and into the mutation and event handlers where they belong.",
          "The same lesson one layer down, in the workflow editor: the drag handler reached through a ref from inside a setState updater, and since React runs those at flush time rather than event time, a fast drag whose moves and pointerup arrived in one task found the ref already cleared and crashed the demo. Reading the id at event time fixed it — a non-null assertion was the only reason the compiler stayed quiet.",
          "Still no new dependencies for the reconstructions themselves, which was the original rule and the one I would keep.",
        ]}
        couldImprove={[
          "The explainers are prose in components. As content grew, editing a description means editing a React file, which is the wrong shape for something that is really copy.",
          "Each reconstruction is hand-built, so there is no shared notion of what a demo is — adding one is a new bespoke component every time.",
          "Nothing proves the anonymisation holds. It is a rule I follow rather than something a test enforces, and a lint rule for the obvious tells would cost little.",
        ]}
        upcoming={[
          "Stabilise the ticker E2E tests. They failed once on a release and passed on re-run, which is exactly how a real signal gets trained into noise — the fix is to make the assertion wait on the demo being ready rather than a fixed timeout.",
          "Pull the explainer copy out of the components so adding a reconstruction is a data edit.",
        ]}
      />
    </ThoughtLayout>
  );
}
