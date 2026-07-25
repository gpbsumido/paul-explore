"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

export default function NpmToPnpmContent() {
  return (
    <ThoughtLayout
      breadcrumb="npm to pnpm"
      title="npm to pnpm"
      intro={
        <>
          Switching package managers, what broke, and what it told us about
              the dependency graph.
        </>
      }
      chat={
        <div className="flex justify-center">
          <div
            className={styles.phone}
            style={{ minHeight: "calc(100dvh - 56px)" }}
          >
            <div className={styles.chat}>
              <Timestamp>Today 3:30 PM</Timestamp>

              <Received>why pnpm over npm</Received>

              <Sent pos="first">
                strict dependency resolution. npm hoists everything flat so you
                can import packages you never declared. pnpm only exposes
                what&apos;s in your package.json
              </Sent>
              <Sent pos="last">
                the speed is a bonus but the strictness is the real point
              </Sent>

              <Timestamp>3:33 PM</Timestamp>

              <Received>did it just work</Received>

              <Sent pos="first">
                nope. pnpm resolved our loose ranges to their actual minimums.
                eslint ^9 became 9.0.0, typescript ^5 became 5.0.2, @types/node
                ^20 became 20.0.0. all too low for what the codebase actually
                uses
              </Sent>
              <Sent pos="last">
                none of them were real bugs though. just ranges that said
                &quot;anything from X.0.0&quot; when the code actually needs
                X.15+. tightened the minimums and it was fine
              </Sent>

              <Timestamp>3:37 PM</Timestamp>

              <Received>what about lint</Received>

              <Sent pos="first">
                bumping eslint to 9.39 pulled in new react-hooks rules.
                react-hooks/refs flagged ref assignments during render in the
                particle scene. moved them into useEffect
              </Sent>
              <Sent pos="last">
                had to suppress two false positives. R3F&apos;s useFrame
                intentionally mutates THREE objects every frame, and URL param
                syncing with useEffect + setState is a standard pattern the new
                rule can&apos;t distinguish from the problematic cases
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
                the swap itself is trivial. the real work is the version
                resolution differences it exposes
              </Sent>
              <Sent pos="last">
                if you&apos;ve been running loose semver ranges, pnpm will tell
                you exactly where the floor actually is. every issue we hit was
                a real inconsistency that npm just never surfaced
              </Sent>
            </div>
          </div>
        </div>
      }
    >
      <section>
              <h2 className="mb-3 text-lg font-bold">Why switch</h2>
              <p className="text-muted">
                npm was fine. Nothing was broken. The motivation was pnpm&apos;s
                strict dependency resolution: it only exposes packages you
                explicitly declare, so you can&apos;t accidentally import
                something a transitive dependency happens to provide. npm hoists
                everything flat and you never notice these &quot;phantom
                deps&quot; until one disappears.
              </p>
              <p className="mt-3 text-muted">
                The speed is nice too. Content-addressable store, hard links,
                faster CI installs. But the strictness is the real value.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What broke</h2>
              <p className="text-muted">
                pnpm resolved our loose semver ranges to their actual minimums.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  &quot;eslint&quot;: &quot;^9&quot;
                </code>{" "}
                became 9.0.0 instead of whatever npm had locked, and our config
                imports{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  eslint/config
                </code>{" "}
                which didn&apos;t exist until ESLint 9.15. TypeScript{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ^5
                </code>{" "}
                went to 5.0.2, but{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  @vitejs/plugin-react
                </code>{" "}
                uses the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  as &quot;module.exports&quot;
                </code>{" "}
                export syntax which needs TS 5.5+. And{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  @types/node@^20
                </code>{" "}
                went to 20.0.0, but Playwright 1.59+ needs types from 20.19+
                for the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  Page
                </code>{" "}
                type to include newer properties like{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  localStorage
                </code>{" "}
                and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  sessionStorage
                </code>
                .
              </p>
              <p className="mt-3 text-muted">
                None were real bugs. They were ranges that said &quot;anything
                from X.0.0&quot; when the codebase actually needed X.15+. The
                fix was tightening the minimums to match reality.
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
                were being set during render. React 19 discourages writing to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ref.current
                </code>{" "}
                during render because the component won&apos;t re-render when
                the ref changes, which can cause stale reads in concurrent mode.
                The fix was moving the assignments into a{" "}
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
                loop, and the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  react-hooks/immutability
                </code>{" "}
                rule can&apos;t distinguish it from accidental mutation. And
                syncing URL search params to local state via{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useEffect + setState
                </code>{" "}
                is a standard pattern that the new{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  set-state-in-effect
                </code>{" "}
                rule doesn&apos;t distinguish from the problematic cases it
                targets (synchronous cascading renders).
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What changed</h2>
              <p className="text-muted">
                The lock file swapped from{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  package-lock.json
                </code>{" "}
                to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  pnpm-lock.yaml
                </code>
                . GitHub Actions CI now uses{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  pnpm/action-setup
                </code>{" "}
                with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  --frozen-lockfile
                </code>{" "}
                (pnpm&apos;s equivalent of{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  npm ci
                </code>
                ). A{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  packageManager
                </code>{" "}
                field in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  package.json
                </code>{" "}
                tells corepack and Vercel which package manager to use. Vercel
                auto-detects pnpm from the lock file and needed zero config
                changes.
              </p>
              <p className="mt-3 text-muted">
                Dependency minimums were tightened across the board: eslint,
                typescript, @types/node, @playwright/test, and
                @axe-core/playwright all got version floors that match what the
                codebase actually requires.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  package-lock.json
                </code>{" "}
                was added to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  .gitignore
                </code>{" "}
                to prevent accidental npm usage from generating a stale lock
                file.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What I learned</h2>
              <p className="text-muted">
                Loose semver ranges like{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ^9
                </code>{" "}
                or{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ^5
                </code>{" "}
                are a liability. The range says &quot;anything from 9.0.0 to
                9.x.x&quot; but the codebase actually depends on features from
                9.15+. npm&apos;s lock file hides the mismatch because it pins
                to whatever was latest at install time. pnpm makes the implicit
                explicit.
              </p>
              <p className="mt-3 text-muted">
                Switching package managers is the easy part. The version
                resolution differences and the lint/type errors they expose are
                where the actual work is. Every type mismatch we hit was a
                genuine inconsistency in the dependency graph that npm silently
                papered over.
              </p>
              <p className="mt-3 text-muted">
                CI and deployment were non-events. GitHub Actions has{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  pnpm/action-setup
                </code>{" "}
                as a first-class action, and Vercel auto-detects the lock file.
                The only thing worth remembering: add{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  package-lock.json
                </code>{" "}
                to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  .gitignore
                </code>{" "}
                or muscle memory will generate one and confuse the next deploy.
              </p>
            </section>
    </ThoughtLayout>
  );
}
