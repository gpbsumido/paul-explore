"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import { ChatThread, Timestamp, Sent, Received } from "@/lib/threads";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

export default function DatabaseNetworkingContent() {
  return (
    <ThoughtLayout
      breadcrumb="Database Networking"
      title="Taking the database off the public internet"
      intro={
        <>
          Front-end is what I do. The API behind this site is also mine, and so
          is its Postgres, and for a long time the honest description of my
          relationship with that database was that I had pointed the app at the
          connection string the dashboard handed me and moved on to the parts I
          understood better. This is what happened when I finally read it
          properly: a database reachable from anywhere, a TLS investigation
          worth abandoning halfway, migrations that nothing anywhere ran, and
          four minutes of downtime I caused myself at the last step.
        </>
      }
      chat={
        <ChatThread>
          <Timestamp>Morning</Timestamp>

          <Received pos="first">
            where is DATABASE_URL actually pointing
          </Received>

          <Sent pos="first">
            switchyard.proxy.rlwy.net. that&apos;s a public host — it resolves
            to a routable IP
          </Sent>
          <Sent pos="last">
            so the only thing between the open internet and production is the
            password
          </Sent>

          <Timestamp>Afternoon</Timestamp>

          <Received>can you just turn on certificate verification</Received>

          <Sent pos="first">
            tried. the cert says CN=localhost, signed by a private CA they
            don&apos;t publish
          </Sent>
          <Sent pos="last">
            and honestly that&apos;s the wrong fix. verifying a connection that
            shouldn&apos;t cross the internet is polishing the wrong thing
          </Sent>
        </ChatThread>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">What I found when I looked</h2>
        <p className="text-muted">
          <code className={code}>DATABASE_URL</code> pointed at{" "}
          <code className={code}>switchyard.proxy.rlwy.net</code>, which resolves
          to a routable address. Not a private network, not a VPC — a hostname
          on the public internet with Postgres behind it. The only control on
          that path was the password.
        </p>
        <p className="mt-3 text-muted">
          Nothing was wrong in the sense of misconfigured. That is the default a
          managed provider gives you, because it is the one that works from your
          laptop on day one, and it keeps working, which is exactly why you stop
          thinking about it. The bill for that convenience is that every
          application-level control I had built — the Auth0 gate, the email
          allowlist, the owner checks — sits in Express, and Postgres has never
          heard of any of them. Anyone holding that one string skips all of it.
        </p>
        <p className="mt-3 text-muted">
          I know that shape from the front end. It is the same reason you cannot
          trust a disabled button. The control has to live where the action
          happens, and mine did not.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The TLS rabbit hole, and why I stopped digging
        </h2>
        <p className="text-muted">
          The obvious first move was to verify the server certificate, so the
          connection at least proves it is talking to the right database. I
          spent a while on it and the answer was no.
        </p>
        <p className="mt-3 text-muted">
          Railway&apos;s proxy presents a certificate with{" "}
          <code className={code}>CN=localhost</code>, signed by a private CA
          named <code className={code}>root-ca</code>. So the system trust store
          rejects it as self-signed. Supplying their CA{" "}
          <em>and</em> keeping hostname checking on still fails, because{" "}
          <code className={code}>localhost</code> is not{" "}
          <code className={code}>switchyard.proxy.rlwy.net</code>. The only
          combination that connects is their CA with hostname verification
          turned off — and they do not publish that CA, so it has to be scraped
          out of the handshake.
        </p>
        <p className="mt-3 text-muted">
          I nearly did it anyway. Pinning a scraped certificate would have felt
          like progress. It would also have traded a real security control for a
          future outage, because the provider can rotate that certificate
          whenever they like and my pin would break the connection with no
          warning and no obvious cause.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">
            The decision I wrote down was: do not pin.
          </strong>{" "}
          Not because verification does not matter, but because I was about to
          spend real effort making a connection trustworthy that should not have
          been crossing the internet in the first place. The fix was one layer
          down from where I was looking.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Private networking, which makes the question moot
        </h2>
        <p className="text-muted">
          Services in one Railway project can talk over a private network — a
          WireGuard tunnel, with DNS names like{" "}
          <code className={code}>postgres.railway.internal</code>. Point the API
          at that instead of the proxy and the internet path stops existing.
          Verification is not solved, it is <em>irrelevant</em>, which is a much
          better place to be than a correctly verified public connection.
        </p>
        <p className="mt-3 text-muted">
          Two things about it are worth knowing before you try, because both
          would have bitten me:
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">
            It only exists at runtime.
          </strong>{" "}
          The private network is not available during the build phase. If
          migrations had been part of my build step, this switch would have
          broken every deploy. Mine run from the container entrypoint, which is
          on the right side of that line — by luck rather than judgement, since
          I had put them there for an unrelated reason a few hours earlier.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">
            Older environments are IPv6-only.
          </strong>{" "}
          Private DNS resolves to IPv6 addresses on environments created before
          October 2025. Node handled it without complaint, but it is the first
          thing to suspect if a connection refuses.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          On the way there: nothing ran the migrations
        </h2>
        <p className="text-muted">
          I went looking for where migrations run in production and the answer
          was nowhere. <code className={code}>railway.json</code> starts the
          process, the Dockerfile starts the process, and neither touches knex.
          The only <code className={code}>pnpm migrate</code> anywhere was in the
          <em> frontend</em> repo&apos;s CI, against a throwaway database it
          creates for end-to-end tests.
        </p>
        <p className="mt-3 text-muted">
          I had written down, in an earlier note on this site, a considered
          argument for keeping migrations manual: two deploys could race, a
          destructive migration could go out before I had read it, and a
          half-applied migration leaves a broken release. Keeping it manual, I
          said, cost one command and kept the ordering something I owned.
        </p>
        <p className="mt-3 text-muted">
          What changed my mind was watching the cost land. I added a migration,
          shipped it, and only noticed while writing the release notes that
          nothing would ever apply it. &ldquo;One command&rdquo; is only one
          command if you remember it, and a step that lives in your head has no
          failure mode — it just has you.
        </p>
        <p className="mt-3 text-muted">
          Taking my own three objections seriously rather than pretending I had
          been wrong: the racing one was answerable, since knex takes a lock and
          the real risk was cron containers sharing the image, which now skip
          the step. The half-applied one turned out never to have been a risk at
          all — Postgres has transactional DDL and knex wraps the batch, so a
          migration that throws leaves nothing behind. I had listed it as a cost
          of automating without ever checking whether it was a property of the
          tool I was already using.
        </p>
        <p className="mt-3 text-muted">
          The third objection stands. Automating <em>when</em> migrations run
          does nothing about <em>what is in them</em>. So that one is gated
          rather than argued away: a test reads the{" "}
          <code className={code}>up()</code> of every migration, looks for drops,
          renames, truncations and column tightening, and fails unless the file
          writes down why.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`// DESTRUCTIVE: drops todos.detail, unused since 4.9.0 and
// confirmed empty in production before this shipped.`}
        </pre>
        <p className="mt-3 text-muted">
          An acknowledgement rather than a ban. Dropping a column is sometimes
          exactly right; doing it without having thought about the code
          currently running against that schema is not. Writing the reason costs
          nothing when you have thought about it and is impossible to produce
          when you have not.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Waiting, but not forever</h2>
        <p className="text-muted">
          One more thing had to go in before the switch. The private network is
          not up the instant a container starts, so a migration firing
          immediately can fail on DNS or a refused connection — and because the
          entrypoint runs under <code className={code}>set -e</code>, that is a
          failed deploy which reads as <em>the migration broke</em> when the
          network simply was not ready. The worst kind of error: it sends you to
          look at the wrong thing.
        </p>
        <p className="mt-3 text-muted">
          So the entrypoint polls before it migrates, bounded at about thirty
          seconds. Bounded is the whole design. Retrying forever turns &ldquo;the
          database is gone&rdquo; into a container that never starts and never
          says why, which is harder to diagnose than a clean failure.
        </p>
        <p className="mt-3 text-muted">
          It did not fire on the day. The database answered on the first
          attempt, so the retry never ran, and that is the right outcome rather
          than a wasted change — the failure it guards is intermittent, and you
          find out you needed it on the deploy where you did not have it.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The switch, and what the logs told me
        </h2>
        <p className="text-muted">
          Repointing was one variable: a reference to the Postgres service&apos;s
          private URL rather than a pasted proxy string, so it tracks if the
          service is ever recreated. The deploy came up, migrations reported
          nothing pending, the app served.
        </p>
        <p className="mt-3 text-muted">
          The logs then told me something I had not gone looking for. They
          reported <code className={code}>env: &quot;development&quot;</code> —
          in production. <code className={code}>NODE_ENV</code> was simply never
          set, and the config defaults to development when it is missing.
        </p>
        <p className="mt-3 text-muted">
          That mattered more than it looks, because of one branch in the TLS
          helper:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`if (opts.nodeEnv === 'production') return { rejectUnauthorized: false };
return false;   // ← TLS off entirely`}
        </pre>
        <p className="mt-3 text-muted">
          Everything I had written about this connection — including the
          decision above — described it as{" "}
          <em>TLS without verification</em>. It was not. With{" "}
          <code className={code}>NODE_ENV</code> unset, it was{" "}
          <strong className="text-foreground">no TLS at all</strong>, over the
          public internet, for as long as that had been true. It also explains
          why the boot warning I had added about unverified connections never
          appeared in any log: it was gated on the same condition.
        </p>
        <p className="mt-3 text-muted">
          The consolation is that the change I was already making closed it,
          because traffic on the private network is encrypted by the tunnel. I
          fixed a worse problem than the one I set out to fix, and I only found
          out about it because I read the deploy logs line by line instead of
          checking that the deploy was green.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Then I broke production for four minutes
        </h2>
        <p className="text-muted">
          Last step was rotating the password, which by then was overdue for
          reasons written up{" "}
          <a href="/thoughts/ai-security" className="underline">
            elsewhere
          </a>
          . There is a Regenerate button. I pressed it, and the API went to{" "}
          <code className={code}>dbConnected: false</code>.
        </p>
        <p className="mt-3 text-muted">
          The mechanism is worth knowing, because it is a trap with a delay
          built into it. Setting the password variable only applies at first
          initialisation; on an existing database the variable and the actual
          role drift apart. And Postgres does not drop established connections
          when a role&apos;s password changes — so a running app carries on
          working perfectly on its existing pool. Everything looks fine. The
          failure arrives at the next restart, which might be days later, for
          reasons that look unconnected to anything you did.
        </p>
        <p className="mt-3 text-muted">
          Mine failed immediately only because the platform restarted the
          container as part of the change. That was luck, and it was the good
          kind: a four-minute outage I could see and fix is enormously better
          than a landmine sitting in the deploy pipeline for a fortnight.
        </p>
        <p className="mt-3 text-muted">
          Recovery was a redeploy so the app picked up the regenerated
          credentials. The lesson I actually take from it is not about
          Postgres — it is that I checked the wrong thing first. My instinct was
          to look at the dashboard panel that was showing an error. The useful
          signal was the health endpoint, because that is the one that tells you
          whether the thing users touch is working.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">One pool, afterwards</h2>
        <p className="text-muted">
          With the connection path settled I could finally do a cleanup I had
          been deferring. The app built{" "}
          <strong className="text-foreground">two</strong> connection pools: one
          in the CommonJS layer that predates the TypeScript rewrite, one in the
          TypeScript config. Two pools means two sets of connections to the same
          database and, the part that actually bit, two places to configure TLS,
          which had already drifted apart once.
        </p>
        <p className="mt-3 text-muted">
          I had deliberately not done it earlier, and the reason is the part
          worth keeping: the test suite mocks the pool, so nothing in it could
          have caught a break, and the blast radius ran through the Google
          Calendar sync path. A change I could not verify, whose failure would be
          silent and in production, is not a change to make because the code
          looks untidy.
        </p>
        <p className="mt-3 text-muted">
          What made it safe was not courage, it was having a way to check. Both
          entry points now resolve to the same object, which I proved by
          comparing identity rather than by reading the imports; the built app
          boots against a real database; and the route that goes through the old
          CommonJS layer answers 401 rather than 500, which is precisely the
          failure I was worried about.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          What I would tell another front-end dev
        </h2>
        <p className="text-muted">
          <strong className="text-foreground">
            The default connection string is a product decision, not a
            recommendation.
          </strong>{" "}
          It is public because that is what works from your laptop on day one.
          It keeps working, which is why nobody revisits it.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">
            Removing a path beats securing one.
          </strong>{" "}
          I spent hours on certificate verification for a connection that simply
          should not have existed. The fix was one layer down from where I was
          looking, and it made the hard problem irrelevant instead of solving
          it.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">
            Read the deploy logs, not the deploy status.
          </strong>{" "}
          Green meant the container started. The line that mattered was four
          words in the middle saying the environment was development, and it had
          been true for months.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">
            Do the scary step where you can see it fail.
          </strong>{" "}
          Credential rotation has a delayed failure mode by design. Force the
          restart yourself, immediately, while you still remember what you
          changed.
        </p>
        <p className="mt-3 text-muted">
          None of this was difficult. It was unfamiliar, which is a different
          thing, and the parts that took longest were the ones where I was
          solving the problem I recognised rather than the one in front of me.
        </p>
      </section>

      <WhatsNext
        nowShipped={[
          "The database is on Railway's private network with public access removed, so there is no internet path to it at all — the credential is no longer the only control.",
          "Deploys migrate themselves, waiting up to thirty seconds for the database and failing loudly rather than hanging.",
          "Destructive migrations fail the build unless the file writes down why, since automating when migrations run says nothing about what is in them.",
          "One connection pool instead of two, verified by object identity and a real boot rather than by reading the imports.",
          "The password rotated, and NODE_ENV finally set to production.",
        ]}
        couldImprove={[
          "There is still no staging API. The develop frontend talks to the production backend, which is fine for reads and for a single-owner to-do list, and would not be fine with real users.",
          "The TLS helper still negotiates an unverified connection in production. Harmless inside the tunnel, and worth revisiting only if anything ever needs to reach this database from outside it.",
          "Nothing tests the entrypoint's wait against a database that is genuinely slow to appear — the retry loop is covered, the real timing is not.",
          "The database still reports a collation version mismatch from an operating system upgrade underneath it, which I have not looked at properly yet.",
        ]}
        upcoming={[
          "Reindexing and refreshing the collation version, deliberately and on its own, rather than bundled with anything else.",
          "A second API environment, if this ever stops being a single-owner project — the absence of one is currently a documented risk rather than a problem.",
        ]}
      />
    </ThoughtLayout>
  );
}
