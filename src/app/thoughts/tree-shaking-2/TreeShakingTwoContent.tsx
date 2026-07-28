"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

/** Inline monospace token, matches the code styling used across thoughts pages. */
function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
      {children}
    </code>
  );
}

/** A bullet row with the little dot the summary view uses everywhere. */
function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
      <span>{children}</span>
    </li>
  );
}

/** A titled section of the summary view. */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function TreeShakingTwoContent() {
  return (
    <ThoughtLayout
      breadcrumb="Tree Shaking II"
      title="Tree Shaking, Round 2"
      intro={
        <>
          A second pass at dead weight for 2.3.0, this time starting from a
          codebase that was already clean. The interesting question wasn&apos;t
          what to delete — the deletion checks were green — it was where the
          remaining bytes actually hide, and whether the page speed people feel
          was suffering because of them.
        </>
      }
      chat={
        <div className="flex justify-center">
          <div
            className={styles.phone}
            style={{ minHeight: "calc(100dvh - 56px)" }}
          >
            <div className={styles.chat}>
              <Timestamp>Today 11:40 AM</Timestamp>

              <Received pos="first">
                you did another tree shaking pass right
              </Received>
              <Received pos="last">
                thought the last one already cleaned everything
              </Received>

              <Sent pos="first">
                it did, mostly. the two dead-code checks were both green going
                in — depcheck clean, ts-prune clean. so this one couldn&apos;t be
                about deleting files
              </Sent>
              <Sent pos="last">
                when there&apos;s nothing dead to remove, the only lever left is
                the code that&apos;s alive but ships more than it needs. that&apos;s
                a bundler-config problem, not a delete-the-file problem
              </Sent>

              <Received>what does that even mean</Received>

              <Sent pos="first">
                barrel files. a package exports everything from one{" "}
                <code>index.js</code>. you import one component from it, but the
                bundler can&apos;t always prove the rest is unused, so it keeps
                more than you asked for
              </Sent>
              <Sent pos="last">
                Next already rewrites those imports for a built-in list —
                recharts, date-fns, lucide. but not our own design-system
                package, not the big 3D and charting barrels. those it leaves
                alone
              </Sent>

              <Received>so you told it to shake those too</Received>

              <Sent pos="last">
                one config line. <code>optimizePackageImports</code> with the
                four barrels Next doesn&apos;t cover. rebuilt, measured. total
                client JS went 13,468 to 13,320 KB. real, but small
              </Sent>

              <Received pos="first">
                148K. that&apos;s it?
              </Received>
              <Received pos="last">
                feels like barely worth it
              </Received>

              <Sent pos="first">
                that&apos;s the honest number, and it&apos;s small on purpose.
                the app already lazy-loads framer-motion and code-splits every
                Three.js canvas behind <code>ssr: false</code>. the easy wins
                were already taken. this is the tail
              </Sent>
              <Sent pos="last">
                small and free and permanent beats big and risky. it&apos;s a
                config flag, not a refactor — nothing to maintain, nothing to
                break
              </Sent>

              <Timestamp>11:52 AM</Timestamp>

              <Received>
                and the web vitals? you said you&apos;d actually check this time
              </Received>

              <Sent pos="first">
                ran Lighthouse against the prod build on the main pages. scores
                82 to 94. CLS basically zero, blocking time tiny, server
                responds in 10ms. nothing&apos;s on fire
              </Sent>
              <Sent pos="last">
                one soft spot though — LCP. home 4.1s, operator 4.8s, pokemon
                4.4s on throttled mobile. that&apos;s the &quot;needs
                work&quot; band
              </Sent>

              <Received>so the pages are slow</Received>

              <Sent pos="first">
                not slow to interact — slow to paint the big element. and when i
                opened the one red audit on every page, it was the same line:
                &quot;reduce unused JavaScript.&quot; 72K on home, 118K on
                operator
              </Sent>
              <Sent pos="last">
                which is the exact thing the tree-shaking pass chips at. the
                bundle lever and the LCP lever turned out to be the same lever
              </Sent>

              <Received pos="first">
                then why not just fix LCP hard, right now
              </Received>
              <Received pos="last">
                chase it to green
              </Received>

              <Sent pos="first">
                because a big LCP refactor is exactly the kind of change you
                don&apos;t land without a human watching the numbers. splitting a
                hero, reordering a canvas, moving work off the main path — each
                one can regress something else, and &quot;green in the lab&quot;
                isn&apos;t &quot;better for real users&quot;
              </Sent>
              <Sent pos="last">
                the vitals aren&apos;t bad enough to gamble on a speculative
                rewrite. so: apply the safe, measured nudge, and write the LCP +
                unused-JS finding down as the next thing to look at with intent
              </Sent>

              <Received>what&apos;s the one-line version</Received>

              <Sent pos="first">
                when the delete checks are already green, the next win is a
                config that ships less of the code you kept — not a bigger delete
              </Sent>
              <Sent pos="last">
                and measure before you claim a fix. 148K is a small honest win;
                a 4.8s LCP is a real finding, not a thing to paper over in one
                unattended pass
              </Sent>
            </div>
          </div>
        </div>
      }
    >
      <Section title="Starting from green">
        <p className="mb-3 text-muted">
          The first tree-shaking pass left two blocking checks running on every
          push: <C>depcheck</C> for unused dependencies and <C>ts-prune</C> for
          dead exports. Both were green going into 2.3.0. That changes what a
          second pass can even be about.
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            No unused dependency to drop, no orphaned export to delete — the
            cheap, high-confidence removals were already gone.
          </Bullet>
          <Bullet>
            framer-motion already runs through <C>LazyMotion</C> with the light{" "}
            <C>m</C> components, and every Three.js scene is behind a{" "}
            <C>next/dynamic</C> import with <C>ssr: false</C>, so the 3D stack
            never touches a first load.
          </Bullet>
          <Bullet>
            So the only weight left is code that <em>is</em> imported and{" "}
            <em>is</em> used, but drags unused siblings along with it. That&apos;s
            not a deletion problem — it&apos;s a bundler-instruction problem.
          </Bullet>
        </ul>
      </Section>

      <Section title="The lever: barrels Next doesn't optimize by default">
        <p className="mb-3 text-muted">
          A barrel package re-exports everything through a single{" "}
          <C>index.js</C>. Import one member and the bundler often can&apos;t
          prove the rest is dead, so it keeps more than you used. Next.js fixes
          this by rewriting <C>{`import { X } from "pkg"`}</C> into a direct
          module import — but only for a hardcoded built-in list.
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            Next&apos;s default list already covers the usual suspects here —{" "}
            <C>recharts</C>, <C>date-fns</C>, <C>lucide-react</C> and friends —
            so those needed nothing.
          </Bullet>
          <Bullet>
            What it does <em>not</em> cover: our own design-system package{" "}
            <C>@paul-portfolio/react</C> (imported in shared UI, so it rides
            first-load paths), the two heavy barrels <C>@react-three/drei</C> and{" "}
            <C>@unovis/react</C>, and <C>framer-motion</C>. Each was confirmed a
            real barrel — single entry, many members — before being added.
          </Bullet>
          <Bullet>
            The fix is one config block: <C>experimental.optimizePackageImports</C>{" "}
            listing those four. No source changes, no import rewrites by hand.
          </Bullet>
        </ul>
      </Section>

      <Section title="Measure, then claim">
        <p className="mb-3 text-muted">
          The rule from round one still holds: name the currency before you
          celebrate. So the change was measured against a real baseline, not
          asserted.
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            Built the app cold, summed every client chunk under{" "}
            <C>.next/static/chunks</C>: <strong className="text-foreground">
            13,468 KB
            </strong>{" "}
            baseline.
          </Bullet>
          <Bullet>
            Added the config, rebuilt, re-summed:{" "}
            <strong className="text-foreground">13,320 KB</strong> — a{" "}
            <strong className="text-foreground">148 KB</strong> reduction in
            total shipped JS, with the build and typecheck still clean.
          </Bullet>
          <Bullet>
            Small, and that&apos;s the honest framing. The app had already taken
            the big wins (lazy motion, split 3D). This is the long tail — but
            it&apos;s free, permanent, and carries zero maintenance because
            it&apos;s a flag, not a rewrite.
          </Bullet>
        </ul>
      </Section>

      <Section title="The web-vitals check (and where they actually hurt)">
        <p className="mb-3 text-muted">
          A bundle number is a proxy. The real question was whether page speed
          is suffering, so this pass also ran Lighthouse against the production
          build on the main routes — home, calendar, NBA, thoughts, vitals,
          operator, pokemon — under throttled mobile.
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            <strong className="text-foreground">Mostly healthy.</strong>{" "}
            Performance scores landed 82–94. Cumulative layout shift was
            effectively zero, total blocking time was tiny, and the server
            responded in 10ms. Nothing structurally broken.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">LCP is the soft spot.</strong>{" "}
            Largest Contentful Paint sat in the &quot;needs improvement&quot;
            band on the heaviest pages — home 4.1s, operator 4.8s, pokemon 4.4s.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">
              Same lever, twice.
            </strong>{" "}
            The single failing audit on every slow page was the same one:{" "}
            <em>reduce unused JavaScript</em> (72 KiB on home, 118 KiB on
            operator). There was no render-blocking stylesheet, no slow server,
            no unprioritized hero image — the LCP delay is JS the page ships but
            doesn&apos;t need to paint. The bundle lever and the LCP lever are
            the same lever.
          </Bullet>
        </ul>
      </Section>

      <Section title="Why not just fix LCP right now">
        <p className="mb-3 text-muted">
          Tempting to chase LCP to green in the same pass. The decision was to
          apply the safe nudge and write the rest down as an intentional
          follow-up, not to speculatively refactor.
        </p>
        <ul className="mt-2 space-y-3 text-muted">
          <Bullet>
            <strong className="text-foreground">The nudge is safe.</strong>{" "}
            <C>optimizePackageImports</C> is a config flag with a measured,
            positive effect on the exact metric Lighthouse flagged. Low risk,
            already shipped.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">
              A hard LCP fix is not.
            </strong>{" "}
            Splitting the LCP element, reordering a canvas mount, or moving work
            off the critical path each risks regressing something else, and a
            lab score improving is not the same as real users being better off.
            That&apos;s a change you land with a human watching the field
            numbers, not blind in one unattended pass.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">
              The vitals don&apos;t justify a gamble.
            </strong>{" "}
            Scores in the 80s–90s with great CLS and TBT aren&apos;t an
            emergency. The responsible move is the measured nudge now, and a
            clearly-named follow-up — trim unused JS on operator and pokemon
            first, since they carry the most — rather than a rewrite chasing a
            lab number.
          </Bullet>
        </ul>
      </Section>

      <Section title="The takeaway">
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            When the delete checks are already green, the next win isn&apos;t a
            bigger delete — it&apos;s telling the bundler to ship less of the
            code you kept. Config beats cleanup once cleanup is done.
          </Bullet>
          <Bullet>
            Measure before you claim. 148 KB is a small, honest win named in the
            currency that moves bytes; a 4.8s LCP is a real finding, not
            something to quietly paper over.
          </Bullet>
          <Bullet>
            Ship the safe, measured change and write down the risky one. An
            unattended pass should leave the codebase better and the next
            decision clearer — not gamble a page&apos;s render path on a lab
            score.
          </Bullet>
        </ul>
      </Section>
    </ThoughtLayout>
  );
}
