"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

/**
 * Inline code span styled to match the other thoughts pages.
 */
function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
      {children}
    </code>
  );
}

/**
 * One phase block in the summary walkthrough.
 */
function Phase({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">
        <span className="text-muted">Phase {n} &middot; </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ApiBackendOverhaulContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Hub", href: "/" },
          { label: "API Backend Overhaul" },
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
              API Backend Overhaul
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              <code className="font-mono">portfolio_api</code> started as a pile
              of JavaScript route files. The overhaul turned it into a typed,
              layered TypeScript backend across twelve phases &mdash; and the one
              rule that shaped every decision was that this app,{" "}
              <code className="font-mono">paul-explore</code>, could not notice.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">The constraint</h2>
              <p className="text-muted">
                paul-explore talks to the API through BFF routes. Every existing
                endpoint path, request shape, and response shape had to stay
                stable the entire way through. New internal structure is
                invisible to the consumer. That single contract is why the
                overhaul ran as twelve incremental phases instead of a rewrite
                &mdash; the old JavaScript kept serving traffic while the new
                TypeScript grew alongside it, and nothing got swapped until it
                matched byte for byte.
              </p>
            </section>

            <Phase n="1" title="Foundation — TypeScript & structure">
              <p className="text-muted">
                Added the TypeScript toolchain alongside the existing{" "}
                <C>server.js</C>: strict mode, ES2022, <C>NodeNext</C>{" "}
                resolution, output to <C>dist/</C>. Scaffolded a layered
                directory &mdash; <C>config/</C>, <C>middleware/</C>,{" "}
                <C>modules/</C> (one folder per feature), and <C>shared/</C> for
                errors, types, and utils. The four layers: routes are a thin
                HTTP shell, controllers orchestrate, services hold pure business
                logic with no HTTP or DB awareness, repositories own all data
                access. Then typed error classes (<C>AppError</C> and subclasses
                for 400/401/403/404/409/429) behind one global error-handler
                middleware, and a Zod-validated <C>env</C> object that crashes
                fast on a missing variable.
              </p>
            </Phase>

            <Phase n="2" title="Data access — three patterns on purpose">
              <p className="text-muted">
                The showcase phase. Three different data-access patterns, each
                isolated to the modules where it fits:
              </p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  &bull; <strong className="text-foreground">Raw SQL</strong>{" "}
                  (NBA) &mdash; a <C>NbaRepository</C> class over the raw{" "}
                  <C>pg</C> pool, typed methods, external stats API proxying in
                  the repository, fantasy math in the service.
                </li>
                <li>
                  &bull;{" "}
                  <strong className="text-foreground">Knex query builder</strong>{" "}
                  (Calendar) &mdash; the fluent <C>.where()</C> / <C>.join()</C>{" "}
                  / <C>.orderBy()</C> API with transactions for multi-table
                  writes, plus permission checks (owner / member / viewer) in the
                  service. The biggest module, broken into focused files.
                </li>
                <li>
                  &bull; <strong className="text-foreground">Drizzle ORM</strong>{" "}
                  (Posts, Profiles, Follows, Timeline) &mdash; a shared schema
                  with relations and indexes, type inference on{" "}
                  <C>select/insert/update</C>, and Sharp/FFmpeg media processing
                  pulled into a shared <C>mediaProcessor</C> util.
                </li>
              </ul>
              <p className="mt-3 text-muted">
                Every remaining module (F1, fantasy, gallery, med-journal,
                feedback, chat, youtube, vitals, geo, google-auth, forum) then
                got the same treatment with whichever pattern suited it. Same
                response shapes throughout.
              </p>
            </Phase>

            <Phase n="3" title="Middleware & structured logging">
              <p className="text-muted">
                Typed middleware for auth, body/param/query validation (one
                generic <C>validateBody&lt;T&gt;</C> wrapper), rate limiting, and
                caching, with the Express <C>Request</C> type augmented globally
                to carry <C>auth</C> and <C>validated*</C> fields. Then every{" "}
                <C>console.log</C> was replaced with structured <C>pino</C>{" "}
                logging &mdash; JSON in production, pretty in dev, child loggers
                per module, and request-scoped correlation IDs. Business logic
                untouched; only the logging calls changed.
              </p>
            </Phase>

            <Phase n="4" title="Performance & reliability">
              <p className="text-muted">
                Explicit connection-pool settings with event listeners and
                slow-query warnings ({">"}100ms), a <C>/api/health</C> check,
                and independent well-tuned pools for each data-access pattern.
                The caching layer was redesigned into a typed cache manager with
                per-module TTLs (external API data 1h, aggregates 5m, RSS 15m,
                user-mutable data not cached), tag-based invalidation, and ETag /{" "}
                <C>304</C> support. Plus graceful shutdown &mdash; drain in-flight
                requests on <C>SIGTERM</C>, close every pool, flush the logger,
                kill Python children &mdash; which matters because Railway sends{" "}
                <C>SIGTERM</C> on every deploy.
              </p>
            </Phase>

            <Phase n="5" title="API design & contracts">
              <p className="text-muted">
                Response helpers (<C>success</C>, <C>paginated</C>,{" "}
                <C>created</C>) for future endpoints &mdash; but deliberately{" "}
                <em>not</em> applied to existing ones, because paul-explore
                expects raw bodies like <C>res.json(teams)</C>, not{" "}
                <C>{"{ data: teams }"}</C>. Legacy routes stayed a raw &quot;v1&quot;
                shape; only new endpoints use the envelope. Zod validation was
                consolidated per module with <C>z.infer</C> as the single source
                of truth, and an OpenAPI 3.1 spec plus Swagger UI got generated
                from the route registry for living documentation.
              </p>
            </Phase>

            <Phase n="6" title="Swap & cleanup">
              <p className="text-muted">
                The moment everything pointed at: <C>src/index.ts</C> became the
                real entry point, mounting every new TypeScript router at the
                exact same paths the JavaScript used. Then the old{" "}
                <C>routes/</C>, <C>middleware/</C>, <C>utils/</C>, and{" "}
                <C>server.js</C> were deleted &mdash; mostly. This is where the
                plan met reality (see below).
              </p>
            </Phase>

            <Phase n="7" title="Testing">
              <p className="text-muted">
                Moved to Vitest with <C>supertest</C>, test-data factories, and
                integration tests aimed squarely at the endpoints paul-explore
                leans on most &mdash; calendar CRUD, NBA stats with mocked
                external calls, vitals aggregation, profile uniqueness, post
                creation with mocked S3. The point was proving the consumer
                contract held, not chasing a coverage number.
              </p>
            </Phase>

            <Phase n="8" title="DevOps & migrations">
              <p className="text-muted">
                CI runs lint, type check, test, and build as parallel jobs, and
                Knex migrations replaced hand-run SQL with an initial baseline
                captured from <C>init.sql</C>. From here on, schema changes are
                migrations, not manual edits.
              </p>
            </Phase>

            <Phase n="9" title="Package manager — npm to pnpm">
              <p className="text-muted">
                Switched to pnpm for its content-addressable store (faster CI,
                smaller Docker layers) and, more importantly, strict{" "}
                <C>node_modules</C> resolution that kills phantom-dependency bugs
                &mdash; you can only import what you actually declared. Corepack
                in the Dockerfile, <C>--frozen-lockfile</C> in place of{" "}
                <C>npm ci</C>, and the pnpm store cached in CI.{" "}
                <a
                  href="/thoughts/npm-to-pnpm"
                  className="text-foreground underline underline-offset-2 hover:opacity-75 transition-opacity"
                >
                  paul-explore made the same move
                </a>
                .
              </p>
            </Phase>

            <Phase n="10" title="Architecture audit — right-sizing">
              <p className="text-muted">
                An honest pass to confirm the design earns its complexity rather
                than adding to it. Written up in <C>plan/ARCHITECTURE_AUDIT.md</C>
                : checking that controllers stay thin, services stay free of
                HTTP/DB, and repositories own data access; flagging pure
                passthrough layers, single-implementation abstractions, and
                over-fitted utils. Only safe, mechanical fixes were made in this
                phase &mdash; everything larger was recorded as a recommendation,
                not done on the spot. No new abstractions allowed.
              </p>
            </Phase>

            <Phase n="11" title="Logging rate & performance">
              <p className="text-muted">
                Railway has a 500 logs/sec limit and we were tripping it (557
                messages dropped per replica). The fix: ignore high-frequency
                zero-value paths (<C>/api/health</C>, <C>/api/ready</C>,{" "}
                <C>/favicon.ico</C>) entirely, and drop routine 2xx logs to{" "}
                <C>debug</C> in production so only warns and errors flow at the{" "}
                <C>info</C> base level. A follow-up step measures real p95s before
                optimizing anything &mdash; make it observable first, then only
                touch what&apos;s actually over budget.
              </p>
            </Phase>

            <Phase n="12" title="Fixing the audit findings">
              <p className="text-muted">
                Closing the layer-boundary violations the Phase 10 audit
                surfaced: the posts controller was running raw{" "}
                <C>BEGIN/COMMIT/ROLLBACK</C> transactions inline &mdash; moved
                into a service. Google auth was calling DB helpers straight from
                route handlers &mdash; a service layer went in. And the NBA
                repository held <C>getCurrentSeason()</C> date math that isn&apos;t
                data access &mdash; moved to the service. Behavior and response
                shapes stayed identical throughout.
              </p>
            </Phase>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Where the plan met reality
              </h2>
              <p className="text-muted">
                The plan was the intent; a few things diverged, and writing them
                down keeps it honest. Tooling shifted toward fewer, faster
                dependencies: <strong className="text-foreground">Biome</strong>{" "}
                replaced the ESLint + Prettier + husky stack (one tool, one
                config), <C>tsx</C> replaced <C>ts-node</C> for dev,{" "}
                <C>express-rate-limit</C> and Auth0&apos;s official{" "}
                <C>express-oauth2-jwt-bearer</C> replaced hand-rolled versions,
                and the three <C>validate*</C> helpers stayed in one file since
                they share a wrapper.
              </p>
              <p className="mt-3 text-muted">
                The biggest surprise was in Phase 6: the &quot;delete all the
                legacy JS&quot; sweep was too aggressive. F1 and fantasy still
                lean on Python-queue plumbing that was never ported to
                TypeScript, so those <C>utils/*.js</C> files had to be restored
                (along with a broken geo cache import the same cleanup caused).
                The lesson &mdash; the Python-integration modules are far more
                entangled with JavaScript than the plan assumed, and porting them
                is real work, not a delete. Swagger UI also broke under
                Helmet&apos;s CSP, fixed by relaxing the policy only on the docs
                route. And a handful of dependencies (<C>apicache</C>,{" "}
                <C>jest</C>, <C>ts-node</C>) got fully replaced but left in{" "}
                <C>package.json</C> as dead weight to prune.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What it added up to</h2>
              <p className="text-muted">
                Roughly twenty-two focused commits across twelve phases. Three
                distinct data-access patterns living cleanly in one codebase,
                professional-grade typed middleware, OpenAPI docs, structured
                logging, and integration tests &mdash; and, the whole point,
                paul-explore never had to change a single call. The most valuable
                habit wasn&apos;t any one pattern; it was keeping the old code
                serving traffic until the new code proved it matched, so the
                consumer contract was safe at every step.
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
              <Timestamp>Today 2:10 PM</Timestamp>

              <Received>what was the api overhaul actually about</Received>

              <Sent pos="first">
                turning portfolio_api from a pile of JS route files into a typed,
                layered TypeScript backend. twelve phases
              </Sent>
              <Sent pos="last">
                the one rule the whole thing was built around: this app
                (paul-explore) couldn&apos;t notice. every endpoint path, request
                shape, response shape had to stay identical
              </Sent>

              <Timestamp>2:12 PM</Timestamp>

              <Received>how do you rewrite a backend without breaking the consumer</Received>

              <Sent pos="first">
                you don&apos;t swap, you grow alongside. the old JS kept serving
                traffic while the new TS was built next to it. nothing got
                pointed at until it matched byte for byte
              </Sent>
              <Sent pos="last">
                that&apos;s why it was 12 incremental phases instead of one big
                rewrite. ~22 small commits, always in a working state
              </Sent>

              <Timestamp>2:15 PM</Timestamp>

              <Received>why three different data access patterns</Received>

              <Sent pos="first">
                showcase value, but isolated per module so it&apos;s not chaos.
                raw SQL for NBA, Knex query builder for calendar, Drizzle ORM for
                the social stuff (posts/profiles/follows/timeline)
              </Sent>
              <Sent pos="last">
                phase 10 was a whole audit to make sure that choice earned its
                complexity instead of just adding to it
              </Sent>

              <Timestamp>2:18 PM</Timestamp>

              <Received>anything not go to plan</Received>

              <Sent pos="first">
                the &quot;delete all the legacy JS&quot; step was too aggressive.
                F1 and fantasy still depend on python-queue plumbing that was
                never ported to TS, so those utils had to be restored
              </Sent>
              <Sent pos="last">
                lesson: the python-integration modules are way more tangled with
                JS than the plan assumed. porting them is real work, not a delete.
                also swagger broke under helmet&apos;s CSP, relaxed it only on the
                docs route
              </Sent>

              <Timestamp>2:21 PM</Timestamp>

              <Received>tooling end up matching the plan</Received>

              <Sent pos="first">
                mostly shifted toward fewer/faster deps. Biome instead of eslint +
                prettier + husky, tsx instead of ts-node, express-rate-limit
                instead of a hand-rolled limiter
              </Sent>
              <Sent pos="last">
                and pnpm in phase 9 for strict resolution, same move paul-explore
                made. left a few dead deps (apicache, jest, ts-node) to prune but
                nothing imports them
              </Sent>

              <Timestamp>2:23 PM</Timestamp>

              <Received>takeaway</Received>

              <Sent pos="last">
                the valuable habit wasn&apos;t any single pattern. it was keeping
                the old code live until the new code proved it matched, so the
                consumer contract was never at risk
              </Sent>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
