"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function ImprovementsContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "API Hardening" }]}
        right={<ViewToggle view={view} setView={setView} />}
        showLogout={false}
        maxWidth="max-w-3xl"
      />

      {view === "summary" ? (
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <header className="mb-10">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted/50">
              Dev notes
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              API Hardening
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Three P0 gaps closed: runtime validation on every API route with
              Zod, rate limiting on open endpoints via the proxy middleware, and
              body size limits on every route that reads a request body.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">The problem</h2>
              <p className="text-muted">
                Every API route was calling{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  request.json()
                </code>{" "}
                and trusting the shape blindly. On the response side, every
                client-side fetch helper used{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  data as SomeType
                </code>{" "}
                casts — TypeScript only enforces those at compile time, not at
                runtime. If the backend schema ever changed or a malformed
                payload arrived, the app would either silently mishandle the
                data or crash in a confusing way.
              </p>
              <p className="mt-3 text-muted">
                Beyond the type safety issue, none of the routes enforced a body
                size limit before calling{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  request.json()
                </code>
                . A client could send an arbitrarily large payload and the
                server would buffer the entire thing before even looking at it —
                a straightforward memory exhaustion vector.
              </p>
              <p className="mt-3 text-muted">
                Separately, two routes had no authentication at all:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/vitals
                </code>{" "}
                (the Web Vitals ingestion endpoint) and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/graphql
                </code>{" "}
                (the PokeAPI proxy). Both intentionally open — but with no
                throttle, either could be spammed to inflate metrics or hammer
                an upstream API.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Zod schemas</h2>
              <p className="text-muted">
                Zod was already in the project but unused for validation.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  src/lib/schemas.ts
                </code>{" "}
                now holds schemas for every shape that crosses a trust boundary
                — request bodies, response wrappers, and the GraphQL response
                envelope. Twenty-plus schemas covering events, calendars,
                members, cards, countdowns, and PokeAPI results.
              </p>
              <p className="mt-3 text-muted">
                On the API route side every POST and PUT handler now calls{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  schema.safeParse(raw)
                </code>{" "}
                before forwarding to the backend. A bad shape gets a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  400
                </code>{" "}
                with Zod&apos;s issue list in the body — specific enough to
                actually debug. On the client side all the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  as Type
                </code>{" "}
                casts in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  src/lib/calendar.ts
                </code>
                ,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  src/hooks/useCalendars.ts
                </code>
                , and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  src/lib/graphql.ts
                </code>{" "}
                are replaced with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  schema.parse(await res.json())
                </code>
                . A backend schema change now throws a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ZodError
                </code>{" "}
                rather than silently passing bad data through.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Why <code className="text-base font-mono">safeParse</code> on
                routes and <code className="text-base font-mono">parse</code> on
                clients
              </h2>
              <p className="text-muted">
                On API routes, throwing is not the right response — you want
                control over the HTTP status code and body. So{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  safeParse
                </code>{" "}
                returns a result object and the handler decides what to return.
                On the client, the response comes from our own backend, so a
                parse failure is genuinely unexpected — letting it throw and
                surface as an error in React Query is the right behavior.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Rate limiting</h2>
              <p className="text-muted">
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  src/lib/rateLimit.ts
                </code>{" "}
                is a simple fixed-window counter — a module-level{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  Map
                </code>{" "}
                keyed by{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  route:ip
                </code>
                , reset after the window expires. A prune pass runs at most once
                per minute to keep the Map from growing unbounded.
              </p>
              <p className="mt-3 text-muted">
                The limits live in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  src/proxy.ts
                </code>{" "}
                and are checked before any auth or session work — so a rejection
                never pays Auth0 latency. Three tiers:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/vitals POST
                </code>{" "}
                capped at 20 per minute (open ingestion, tightest limit),{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/graphql POST
                </code>{" "}
                at 60 per minute (public proxy), and all other API routes at 300
                per minute as a backstop. Blocked requests get a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  429
                </code>{" "}
                with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  Retry-After
                </code>{" "}
                and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  X-RateLimit-*
                </code>{" "}
                headers.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Body size limits</h2>
              <p className="text-muted">
                The fix is a unified helper:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  src/lib/parseBody.ts
                </code>{" "}
                wraps the read, size check, and Zod parse into one call. It runs
                two size checks: first the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  Content-Length
                </code>{" "}
                header (fast, before the body is buffered at all), then a byte
                count on the parsed JSON string (catches chunked transfers that
                skip the header). A failure at either point returns a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  413
                </code>{" "}
                immediately.
              </p>
              <p className="mt-3 text-muted">
                All ten calendar routes now use{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  parseBody()
                </code>{" "}
                instead of the old inline three-line pattern, so they get size
                enforcement and Zod validation in one call. The two open routes
                use inline guards with tighter limits:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/vitals
                </code>{" "}
                at 4 KB (it only needs five fields) and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/graphql
                </code>{" "}
                at 64 KB (GraphQL queries can be verbose). Authenticated routes
                default to 64 KB.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Why in-memory is fine here
              </h2>
              <p className="text-muted">
                On Vercel each edge function instance has its own memory, so the
                counter isn&apos;t globally coordinated across instances. For a
                personal portfolio with low traffic, a per-instance limit is
                still effective. A determined attacker with many IPs would
                bypass any client-side rate limit anyway — the real defense
                there is the backend. This is about stopping accidental loops
                and casual spam, which in-memory handles perfectly.
              </p>
              <p className="mt-3 text-muted">
                Swapping the store for Vercel KV or Upstash Redis would give
                cross-instance coordination if traffic ever justifies it. The
                interface is simple enough that the swap is a one-file change.
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
              <Timestamp>Today 2:00 PM</Timestamp>

              <Received pos="first">
                what were the two p0s from the review
              </Received>
              <Received pos="last">the ones you just fixed</Received>

              <Sent pos="first">
                no runtime validation on any API route, and no rate limiting on
                the open endpoints
              </Sent>
              <Sent pos="last">
                every POST and PUT handler was calling{" "}
                <code>request.json()</code> and forwarding whatever came in. and
                the client-side helpers all used <code>data as SomeType</code>{" "}
                casts — typescript only enforces those at compile time
              </Sent>

              <Timestamp>2:02 PM</Timestamp>

              <Received>what does that actually break</Received>

              <Sent pos="first">
                if the backend schema changes, or someone sends a malformed
                payload, the app either mishandles it silently or crashes in a
                confusing way with no useful error
              </Sent>
              <Sent pos="last">
                and on the client side, if a fetch returns the wrong shape, it
                propagates through the whole react tree as if it were valid data
              </Sent>

              <Timestamp>2:04 PM</Timestamp>

              <Received>how did you fix it</Received>

              <Sent pos="first">
                zod was already in the project. i added{" "}
                <code>src/lib/schemas.ts</code> with schemas for every shape
                that crosses a trust boundary — request bodies and response
                wrappers for events, calendars, members, cards, countdowns, and
                the graphql response envelope
              </Sent>
              <Sent pos="middle">
                on API routes every POST and PUT now calls{" "}
                <code>schema.safeParse(raw)</code> before forwarding. bad shape
                gets a 400 with zod&apos;s issue list in the body, which is
                actually useful to debug
              </Sent>
              <Sent pos="last">
                on the client, all the <code>as Type</code> casts in{" "}
                <code>calendar.ts</code>, <code>useCalendars.ts</code>, and{" "}
                <code>graphql.ts</code> are replaced with{" "}
                <code>schema.parse(await res.json())</code>. a backend shape
                change throws a ZodError instead of silently passing bad data
                through
              </Sent>

              <Timestamp>2:08 PM</Timestamp>

              <Received pos="first">
                why safeParse on the routes but parse on the clients
              </Received>
              <Received pos="last">why not both the same</Received>

              <Sent pos="first">
                on API routes, throwing would give you a 500 with no useful
                body. you want control over the status code and message, so
                safeParse lets you return a proper 400
              </Sent>
              <Sent pos="last">
                on the client, the response comes from our own backend, so a
                parse failure is genuinely unexpected. letting it throw and
                surface as an error in react query is the right behavior there
              </Sent>

              <Timestamp>2:11 PM</Timestamp>

              <Received>and the rate limiting</Received>

              <Sent pos="first">
                two routes had no auth at all — <code>/api/vitals</code> for web
                vitals ingestion and <code>/api/graphql</code> as a pokeapi
                proxy. both intentionally open, but nothing was stopping a loop
                from flooding them
              </Sent>
              <Sent pos="middle">
                i added a simple fixed-window counter in{" "}
                <code>src/lib/rateLimit.ts</code> — a module-level Map keyed by
                route and IP, reset after the window. three tiers: vitals POST
                at 20 per minute, graphql POST at 60, everything else at 300 as
                a backstop
              </Sent>
              <Sent pos="last">
                lives in <code>proxy.ts</code> and runs before any auth or
                session work, so a 429 never pays auth0 latency
              </Sent>

              <Timestamp>2:15 PM</Timestamp>

              <Received pos="first">
                in-memory feels like it doesn&apos;t actually work
              </Received>
              <Received pos="last">vercel runs multiple instances</Received>

              <Sent pos="first">
                it&apos;s per-instance, not globally coordinated. that&apos;s a
                real limitation
              </Sent>
              <Sent pos="middle">
                but for a personal portfolio with low traffic, a per-instance
                limit still stops accidental loops and casual spam, which is the
                actual threat here. a determined attacker with many IPs bypasses
                any rate limit anyway — the real defense is the backend
              </Sent>
              <Sent pos="last">
                swapping the Map for Vercel KV or Upstash Redis gives you
                cross-instance coordination if traffic ever justifies it. the
                interface is simple enough that it&apos;s a one-file change
              </Sent>

              <Timestamp>2:19 PM</Timestamp>

              <Received>was there a third one</Received>

              <Sent pos="first">
                yeah — no body size limits anywhere. every route that called{" "}
                <code>request.json()</code> would buffer the entire request
                before looking at it. send a large enough payload and you can
                exhaust memory
              </Sent>
              <Sent pos="last">
                it&apos;s the kind of thing that&apos;s easy to overlook because
                it doesn&apos;t break anything in normal use, but it&apos;s a
                straightforward denial-of-service vector on open endpoints
              </Sent>

              <Timestamp>2:21 PM</Timestamp>

              <Received>how did you fix it</Received>

              <Sent pos="first">
                added <code>src/lib/parseBody.ts</code> — a unified helper that
                does the size check, body read, and zod parse in one call. two
                layers: check the <code>Content-Length</code> header before
                buffering anything, then check the actual byte count after
                parsing to catch chunked transfers that skip the header
              </Sent>
              <Sent pos="middle">
                all ten calendar routes now use it instead of the old inline
                three-liner. the two open routes get inline guards with tighter
                limits — vitals at 4 KB, graphql at 64 KB. authenticated routes
                default to 64 KB
              </Sent>
              <Sent pos="last">
                bad size returns a 413 before the body is ever forwarded to the
                backend
              </Sent>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
