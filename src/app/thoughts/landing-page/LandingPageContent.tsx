"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
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
    </ThoughtLayout>
  );
}
