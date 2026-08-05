/** Design-system write-up summary. */
export function DesignSystemSummary1() {
  return (
    <>
      <section>
              <h2 className="mb-3 text-lg font-bold">The problem</h2>
              <p className="text-muted">
                This app and the Angular desktop simulator both define their own
                colors, spacing, typography, and component styles. When a color
                changes, it changes in two places. When a button style gets
                updated, the Angular version drifts. There&apos;s no shared
                language between the two apps.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                CSS custom properties as the canonical format
              </h2>
              <p className="text-muted">
                The design system uses CSS custom properties (
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  --paul-color-primary-500
                </code>
                ) as the single source of truth. Not Sass variables, not
                JS-in-CSS, not Tailwind theme values. CSS custom properties work
                everywhere without a build step. A vanilla HTML page can link
                the stylesheet and use the tokens immediately.
              </p>
              <p className="mt-3 text-muted">
                The tokens build process generates CSS, SCSS, and JSON outputs
                from a single JavaScript definition. Consumers pick the format
                that fits their stack.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Four packages</h2>
              <p className="text-muted">
                The system ships as four npm packages under the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  @paul-portfolio
                </code>{" "}
                scope:
              </p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  <strong className="text-foreground">tokens</strong> — colors,
                  spacing, typography, shadows, motion, radii, z-index as CSS
                  custom properties
                </li>
                <li>
                  <strong className="text-foreground">css</strong> — 9
                  framework-agnostic CSS components (button, input, chip, card,
                  modal, tooltip, avatar, badge, skeleton) using CSS{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    @layer
                  </code>{" "}
                  for specificity management
                </li>
                <li>
                  <strong className="text-foreground">react</strong> — thin
                  React wrappers that apply the CSS classes with proper typing
                  and accessibility
                </li>
                <li>
                  <strong className="text-foreground">angular</strong> — 16
                  standalone Angular components with signal-based inputs
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Token aliasing in this app
              </h2>
              <p className="text-muted">
                This app uses Tailwind CSS v4, which reads design tokens from
                CSS custom properties via an{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  @theme
                </code>{" "}
                block in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  globals.css
                </code>
                . The bridge is a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  tokens.css
                </code>{" "}
                file that aliases every{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  --paul-*
                </code>{" "}
                variable to the unprefixed name the app already uses:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-4 text-[13px] font-mono text-foreground">
                {`--color-primary-600: var(--paul-color-primary-600);
--radius-md: var(--paul-radius-md);
--shadow-sm: var(--paul-shadow-sm);`}
              </pre>
              <p className="mt-3 text-muted">
                Every Tailwind utility like{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  bg-primary-600
                </code>{" "}
                now reads from the design system. Change a color in the tokens
                package, rebuild, and both apps update.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Component adapters, not rewrites
              </h2>
              <p className="text-muted">
                Button and Input were migrated to thin adapters wrapping{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  @paul-portfolio/react
                </code>
                . The adapters preserve the existing prop API so no call sites
                needed changes. Components with app-specific behavior (Modal
                with Framer Motion animations, Tooltip with fixed positioning
                and delays, Chip with color props) were left as-is. They still
                consume the shared tokens through CSS.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Angular: token bridge, not full adoption
              </h2>
              <p className="text-muted">
                The Angular desktop simulator has a fundamentally different
                visual identity (macOS-style chrome, traffic light buttons, dock
                magnification). Replacing its components with the design system
                would break the aesthetic. Instead, a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  token-bridge.scss
                </code>{" "}
                maps shared concepts like typography scales, motion durations,
                border radii, and z-index layers. Desktop-specific tokens
                (colors, window chrome, dock) stay local.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Publishing to npm</h2>
              <p className="text-muted">
                Packages are published under the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  @paul-portfolio
                </code>{" "}
                npm scope with public access. During development, both consumer
                apps used{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  file:
                </code>{" "}
                paths pointing at the local monorepo. For CI, those were swapped
                to version ranges (
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ^0.1.3
                </code>
                ) so the runner can resolve dependencies from the registry.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What broke and why</h2>
              <p className="text-muted">
                Nine bugs surfaced across the integration. The first three
                appeared at publish time. The next two were visual regressions
                in the consumer app. Two showed up when wiring Storybook and
                Chromatic for visual regression testing in CI. The last two
                were interaction bugs that only appeared after real usage.
              </p>
              <ul className="mt-3 space-y-4 text-muted">
                <li>
                  <strong className="text-foreground">
                    Dots in CSS custom property names.
                  </strong>{" "}
                  Tailwind uses fractional spacing keys like{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    0.5
                  </code>
                  , so the tokens package generated{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    --paul-spacing-0.5
                  </code>
                  . Some browsers tolerate this, but Next.js&apos;s SWC CSS
                  parser does not — it reads the dot as a number literal and
                  crashes. The fix was replacing dots with underscores in the
                  build script (
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    --paul-spacing-0_5
                  </code>
                  ). The lesson: test your token output against the strictest
                  CSS parser in your toolchain, not just the browser.
                </li>
                <li>
                  <strong className="text-foreground">
                    Test files in the dist bundle.
                  </strong>{" "}
                  The React and Angular packages used{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    npx tsc
                  </code>{" "}
                  as their build script. The tsconfig included{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    src/
                  </code>{" "}
                  which also compiles{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    src/__tests__/
                  </code>
                  . The test files import vitest matchers that extend the
                  assertion types, so tsc failed trying to resolve them. The
                  first publish shipped empty dist folders. The fix was
                  excluding{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    __tests__
                  </code>{" "}
                  from tsconfig. The real fix is a proper bundler (tsup or Vite
                  library mode) that only builds what you tell it to.
                </li>
                <li>
                  <strong className="text-foreground">
                    Discriminated union type mismatch.
                  </strong>{" "}
                  The design system&apos;s Button uses a discriminated union:{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    ButtonAsButton | ButtonAsAnchor
                  </code>
                  . The{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    disabled
                  </code>{" "}
                  prop only existed on the button branch, so TypeScript
                  couldn&apos;t guarantee it was available on both. Moving
                  shared props to a common base type fixed the type error.
                  Similarly, the app-level adapter couldn&apos;t spread
                  button-typed event handlers (
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    onClick: MouseEventHandler&lt;HTMLButtonElement&gt;
                  </code>
                  ) into the anchor branch. The fix was splitting the render
                  path by checking{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    href
                  </code>{" "}
                  and only passing shared props to the anchor variant.
                </li>
                <li>
                  <strong className="text-foreground">
                    Circular references in Tailwind&apos;s @theme block.
                  </strong>{" "}
                  The{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    @theme
                  </code>{" "}
                  block in{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    globals.css
                  </code>{" "}
                  had entries like{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    --color-background: var(--color-background)
                  </code>
                  . This looks harmless — it seems like it&apos;s just
                  forwarding the value from{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    tokens.css
                  </code>
                  . But{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    @theme
                  </code>{" "}
                  creates new CSS custom properties. So the variable references
                  itself, and per the CSS spec a self-referencing custom
                  property resolves to the &quot;guaranteed-invalid value.&quot;
                  Every Tailwind utility that used these tokens — colors,
                  shadows, border radii — silently broke. Everything was square,
                  shadowless, and missing colors. The fix was pointing each
                  entry at the{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    --paul-*
                  </code>{" "}
                  prefixed source token instead.
                </li>
                <li>
                  <strong className="text-foreground">
                    Design system CSS reset clobbering app layout.
                  </strong>{" "}
                  Importing{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    @paul-portfolio/css/index.css
                  </code>{" "}
                  brought in the full design system: a CSS reset, base
                  typography, heading sizes, button resets, and all component
                  CSS. The reset&apos;s{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    @layer
                  </code>{" "}
                  declarations conflicted with Tailwind v4&apos;s own layer
                  system, and the base styles overrode the app&apos;s heading
                  sizes and link colors. Spacing, layout, and typography all
                  shifted. The fix was removing the import entirely — this app
                  uses the React component package (which handles its own CSS
                  classes) and only needs the tokens CSS for the raw{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    --paul-*
                  </code>{" "}
                  custom properties.
                </li>
                <li>
                  <strong className="text-foreground">
                    Storybook imports broke in CI.
                  </strong>{" "}
                  The Storybook stories imported React components via relative
                  paths into{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    ../../react/src/
                  </code>
                  . Locally this works because the source files are right there.
                  In CI, the react package&apos;s{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    exports
                  </code>{" "}
                  field points at{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    dist/
                  </code>{" "}
                  which doesn&apos;t exist until after a build step that CI
                  never ran. The fix was switching imports to the package name (
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    @paul-portfolio/react
                  </code>
                  ) and adding a Vite alias in the Storybook config to resolve
                  it back to source. This also required setting{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    esbuild.jsx: &apos;automatic&apos;
                  </code>{" "}
                  — without it, esbuild compiled the source TSX files using
                  classic JSX mode (
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    React.createElement
                  </code>
                  ), but the source files don&apos;t{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    import React
                  </code>
                  .
                </li>
                <li>
                  <strong className="text-foreground">
                    Chromatic couldn&apos;t capture the Modal story.
                  </strong>{" "}
                  The Modal component uses{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    createPortal
                  </code>{" "}
                  to render into{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    document.body
                  </code>
                  , which puts the dialog outside Chromatic&apos;s capture root.
                  The interactive story that clicks &quot;Open Modal&quot; and
                  then asserts the dialog is visible crashed during
                  Chromatic&apos;s snapshot. The fix was disabling the
                  interactive story for Chromatic and adding a separate
                  &quot;Open&quot; story that renders the Modal in a static open
                  state — no user interaction needed for the visual snapshot.
                </li>
                <li>
                  <strong className="text-foreground">
                    CSS spacing tokens renamed but CSS components not updated.
                  </strong>{" "}
                  The tokens package renamed fractional spacing properties from
                  dots to underscores (
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    --paul-spacing-1_5
                  </code>
                  ), but the CSS component package still referenced the old
                  escaped-dot names (
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    --paul-spacing-1\.5
                  </code>
                  ). These don&apos;t match. Buttons, chips, badges, and
                  tooltips all lost their padding. The fix was updating all five
                  CSS files to use underscore names. The lesson: when you rename
                  tokens, grep every consumer package — the CSS package is a
                  consumer too, not just the apps.
                </li>
                <li>
                  <strong className="text-foreground">
                    Modal focus stolen on every background refetch.
                  </strong>{" "}
                  The Modal component&apos;s{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    useEffect
                  </code>{" "}
                  had{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    handleKeyDown
                  </code>{" "}
                  in its dependency array.{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    handleKeyDown
                  </code>{" "}
                  depends on{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    onClose
                  </code>
                  , which is an inline arrow function that gets a new reference
                  on every parent render. Every time TanStack Query&apos;s
                  background polling re-rendered the calendar page, the effect
                  re-ran and called{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    requestAnimationFrame(() =&gt; focusable[0].focus())
                  </code>
                  , stealing focus from whatever input you were typing in. The
                  fix was storing the handler in a ref so the effect only runs
                  when{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    open
                  </code>{" "}
                  changes.
                </li>
              </ul>
            </section>
    </>
  );
}
