"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function NpmToPnpmContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Hub", href: "/" },
          { label: "npm to pnpm" },
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
              npm to pnpm
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Migrating from npm to pnpm, why it surfaced hidden issues in the
              dependency graph, and what actually needed to change.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">Why switch</h2>
              <p className="text-muted">
                npm works. It&apos;s been the default for over a decade and
                nothing was broken. The switch was about two things: install
                speed and dependency honesty. pnpm uses a content-addressable
                store with hard links, so packages are stored once on disk
                globally and linked into each project. Installs are
                significantly faster (especially in CI where caching matters)
                and disk usage drops across multiple projects.
              </p>
              <p className="mt-3 text-muted">
                The more interesting benefit is strict dependency resolution.
                npm hoists everything into a flat{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  node_modules
                </code>
                , which means your code can import packages you never explicitly
                declared as dependencies. These &quot;phantom
                dependencies&quot; work fine until the transitive dependency
                that provided them upgrades or gets removed. pnpm&apos;s
                symlinked{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  node_modules
                </code>{" "}
                structure only exposes packages listed in your own{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  package.json
                </code>
                , so phantom deps surface immediately.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                What pnpm&apos;s strict resolution caught
              </h2>
              <p className="text-muted">
                The migration wasn&apos;t a clean lock file swap. pnpm resolves
                semver ranges differently than npm in practice. Where npm tends
                to resolve{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ^9
                </code>{" "}
                to whatever&apos;s in the lock file (often the latest at the
                time), pnpm resolved it to 9.0.0. That matters when your config
                imports from{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  eslint/config
                </code>
                , which didn&apos;t exist until ESLint 9.15.
              </p>
              <p className="mt-3 text-muted">
                Same story with TypeScript:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ^5
                </code>{" "}
                resolved to 5.0.2, but{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  @vitejs/plugin-react
                </code>{" "}
                uses the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  as &quot;module.exports&quot;
                </code>{" "}
                syntax which needs TS 5.5+. And{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  @types/node@^20
                </code>{" "}
                resolved to 20.0.0, but Playwright 1.59+ needs types from
                20.19+.
              </p>
              <p className="mt-3 text-muted">
                None of these were real bugs, they were loose version ranges
                that happened to work because npm&apos;s lock file pinned them
                to compatible versions. pnpm made the implicit explicit. The
                fix was simple: tighten the minimums in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  package.json
                </code>{" "}
                to what the codebase actually requires.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                New lint rules from the version bump
              </h2>
              <p className="text-muted">
                Bumping ESLint from ~9.0 to 9.39 pulled in new{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  react-hooks
                </code>{" "}
                rules. The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  react-hooks/refs
                </code>{" "}
                rule flagged three ref assignments in the particle scene that
                were being set during render. React 19 discourages this, and
                the rule is right to flag it. The fix was moving the assignments
                into a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useEffect
                </code>
                .
              </p>
              <p className="mt-3 text-muted">
                Two other patterns needed suppression rather than refactoring.
                R3F&apos;s{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useFrame
                </code>{" "}
                callback intentionally mutates Three.js objects every frame
                &mdash; that&apos;s the whole point of an imperative render
                loop. And syncing URL search params to local state via{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useEffect + setState
                </code>{" "}
                is a standard pattern that the new{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  set-state-in-effect
                </code>{" "}
                rule doesn&apos;t distinguish from the problematic cases.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What changed</h2>
              <ul className="list-disc space-y-2 pl-5 text-muted">
                <li>
                  <strong className="text-foreground">Lock file</strong>{" "}
                  &mdash;{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    package-lock.json
                  </code>{" "}
                  replaced by{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    pnpm-lock.yaml
                  </code>
                </li>
                <li>
                  <strong className="text-foreground">CI workflow</strong>{" "}
                  &mdash; GitHub Actions now uses{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    pnpm/action-setup
                  </code>{" "}
                  with{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    --frozen-lockfile
                  </code>{" "}
                  (the pnpm equivalent of{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    npm ci
                  </code>
                  )
                </li>
                <li>
                  <strong className="text-foreground">Vercel</strong> &mdash;
                  auto-detects pnpm from the lock file, no config changes
                  needed
                </li>
                <li>
                  <strong className="text-foreground">
                    Dependency minimums
                  </strong>{" "}
                  &mdash; eslint, typescript, @types/node, @playwright/test,
                  and @axe-core/playwright all tightened to versions the
                  codebase actually needs
                </li>
                <li>
                  <strong className="text-foreground">
                    packageManager field
                  </strong>{" "}
                  &mdash; added to{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    package.json
                  </code>{" "}
                  so corepack and Vercel know which package manager to use
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What I learned</h2>
              <ul className="list-disc space-y-2 pl-5 text-muted">
                <li>
                  Loose semver ranges like{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    ^9
                  </code>{" "}
                  or{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    ^5
                  </code>{" "}
                  are a liability. The range says &quot;anything from 9.0.0 to
                  9.x.x&quot; but the codebase actually depends on features
                  from 9.15+. Pin the minimum to what you actually need.
                </li>
                <li>
                  pnpm&apos;s strict{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    node_modules
                  </code>{" "}
                  layout is a feature, not a problem. It surfaces real issues
                  that npm silently papers over. Every type mismatch we hit was
                  a genuine inconsistency in the dependency graph.
                </li>
                <li>
                  Switching package managers is the easy part. The version
                  resolution differences and the lint/type errors they expose
                  are where the actual work is. Plan for it.
                </li>
                <li>
                  Vercel&apos;s auto-detection just works &mdash; commit the{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    pnpm-lock.yaml
                  </code>
                  , remove{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    package-lock.json
                  </code>
                  , and the deploy pipeline switches over with zero config
                  changes.
                </li>
                <li>
                  Adding{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    package-lock.json
                  </code>{" "}
                  to{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    .gitignore
                  </code>{" "}
                  prevents accidental drift &mdash; without it, running{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                    npm install
                  </code>{" "}
                  by muscle memory would generate a lock file and confuse
                  the next deploy.
                </li>
              </ul>
            </section>
          </div>
        </main>
      ) : (
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <div className={styles.bubbleWrap}>
            <Timestamp>3:30 PM</Timestamp>

            <Received>why pnpm over npm</Received>

            <Sent pos="first">
              two things. faster installs because of the content-addressable
              store with hard links. and strict dependency resolution
            </Sent>
            <Sent pos="last">
              npm hoists everything flat so you can accidentally import
              packages you never declared. works fine until someone else&apos;s
              transitive dep changes and your import breaks. pnpm only exposes
              what&apos;s in your own package.json
            </Sent>

            <Timestamp>3:33 PM</Timestamp>

            <Received>did anything break</Received>

            <Sent pos="first">
              yep. pnpm resolved{" "}
              <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                &quot;eslint&quot;: &quot;^9&quot;
              </code>{" "}
              to 9.0.0 instead of whatever npm had locked. our config imports
              from{" "}
              <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                eslint/config
              </code>{" "}
              which didn&apos;t exist until 9.15
            </Sent>
            <Sent pos="middle">
              same thing with typescript.{" "}
              <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                ^5
              </code>{" "}
              resolved to 5.0.2 but the vitejs react plugin uses TS 5.5+
              syntax. and{" "}
              <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                @types/node@^20
              </code>{" "}
              went to 20.0.0 but Playwright needs 20.19+
            </Sent>
            <Sent pos="last">
              none of them were real bugs. just loose ranges that happened to
              work because npm&apos;s lock file pinned them higher. tightened
              all the minimums and it was fine
            </Sent>

            <Timestamp>3:37 PM</Timestamp>

            <Received>what about lint</Received>

            <Sent pos="first">
              bumping eslint to 9.39 pulled in new react-hooks rules.
              react-hooks/refs flagged ref assignments during render in the
              particle scene. moved them into useEffect
            </Sent>
            <Sent pos="last">
              had to suppress two false positives though. R3F&apos;s useFrame
              intentionally mutates THREE objects every frame and URL param
              syncing with useEffect + setState is a standard pattern the new
              rule doesn&apos;t handle well
            </Sent>

            <Timestamp>3:40 PM</Timestamp>

            <Received>what about CI and deployment</Received>

            <Sent pos="first">
              CI was straightforward. add pnpm/action-setup before
              actions/setup-node, change cache from npm to pnpm, swap npm ci
              for pnpm install --frozen-lockfile, and replace npx with pnpm
              exec
            </Sent>
            <Sent pos="last">
              Vercel auto-detects pnpm when it sees pnpm-lock.yaml. zero
              config changes. didn&apos;t even need to touch vercel.json
            </Sent>

            <Timestamp>3:42 PM</Timestamp>

            <Received>takeaway</Received>

            <Sent pos="first">
              the package manager swap itself is trivial. the real work is the
              version resolution differences it exposes
            </Sent>
            <Sent pos="last">
              if you&apos;ve been running loose semver ranges, pnpm will tell
              you exactly where the floor actually is. that&apos;s the whole
              point
            </Sent>
          </div>
        </main>
      )}
    </div>
  );
}
