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
              <h2 className="mb-3 text-lg font-bold">What I&apos;d do differently</h2>
              <p className="text-muted">
                The build story for the React and Angular packages needs work.
                The initial publishes shipped empty dist folders because tsc was
                trying to compile test files alongside source files. Excluding{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  __tests__
                </code>{" "}
                from the tsconfig fixed it, but the real fix is a proper build
                pipeline — probably tsup or Vite library mode — that bundles,
                tree-shakes, and produces clean ESM output. That&apos;s next.
              </p>
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
          </div>
        </main>
      )}
    </div>
  );
}
