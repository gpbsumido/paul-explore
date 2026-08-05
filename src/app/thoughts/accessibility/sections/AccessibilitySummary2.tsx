/** Accessibility write-up summary. */
export function AccessibilitySummary2() {
  return (
    <>
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
              <p className="mt-3 text-muted">
                These three all live in this repo. On top of them, the design
                system that backs the primitives runs its own story-level axe
                pass in Chromatic, so the shared components are also getting
                scanned in their own catalog before they ever land here.
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
                The scan that was not running
              </h2>
              <p className="text-muted">
                The route-level axe suite reported every public page as clean.
                Two of them had never been scanned at all.
              </p>
              <p className="mt-3 text-muted">
                The specs waited on{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  networkidle
                </code>{" "}
                before scanning &mdash; sensible-looking, and wrong, because it
                is a promise about whichever third party a page happens to call
                rather than about the page itself. Two fantasy routes fetch NBA
                data through the backend. When that upstream stopped answering,
                those requests hung, the wait never resolved, and the tests timed
                out. A timeout reads as a slow test. It is easy to miss that it
                also means the assertion never ran.
              </p>
              <p className="mt-3 text-muted">
                Replacing the wait with things the page actually controls &mdash;{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  load
                </code>
                , the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  main
                </code>{" "}
                landmark, and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  document.fonts.ready
                </code>{" "}
                &mdash; made axe run on them for the first time. It found real
                serious-impact colour-contrast failures that had been shipping to
                users: white text at 40% opacity on the particles lab, twice, and
                a translucent amber notice on the court-vision page. Both are
                fixed, the amber one by adopting the light/dark warning pair the
                rest of the app already uses instead of a single translucent
                colour that cannot satisfy both themes.
              </p>
              <p className="mt-3 text-muted">
                Two things worth keeping from that.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  document.fonts.ready
                </code>{" "}
                matters more than it sounds: fonts change computed colours, and
                axe&apos;s contrast rule reads computed colours, so scanning
                before they settle reports violations that do not exist. And a
                green accessibility suite is a claim about coverage, not proof of
                it. The failure mode here was never a red build. It was a report
                saying &ldquo;clean&rdquo; about pages it had quietly stopped
                looking at.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Then it found things, including mine
              </h2>
              <p className="text-muted">
                Making the scan actually run turned up three violations, and the
                most instructive one was my own. A loading placeholder carried{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">aria-label</code> on a bare{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">span</code>. A span has no role, so there is
                nothing for the label to name, and ARIA prohibits it &mdash;
                serious impact. The repo already had the right pattern one file
                away: hide the shape with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">aria-hidden</code> and put the words in an{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">sr-only</code> element, which is what the
                skeleton component does. I had invented a worse version of a
                solved problem, and the scan that would have caught it was the
                one not running.
              </p>
              <p className="mt-3 text-muted">
                A second lives in the shared component library rather than here:
                the marquee duplicates its content and marks the clone{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">aria-hidden</code>, but the clone still
                contains focusable buttons. Hiding something from assistive
                technology while leaving it in the tab order is worse than not
                hiding it, because a keyboard user lands on a control a screen
                reader insists does not exist.
              </p>
              <p className="mt-3 text-muted">
                That one is fixed upstream now, in both framework packages. The
                clone is marked{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  inert
                </code>{" "}
                declaratively rather than having its focusables stripped by an
                effect after render, which is what left the gap: an effect runs
                after paint, so between mount and that effect the duplicate held
                tabbable controls, and every re-render reopened the window.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  inert
                </code>{" "}
                takes the tab order and the accessibility tree out together,
                which is exactly the pair that had come apart.
              </p>
              <p className="mt-3 text-muted">
                The Angular port of the same component carried the identical
                bug, comment and all, and was still in review &mdash; so that
                one got fixed before it ever shipped rather than after. Worth
                noting how it was found: not by auditing the design system, but
                by a scan on a page that happened to use it. A shared component
                library means one mistake reaches every consumer, and it also
                means the first consumer to look properly finds it for everyone.
              </p>

              <h2 className="mb-3 mt-8 text-lg font-bold">
                Contrast tests need a pinned theme
              </h2>
              <p className="text-muted">
                Once the scan ran, it went intermittently red on whichever route
                happened to lose a race. The tell was the shape of the failure:
                every muted and foreground element failing contrast at once. If
                the foreground token genuinely failed, the app would be
                unreadable rather than slightly off, so the colours being
                measured were not the colours anyone sees.
              </p>
              <p className="mt-3 text-muted">
                Every colour here comes from a custom property, and which set is
                live depends on a preference read at runtime. An unpinned scan
                races that, and sometimes measures muted text against the other
                theme&apos;s surface. Two smaller versions of the same problem
                sat underneath it: fonts change computed colours, so scanning
                before{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">document.fonts.ready</code> reports
                violations that do not exist, and an element mid-transition is
                measured against a background it is only passing through.
              </p>
              <p className="mt-3 text-muted">
                So the scan now pins the theme before anything renders, waits for
                the tokens to resolve, and lets animations settle &mdash; the
                same mechanism the screenshot workflow already used. All three
                waits are facts about this page, which is the property that
                matters. The failure this replaced was the worst kind of red:
                real-looking, unreproducible, and not a bug. That is how a suite
                earns the reputation that gets it ignored.
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

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Tuning ESLint rules for real-world patterns
              </h2>
              <p className="text-muted">
                The recommended ruleset from eslint-plugin-jsx-a11y is a good
                starting point, but two rules needed project-level tuning after
                the first CI run caught 14 issues.
              </p>
              <p className="mt-3 text-muted">
                <strong>no-noninteractive-tabindex</strong> — flags{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  tabIndex=&#123;0&#125;
                </code>{" "}
                on non-interactive elements, which is usually correct. But
                scrollable containers are the exception: keyboard users need to
                tab into them to scroll with arrow keys. The fix is to give the
                container{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  role=&quot;region&quot;
                </code>{" "}
                with an{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  aria-label
                </code>
                , then configure the rule to allow tabIndex on{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  region
                </code>{" "}
                and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  tabpanel
                </code>{" "}
                roles. This way the rule still catches genuinely wrong uses
                while allowing the legitimate accessibility pattern.
              </p>
              <pre className="mt-3 overflow-x-auto rounded bg-surface px-4 py-3 text-[13px] font-mono text-foreground">
                {`// eslint.config.mjs
"jsx-a11y/no-noninteractive-tabindex": [
  "error",
  { tags: [], roles: ["tabpanel", "region"] },
],

// in the component
<div
  className="overflow-x-auto"
  role="region"
  aria-label="Stats leaderboard"
  tabIndex={0}
>`}
              </pre>
              <p className="mt-3 text-muted">
                <strong>no-unused-vars</strong> — the default{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  @typescript-eslint/no-unused-vars
                </code>{" "}
                config from eslint-config-next doesn&apos;t recognize the
                standard{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  _
                </code>
                -prefix convention for intentionally unused variables, and it
                flags the throwaway variable in rest destructuring patterns like{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  {"const { name: _, ...rest } = obj"}
                </code>
                . Adding{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  argsIgnorePattern
                </code>
                ,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  varsIgnorePattern
                </code>
                , and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ignoreRestSiblings
                </code>{" "}
                fixes seven warnings in one config change. Not an accessibility
                rule, but it came out of the same lint audit.
              </p>
            </section>
    </>
  );
}
