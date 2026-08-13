"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  UpdateTimeline,
  Update,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

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

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
      <span>{children}</span>
    </li>
  );
}

export default function LearnContent() {
  return (
    <ThoughtLayout
      breadcrumb="Learn"
      title="Thirteen Demos, One Player"
      intro={
        <>
          The Learn pages are interactive walkthroughs of the things I keep
          having to explain properly &mdash; binary search, sliding window, two
          pointers, hash maps, recursion and backtracking, dynamic programming,
          trees and graphs, stacks and queues, memoization, debounce and
          throttle, event delegation, async patterns, and the newest one on AI
          agent patterns. The interesting engineering isn&apos;t any single
          demo. It&apos;s that thirteen of them each grew their own copy of the
          same stepper, and what went wrong when I finally pulled that apart.
        </>
      }
    >
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-08-10-write-up",
            date: "Aug 10, 2026",
            title: "Writing this down, and what I would keep",
          },
        ]}
      />

      <Section title="Thirteen steppers that were the same stepper">
        <p className="text-muted">
          Every demo needs the same thing: a list of steps, a current index,
          play and pause, forward and back, reset, and keyboard control. I built
          that inline the first time because one page doesn&apos;t need an
          abstraction. By the time there were a dozen, the shape had been
          retyped a dozen times, and each copy had drifted &mdash; different key
          handling, different behaviour at the end of the list, different ideas
          about what pause meant when you were already at the last step.
        </p>
        <p className="mt-3 text-muted">
          That is the version of duplication I actually care about. Not the
          typing, which is cheap, but the fact that thirteen copies means
          thirteen slightly different answers to the same question, and no one
          place to fix any of them. It became one{" "}
          <code className={code}>useStepPlayer</code> hook.
        </p>
      </Section>

      <Section title="The bug the tests found on the way">
        <p className="text-muted">
          Before consolidating I wrote tests for the stepper behaviour, which is
          the order I&apos;d insist on for anything that already ships:
          characterise what it does, then change how it does it. Those tests
          immediately caught an overrun &mdash; the player could step one past
          the end of the list.
        </p>
        <p className="mt-3 text-muted">
          The fix is the part worth keeping. The autoplay timer was deciding
          whether to stop inside the state updater, checking the index it was
          about to set. That reads fine and is wrong: an updater has to be a
          pure function of previous state, and using it to decide whether to
          cancel a timer is a side effect hiding in a place React is allowed to
          call twice. The stepper now stops from the callback, where the
          decision belongs, and the updater only computes the next index.
        </p>
      </Section>

      <Section title="What else this page paid for">
        <p className="mb-3 text-muted">
          Learn is thirteen near-identical routes, which makes it the cheapest
          place in the app to prove a cross-cutting change and the most
          expensive place to get one wrong. Several passes landed here first:
        </p>
        <ul className="space-y-2 text-sm text-muted">
          <Bullet>
            The shared <code className={code}>AmbientBackground</code> primitive
            and then <code className={code}>PageShell</code>, which collapsed
            the per-page background boilerplate onto one component.
          </Bullet>
          <Bullet>
            The framer-motion <code className={code}>motion</code> to{" "}
            <code className={code}>m</code> migration, which only pays off when
            every route does it, since one straggler pulls the full bundle back
            in.
          </Bullet>
          <Bullet>
            An LCP fix that moved entrance reveals off the JavaScript bundle
            entirely &mdash; the animation was delaying the thing it was
            animating.
          </Bullet>
          <Bullet>
            Migrating to <code className={code}>buildArticleMetadata</code> so
            the head tags come from one helper rather than being hand-rolled per
            page.
          </Bullet>
        </ul>
      </Section>

      <Update
        id="update-2026-08-10-write-up"
        date="August 10, 2026"
        title="Writing this down, and what I would keep"
      >
        <p>
          This page existed for months with no write-up, which I only noticed
          when I audited which features had one. Two others were in the same
          state, and the work-portfolio write-up turned out to exist while
          nothing linked to it.
        </p>
        <p>
          Writing it up surfaced the thing I would actually tell someone: the
          hook extraction was not the valuable part. Writing the
          characterisation tests first was. They found a real off-by-one that
          had been shipping, and they are the reason I could change thirteen
          pages at once and believe the result.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "A test that no learn demo implements arrow-key stepping itself, so the thirteen cannot quietly disagree about what the arrow keys do. Verified by adding a rogue handler and watching it go red.",
          "One useStepPlayer hook behind all thirteen demos, so play, pause, step and keyboard control behave identically everywhere and get fixed in one place.",
          "Characterisation tests written before the refactor, not after — they caught a step-past-the-end overrun that had been live.",
          "Autoplay stops from the callback rather than the state updater, so the updater stays a pure function of previous state.",
        ]}
        couldImprove={[
          "The demos share a player but not a shape: each still hand-rolls its own layout and controls markup, so a visual change is thirteen edits. A shared DemoLayout would be the same argument one level up.",
          "The keyboard guard checks that no demo hand-rolls arrow stepping. It cannot check that a demo which should be stepped actually is one — a page with previous and next buttons and no hook would pass.",
          "Content is hard-coded per route. Steps as data rather than JSX would make a demo a file of steps instead of a component.",
        ]}
        upcoming={[
          "Give the remaining learn routes the loading and error states the rest of the app just got, rather than only the hub.",
          "A shared DemoLayout, if the next demo I add makes me copy the markup a fourteenth time — which is the signal I trust more than a rule about counts.",
        ]}
      />
    </ThoughtLayout>
  );
}
