"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import { ChatThread, Timestamp, Sent, Received } from "@/lib/threads";

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

/** A little before/after stat row for the LCP tables. */
function Stat({
  label,
  before,
  after,
  note,
}: {
  label: string;
  before: string;
  after: string;
  note?: string;
}) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 self-start rounded-full bg-foreground/30" />
      <span className="font-medium text-foreground">{label}</span>
      <span className="font-mono text-[13px] text-muted">{before}</span>
      <span className="text-muted">→</span>
      <span className="font-mono text-[13px] text-foreground">{after}</span>
      {note ? <span className="text-[13px] text-muted">{note}</span> : null}
    </li>
  );
}

export default function TreeShakingTwoContent() {
  return (
    <ThoughtLayout
      breadcrumb="Tree Shaking II"
      title="Tree Shaking, Round 2"
      intro={
        <>
          A second pass at dead weight for 2.3.0, starting from a codebase that
          was already clean. The deletion checks were green, so the interesting
          question wasn&apos;t what to delete. It was where the remaining bytes
          hide, whether the page speed people feel was suffering, and what
          actually fixes it. That last part had a twist I did not expect: the
          fix that helped real users the most is the one my lab tool refused to
          give credit for.
        </>
      }
      chat={
        <ChatThread>
          <Timestamp>Today 11:40 AM</Timestamp>

          <Received pos="first">
            you did another tree shaking pass right
          </Received>
          <Received pos="last">
            thought the last one already cleaned everything
          </Received>

          <Sent pos="first">
            it did, mostly. the two dead-code checks were both green going in —
            depcheck clean, ts-prune clean. so this one couldn&apos;t be about
            deleting files
          </Sent>
          <Sent pos="last">
            when there&apos;s nothing dead to remove, the only lever left is the
            code that&apos;s alive but ships more than it needs. that&apos;s a
            bundler-config problem, not a delete-the-file problem
          </Sent>

          <Received>what does that even mean</Received>

          <Sent pos="first">
            barrel files. a package exports everything from one{" "}
            <code>index.js</code>. you import one component from it, but the
            bundler can&apos;t always prove the rest is unused, so it keeps more
            than you asked for
          </Sent>
          <Sent pos="last">
            Next already rewrites those imports for a built-in list — recharts,
            date-fns, lucide. but not our own design-system package, not the big
            3D and charting barrels. those it leaves alone
          </Sent>

          <Received>so you told it to shake those too</Received>

          <Sent pos="last">
            one config line. <code>optimizePackageImports</code> with the four
            barrels Next doesn&apos;t cover. rebuilt, measured. total client JS
            went 13,468 to 13,320 KB. real, but small
          </Sent>

          <Received pos="first">148K. that&apos;s it?</Received>
          <Received pos="last">feels like barely worth it</Received>

          <Sent pos="first">
            that&apos;s the honest number, and it&apos;s small on purpose. the
            app already lazy-loads framer-motion and code-splits every Three.js
            canvas behind <code>ssr: false</code>. the easy wins were already
            taken. this is the tail
          </Sent>
          <Sent pos="last">
            but the vitals check found something worth chasing, so i went back
            and actually did the LCP work this time
          </Sent>

          <Timestamp>11:52 AM</Timestamp>

          <Received>
            right, last time you flagged LCP and left it. home 4.1, operator
            4.8, pokemon 4.4
          </Received>

          <Sent pos="first">
            yeah. so i dug into what was actually gating it. and it was dumb, in
            a good way — the largest text on each page was sitting at{" "}
            <code>opacity:0</code> in the server HTML
          </Sent>
          <Sent pos="last">
            every page wraps its content in a framer-motion entrance —{" "}
            <code>initial=&quot;hidden&quot;</code>, fade up on mount. framer
            renders that hidden state into the SSR markup as{" "}
            <code>opacity:0</code>. so the paint is there, but it&apos;s
            invisible until the JS bundle downloads, hydrates, and runs the
            animation. on throttled mobile that&apos;s ~4 seconds
          </Sent>

          <Received>so the content is done, it&apos;s just hiding</Received>

          <Sent pos="first">
            exactly. the fix is to stop gating the first paint on JS. i moved
            the entrance to a CSS keyframe. same fade-up, but it runs on the
            compositor the moment the element renders — no bundle, no hydration,
            no wait
          </Sent>
          <Sent pos="last">
            reduced-motion falls out for free too, it&apos;s just a{" "}
            <code>@media</code> rule now instead of a JS hook
          </Sent>

          <Received>and Lighthouse went green?</Received>

          <Sent pos="first">
            no. and that&apos;s the part that got interesting. Lighthouse barely
            moved — home still read ~4.7s
          </Sent>
          <Sent pos="last">
            so i measured it a different way. real Chrome, real CPU and network
            throttling, watching the actual LCP event. before: home 4284ms.
            after: 1712ms. that&apos;s 2.5 seconds faster for a real person
          </Sent>

          <Received pos="first">
            so the tool said no change and the real thing said 2.5s
          </Received>
          <Received pos="last">which one&apos;s lying</Received>

          <Sent pos="first">
            the tool, kind of. Lighthouse&apos;s default score is a{" "}
            <em>simulation</em> — it loads the page fast, then models slow
            mobile with a math model of the JS dependency graph. that model is
            great for JS-bound delays and blind to a compositor animation that
            paints early
          </Sent>
          <Sent pos="last">
            the field number is the one users live in. so i trusted it. the lab
            number is a proxy, and here the proxy was wrong
          </Sent>

          <Received>
            but you also said trim unused JS on operator and pokemon. did that
            do anything
          </Received>

          <Sent pos="first">
            operator, yes, and it was the clean one. its charts pull in
            recharts, ~66KB, and that whole section defaults to collapsed. so
            recharts was 100% unused on load. i lazy-loaded the three chart
            components — now it only downloads when you open the section. unused
            JS 118K to 70K, and that one actually moved Lighthouse too: 4.8 to
            4.2
          </Sent>
          <Sent pos="last">
            pokemon was the honest let-down. its &quot;unused JS&quot; is zod,
            but pokemon never imports zod. Next is prefetching the routes the
            hub links to — the graphql and pocket pages — and those use zod.
            it&apos;s prefetch, a nav speedup, not real page weight. trimming it
            would mean turning off prefetch, which is worse. so i left it and
            wrote down why
          </Sent>

          <Received>and you only touched those three pages?</Received>

          <Sent pos="first">
            started there because they were the worst. but the{" "}
            <code>initial=&quot;hidden&quot;</code> pattern was everywhere, so i
            applied the same CSS reveal to every page that gates its
            above-the-fold content on mount — flags, the store detail, the
            design-system sections, the learn hero
          </Sent>
          <Sent pos="last">
            what i did <em>not</em> touch: the scroll-triggered reveals (those
            fire on <code>whileInView</code>, they&apos;re below the fold and
            correct as-is), the interactive animations, and the retired v1/v2
            pages. the fix only belongs where JS was gating the first paint
          </Sent>

          <Received>what&apos;s the one-line version</Received>

          <Sent pos="first">
            a nice entrance animation shouldn&apos;t decide when your content
            becomes visible. paint first, animate second — in CSS, off the
            bundle
          </Sent>
          <Sent pos="last">
            and measure in the thing users actually feel. my lab tool said
            nothing changed while real Chrome painted 2.5 seconds sooner. when
            the proxy and the field disagree, the field wins
          </Sent>
        </ChatThread>
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
            <em>is</em> used, but drags unused siblings along with it.
            That&apos;s not a deletion problem — it&apos;s a bundler-instruction
            problem.
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
            first-load paths), the two heavy barrels <C>@react-three/drei</C>{" "}
            and <C>@unovis/react</C>, and <C>framer-motion</C>. Each was
            confirmed a real barrel — single entry, many members — before being
            added.
          </Bullet>
          <Bullet>
            The fix is one config block:{" "}
            <C>experimental.optimizePackageImports</C> listing those four. No
            source changes, no import rewrites by hand. Total client JS went{" "}
            <strong className="text-foreground">13,468 KB → 13,320 KB</strong> —
            a real 148 KB, small on purpose, since the big wins were already
            taken.
          </Bullet>
        </ul>
      </Section>

      <Section title="The web-vitals check, and the one soft spot">
        <p className="mb-3 text-muted">
          A bundle number is a proxy. The real question was whether page speed
          is suffering, so this pass ran Lighthouse against the production build
          on the main routes under throttled mobile. Scores landed 82–94, CLS
          was effectively zero, blocking time was tiny, the server responded in
          10ms. Nothing structurally broken — except one metric.
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            <strong className="text-foreground">LCP was the soft spot.</strong>{" "}
            Largest Contentful Paint sat in the &quot;needs improvement&quot;
            band on the heaviest pages — home 4.1s, operator 4.8s, pokemon 4.4s.
            Fast to interact, slow to paint the big element.
          </Bullet>
          <Bullet>
            The failing audit on every slow page was the same line:{" "}
            <em>reduce unused JavaScript</em>. No render-blocking stylesheet, no
            slow server, no unprioritized hero image. So there were two threads
            to pull: whatever was <em>gating</em> the paint, and whatever JS was
            genuinely <em>unused</em>.
          </Bullet>
        </ul>
      </Section>

      <Section title="What was actually gating the paint">
        <p className="mb-3 text-muted">
          I checked what the LCP element even was on each page. Same shape every
          time: a big block of text, sitting in the server-rendered HTML, but
          shipped with an inline <C>opacity:0</C>.
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            Every page wraps its content in a framer-motion entrance —{" "}
            <C>{`initial="hidden"`}</C>, fade-and-rise on mount. Framer renders
            that hidden state into the SSR markup, so the largest content is
            painted but invisible.
          </Bullet>
          <Bullet>
            It only becomes visible after the JS bundle downloads, React
            hydrates, and framer runs <C>{`animate="visible"`}</C>. On throttled
            mobile that whole chain is roughly four seconds — which is exactly
            where LCP landed, while first paint (FCP) was ~1.1s. The gap between
            them <em>was</em> the animation waiting on JS.
          </Bullet>
          <Bullet>
            So this was never a &quot;too much content&quot; problem. The
            content was ready at FCP. A decorative entrance was deciding when it
            got to be seen.
          </Bullet>
        </ul>
      </Section>

      <Section title="The fix: paint first, animate second">
        <p className="mb-3 text-muted">
          The entrance is worth keeping — I just don&apos;t want it on the
          critical path. So I moved it from JS to CSS.
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            A single <C>@keyframes reveal-up</C> (fade + translateY) and a{" "}
            <C>.reveal-up</C> class in globals. It runs on the compositor the
            instant the element renders, with no bundle and no hydration in the
            way, so the content is visible at FCP and LCP lands with it.
          </Bullet>
          <Bullet>
            Fill mode is <C>backwards</C> on purpose: the from-state applies
            before the animation starts, but the element reverts to plain styles
            when it ends, so a later <C>:hover</C> transform isn&apos;t pinned
            by a forwards fill. Staggered groups just set an inline{" "}
            <C>animation-delay</C> per child, kept small so the largest element
            never waits long.
          </Bullet>
          <Bullet>
            Reduced motion is handled by a{" "}
            <C>@media (prefers-reduced-motion: reduce)</C> rule that switches
            the animation off — no JS hook, honoured before a single script
            runs.
          </Bullet>
        </ul>
      </Section>

      <Section title="Trimming the JS that really was unused">
        <p className="mb-3 text-muted">
          The other thread was the <em>reduce unused JavaScript</em> audit.
          Operator had a clean, real win. Pokemon taught me to read the audit
          more carefully.
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            <strong className="text-foreground">Operator: lazy charts.</strong>{" "}
            The Fleet Analytics section pulls in <C>recharts</C> (~66 KB) and
            defaults to <em>collapsed</em>, so that whole library was 100%
            unused on load. I loaded the three chart components through{" "}
            <C>next/dynamic</C>, so recharts only downloads when someone
            actually opens the section. Unused JS 118 KiB → 70 KiB, and this one
            moved the lab number too — operator LCP 4.8s → 4.2s.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">
              Pokemon: it was prefetch, not weight.
            </strong>{" "}
            Its flagged chunk is zod, but the pokemon hub never imports zod. The
            hub links to the GraphQL and TCG Pocket pages, and Next prefetches
            those routes — they use zod, so their chunk rides along. That&apos;s
            a navigation speedup, not page weight. Killing it would mean turning
            off prefetch, which is a worse trade. So I left it, and this is me
            writing down why.
          </Bullet>
        </ul>
      </Section>

      <Section title="The number that lied: lab vs field">
        <p className="mb-3 text-muted">
          Here&apos;s the twist. After the CSS-reveal fix, Lighthouse&apos;s LCP
          barely budged — home still read ~4.7s. If that were the only number I
          looked at, I&apos;d have called the fix a failure and reverted it.
        </p>
        <ul className="mt-2 space-y-3 text-muted">
          <Bullet>
            So I measured it a second way: real headless Chrome, real 4× CPU and
            Slow-4G throttling, reading the actual{" "}
            <C>largest-contentful-paint</C> entry. That&apos;s the field, not a
            model.
          </Bullet>
          <li className="flex flex-col gap-1.5">
            <span className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
              <span className="text-muted">
                Real-user LCP, before → after (throttled Chrome):
              </span>
            </span>
            <ul className="ml-3.5 space-y-1.5">
              <Stat
                label="home"
                before="4284 ms"
                after="1712 ms"
                note="−2.5s"
              />
              <Stat
                label="operator"
                before="3228 ms"
                after="1320 ms"
                note="−1.9s"
              />
              <Stat
                label="pokemon"
                before="2640 ms"
                after="1472 ms"
                note="−1.2s"
              />
            </ul>
          </li>
          <Bullet>
            The lab tool and the field disagreed hard, and the field was right.
            Lighthouse&apos;s default score is a <em>simulation</em>: it loads
            the page quickly, then estimates slow-mobile timings from a model of
            the JS dependency graph. That model is sharp for JS-bound delays and
            effectively blind to a compositor animation that paints early — so
            it kept crediting the old JS-graph timing that no longer described
            reality.
          </Bullet>
          <Bullet>
            The lesson I&apos;m keeping: a lab metric is a proxy, and a proxy
            can be wrong. When it disagrees with what a real throttled browser
            paints, trust the browser. I&apos;d have thrown away the best fix in
            this whole pass if I&apos;d stopped at the Lighthouse column.
          </Bullet>
        </ul>
      </Section>

      <Section title="Applying it everywhere it fit (and where it didn't)">
        <p className="mb-3 text-muted">
          Home, operator and pokemon were where I started because they measured
          worst. But the <C>{`initial="hidden"`}</C> entrance was all over the
          app, so the same fix applied anywhere a page gates its above-the-fold
          content on mount.
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            <strong className="text-foreground">Converted:</strong> the landing
            and signed-in hub (both the slot machine), operator, pokemon, the
            flags console, the store-detail page, every design-system section,
            and the learn hero — each one was shipping its largest text at{" "}
            <C>opacity:0</C> until hydration.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">Left alone on purpose:</strong>{" "}
            the scroll-triggered reveals (they fire on <C>whileInView</C>,
            they&apos;re below the fold, and turning them into mount animations
            would make off-screen content animate to nobody), the interactive
            animations like the slot spin, and the retired v1/v2 pages. The fix
            only belongs where JS was gating the <em>first</em> paint — not on
            every animation in the codebase.
          </Bullet>
        </ul>
      </Section>

      <Section title="The takeaway">
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            When the delete checks are already green, the next win isn&apos;t a
            bigger delete — it&apos;s telling the bundler to ship less of the
            code you kept, and not shipping the code you kept as{" "}
            <C>opacity:0</C> until hydration.
          </Bullet>
          <Bullet>
            An entrance animation should never decide when your content becomes
            visible. Paint first, animate second, and do the animation in CSS so
            it never rides the JS bundle.
          </Bullet>
          <Bullet>
            Measure in the thing users actually feel. The lab number said the
            LCP fix did nothing while a real throttled browser painted 2.5
            seconds sooner. When the proxy and the field disagree, the field
            wins — and it&apos;s worth building the second measurement so you
            can tell.
          </Bullet>
        </ul>
      </Section>
      <WhatsNext
        nowShipped={[
          "A second pass that started from green rather than assuming the first had held, which is the only honest way to run one.",
          "The distinction between bundle size and what was actually gating the paint — the two are related and not the same, and only one of them was the problem.",
        ]}
        couldImprove={[
          "Still no budget in CI, so a third pass will be needed for the same reason as the second.",
          "The soft spot the web-vitals check surfaced is documented rather than resolved.",
        ]}
        upcoming={[
          "A size budget, which both of these write-ups have now independently concluded is the missing piece.",
        ]}
      />
    </ThoughtLayout>
  );
}
