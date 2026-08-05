/** Design-system write-up summary. */
export function DesignSystemSummary2() {
  return (
    <>
            <section>
              <h2 className="mb-3 text-lg font-bold">
                The components.css entry point
              </h2>
              <p className="text-muted">
                The original fix for the CSS reset conflict was to remove the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  @paul-portfolio/css
                </code>{" "}
                import entirely and import individual component files when
                needed. That works but it&apos;s fragile — every time you add a
                design system component, you have to remember to add another
                import line.
              </p>
              <p className="mt-3 text-muted">
                The proper fix was adding a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  components.css
                </code>{" "}
                entry point to the CSS package. It imports all component and
                utility styles but skips the reset and base layers entirely.
                Tailwind consumers use this instead of{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  index.css
                </code>
                :
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-4 text-[13px] font-mono text-foreground">
                {`@import "@paul-portfolio/css/components.css";`}
              </pre>
              <p className="mt-3 text-muted">
                Now this app gets all design system component styles through one
                import with no reset conflicts. When new components are added to
                the design system, they&apos;re automatically available here.
                The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  index.css
                </code>{" "}
                entry point still exists for consumers that want the full
                package — vanilla HTML apps that don&apos;t bring their own
                reset. This also made{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  @paul-portfolio/css
                </code>{" "}
                an explicit dependency in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  package.json
                </code>{" "}
                rather than relying on it being a transitive dependency of the
                React package.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Charts, and the three bugs that were older than the charts
              </h2>
              <p className="text-muted">
                The design system grew eleven chart forms: sparkline, bar,
                donut, funnel, radar, scatter, cohort heatmap, pareto, gauge,
                word cloud, and stacked/multi-series line. All of them compute
                their geometry in one pure, dependency-free core that is
                mirrored into the Angular package and unit tested in both, so
                the two copies cannot drift. Every chart renders plain SVG with
                {" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">role=&quot;img&quot;</code>
                {" "}
                and a data summary as its accessible name, which means colour is
                never the only signal.
              </p>
              <p className="mt-3 text-muted">
                That was the plan. Three things turned up along the way that had
                nothing to do with charts and had all been true for a while.
              </p>
              <p className="mt-3 text-muted">
                <strong className="text-foreground">
                  The Angular package did not work.
                </strong>{" "}
                It was built with plain{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">tsc</code>
                , so the published output was raw decorators: no compiled
                component definitions in the JavaScript, none of the
                declarations a consuming app type checks against. Every
                component in it uses signal{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">input()</code>
                , which needs the Angular compiler to exist at build time. A
                consumer binding an input would have got nothing, silently. The
                first render test written against the package reproduced it in
                one assertion. The fix is{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">ng-packagr</code>
                {" "}
                in partial compilation mode, and a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">verify:consumer</code>
                {" "}
                step that compiles a stand-in consumer against the built output
                with strict template checking, because nothing else in the repo
                consumed the artifact it publishes.
              </p>
              <p className="mt-3 text-muted">
                <strong className="text-foreground">
                  The chart palette failed its colour checks.
                </strong>{" "}
                Slots one and two, the first two series in every multi-series
                chart, were blue and purple at a perceptual distance of 1.3
                under deuteranopia and 12 for normal vision, against a floor of
                15. The last slot sat outside the lightness band and below the
                chroma floor, so it read as grey. The replacement reorders and
                re-steps the ramp, adds a cyan hue the token set was missing,
                and picks the dark mode values separately rather than flipping
                the light ones, because the dark lightness band is tighter. The
                six checks now live in the repo as a test, so the next colour
                edit cannot quietly undo it.
              </p>
              <p className="mt-3 text-muted">
                <strong className="text-foreground">
                  The CSS package&apos;s tests had never run.
                </strong>{" "}
                Twenty-one test files, a vitest config, a parser dependency, and
                no{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">test</code>
                {" "}
                in its package.json, so the workspace-wide test command skipped
                the package entirely. 139 assertions that had never executed
                once. They all pass now that they run, which is luck rather than
                reassurance: a skipped workspace and a passing one look
                identical in the output.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Encoding decisions worth defending
              </h2>
              <p className="text-muted">
                A chart primitive is an opinion about how data should be read,
                so a few of these needed an argument rather than an API.
              </p>
              <p className="mt-3 text-muted">
                <strong className="text-foreground">
                  The pareto chart has one y axis.
                </strong>{" "}
                The textbook version puts counts on the left and cumulative
                percent on the right. Two scales on one plot have an arbitrary
                alignment, which invents a relationship the data does not
                contain. Here the bars are percent of total and the line is
                cumulative percent, both on 0 to 100, so the crossing point
                means something. A test asserts no rendered label is a raw
                count, because the rule is easier to break than to remember.
              </p>
              <p className="mt-3 text-muted">
                <strong className="text-foreground">
                  Ordered data gets an ordered ramp.
                </strong>{" "}
                Funnel stages and heatmap cells encode magnitude, so they use a
                single-hue sequential ramp rather than the categorical series
                palette. Putting identity colours on ordered data spends the one
                free channel on information the chart already shows through
                length or position.
              </p>
              <p className="mt-3 text-muted">
                <strong className="text-foreground">
                  The word cloud ships with its own objection.
                </strong>{" "}
                Glyph area is not a comparable encoding and a long word reads as
                bigger than a short one at the same weight. It exists because a
                gallery wants one. The caveat is at the top of its doc comment,
                and its accessible name carries the complete ranked list even
                when the layout drops a term, so the honest version of the data
                is always present.
              </p>
              <p className="mt-3 text-muted">
                <strong className="text-foreground">
                  Reduced motion means stop rotating, not rotate slower.
                </strong>{" "}
                The spinner answered{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">prefers-reduced-motion</code>
                {" "}
                by slowing from 0.6s to 1.5s. Rotation is the vestibular
                trigger, so that is the same motion for longer. It now swaps to
                an opacity pulse with no rotation at all. It does not stop dead,
                because a frozen spinner is indistinguishable from a hung one,
                and the component already announces itself to assistive tech
                through a live status role, so the animation only ever served
                sighted users.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                The consuming app found the library&apos;s bug
              </h2>
              <p className="text-muted">
                The Ticker&apos;s marquee duplicates its content so the loop
                looks seamless, and the copy is{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">aria-hidden</code>. Its focusable
                controls were pulled out of the tab order by an effect that ran
                after render. An effect runs after paint, so between mount and
                that effect the duplicate held tabbable buttons inside a hidden
                container, and every re-render reopened the window.
              </p>
              <p className="mt-3 text-muted">
                Hiding something from assistive technology while leaving it
                reachable by keyboard is worse than not hiding it: the user tabs
                onto a control a screen reader insists is not there. Both
                packages now mark the clone{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">inert</code>, which takes the tab order and
                the accessibility tree out together &mdash; the pair that had
                come apart. The manual sweep stays behind a capability check for
                browsers without support.
              </p>
              <p className="mt-3 text-muted">
                What is worth keeping is where it was found. Not in the library,
                which had a comment asserting that assistive tech never saw the
                duplicate, and not in its own test suite. It was an accessibility
                scan on a page in this app that happened to render the component.
                A shared library means one mistake reaches every consumer at
                once; it also means the first consumer to look properly finds it
                for all of them. The Angular port carried the identical bug,
                comment and all, and was still in review &mdash; so that copy was
                fixed before it ever shipped.
              </p>

              <h2 className="mb-3 mt-8 text-lg font-bold">
                Adopting it back, and what the gallery caught
              </h2>
              <p className="text-muted">
                Pulling the new packages into this app took an explicit version
                bump rather than an install: the dependencies were pinned with a
                caret on a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">0.x</code> range, and a caret on a
                zero-major does not cross a minor. The app would have sat on the
                old version indefinitely while appearing to track the package.
              </p>
              <p className="mt-3 text-muted">
                The bump immediately failed a test, which is the outcome I
                wanted. The design-system gallery in this app asserts that it
                documents every component the package exports, and the new
                release added fourteen it had never heard of. That test is doing
                the job a changelog cannot: it makes an undocumented component a
                build failure rather than a gap somebody notices months later.
                All fourteen are documented now, each with the accessibility
                guarantees read off the component rather than assumed, and each
                marked as shipping in the package but not yet adopted here
                &mdash; because claiming otherwise would be the easy lie.
              </p>

              <h2 className="mb-3 text-lg font-bold">
                How to think about this next time
              </h2>
              <ul className="mt-3 space-y-4 text-muted">
                <li>
                  <strong className="text-foreground">
                    Publish a dry run before real consumers depend on it.
                  </strong>{" "}
                  Run{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    npm pack --dry-run
                  </code>{" "}
                  and inspect every file in the tarball. If a file is 0 bytes or
                  a test file, the build is wrong.
                </li>
                <li>
                  <strong className="text-foreground">
                    Validate token output against all consumers.
                  </strong>{" "}
                  Tokens look fine in a browser but break in SWC, esbuild, or
                  Lightning CSS. Run the generated CSS through the strictest
                  parser in your stack before publishing.
                </li>
                <li>
                  <strong className="text-foreground">
                    Don&apos;t use{" "}
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      file:
                    </code>{" "}
                    paths in PRs that go through CI.
                  </strong>{" "}
                  They work locally but fail on any runner that doesn&apos;t
                  have the sibling repo checked out. Publish first, then open
                  the consumer PR with version ranges.
                </li>
                <li>
                  <strong className="text-foreground">
                    Keep the build config separate from the test config.
                  </strong>{" "}
                  A single tsconfig that includes both source and tests works
                  for type checking during development but fails as a build
                  step. Use a{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    tsconfig.build.json
                  </code>{" "}
                  that only includes source files.
                </li>
                <li>
                  <strong className="text-foreground">
                    The{" "}
                    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                      @theme
                    </code>{" "}
                    block is a definition, not a passthrough.
                  </strong>{" "}
                  Tailwind v4&apos;s{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    @theme
                  </code>{" "}
                  creates new custom properties. Writing{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    --color-X: var(--color-X)
                  </code>{" "}
                  looks like it&apos;s forwarding a value, but it&apos;s
                  actually creating a circular reference that silently resolves
                  to nothing. Always reference a differently-named source
                  variable.
                </li>
                <li>
                  <strong className="text-foreground">
                    Only import the layer you need.
                  </strong>{" "}
                  A design system CSS package bundles resets, base styles, and
                  component CSS — all useful if you&apos;re using the CSS-only
                  components. But if you&apos;re consuming the React wrapper
                  package, importing the full CSS package layers competing
                  resets and{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    @layer
                  </code>{" "}
                  declarations on top of Tailwind. Use{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    components.css
                  </code>{" "}
                  instead — it ships only component styles with no reset.
                </li>
                <li>
                  <strong className="text-foreground">
                    Monorepo Storybook needs source aliases, not dist imports.
                  </strong>{" "}
                  In a monorepo, Storybook runs before sibling packages are
                  built. If your component package&apos;s{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    exports
                  </code>{" "}
                  point at{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    dist/
                  </code>
                  , add a Vite alias to resolve the package to source. And if
                  the source files use JSX without importing React, set{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    esbuild.jsx: &apos;automatic&apos;
                  </code>{" "}
                  in the Vite config.
                </li>
                <li>
                  <strong className="text-foreground">
                    Portal components need static stories for visual testing.
                  </strong>{" "}
                  Chromatic captures what&apos;s inside the Storybook root.{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    createPortal
                  </code>{" "}
                  renders outside it. Interactive stories that open portalled
                  content will crash the snapshot. Add a separate story that
                  renders the component in its open state without interaction.
                </li>
                <li>
                  <strong className="text-foreground">
                    Grep every consumer when renaming tokens.
                  </strong>{" "}
                  Renaming{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    --paul-spacing-0.5
                  </code>{" "}
                  to{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    --paul-spacing-0_5
                  </code>{" "}
                  in the tokens package is only half the fix. The CSS component
                  package is a consumer too — it was still referencing the old
                  escaped-dot names and silently failing. Treat token renames as
                  cross-package breaking changes and grep everything.
                </li>
                <li>
                  <strong className="text-foreground">
                    Test the artifact you publish, not the source you wrote.
                  </strong>{" "}
                  A package can have a full green test suite and still ship
                  something no consumer can use, because the tests import source
                  files and the consumer imports the build. One compile of a
                  stand-in consumer against the built output would have caught a
                  broken Angular package the day it started shipping.
                </li>
                <li>
                  <strong className="text-foreground">
                    A skipped workspace looks exactly like a passing one.
                  </strong>{" "}
                  A package with test files, a test config, and no{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">test</code>
                  {" "}
                  script is silently excluded from{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">npm test --workspaces</code>
                  . Nothing fails. Count the suites in the output occasionally,
                  not just the colour of it.
                </li>
                <li>
                  <strong className="text-foreground">
                    Colour choices are computable, so compute them.
                  </strong>{" "}
                  A categorical palette that looks obviously distinct can have
                  two adjacent slots that vanish into each other under
                  colourblind simulation. Run the numbers, keep them in a test,
                  and treat slot order as part of the contract, because adjacent
                  slots are the pairs a reader has to tell apart.
                </li>
                <li>
                  <strong className="text-foreground">
                    Dark mode is a second set of values, not an inversion.
                  </strong>{" "}
                  The lightness band that reads well on a dark surface is
                  narrower than the one for light. Flipping the light steps puts
                  half of them outside it. Pick and validate the dark ramp
                  separately.
                </li>
                <li>
                  <strong className="text-foreground">
                    Reduced motion means remove the trigger, not slow it down.
                  </strong>{" "}
                  Halving the speed of a rotation is still a rotation. If the
                  component conveys its state some other way, for example a live
                  status role, the animation is decoration and can be replaced
                  outright with something that does not rotate or travel.
                </li>
                <li>
                  <strong className="text-foreground">
                    Inconsistent visual snapshots have a cause you can measure.
                  </strong>{" "}
                  Rather than guessing which story is flaky, render every story
                  twice and compare the bytes. It named the eleven animated
                  stories in one pass, and it also showed that two apparent
                  failures were races in the measuring harness rather than the
                  UI, which is the mistake worth avoiding.
                </li>
                <li>
                  <strong className="text-foreground">
                    Make the mismatch unrepresentable.
                  </strong>{" "}
                  A heatmap that takes a grid and a separate array of row labels
                  lets the two lengths disagree, and the failure is quiet: one
                  label vanishes and every other row still looks correct.
                  Passing rows that carry their own labels removes the state
                  entirely.
                </li>
                <li>
                  <strong className="text-foreground">
                    A silent cap is a bug report you never receive.
                  </strong>{" "}
                  Truncating a radar chart past three series is right, because a
                  fourth overlapping polygon is unreadable. Doing it without
                  saying anything leaves whoever passed five wondering where two
                  went. Warn in development and name the number dropped.
                </li>
                <li>
                  <strong className="text-foreground">
                    Don&apos;t put unstable callbacks in useEffect deps.
                  </strong>{" "}
                  A modal&apos;s{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    onClose
                  </code>{" "}
                  prop is typically an inline arrow function — new reference on
                  every parent render. If your{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    useEffect
                  </code>{" "}
                  depends on a callback derived from it, the effect re-runs on
                  every render. If the effect manages focus, it steals focus
                  from inputs. Store the handler in a ref instead.
                </li>
              </ul>
            </section>
    </>
  );
}
