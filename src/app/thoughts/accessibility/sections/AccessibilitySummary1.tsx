/** Accessibility write-up summary. */
export function AccessibilitySummary1() {
  return (
    <>
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
                A third axe layer, for free, in Chromatic
              </h2>
              <p className="text-muted">
                The primitives now come from the design system, and its
                Storybook already runs Chromatic on every PR for visual
                regression. It turns out Chromatic has accessibility tests built
                right in — the same axe-core engine as the unit and E2E scans —
                and they were sitting there switched off. There was no library
                to add and no new pipeline to wire up. It was a toggle in the
                Chromatic project settings.
              </p>
              <p className="mt-3 text-muted">
                Because the Chromatic step is already part of CI, flipping that
                toggle means the a11y results land in the same build as the
                visual snapshots — no separate job, no extra minutes to reason
                about. And the coverage is exactly the shape that&apos;s awkward
                to get elsewhere: Chromatic scans every story, so every button
                variant, every input error state, every open modal gets an axe
                pass. E2E scans see whole pages; unit tests see one render at a
                time. This sits in between and sweeps the entire component
                catalog automatically.
              </p>
              <p className="mt-3 text-muted">
                So the defense now has three axe surfaces from one engine: fast
                unit checks while writing a component, story-level checks across
                every variant in Chromatic, and page-level checks in E2E where
                accessible pieces get composed into real screens.
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
    </>
  );
}
