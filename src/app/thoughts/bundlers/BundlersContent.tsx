"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

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

export default function BundlersContent() {
  return (
    <ThoughtLayout
      breadcrumb="Bundlers"
      title="Bundlers"
      intro={
        <>
          Which one this project runs and why, whether it&apos;s the right
              call, and the honest version of &quot;should we use something
              else?&quot; — because the interesting answer isn&apos;t a tool, it&apos;s
              knowing what actually forces the choice.
        </>
      }
      chat={
        /* Chat view: shared nav already rendered above, phone frame has no topBar */
        <div className="flex justify-center">
          <div
            className={styles.phone}
            style={{ minHeight: "calc(100dvh - 56px)" }}
          >
            <div className={styles.chat}>
              <Timestamp>Today 2:41 PM</Timestamp>

              <Received pos="first">what bundler does the site use</Received>
              <Received pos="last">and is that the best one</Received>

              <Sent pos="first">
                Turbopack. it&apos;s the default in Next 16 for both dev and
                prod builds, and nothing overrides it. the only place webpack
                shows up is the <code>analyze</code> script — the bundle
                analyzer doesn&apos;t support Turbopack, so that one command
                forces <code>--webpack</code>
              </Sent>
              <Sent pos="last">
                and yeah, it&apos;s the right call. keep it
              </Sent>

              <Received>why not switch to something faster or newer</Received>

              <Sent pos="first">
                here&apos;s the thing people miss — inside Next you only get two
                builders, Turbopack or webpack. you can&apos;t bolt Vite or
                esbuild onto a Next app, the framework is married to its bundler
              </Sent>
              <Sent pos="last">
                so &quot;switch bundlers&quot; is really three separate
                questions. Turbopack vs webpack? Turbopack wins, it&apos;s way
                faster and handles everything we do. Rspack? solves a problem we
                don&apos;t have. leave Next entirely for Vite? multi-week
                migration to lose SSR, middleware, ISR. no thanks
              </Sent>

              <Received>ok so when would you ever use a different one</Received>

              <Sent pos="first">
                when the <em>deliverable</em> changes. the biggest one: building
                a library instead of an app. npm packages need clean ESM+CJS,
                externalized deps, type declarations, real tree-shaking — that&apos;s
                Rollup or tsup, never a Next builder
              </Sent>
              <Sent pos="last">
                which actually applies to us. this site pulls in{" "}
                <code>@paul-portfolio/css</code>, <code>/react</code>,{" "}
                <code>/tokens</code>. whoever builds those packages should be on
                a library bundler, not Turbopack. same monorepo, different tool,
                because it&apos;s a different kind of thing being shipped
              </Sent>

              <Received>what are the other cases</Received>

              <Sent pos="first">
                a CLI or node service → esbuild, you just want a fast single
                file. a giant legacy webpack config that&apos;s too slow but too
                expensive to rewrite → Rspack, it&apos;s drop-in
                webpack-compatible. micro-frontends with module federation →
                webpack or Rspack, that&apos;s where it&apos;s mature
              </Sent>
              <Sent pos="last">
                and honestly, most of the time the framework decides for you.
                pick SvelteKit or Astro and you get Vite. the &quot;bundler
                choice&quot; is usually just a framework choice wearing a
                disguise
              </Sent>

              <Received>give me the one-liner</Received>

              <Sent pos="first">
                you don&apos;t pick a bundler in the abstract. name what
                you&apos;re shipping and the constraint that hurts most, and the
                tool falls out
              </Sent>
              <Sent pos="last">
                for an app in a framework you inherit a good default and leave it
                alone. the day you publish a package is the day you consciously
                reach for Rollup. that&apos;s the whole skill
              </Sent>
            </div>
          </div>
        </div>
      }
    >
      <Section title="What this project runs">
              <ul className="mt-2 space-y-2 text-muted">
                <Bullet>
                  <strong className="text-foreground">Turbopack</strong>, the
                  default in Next.js 16 (this app is on <C>next@16.1.6</C>), for
                  both <C>next dev</C> and <C>next build</C>. Nothing in the
                  scripts overrides it — <C>&quot;dev&quot;: &quot;next dev&quot;</C>{" "}
                  and <C>&quot;build&quot;: &quot;next build&quot;</C> both take
                  the default.
                </Bullet>
                <Bullet>
                  The one exception is the analyzer:{" "}
                  <C>&quot;analyze&quot;: &quot;ANALYZE=true next build --webpack&quot;</C>{" "}
                  forces the <strong className="text-foreground">webpack</strong>{" "}
                  builder, because <C>@next/bundle-analyzer</C> doesn&apos;t
                  support Turbopack. That <C>--webpack</C> flag exists purely for
                  this reason.
                </Bullet>
                <Bullet>
                  So: Turbopack for real dev and prod builds, webpack only when
                  you run <C>pnpm analyze</C>.
                </Bullet>
              </ul>
            </Section>

            <Section title="Is it the best? Should we switch?">
              <p className="mb-3 text-muted">
                Short answer: yes, keep it — and the split setup above is
                best-practice, not a compromise. The longer answer starts with a
                constraint people forget.
              </p>
              <ul className="mt-2 space-y-2 text-muted">
                <Bullet>
                  <strong className="text-foreground">
                    Inside Next.js there are only two builders:
                  </strong>{" "}
                  Turbopack and webpack. You can&apos;t drop in Vite, esbuild, or
                  Rollup for a Next app — the framework is coupled to its
                  bundler. So &quot;switch bundlers&quot; really means one of
                  three different questions.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">
                    Turbopack vs. webpack
                  </strong>{" "}
                  — Turbopack wins here. Stable and default in Next 16,
                  dramatically faster dev HMR and builds, and it handles
                  everything this app does (R3F / three.js, framer-motion, the
                  App Router). The only friction is the analyzer, already solved
                  with the separate <C>--webpack</C> script. Forcing the whole
                  project back to webpack to dodge one workaround trades everyday
                  speed for a tool you run occasionally. Bad trade.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Rspack</strong> (the
                  fast, webpack-compatible engine) — not worth it. Its selling
                  point is webpack-plugin compatibility at speed, which solves a
                  problem this app doesn&apos;t have.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">
                    Leaving Next.js entirely
                  </strong>{" "}
                  (Vite + TanStack Start / React Router) — a multi-week migration
                  that only pays off if you&apos;re fighting the framework. This
                  app leans on SSR, the App Router, middleware, ISR
                  (<C>revalidate</C>), and dynamic rendering. Switching would cost
                  weeks to lose features.
                </Bullet>
              </ul>
              <p className="mt-3 text-muted">
                <strong className="text-foreground">
                  The one caveat worth holding:
                </strong>{" "}
                because Turbopack and webpack are different engines, the{" "}
                <C>pnpm analyze</C> treemap reflects the <em>webpack</em> build,
                not the Turbopack one that actually ships. Close enough to be
                directionally useful (what&apos;s in the bundle, roughly how big),
                but don&apos;t read it as byte-exact for production.
              </p>
            </Section>

            <Section title="When a lead reaches for a different bundler">
              <p className="mb-3 text-muted">
                The senior framing: you rarely pick a bundler in the abstract.
                You pick it to fit what&apos;s being shipped and whichever
                constraint dominates. The situations that actually force it:
              </p>
              <ul className="mt-2 space-y-3 text-muted">
                <Bullet>
                  <strong className="text-foreground">
                    You&apos;re building a library, not an app.
                  </strong>{" "}
                  The most common reason to step outside a framework default.
                  npm packages need clean dual ESM+CJS output, externalized peer
                  deps, generated <C>.d.ts</C>, maximal tree-shakeability — so
                  leads reach for <strong className="text-foreground">Rollup</strong>{" "}
                  (or <C>tsup</C> / <C>unbuild</C>, which wrap esbuild/Rollup),
                  never a Next builder. Relevant here: this app consumes{" "}
                  <C>@paul-portfolio/css</C>, <C>/react</C>, and <C>/tokens</C>.
                  Whoever builds <em>those packages</em> is in library-bundler
                  territory, not Turbopack.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">
                    A CLI or Node service.
                  </strong>{" "}
                  No browser, no HMR — you just want a fast single-file bundle.
                  <strong className="text-foreground"> esbuild</strong> or{" "}
                  <C>tsup</C>; the browser-focused machinery of webpack/Vite is
                  dead weight.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">
                    A huge existing webpack config you can&apos;t afford to
                    rewrite.
                  </strong>{" "}
                  Hundreds of custom loaders/plugins, builds that take minutes.
                  Leads reach for <strong className="text-foreground">Rspack</strong>
                  , deliberately webpack-API-compatible, for near-Turbopack speed
                  as a mostly drop-in swap. The driver is{" "}
                  <em>migration cost</em>, not raw capability.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">
                    Micro-frontends / Module Federation.
                  </strong>{" "}
                  Independently-deployed frontends stitched at runtime —{" "}
                  <strong className="text-foreground">webpack or Rspack</strong>,
                  because their Module Federation support is the mature option.
                  The architecture dictates the bundler.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">
                    The framework already decided.
                  </strong>{" "}
                  For most apps this is the real answer: Remix / SvelteKit /
                  Astro / Nuxt hand you{" "}
                  <strong className="text-foreground">Vite</strong>; Next hands
                  you Turbopack/webpack. The bundler choice collapses into the
                  framework choice.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">
                    Zero-config prototyping.
                  </strong>{" "}
                  Throwaway spike, no time for config —{" "}
                  <strong className="text-foreground">Parcel</strong>. Rare in
                  production, handy for demos.
                </Bullet>
              </ul>
            </Section>

            <Section title="The mental model">
              <ul className="mt-2 space-y-2 text-muted">
                <Bullet>
                  A bundler choice is downstream of two things: the{" "}
                  <strong className="text-foreground">deliverable</strong> (app
                  vs. library vs. CLI vs. micro-frontend) and the{" "}
                  <strong className="text-foreground">
                    dominant constraint
                  </strong>{" "}
                  (dev speed, output correctness, migration cost, ecosystem
                  maturity, team familiarity). Name those two and the tool falls
                  out almost mechanically.
                </Bullet>
                <Bullet>
                  For an app inside a framework — this project — the framework
                  picks for you and you inherit a good default. Overriding it is
                  the exception, and it needs a reason bigger than a preference.
                </Bullet>
                <Bullet>
                  The moment you&apos;re <em>publishing</em> packages — like the{" "}
                  <C>@paul-portfolio/*</C> design system this site depends on — is
                  exactly when a lead consciously switches to Rollup/tsup, because
                  now output shape is the constraint that matters most. Same
                  person, same monorepo, different bundler, because the
                  deliverable changed.
                </Bullet>
              </ul>
            </Section>

            <Section title="The takeaway">
              <ul className="mt-2 space-y-2 text-muted">
                <Bullet>
                  &quot;Should we use a different bundler?&quot; is the wrong
                  first question. &quot;What are we shipping, and what&apos;s the
                  constraint that hurts most?&quot; is the right one — the bundler
                  is the answer, not the question.
                </Bullet>
                <Bullet>
                  For this app, the good decision was already made: Turbopack by
                  default, webpack only for the analyzer. No change recommended.
                </Bullet>
                <Bullet>
                  Keep a map in your head of tool → constraint (Rollup for
                  library output, esbuild for CLI speed, Rspack for webpack-config
                  migration, webpack for Module Federation, Vite via the
                  meta-framework, Parcel for zero-config). Then the choice is
                  never about taste.
                </Bullet>
              </ul>
            </Section>
    </ThoughtLayout>
  );
}
