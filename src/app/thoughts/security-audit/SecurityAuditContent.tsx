"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { Update, WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import { ChatThread, Timestamp, Sent, Received } from "@/lib/threads";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

export default function SecurityAuditContent() {
  return (
    <ThoughtLayout
      breadcrumb="Auditing for Absences"
      title="The code was fine. The gaps were not."
      intro={
        <>
          I ran a security audit across both repos and expected to find bad code.
          I found almost none. What I found instead was a long list of things
          that were simply not there: a check on one route and not its sibling, a
          rate limit that looked configured and was not, a page confidently
          documenting behaviour nobody had run. Every single finding was an
          absence rather than a mistake, and once I noticed that, the research on
          AI-written code stopped reading like a warning and started reading like
          a description of my own diff.
        </>
      }
      chat={
        <ChatThread>
          <Timestamp>Audit day, 11:40 AM</Timestamp>

          <Received pos="first">how bad is it</Received>
          <Received pos="last">
            be honest, most of this was written fast with a model
          </Received>

          <Sent pos="first">
            almost nothing is wrong in the sense you mean. no injection, no
            secrets in the bundle, the crypto is fine
          </Sent>
          <Sent pos="last">
            it&apos;s all missing things. an endpoint with auth and no
            authorization. a validator that accepts {"//evil.example"}
          </Sent>

          <Timestamp>11:52 AM</Timestamp>

          <Received>which is worse?</Received>

          <Sent pos="first">
            harder to find, definitely. a review looks at what is on the screen.
            none of this was on the screen
          </Sent>
          <Sent pos="last">
            and the write-ups made it worse — four of them asserted protections
            that were not actually on
          </Sent>
        </ChatThread>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">What the research says</h2>
        <p className="text-muted">
          Veracode gave the same 80 coding tasks to more than 100 large language
          models. Across all of them, <strong>56% of the generated code passed
          basic security tests</strong> — and that number has not moved between
          report updates, despite a year of much better models.
        </p>
        <p className="mt-3 text-muted">
          The breakdown is the interesting part, because it is not uniform:
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-semibold">Vulnerability</th>
                <th className="py-2 font-semibold">Pass rate</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-b border-border">
                <td className="py-2 pr-4">Insecure crypto algorithms</td>
                <td className="py-2">~80–85%</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4">SQL injection</td>
                <td className="py-2">~80–85%</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4">Log injection</td>
                <td className="py-2">~12–13%</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Cross-site scripting</td>
                <td className="py-2">
                  <strong className="text-foreground">~15%</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-muted">
          Models are good at not writing the dangerous thing, and bad at writing
          the protective thing that was never asked for. SQL injection is avoided
          because the safe form — a parameterised query — is also the idiomatic
          form, so writing normal code produces safe code. XSS is different:
          avoiding it means adding an escape or a sanitiser that nothing in the
          prompt asked for, and nothing in the output looks wrong without.
        </p>
        <p className="mt-3 text-muted">
          Put plainly: <strong className="text-foreground">the failure mode is
          omission, not error.</strong> Which means reviewing the diff is close
          to useless, because the diff is where the code is, and this is about
          code that is not anywhere.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Seven shapes of absence, all from this codebase
        </h2>
        <p className="text-muted">
          These are real findings from the audit, all now fixed. I have grouped
          them by shape rather than severity, because the shape is the part that
          generalises.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          1. Authentication with no authorization behind it
        </h3>
        <p className="text-muted">
          <code className={code}>/tables</code> and{" "}
          <code className={code}>/table/:tableName</code> read{" "}
          <code className={code}>information_schema</code> and handed every table
          and column name to any caller with an account. There was a{" "}
          <code className={code}>checkJwt</code> on them, so they looked
          protected. Being signed in was never the question.
        </p>
        <p className="mt-3 text-muted">
          <code className={code}>DELETE /markers/:id</code> had the same shape
          from the other end: <code className={code}>locations</code> has no
          owner column and <code className={code}>POST /markers</code> is
          unauthenticated, so any signed-in user could delete anyone&apos;s
          marker. The route was removed rather than fixed — markers are
          create-and-read now.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">Why it slipped:</strong> a
          middleware in the route definition reads as a protection. It answers
          &ldquo;who are you&rdquo;, and I read it as answering &ldquo;may
          you&rdquo;.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          2. A rule applied to one route and not its sibling
        </h3>
        <p className="text-muted">
          Posts respected visibility. Replies did not, so a thread served content
          the post route itself refused. Public profiles returned a private
          account&apos;s bio, counts, and the owner&apos;s Auth0{" "}
          <code className={code}>sub</code>.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">Why it slipped:</strong> the check
          existed and was correct. It just was not applied everywhere it needed
          to be, and nothing enumerates the places it needs to be. Both are one
          shared visibility rule now, so there is no second copy to drift.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          3. Validation that looks right
        </h3>
        <p className="text-muted">
          A referral <code className={code}>targetPath</code> was validated with{" "}
          <code className={code}>startsWith(&apos;/&apos;)</code>. That accepts{" "}
          <code className={code}>{"//evil.example"}</code> — a protocol-relative URL
          — which is an open redirect on a link that looks like ours.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">Why it slipped:</strong> it is
          validation. There is a check, it is about the right field, it reads
          correctly at a glance. This is the one I find least comfortable,
          because nothing about the line invites a second look.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          4. A comparison that leaks
        </h3>
        <p className="text-muted">
          The playoffs admin secret was compared with{" "}
          <code className={code}>!==</code>, which short-circuits on the first
          differing byte and turns guessing it into a per-character search rather
          than a search of the whole space. One shared constant-time compare now,
          replacing two near-identical copies.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">Why it slipped:</strong> comparing
          two strings for equality is not a thing you look at twice, and the
          duplication meant there were two places to not look at.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          5. Absent treated as false
        </h3>
        <p className="text-muted">
          The feature-flag resolver fell to the loosest access rung when a flag
          arrived from upstream without a tier on it. Absent was read as
          &ldquo;no restriction&rdquo; rather than &ldquo;unknown&rdquo;, so a
          flag could become more permissive by omission.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">Why it slipped:</strong> the
          write-up listed it as a known rough edge rather than a bug, which is a
          very effective way to stop thinking about something.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          6. A limit that looks configured and is not
        </h3>
        <p className="text-muted">
          Two of these, both the same shape.{" "}
          <code className={code}>express-rate-limit</code> dropped the{" "}
          <code className={code}>max</code> alias in v8, so every limiter in the
          API silently fell back to the library default of five per minute rather
          than its configured ceiling. Separately, one shared store instance
          across all limiters meant hitting one endpoint spent another&apos;s
          budget.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">Why it slipped:</strong> the config
          object still had the option in it. A silently ignored option looks
          exactly like a respected one from the calling side, and nothing fails.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          7. Documentation asserting what was never checked
        </h3>
        <p className="text-muted">
          Four write-ups on this very site were wrong in the same direction —
          claiming a protection that was not on.{" "}
          <code className={code}>/thoughts/security</code> claimed{" "}
          <code className={code}>frame-ancestors &apos;none&apos;</code> while the
          policy shipped <code className={code}>&apos;self&apos;</code>.{" "}
          <code className={code}>/thoughts/login-redirect</code> described a
          timeout that armed <code className={code}>prompt=consent</code> so
          Auth0 would re-show the permission screen; it armed it, and it did
          nothing, so the page documented a timeout that silently signed you back
          in. <code className={code}>/thoughts/improvements</code> excused an
          in-memory rate limiter on the grounds that &ldquo;the real defense is
          the backend&rdquo; — and the backend&apos;s limiter was also in-memory,
          on a host that scales to zero, so every cold start wiped every counter.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">Why it slipped:</strong> this is
          the one that genuinely bothers me. Writing the explanation felt like
          verifying it. A confident sentence about a protection is evidence of
          nothing except that I once believed it, and it actively suppresses the
          next person&apos;s instinct to check — including mine.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">What actually catches this</h2>
        <p className="text-muted">
          Reviewing harder does not work, because there is nothing to review. The
          things that did work were all some version of{" "}
          <em>make the absence fail loudly</em>:
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">
            Test the refusal, not the success.
          </strong>{" "}
          Most of the tests added by the audit assert that a request is denied —
          a non-owner gets 403, a private post 404s to a stranger, an unset
          allowlist locks everyone out rather than letting everyone in. A test
          that only proves the happy path passes just as well when the guard is
          deleted.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">
            One implementation, not two correct copies.
          </strong>{" "}
          Two constant-time compares, two visibility checks, two rate-limit
          stores, two TLS configs, two connection pools. Every duplicate was
          somewhere a fix had landed on one copy. Consolidating is not tidiness,
          it removes the place where drift hides.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">
            Make the config prove itself.
          </strong>{" "}
          The rate-limit bug is unfindable by reading and trivial to catch with
          one test that fires six requests and expects the sixth to survive.
          Anything read from configuration should have one test that fails if the
          configuration is ignored.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-foreground">
            Treat absent as unknown, never as permitted.
          </strong>{" "}
          The flag resolver now refuses rather than relaxing. Unset allowlists
          mean nobody rather than everybody. When information is missing, the
          safe default is the restrictive one, and that has to be written down
          because the permissive default is usually the one that makes the demo
          work.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The one I could not have tested for
        </h2>
        <p className="text-muted">
          Since the audit, one more turned up, and it was not in the code at all.
          I asked an agent to work through some README tasks. To find my to-do
          list it read <code className={code}>DATABASE_URL</code> out of a local{" "}
          <code className={code}>.env</code> and queried the production database
          with it. Read-only, nothing damaged, and I only found out because I
          asked how it was reading the list.
        </p>
        <p className="mt-3 text-muted">
          It was not a jailbreak and it did not bypass authentication — it
          authenticated correctly, with a real credential I had left on disk.
          Going in through the database meant the Auth0 gate, the email allowlist
          and the owner re-check were simply not in the path. Postgres has never
          heard of an allowlist in Express.
        </p>
        <p className="mt-3 text-muted">
          The same shape as everything above: not a wrong thing done, a control
          that was not anywhere near where the action happened. The write-up on
          that lives at{" "}
          <a href="/thoughts/ai-security" className="underline">
            /thoughts/ai-security
          </a>
          , including the uncomfortable part — the rule I wrote in response is
          prompt-level, and a rule in a prompt is advice rather than a boundary.
        </p>
      </section>

      <Update
        id="update-2026-08-14-guards"
        date="August 14, 2026"
        title="The one-off pass became something that repeats — and one of the checks was lying"
      >
        <p>
          The gap this page admitted to was that the audit was done by hand
          once, so the next absence would wait for the next time I went
          looking. Closing it meant turning the findings into checks that run
          on every push. What I did not expect was that the checks already
          there were part of the problem.
        </p>
        <p>
          The operator write-up said the store detail page has{" "}
          <strong className="text-foreground">seven tabs</strong>. It has
          eight; Restock History was added and the prose was not touched. A
          test asserted <code className="font-mono text-foreground/70">
            /seven tabs/
          </code>{" "}
          against that sentence — so when the eighth tab landed, the test went
          on <em>guaranteeing</em> the wrong number. It was pinned to the
          sentence rather than to the thing the sentence is about.
        </p>
        <p>
          That is a different failure from the ones above. Every finding in the
          original audit was a control that was missing. This was a control
          that was present, green, and holding the mistake in place. Nobody
          reviews a passing test.
        </p>
        <p>
          The world exhibits had the same shape from the other side: a test
          checked that every exhibit maps to a real feature, which is the
          direction that <em>cannot</em> fail. Nothing checked that every
          feature has an exhibit, so Research Explorer shipped without one
          while five places claimed the city held an exhibit for every feature.
          The <code className="font-mono text-foreground/70">llms.txt</code>{" "}
          checks were identical — everything named exists, nothing about what
          was left out, which is the only way that file ever goes wrong.
        </p>
        <p>
          The counts that had drifted were the cheap part to fix. The site was
          quoting <strong className="text-foreground">640 tests</strong> in two
          places while a third rendered the generated count of{" "}
          <strong className="text-foreground">2,525</strong>, a click apart.
          The changelog had stopped twenty versions back while the README
          called it a running log. Both now derive or fail.
        </p>
        <p>
          The part worth keeping: I wrote a check for duplicate changelog
          headings that{" "}
          <strong className="text-foreground">could never fail</strong>.{" "}
          <code className="font-mono text-foreground/70">Set.add()</code>{" "}
          returns the Set, not a boolean, so my{" "}
          <code className="font-mono text-foreground/70">!seen.add(v)</code>{" "}
          filter matched nothing and the test passed against a file I had
          deliberately corrupted. I only caught it because I had started
          corrupting files on purpose after the seven-tabs business. Rewritten,
          it immediately found a duplicate my own grep had missed.
        </p>
        <p>
          So the rule I came away with is narrower than &ldquo;write more
          tests&rdquo;. Point the assertion at the data, not at the prose about
          the data. Check the direction that can actually fail. And watch the
          thing go red once before believing it — a guard nobody has seen fail
          is not yet a guard, and I now have two examples of my own to prove it.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "Seven classes of missing control closed across both repos, each with a test that fails without the fix rather than one that passes with it.",
          "Duplicated security logic consolidated — one constant-time compare, one visibility rule, one rate-limit store, one TLS config.",
          "Four write-ups on this site corrected where they asserted protections that were not on.",
          "The hand pass became repeating checks: counts derive from the arrays they describe, the changelog fails when the shipped version has no entry, and the exhibit and crawler files are checked for what they omit rather than only for what they name.",
          "The database moved onto Railway private networking, public access is off, and the password is rotated — the real fix for the credential story above rather than a rule asking nicely.",
          "History, comments and editing on the to-do list all shipped. Reverting writes a NEW revision rather than discarding later ones, so it reverts rather than resets.",
        ]}
        couldImprove={[
          "There is still no check that a new route carries an authorization decision at all — the thing that would have caught /tables on the day it was written.",
          "Two Postgres connection pools remain. #137 made them agree about TLS; merging them properly is still outstanding, and duplication is exactly where the audit kept finding things.",
          "The new guards each carry a hand-maintained exception list. That is deliberate — a named exclusion is a decision someone made, where a short count is just a number — but nothing makes me revisit an exclusion once it is written, and 'research has no exhibit yet' sat there as accepted debt until I went back for it.",
          "Nothing checks a guard's own direction. The seven-tabs test and the exhibits test were both green and both incapable of failing, and it took reading them to notice; a passing test still gets no review.",
        ]}
        upcoming={[
          "Splitting Auth0 into a dev tenant, so testing against auth stops meaning testing against the tenant real logins go through. There is also no staging API — develop and production point at the same backend — and the two are the same job.",
          "The CSP still ships 'unsafe-inline' on script-src. Nonces are the fix and the reason they are not done is recorded rather than hidden: reading headers() in the root layout opts every route out of static generation, and a build confirmed it.",
        ]}
      />
    </ThoughtLayout>
  );
}
