"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

/** Inline code chip — same styling the other thoughts pages repeat inline. */
function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
      {children}
    </code>
  );
}

export default function DeploymentContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "Deployment" }]}
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
              Deployment
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              How I think about shipping a site to production: what
              &ldquo;deployment&rdquo; actually is once you break it apart, when
              the decision should be made (earlier than most people make it),
              the platform trade-offs that actually bite, what the industry
              reaches for by default, and the concrete setup behind this
              portfolio and its Angular sibling.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">
                Deployment is five jobs, not one
              </h2>
              <p className="text-muted">
                &ldquo;Deploy it&rdquo; sounds atomic, but it&apos;s five
                separate responsibilities stacked together: <strong>build</strong>{" "}
                (turn source into an artifact), <strong>host</strong> (put that
                artifact somewhere that runs), <strong>serve</strong> (answer
                HTTP — static files, SSR, or serverless functions),{" "}
                <strong>route</strong> (DNS + TLS pointing a domain at the host),
                and <strong>observe</strong> (know when it breaks). Most
                deployment pain comes from treating these as one thing. A senior
                developer names them separately, because the right platform is
                the one whose defaults match the shape of those five jobs for
                your specific app.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Start from the app&apos;s runtime shape
              </h2>
              <p className="text-muted">
                The first question isn&apos;t &ldquo;Vercel or AWS?&rdquo; —
                it&apos;s &ldquo;what does this app <em>need at request
                time</em>?&rdquo; That answer picks the platform, not the other
                way around.
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
                <li>
                  <strong>Fully static</strong> (SSG / SPA): the build emits
                  HTML/JS/CSS and nothing runs per request. A CDN is enough —
                  cheapest, fastest, hardest to break.
                </li>
                <li>
                  <strong>Server-rendered</strong> (Next.js App Router, Angular
                  SSR): HTML is generated per request, so you need a Node
                  runtime or serverless function on the hot path — not just a
                  bucket.
                </li>
                <li>
                  <strong>Stateful backend</strong> (long-lived connections,
                  background jobs, a database): now you want a real server or a
                  managed container platform, because serverless&apos;
                  statelessness and cold starts start working against you.
                </li>
              </ul>
              <p className="mt-3 text-muted">
                This portfolio is Next.js with per-request rendering (<C>
                export const dynamic = &quot;force-dynamic&quot;
                </C>{" "}
                on the home route so a logged-in hub is never cached and served
                to a guest). That single fact — SSR on the hot path — is why it
                belongs on a platform with first-class serverless SSR rather than
                a static bucket.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                When to decide: before the first line, not after
              </h2>
              <p className="text-muted">
                Deployment is an architecture decision wearing an ops costume.
                Deciding late forces expensive retrofits — a feature that reads
                the filesystem at request time is free on a VM and impossible on
                edge functions; auth that assumes a warm process fights cold
                starts; a WebSocket feature is trivial on a container and a
                second system on serverless. The cheap move is to know the
                runtime target before committing to patterns that only work on a
                different one. The corollary: <strong>deploy on day one</strong>.
                A hello-world in production from the first commit means every
                subsequent change ships through a path you already trust, and
                &ldquo;works on my machine&rdquo; never gets to accumulate.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                The platform spectrum, and the trade-offs that actually bite
              </h2>
              <p className="text-muted">
                Roughly three tiers, trading control for convenience:
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
                <li>
                  <strong>Frontend PaaS</strong> (Vercel, Netlify, Cloudflare
                  Pages): zero-config for their framework, preview URLs per PR,
                  CDN and TLS handled. You trade money-at-scale and some
                  lock-in (their SSR/edge primitives aren&apos;t portable) for
                  velocity.
                </li>
                <li>
                  <strong>App PaaS / managed containers</strong> (Railway,
                  Render, Fly.io, ECS/Cloud Run): you bring a Dockerfile or a
                  buildpack, they run it. The sweet spot for stateful backends —
                  long-running processes, a Postgres next door — without owning
                  a control plane.
                </li>
                <li>
                  <strong>IaaS / self-managed</strong> (raw EC2, Kubernetes):
                  total control, total responsibility. Justified at real scale or
                  hard compliance needs; premature almost everywhere else.
                </li>
              </ul>
              <p className="mt-3 text-muted">
                The trade-offs that actually cost you later, in rough order of
                how often they bite: <strong>cost at scale</strong> (PaaS
                bandwidth/function pricing is convenient until it isn&apos;t),{" "}
                <strong>cold starts</strong> (serverless latency on the first hit
                — usually fine, occasionally a dealbreaker),{" "}
                <strong>vendor lock-in</strong> (edge/SSR primitives that
                don&apos;t port), and <strong>statelessness</strong> (no local
                disk, no in-memory cache you can trust across invocations). None
                of these are reasons to avoid a PaaS — they&apos;re reasons to
                know which one you&apos;re signing up for.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What the industry reaches for</h2>
              <p className="text-muted">
                Defaults in 2026, by app shape: React/Next and other JS
                frameworks lean on <strong>Vercel / Netlify / Cloudflare</strong>{" "}
                because the framework and the host are co-designed. Backends and
                full-stack apps that want a database nearby lean on{" "}
                <strong>Railway / Render / Fly.io</strong> for
                push-to-deploy-a-container simplicity, or{" "}
                <strong>AWS/GCP serverless</strong> (Lambda, Cloud Run) when they
                already live in a cloud. Larger orgs standardize on{" "}
                <strong>containers on Kubernetes</strong> for uniformity across
                many services. Underneath almost all of it, the same two ideas
                are near-universal now: <strong>Git-driven deploys</strong> (push
                a branch, get a deploy) and <strong>immutable preview
                environments</strong> per pull request. Those two conventions
                matter more than the specific vendor.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">CI is the gate, not the deployer</h2>
              <p className="text-muted">
                I keep a clean split: <strong>CI proves the change is safe</strong>{" "}
                (lint, typecheck, unit + e2e — this repo runs{" "}
                <C>620+</C> unit and e2e cases on every push and PR), and{" "}
                <strong>the platform does the deploy</strong>. The two connect at
                one point: a failing check blocks the production deploy. That
                boundary is what makes shipping boring — the interesting work
                happens in review and CI, and promotion to production is a
                non-event. Preview deploys per PR make review concrete: you click
                the branch&apos;s URL and see the change running before it merges.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Keep the boring parts boring: rollback and observability
              </h2>
              <p className="text-muted">
                Two things separate a deploy you trust from one you cross your
                fingers over. <strong>Rollback has to be one click</strong> —
                immutable deploys mean the previous good version is still sitting
                there to promote; if recovery means &ldquo;rebuild and
                redeploy,&rdquo; you don&apos;t really have rollback. And you have
                to <strong>find out before your users tell you</strong>: this app
                collects real-user Core Web Vitals via <C>sendBeacon</C>,
                aggregated as P75, so regressions show up as data instead of
                complaints. Shipping is easy; knowing you shipped something bad,
                and undoing it fast, is the part that&apos;s worth engineering.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">The concrete setup here</h2>
              <p className="text-muted">
                This portfolio is Next.js on <strong>Vercel</strong>, region{" "}
                <C>iad1</C>, fronted by <strong>Cloudflare</strong> for DNS and
                CDN, at <C>paulsumido.com</C>. GitHub Actions runs the full suite
                on every push and PR and gates the deploy; Vercel builds from{" "}
                Git and keeps every deployment for instant rollback. Its Angular
                sibling reuses the exact same spine with different primitives —
                Angular 21 SSR, Vercel&apos;s <C>angular</C> framework preset
                wrapping the Express handler as a serverless function, the CNAME
                living in the same Cloudflare zone — shipping to{" "}
                <C>angular.paulsumido.com</C>. Same five jobs, same Git-driven
                gate, different runtime shape. That&apos;s the whole point:
                pick the platform from the app&apos;s shape, then make the
                pipeline identical everywhere.
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
                how should I think about deploying this
              </Received>
              <Received pos="last">vercel? aws? no idea where to start</Received>

              <Sent pos="first">
                start earlier than that. &ldquo;deploy&rdquo; is five jobs, not
                one — build, host, serve, route, observe. platform pain is almost
                always someone treating them as a single thing
              </Sent>
              <Sent pos="last">
                and the real first question isn&apos;t the vendor. it&apos;s what
                the app needs at request time
              </Sent>

              <Timestamp>2:04 PM</Timestamp>

              <Received>meaning?</Received>

              <Sent pos="first">
                fully static → a CDN is enough, nothing runs per request.
                cheapest and hardest to break
              </Sent>
              <Sent pos="middle">
                server-rendered like this app → you need a node runtime or a
                serverless function on the hot path. a bucket won&apos;t do it
              </Sent>
              <Sent pos="last">
                stateful backend with sockets or a db → now you want a real
                container platform, because serverless statelessness starts
                fighting you
              </Sent>

              <Received>
                so the runtime shape picks the platform, not the other way around
              </Received>

              <Sent>
                exactly. this portfolio is SSR with force-dynamic on the home
                route so a logged-in hub never gets cached for a guest. that one
                fact is why it belongs somewhere with first-class serverless SSR
              </Sent>

              <Timestamp>2:11 PM</Timestamp>

              <Received>when do I actually make the call</Received>

              <Sent pos="first">
                before the first line. deployment is an architecture decision in
                an ops costume — decide late and you retrofit. filesystem reads,
                sockets, warm-process auth all quietly assume a runtime
              </Sent>
              <Sent pos="last">
                and deploy a hello-world on day one. every change after that
                ships through a path you already trust. &ldquo;works on my
                machine&rdquo; never gets to pile up
              </Sent>

              <Timestamp>2:18 PM</Timestamp>

              <Received>what does everyone actually use</Received>

              <Sent pos="first">
                JS frameworks → vercel/netlify/cloudflare, because framework and
                host are co-designed. backends with a db → railway/render/fly, or
                lambda/cloud run if you already live in a cloud. big orgs →
                containers on k8s for uniformity
              </Sent>
              <Sent pos="last">
                but the two things that matter more than the vendor: git-driven
                deploys and a preview URL per PR. those conventions are basically
                universal now
              </Sent>

              <Received>and the catch with the easy PaaS route</Received>

              <Sent pos="first">
                cost at scale, cold starts, lock-in on their edge/SSR primitives,
                and no local state you can trust between invocations
              </Sent>
              <Sent pos="last">
                none of those are reasons to avoid it. they&apos;re reasons to
                know which platform you&apos;re signing up for
              </Sent>

              <Timestamp>2:26 PM</Timestamp>

              <Received>how&apos;s this one wired</Received>

              <Sent pos="first">
                next on vercel (iad1), cloudflare in front for DNS + CDN, at
                paulsumido.com. github actions runs the full suite and blocks the
                deploy if it&apos;s red. vercel keeps every deploy so rollback is
                one click
              </Sent>
              <Sent pos="middle">
                CI proves the change is safe, the platform does the deploy. they
                only touch at one point: a failing check gates production. that
                split is what makes shipping boring
              </Sent>
              <Sent pos="last">
                the angular sibling reuses the exact same spine — angular 21 SSR,
                vercel&apos;s angular preset wrapping the express handler as a
                function, same cloudflare zone — at angular.paulsumido.com. same
                five jobs, different runtime shape
              </Sent>

              <Received>and if a bad deploy slips through</Received>

              <Sent pos="first">
                promote the last good deploy — one click, because deploys are
                immutable. if recovery means rebuild-and-redeploy you don&apos;t
                really have rollback
              </Sent>
              <Sent pos="last">
                and you find out before users do. this app beacons real-user core
                web vitals as P75, so regressions show up as data, not complaints
              </Sent>

              <div className={styles.typingDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
