"use client";

import PageHeader from "@/components/PageHeader";

/** A section heading with a short "why we looked" line under it. */
function Finding({
  id,
  title,
  why,
  children,
}: {
  id: string;
  title: string;
  why: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-20" id={id}>
      <h3 className="mb-1 text-base font-bold text-foreground">
        <span className="mr-2 font-mono text-[13px] text-muted">{id}</span>
        {title}
      </h3>
      <p className="mb-2 text-[13px] italic text-muted">Why look: {why}</p>
      <div className="space-y-2 text-muted">{children}</div>
    </section>
  );
}

function Tag({ kind }: { kind: "pro" | "con" | "gain" }) {
  const map = {
    pro: "text-emerald-700 dark:text-emerald-400",
    con: "text-rose-700 dark:text-rose-400",
    gain: "text-sky-700 dark:text-sky-400",
  };
  const label = { pro: "Pro", con: "Con", gain: "Gain" };
  return (
    <span className={`font-semibold ${map[kind]}`}>{label[kind]}:</span>
  );
}

const C = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
    {children}
  </code>
);

/** Whole-project engineering / system-design / UX review. */
export default function ProjectReviewContent() {
  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "Review" }]}
        showLogout={false}
        maxWidth="max-w-3xl"
      />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <header className="mb-10">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
            Dev notes
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            A review of the whole project
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            An honest, evidence-backed pass over the codebase &mdash; where the
            engineering is weak, where the system design doesn&rsquo;t hold up,
            where architecture was overfit to a single feature, and where a
            feature could be a better experience. Every finding says why it was
            worth looking at, the trade-offs, and the gain from fixing it, with
            numbers where they exist.
          </p>
        </header>

        <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
          {/* METHOD */}
          <section>
            <h2 className="mb-3 text-lg font-bold">How I looked</h2>
            <p className="text-muted">
              Four lenses, all reproducible: an axe accessibility scan (WCAG 2.1
              AA + best-practice) across every public and authenticated route; a
              census of lines-of-code and duplication by directory (
              <C>wc -l</C> + <C>grep</C> for repeated class strings and copied
              scaffolds); a production build for bundle weight; and a test-file
              census to find untested surface. The numbers below come from those,
              not vibes.
            </p>
            <p className="mt-3 text-muted">
              Headline shape:{" "}
              <span className="font-semibold text-foreground">
                ~96,300 lines of <C>src</C>, 80 page routes, 46 API routes, 94
                test files
              </span>
              . That&rsquo;s a big surface for a solo playground, and the
              distribution is the story.
            </p>
          </section>

          {/* WHAT'S GOOD */}
          <section>
            <h2 className="mb-3 text-lg font-bold">
              What&rsquo;s genuinely good (so the criticism has a baseline)
            </h2>
            <ul className="space-y-2 text-muted">
              <li>
                <span className="font-semibold text-foreground">
                  Version routing.
                </span>{" "}
                <C>?version=v1|v2|v3</C> resolved through a{" "}
                <C>VERSIONS</C> registry in <C>page.tsx</C>, with retired
                versions behind <C>next/dynamic</C> so their deps stay off the
                default path. It&rsquo;s the cleanest idea in the repo &mdash;
                three full landing eras coexist with zero conditional soup.
              </li>
              <li>
                <span className="font-semibold text-foreground">
                  The BFF boundary.
                </span>{" "}
                46 API routes proxy a separate <C>portfolio_api</C>, and the auth
                + header plumbing is centralised in <C>lib/backendFetch.ts</C>{" "}
                (<C>getBackendAuth</C>, <C>buildHeaders</C>) rather than copied
                per route. Tokens never reach the client.
              </li>
              <li>
                <span className="font-semibold text-foreground">
                  A real data layer.
                </span>{" "}
                TanStack Query is used consistently (76 call sites) with a
                centralised <C>queryKeys</C> factory &mdash; caching, dedupe, and
                background refetch are uniform, not reinvented per page.
              </li>
              <li>
                <span className="font-semibold text-foreground">
                  Design tokens + primitives.
                </span>{" "}
                One token layer (<C>styles/tokens.css</C>) bridged into Tailwind,
                and shared UI primitives used in 48 files. Theming is real, not
                per-component.
              </li>
              <li>
                <span className="font-semibold text-foreground">
                  Accessibility is now enforced.
                </span>{" "}
                14 public routes plus the 3 authenticated ones are scanned in CI
                at AA + best-practice and are clean. That bar didn&rsquo;t exist
                a week ago (see the measured gains at the end).
              </li>
            </ul>
          </section>

          {/* ENGINEERING */}
          <section>
            <h2 className="mb-4 text-lg font-bold">
              Engineering: where the craft slips
            </h2>
            <div className="space-y-7">
              <Finding
                id="E1"
                title="A third of the codebase is prose authored as React"
                why="It's the largest single thing in the repo — worth knowing what it costs."
              >
                <p>
                  The 35 <C>thoughts/*Content.tsx</C> and 14{" "}
                  <C>learn/*Content.tsx</C> files total{" "}
                  <span className="font-semibold text-foreground">
                    ~35,500 lines &mdash; about 37% of all of <C>src</C>
                  </span>
                  . Each write-up is a bespoke component: the same{" "}
                  <C>PageHeader</C> + &ldquo;Dev notes&rdquo; eyebrow + <C>main</C>{" "}
                  scaffold repeated 35 times, with individual files running
                  1,000&ndash;2,000 lines (the landing-page write-up alone is
                  1,991).
                </p>
                <p>
                  <Tag kind="con" /> Cross-cutting changes are 35&times; work.
                  The a11y sweep proved it: moving the <C>h1</C> into a landmark,
                  or making the before/after code block keyboard-scrollable, is
                  one edit in a shared layout and N edits here. Prose lives in
                  JSX, so it&rsquo;s awkward to write and diff.
                </p>
                <p>
                  <Tag kind="pro" /> Total freedom to drop an interactive demo
                  anywhere in the narrative, which is the whole point of these
                  pages.
                </p>
                <p>
                  <Tag kind="gain" /> An MDX pipeline (markdown prose, components
                  for the interactive bits) plus a shared <C>ThoughtLayout</C>{" "}
                  would keep the freedom while deleting the scaffold. Rough order:
                  the repeated layout + eyebrow + code-bubble boilerplate is a few
                  hundred lines duplicated across pages; the real win is that the
                  content becomes editable by anyone and cross-cutting fixes go to
                  one file.
                </p>
              </Finding>

              <Finding
                id="E2"
                title="The fantasy pages copy-paste their filter bar"
                why="The a11y work had to fix the same select five times — a duplication smell that bites."
              >
                <p>
                  Four fantasy pages carry a hand-rolled{" "}
                  <C>&lt;section&gt;</C> filter bar with the identical styled{" "}
                  <C>&lt;select&gt;</C> (
                  <span className="font-mono text-[13px]">
                    h-9 rounded-lg border&hellip; appearance-none&hellip;
                  </span>
                  ) &mdash; 7 copies of the same select markup, plus a per-file{" "}
                  <C>selectChevron</C>/<C>selectStyle</C> pair.
                </p>
                <p>
                  <Tag kind="con" /> Every one drifted slightly, and each needed
                  its own <C>aria-label</C> + landmark fix in the accessibility
                  pass. A bug or a restyle is N edits.
                </p>
                <p>
                  <Tag kind="gain" /> One <C>&lt;FilterBar&gt;</C> +{" "}
                  <C>&lt;LabelledSelect&gt;</C> collapses 5 files of boilerplate to
                  a handful of props and makes the next a11y/UX fix a
                  one-file change.
                </p>
              </Finding>

              <Finding
                id="E3"
                title="The v3 physics engine has zero tests"
                why="It's pure, deterministic, and load-bearing for the default landing — the easiest possible thing to test, untested."
              >
                <p>
                  <C>v3/graph/simulation.ts</C> (278 lines) and{" "}
                  <C>graphData.ts</C>/<C>buildLayeredLayout</C> are pure functions
                  &mdash; deterministic given a seed &mdash; yet there is not a
                  single unit test for them. Meanwhile the giant learn-content
                  pages <em className="text-foreground/80">do</em> have a
                  parameterised suite.
                </p>
                <p>
                  <Tag kind="con" /> The riskiest, most reused code (collision,
                  fit-to-viewport math, layout assignment) can regress silently.
                </p>
                <p>
                  <Tag kind="gain" /> A dozen cheap assertions (settling
                  converges, no two nodes overlap after N ticks, the layered
                  layout assigns every node a column) would lock the behaviour for
                  near-zero cost, because the functions take plain data in and out.
                </p>
              </Finding>

              <Finding
                id="E4"
                title="Repeated logic breeds repeated bugs"
                why="The React Doctor pass had to fix the same stepper bug across ten learn pages — a symptom, not a one-off."
              >
                <p>
                  The learn steppers share a shape but not an implementation, so
                  the play/advance off-by-one had to be fixed ten times. Same
                  pattern with the fantasy selects (E2) and the thoughts scaffold
                  (E1).
                </p>
                <p>
                  <Tag kind="gain" /> Extracting the stepper into one{" "}
                  <C>useStepPlayer</C> hook means the next fix (or feature, like
                  keyboard controls) is written once. Duplication isn&rsquo;t just
                  lines &mdash; it&rsquo;s where bugs multiply.
                </p>
              </Finding>

              <Finding
                id="E5"
                title="A minority of client components fetch by hand"
                why="A consistent data layer only helps if everything uses it."
              >
                <p>
                  26 client components call <C>fetch</C> directly. Some are
                  legitimate (inside a Query <C>queryFn</C>, or an auth-proxied
                  navigation), but a few bypass the cache/retry/dedupe that the
                  other 76 call sites get for free.
                </p>
                <p>
                  <Tag kind="gain" /> Auditing these and routing the genuine data
                  reads through Query gives them caching and error states with no
                  new abstraction.
                </p>
              </Finding>
            </div>
          </section>

          {/* SYSTEM DESIGN */}
          <section>
            <h2 className="mb-4 text-lg font-bold">
              System design: the shape of the whole
            </h2>
            <div className="space-y-7">
              <Finding
                id="S1"
                title="It's a dozen mini-apps in one shell"
                why="The defining structural fact of the project — worth naming honestly."
              >
                <p>
                  NBA fantasy, a Pokémon TCG browser, a Postgres calendar, a fleet
                  operator dashboard, an algorithms-learning suite, a GraphQL
                  pokédex, a work portfolio, and 3D labs all live in one Next app
                  and share almost no domain logic &mdash; only the shell (auth,
                  tokens, header, data layer).
                </p>
                <p>
                  <Tag kind="pro" /> For a portfolio that is exactly the goal:
                  breadth on one deployable, one design system, one auth story.
                </p>
                <p>
                  <Tag kind="con" /> As a <em>product</em> it has no center of
                  gravity; the shared surface (bundle, tokens, primitives) has to
                  serve wildly different needs, and no single feature is deep
                  enough to justify the others. That&rsquo;s fine here &mdash;
                  but it&rsquo;s the reason &ldquo;good overall system
                  design&rdquo; is the wrong yardstick. The right one is
                  &ldquo;does the shell stay thin and consistent across
                  unrelated features,&rdquo; and mostly it does.
                </p>
              </Finding>

              <Finding
                id="S2"
                title="BFF error handling is inconsistent"
                why="A thin proxy layer is only trustworthy if every route fails the same way."
              >
                <p>
                  35 of 46 API routes have explicit <C>try/catch</C> and a graceful
                  fallback; ~11 don&rsquo;t, so a backend hiccup surfaces
                  differently depending on which route you hit (a clean 502 vs an
                  unhandled throw).
                </p>
                <p>
                  <Tag kind="gain" /> A single <C>withBackend()</C> wrapper (catch
                  &rarr; typed 502, consistent logging) applied to every route
                  makes the proxy layer uniformly resilient and deletes the copied
                  try/catch blocks.
                </p>
              </Finding>

              <Finding
                id="S3"
                title="Near-identical passthrough routes"
                why="46 API routes is a lot of files for a proxy."
              >
                <p>
                  Many routes are thin passthroughs that differ only in path and
                  method. The auth/header plumbing is already shared (good), but
                  the route bodies still repeat the fetch-map-return dance.
                </p>
                <p>
                  <Tag kind="pro" /> Explicit routes are easy to read and to
                  special-case.
                </p>
                <p>
                  <Tag kind="con" /> The repetition is real; a small typed proxy
                  helper would remove it without hiding the routes.
                </p>
              </Finding>
            </div>
          </section>

          {/* OVERFIT */}
          <section>
            <h2 className="mb-4 text-lg font-bold">
              Overfitting: architecture built for one feature
            </h2>
            <div className="space-y-7">
              <Finding
                id="A1"
                title="A 1,500-line physics engine for a landing page"
                why="The user asked directly whether we overfit architecture to a feature — this is the clearest case."
              >
                <p>
                  v3 is{" "}
                  <span className="font-semibold text-foreground">
                    1,503 lines
                  </span>{" "}
                  of bespoke code: a force-directed simulation (repulsion,
                  springs, gravity, collision, label-aware spacing), a
                  fit-to-viewport renderer, a second flat layout engine, a mobile
                  fallback, and GSAP &mdash; all for the landing page.
                </p>
                <p>
                  <Tag kind="pro" /> No heavy graph dependency, full control over
                  feel, a genuinely distinctive result, and the physics is
                  self-contained and (could be) testable.
                </p>
                <p>
                  <Tag kind="con" /> It&rsquo;s a lot of surface for a page most
                  visitors skim once. A library (react-flow, d3-force) or a
                  simpler animated static layout would land ~80% of the effect for
                  a fraction of the code and maintenance. The flat view + mobile
                  path roughly double the footprint for a fallback.
                </p>
                <p>
                  <Tag kind="gain" /> Not necessarily &ldquo;rip it out&rdquo;
                  &mdash; it&rsquo;s a showpiece and it&rsquo;s isolated. But
                  it&rsquo;s the honest answer to the overfit question: yes, the
                  landing carries product-grade engineering, and the guardrail is
                  to keep it walled off (which it is) and tested (which it
                  isn&rsquo;t, see E3).
                </p>
              </Finding>

              <Finding
                id="A2"
                title="Content-as-code is an architecture choice, not just a habit"
                why="E1 measured the cost; here's the design decision under it."
              >
                <p>
                  Treating every write-up and lesson as a hand-built React
                  component &mdash; rather than content fed through a pipeline
                  &mdash; is an architectural stance. It optimises for
                  &ldquo;drop any interactive demo mid-sentence&rdquo; at the cost
                  of every other content operation (authoring, diffing,
                  translating, shared layout, bulk fixes).
                </p>
                <p>
                  <Tag kind="gain" /> MDX (or a headless CMS for the pure prose)
                  keeps the interactive escape hatch while making the other 95% of
                  each page cheap. This is the highest-leverage refactor in the
                  repo by line count.
                </p>
              </Finding>

              <Finding
                id="A3"
                title="The operator dashboard is heavier than its role"
                why="Seven dedicated hooks for one showcase feature is worth a second look."
              >
                <p>
                  Operator has 7 bespoke hooks (
                  <C>useOperatorStore/Stores/Alerts/Inventory/Mutations/Activity</C>
                  ) and its own component folder &mdash; genuinely
                  well-architected, arguably the best-engineered feature. That is
                  also the point: it carries production-app depth for a demo.
                </p>
                <p>
                  <Tag kind="pro" /> It&rsquo;s a strong portfolio proof-point and
                  the pattern is clean.
                </p>
                <p>
                  <Tag kind="con" /> The investment is disproportionate to a
                  feature nobody depends on; if effort is the scarce resource,
                  that depth is &ldquo;spent&rdquo; where E1/E3 would have paid
                  back more.
                </p>
              </Finding>
            </div>
          </section>

          {/* UX */}
          <section>
            <h2 className="mb-3 text-lg font-bold">
              Feature by feature: the top usability gap in each
            </h2>
            <p className="mb-4 text-muted">
              Each feature works; this is the single most valuable improvement
              for each, not a teardown.
            </p>
            <div className="space-y-3">
              {[
                [
                  "v3 landing (graph)",
                  "Distinctive and now accessible.",
                  "Discoverability — a first-time visitor may not grok that nodes are the nav. A one-time hint or a subtle auto-nudge of the graph on load would teach the interaction. Mobile force view is dense; it could adopt the flat list the way flat mode already does.",
                ],
                [
                  "Work portfolio",
                  "Rich, real interactive reconstructions.",
                  "The explainer dialog doesn't reliably close on Escape (a keyboard-scope timing issue caught by e2e). It's a real keyboard-usability bug — worth fixing at the scope source, not per dialog.",
                ],
                [
                  "Fantasy (NBA)",
                  "Deep data, nice win bars and predictions.",
                  "The filter bars look slightly different per page (E2) and the team colours only just became legible in light mode. Unifying the filter component would make the sub-pages feel like one feature.",
                ],
                [
                  "Learn",
                  "14 genuinely interactive lessons — a highlight.",
                  "The steppers had a shared bug (E4) and no keyboard control. A shared stepper with arrow-key support would make every lesson better at once.",
                ],
                [
                  "TCG browser",
                  "Infinite scroll + URL-synced filters, well done.",
                  "Filter state and scroll depth restore, but deep-linking a specific card back into the exact grid position isn't seamless. Minor.",
                ],
                [
                  "Calendar",
                  "Full CRUD, four views, timezone-aware.",
                  "Loading/empty states are where its contrast issues hid (only visible with no backend) — worth a deliberate empty-state design so it degrades gracefully offline.",
                ],
                [
                  "Operator",
                  "The deepest feature; live-ish fleet data.",
                  "Heading order needed a fix (h1→h3 skip); the information density is high with little onboarding. A one-line 'what am I looking at' would help a cold visitor.",
                ],
                [
                  "Thoughts",
                  "The soul of the project.",
                  "Inconsistent reading UX — some have an iMessage 'chat' toggle, most don't. Pick one reading model and apply it via the shared layout (E1).",
                ],
              ].map(([name, good, gap]) => (
                <div
                  key={name}
                  className="rounded-lg border border-border bg-surface/50 p-4"
                >
                  <p className="font-semibold text-foreground">{name}</p>
                  <p className="mt-1 text-[13px] text-muted">
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      Strength:
                    </span>{" "}
                    {good}
                  </p>
                  <p className="mt-1 text-[13px] text-muted">
                    <span className="font-medium text-sky-700 dark:text-sky-400">
                      Biggest gain:
                    </span>{" "}
                    {gap}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ROADMAP */}
          <section>
            <h2 className="mb-3 text-lg font-bold">
              If I could only do five things (by ROI)
            </h2>
            <ol className="list-decimal space-y-2 pl-5 text-muted">
              <li>
                <span className="font-semibold text-foreground">
                  Move thoughts + learn to MDX + a shared layout
                </span>{" "}
                (E1/A2). Highest leverage by far &mdash; ~37% of the codebase gets
                cheaper to change and cross-cutting fixes go to one file.
              </li>
              <li>
                <span className="font-semibold text-foreground">
                  Test the v3 physics
                </span>{" "}
                (E3). Near-zero cost, protects the default landing.
              </li>
              <li>
                <span className="font-semibold text-foreground">
                  Extract a shared filter bar / stepper
                </span>{" "}
                (E2/E4). Kills the two duplication hot-spots that already caused
                repeated bugs and repeated a11y fixes.
              </li>
              <li>
                <span className="font-semibold text-foreground">
                  A <C>withBackend()</C> wrapper for API routes
                </span>{" "}
                (S2/S3). Uniform failure + less repetition across 46 routes.
              </li>
              <li>
                <span className="font-semibold text-foreground">
                  Fix the work-portfolio Escape-close and add keyboard control to
                  learn
                </span>{" "}
                (UX). The two most concrete usability bugs surfaced here.
              </li>
            </ol>
          </section>

          {/* MEASURED GAINS */}
          <section>
            <h2 className="mb-3 text-lg font-bold">Measured, so far</h2>
            <p className="mb-3 text-muted">
              The accessibility work that preceded this review is the one place
              with before/after numbers:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="py-2 pr-4 font-semibold">Metric</th>
                    <th className="py-2 pr-4 font-semibold">Before</th>
                    <th className="py-2 font-semibold">After</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Public routes scanned in CI</td>
                    <td className="py-2 pr-4">2 (/ and /tcg)</td>
                    <td className="py-2 text-foreground">
                      14 + landmarks + auth (3)
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Axe bar</td>
                    <td className="py-2 pr-4">WCAG 2.1 AA</td>
                    <td className="py-2 text-foreground">
                      AA + best-practice
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Colour-contrast violations</td>
                    <td className="py-2 pr-4">~120 across 6 routes</td>
                    <td className="py-2 text-foreground">0</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Missing-landmark routes</td>
                    <td className="py-2 pr-4">~10</td>
                    <td className="py-2 text-foreground">0</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Whole scanned surface</td>
                    <td className="py-2 pr-4">unknown / unenforced</td>
                    <td className="py-2 text-foreground">clean, enforced</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-muted">
              The rest of this review is a map, not a receipt &mdash; the gains
              in E1&ndash;A3 are estimated from line counts and duplication
              factors, and become real numbers only once the refactors land.
              That&rsquo;s the honest state: the accessibility bar is measured and
              done; the structural debt is identified, quantified where possible,
              and prioritised.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
