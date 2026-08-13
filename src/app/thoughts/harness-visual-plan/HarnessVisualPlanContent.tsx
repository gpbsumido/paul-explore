"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import Paywall from "./Paywall";

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

/** Body of the first gated section, pulled out just to keep the tree readable. */
const WHY_I_PLAN_BODY = (
  <>
    <p>
      I used to jump straight into the code and let the design emerge from the
      diff. It works right up until it doesn&rsquo;t — until I&rsquo;m three
      files deep and realize the shape is wrong, or I&rsquo;ve quietly built a
      bespoke mechanism where an existing one would have done. Writing the plan
      first forces me to answer the questions that are cheap to change on paper
      and expensive to change in code.
    </p>
    <ul className="mt-3 space-y-2">
      <Bullet>
        <span className="font-medium">
          Is this the simplest correct approach
        </span>
        , or am I adding indirection the task doesn&rsquo;t need?
      </Bullet>
      <Bullet>
        <span className="font-medium">Does it fit the system</span> — reusing
        real components and boundaries — or am I bolting a new pattern onto the
        side?
      </Bullet>
      <Bullet>
        <span className="font-medium">What&rsquo;s the performance story</span>,
        and is there something I can measure to know it works — a test, a
        counter, a benchmark?
      </Bullet>
      <Bullet>
        <span className="font-medium">Am I overfitting</span> the architecture
        to this one feature, baking in an assumption that only holds for
        today&rsquo;s case?
      </Bullet>
    </ul>
    <p className="mt-3">
      If any answer exposes a problem, I fix the plan before I present it, and I
      leave the tradeoff in the document so it&rsquo;s visible. That design gate
      is the real work of planning — the wireframes are just how I make the
      answers concrete.
    </p>
  </>
);

