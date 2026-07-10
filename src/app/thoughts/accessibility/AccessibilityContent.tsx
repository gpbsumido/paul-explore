"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function AccessibilityContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "Accessibility" }]}
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
              Accessibility
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Adding WCAG 2.1 AA compliance to the app. Not a weekend checkbox
              exercise — a systematic audit of every primitive component, backed
              by automated axe scans at both the unit and E2E layers. The
              interesting part is where the tooling helps and where it
              doesn&apos;t.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">
                Why not just run Lighthouse
              </h2>
              <p className="text-muted">
                Lighthouse gives you a score. Scores are comforting and mostly
                useless. A page can score 100 and still be unusable with a
                keyboard because Lighthouse doesn&apos;t test interaction
                patterns — it checks static HTML snapshots. The real gaps are in
                focus management, keyboard navigation, and dynamic content
                announcements. You need tests that render your components and
                poke at them.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Two layers of axe scanning
              </h2>
              <p className="text-muted">
                The app already had{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  @axe-core/playwright
                </code>{" "}
                running in E2E tests against public routes. That catches
                page-level issues — missing landmarks, broken heading hierarchy,
                color contrast on the rendered page. But E2E tests are slow and
                coarse. You can&apos;t easily test every variant of a button or
                every error state of a form.
              </p>
              <p className="mt-3 text-muted">
                The new layer is{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  vitest-axe
                </code>{" "}
                — axe-core running inside unit tests with Testing Library.
                Render a component, pass the container to axe, assert zero
                violations. It runs in milliseconds, catches the same WCAG
                rules, and you can test every prop combination. The two layers
                complement each other: unit tests catch component-level
                violations early, E2E tests catch composition issues where
                individually accessible components break when assembled.
              </p>
              <pre className="mt-3 overflow-x-auto rounded bg-surface px-4 py-3 text-[13px] font-mono text-foreground">
                {`// src/test/a11y.ts
const axe = configureAxe({
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  },
});

// in any component test
const { container } = render(<Button>Save</Button>);
const results = await axe(container);
expect(results).toHaveNoViolations();`}
              </pre>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                The primitive component audit
              </h2>
              <p className="text-muted">
                The approach is to start at the bottom of the component tree and
                work up. The app has eight primitive components in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  src/components/ui/
                </code>
                : Button, IconButton, Input, Textarea, Modal, Tooltip, InfoTip,
                and Chip. Every feature page is built from these, so fixing them
                fixes a large surface area.
              </p>
              <p className="mt-3 text-muted">
                Each component gets its own audit pass. The pattern is the same
                every time: write a failing axe test, fix the violation, then
                add behavioral tests for keyboard interaction and screen reader
                announcements. Some highlights:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
                <li>
                  <strong>IconButton</strong> — icon-only buttons need an{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    aria-label
                  </code>
                  . Making it a required prop means TypeScript catches the
                  missing label at compile time, not in a browser audit.
                </li>
                <li>
                  <strong>Input</strong> — the gap wasn&apos;t the input itself
                  but the label association. Without an explicit{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    htmlFor
                  </code>
                  /{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    id
                  </code>{" "}
                  pair, screen readers announce the input with no context. Error
                  messages need{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    aria-describedby
                  </code>{" "}
                  and{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    aria-invalid
                  </code>{" "}
                  so they&apos;re announced when the field gets focus.
                </li>
                <li>
                  <strong>Tooltip</strong> — hover-only tooltips are invisible
                  to keyboard users. The fix is responding to{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    onFocus
                  </code>
                  /
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    onBlur
                  </code>{" "}
                  and dismissing on Escape (WCAG 1.4.13).
                </li>
                <li>
                  <strong>Modal</strong> — already had a focus trap and Escape
                  handling, but was missing{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    aria-modal=&quot;true&quot;
                  </code>{" "}
                  and wasn&apos;t marking background content as inert.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                What axe doesn&apos;t catch
              </h2>
              <p className="text-muted">
                Axe is great at structural checks — missing alt text, broken
                ARIA references, contrast ratios, heading hierarchy. It
                can&apos;t test interaction patterns. It won&apos;t tell you
                that your focus trap has a hole, or that your Tooltip
                doesn&apos;t show on keyboard focus, or that your Chip removal
                doesn&apos;t announce anything to screen readers. Those are
                behavioral tests you have to write yourself with Testing Library
                and user-event.
              </p>
              <p className="mt-3 text-muted">
                The 3D pages (particle lab, motion lab, the v1 landing hero) are
                inherently inaccessible as visual experiences. The approach
                there is descriptive ARIA labels on the canvas container and
                making sure the page is usable without the 3D content. You
                can&apos;t make a WebGL scene screen-reader-friendly, but you
                can make sure it doesn&apos;t trap focus or block navigation.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">The CI story</h2>
              <p className="text-muted">
                Unit-level axe tests run in the existing{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  npm test
                </code>{" "}
                step — no CI changes needed. The E2E axe scans already ran
                against public routes. The gap was authenticated routes:
                calendar, vitals, settings, and the operator dashboard. Those
                need real Auth0 credentials that CI doesn&apos;t have for forks,
                so they run as a separate local-only test script until the
                secrets are configured in the repo.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Skip links and landmarks
              </h2>
              <p className="text-muted">
                Every page needs a skip-to-content link (visually hidden,
                visible on focus) and semantic landmarks:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  {"<header>"}
                </code>{" "}
                for the nav bar,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  {"<main>"}
                </code>{" "}
                for the content,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  {"<nav>"}
                </code>{" "}
                for navigation. Screen reader users navigate by landmarks — if
                your page is all{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  {"<div>"}
                </code>
                s, they&apos;re scrolling through the entire DOM linearly.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Reduced motion</h2>
              <p className="text-muted">
                The app uses Framer Motion for page transitions, card reveals,
                and scroll animations. Users with vestibular disorders can set{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  prefers-reduced-motion
                </code>{" "}
                in their OS. The v2 landing sections already respected this via{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useReducedMotion()
                </code>
                . The audit extends it to everywhere Framer Motion is used:
                essential animations collapse to simple opacity fades,
                decorative ones (3D scenes, particle effects) disable entirely.
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
              <Timestamp>Today 2:30 PM</Timestamp>

              <Received pos="first">
                I want to add WCAG compliance to the app
              </Received>
              <Received pos="last">
                where do you even start with something like that
              </Received>

              <Sent pos="first">
                start at the bottom of the component tree. the primitives in
                components/ui/ — Button, Input, Modal, all of those. every
                feature page is built from them so fixing those fixes a huge
                surface area
              </Sent>
              <Sent pos="last">
                and add axe-core at the unit test level, not just E2E. you want
                fast feedback on every component variant, not a slow integration
                test that checks one page state
              </Sent>

              <Timestamp>2:35 PM</Timestamp>

              <Received>
                we already have axe in the playwright tests though
              </Received>

              <Sent pos="first">
                yeah but that only catches page-level stuff — missing landmarks,
                heading hierarchy, contrast on the rendered page. you can&apos;t
                test every button variant or every error state of a form through
                E2E
              </Sent>
              <Sent pos="middle">
                vitest-axe runs axe-core inside unit tests. render a component,
                pass the container to axe, assert zero violations. takes
                milliseconds
              </Sent>
              <Sent pos="last">
                the two layers catch different things. unit tests catch
                component-level violations early, E2E catches composition issues
                where individually accessible components break when assembled
              </Sent>

              <Timestamp>2:40 PM</Timestamp>

              <Received>what did axe actually find</Received>

              <Sent pos="first">
                IconButton had no accessible name — icon-only buttons need an
                aria-label. made it a required prop so TypeScript catches it at
                compile time
              </Sent>
              <Sent pos="middle">
                Input labels weren&apos;t programmatically associated. the label
                was visually next to the input but no htmlFor/id pair. screen
                readers announced the input with no context
              </Sent>
              <Sent pos="last">
                Tooltip only worked on hover. keyboard users couldn&apos;t see
                it. added onFocus/onBlur and Escape to dismiss
              </Sent>

              <Timestamp>2:45 PM</Timestamp>

              <Received>what about the 3D pages</Received>

              <Sent pos="first">
                you can&apos;t make a WebGL scene screen-reader-friendly.
                that&apos;s just the reality
              </Sent>
              <Sent pos="last">
                what you can do is make sure the canvas has a descriptive
                aria-label, doesn&apos;t trap focus, and the page is fully
                usable without the 3D content. the content is the point, the 3D
                is decoration
              </Sent>

              <Timestamp>2:48 PM</Timestamp>

              <Received>
                what doesn&apos;t axe catch that you had to test manually
              </Received>

              <Sent pos="first">
                all the interaction stuff. axe checks static HTML — it
                doesn&apos;t click things or press keys
              </Sent>
              <Sent pos="middle">
                focus trap holes in Modal, Tooltip not showing on keyboard
                focus, Chip removal not announcing to screen readers — those are
                behavioral tests you write with Testing Library and user-event
              </Sent>
              <Sent pos="last">
                the split is: axe for structure, manual tests for behavior. you
                need both
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
