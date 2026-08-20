"use client";

import { useRef } from "react";
import { Button } from "@/components/ui";
import TextReveal from "@/components/motion/TextReveal";
import TextScramble from "@/components/motion/TextScramble";
import ScrollProgress from "@/components/motion/ScrollProgress";
import MagneticButton from "@/components/motion/MagneticButton";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import BlobBackground from "@/components/motion/BlobBackground";
import SpotlightCard from "@/components/motion/SpotlightCard";
import GradientMesh from "@/components/motion/GradientMesh";
import LoopingDemo from "./LoopingDemo";

/**
 * A scroll bar needs something to scroll. The page's own instance is pinned to
 * the top of the viewport, which is the right place for it and the wrong place
 * to demonstrate it from: by the time you reach this card the bar is off
 * screen, so the card could only ever describe it. This is the real component
 * tracking a real scrollable box, small enough to fit in the frame.
 */
function ScrollProgressDemo() {
  const box = useRef<HTMLDivElement>(null);
  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-lg border border-border">
        <ScrollProgress container={box} height={3} />
        {/* A scrollable area has to be reachable by keyboard, so it is a named
            region with a tab stop rather than a bare div: someone who cannot
            drag a scrollbar still needs to be able to scroll this. */}
        <div
          ref={box}
          role="region"
          aria-label="Scrollable example"
          tabIndex={0}
          className="h-20 overflow-y-auto px-3 pt-3 pb-2 text-sm text-muted focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
        >
          <p>Scroll this box. The bar along its top edge is the component.</p>
          <p className="mt-2">
            It reads the scroll position of whatever element it is given, so a
            panel can show its own progress rather than the page&rsquo;s.
          </p>
          <p className="mt-2">
            The page&rsquo;s own instance is still up at the very top of this
            window, tracking the article you are reading now.
          </p>
          <p className="mt-2">That is the end of the example.</p>
        </div>
      </div>
    </div>
  );
}

/**
 * A live demo per primitive, so the card shows the thing rather than
 * describing it. The card chrome around each demo is server markup; only this
 * demo (and the LoopingDemo replay machinery) hydrates, keyed by the
 * primitive's id so the server shell passes a plain string across the
 * boundary instead of component references.
 */
export default function MotionPrimitiveDemo({ id }: { id: string }) {
  if (id === "text-reveal") {
    return (
      <LoopingDemo label="text reveal">
        <TextReveal as="p" per="word" className="text-lg font-semibold">
          Verdigris and ember
        </TextReveal>
      </LoopingDemo>
    );
  }
  if (id === "text-scramble") {
    return (
      <LoopingDemo label="text scramble">
        <TextScramble
          text="design language"
          trigger="inView"
          className="font-mono text-lg font-semibold"
        />
      </LoopingDemo>
    );
  }
  if (id === "scroll-progress") {
    return <ScrollProgressDemo />;
  }
  if (id === "magnetic-button") {
    return (
      <MagneticButton>
        <Button>Hover me</Button>
      </MagneticButton>
    );
  }
  if (id === "animated-number") {
    return (
      <LoopingDemo label="animated number">
        <AnimatedNumber
          value={2454}
          format={(n) => n.toLocaleString()}
          className="text-3xl font-bold tabular-nums text-foreground"
        />
      </LoopingDemo>
    );
  }
  if (id === "blob-background") {
    return (
      // w-full matters: the preview frame is a flex row, and a flex item whose
      // only content is absolutely positioned collapses to zero width.
      <div className="relative h-24 w-full overflow-hidden rounded-xl">
        <BlobBackground seeds={[12, 34]} />
      </div>
    );
  }
  if (id === "spotlight-card") {
    return (
      <SpotlightCard accent="var(--color-feature-craft)" className="p-4">
        <p className="text-sm text-foreground">Move the cursor across me.</p>
      </SpotlightCard>
    );
  }
  if (id === "gradient-mesh") {
    return (
      <div className="relative h-24 w-full overflow-hidden rounded-xl">
        <GradientMesh />
      </div>
    );
  }
  return null;
}
