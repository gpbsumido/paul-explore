"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function RenderPerfContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Hub", href: "/" },
          { label: "Render Performance" },
        ]}
        right={<ViewToggle view={view} setView={setView} />}
        showLogout={false}
        maxWidth="max-w-3xl"
      />

      {view === "summary" ? (
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <header className="mb-10">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted/50">
              Dev notes
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Render Performance
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              A second performance pass, this time focused on runtime rendering
              costs rather than network-level vitals. Context value instability,
              resize handler allocation, GPU-heavy CSS, unbounded DOM growth,
              and transition waste. Working through these incrementally.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">The review</h2>
              <p className="text-muted">
                The first performance pass (the other thoughts page) focused on
                Core Web Vitals: TTFB, LCP, FCP, CLS, INP. Network-level,
                load-time stuff. This pass is different. It came from profiling
                the running app and looking at what happens after the page loads
                &mdash; rendering cost, GPU pressure, memory growth, and wasted
                reconciliation.
              </p>
              <p className="mt-3 text-muted">
                The review surfaced 18 issues across four priority tiers. This
                page documents the fixes as they land.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                WeatherContext value instability
              </h2>
              <p className="text-muted">
                The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  WeatherProvider
                </code>{" "}
                was creating a new context value object on every render. The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  toggle
                </code>{" "}
                and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  setSelectedEffect
                </code>{" "}
                callbacks were also recreated every render since they
                weren&apos;t wrapped in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useCallback
                </code>
                .
              </p>
              <p className="mt-3 text-muted">
                Any state change in the provider &mdash; weather data resolving,
                the user toggling effects &mdash; forced every consumer to
                re-render. That includes{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  WeatherCanvas
                </code>{" "}
                (800+ lines of canvas animation logic) and the header menu
                component. The canvas effect&apos;s{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useEffect
                </code>{" "}
                deps are primitives so it didn&apos;t re-run the teardown/setup
                cycle, but the component still reconciled on every provider
                state change.
              </p>
              <p className="mt-3 text-muted">
                The fix: wrap{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  toggle
                </code>{" "}
                and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  setSelectedEffect
                </code>{" "}
                in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useCallback
                </code>
                , then wrap the entire context value object in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useMemo
                </code>{" "}
                keyed on its actual values. Now consumers only re-render when a
                value they care about actually changes.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                WeatherCanvas resize handler debounce
              </h2>
              <p className="text-muted">
                The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  resize
                </code>{" "}
                event listener on the weather canvas fired on every frame during
                a window drag-resize. Each invocation reset the canvas
                dimensions (clearing the buffer), called{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  effect.resize()
                </code>
                , and for the cloud effect that meant recreating all 14 cloud
                positions and calling{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  makeCloudSprite
                </code>{" "}
                14 times &mdash; each one allocating an offscreen{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  document.createElement(&apos;canvas&apos;)
                </code>{" "}
                with gradient fills.
              </p>
              <p className="mt-3 text-muted">
                That&apos;s dozens of canvas allocations per second during a
                resize drag. GC pressure spikes and visible frame drops on
                mid-range devices.
              </p>
              <p className="mt-3 text-muted">
                The fix: debounce the resize handler at 150ms. The canvas stays
                at its old size during the drag and snaps to the final
                dimensions once the user stops. The debounce timer is cleaned up
                in the effect teardown so there&apos;s no stale callback after
                unmount.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What&apos;s next</h2>
              <p className="text-muted">
                The review identified 16 more issues across backdrop-filter GPU
                pressure, infinite animations that never pause offscreen,
                unbounded DOM growth in infinite scroll lists, transition-all
                waste, background tab polling, loading state flicker, and
                missing memo boundaries. These will be addressed incrementally
                and documented here as they land.
              </p>
            </section>
          </div>
        </main>
      ) : (
        <div className="flex justify-center">
          <div
            className={styles.phone}
            style={{ minHeight: "calc(100dvh - 56px)" }}
          >
            <div className={styles.chat}>
              <Timestamp>Today 2:00 PM</Timestamp>

              <Received pos="first">
                what was that WeatherContext fix about
              </Received>
              <Received pos="last">
                saw it in the diff but wasn&apos;t sure why it mattered
              </Received>

              <Sent pos="first">
                the context provider was creating a new value object every
                render
              </Sent>
              <Sent pos="middle">
                React uses reference equality on context values. new object
                reference = every consumer re-renders, even if nothing actually
                changed
              </Sent>
              <Sent pos="last">
                that includes WeatherCanvas which is 800+ lines of canvas
                animation setup
              </Sent>

              <Received>
                so the canvas was tearing down and rebuilding every time?
              </Received>

              <Sent pos="first">
                not quite. the canvas effect deps are primitives like{" "}
                <code>activeCondition</code> and <code>enabled</code>, so the
                effect itself didn&apos;t re-run unnecessarily
              </Sent>
              <Sent pos="last">
                but the component still reconciled on every provider state
                change. that&apos;s wasted work, especially with 800 lines of
                JSX to diff through
              </Sent>

              <Received>what did you change</Received>

              <Sent pos="first">
                three things. wrapped <code>toggle</code> in{" "}
                <code>useCallback</code>, wrapped <code>setSelectedEffect</code>{" "}
                in <code>useCallback</code>, then wrapped the whole context
                value in <code>useMemo</code> keyed on the actual values
              </Sent>
              <Sent pos="last">
                now the value object only changes when something in it actually
                changes. stable references, no cascading re-renders
              </Sent>

              <Timestamp>2:06 PM</Timestamp>

              <Received>
                is this the start of a bigger performance pass?
              </Received>

              <Sent pos="first">
                yeah. did a full runtime performance review of the site
              </Sent>
              <Sent pos="middle">
                the first perf pass was about Core Web Vitals, network-level
                stuff. this one is about what happens after the page loads.
                rendering cost, GPU pressure, memory growth
              </Sent>
              <Sent pos="last">
                found 18 issues across four priority tiers. working through them
                incrementally
              </Sent>

              <Received>what are the big ones</Received>

              <Sent pos="first">
                resize handler on the weather canvas allocates dozens of
                offscreen canvases per second during a window drag
              </Sent>
              <Sent pos="middle">
                11 simultaneous backdrop-filter blur(16px) in the features
                section. that&apos;s one of the most expensive CSS compositor
                operations
              </Sent>
              <Sent pos="middle">
                the hero scroll-hint animation runs at 60fps forever, even after
                you scroll past it. framer motion infinite animations don&apos;t
                pause offscreen
              </Sent>
              <Sent pos="last">
                and the infinite scroll lists grow the DOM unbounded. no
                virtualization, no cleanup
              </Sent>

              <Received>will update this page as you go?</Received>

              <Sent>yeah, each fix gets a section here as it lands</Sent>

              <Timestamp>2:12 PM</Timestamp>

              <Received>what was the resize thing you just fixed</Received>

              <Sent pos="first">
                the weather canvas had a <code>resize</code> event listener that
                fired on every frame during a window drag
              </Sent>
              <Sent pos="middle">
                each call reset the canvas dimensions, then called{" "}
                <code>effect.resize()</code>. for the cloud effect that
                recreates all 14 clouds and calls <code>makeCloudSprite</code>{" "}
                14 times
              </Sent>
              <Sent pos="last">
                each sprite allocates an offscreen canvas with gradient fills.
                so dozens of canvas allocations per second during a resize drag
              </Sent>

              <Received>that sounds bad for GC</Received>

              <Sent pos="first">
                yeah, GC pressure spikes and visible frame drops on mid-range
                devices
              </Sent>
              <Sent pos="last">
                debounced the handler at 150ms. canvas stays at its old size
                during the drag and snaps to final dimensions when you stop.
                timer gets cleaned up in the effect teardown
              </Sent>

              <div className={styles.typingDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