export default function HarnessVisualPlanContent() {
  return (
    <ThoughtLayout
      breadcrumb="Visual Plans"
      title="Visual Plans"
      intro={
        <>
          My build process now brackets every real change with two steps: a{" "}
          <span className="font-medium text-foreground">visual plan</span>{" "}
          before any code exists, and a{" "}
          <span className="font-medium text-foreground">visual recap</span> once
          the work is pushed. The plan is a structured artifact — wireframes, a
          data model, the endpoints, the states, the open questions, and the
          list of failing tests I&rsquo;m about to write — not a wall of chat
          prose. This is the write-up on why I work that way, and what it buys
          me.
        </>
      }
    >
      <Section title="What it is">
        <p>
          The idea is small and a little stubborn: before I touch a line of
          implementation code, I write the plan down as a{" "}
          <span className="font-medium">contract</span>. Not a paragraph in a
          chat window that scrolls away, but a real file on disk —{" "}
          <C>plans/&lt;slug&gt;/plan.mdx</C> — with rendered low-fidelity
          wireframes for each screen state, an <C>erDiagram</C> for anything
          that touches data, a table of the files I&rsquo;ll add versus the ones
          I already have, and the RED test list that pins the behavior I&rsquo;m
          claiming to build. Then, when it&rsquo;s all pushed, I write the
          mirror image: a <span className="font-medium">recap</span> that lifts
          the actual diff back into those same blocks and calls out every place
          reality drifted from the plan.
        </p>
        <p className="mt-3">
          Both files stay on my machine — <C>plans/</C> is gitignored in this
          repo — so what travels with the change is the work itself, not the
          paperwork. The documents are for me, and for anyone I walk through
          them. Staying out of git did cost me something, though: a folder full
          of slugs with nothing tying any of them to the change it became. So
          the folder carries the PR number now —{" "}
          <C>plans/pr-&lt;n&gt;-&lt;slug&gt;/</C>, renamed the moment the PR
          opens, since the plan is written before there is a PR to name it
          after.
        </p>
        <p className="mt-3">
          The whole point is the gap between those two documents. A plan nobody
          checks against is a wish; a recap with no plan to compare to is a
          changelog. Put them side by side and the plan becomes something I can
          be held to, and the recap becomes the honest record of what actually
          shipped — including the parts I got wrong on the first guess. Drift is
          fine and expected. Undisclosed drift is the only real failure.
        </p>
      </Section>

      <Paywall>
        <div data-testid="gated-content" className="space-y-10">
          <Section title="Why I plan before I type">{WHY_I_PLAN_BODY}</Section>

          <Section title="How it actually helps">
            <p>
              The payoff shows up in a few concrete places, not as a vague
              feeling of being organized.
            </p>
            <ul className="mt-3 space-y-2">
              <Bullet>
                <span className="font-medium">
                  Missing states surface early.
                </span>{" "}
                Drawing the empty screen and the error screen as their own
                wireframe tabs catches the gap before it&rsquo;s a bug. The most
                common thing a plan saves me from is the state I forgot existed.
              </Bullet>
              <Bullet>
                <span className="font-medium">Reuse leads.</span> Every row
                names a real file or helper before it names something new, so
                the plan describes the genuine delta instead of redescribing the
                system — and I stop reinventing things I already have.
              </Bullet>
              <Bullet>
                <span className="font-medium">
                  The hard-to-reverse bets get settled up front.
                </span>{" "}
                Wire formats, public ids, the data-model shape, and the auth and
                ownership boundaries get decided in the plan, where changing my
                mind costs nothing.
              </Bullet>
              <Bullet>
                <span className="font-medium">The recap keeps me honest.</span>{" "}
                It gets built mechanically from the diff, so I can&rsquo;t
                quietly paper over the places where I deviated. If I said one
                thing and shipped another, the recap says so out loud.
              </Bullet>
            </ul>
          </Section>

          <Section title="The pros, plainly">
            <ul className="space-y-2">
              <Bullet>
                A reviewable direction{" "}
                <span className="font-medium">before</span> code exists — the
                earliest possible point to correct course, when it&rsquo;s a
                comment on a wireframe instead of a rewrite.
              </Bullet>
              <Bullet>
                A durable record. The plan and recap are files I can reopen
                months later, so the reasoning outlives the change instead of
                evaporating in a chat log.
              </Bullet>
              <Bullet>
                It pairs naturally with TDD: the plan&rsquo;s test list{" "}
                <span className="italic">is</span> the RED list, and I flip each
                entry to green in the plan as the test actually passes.
              </Bullet>
              <Bullet>
                Structured blocks beat prose. Tables, wireframes, and diagrams
                are skimmable and comparable in a way paragraphs never are.
              </Bullet>
            </ul>
          </Section>

          <Section title="And the cons, honestly">
            <ul className="space-y-2">
              <Bullet>
                It&rsquo;s overhead. For a typo or a one-line fix a plan is pure
                ceremony, so I skip it there — the skill is gated to changes
                that touch behavior, UI, schema, or an API contract.
              </Bullet>
              <Bullet>
                A plan full of plausible but invented names is{" "}
                <span className="font-medium">worse</span> than no plan. It only
                works if I read the real code first, which means planning is
                genuine research time, not a warm-up.
              </Bullet>
              <Bullet>
                There&rsquo;s a temptation to over-plan — to spec the whole
                feature when I should scope the smallest first cut that proves
                the approach and defer the rest. The discipline is knowing when
                to stop.
              </Bullet>
              <Bullet>
                Two documents can rot if I let them. The recap is what keeps the
                plan from becoming a lie, but only because I commit to writing
                it every time.
              </Bullet>
            </ul>
          </Section>

          <Section title="How I run it, step by step">
            <ol className="space-y-2 list-decimal pl-5 marker:text-muted">
              <li>
                <span className="font-medium">Research, read-only.</span> Read
                the actual files, name real paths and symbols, and figure out
                what to reuse before what to add. No source edits while
                planning.
              </li>
              <li>
                <span className="font-medium">Write the plan</span> as{" "}
                <C>plans/&lt;slug&gt;/plan.mdx</C> — wireframes for every state
                including empty and error, a diagram for data, tables for files
                and endpoints, the RED test list, and any assumption written as
                an open question with the default I&rsquo;ll proceed on.
              </li>
              <li>
                <span className="font-medium">Review it in the browser</span> as
                a rendered page, so I&rsquo;m judging a real layout, not
                imagining one from a code block.
              </li>
              <li>
                <span className="font-medium">Open the draft PR</span> before
                writing implementation code — the earliest a change of direction
                is cheap. The plan stays on disk; the PR is where the work
                becomes visible. The number it comes back with renames the plan
                folder, so months later I can still tell which plan became which
                change.
              </li>
              <li>
                <span className="font-medium">
                  Work the test list RED, then green.
                </span>{" "}
                When reality forces a change — it will — I don&rsquo;t quietly
                rewrite the plan to match. I leave it as the record of what was
                agreed.
              </li>
              <li>
                <span className="font-medium">Write the recap</span> once the
                work is pushed: the same blocks, filled from the real diff, with
                every drift from the plan called out. Then the closing summary.
              </li>
            </ol>
          </Section>

          <Section title="What I&rsquo;d revisit">
            <p>
              The biggest open question is where the line sits. Right now I lean
              on judgment — behavior, UI, schema, or contract changes get a
              plan; typos and doc edits don&rsquo;t — and that&rsquo;s mostly
              right, but the middle is fuzzy. The other thing I keep watching is
              the cost of the recap: it earns its keep every time a drift shows
              up, but on the runs where I nailed the plan exactly it can feel
              like paperwork. So far the honesty it buys on the messy runs is
              worth the tax on the clean ones, and that&rsquo;s the trade
              I&rsquo;m happy to keep making.
            </p>
          </Section>
        </div>
      </Paywall>
      <WhatsNext
        nowShipped={[
          "Planning in a structured artefact rather than chat prose, so the plan survives the conversation and can be checked against what shipped.",
          "Local files only, with no hosted planning service, which was a deliberate call after a security review rather than a preference.",
          "A recap built from the real diff, so drift between plan and result is visible instead of quietly absorbed.",
        ]}
        couldImprove={[
          "Nothing enforces that a plan was written. It is a practice I follow, and a skipped plan leaves no trace.",
          "Plans are untracked, so the reasoning behind a change is not in the repository with the change — deliberate, and it does mean the history is thinner than it could be. Naming each folder after its PR closes some of that gap, but the plan still lives only on the machine that wrote it.",
        ]}
        upcoming={[
          "Nothing scheduled. This documents a working practice rather than a system, and it changes when the practice does.",
        ]}
      />
    </ThoughtLayout>
  );
}
