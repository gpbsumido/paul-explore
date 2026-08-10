"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { RenderPerfChat } from "./sections/RenderPerfChat";
import { RenderPerfSummary1 } from "./sections/RenderPerfSummary1";
import { RenderPerfSummary2 } from "./sections/RenderPerfSummary2";

export default function RenderPerfContent() {
  return (
    <ThoughtLayout
      breadcrumb="Render Performance"
      title="Render Performance"
      intro={
        <>
          A second performance pass, this time focused on runtime rendering
          costs rather than network-level vitals. Context value instability,
          resize handler allocation, GPU-heavy CSS, unbounded DOM growth, and
          transition waste. Working through these incrementally.
        </>
      }
      chat={<RenderPerfChat />}
    >
      <RenderPerfSummary1 />
      <RenderPerfSummary2 />
    </ThoughtLayout>
  );
}
