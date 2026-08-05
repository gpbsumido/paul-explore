"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
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
              exercise — a systematic audit of every primitive component, backed
              by automated axe scans at both the unit and E2E layers. The
              interesting part is where the tooling helps and where it
              doesn&apos;t.
        </>
      }
      chat={<AccessibilityChat />}
    >
      <AccessibilitySummary1 />
      <AccessibilitySummary2 />
    </ThoughtLayout>
  );
}
