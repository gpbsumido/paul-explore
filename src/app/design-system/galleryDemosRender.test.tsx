import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import type { ComponentType } from "react";
import * as Demos from "./GalleryDemos";

/**
 * The gallery defers every effect preview behind an IntersectionObserver, so the
 * showcase test — which never fires one — only ever renders the skeletons. That
 * leaves the demos' real prop usage unexercised: a demo could pass a component
 * the wrong shape and nothing would catch it but a browser. This fires the
 * observer immediately so each demo mounts its actual component, which is the
 * cheapest place to catch a broken preview.
 */
class ImmediateIntersectionObserver {
  private readonly cb: (entries: { isIntersecting: boolean }[]) => void;
  constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
    this.cb = cb;
  }
  observe() {
    this.cb([{ isIntersecting: true }]);
  }
  unobserve() {}
  disconnect() {}
}

const DEMO_NAMES = [
  "ClickSparkDemo",
  "BlurRevealDemo",
  "StarBorderDemo",
  "ShineSweepDemo",
  "LiquidGlassDemo",
  "TextLoopDemo",
  "SquishSwitchDemo",
  "RubberSegmentDemo",
  "LiquidCarveButtonDemo",
  "LatticeLoaderDemo",
  "DriftWallDemo",
  "CircularGalleryDemo",
  "PathGalleryDemo",
  "SmoothScrollSliderDemo",
  "HoverImageRevealDemo",
  "LinkPreviewDemo",
  "SpiralPortraitHeroDemo",
  "PerspectivePortraitHeroDemo",
  "CorridorPortraitHeroDemo",
  "LightBloomDemo",
  "ParticleTextDemo",
  "RefineFrameDemo",
  "FolderFloatDemo",
  "BotanicalTextDemo",
] as const;

const registry = Demos as unknown as Record<string, ComponentType>;

describe("effect gallery demos render once revealed", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it.each(DEMO_NAMES)("%s mounts its real component without throwing", (name) => {
    vi.stubGlobal("IntersectionObserver", ImmediateIntersectionObserver);
    const Demo = registry[name];
    const { container } = render(<Demo />);
    // The preview was revealed: the deferred skeleton has been replaced by the
    // real component. A render error would already have failed this line.
    expect(container.querySelector(".animate-pulse")).toBeNull();
  });
});
