"use client";

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

export default function WorkPortfolioThoughtsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Work Portfolio"
      title="Work Portfolio"
      intro={
        <>
          How I turned 10 old jobs into a single interactive page, and the
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
            22 feature demos drawn from 10 projects, because the interesting
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
            demo on screen, never all 22 at once.
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

      <WhatsNext
        nowShipped={[
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
