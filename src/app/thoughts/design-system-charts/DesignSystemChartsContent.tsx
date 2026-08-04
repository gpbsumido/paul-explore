"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

export default function DesignSystemChartsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Framework-Agnostic Charts"
      title="Framework-Agnostic Charts"
      intro={
        <>
          This app drew its charts with recharts and unovis, both React-only, so
          nothing carried over to the Angular side of the design system. I
          rebuilt the core chart types as pure SVG computed from one
          dependency-free geometry core, so React and Angular render identical
          output and no charting runtime enters the published packages.
        </>
      }
      chat={
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <div className={styles.thread}>
            <Timestamp>Aug 2, 2026</Timestamp>

            <Sent>
              the charts in this app are all recharts and unovis. great in react,
              but the angular package in the design system has nothing. every
              chart is stuck on one side of the fence
            </Sent>

            <Received>
              so the charting library is the coupling. if you want the same chart
              in both frameworks you can&apos;t depend on a react-only runtime to
              draw it
            </Received>

            <Sent>
              right. so i pulled the math out. a chartGeometry core with no
              dependencies — it takes data and dimensions and returns plain
              numbers: point arrays, bar rects, arc paths. no react, no dom,
              nothing framework-specific
            </Sent>

            <Received>
              and then each framework just renders those numbers into svg?
            </Received>

            <Sent>
              exactly. Sparkline, BarChart, DonutChart in both @paul-portfolio/react
              and @paul-portfolio/angular. same geometry in, same svg out. the
              only difference is the templating syntax
            </Sent>

            <Received>
              how do you stop the two copies of the geometry from drifting? that&apos;s
              the classic trap with &quot;shared&quot; code that isn&apos;t actually shared
            </Received>

            <Sent>
              the geometry went red-first — 20 tests, and i mirrored the exact
              same suite in both packages. if someone tweaks the react copy and
              forgets the angular one, a test goes red. the tests are the contract
              that keeps them honest
            </Sent>

            <Received>what about accessibility? svg charts are usually a black hole for that</Received>

            <Sent>
              every chart is role=&quot;img&quot; with a data summary as its accessible
              name. so a screen reader hears &quot;revenue trending up, 12 points&quot;
              instead of nothing. colour is never the only signal, and axe tests
              confirm no violations
            </Sent>

            <Received>and the palette? consumers will want to reskin these</Received>

            <Sent>
              a new chart.css with a token-driven --paul-chart-1..6 palette. a
              consumer overrides those custom properties and every chart follows.
              nothing hard-coded
            </Sent>

            <Received>
              you also mentioned porting some components while you were in there
            </Received>

            <Sent>
              yeah, the charts were the headline but i also paid down some of the
              angular parity debt. four components whose css already shipped —
              Divider, Spinner, IconButton, Switch — got their angular ports, and
              the angular package got its first vitest config and geometry tests.
              it had no test runner at all before
            </Sent>

            <Received>full suite green?</Received>

            <Sent>
              react 184, angular 20, tokens 4, all green. version bumps and the
              changelog rode in the same PR. still plenty deferred though — the
              specialty gallery charts (funnel, radar, scatter, cohort heatmap),
              multi-series sparklines, and the rest of the angular ports. angular
              render tests are waiting on TestBed infra that isn&apos;t there yet,
              so for now the geometry is unit-tested and react is the tested
              reference for the rendered contract
            </Sent>
          </div>
        </main>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">The problem</h2>
        <p className="text-muted">
          This app drew every chart with{" "}
          <code className={code}>recharts</code> and{" "}
          <code className={code}>@unovis</code>. Both are React-only. The design
          system I&apos;d been building has an Angular package too, and it had no
          charts at all — the charting library was the coupling. Any chart I
          wanted in both frameworks was stuck behind a React-only runtime that
          drew it. On top of that, bundling a charting library into a published
          design system package drags a heavy dependency into every consumer,
          whether they render a chart or not.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          One geometry core, two renderers
        </h2>
        <p className="text-muted">
          The fix was to pull the math out of the rendering. I wrote a{" "}
          <code className={code}>chartGeometry</code> core with zero
          dependencies: it takes the data and the dimensions and returns plain
          numbers — point arrays for lines, rectangles for bars, arc paths for a
          donut. No React, no DOM, nothing framework-specific. It&apos;s just a
          function from data to coordinates.
        </p>
        <p className="mt-3 text-muted">
          Each framework then renders those numbers into SVG. React and Angular
          consume the same geometry and emit the same markup — the only
          difference is the templating syntax. Because the output is plain SVG
          computed by hand, no charting runtime enters the published packages at
          all.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Three primitives</h2>
        <p className="text-muted">
          I rebuilt the core chart types and shipped each one in{" "}
          <strong className="text-foreground">both</strong>{" "}
          <code className={code}>@paul-portfolio/react</code> and{" "}
          <code className={code}>@paul-portfolio/angular</code>:
        </p>
        <ul className="mt-3 space-y-2 text-muted">
          <li>
            <strong className="text-foreground">Sparkline</strong> — a compact
            line or area chart for inline trends.
          </li>
          <li>
            <strong className="text-foreground">BarChart</strong> — vertical or
            horizontal, with a per-bar palette.
          </li>
          <li>
            <strong className="text-foreground">DonutChart</strong> — arc
            segments with a legend.
          </li>
        </ul>
        <p className="mt-3 text-muted">
          A new <code className={code}>chart.css</code> ships a token-driven{" "}
          <code className={code}>--paul-chart-1..6</code> palette. A consumer
          overrides those custom properties and every chart re-skins with it —
          nothing is hard-coded.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Keeping the two copies from drifting
        </h2>
        <p className="text-muted">
          The classic trap with &quot;shared&quot; logic that isn&apos;t truly
          shared is drift: someone edits one copy and the other silently rots.
          The geometry went RED-first — 20 tests — and I mirrored the exact same
          suite in both packages. If the React copy changes and the Angular one
          doesn&apos;t, a test goes red. The tests are the contract that keeps
          the two implementations honest without a build-time link between them.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Accessibility built in</h2>
        <p className="text-muted">
          SVG charts are usually an accessibility black hole. Every chart here is{" "}
          <code className={code}>role=&quot;img&quot;</code> with a data summary
          as its accessible name, so a screen reader announces something useful
          instead of nothing. Colour is never the only signal, and{" "}
          <code className={code}>axe</code> tests confirm there are no
          violations. The React components were tested with Testing Library and
          axe before the implementation existed.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Paying down the Angular parity debt
        </h2>
        <p className="text-muted">
          The charts were the headline, but while I was in the Angular package I
          closed a bit more of the React-to-Angular gap. I ported four existing
          React components whose CSS already shipped —{" "}
          <code className={code}>PaulDivider</code>,{" "}
          <code className={code}>PaulSpinner</code>,{" "}
          <code className={code}>PaulIconButton</code>, and{" "}
          <code className={code}>PaulSwitch</code> — and gave the Angular
          package its first <code className={code}>vitest</code> config and
          geometry tests. It had no test runner at all before this.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">TDD and the evidence</h2>
        <p className="text-muted">
          The order was strict: geometry RED-first (20 tests, mirrored in both
          packages), then the React components (Testing Library + axe), then the
          implementation. The full workspace lands green —{" "}
          <strong className="text-foreground">react 184</strong>,{" "}
          <strong className="text-foreground">angular 20</strong>,{" "}
          <strong className="text-foreground">tokens 4</strong>. Version bumps
          and the CHANGELOG rode in the same PR, and I added Storybook stories
          for all three charts with a preview rendered from the real geometry.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">What I deferred</h2>
        <p className="text-muted">
          I kept the scope honest rather than trying to draw everything at once.
          Deferred at the time, and disclosed in the PR: the specialty gallery
          charts (funnel, radar, scatter, cohort heatmap, pareto, gauge, word
          cloud, stacked and multi-series line), multi-series{" "}
          <code className={code}>Sparkline</code>, the remaining Angular ports
          (Textarea, Select, FilterBar, InfoTip, Ticker, TiltCard,
          GradientBackground, Spotlight), and Angular render tests &mdash; there
          was no TestBed infrastructure in that package, so the geometry was
          unit-tested and React was the tested reference for the rendered
          contract.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">All of that has since landed</h2>
        <p className="text-muted">
          Every item on that list shipped in the follow-up work: the specialty
          gallery, multi-series{" "}
          <code className={code}>Sparkline</code>, the last eight Angular ports,
          and the TestBed infrastructure the render tests were waiting on. I am
          leaving the paragraph above as it was written rather than editing it
          into looking prescient, because the interesting part is what happened
          next.
        </p>
        <p className="mt-3 text-muted">
          The TestBed work paid for itself on its first probe, which failed.
          Mount a component, set an input, assert the render &mdash; the
          template rendered and setting the input did nothing. The Angular
          package was built with plain{" "}
          <code className={code}>tsc</code>, so what it published was raw
          decorators with no compiled component definitions, and every component
          in it uses a signal input, which needs the compiler. Any consumer
          binding an input got nothing back, silently, for as long as the
          package had existed. Nothing caught it because every test imported
          source files and nothing consumed the build.
        </p>
        <p className="mt-3 text-muted">
          That is the sharper version of the lesson this page already ends on.
          Deferring the Angular render tests was a reasonable call at the time,
          and it was also the reason a published package could be broken for
          months without anyone noticing. The cost of a deferral is not the
          feature you did not build; it is the class of bug you left yourself
          unable to see.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">How to think about this next time</h2>
        <ul className="mt-3 space-y-4 text-muted">
          <li>
            <strong className="text-foreground">
              Separate the geometry from the rendering.
            </strong>{" "}
            A chart is a data-to-coordinates function plus a way to draw the
            coordinates. Keep the first part framework-agnostic and dependency-free
            and the second part becomes trivial to reimplement anywhere.
          </li>
          <li>
            <strong className="text-foreground">
              Mirror the test suite to prevent drift.
            </strong>{" "}
            Shared logic copied across packages will drift unless something fails
            when it does. The same 20 geometry tests in both packages are that
            something.
          </li>
          <li>
            <strong className="text-foreground">
              A charting library is a dependency you can often avoid.
            </strong>{" "}
            Line, bar, and donut charts are a few dozen lines of SVG math. Pulling
            in recharts or unovis for them couples you to a framework and bloats
            every consumer. Hand-drawn SVG ships nothing extra.
          </li>
          <li>
            <strong className="text-foreground">
              Give SVG charts an accessible name.
            </strong>{" "}
            <code className={code}>role=&quot;img&quot;</code> plus a data
            summary turns a silent graphic into something a screen reader can
            announce. It costs almost nothing and it&apos;s easy to assert with
            axe.
          </li>
        </ul>
      </section>
    </ThoughtLayout>
  );
}
