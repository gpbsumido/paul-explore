"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  UpdateTimeline,
  Update,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";
import { ChatThread, Timestamp, Sent, Received } from "@/lib/threads";

export default function FeatureFlagsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Feature Flags"
      title="Feature Flags"
      intro={
        <>
          A feature-flag management console — per-environment targeting rules,
          sticky percentage rollouts, a kill switch, and an audit log. You
          describe a user at the top and every flag card shows, live, what that
          user gets and why. The whole thing is built around one pure function:
          a deterministic engine that, given the same flag, environment, and
          user, always returns the same decision — and can explain why.
        </>
      }
      chat={
        <ChatThread>
          <Timestamp>Today 4:00 PM</Timestamp>

          <Received pos="first">what&apos;s the feature flags thing</Received>
          <Received pos="last">like LaunchDarkly?</Received>

          <Sent pos="first">
            same shape, yeah. a console where you flip flags on and off per
            environment, target specific users with rules, and roll a feature
            out to a percentage of traffic. plus an audit log and a playground
            to test evaluations
          </Sent>
          <Sent pos="last">
            but the point isn&apos;t the UI. the interesting part is the
            evaluation engine underneath it
          </Sent>

          <Received>why the engine and not the UI</Received>

          <Sent pos="first">
            because everything hard about flags lives in the engine. the UI is
            just buttons. the engine has to answer &quot;does THIS user get the
            feature&quot; the same way every single time — on the server, on the
            client, on a teammate&apos;s laptop, in a test
          </Sent>
          <Sent pos="last">
            so I wrote it as one pure function first.{" "}
            <code>evaluateFlag(flag, environment, context)</code>. no network,
            no clock, no global state. same inputs, same output, always. the
            console is a client of that function, not the other way around
          </Sent>

          <Timestamp>4:07 PM</Timestamp>

          <Received>how do percentage rollouts stay consistent</Received>

          <Sent pos="first">
            you hash the user into a bucket. I take{" "}
            <code>{"`${flagKey}:${userKey}`"}</code>, run it through FNV-1a to
            get a 32-bit number, then normalize it into [0, 100). a user at 34.2
            is always at 34.2 for that flag
          </Sent>
          <Sent pos="middle">
            so a 25% rollout means &quot;everyone whose bucket is under
            25.&quot; when you bump it to 40%, the people already in stay in —
            you only add the 25–40 band. nobody flickers in and out between
            refreshes. that&apos;s the sticky, monotonic property you actually
            want in a rollout
          </Sent>
          <Sent pos="last">
            and keying on flagKey + userKey means a user in the 25% of flag A
            isn&apos;t correlated with the 25% of flag B. each flag shuffles
            independently
          </Sent>

          <Received>does plain FNV-1a spread evenly though</Received>

          <Sent pos="first">
            no — that was the gotcha. FNV-1a on sequential keys (user-1, user-2,
            user-3) leaves them clustered. so a rollout keyed on incrementing
            ids would hand the feature to a lopsided slice instead of a
            random-looking 25%
          </Sent>
          <Sent pos="last">
            fix is a murmur3-style avalanche step after the hash — a few
            shift/xor/multiply rounds that scatter the bits so one-character
            input differences land all over the range. cheap, and the
            distribution comes out flat
          </Sent>

          <Timestamp>4:15 PM</Timestamp>

          <Received>what&apos;s the order of precedence</Received>

          <Sent pos="first">
            kill switch first. if the flag is disabled in that environment, it
            serves the off variation and stops — no rules, no rollout.
            that&apos;s the &quot;turn it off right now&quot; path and it has to
            win over everything
          </Sent>
          <Sent pos="middle">
            then targeting rules, first match wins. each rule is a set of
            clauses AND-ed together — &quot;plan equals enterprise&quot; and
            &quot;region in [us, ca].&quot; walk them top to bottom, serve the
            first that matches
          </Sent>
          <Sent pos="last">
            then the fallthrough. one variation → everyone gets it. weighted →
            bucket the user and pick the slice. every path returns a{" "}
            <code>reason</code> so nothing is a black box
          </Sent>

          <Received>the reason is what powers the playground?</Received>

          <Sent pos="first">
            right. you type in a user key and attributes, pick an environment,
            and it evaluates every flag live and tells you not just the value
            but WHY — &quot;matched targeting rule: paid plans to fast
            queue,&quot; or &quot;percentage rollout — landed in bucket
            34.2&quot;
          </Sent>
          <Sent pos="last">
            that&apos;s the thing I&apos;d actually want on a real team.
            &quot;why did this user get the old checkout&quot; is the question
            you&apos;re always debugging, and here the engine just tells you
          </Sent>

          <Timestamp>4:22 PM</Timestamp>

          <Received>and the audit log</Received>

          <Sent pos="first">
            every mutation — toggling the kill switch, changing a rollout weight
            — writes an audit entry with what changed and a human-readable
            summary. flags are the kind of thing where &quot;who turned this on
            and when&quot; matters, so it&apos;s not an afterthought
          </Sent>
          <Sent pos="last">
            and now the store is getting real. the four /api/flags routes are
            thin proxies that prefer a live backend (portfolio_api) and fall
            back to the in-memory seed when it&apos;s down — so the console
            keeps working either way. exactly the swap I&apos;d claimed was
            cheap, and it didn&apos;t touch the engine or the components
          </Sent>

          <Received>what would you add next</Received>

          <Sent pos="first">
            a full rule editor in the UI — right now you can toggle and set
            rollout weights, but targeting rules are seeded. and prerequisites,
            where one flag depends on another being on
          </Sent>
          <Sent pos="last">
            but I&apos;d keep every bit of that logic in the pure engine. the
            second flag decisions leak into components or network calls, you
            lose the property that makes the whole thing trustworthy
          </Sent>
        </ChatThread>
      }
    >
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-08-10-test-user",
            date: "Aug 10, 2026",
            title: "Rebuilt around the test user, and the honesty strip",
          },
        ]}
      />

      <section>
        <h2 className="mb-3 text-lg font-bold">Engine first</h2>
        <p className="text-muted">
          The core of a flag system is one question asked millions of times:{" "}
          <em>does this user get this feature right now?</em> Everything else —
          the console, the API, the audit log — is presentation around that
          answer. So the answer came first, as a single pure function:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-4 text-[13px] leading-relaxed">
          <code className="font-mono text-foreground">
            evaluateFlag(flag, environment, context) =&gt; {"{"} value, reason{" "}
            {"}"}
          </code>
        </pre>
        <p className="mt-3 text-muted">
          Nothing in the engine touches the network, the clock, or global state.
          The same{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            (flag, environment, context)
          </code>{" "}
          always produces the same result. That is what lets the same decision
          hold on the server, on the client, and in a test — and it is what
          makes a percentage rollout <em>sticky</em> for a given user instead of
          reshuffling on every refresh.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Deterministic bucketing</h2>
        <p className="text-muted">
          Percentage rollouts hash the user into a stable bucket in [0, 100).
          The seed is{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            {"`${flagKey}:${userKey}`"}
          </code>
          , run through FNV-1a and normalized. A 25% rollout serves everyone
          whose bucket is under 25; raising it to 40% only adds the 25–40 band,
          so users already exposed stay exposed. The rollout grows{" "}
          <em>monotonically</em> — no one flickers out as it widens.
        </p>
        <p className="mt-3 text-muted">
          Keying on both the flag key and the user key decorrelates flags: being
          in the 25% of one flag tells you nothing about your bucket in another.
        </p>
        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The avalanche gotcha
        </h3>
        <p className="text-muted">
          FNV-1a alone leaves sequential keys (
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            user-1
          </code>
          ,{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            user-2
          </code>
          , …) clustered, which would hand a rollout to a lopsided slice instead
          of an even one. A murmur3-style{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            avalanche
          </code>{" "}
          finalizer — a handful of shift/xor/multiply rounds — scatters the bits
          so single-character input differences spread across the whole range.
          The distribution comes out flat, and the cost is a few integer ops per
          evaluation.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Order of precedence</h2>
        <p className="text-muted">
          Every evaluation walks the same ladder, and the first rung that
          applies wins:
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
          <li>
            <span className="font-semibold text-foreground">Kill switch.</span>{" "}
            If the flag is disabled in that environment it serves the off
            variation and stops — reason{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
              OFF
            </code>
            . The emergency &quot;off now&quot; path has to beat everything
            else.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              Targeting rules.
            </span>{" "}
            First match wins. Each rule ANDs its clauses together (
            <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
              in
            </code>
            ,{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
              equals
            </code>
            ,{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
              contains
            </code>
            ,{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
              startsWith
            </code>
            , …). Reason{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
              RULE_MATCH
            </code>{" "}
            carries the matched rule index.
          </li>
          <li>
            <span className="font-semibold text-foreground">Fallthrough.</span>{" "}
            One variation resolves directly (
            <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
              FALLTHROUGH
            </code>
            ); a weighted fallthrough buckets the context (
            <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
              FALLTHROUGH_ROLLOUT
            </code>
            , carrying the bucket).
          </li>
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Explainable by construction</h2>
        <p className="text-muted">
          Every path returns a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            reason
          </code>{" "}
          alongside the value, and a pure display helper turns it into plain
          English — &quot;Matched targeting rule: routes paid plans to the fast
          support queue,&quot; or &quot;Percentage rollout — landed in bucket
          34.2.&quot; That is what powers the evaluation playground: type a user
          key and attributes, pick an environment, and see every flag resolve
          live <em>and why</em>. &quot;Why did this user get the old
          checkout?&quot; is the question you actually debug, and the engine
          answers it directly instead of leaving you to reconstruct it.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The console around it</h2>
        <p className="text-muted">
          The UI is a thin client of the engine: an environment switcher, a card
          per flag with a status pill (Off, Targeted, Partial, Fully on) derived
          from pure helpers, a kill switch, a rollout slider, and an audit log.
          Status labels and exposure percentages are computed by testable pure
          functions kept out of the components, so the derived numbers can be
          asserted without rendering anything.
        </p>
        <p className="mt-3 text-muted">
          Every mutation — toggling the kill switch, changing a rollout weight —
          records an audit entry with a human-readable summary. For flags,
          &quot;who changed this and when&quot; is first-class, not an
          afterthought.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">What I&apos;d add next</h2>
        <h3 className="mt-1 mb-2 text-[15px] font-semibold text-foreground">
          A full rule editor
        </h3>
        <p className="text-muted">
          The console can toggle flags and set rollout weights; targeting rules
          are currently seeded rather than editable in the UI. A clause builder
          that writes back through the same PATCH API would close the loop
          without the engine changing at all.
        </p>
        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Prerequisites
        </h3>
        <p className="text-muted">
          Flags that depend on other flags — &quot;only evaluate the new
          checkout if the redesigned cart is on&quot; — are a natural extension
          of the precedence ladder, evaluated recursively inside the same pure
          function.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Making the store real</h2>
        <p className="text-muted">
          The store started in-memory, reseeding on every server restart — fine
          for a demo, and the claim in the write-up was that swapping it for a
          persistent one would not touch the engine or the components. That
          claim is now being cashed in. The four{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            /api/flags
          </code>{" "}
          routes became thin proxies over a small BFF layer that prefers a live
          backend (the same portfolio_api that backs the referral links) and
          falls back to the in-memory seed when the service is unreachable — so
          the console reads and writes shared, persistent data once the backend
          is deployed, and still works, looking identical, when it is not. The
          engine and the components did not change, which is exactly the
          property the original design was betting on.
        </p>
        <p className="mt-3 text-muted">
          The BFF is careful about what it hides. Reads fall back to the seed on
          any failure, because a readable console beats an error page. Writes
          only fall back on a genuine connection failure — a real{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            401
          </code>{" "}
          or{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            404
          </code>{" "}
          from the API is propagated, not masked, so a signed-out visitor gets
          an honest &quot;sign in to change flags&quot; instead of a silent
          local edit that never persists. And every payload crossing the
          boundary is validated against the same Zod schemas the console uses,
          so a drifting API surfaces as a clear error instead of quietly bad UI.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Telling the truth in the UI</h2>
        <p className="text-muted">
          Once the store was real, the console had to stop pretending it was a
          toy. The old &quot;demo data&quot; line became an honest status strip:
          a <em>Backed by a live API</em> badge, a plain sentence that the flags
          live in{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            portfolio_api
          </code>{" "}
          and are evaluated by a deterministic engine, and a live{" "}
          <em>resets in ~2h 14m</em> countdown so a visitor knows any change
          they make is temporary. The countdown is a pure function over the
          current time and the fixed six-hour UTC cadence — the exact schedule
          the reset cron runs on — so it is unit-tested without a clock.
        </p>
        <p className="mt-3 text-muted">
          The sign-in gate is scoped to what actually matters. The demo flags
          change nothing real, so they are open to everyone — anyone can flip a
          kill switch or drag a rollout and watch the engine re-decide. Only the
          one real flag, the one that gates a live page, needs a sign-in to
          change. The server enforces exactly that: a write to the real flag
          with no session gets an honest 401, while a demo write never even
          checks. On the real flag&apos;s card, signed-out visitors see the
          controls locked with a &quot;Sign in to change flags&quot; link rather
          than hitting a silent failure; viewing, the verdict strips, and the
          playground all stay fully usable.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Gating a real feature</h2>
        <p className="text-muted">
          A console that only toggles hypothetical flags is still a toy. The
          last step was to put a real, visible page behind one: the{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            /tcg/pocket
          </code>{" "}
          Pokémon TCG Pocket experience is now gated by a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            pocket-tcg
          </code>{" "}
          flag, evaluated for the actual visitor.
        </p>
        <p className="mt-3 text-muted">
          For a rollout to be <em>sticky</em> it needs a stable per-visitor key,
          so middleware sets a first-party{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            visitor_id
          </code>{" "}
          cookie once — anonymous, a year long, forwarded on the same request it
          is minted on so the first render already sees it. A server component
          reads that key, runs the same pure engine against the persisted flag,
          and renders the on or off branch directly. Because the decision
          happens on the server, there is no flash of the wrong state — the
          visitor never sees the page appear and then vanish.
        </p>
        <p className="mt-3 text-muted">
          It fails open: if the flag exists nowhere, the feature stays on, so a
          config gap can never hide something that otherwise works. Seeded fully
          on, nothing is hidden today — but flip the kill switch or dial the
          rollout down in the console and real visitors lose access, each stuck
          to their own bucket. That is the whole point: the console now
          demonstrably changes what a real person sees.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The verdict that lied</h2>
        <p className="text-muted">
          A bug caught this the honest way. Drag a rollout to 100% on and the
          card&apos;s verdict would still read{" "}
          <em>OFF — bucket 90, disabled</em>. The slider said one thing, the
          verdict said another, and both were drawn from the same screen.
        </p>
        <p className="mt-3 text-muted">
          The cause was a <em>read-your-writes</em> race. The playground was
          POSTing to an evaluate endpoint that read the flag config from the
          server store — but a rollout drag is applied <em>optimistically</em>{" "}
          on the client, so the slider jumps to 100% instantly while the write
          is still in flight. The re-evaluation raced that write and read the
          old config, so it bucketed the user against 25% on and returned OFF.
          The verdict was not wrong about the config it saw; it was just looking
          at a config the user had already moved past.
        </p>
        <p className="mt-3 text-muted">
          The fix was to stop reading from a place that could lag. The console
          now evaluates every card in the browser, through the same pure{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            evaluateAllFlags
          </code>{" "}
          engine, against the exact flags it is rendering — the way a real flag
          SDK evaluates locally after fetching configs. There is no round-trip
          to race and no async gap to flash through: the verdict is a pure
          function of what you are looking at, so it can never disagree with the
          switch above it. Writes still go to the API; only the{" "}
          <em>decision</em> came home to the engine.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The bright line</h2>
        <p className="mt-3 text-muted">
          Throughout, one rule held: no flag <em>decision</em> lives in a
          component or a network round-trip. The moment resolution logic leaks
          out of the pure engine, you lose determinism — and determinism is the
          whole reason to trust a rollout at all.
        </p>
      </section>
      <Update
        id="update-2026-08-10-test-user"
        date="August 10, 2026"
        title="Rebuilt around the test user, and the honesty strip"
      >
        <p>
          The console started as a list of flags with their config. That reads
          like the data model rather than the question anyone actually has,
          which is always <em>what does this specific person see?</em> It was
          reworked around a live test-user bar: describe a user, and every flag
          card shows what they get and why, updating as you change them.
        </p>
        <p>
          Structuring it that way turned explainability from a feature into a
          property. The engine already returned a reason with each decision, so
          showing the reason beside the value cost nothing &mdash; but only once
          the interface was organised around the evaluation rather than around
          the flag.
        </p>
        <p>
          <strong>
            The transparency strip is the part I would defend hardest.
          </strong>{" "}
          Most of these flags are demo data with a deterministic engine behind
          them; one is real and changing it needs a sign-in. A console that
          looked identical either way would be quietly dishonest, so it says
          which is which on the page rather than in a footnote.
        </p>
      </Update>
      <WhatsNext
        nowShipped={[
          "A deterministic evaluation engine as the core, with FNV-1a bucketing so a percentage rollout is sticky per user rather than re-rolled per request.",
          "The console organised around a test user rather than a flag list, because what a specific person sees is the only question anyone brings to it.",
          "Every decision shown with its reason, which the engine already returned and the old layout had nowhere to put.",
          "A transparency strip naming which flags are demo and which is real, instead of letting them look identical.",
        ]}
        couldImprove={[
          "The audit log records what changed but not what it did — nothing links a rollout to any metric, so the console cannot answer whether a flag helped.",
          "Targeting rules are edited as structured fields, which is precise and slow.",
          "Nothing prevents flag rot. Flags accumulate and nothing surfaces the ones sitting at 100% for months that should be deleted.",
        ]}
        upcoming={[
          "Surface stale flags — anything fully rolled out and untouched for a long time is a cleanup candidate, and the audit log can already answer that query.",
        ]}
      />
    </ThoughtLayout>
  );
}
