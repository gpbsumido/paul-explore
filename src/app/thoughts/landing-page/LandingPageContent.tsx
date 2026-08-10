"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import { LandingChat } from "./sections/LandingChat";
import { LandingSummaryOne } from "./sections/LandingSummaryOne";
import { LandingSummaryTwo } from "./sections/LandingSummaryTwo";

export default function LandingPageContent() {
  return (
    <ThoughtLayout
      breadcrumb="Landing Page"
      title="Landing Page"
      intro={
        <>
          Scroll-driven, section-by-section, zero new dependencies — then
          extended with a WebGL ShaderGradient hero and interactive mouse
          parallax.
        </>
      }
      chat={<LandingChat />}
    >
      <LandingSummaryOne />
      <LandingSummaryTwo />
      <WhatsNext
        nowShipped={[
          "A landing page that previews the actual features rather than describing them, because the work is the argument.",
          "Section layout that survived several redesigns, which is the useful signal about the structure being right.",
        ]}
        couldImprove={[
          "The previews are hand-maintained alongside the feature registry, so a feature can change while its preview does not.",
          "There is no measurement of what people actually open from here, so the ordering is judgement rather than evidence.",
        ]}
        upcoming={[
          "Nothing scheduled. The landing work now happens in the v4 redesign rather than here, and this page is the record of how it started.",
        ]}
      />
    </ThoughtLayout>
  );
}
