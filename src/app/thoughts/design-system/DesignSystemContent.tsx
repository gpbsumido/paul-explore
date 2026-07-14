"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function DesignSystemContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Hub", href: "/" },
          { label: "Shared Design System" },
        ]}
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
              Shared Design System
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Extracting tokens and components out of this app into a shared
              design system, then wiring it back in alongside an Angular
              consumer. Four npm packages, one source of truth.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
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
                everywhere without a build step. A vanilla HTML page can link the
                stylesheet and use the tokens immediately.
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
                  <strong className="text-foreground">react</strong> — thin React
                  wrappers that apply the CSS classes with proper typing and
                  accessibility
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
                This app uses Tailwind CSS v4, which reads design tokens from CSS
                custom properties via an{" "}
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
                needed changes. Components with app-specific behavior (Modal with
                Framer Motion animations, Tooltip with fixed positioning and
                delays, Chip with color props) were left as-is. They still
                consume the shared tokens through CSS.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Angular: token bridge, not full adoption
              </h2>
              <p className="text-muted">
                The Angular desktop simulator has a fundamentally different visual
                identity (macOS-style chrome, traffic light buttons, dock
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
              <h2 className="mb-3 text-lg font-bold">
                What broke and why
              </h2>
              <p className="text-muted">
                Five bugs surfaced during integration. The first three appeared
                at publish time. The last two were visual regressions that only
                showed up when running the app.
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
                  ). The lesson: test your token output against the strictest CSS
                  parser in your toolchain, not just the browser.
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
                  first publish shipped empty dist folders. The fix was excluding{" "}
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
                  prop only existed on the button branch, so TypeScript couldn&apos;t
                  guarantee it was available on both. Moving shared props to a
                  common base type fixed the type error. Similarly, the app-level
                  adapter couldn&apos;t spread button-typed event handlers (
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    onClick: MouseEventHandler&lt;HTMLButtonElement&gt;
                  </code>
                  ) into the anchor branch. The fix was splitting the render path
                  by checking{" "}
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
                  . This looks harmless — it seems like it&apos;s just forwarding
                  the value from{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    tokens.css
                  </code>
                  . But{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    @theme
                  </code>{" "}
                  creates new CSS custom properties. So the variable
                  references itself, and per the CSS spec a self-referencing
                  custom property resolves to the &quot;guaranteed-invalid
                  value.&quot; Every Tailwind utility that used these tokens —
                  colors, shadows, border radii — silently broke. Everything was
                  square, shadowless, and missing colors. The fix was pointing
                  each entry at the{" "}
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
              </ul>
            </section>

            <section>
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
                  They work locally but fail on any runner that doesn&apos;t have
                  the sibling repo checked out. Publish first, then open the
                  consumer PR with version ranges.
                </li>
                <li>
                  <strong className="text-foreground">
                    Keep the build config separate from the test config.
                  </strong>{" "}
                  A single tsconfig that includes both source and tests works for
                  type checking during development but fails as a build step.
                  Use a{" "}
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
                  package, importing the full CSS package layers competing resets
                  and{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    @layer
                  </code>{" "}
                  declarations on top of Tailwind. Import only the tokens.
                </li>
              </ul>
            </section>
          </div>
        </main>
      ) : (
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <div className={styles.thread}>
            <Timestamp>Jul 13, 2026</Timestamp>

            <Sent>
              both apps define their own colors and component styles
              independently. every time i change something in one i have to
              remember to update the other
            </Sent>

            <Received>
              classic token drift problem. you need a shared source of truth that
              both apps consume. CSS custom properties are the right canonical
              format since both apps can use them without a build step
            </Received>

            <Sent>
              went with a monorepo — tokens, css, react, angular packages. tokens
              build to CSS custom properties, the css package layers components on
              top, and the framework packages are thin wrappers
            </Sent>

            <Received>
              what does the integration look like in this app? tailwind reads from
              CSS custom properties right?
            </Received>

            <Sent>
              yeah, tokens.css aliases every --paul-* variable to the unprefixed
              name. so --color-primary-600 points at
              var(--paul-color-primary-600). tailwind v4 reads those through the
              @theme block in globals.css. change a token, both apps update
            </Sent>

            <Received>
              and the angular app? it has a totally different visual identity
            </Received>

            <Sent>
              right, the desktop simulator keeps its own colors and chrome. we
              only bridge shared concepts — typography scales, motion durations,
              border radii, z-index. a token-bridge.scss maps --paul-* tokens to
              the app-level variable names. desktop-specific stuff stays local
            </Sent>

            <Received>
              makes sense. what about the react components — did you swap
              everything to the design system?
            </Received>

            <Sent>
              button and input yes, they&apos;re adapters wrapping
              @paul-portfolio/react now. same prop API so nothing broke upstream.
              modal, tooltip, chip stayed as-is because they have app-specific
              behavior — framer-motion animations, fixed positioning, color
              variants
            </Sent>

            <Received>
              the packages are on npm?
            </Received>

            <Sent>
              published under @paul-portfolio scope. used file: paths during dev,
              switched to version ranges for CI. first publish was fun — empty
              dist folders because tsc was compiling test files. excluded
              __tests__ from tsconfig and it worked. real fix is a proper build
              pipeline like tsup
            </Sent>

            <Received>
              anything else break?
            </Received>

            <Sent>
              yeah, the spacing tokens had dots in the CSS property names.
              --paul-spacing-0.5 — browsers handle it but Next.js SWC parser
              treats the dot as a number literal and crashes the whole build.
              switched to underscores: --paul-spacing-0_5. lesson learned: test
              your tokens against the strictest parser in your toolchain, not
              just the browser
            </Sent>

            <Received>
              did that fix everything?
            </Received>

            <Sent>
              no. deployed and everything looked wrong — shadows were gone,
              border radii were all zero (everything square), and some colors
              were missing entirely. took a while to figure out. the @theme
              block in globals.css had entries like --color-background:
              var(--color-background). looks like it&apos;s forwarding the value from
              tokens.css, but @theme creates NEW custom properties. so it was
              referencing itself. CSS spec says self-referencing custom
              properties resolve to the &quot;guaranteed-invalid value&quot; — which
              means every Tailwind utility silently broke
            </Sent>

            <Received>
              ouch. how do you even catch that?
            </Received>

            <Sent>
              you have to know that @theme is a definition block, not a
              passthrough. the fix was pointing each entry at the --paul-*
              prefixed source token instead. so --color-background:
              var(--paul-color-background) instead of var(--color-background).
              different variable name, no circular reference
            </Sent>

            <Received>
              anything else break after that?
            </Received>

            <Sent>
              yeah, spacing and layout were off. the design system CSS package
              was being imported — @paul-portfolio/css/index.css — which brings
              in a full CSS reset, heading sizes, button resets, and @layer
              declarations that conflict with Tailwind v4&apos;s own layers. the
              reset was clobbering the app&apos;s styles. but we don&apos;t need it —
              we use the React components which handle their own CSS. removed
              the import entirely, kept just the tokens import
            </Sent>

            <Received>
              so the takeaway for next time?
            </Received>

            <Sent>
              six things now. run npm pack --dry-run before publishing. validate
              generated CSS through all your consumers&apos; parsers. never use
              file: paths in PRs that go through CI. keep a separate
              tsconfig.build.json. never write @theme entries that reference
              their own name — always use a differently-named source variable.
              and only import the layer you actually need from the design system
              — tokens yes, full CSS package no, unless you&apos;re using the
              CSS-only components
            </Sent>
          </div>
        </main>
      )}
    </div>
  );
}
