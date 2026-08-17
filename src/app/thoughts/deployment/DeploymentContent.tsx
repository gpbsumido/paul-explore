"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  Update,
  UpdateTimeline,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";
import type { ReactNode } from "react";
import styles from "@/app/thoughts/_shared/chat.module.css";
import { ChatThread, Timestamp, Sent, Received } from "@/lib/threads";

const code =
  "rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground";

/** Inline code chip — same styling the other thoughts pages repeat inline. */
function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
      {children}
    </code>
  );
}

export default function DeploymentContent() {
  return (
    <ThoughtLayout
      breadcrumb="Deployment"
      title="Deployment"
      intro={
        <>
          How I think about shipping a site to production: what
          &ldquo;deployment&rdquo; actually is once you break it apart, when the
          decision should be made (earlier than most people make it), the
          platform trade-offs that actually bite, what the industry reaches for
          by default, and the concrete setup behind this portfolio and its
          Angular sibling.
        </>
      }
      chat={
        <ChatThread>
          <Timestamp>Today 2:00 PM</Timestamp>

          <Received pos="first">
            how should I think about deploying this
          </Received>
          <Received pos="last">vercel? aws? no idea where to start</Received>

          <Sent pos="first">
            start earlier than that. &ldquo;deploy&rdquo; is five jobs, not one
            — build, host, serve, route, observe. platform pain is almost always
            someone treating them as a single thing
          </Sent>
          <Sent pos="last">
            and the real first question isn&apos;t the vendor. it&apos;s what
            the app needs at request time
          </Sent>

          <Timestamp>2:04 PM</Timestamp>

          <Received>meaning?</Received>

          <Sent pos="first">
            fully static → a CDN is enough, nothing runs per request. cheapest
            and hardest to break
          </Sent>
          <Sent pos="middle">
            server-rendered like this app → you need a node runtime or a
            serverless function on the hot path. a bucket won&apos;t do it
          </Sent>
          <Sent pos="last">
            stateful backend with sockets or a db → now you want a real
            container platform, because serverless statelessness starts fighting
            you
          </Sent>

          <Received>
            so the runtime shape picks the platform, not the other way around
          </Received>

          <Sent>
            exactly. this portfolio is SSR with force-dynamic on the home route
            so a logged-in hub never gets cached for a guest. that one fact is
            why it belongs somewhere with first-class serverless SSR
          </Sent>

          <Timestamp>2:11 PM</Timestamp>

          <Received>when do I actually make the call</Received>

          <Sent pos="first">
            before the first line. deployment is an architecture decision in an
            ops costume — decide late and you retrofit. filesystem reads,
            sockets, warm-process auth all quietly assume a runtime
          </Sent>
          <Sent pos="last">
            and deploy a hello-world on day one. every change after that ships
            through a path you already trust. &ldquo;works on my machine&rdquo;
            never gets to pile up
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
            none of those are reasons to avoid it. they&apos;re reasons to know
            which platform you&apos;re signing up for
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
        </ChatThread>
      }
    >
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-08-16-ffprobe",
            date: "Aug 16, 2026",
            title: "The weight came off, and took a broken feature with it",
          },
          {
            id: "update-2026-08-15-deployed",
            date: "Aug 15, 2026",
            title: "What deploys, and what it costs to wake up",
          },
        ]}
      />

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Deployment is five jobs, not one
        </h2>
        <p className="text-muted">
          &ldquo;Deploy it&rdquo; sounds atomic, but it&apos;s five separate
          responsibilities stacked together: <strong>build</strong> (turn source
          into an artifact), <strong>host</strong> (put that artifact somewhere
          that runs), <strong>serve</strong> (answer HTTP — static files, SSR,
          or serverless functions), <strong>route</strong> (DNS + TLS pointing a
          domain at the host), and <strong>observe</strong> (know when it
          breaks). Most deployment pain comes from treating these as one thing.
          A senior developer names them separately, because the right platform
          is the one whose defaults match the shape of those five jobs for your
          specific app.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Start from the app&apos;s runtime shape
        </h2>
        <p className="text-muted">
          The first question isn&apos;t &ldquo;Vercel or AWS?&rdquo; — it&apos;s
          &ldquo;what does this app <em>need at request time</em>?&rdquo; That
          answer picks the platform, not the other way around.
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
          <li>
            <strong>Fully static</strong> (SSG / SPA): the build emits
            HTML/JS/CSS and nothing runs per request. A CDN is enough —
            cheapest, fastest, hardest to break.
          </li>
          <li>
            <strong>Server-rendered</strong> (Next.js App Router, Angular SSR):
            HTML is generated per request, so you need a Node runtime or
            serverless function on the hot path — not just a bucket.
          </li>
          <li>
            <strong>Stateful backend</strong> (long-lived connections,
            background jobs, a database): now you want a real server or a
            managed container platform, because serverless&apos; statelessness
            and cold starts start working against you.
          </li>
        </ul>
        <p className="mt-3 text-muted">
          This portfolio is Next.js with per-request rendering (
          <C>export const dynamic = &quot;force-dynamic&quot;</C> on the home
          route so a logged-in hub is never cached and served to a guest). That
          single fact — SSR on the hot path — is why it belongs on a platform
          with first-class serverless SSR rather than a static bucket.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          When to decide: before the first line, not after
        </h2>
        <p className="text-muted">
          Deployment is an architecture decision wearing an ops costume.
          Deciding late forces expensive retrofits — a feature that reads the
          filesystem at request time is free on a VM and impossible on edge
          functions; auth that assumes a warm process fights cold starts; a
          WebSocket feature is trivial on a container and a second system on
          serverless. The cheap move is to know the runtime target before
          committing to patterns that only work on a different one. The
          corollary: <strong>deploy on day one</strong>. A hello-world in
          production from the first commit means every subsequent change ships
          through a path you already trust, and &ldquo;works on my
          machine&rdquo; never gets to accumulate.
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
            <strong>Frontend PaaS</strong> (Vercel, Netlify, Cloudflare Pages):
            zero-config for their framework, preview URLs per PR, CDN and TLS
            handled. You trade money-at-scale and some lock-in (their SSR/edge
            primitives aren&apos;t portable) for velocity.
          </li>
          <li>
            <strong>App PaaS / managed containers</strong> (Railway, Render,
            Fly.io, ECS/Cloud Run): you bring a Dockerfile or a buildpack, they
            run it. The sweet spot for stateful backends — long-running
            processes, a Postgres next door — without owning a control plane.
          </li>
          <li>
            <strong>IaaS / self-managed</strong> (raw EC2, Kubernetes): total
            control, total responsibility. Justified at real scale or hard
            compliance needs; premature almost everywhere else.
          </li>
        </ul>
        <p className="mt-3 text-muted">
          The trade-offs that actually cost you later, in rough order of how
          often they bite: <strong>cost at scale</strong> (PaaS
          bandwidth/function pricing is convenient until it isn&apos;t),{" "}
          <strong>cold starts</strong> (serverless latency on the first hit —
          usually fine, occasionally a dealbreaker),{" "}
          <strong>vendor lock-in</strong> (edge/SSR primitives that don&apos;t
          port), and <strong>statelessness</strong> (no local disk, no in-memory
          cache you can trust across invocations). None of these are reasons to
          avoid a PaaS — they&apos;re reasons to know which one you&apos;re
          signing up for.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          What the industry reaches for
        </h2>
        <p className="text-muted">
          Defaults in 2026, by app shape: React/Next and other JS frameworks
          lean on <strong>Vercel / Netlify / Cloudflare</strong> because the
          framework and the host are co-designed. Backends and full-stack apps
          that want a database nearby lean on{" "}
          <strong>Railway / Render / Fly.io</strong> for
          push-to-deploy-a-container simplicity, or{" "}
          <strong>AWS/GCP serverless</strong> (Lambda, Cloud Run) when they
          already live in a cloud. Larger orgs standardize on{" "}
          <strong>containers on Kubernetes</strong> for uniformity across many
          services. Underneath almost all of it, the same two ideas are
          near-universal now: <strong>Git-driven deploys</strong> (push a
          branch, get a deploy) and{" "}
          <strong>immutable preview environments</strong> per pull request.
          Those two conventions matter more than the specific vendor.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          CI is the gate, not the deployer
        </h2>
        <p className="text-muted">
          I keep a clean split: <strong>CI proves the change is safe</strong>{" "}
          (lint, typecheck, unit + e2e — this repo runs <C>620+</C> unit and e2e
          cases on every push and PR), and{" "}
          <strong>the platform does the deploy</strong>. The two connect at one
          point: a failing check blocks the production deploy. That boundary is
          what makes shipping boring — the interesting work happens in review
          and CI, and promotion to production is a non-event. Preview deploys
          per PR make review concrete: you click the branch&apos;s URL and see
          the change running before it merges.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Keep the boring parts boring: rollback and observability
        </h2>
        <p className="text-muted">
          Two things separate a deploy you trust from one you cross your fingers
          over. <strong>Rollback has to be one click</strong> — immutable
          deploys mean the previous good version is still sitting there to
          promote; if recovery means &ldquo;rebuild and redeploy,&rdquo; you
          don&apos;t really have rollback. And you have to{" "}
          <strong>find out before your users tell you</strong>: this app
          collects real-user Core Web Vitals via <C>sendBeacon</C>, aggregated
          as P75, so regressions show up as data instead of complaints. Shipping
          is easy; knowing you shipped something bad, and undoing it fast, is
          the part that&apos;s worth engineering.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The concrete setup here</h2>
        <p className="mb-3 text-muted">
          This section is the front end. The backend half — Railway, a Postgres
          that used to be reachable from the open internet, and what it took to
          move it onto a private network — is its own write-up at{" "}
          <a href="/thoughts/database-networking" className="underline">
            Taking the database off the public internet
          </a>
          .
        </p>
        <p className="text-muted">
          This portfolio is Next.js on <strong>Vercel</strong>, region{" "}
          <C>iad1</C>, fronted by <strong>Cloudflare</strong> for DNS and CDN,
          at <C>paulsumido.com</C>. GitHub Actions runs the full suite on every
          push and PR and gates the deploy; Vercel builds from Git and keeps
          every deployment for instant rollback. Its Angular sibling reuses the
          exact same spine with different primitives — Angular 21 SSR,
          Vercel&apos;s <C>angular</C> framework preset wrapping the Express
          handler as a serverless function, the CNAME living in the same
          Cloudflare zone — shipping to <C>angular.paulsumido.com</C>. Same five
          jobs, same Git-driven gate, different runtime shape. That&apos;s the
          whole point: pick the platform from the app&apos;s shape, then make
          the pipeline identical everywhere.
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">
          Confirming a deploy actually landed
        </h2>
        <p className="text-muted">
          I spent an evening this week shipping security fixes across the API
          and this site, and the same mistake caught me three separate times. It
          is always the same shape: check something next to the claim, see
          green, treat the claim as proven. The thing next to the claim is
          always faster to check. That is exactly why it gets checked.
        </p>
        <p className="mt-3 text-muted">
          The expensive one: I encrypted the stored Google OAuth tokens in the
          production database, having confirmed the pull request was{" "}
          <em>merged</em>. Merged is not deployed. The running build was five
          releases old and had no decryption code, so for a while the database
          held credentials the application could not read. Nothing user-facing
          broke, because that integration had been dormant for months — which is
          luck, not process.
        </p>
        <p className="mt-3 text-muted">
          Then, checking whether the fix had gone out, I read{" "}
          <C>/api/health</C> and saw <C>version: 2.3.2</C> against a{" "}
          <C>package.json</C> on 4.6.x. I assumed a failed deploy and went
          looking for a fault that did not exist. The version was a string
          literal someone had typed in and never touched again. It had been
          wrong for five releases, and it is the first field anyone reads to
          answer &ldquo;did this ship&rdquo; — so it reported failure on every
          deploy that succeeded. A field that lies is worse than no field.
        </p>
        <p className="mt-3 text-muted">
          What actually answered the question was behaviour. That release
          removed two endpoints and added one, so three <C>curl</C>s settled it:
          the removed routes returning <C>404</C> and the new one returning{" "}
          <C>401</C> can only happen if the new code is running. No amount of
          reading dashboards proves that; one request does.
        </p>
        <p className="mt-3 text-muted">
          The rule I wrote down afterwards, because I clearly needed it in
          writing: <strong>confirm what is live before writing to it</strong>. A
          migration, a backfill, an encryption pass — any of them against an
          environment whose running version is unconfirmed is how a correct
          change becomes an outage. And more generally, before saying something
          works, name the signal you actually looked at and ask what it would
          miss. If the answer is &ldquo;the thing I am claiming&rdquo;, it is the
          wrong signal.
        </p>
        <p className="mt-3 text-muted">
          Two smaller versions of the same trap, from the same evening. A test
          summary reading <C>PASS FAIL(0)</C> while the process exited{" "}
          <C>1</C> — the exit code is the run, the summary is a tool&rsquo;s
          parse of the run, and when they disagree the exit code wins. And a
          change that resolved a file path relative to <C>__dirname</C>, which
          passed every test against the sources and would have broken in the
          build, because <C>src</C> and <C>dist</C> are not the same place. I
          only caught that one by building it and running the compiled output.
        </p>
      </section>

      <Update
        id="update-2026-08-15-deployed"
        date="August 15, 2026"
        title="What deploys, and what it costs to wake up"
      >
        <p>
          <strong>Every deployed tab was showing Vercel&rsquo;s logo.</strong>{" "}
          Locally it showed mine, which is exactly why it survived since the
          first commit. There are two icons and I had only ever looked at one:{" "}
          <code className={code}>icon.tsx</code> renders the mark and Next
          injects a link tag for it, while{" "}
          <code className={code}>favicon.ico</code> is served at{" "}
          <code className={code}>/favicon.ico</code> and browsers request that
          path on their own whatever the link tag says. That file was
          create-next-app&rsquo;s black triangle, committed at initialization
          and never opened again.
        </p>
        <p>
          It is one mark at two sizes now, generated from what the icon route
          actually renders rather than drawn a second time, so the two cannot
          drift. The test hashes the framework default and fails if it ever
          returns, because size alone would not have caught this &mdash; a
          wrong icon can be any size, and the whole failure was that nobody
          thought to open the file. I proved the fix the only way that counts
          here: built the production bundle, served it, and fetched{" "}
          <code className={code}>/favicon.ico</code> off the running server.
          Source-level green would have proved nothing, since the bug lived
          entirely in what the artifact serves.
        </p>
        <p>
          <strong>The other half of deployment is waking up.</strong> The API
          scales to zero, so a cold boot sits on a real user&rsquo;s critical
          path, and nothing measured it. The frontend just got a gzipped
          first-load budget, and the tempting move was to copy it across
          &mdash; but that service ships no browser bundle, so a bundle budget
          there would be a number that can go red without anything being
          wrong, which is worse than no check at all.
        </p>
        <p>
          What it got instead is a production dependency weight gate, stated
          plainly in its own comments as a <em>proxy</em> for cold start
          rather than cold start itself. Boot wall-clock was rejected as a
          gate on measurement, not taste: 268 to 294 milliseconds across seven
          runs on an idle laptop, which on a shared runner would flake, and a
          guard that flakes gets deleted. The measurement immediately paid for
          itself &mdash; production dependencies weigh 443MB across 331
          packages, and a single package shipping every platform&rsquo;s
          binaries is 335MB of that. Three quarters of the cold start is one
          dependency carrying builds this service will never run.
        </p>
        <p>
          Both of these are the same lesson wearing different clothes. What
          runs locally is not what deploys, and the only honest check is the
          one that asks the deployed artifact.
        </p>
      </Update>

      <Update
        id="update-2026-08-16-ffprobe"
        date="August 16, 2026"
        title="The weight came off, and took a broken feature with it"
      >
        <p>
          The entry above ends on a number: 335MB of the API&rsquo;s
          443MB production install was one package shipping every
          platform&rsquo;s binaries. Acting on it cut the install to{" "}
          <strong>170.5MB on CI, down 61.5 percent</strong>, by swapping{" "}
          <code className={code}>ffprobe-static</code>&rsquo;s six-platform
          tarball for an installer package that resolves a single platform
          build through optional dependencies. The committed budget came down
          with it, 500MB to 210MB, because a budget left at the old ceiling
          after a win that size has quietly stopped measuring anything.
        </p>
        <p>
          <strong>
            The interesting part is what the swap uncovered, which had nothing
            to do with size.
          </strong>{" "}
          The replacement chmods its binary in a postinstall, and pnpm 10
          refuses build scripts unless the package is named in{" "}
          <code className={code}>onlyBuiltDependencies</code>. Without that
          the binary lands unexecutable and spawns as permission denied.
          Chasing it revealed the same mechanism had already silently disabled{" "}
          <code className={code}>ffmpeg-static</code>, whose postinstall
          downloads the actual ffmpeg binary and had{" "}
          <em>never run</em> &mdash; not locally, not in the Docker image,
          which never installs ffmpeg either. Every video upload has been
          failing at the thumbnail step, in production, for as long as that
          pnpm version has been in use.
        </p>
        <p>
          Nothing caught it because no test had ever executed either binary.
          The new test drives the real video path against a committed
          fixture, and it failed with{" "}
          <code className={code}>spawn ffmpeg ENOENT</code> before the fix
          &mdash; which is to say the first honest test of that path
          reproduced the production bug on the first run. It is also verified
          from the compiled output rather than from source, and inside a real
          linux/amd64 container rather than on my Mac, because the whole
          failure was about which binary exists where.
        </p>
        <p>
          I went looking for bytes and found a broken feature. That is the
          argument for measuring things you think you already understand:
          the size metric was never the point, it was the excuse to look.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "A written record of the concrete setup rather than a general description of deployment, which is what makes it useful when something breaks at an awkward time.",
          "Preview deployments per pull request, so a change is looked at in a browser before it is merged rather than after.",
        ]}
        couldImprove={[
          "There is no documented rollback procedure, which is the thing you want written down precisely when you have least patience for reading.",
          "Environment variables are documented in an example file and nothing verifies a deploy actually has them — a missing key surfaces as a broken feature rather than a failed deploy.",
          "Nothing automated answers \"is the running build the one I just merged\". I confirm it by hand with a couple of curls against routes the release added or removed, which works and does not scale past remembering to do it.",
        ]}
        upcoming={[
          "A startup check for required environment variables, so a misconfigured deploy fails loudly instead of shipping a dark feature — the ask box needing two new keys is exactly this case.",
          "A deploy check worth trusting: /api/health now reports the real version from package.json rather than a literal that had been wrong for five releases, so the obvious question can finally be answered by the obvious endpoint.",
        ]}
      />
    </ThoughtLayout>
  );
}
