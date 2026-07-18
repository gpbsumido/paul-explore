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

/** A bullet row with the little dot the summary view uses everywhere. */
function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
      <span>{children}</span>
    </li>
  );
}

/** A titled section of the summary view. */
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

export default function TreeShakingContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "Tree Shaking" }]}
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
              Tree Shaking
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              A methodical pass at dead weight. The interesting part was never
              the deletions — it was deciding what actually counts as dead, and
              which calls a tool is allowed to make for you.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <Section title="Three kinds of dead weight">
              <p className="mb-3 text-muted">
                &quot;Tree shaking&quot; gets used as a catch-all, but the
                cleanup splits into three buckets that pay off in completely
                different currencies. Sorting every finding into one of these
                first is what kept the pass honest.
              </p>
              <ul className="mt-2 space-y-2 text-muted">
                <Bullet>
                  <strong className="text-foreground">Shipped bundle.</strong>{" "}
                  Code that reaches the browser. This is the only bucket that
                  moves first-load JS. Removing an unused dependency that was
                  actually imported lands here.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Deploy weight.</strong>{" "}
                  Files that ride along on every deployment but never load —
                  anything unreferenced under <C>public/</C>. Doesn&apos;t touch
                  the bundle, but it&apos;s bytes on every build artifact.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Source hygiene.</strong>{" "}
                  Exports nothing imports, dead components, redundant config. The
                  bundler already tree-shakes unused exports out, so removing
                  them changes <em>nothing</em> at runtime. The payoff is a
                  codebase that doesn&apos;t lie about what&apos;s in use.
                </Bullet>
              </ul>
              <p className="mt-3 text-muted">
                Most of this pass was bucket three (hygiene), a bit was bucket
                two (deploy weight), and exactly one change touched bucket one
                (the bundle). Being clear about which is which stops you from
                overselling a cleanup as a perf win it isn&apos;t.
              </p>
            </Section>

            <Section title="The method: analyze, verify, remove, track">
              <ul className="mt-2 space-y-2 text-muted">
                <Bullet>
                  <C>@next/bundle-analyzer</C> for the visual treemap,{" "}
                  <C>depcheck</C> for unused dependencies, <C>ts-prune</C> for
                  dead exports, plus a manual sweep of <C>public/</C> and the
                  PostCSS config.
                </Bullet>
                <Bullet>
                  Every tool here is a <em>heuristic</em>. depcheck can&apos;t
                  see a package used through a CLI or a CSS <C>@import</C>;
                  ts-prune can&apos;t trace framework-convention exports. So the
                  rule was: a tool <em>nominates</em>, a grep <em>confirms</em>.
                  Nothing got removed on a report alone.
                </Bullet>
                <Bullet>
                  Remove in small, single-purpose commits so a regression
                  bisects to one decision, and re-run <C>tsc</C> and the full
                  test suite after each one.
                </Bullet>
              </ul>
            </Section>

            <Section title="What came out, and why">
              <ul className="mt-2 space-y-2 text-muted">
                <Bullet>
                  <strong className="text-foreground">autoprefixer.</strong>{" "}
                  Tailwind v4 runs Lightning CSS internally, which already does
                  vendor prefixing. A second autoprefixer pass in PostCSS was
                  redundant work. Trade-off considered: none real — the
                  prefixing still happens, just once instead of twice.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">
                    Five starter SVGs.
                  </strong>{" "}
                  The <C>create-next-app</C> leftovers (<C>next.svg</C>,{" "}
                  <C>vercel.svg</C>, and friends). Everything in <C>public/</C>{" "}
                  ships whether or not anything points at it — grepped all five
                  to zero references, then deleted. Deploy weight, not bundle.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">
                    Raw model sources.
                  </strong>{" "}
                  256K of source <C>.glb</C> files sat in <C>public/models/raw/</C>
                  , shipping on every deploy but never loaded — only the
                  optimized copies are served. Moved them to a non-served{" "}
                  <C>models-src/</C> instead of deleting, because they&apos;re
                  the regeneration source for the models.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Dead exports.</strong>{" "}
                  A batch of unused animation variants, calendar read helpers,
                  and type aliases. Pure hygiene — the bundler was already
                  dropping them. Verified each by grepping the whole repo
                  (including co-located tests); every one appeared only in its
                  own file.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">
                    A WebGL dependency.
                  </strong>{" "}
                  Two orphaned v1-landing hero components, and{" "}
                  <C>@shadergradient/react</C> along with them — one component
                  was its only importer. This was the single change that trimmed
                  the actual shipped bundle.
                </Bullet>
              </ul>
            </Section>

            <Section title="The judgment calls a report can't make">
              <p className="mb-3 text-muted">
                Two findings looked identical to their tools — both flagged as
                &quot;unused&quot; — but needed opposite decisions. This is the
                part worth slowing down for.
              </p>
              <ul className="mt-2 space-y-3 text-muted">
                <Bullet>
                  <strong className="text-foreground">
                    gltf-transform — flagged, but kept.
                  </strong>{" "}
                  depcheck called it an unused devDep. It isn&apos;t: it&apos;s a
                  CLI-only model asset-prep toolchain that strips Draco
                  compression from GLBs for a real CSP reason, documented in the
                  architecture notes. depcheck simply can&apos;t see usage that
                  never appears as an <C>import</C>. Removing it would have
                  broken a pipeline to satisfy a false positive. Kept it, and
                  added it to the ignore list.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">
                    v1 hero components — flagged, and removed.
                  </strong>{" "}
                  Genuinely orphaned, but tangled up with a feature the project
                  values: <C>page.tsx</C> keeps <em>retired</em> landing
                  versions reachable through a version switch. The tension:
                  keeping history vs. carrying a whole WebGL dependency for code
                  nothing reaches.{" "}
                  <span className="text-foreground">
                    Pro of keeping
                  </span>{" "}
                  — preserves the artifact.{" "}
                  <span className="text-foreground">Con</span> — the blocking
                  dead-code check would need a permanent suppression on code
                  that is, in fact, dead. Suppressing dead code to pass a
                  dead-code check defeats the check, so they were removed. The
                  story still lives in the ui-redesign write-up, so no history
                  was actually lost.
                </Bullet>
              </ul>
            </Section>

            <Section title="Automating it: a blocking check, and its tax">
              <p className="mb-3 text-muted">
                A one-time cleanup rots the moment the next feature lands, so the
                two fast checks now run on every push as a blocking{" "}
                <C>pnpm deadcheck</C> step in CI.
              </p>
              <ul className="mt-2 space-y-2 text-muted">
                <Bullet>
                  <strong className="text-foreground">
                    Blocking vs. advisory.
                  </strong>{" "}
                  Advisory checks get ignored until they&apos;re noise. Blocking
                  means a stray unused import can&apos;t merge — but the cost is
                  maintaining an ignore list, or the build cries wolf and someone
                  disables it. We took the upkeep in exchange for catching rot at
                  review time.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">The false-positive tax.</strong>{" "}
                  Both tools have blind spots, so both need a curated allow-list:
                  CLI tools and CSS-only packages for depcheck, App Router
                  convention exports and re-export barrels for ts-prune. Those
                  live in <C>.depcheckrc.json</C> and <C>.ts-prunerc.json</C>.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">
                    The &quot;used in module&quot; wrinkle.
                  </strong>{" "}
                  ts-prune&apos;s own <C>--error</C> flag fails on exports used
                  only inside their own file — which isn&apos;t dead code, just a
                  stray <C>export</C> keyword, and there are dozens. A small
                  wrapper script filters those so the build fails only on exports
                  nothing imports at all.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">
                    What stayed manual.
                  </strong>{" "}
                  The treemap and build-size diffing are exploratory and slow, so
                  they&apos;re not in CI. Only the fast, deterministic checks got
                  automated — a check you run is worth more than one you skip
                  because it&apos;s slow.
                </Bullet>
              </ul>
            </Section>

            <Section title="The takeaway">
              <ul className="mt-2 space-y-2 text-muted">
                <Bullet>
                  Name the currency before you celebrate a deletion. &quot;I
                  removed an unused export&quot; is tidier code, not a faster
                  page. &quot;I dropped a dependency an import pulled in&quot; is
                  the one that moves bytes.
                </Bullet>
                <Bullet>
                  A heuristic tool nominates; you confirm. Every &quot;unused&quot;
                  flag is a question, not an answer — the gltf-transform and v1
                  cases looked the same to the tool and needed opposite calls.
                </Bullet>
                <Bullet>
                  Automate the checks that are fast and deterministic; leave the
                  slow, exploratory ones as a manual ritual. And never suppress a
                  real finding just to make a green checkmark — that&apos;s how a
                  check quietly stops meaning anything.
                </Bullet>
              </ul>
            </Section>
          </div>
        </main>
      ) : (
        /* Chat view: shared nav already rendered above, phone frame has no topBar */
        <div className="flex justify-center">
          <div
            className={styles.phone}
            style={{ minHeight: "calc(100dvh - 56px)" }}
          >
            <div className={styles.chat}>
              <Timestamp>Today 9:12 AM</Timestamp>

              <Received pos="first">
                you did a &quot;tree shaking&quot; pass right
              </Received>
              <Received pos="last">
                how much smaller did the bundle get
              </Received>

              <Sent pos="first">
                barely, and that&apos;s the honest answer. most of what people
                call tree shaking doesn&apos;t touch the bundle at all
              </Sent>
              <Sent pos="last">
                it splits into three buckets: stuff that ships to the browser,
                stuff that only rides along on the deploy, and stuff that&apos;s
                just messy source. only the first one is a perf win
              </Sent>

              <Received>wait explain the difference</Received>

              <Sent pos="first">
                say you delete an <code>export</code> nobody imports. feels like
                a win. but the bundler already tree-shakes unused exports out —
                it was never in the browser. so you changed exactly zero bytes at
                runtime. it&apos;s cleaner code, not a faster page
              </Sent>
              <Sent pos="last">
                deploy weight is different — like 256K of raw model files sitting
                in <code>public/</code> that nothing loads. those ship on every
                deploy. still not in the bundle, but real bytes on the artifact
              </Sent>

              <Received pos="first">
                so what actually shrank the bundle
              </Received>
              <Received pos="last">anything?</Received>

              <Sent pos="last">
                one thing. two dead hero components from an old landing, and
                deleting one let me drop <code>@shadergradient/react</code> — a
                whole WebGL package it was the only importer of. that&apos;s the
                single change that moved real browser bytes
              </Sent>

              <Timestamp>9:20 AM</Timestamp>

              <Received>
                and you found all this with a tool?
              </Received>

              <Sent pos="first">
                tools <em>nominated</em> it. depcheck for unused deps, ts-prune
                for dead exports. but every one of those is a heuristic with
                blind spots, so nothing got deleted on the report alone — a grep
                had to confirm it first
              </Sent>
              <Sent pos="last">
                two findings looked identical to the tool and needed opposite
                calls. that was the actual interesting part
              </Sent>

              <Received>like what</Received>

              <Sent pos="first">
                depcheck flagged <code>gltf-transform</code> as unused. but
                it&apos;s a command-line tool for prepping 3D models — it strips
                a compression format for a CSP reason. depcheck can&apos;t see
                usage that isn&apos;t an <code>import</code>. deleting it would&apos;ve
                broken a real pipeline to satisfy a false positive. so I kept it
              </Sent>
              <Sent pos="last">
                same report also flagged two old landing components. those were{" "}
                <em>actually</em> dead. so one flag → keep, the other → delete.
                the tool couldn&apos;t tell them apart
              </Sent>

              <Received pos="first">
                why not just keep the old components too, to be safe
              </Received>
              <Received pos="last">
                the site keeps retired versions around doesn&apos;t it
              </Received>

              <Sent pos="first">
                it does, and that was the real tension. but I was adding a{" "}
                <em>blocking</em> dead-code check to CI at the same time. if I
                keep known-dead code, I have to permanently suppress it in the
                check
              </Sent>
              <Sent pos="last">
                and suppressing dead code to make a dead-code check pass is
                just... defeating the check. so they went. the write-up about
                that hero still exists, so the history isn&apos;t lost
              </Sent>

              <Timestamp>9:31 AM</Timestamp>

              <Received>
                why blocking though, isn&apos;t that annoying
              </Received>

              <Sent pos="first">
                advisory checks get ignored until they&apos;re background noise.
                blocking means an unused import can&apos;t sneak through review.
                the price is you maintain an ignore list for the false positives,
                or the build cries wolf and someone turns it off
              </Sent>
              <Sent pos="last">
                worth it. one caveat — ts-prune&apos;s error mode also fails on
                exports used only inside their own file, which isn&apos;t dead,
                just a stray keyword. a little wrapper script filters those so it
                only fails on genuinely-unreferenced stuff
              </Sent>

              <Received>what&apos;s the one-line version</Received>

              <Sent pos="first">
                name the currency before you celebrate a deletion. cleaner source
                isn&apos;t a faster page — know which one you actually did
              </Sent>
              <Sent pos="last">
                and a tool&apos;s &quot;unused&quot; is a question, not an answer.
                never suppress a real finding just to get a green check
              </Sent>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
