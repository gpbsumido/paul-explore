"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  UpdateTimeline,
  Update,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";
import { AccessibilityChat } from "./sections/AccessibilityChat";
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
