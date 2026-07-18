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
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/**
 * Callout for the "why this is good engineering" rationale on a decision.
 */
function Why({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
        Why it holds up
      </p>
      <p className="text-[14px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}

/**
 * Callout for a place where the plan changed course mid-flight.
 */
function Pivot({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border-l-2 border-amber-400/70 bg-amber-400/[0.06] px-4 py-3 dark:border-amber-300/50 dark:bg-amber-300/[0.06]">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-amber-700 dark:text-amber-300">
        The pivot
      </p>
      <p className="text-[14px] leading-relaxed text-muted">{children}</p>
    </div>
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
              layered TypeScript backend across twelve phases. This is the whole
              thought process behind it &mdash; what I chose, why, where I
              changed my mind, and why the decisions are sound system design
              even though (maybe especially because) I came at it as a frontend
              dev.
            </p>
          </header>

          <div className="space-y-12 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">
                Why a frontend dev rebuilds a backend
              </h2>
              <p className="text-muted">
                I am the person who calls this API all day. When a response
                shape is sloppy, or an endpoint 500s at 3am, or a field quietly
                changes type, the pain lands in the frontend. So the instinct
                that drove this whole thing is the same one that makes good
                frontend work: <strong className="text-foreground">a
                boundary is a contract</strong>. A component&apos;s props are a
                contract. A hook&apos;s return type is a contract. An API&apos;s
                response body is a contract too &mdash; it just happens to cross
                a network instead of a function call.
              </p>
              <p className="mt-3 text-muted">
                Framed that way, the overhaul isn&apos;t really about &quot;the
                backend.&quot; It&apos;s about making one system typed and
                predictable end to end, so the contract between the API and
                paul-explore is enforced by the compiler instead of by memory
                and hope.
              </p>
              <Why>
                Backend and frontend aren&apos;t separate crafts here &mdash;
                they&apos;re two ends of the same contract. The skills transfer:
                thinking in typed boundaries, isolating what changes often from
                what doesn&apos;t, and measuring before optimizing are the same
                moves on both sides of the wire.
              </Why>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                The one rule: the consumer can&apos;t notice
              </h2>
              <p className="text-muted">
                paul-explore talks to the API through BFF routes. Every existing
                endpoint path, request shape, and response shape had to stay
                stable the entire way through. That constraint is the reason
                this ran as twelve incremental phases instead of a rewrite. The
                old JavaScript kept serving live traffic while the new
                TypeScript grew beside it, and nothing got swapped until it
                matched byte for byte.
              </p>
              <Why>
                This is the <strong className="text-foreground">strangler fig
                pattern</strong>: wrap the old system, grow the replacement
                around it, and cut the original over only once the new path is
                proven. It&apos;s the professional answer to &quot;how do you
                rewrite something that&apos;s in production&quot; &mdash; you
                never have a scary big-bang cutover, every phase leaves the app
                shippable, and if a phase goes wrong you&apos;re one revert from
                safe. Small, reversible steps beat one heroic leap.
              </Why>
            </section>

            <Phase n="1" title="Foundation — TypeScript & structure">
              <p className="text-muted">
                Added the TypeScript toolchain alongside the existing{" "}
                <C>server.js</C> rather than converting in place: strict mode,
                ES2022, <C>NodeNext</C> resolution, output to <C>dist/</C>. Then
                a layered directory &mdash; <C>config/</C>, <C>middleware/</C>,{" "}
                <C>modules/</C> (one folder per feature), <C>shared/</C> for
                errors, types, and utils.
              </p>
              <p className="text-muted">
                The four layers have strict jobs: routes are a thin HTTP shell,
                controllers orchestrate, services hold pure business logic with
                no HTTP or DB awareness, repositories own all data access. On top
                of that: typed error classes (<C>AppError</C> and subclasses for
                400/401/403/404/409/429) behind one global error handler, and a
                Zod-validated <C>env</C> object that crashes on boot if a
                required variable is missing.
              </p>
              <Why>
                Two ideas a frontend dev already lives by. First, <strong className="text-foreground">separation
                of concerns</strong>: routes/controllers/services/repositories is
                the same split as component / hook / API-client &mdash; the thing
                that renders shouldn&apos;t know how data is fetched, and the
                thing that fetches shouldn&apos;t know how it&apos;s rendered.
                Second, <strong className="text-foreground">fail fast</strong>:
                validating env at startup means a missing secret crashes the
                deploy immediately with a clear message, instead of throwing a
                confusing 500 on the first user request an hour later. Cheap to
                catch early, expensive to catch late.
              </Why>
            </Phase>

            <Phase n="2" title="Data access — three patterns, on purpose">
              <p className="text-muted">
                The most debatable decision in the whole project: three
                different data-access patterns, each isolated to the modules
                where it fits.
              </p>
              <ul className="space-y-2 text-muted">
                <li>
                  &bull; <strong className="text-foreground">Raw SQL</strong>{" "}
                  (NBA) &mdash; a <C>NbaRepository</C> over the raw <C>pg</C>{" "}
                  pool. Full control, zero abstraction tax, ideal when the
                  queries are gnarly and you want to see exactly what hits the
                  database.
                </li>
                <li>
                  &bull;{" "}
                  <strong className="text-foreground">Knex query builder</strong>{" "}
                  (Calendar) &mdash; the fluent <C>.where()</C> / <C>.join()</C>{" "}
                  / transactions API. The sweet spot for lots of conditional CRUD
                  where hand-writing SQL strings gets error-prone.
                </li>
                <li>
                  &bull; <strong className="text-foreground">Drizzle ORM</strong>{" "}
                  (Posts, Profiles, Follows, Timeline) &mdash; a typed schema
                  with relations, so queries infer their result types. Best where
                  the shapes are relational and you want the compiler checking
                  your joins.
                </li>
              </ul>
              <p className="text-muted">
                Every remaining module (F1, fantasy, gallery, med-journal,
                feedback, chat, youtube, vitals, geo, google-auth, forum) got the
                same treatment with whichever pattern suited it &mdash; same
                response shapes throughout.
              </p>
              <Why>
                Honest version: the variety is partly showcase. But it holds up
                because of <strong className="text-foreground">the repository
                pattern and strict isolation</strong>. Every module hides its
                data tool behind a repository interface, so the service layer
                never knows whether it&apos;s raw SQL or Drizzle underneath
                &mdash; exactly like a frontend hook doesn&apos;t care if the
                data came from <C>fetch</C>, React Query, or a WebSocket. That
                boundary caps the cost of the variety: the complexity lives in
                one file per module and leaks nowhere. And it&apos;s honest
                engineering to <em>keep this decision on trial</em> &mdash; which
                is exactly what Phase 10 does.
              </Why>
            </Phase>

            <Phase n="3" title="Middleware & structured logging">
              <p className="text-muted">
                Typed middleware for auth, validation (one generic{" "}
                <C>validateBody&lt;T&gt;</C> wrapper), rate limiting, and caching,
                with the Express <C>Request</C> type augmented globally so{" "}
                <C>req.auth</C> and <C>req.validatedBody</C> are typed
                everywhere. Then every <C>console.log</C> became structured{" "}
                <C>pino</C> logging &mdash; JSON in production, pretty in dev,
                child loggers per module, request-scoped correlation IDs.
              </p>
              <Why>
                <strong className="text-foreground">Logs are data, not
                strings.</strong> A <C>console.log(&quot;user 5 did thing&quot;)</C>{" "}
                is unsearchable; a structured{" "}
                <C>{"{ userId: 5, event: 'thing' }"}</C> can be filtered and
                aggregated in a log platform. Correlation IDs let you follow one
                request across every log line it touches &mdash; the backend
                equivalent of tracing a single render through React DevTools.
                This is observability: you can&apos;t fix what you can&apos;t
                see, so you build the seeing-in first.
              </Why>
            </Phase>

            <Phase n="4" title="Performance & reliability">
              <p className="text-muted">
                Explicit connection-pool settings with event listeners and
                slow-query warnings ({">"}100ms), a <C>/api/health</C> check, and
                independent well-tuned pools per data-access pattern. The cache
                got redesigned into a typed manager with per-module TTLs
                (external API data 1h, aggregates 5m, RSS 15m, user-mutable data
                not cached at all), tag-based invalidation, and ETag / <C>304</C>{" "}
                support. Plus graceful shutdown: drain in-flight requests on{" "}
                <C>SIGTERM</C>, close every pool, flush the logger, kill Python
                children.
              </p>
              <Why>
                The cache TTLs are the same judgment a frontend dev makes with a
                React Query <C>staleTime</C>: <strong className="text-foreground">cache
                by how fast the data actually changes</strong>, not a blanket
                number. Graceful shutdown is deploy safety &mdash; Railway sends{" "}
                <C>SIGTERM</C> on every deploy, and without draining, in-flight
                requests die mid-flight and the user sees a random failure during
                an otherwise invisible deploy. Reliability is a feature; users
                just experience it as &quot;it doesn&apos;t glitch.&quot;
              </Why>
            </Phase>

            <Phase n="5" title="API design & contracts">
              <p className="text-muted">
                Built response helpers (<C>success</C>, <C>paginated</C>,{" "}
                <C>created</C>) for a cleaner envelope shape &mdash; and then
                deliberately did <em>not</em> apply them to existing endpoints.
                Consolidated Zod validation per module with <C>z.infer</C> as the
                single source of truth, and generated an OpenAPI 3.1 spec plus
                Swagger UI from the route registry.
              </p>
              <Pivot>
                The plan wanted every response wrapped in{" "}
                <C>{"{ data: ... }"}</C>. But paul-explore expects raw bodies
                like <C>res.json(teams)</C>, and wrapping them would break the
                contract on day one. So the &quot;better&quot; design got shelved
                for the live routes: legacy endpoints stay the raw v1 shape,
                only new endpoints use the envelope, and the difference is
                documented per controller. Discipline over aesthetics.
              </Pivot>
              <Why>
                This is the whole game: <strong className="text-foreground">backward
                compatibility beats a prettier design</strong>. Wrapping the
                responses would have been cleaner in the abstract and a
                production incident in practice. Freezing v1 and versioning v2
                is how you evolve a contract without a breaking change &mdash;
                the same reason you don&apos;t rename a prop half your components
                pass. OpenAPI then makes the contract machine-readable, so the
                frontend could generate types straight from the API instead of
                hand-writing them.
              </Why>
            </Phase>

            <Phase n="6" title="Swap & cleanup">
              <p className="text-muted">
                The moment everything pointed at: <C>src/index.ts</C> became the
                real entry point, mounting every new TypeScript router at the
                exact same paths the JavaScript used. Then the old <C>routes/</C>
                , <C>middleware/</C>, <C>utils/</C>, and <C>server.js</C> got
                deleted. That&apos;s the strangler fig finally cutting over.
              </p>
              <Pivot>
                The delete was too aggressive. F1 and fantasy still lean on
                Python-queue plumbing (<C>pythonQueue.js</C>, <C>queue.js</C>,{" "}
                <C>fantasyScoring.js</C>) that was never ported to TypeScript, so
                the &quot;clean sweep&quot; broke them and took a geo cache import
                down with it. Those files had to be restored. The lesson:{" "}
                <strong className="text-foreground">the Python-integration
                modules were far more entangled with JS than the plan
                assumed</strong> &mdash; porting them is real work, not a delete.
              </Pivot>
              <Why>
                Getting this wrong and recovering in one commit is the strangler
                fig <em>earning its keep</em>. Because the cutover was
                incremental and reversible, a bad assumption cost a restore, not
                an outage. That&apos;s the difference between &quot;move fast and
                break things&quot; and &quot;move fast because things are cheap to
                un-break.&quot;
              </Why>
            </Phase>

            <Phase n="7" title="Testing">
              <p className="text-muted">
                Moved to Vitest with <C>supertest</C>, test-data factories, and
                integration tests aimed squarely at the endpoints paul-explore
                leans on most &mdash; calendar CRUD, NBA stats with mocked
                external calls, vitals aggregation, profile uniqueness, post
                creation with mocked S3.
              </p>
              <Why>
                The tests target <strong className="text-foreground">the
                consumer contract, not a coverage number</strong>. An integration
                test that hits a real route through <C>supertest</C> and asserts
                the response shape is proof the frontend won&apos;t break &mdash;
                it tests behavior at the boundary that matters, the same reason
                frontend tests should assert what the user sees, not that a
                function was called. Coverage is a vanity metric; a green test on
                the exact endpoint you depend on is a safety net.
              </Why>
            </Phase>

            <Phase n="8" title="DevOps & migrations">
              <p className="text-muted">
                CI runs lint, type check, test, and build as parallel jobs. Knex
                migrations replaced hand-run SQL, with an initial baseline
                captured from <C>init.sql</C>. From here, schema changes are
                migrations, not manual edits.
              </p>
              <Why>
                Migrations are <strong className="text-foreground">version
                control for the database</strong> &mdash; an ordered, reviewable,
                reversible history of schema changes instead of someone SSHing in
                to run ad-hoc SQL. CI running on every push is the same seatbelt
                a frontend repo has: the contract can&apos;t regress without a red
                check, so &quot;it works on my machine&quot; stops being a
                deploy strategy.
              </Why>
            </Phase>

            <Phase n="9" title="Package manager — npm to pnpm">
              <p className="text-muted">
                Switched to pnpm for its content-addressable store (faster CI,
                smaller Docker layers) and, the real reason, strict{" "}
                <C>node_modules</C> resolution: you can only import what you
                actually declared, so phantom dependencies get caught instead of
                silently working until they don&apos;t.
              </p>
              <Why>
                Same move, same reasoning as{" "}
                <a
                  href="/thoughts/npm-to-pnpm"
                  className="text-foreground underline underline-offset-2 hover:opacity-75 transition-opacity"
                >
                  paul-explore&apos;s own npm-to-pnpm switch
                </a>
                . Strictness surfaces latent bugs the flat <C>node_modules</C>{" "}
                hoisting hides. Making the implicit explicit is good engineering
                on either side of the stack.
              </Why>
            </Phase>

            <Phase n="10" title="Architecture audit — right-sizing">
              <p className="text-muted">
                A deliberate pass to confirm the design earns its complexity
                rather than adding to it, written up in{" "}
                <C>plan/ARCHITECTURE_AUDIT.md</C>. Checking that controllers stay
                thin, services stay free of HTTP/DB, and repositories own data
                access; flagging pure passthrough layers, single-implementation
                abstractions, and over-fitted utils. Only safe, mechanical fixes
                got made here; anything bigger was logged as a recommendation,
                not done on the spot. No new abstractions allowed in this phase.
              </p>
              <Why>
                This is the maturity phase: <strong className="text-foreground">knowing
                when to stop</strong>. Overengineering is as real a cost as
                underengineering &mdash; every needless abstraction is a tax the
                next reader pays. Putting the three-pattern decision back on
                trial, in writing, is the opposite of getting attached to your
                own cleverness. A frontend equivalent: auditing whether that
                context provider and four custom hooks actually earned their
                indirection, or whether one component would have been clearer.
              </Why>
            </Phase>

            <Phase n="11" title="Logging rate & performance">
              <p className="text-muted">
                Railway caps logs at 500/sec and we were tripping it (557
                messages dropped per replica). The fix: ignore high-frequency
                zero-value paths (<C>/api/health</C>, <C>/api/ready</C>,{" "}
                <C>/favicon.ico</C>) entirely, and drop routine 2xx logs to{" "}
                <C>debug</C> in production so only warnings and errors flow at the{" "}
                <C>info</C> base level. A follow-up step measures real p95s before
                optimizing anything.
              </p>
              <Why>
                <strong className="text-foreground">Measure before you
                optimize.</strong> The log-rate breach was a measured problem
                with a targeted fix, not a guess. And the perf follow-up is
                explicitly &quot;make it observable, then only touch what&apos;s
                actually over budget&quot; &mdash; the same discipline as not
                reaching for <C>useMemo</C> until the profiler shows a real
                render cost. Premature optimization adds complexity to solve
                problems you don&apos;t have.
              </Why>
            </Phase>

            <Phase n="12" title="Fixing the audit findings">
              <p className="text-muted">
                Closing the loop on the boundary violations Phase 10 surfaced.
                The posts controller was running raw{" "}
                <C>BEGIN/COMMIT/ROLLBACK</C> transactions inline &mdash; moved
                into a service. Google auth was calling DB helpers straight from
                route handlers &mdash; a service layer went in. The NBA
                repository held <C>getCurrentSeason()</C> date math that
                isn&apos;t data access &mdash; moved to the service. Behavior and
                response shapes stayed identical throughout.
              </p>
              <Why>
                An audit you don&apos;t act on is theatre. Actually extracting
                the transaction logic and the date math puts the layers back
                where they belong, so the boundaries you drew in Phase 1 are
                real, not aspirational. Consistency across modules is what lets a
                new reader (or the next you) predict where any piece of logic
                lives &mdash; the same payoff as a component library where every
                component follows the same shape.
              </Why>
            </Phase>

            <section>
              <h2 className="mb-3 text-lg font-bold">The pivots, collected</h2>
              <p className="text-muted">
                The plan was the intent; reality moved it in a few places, and
                writing that down keeps it honest. The through-line is the same
                every time: choose the option with the lower long-term cost, even
                if it means abandoning the original call.
              </p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  &bull;{" "}
                  <strong className="text-foreground">Biome over ESLint +
                  Prettier + husky</strong> &mdash; one fast tool and one config
                  instead of a plugin/parser/formatter stack. Fewer moving parts
                  is fewer things to break.
                </li>
                <li>
                  &bull; <strong className="text-foreground">tsx over ts-node</strong>{" "}
                  for dev &mdash; faster, and it handles ESM/<C>NodeNext</C>{" "}
                  without the friction.
                </li>
                <li>
                  &bull;{" "}
                  <strong className="text-foreground">Battle-tested libraries
                  over hand-rolled</strong> &mdash; <C>express-rate-limit</C> and
                  Auth0&apos;s official <C>express-oauth2-jwt-bearer</C> instead
                  of reinventing store/window and JWT logic. Don&apos;t hand-roll
                  the security-critical parts.
                </li>
                <li>
                  &bull;{" "}
                  <strong className="text-foreground">Combined the validate
                  helpers</strong> &mdash; <C>validateBody/Params/Query</C> share
                  one wrapper, so splitting them into files added indirection
                  without value.
                </li>
                <li>
                  &bull; <strong className="text-foreground">The legacy-JS
                  restore</strong> &mdash; the biggest course-correction, covered
                  in Phase 6.
                </li>
                <li>
                  &bull; <strong className="text-foreground">Swagger vs Helmet
                  CSP</strong> &mdash; Helmet&apos;s Content-Security-Policy
                  blocked Swagger UI&apos;s inline scripts, so the docs rendered
                  blank. Fixed by relaxing CSP <em>only</em> on the docs route,
                  not weakening it globally. Scope the exception as narrowly as
                  the problem.
                </li>
                <li>
                  &bull; <strong className="text-foreground">Dead deps left to
                  prune</strong> &mdash; <C>apicache</C>, <C>jest</C>, and{" "}
                  <C>ts-node</C> got fully replaced but linger in{" "}
                  <C>package.json</C>. Named honestly rather than pretended away.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Why this is good system design
              </h2>
              <p className="text-muted">
                Strip away the specific tools and the same handful of principles
                show up in every phase:
              </p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  &bull; <strong className="text-foreground">Contracts
                  first.</strong> The API&apos;s response shapes are a promise to
                  the consumer, enforced by types and preserved at every step.
                </li>
                <li>
                  &bull;{" "}
                  <strong className="text-foreground">Separation of
                  concerns.</strong> Routes, controllers, services, repositories
                  each do one job, so a change in one rarely ripples into the
                  others.
                </li>
                <li>
                  &bull;{" "}
                  <strong className="text-foreground">Isolate what
                  changes.</strong> Volatile things (data tools, cache windows,
                  external APIs) live behind boundaries so churn stays local.
                </li>
                <li>
                  &bull; <strong className="text-foreground">Fail fast, and
                  loudly.</strong> Bad config crashes at boot; bad input is
                  rejected at the edge by Zod.
                </li>
                <li>
                  &bull;{" "}
                  <strong className="text-foreground">Observability before
                  optimization.</strong> Structured logs and measured p95s come
                  first; you only tune what the data says is slow.
                </li>
                <li>
                  &bull;{" "}
                  <strong className="text-foreground">Reversible over
                  heroic.</strong> Small strangler-fig steps beat a big-bang
                  rewrite, and a bad step costs a revert, not an outage.
                </li>
                <li>
                  &bull; <strong className="text-foreground">Right-size, don&apos;t
                  over-abstract.</strong> Complexity has to earn its place, and
                  Phase 10 exists to take it back where it didn&apos;t.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                What a frontend dev takes from it
              </h2>
              <p className="text-muted">
                None of this required a different brain than frontend work does.
                Typed boundaries, stable contracts, separation of concerns,
                caching by volatility, measuring before optimizing, and refusing
                to over-abstract are the exact instincts behind a well-built
                component tree &mdash; pointed at the other end of the wire. The
                overhaul is really one argument made twelve times: the frontend
                and the backend are a single system, and the same engineering
                judgment makes both of them good.
              </p>
              <p className="mt-3 text-muted">
                The most valuable habit wasn&apos;t any one pattern. It was
                keeping the old code serving traffic until the new code proved it
                matched &mdash; so the contract paul-explore depends on was never
                at risk, in any of the twelve phases.
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

              <Received>
                you&apos;re a frontend dev, why are you rewriting a backend
              </Received>

              <Sent pos="first">
                because i&apos;m the one who calls it all day. when a response
                shape is sloppy or an endpoint 500s, the pain lands in the
                frontend
              </Sent>
              <Sent pos="last">
                a response body is a contract, same as a component&apos;s props.
                the whole overhaul is just making that contract typed and
                predictable end to end
              </Sent>

              <Timestamp>2:12 PM</Timestamp>

              <Received>how do you rewrite something that&apos;s in prod</Received>

              <Sent pos="first">
                strangler fig. you don&apos;t swap, you grow the new thing
                alongside the old. old JS kept serving live traffic while the new
                TS was built next to it, nothing got pointed at until it matched
                byte for byte
              </Sent>
              <Sent pos="last">
                that&apos;s why it was 12 incremental phases, not one big rewrite.
                every phase leaves the app shippable, and a bad step is one revert
                from safe
              </Sent>

              <Timestamp>2:15 PM</Timestamp>

              <Received>three different data access patterns though? isn&apos;t that a mess</Received>

              <Sent pos="first">
                partly showcase, i&apos;ll be honest. but it holds up because
                every module hides its tool behind a repository. the service layer
                has no idea if it&apos;s raw SQL or Drizzle underneath
              </Sent>
              <Sent pos="last">
                same as a hook not caring if data came from fetch or react query.
                the boundary caps the cost. and phase 10 puts that whole decision
                back on trial in writing anyway
              </Sent>

              <Timestamp>2:18 PM</Timestamp>

              <Received>where did the plan change</Received>

              <Sent pos="first">
                two big ones. the plan wanted every response wrapped in {"{ data }"}
                {" "}but paul-explore expects raw bodies, so wrapping would break
                the contract day one. shelved the prettier design, froze v1,
                versioned v2
              </Sent>
              <Sent pos="last">
                and the &quot;delete all the legacy JS&quot; step was too
                aggressive. F1/fantasy still lean on python-queue plumbing that
                was never ported. broke them, restored the files. that&apos;s the
                strangler fig earning its keep tho, cost a restore not an outage
              </Sent>

              <Timestamp>2:22 PM</Timestamp>

              <Received>what&apos;s the actual takeaway for a frontend dev</Received>

              <Sent pos="first">
                none of it needed a different brain. typed boundaries, stable
                contracts, separation of concerns, caching by how fast data
                changes, measure before you optimize
              </Sent>
              <Sent pos="last">
                those are the same instincts behind a good component tree, just
                pointed at the other end of the wire. frontend and backend are one
                system and the same judgment makes both good
              </Sent>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
