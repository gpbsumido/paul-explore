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
              Switching package managers, what broke, and what it told us about
              the dependency graph.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
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
                became 9.0.0 instead of whatever npm had locked, and our
                config imports{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  eslint/config
                </code>{" "}
                which didn&apos;t exist until 9.15. TypeScript{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ^5
                </code>{" "}
                went to 5.0.2, but a Vite plugin needs 5.5+ syntax.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  @types/node@^20
                </code>{" "}
                went to 20.0.0, but Playwright needs 20.19+.
              </p>
              <p className="mt-3 text-muted">
                None were real bugs. They were ranges that said &quot;anything
                from X.0.0&quot; when the codebase actually needed X.15+. The
                fix was tightening the minimums to match reality.
              </p>
              <p className="mt-3 text-muted">
                The ESLint bump also pulled in new{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  react-hooks
                </code>{" "}
                rules that flagged ref assignments during render in the particle
                scene (moved to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useEffect
                </code>
                ) and two false positives that needed suppression: R3F&apos;s{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useFrame
                </code>{" "}
                mutating Three.js objects, and URL param syncing via{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  setState
                </code>{" "}
                in effects.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What I took away</h2>
              <p className="text-muted">
                Switching the package manager is the easy part. The version
                resolution differences and the errors they surface are where the
                work is. Every type mismatch we hit was a genuine inconsistency
                that npm silently papered over.
              </p>
              <p className="mt-3 text-muted">
                CI and deployment were non-events. GitHub Actions has{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  pnpm/action-setup
                </code>
                , Vercel auto-detects the lock file. The only thing worth
                remembering: add{" "}
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
          </div>
        </main>
      ) : (
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <div className={styles.bubbleWrap}>
            <Timestamp>3:30 PM</Timestamp>

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
              tightened the minimums, fixed a few new lint errors from the
              eslint bump, and everything passed. CI and Vercel were
              uneventful
            </Sent>

            <Timestamp>3:36 PM</Timestamp>

            <Received>takeaway</Received>

            <Sent>
              the swap itself is trivial. the value is in what strict resolution
              tells you about your dependency graph. every issue we hit was
              real, npm just never surfaced it
            </Sent>
          </div>
        </main>
      )}
    </div>
  );
}
