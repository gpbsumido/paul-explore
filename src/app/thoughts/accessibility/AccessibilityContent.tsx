"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
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
      <AccessibilitySummary1 />
      <AccessibilitySummary2 />
      <WhatsNext
        nowShipped={[
          "Accessibility treated as markup rather than attributes — semantic elements first, ARIA only where semantics genuinely run out.",
          "axe running in the component tests, so a violation fails a pull request rather than waiting for an audit nobody schedules.",
          "Best-practice rules enforced, not only violations, which is what caught the structural problems on the calendar and the public routes.",
        ]}
        couldImprove={[
          "Automated checks catch roughly a third of what matters. Nothing here covers whether the app is actually operable by keyboard end to end, which no linter can tell you.",
          "There is no screen-reader pass recorded anywhere, so the claim rests on the tooling rather than on having listened to it.",
          "prefers-reduced-motion is honoured unevenly — the animated pages that most need it are the ones that ignore it.",
        ]}
        upcoming={[
          "Honour prefers-reduced-motion on the world and the particle lab, which are the two worst offenders and both have it listed as next on their own pages.",
        ]}
      />
    </ThoughtLayout>
  );
}
