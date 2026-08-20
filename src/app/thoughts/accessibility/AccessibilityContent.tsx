import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  UpdateTimeline,
  Update,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";
import { AccessibilityChat } from "./sections/AccessibilityChat";

const code =
  "rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground";
import { AccessibilitySummary1 } from "./sections/AccessibilitySummary1";
import { AccessibilitySummary2 } from "./sections/AccessibilitySummary2";

export default function AccessibilityContent() {
  return (
    <ThoughtLayout
      breadcrumb="Accessibility"
      title="Accessibility"
      intro={
        <>
          Adding WCAG 2.1 AA compliance to the app. Not a weekend checkbox
          exercise — a systematic audit of every primitive component, backed by
          automated axe scans at both the unit and E2E layers. The interesting
          part is where the tooling helps and where it doesn&apos;t.
        </>
      }
      chat={<AccessibilityChat />}
    >
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-08-16-gel-gloss",
            date: "Aug 16, 2026",
            title: "A failure I had recorded at half its size",
          },
          {
            id: "update-2026-08-16-wrong-target",
            date: "Aug 16, 2026",
            title: "A guard aimed at the wrong half of the system",
          },
          {
            id: "update-2026-08-15-playoffs",
            date: "Aug 15, 2026",
            title: "The contrast failure that was not a contrast failure",
          },
          {
            id: "update-2026-08-15-recolour",
            date: "Aug 15, 2026",
            title: "The recolour tried to smuggle in three contrast bugs",
          },
        ]}
      />
      <AccessibilitySummary1 />
      <AccessibilitySummary2 />
      <Update
        id="update-2026-08-15-recolour"
        date="August 15, 2026"
        title="The recolour tried to smuggle in three contrast bugs"
      >
        <p>
          Swapping the whole site onto the Verdigris &amp; Ember palette was
          the best stress test this audit has had, because a recolour attacks
          contrast everywhere at once. Three bugs got through the diff, and
          each one was caught by a different layer &mdash; which is the whole
          argument for having more than one.
        </p>
        <p>
          <strong>Chromatic caught the one I shipped upstream.</strong> In the
          design-system repo, the Textarea&apos;s character count sat in
          neutral-500 &mdash; fine for years at 4.7:1 on the old cool gray,
          quietly nudged to about 4.2:1 when the ramp warmed. I found it as a
          flagged story on the Chromatic build during review: the a11y check
          runs against every story, so a token change that regresses a
          component it never mentions still gets caught. The InfoTip glyph had
          the identical bug, found by then grepping for the same pattern. Both
          moved a step darker on light with a dark-theme override, and the
          other neutral-500 consumers stayed put deliberately: disabled
          controls are exempt, and borders and icons carry the 3:1 rule, which
          they clear.
        </p>
        <p>
          <strong>The Playwright sweep caught the theme mismatch.</strong>{" "}
          Retuning the NBA matchup pages put band accents &mdash; values tuned
          for light surfaces &mdash; into dark-theme table text, and the
          both-theme axe run flagged 36 nodes on one page. The fix was not a
          better hex, it was the right kind of value: text now uses the
          theme-aware feature accent variables that flip with the theme, so
          there is no single colour trying to survive both backgrounds.
        </p>
        <p>
          <strong>And one bug no gate could see.</strong> The landing&apos;s
          contact card put a cursor-following glow under muted copy at full
          token strength, unreadable at exactly the moment someone hovered.
          jsdom&apos;s axe computes no contrast at all, and the E2E sweep scans
          the resting state, where the glow is transparent &mdash;
          pointer-driven decoration under text is structurally invisible to
          both. The fix went into the primitive: the card now caps any accent
          it is handed to 22% alpha before the glow ever renders, so no future
          caller can reintroduce the bug. When the tooling cannot watch a
          state, make the state impossible instead.
        </p>
      </Update>
      <Update
        id="update-2026-08-15-playoffs"
        date="August 15, 2026"
        title="The contrast failure that was not a contrast failure"
      >
        <p>
          The playoff bracket had been failing the local accessibility sweep
          on colour contrast, and the obvious reading was that the warm
          neutrals had pushed muted text under AA. That reading was wrong, and
          acting on it would have meant retoning a token to fix nothing.
          Muted measures 5.02 to 7.00 against every surface in both themes,
          and the specific elements axe flagged measure 7.0:1 and 14.5:1 once
          the page has settled. Running axe by hand against the same page,
          with the same waits the spec uses, produced no violations at all.
        </p>
        <p>
          <strong>There was a real defect, just not that one.</strong> A
          matchup with no teams yet was dimmed with forty percent opacity,
          which is a reasonable way to recede a border and a bad way to recede
          text. Measured on the running page, twenty-one elements sat at an
          effective opacity of 0.4, which puts the seeds and the score select
          well under AA for anyone reading them. The card keeps full opacity
          now and recedes with a lighter surface instead. The buttons and the
          select were already disabled, which is what tells a screen reader
          the state and what exempts a control from the contrast rule to begin
          with; the blanket opacity was doing neither.
        </p>
        <p>
          The rest was the scan racing the stylesheet. It only appeared under
          the full thirty-test parallel run against a dev server; with one
          worker, one theme passed and the other failed, and in isolation it
          passed outright. The tokens are aliases of the shared package now,
          and an alias whose source stylesheet has not arrived resolves to
          nothing rather than to an error &mdash; so a scan can catch the page
          with its text in the browser default over a surface that is already
          correct. The spec waits for background and muted alongside
          foreground now, and for the main landmark to be painted in a real
          colour.
        </p>
        <p>
          Worth recording that this never reached CI, because CI scans a
          production build rather than a dev server compiling routes on
          demand. A check that is red locally and green in CI is its own kind
          of problem: it trains you to ignore the local one.
        </p>
      </Update>

      <Update
        id="update-2026-08-16-wrong-target"
        date="August 16, 2026"
        title="A guard aimed at the wrong half of the system"
      >
        <p>
          A consumer upgrade reported that the shared secondary button
          rendered an ember label on an ember tint at 3.2:1, under AA. I set
          out to fix it and asked for the measurement first, which is the
          only reason the next part came out right:{" "}
          <strong>that button does not use the ember ramp at all.</strong> It
          tracks verdigris and measures 6.66:1 in light and 11.68:1 in dark,
          and in the old blue palette it measured 6.16:1, so it never failed
          and nothing regressed. Sweeping every foreground and background pair
          in both ramps across both palettes turned up nothing at 3.2:1 to
          fix.
        </p>
        <p>
          Two of my own assumptions went with it: I had reasoned about the
          tint as a <code className={code}>color-mix</code> over a surface,
          and the package has no alpha or mixing anywhere &mdash; every fill
          is a flat opaque ramp step. Retoning the identity ramp, which was
          the obvious move, would have changed the brand in every consuming
          app to fix a component that was already passing.
        </p>
        <p>
          <strong>The measuring did find a real breach, one component over.</strong>{" "}
          The error starburst badge fills with the ramp&rsquo;s 400 and labels
          with its 900, which clears comfortably for primary, success and
          warning &mdash; but the error ramp&rsquo;s 400 is darker than its
          siblings, landing that label at 3.62:1 at ten pixels bold, under the
          large-text exemption. The label moved to the ramp&rsquo;s darkest
          step for 5.84:1, rather than lightening the fill, because the
          saturated red is what makes the seal read as an error in the first
          place.
        </p>
        <p>
          The root cause is the part worth keeping. A contrast helper existed
          in that package and had only ever been pointed at the chart palette,
          so not one component pair had ever been measured &mdash; which is
          exactly how a 3.62:1 label shipped green through a system that
          advertises contrast checking. There are eighteen component pairs
          under test now, read out of the real stylesheets and folded through
          the cascade to the actual label and fill. A guard is only worth what
          it is aimed at, and this one had been aimed at the half of the
          system nobody was shipping.
        </p>
        <p>
          The original 3.2:1 report is not disproven, only relocated: it was
          measured inside the consuming app, which carries its own bridge over
          these ramps. Two measurements taken in different contexts disagreeing
          is a thing to re-measure, not to declare settled.
        </p>
      </Update>

      <Update
        id="update-2026-08-16-gel-gloss"
        date="August 16, 2026"
        title="A failure I had recorded at half its size"
      >
        <p>
          The design system had the gel button{" "}
          <strong>on the books as a 3.45:1</strong> AA failure, recorded in{" "}
          <code className={code}>0.2.36</code> and deferred as a decorative
          variant that was close enough to fix later. It reproduces exactly,
          which is most of why it survived a year of me looking at it. It is
          also the wrong measurement:{" "}
          <strong>the real floor was 1.69:1</strong> at rest and 1.52:1 on
          hover.
        </p>
        <p>
          The recorded figure reads white against the bare{" "}
          <code className={code}>primary-500</code> gradient stop, and that stop
          sits underneath a 55% white gloss. So it describes a surface nobody
          renders. Understating a contrast defect by more than half is bad in a
          specific direction &mdash; it turns a serious failure into a tolerable
          one on the page where I decide what to fix next, which is exactly how
          it stayed deferred.
        </p>
        <p>
          The correction also produced the fix, which the original number could
          not have. Darkening the ramp was the obvious move and was never going
          to work: a 55% white gloss caps whatever is under it at 3.35:1 even
          over pure black, so no ramp step reaches 4.5 while that gloss stands.
          Both had to move. The button ships{" "}
          <code className={code}>primary-900</code> under a 14% gloss now,
          measuring 5.12:1 at rest and 4.73:1 on hover at the worst point along
          the fill.
        </p>
        <p>
          The audit&rsquo;s own sampler is the thing that failed here, and it
          failed the way the rest of that week&rsquo;s findings did. It read the
          discrete ramp steps a background names, so an interpolated gradient
          midpoint and a translucent layer were both invisible to it, and both
          of those blind spots err toward passing. It composites the fill
          properly now, and it asserts against itself: the composited reading
          must stay below the bare-stop one, because if compositing ever
          silently drops out the ratios rise while the button gets worse. The
          fuller account of that week is in{" "}
          <a
            href="/thoughts/green-checks"
            className="text-primary-600 hover:underline dark:text-primary-400"
          >
            green checks
          </a>
          .
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "Accessibility treated as markup rather than attributes — semantic elements first, ARIA only where semantics genuinely run out.",
          "axe running in the component tests, so a violation fails a pull request rather than waiting for an audit nobody schedules.",
          "Best-practice rules enforced, not only violations, which is what caught the structural problems on the calendar and the public routes.",
        ]}
        couldImprove={[
          "Automated checks catch roughly a third of what matters. Nothing here covers whether the app is actually operable by keyboard end to end, which no linter can tell you.",
          "There is no screen-reader pass recorded anywhere, so the claim rests on the tooling rather than on having listened to it.",
          "prefers-reduced-motion was honoured unevenly. I assumed the 3D pages were the offenders and audited before fixing: the world already gated every ambient animation, and only the particle lab ignored the setting entirely. Worth recording that the assumption was wrong, because it is the sort that sends a fix at the wrong page.",
        ]}
        upcoming={[
          "Keep the audit honest rather than assumed — nothing checks that a new animated component gates on the preference, so the next one added is on whoever remembers.",
        ]}
      />
    </ThoughtLayout>
  );
}
