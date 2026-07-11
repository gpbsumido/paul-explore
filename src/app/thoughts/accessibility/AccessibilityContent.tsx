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

            <section>
              <h2 className="mb-3 text-lg font-bold">Color contrast</h2>
              <p className="text-muted">
                WCAG SC 1.4.3 requires a 4.5:1 contrast ratio for normal text
                and 3:1 for large text (18px+ or 14px+ bold). SC 1.4.11 extends
                the 3:1 minimum to UI components and graphical objects. Axe
                catches most contrast issues at render time, but dynamic states
                (hover, focus, active) need manual verification.
              </p>
              <p className="mt-3 text-muted">
                The audit found several muted text colors sitting below the
                4.5:1 threshold against both light and dark backgrounds.
                Adjusting these was straightforward, the tricky part was making
                sure the fixes held across both themes. The design token system
                helps here since contrast only needs to be verified at the token
                level, not per-component.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Testing patterns for new components
              </h2>
              <p className="text-muted">
                Every new component should follow the same three-layer test
                pattern that came out of the audit. First, axe scans for every
                visual variant (default, loading, error, disabled, empty). Each
                variant can produce different DOM structures that need separate
                evaluation. Second, label and ARIA assertions using{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  getByLabelText
                </code>
                ,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  aria-describedby
                </code>{" "}
                checks, and role verification. Third, keyboard behavior tests
                with user-event — tab order, Escape dismissal, Enter/Space
                activation.
              </p>
              <p className="mt-3 text-muted">
                The specifics to verify depend on what the component does:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
                <li>
                  <strong>Label association</strong> (SC 1.3.1, 4.1.2) — every
                  form control needs a programmatic label via{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    htmlFor
                  </code>
                  /
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    id
                  </code>{" "}
                  or{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    aria-label
                  </code>
                  . Use{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    useId()
                  </code>{" "}
                  for stable IDs.
                </li>
                <li>
                  <strong>Focus management</strong> (SC 2.4.3, 2.4.7) — modals
                  trap focus and restore it on close, visible focus rings on all
                  interactive elements, use{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    aria-disabled
                  </code>{" "}
                  over native{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    disabled
                  </code>{" "}
                  so elements stay keyboard-focusable.
                </li>
                <li>
                  <strong>Keyboard interaction</strong> (SC 2.1.1, 2.1.2) —
                  everything clickable works with Enter/Space, tooltips appear
                  on focus and dismiss on Escape (SC 1.4.13), no{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    tabIndex
                  </code>{" "}
                  values greater than 0.
                </li>
                <li>
                  <strong>Color contrast</strong> (SC 1.4.3, 1.4.11) — 4.5:1 for
                  text, 3:1 for UI components. Axe catches most of this but
                  verify dynamic states manually.
                </li>
                <li>
                  <strong>Motion</strong> (SC 2.3.1, 2.3.3) — respect{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    prefers-reduced-motion
                  </code>
                  . Essential animations become opacity fades, decorative ones
                  disable.
                </li>
                <li>
                  <strong>Live regions</strong> (SC 4.1.3) — character counts
                  and status messages use{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    aria-live=&quot;polite&quot;
                  </code>
                  , error messages use{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    role=&quot;alert&quot;
                  </code>
                  .
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                WCAG for the uninitiated
              </h2>
              <p className="text-muted">
                WCAG (Web Content Accessibility Guidelines) sounds like a dense
                legal document, and honestly, parts of it are. But the core idea
                is simple: people interact with the web in different ways, and
                your UI shouldn&apos;t assume they&apos;re all using a mouse
                with perfect vision. WCAG organizes everything under four
                principles, remembered by the acronym POUR:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
                <li>
                  <strong>Perceivable</strong> — can the user actually see or
                  hear the content? Text alternatives for images, captions for
                  video, sufficient color contrast, content that works when you
                  zoom to 200%.
                </li>
                <li>
                  <strong>Operable</strong> — can they interact with it? Full
                  keyboard support, enough time to read and act, no content that
                  causes seizures, clear navigation and focus indicators.
                </li>
                <li>
                  <strong>Understandable</strong> — does it make sense? Readable
                  text, predictable behavior, helpful error messages. Forms
                  should tell you what went wrong and how to fix it.
                </li>
                <li>
                  <strong>Robust</strong> — does it work with different
                  technologies? Valid HTML, proper ARIA usage, compatibility
                  with assistive tech like screen readers and voice control.
                </li>
              </ul>
              <p className="mt-3 text-muted">
                There are three conformance levels: A (bare minimum), AA (the
                standard everyone targets and what most legal requirements
                reference), and AAA (ideal but rarely required in full). This
                project targets AA across the board.
              </p>
              <p className="mt-3 text-muted">
                Each rule is called a &quot;Success Criterion&quot; and has a
                number like SC 1.4.3 (contrast) or SC 2.1.1 (keyboard). You
                don&apos;t need to memorize them, but knowing the numbering
                system helps when you see them referenced in axe violations or
                audit reports. The first digit maps to POUR: 1 = Perceivable, 2
                = Operable, 3 = Understandable, 4 = Robust.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Getting up to speed</h2>
              <p className="text-muted">
                The fastest way to build real intuition is to use your own app
                without a mouse. Tab through the page. Can you reach every
                button? Can you tell where focus is? Can you dismiss a modal
                with Escape? Try a screen reader too — VoiceOver is built into
                macOS (Cmd+F5). You&apos;ll immediately feel the difference
                between a labeled input and an unlabeled one.
              </p>
              <p className="mt-3 text-muted">
                After that, the most practical learning path:
              </p>
              <ul className="mt-3 list-decimal space-y-2 pl-5 text-muted">
                <li>
                  <strong>Start with the axe browser extension</strong> —
                  install it in Chrome or Firefox, run it on your pages, and
                  read the violations. Each one links to a detailed explanation
                  of the WCAG criterion it violates and how to fix it. This
                  teaches you the rules through your own code, not abstract
                  examples.
                </li>
                <li>
                  <strong>Learn semantic HTML before ARIA</strong> — most
                  accessibility problems come from using{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    {"<div>"}
                  </code>{" "}
                  and{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    {"<span>"}
                  </code>{" "}
                  for everything. Use{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    {"<button>"}
                  </code>
                  ,{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    {"<nav>"}
                  </code>
                  ,{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    {"<main>"}
                  </code>
                  ,{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    {"<label>"}
                  </code>{" "}
                  — the browser gives you keyboard support, screen reader
                  announcements, and focus management for free. ARIA is a patch
                  for when HTML doesn&apos;t have the right element, not a
                  replacement for using the right element.
                </li>
                <li>
                  <strong>Read the WAI-ARIA Authoring Practices</strong> — this
                  is the official patterns guide. It shows exactly how common
                  widgets (tabs, modals, comboboxes, menus) should behave for
                  keyboard and screen reader users. It&apos;s the single best
                  reference for &quot;how should this component work
                  accessibly?&quot;
                </li>
                <li>
                  <strong>Follow a structured course</strong> — Google&apos;s
                  free &quot;Accessibility&quot; course on web.dev covers the
                  fundamentals well. For deeper dives, Deque University (the
                  team behind axe-core) has detailed modules on ARIA, testing,
                  and design patterns.
                </li>
                <li>
                  <strong>Practice on real audit findings</strong> — the best
                  teacher is fixing actual violations. Run axe, fix what it
                  finds, then test the keyboard flow and screen reader output.
                  Each fix teaches you a rule you won&apos;t forget because you
                  felt the problem before you solved it.
                </li>
              </ul>
              <p className="mt-3 text-muted">
                You don&apos;t need to read the full WCAG spec. Most day-to-day
                web development touches the same dozen or so criteria
                repeatedly: labels (1.3.1, 4.1.2), keyboard access (2.1.1),
                focus visible (2.4.7), contrast (1.4.3), error identification
                (3.3.1), and name/role/value (4.1.2). Get comfortable with those
                and you&apos;re ahead of most developers.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">PR review checklist</h2>
              <p className="text-muted">
                A quick reference for reviewing PRs that touch UI. Not every
                item applies to every PR, but scanning the list catches the
                common gaps.
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
                <li>Axe scan test exists for every visual variant</li>
                <li>
                  Interactive elements reachable and operable by keyboard alone
                </li>
                <li>Focus ring visible on all interactive elements</li>
                <li>
                  Labels associated with inputs (not just placeholder text)
                </li>
                <li>
                  Error states linked via{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    aria-describedby
                  </code>{" "}
                  and announced with{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    role=&quot;alert&quot;
                  </code>
                </li>
                <li>
                  Icon-only buttons have descriptive{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    aria-label
                  </code>
                </li>
                <li>Modal/overlay traps focus and restores it on close</li>
                <li>
                  Animations respect{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    prefers-reduced-motion
                  </code>
                </li>
                <li>
                  Color contrast meets 4.5:1 for text, 3:1 for UI components
                </li>
                <li>
                  No{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    tabIndex
                  </code>{" "}
                  values greater than 0
                </li>
                <li>
                  Page has skip link and semantic landmarks (
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    {"<main>"}
                  </code>
                  ,{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    {"<nav>"}
                  </code>
                  ,{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    {"<header>"}
                  </code>
                  )
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Three-layer defense</h2>
              <p className="text-muted">
                The project now has three layers catching accessibility issues
                at different stages. First, eslint-plugin-jsx-a11y runs
                recommended WCAG rules at lint time, catching structural issues
                like missing alt text, invalid ARIA attributes, and
                non-interactive elements with click handlers before the code
                even runs. Second, vitest-axe runs axe-core inside unit tests,
                scanning every component variant against WCAG 2.1 AA criteria in
                milliseconds. Third, @axe-core/playwright runs full-page axe
                scans in E2E tests against rendered routes.
              </p>
              <p className="mt-3 text-muted">
                Each layer catches things the others miss: lint catches patterns
                (like a div with onClick but no role), unit tests catch rendered
                DOM issues (like a generated ID that doesn&apos;t match), and
                E2E tests catch composition problems (like two components that
                individually pass but together create duplicate landmarks).
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                The feature-level audit
              </h2>
              <p className="text-muted">
                The bottom-up approach (primitives first) left a gap:
                feature-level components in operator/, calendar/, fantasy/, and
                learn/ were assembled from accessible primitives but introduced
                their own violations. Operator pages had charts with no text
                alternatives (screen readers announced empty containers),
                skeleton loaders that cluttered the accessibility tree, and
                stock bars with no semantic meaning. The calendar had a combobox
                that couldn&apos;t be operated by keyboard, toggle buttons with
                no ARIA state, and time grid slots that were click-only.
              </p>
              <p className="mt-3 text-muted">
                The fix was systematic: run axe on every feature component, fix
                what it finds, then add behavioral tests for keyboard
                interaction. 29 new tests across two test files cover the
                feature layer now.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Lint-time accessibility with eslint-plugin-jsx-a11y
              </h2>
              <p className="text-muted">
                Adding eslint-plugin-jsx-a11y to the ESLint config catches a
                category of issues that neither axe nor manual testing reliably
                finds: patterns that are always wrong regardless of runtime
                state. Things like a div with an onClick handler but no role
                attribute, an img without alt, an anchor without href, or an
                interactive element without a keyboard handler. The plugin runs
                the recommended WCAG rules from the jsx-a11y package.
              </p>
              <p className="mt-3 text-muted">
                One gotcha when using it alongside eslint-config-next: Next.js
                already registers the jsx-a11y plugin internally, so you only
                add the recommended rules object, not the full plugin config.
                Trying to register the plugin twice causes a &quot;Cannot
                redefine plugin&quot; error.
              </p>
              <p className="mt-3 text-muted">
                In the browser, the Firefox Accessibility Inspector and the axe
                DevTools extension complement this by letting you inspect the
                live accessibility tree, run on-demand axe scans, and simulate
                how screen readers interpret your page. Between lint, unit
                tests, and browser dev tools, most violations get caught before
                they reach a PR.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Event delegation and nested interactives
              </h2>
              <p className="text-muted">
                CalendarGrid has a pattern that doesn&apos;t fit neatly into
                accessibility rules: a day cell that&apos;s clickable (to create
                an event) but also contains clickable EventChip buttons. You
                can&apos;t put role=&quot;button&quot; on the outer div because
                that creates nested interactive elements, which is an axe
                violation. You can&apos;t remove the click handler because
                clicking empty space in the cell should open the event creator.
              </p>
              <p className="mt-3 text-muted">
                The solution is event delegation: the outer div handles onClick
                but checks if the click target is inside a button or anchor (via
                closest(&quot;button, a&quot;)). If it is, the click belongs to
                the child and the parent ignores it. The div keeps its
                aria-label for screen readers and handles Enter/Space for
                keyboard users, but the eslint rule for
                no-static-element-interactions gets a targeted disable comment
                since the pattern is intentional. This is the right tradeoff —
                the alternative (wrapping all empty space in invisible buttons)
                creates worse keyboard navigation.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Accessibility beyond code
              </h2>
              <p className="text-muted">
                Automated tools catch roughly 30-40% of accessibility issues.
                The rest requires human judgment. Some things to build habits
                around: Test with sound off to make sure nothing depends solely
                on audio cues. Test at 200% zoom to verify layouts don&apos;t
                break. Respect user preferences via media queries:
                prefers-reduced-motion for animations, prefers-color-scheme for
                themes, prefers-contrast for high-contrast modes.
              </p>
              <p className="mt-3 text-muted">
                Make click targets large enough for users with motor impairments
                and avoid time-limited interactions like auto-dismissing popups.
                Use skip links so keyboard users can bypass repetitive
                navigation. Provide captions for video and audio content.
                Consider offering dyslexia-friendly font options for text-heavy
                pages. The goal isn&apos;t perfection, it&apos;s building habits
                that make accessibility a natural part of development rather
                than an afterthought audit.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                How the tests work in practice
              </h2>
              <p className="text-muted">
                Accessibility tests run at three different points in the
                development cycle, and each one activates automatically — no
                extra commands or config needed.
              </p>
              <p className="mt-3 text-muted">
                <strong>Lint time (eslint-plugin-jsx-a11y)</strong> — fires on
                every save if your editor has ESLint integration, and runs in CI
                as part of the standard lint step. Catches structural issues
                before the code even executes: missing alt text, click handlers
                without keyboard support, invalid ARIA attributes. Zero
                developer effort to activate — if your ESLint config inherits
                from the project&apos;s{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  eslint.config.mjs
                </code>
                , you get the rules.
              </p>
              <p className="mt-3 text-muted">
                <strong>Unit tests (vitest-axe)</strong> — run as part of the
                normal{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  npm test
                </code>{" "}
                command alongside all other Vitest tests. The axe matchers are
                globally registered in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  src/test/setup.ts
                </code>
                , so any test file can import{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  axe
                </code>{" "}
                from{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  @/test/a11y
                </code>{" "}
                and call{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  expect(results).toHaveNoViolations()
                </code>
                . These run in CI on every push.
              </p>
              <p className="mt-3 text-muted">
                <strong>E2E tests (@axe-core/playwright)</strong> — run via{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  npm run test:e2e
                </code>{" "}
                for public routes and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  npm run test:e2e:auth
                </code>{" "}
                for authenticated routes. Public route scans run in CI.
                Authenticated scans require real Auth0 credentials and run
                locally.
              </p>
              <h3 className="mt-6 mb-2 text-base font-bold">
                When building a new feature
              </h3>
              <p className="text-muted">
                The process is the same every time. Write your component, then
                add an accessibility test alongside your other tests:
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
                <li>
                  <strong>Add an axe scan for each visual variant</strong> —
                  default, loading, error, disabled, empty. Each variant can
                  produce different DOM structures, so each needs its own scan.
                  Import{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    axe
                  </code>{" "}
                  from{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    @/test/a11y
                  </code>
                  , render the component, pass the container, assert zero
                  violations.
                </li>
                <li>
                  <strong>Add ARIA and label assertions</strong> — use{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    getByRole
                  </code>
                  ,{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    getByLabelText
                  </code>
                  , and{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    toHaveAttribute
                  </code>{" "}
                  to verify roles, labels, aria-expanded, aria-selected, and
                  other ARIA state. These document the component&apos;s
                  accessible API.
                </li>
                <li>
                  <strong>Add keyboard behavior tests</strong> — if the
                  component is interactive, verify it works with Enter, Space,
                  Escape, and arrow keys as appropriate. Use{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    userEvent.keyboard
                  </code>{" "}
                  to simulate keypresses and assert the right callbacks fire.
                </li>
                <li>
                  <strong>Check heading structure</strong> — if your feature
                  adds a new page, make sure it has an{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    {"<h1>"}
                  </code>
                  . If it&apos;s visually redundant with PageHeader, use{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    sr-only
                  </code>{" "}
                  to hide it visually while keeping it in the accessibility
                  tree.
                </li>
                <li>
                  <strong>Verify contrast</strong> — don&apos;t use opacity
                  modifiers on text-muted (like{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    text-muted/30
                  </code>
                  ). The base token already meets contrast requirements;
                  reducing its opacity drops it below the 4.5:1 threshold.
                </li>
              </ol>
              <pre className="mt-3 overflow-x-auto rounded bg-surface px-4 py-3 text-[13px] font-mono text-foreground">
                {`// typical a11y test for a new component
import { axe } from "@/test/a11y";

it("has no axe violations", async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

it("is keyboard accessible", async () => {
  render(<MyComponent onAction={onAction} />);
  const trigger = screen.getByRole("button", { name: "Do thing" });
  trigger.focus();
  await userEvent.keyboard("{Enter}");
  expect(onAction).toHaveBeenCalled();
});`}
              </pre>
              <p className="mt-3 text-muted">
                That&apos;s it. The lint rules catch the obvious structural
                issues as you type, the axe scans catch WCAG violations when
                tests run, and the E2E layer catches composition issues on the
                full page. If all three pass, the component is in good shape.
                The tests run automatically in CI — no manual steps needed
                beyond writing them.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">ARIA live regions</h2>
              <p className="text-muted">
                The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  aria-live
                </code>{" "}
                attribute controls how screen readers announce dynamic content
                updates.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  aria-live=&quot;off&quot;
                </code>{" "}
                is the default, no announcements.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  aria-live=&quot;polite&quot;
                </code>{" "}
                waits until the screen reader is idle to announce updates, which
                is the right default for status messages, search result counts,
                and saved confirmations.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  aria-live=&quot;assertive&quot;
                </code>{" "}
                interrupts immediately and should be reserved for critical
                alerts and errors.
              </p>
              <p className="mt-3 text-muted">
                The project uses polite regions for toast notifications
                (RefreshBar), search result counts (CardSearch), and character
                counts (Textarea). The key insight is that the live region
                container must exist in the DOM before the content changes — if
                you conditionally render the container and the content at the
                same time, screen readers miss the announcement because they
                weren&apos;t watching the region when it appeared.
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

              <Timestamp>2:52 PM</Timestamp>

              <Received>what about color contrast</Received>

              <Sent pos="first">
                WCAG wants 4.5:1 for normal text, 3:1 for large text and UI
                components. axe catches most of it at render time but dynamic
                states like hover and focus need manual checks
              </Sent>
              <Sent pos="last">
                found a few muted text colors below the threshold in both
                themes. the design token system made it easy to fix since you
                only verify contrast at the token level, not per-component
              </Sent>

              <Timestamp>2:55 PM</Timestamp>

              <Received>
                so if someone adds a new component, what should they actually
                test
              </Received>

              <Sent pos="first">
                three layers. first, axe scans for every visual variant —
                default, loading, error, disabled, empty. each variant can
                produce different DOM that needs separate evaluation
              </Sent>
              <Sent pos="middle">
                second, label and ARIA assertions. getByLabelText,
                aria-describedby checks, role verification. make sure screen
                readers get the right information
              </Sent>
              <Sent pos="last">
                third, keyboard behavior with user-event. tab order, Escape
                dismissal, Enter/Space activation. the WCAG criteria to hit are
                1.3.1 and 4.1.2 for labels, 2.4.3 and 2.4.7 for focus, 2.1.1 for
                keyboard, 1.4.3 for contrast, 4.1.3 for live regions
              </Sent>

              <Timestamp>2:58 PM</Timestamp>

              <Received>
                can you give me a quick checklist for reviewing PRs
              </Received>

              <Sent pos="first">
                axe scan for every variant, keyboard-only operability, visible
                focus rings, labels on inputs (not just placeholders), error
                states with aria-describedby and role=&quot;alert&quot;
              </Sent>
              <Sent pos="middle">
                icon-only buttons have aria-label, modals trap and restore
                focus, animations respect prefers-reduced-motion, contrast
                ratios met, no tabIndex greater than 0
              </Sent>
              <Sent pos="last">
                and check for skip links and semantic landmarks — main, nav,
                header. not every item applies to every PR but scanning the list
                catches the common gaps
              </Sent>

              <Timestamp>3:02 PM</Timestamp>

              <Received pos="first">what even is WCAG though</Received>
              <Received pos="last">
                like I know it&apos;s accessibility guidelines but I don&apos;t
                have a ton of formal experience with it
              </Received>

              <Sent pos="first">
                it&apos;s organized around four principles, POUR: Perceivable,
                Operable, Understandable, Robust. can the user see it, interact
                with it, understand it, and does it work with assistive tech
              </Sent>
              <Sent pos="middle">
                there are three levels: A is bare minimum, AA is the standard
                everyone targets (and what legal requirements reference), AAA is
                ideal but rarely required in full. we target AA
              </Sent>
              <Sent pos="last">
                each rule has a number like SC 1.4.3. the first digit maps to
                POUR: 1 = Perceivable, 2 = Operable, 3 = Understandable, 4 =
                Robust. you don&apos;t need to memorize them but it helps when
                reading axe violations
              </Sent>

              <Timestamp>3:06 PM</Timestamp>

              <Received>how do you actually get good at this stuff</Received>

              <Sent pos="first">
                use your own app without a mouse. tab through the page, try to
                reach every button, dismiss a modal with Escape. then turn on
                VoiceOver (Cmd+F5 on Mac) and listen to what it announces.
                you&apos;ll feel the gaps immediately
              </Sent>
              <Sent pos="middle">
                install the axe browser extension, run it on your pages, and
                read the violations. each one links to the WCAG criterion and
                how to fix it. you learn the rules through your own code
              </Sent>
              <Sent pos="middle">
                learn semantic HTML before ARIA. most problems come from div
                soup. use button, nav, main, label — the browser gives you
                keyboard support and screen reader announcements for free. ARIA
                is a patch, not a replacement
              </Sent>
              <Sent pos="last">
                day to day you only touch about a dozen criteria repeatedly:
                labels, keyboard access, focus visible, contrast, error
                identification, name/role/value. get comfortable with those and
                you&apos;re ahead of most developers
              </Sent>

              <Timestamp>3:10 PM</Timestamp>

              <Received>
                so what&apos;s the full defense setup look like now
              </Received>

              <Sent pos="first">
                three layers. eslint-plugin-jsx-a11y catches structural issues
                at lint time — divs with onClick but no role, missing alt text,
                invalid ARIA. it runs before the code even executes
              </Sent>
              <Sent pos="middle">
                second layer is vitest-axe in unit tests. scans every component
                variant against WCAG 2.1 AA in milliseconds. third is
                @axe-core/playwright in E2E tests for full-page scans
              </Sent>
              <Sent pos="last">
                each catches different things. lint catches patterns, unit tests
                catch rendered DOM issues, E2E catches composition problems
                where individually accessible components break when assembled
              </Sent>

              <Timestamp>3:14 PM</Timestamp>

              <Received>
                what did the feature-level audit find beyond the primitives
              </Received>

              <Sent pos="first">
                the bottom-up approach left gaps. operator charts had no text
                alternatives, skeleton loaders cluttered the a11y tree, stock
                bars had no semantic meaning. the calendar combobox
                couldn&apos;t be keyboard operated
              </Sent>
              <Sent pos="last">
                fixed all of it and added 29 tests across two new test files
                covering the feature layer. the pattern is the same: run axe,
                fix violations, add keyboard behavior tests
              </Sent>

              <Timestamp>3:18 PM</Timestamp>

              <Received>tell me about the eslint plugin setup</Received>

              <Sent pos="first">
                eslint-plugin-jsx-a11y catches stuff that&apos;s always wrong
                regardless of runtime state. divs with onClick but no role, imgs
                without alt, interactive elements without keyboard handlers
              </Sent>
              <Sent pos="middle">
                one gotcha with Next.js: eslint-config-next already registers
                the plugin, so you only add the rules object, not the full
                plugin config. otherwise you get a &quot;Cannot redefine
                plugin&quot; error
              </Sent>
              <Sent pos="last">
                pair it with Firefox&apos;s Accessibility Inspector and the axe
                DevTools extension for browser-side inspection. between lint,
                unit tests, and browser tools, most violations get caught before
                a PR
              </Sent>

              <Timestamp>3:22 PM</Timestamp>

              <Received>
                what was the deal with CalendarGrid and nested interactives
              </Received>

              <Sent pos="first">
                day cells are clickable to create events but contain clickable
                EventChip buttons inside them. can&apos;t use
                role=&quot;button&quot; on the outer div because nested
                interactive elements is an axe violation
              </Sent>
              <Sent pos="last">
                the fix is event delegation. the outer div handles onClick but
                checks if the target is inside a button or anchor via closest().
                if it is, the parent ignores the click. the eslint rule gets a
                targeted disable since the pattern is intentional
              </Sent>

              <Timestamp>3:26 PM</Timestamp>

              <Received>
                what about stuff automated tools can&apos;t catch
              </Received>

              <Sent pos="first">
                automated tools catch maybe 30-40% of issues. the rest is
                habits. test with sound off, test at 200% zoom, respect
                prefers-reduced-motion and prefers-contrast media queries
              </Sent>
              <Sent pos="middle">
                make click targets large enough for motor impairments, avoid
                auto-dismissing popups, add skip links for keyboard users,
                caption all video and audio content
              </Sent>
              <Sent pos="last">
                the goal isn&apos;t perfection, it&apos;s making accessibility a
                natural part of development. build the habits so it&apos;s not
                an afterthought audit
              </Sent>

              <Timestamp>3:30 PM</Timestamp>

              <Received>how do aria-live regions actually work</Received>

              <Sent pos="first">
                three values. off is the default, no announcements. polite waits
                until the screen reader is idle — right for status messages,
                search counts, save confirmations. assertive interrupts
                immediately, only for critical errors
              </Sent>
              <Sent pos="last">
                key gotcha: the live region container must exist in the DOM
                before the content changes. if you conditionally render the
                container and content at the same time, screen readers miss it
                because they weren&apos;t watching the region when it appeared
              </Sent>

              <Timestamp>3:34 PM</Timestamp>

              <Received pos="first">
                how do the tests actually work though
              </Received>
              <Received pos="last">
                like when do they run, what do I need to do when building a new
                feature
              </Received>

              <Sent pos="first">
                three activation points. eslint-plugin-jsx-a11y fires on save in
                your editor and in CI lint. vitest-axe runs as part of normal
                npm test. playwright axe runs in the E2E step
              </Sent>
              <Sent pos="middle">
                none of them need special commands. the lint rules are in the
                eslint config, the axe matchers are globally registered in
                test/setup.ts, and the E2E scans are just playwright tests. they
                all run automatically in CI
              </Sent>
              <Sent pos="last">
                for authenticated routes (calendar, vitals, settings), E2E axe
                scans need real Auth0 credentials. those run locally via npm run
                test:e2e:auth, not in CI for forks
              </Sent>

              <Timestamp>3:38 PM</Timestamp>

              <Received>
                so when I build a new component, what&apos;s the checklist
              </Received>

              <Sent pos="first">
                first, add an axe scan for each visual variant — default,
                loading, error, disabled. import axe from @/test/a11y, render,
                pass the container, assert toHaveNoViolations()
              </Sent>
              <Sent pos="middle">
                second, add ARIA assertions — getByRole, getByLabelText,
                toHaveAttribute for aria-expanded, aria-selected, etc. these
                document the component&apos;s accessible API
              </Sent>
              <Sent pos="middle">
                third, keyboard tests if it&apos;s interactive. Enter, Space,
                Escape, arrow keys as appropriate. use userEvent.keyboard to
                simulate and assert callbacks fire
              </Sent>
              <Sent pos="last">
                also: make sure new pages have an h1 (use sr-only if visually
                redundant), and never use opacity modifiers on text-muted —
                text-muted/30 drops below the 4.5:1 contrast threshold
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
