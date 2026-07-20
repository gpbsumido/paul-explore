"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function WorkPortfolioThoughtsContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "Work Portfolio" }]}
        right={<ViewToggle view={view} setView={setView} />}
        showLogout={false}
        maxWidth="max-w-3xl"
      />

      {view === "summary" ? (
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <header className="mb-10">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
              Dev notes
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Work Portfolio
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              How I turned 11 old jobs into a single interactive page, and the
              handful of decisions that made it buildable without turning into a
              museum of dead apps.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <Section title="The problem with a work portfolio">
              <p className="mb-3 text-muted">
                Past work rots. The apps have dead backends, retired auth, paid
                licenses, and client names you can&apos;t show. A list of
                &quot;things I built&quot; is either a wall of dead links or a
                wall of screenshots. I wanted something you could actually
                touch.
              </p>
              <ul className="mt-2 space-y-2 text-muted">
                <Bullet>
                  <strong className="text-foreground">Reconstruction, not emulation.</strong>{" "}
                  Each feature is rebuilt as a small self-contained component with
                  mock data, not the original app wired to a dead API. It behaves
                  like the feature did, in this site&apos;s design system.
                </Bullet>
                <Bullet>
                  24 feature demos drawn from 11 projects, because the interesting
                  projects had more than one idea worth showing.
                </Bullet>
              </ul>
            </Section>

            <Section title="Anonymizing without gutting it">
              <ul className="mt-2 space-y-2 text-muted">
                <Bullet>
                  Most of these were client and employer projects, so no real
                  names ship: not the company, not the games, not the wallets.
                  Projects get descriptive codenames (&quot;Analytics Portal
                  v2&quot;, &quot;Content Engine&quot;).
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">The rule is enforced in code.</strong>{" "}
                  A unit test scans every file in the feature for a banned-name
                  list, so a slip fails the build instead of shipping. The
                  interesting nuance: the guard&apos;s own list is the one place
                  those strings are allowed, so the test skips itself.
                </Bullet>
              </ul>
            </Section>

            <Section title="The no-new-dependencies rule">
              <p className="mb-3 text-muted">
                The originals leaned on MUI, ECharts, AG Grid, a node-graph
                library, gridstack, a code editor. Pulling all of that in to
                mimic them would bloat the bundle for a portfolio page, which is
                exactly the kind of thing the tree-shaking write-up argues
                against.
              </p>
              <ul className="mt-2 space-y-2 text-muted">
                <Bullet>
                  Every demo is rebuilt on what&apos;s already here: Tailwind,
                  framer-motion, and the <C>recharts</C> already in the tree. The
                  drag-drop dashboard is CSS grid, the node graph is hand-built
                  SVG, the &quot;code editor&quot; is a read-only <C>pre</C>.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Every demo is its own lazy chunk.</strong>{" "}
                  They load through <C>next/dynamic</C>, so the page ships only the
                  demo on screen, never all 24 at once.
                </Bullet>
              </ul>
            </Section>

            <Section title="The dual-ticker UX, and its tradeoffs">
              <ul className="mt-2 space-y-2 text-muted">
                <Bullet>
                  Two marquees: projects scrolling one way on top, features the
                  other way on the bottom. It&apos;s playful and it fits a lot of
                  entries in a small space.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">A moving target is hard to click.</strong>{" "}
                  So hover pauses the marquee, touch freezes it for a few seconds,
                  and there are always-stable fallbacks: side arrows, keyboard
                  arrows, and <C>?feature=</C> deep links. <C>prefers-reduced-motion</C>{" "}
                  drops the animation entirely.
                </Bullet>
                <Bullet>
                  Each chip carries an info button that opens an anchored
                  explainer: what the feature did, its original stack, and what&apos;s
                  real vs. mocked in the reconstruction. That&apos;s where the
                  honesty lives.
                </Bullet>
              </ul>
            </Section>

            <Section title="Shipping it: merge-order-independent PRs">
              <ul className="mt-2 space-y-2 text-muted">
                <Bullet>
                  One base PR ships the whole machinery plus a catalog where all
                  24 features point at a <C>ComingSoonDemo</C> placeholder.
                </Bullet>
                <Bullet>
                  Then each demo batch is its own PR that only adds its demo files
                  and flips its own lines in the registry. Different PRs touch
                  different lines, so they merge in any order once the base lands.
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
                  it), add no dependencies, and structure the work so the big
                  scary feature ships as a dozen small, independent, reviewable
                  pieces.
                </Bullet>
              </ul>
            </Section>
          </div>
        </main>
      ) : (
        <div className="flex justify-center">
          <div className={styles.phone} style={{ minHeight: "calc(100dvh - 56px)" }}>
            <div className={styles.chat}>
              <Timestamp>Today 11:02 AM</Timestamp>

              <Received pos="first">saw the work portfolio page</Received>
              <Received pos="last">are those the real apps running?</Received>

              <Sent pos="first">
                no, and that&apos;s on purpose. the real ones have dead backends,
                retired auth, paid licenses, client names i can&apos;t show. a
                portfolio of those is just dead links
              </Sent>
              <Sent pos="last">
                so each feature is rebuilt from scratch as a little
                self-contained demo with fake data. reconstruction, not the old
                app on life support
              </Sent>

              <Received>how do you show client work without showing clients</Received>

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

              <Received>bet you pulled in a ton of chart libs to rebuild them</Received>

              <Sent pos="first">
                opposite. hard rule: no new deps. the originals used MUI, ECharts,
                a node-graph lib, gridstack. i rebuilt all of it on what was
                already here, tailwind, framer, recharts
              </Sent>
              <Sent pos="last">
                the drag-drop dashboard is just css grid, the node graph is
                hand-drawn svg. and every demo is a lazy chunk so the page only
                loads the one you&apos;re looking at
              </Sent>

              <Received>the two scrolling bars are cool but hard to click a moving thing</Received>

              <Sent pos="first">
                yeah that was the main risk. hover pauses it, touch freezes it,
                and there&apos;s always arrows + keyboard + deep links as the
                stable path. reduced-motion kills the scroll entirely
              </Sent>
              <Sent pos="last">
                and every chip has an info button that tells you what was real vs
                mocked. i&apos;d rather be upfront that it&apos;s a rebuild
              </Sent>

              <Received>how&apos;d you ship something this big</Received>

              <Sent pos="first">
                one base PR with all the plumbing and placeholders, then each
                batch of demos as its own PR that only touches its own files. they
                merge in any order once the base is in
              </Sent>
              <Sent pos="last">
                turns one scary 24-demo feature into a dozen small reviewable
                ones. that&apos;s the whole trick really
              </Sent>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
