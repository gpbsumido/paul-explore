"use client";

import { useEffect, useRef, useState } from "react";

type DemoModule = typeof import("./GalleryDemos");
type DemoName = Exclude<keyof DemoModule, "DeferredPreview">;

// Match the space reserved by DeferredPreview inside the effect demos.
// Simpler controls fit inside the card's existing min-height.
const RESERVED_HEIGHT: Partial<Record<DemoName, string>> = {
  ClickSparkDemo: "8rem",
  BlurRevealDemo: "8rem",
  StarBorderDemo: "8rem",
  ShineSweepDemo: "8rem",
  LiquidGlassDemo: "8rem",
  TextLoopDemo: "8rem",
  SquishSwitchDemo: "8rem",
  RubberSegmentDemo: "8rem",
  LiquidCarveButtonDemo: "8rem",
  LatticeLoaderDemo: "8rem",
  DriftWallDemo: "12rem",
  CircularGalleryDemo: "12rem",
  PathGalleryDemo: "11rem",
  SmoothScrollSliderDemo: "11rem",
  HoverImageRevealDemo: "11rem",
  LinkPreviewDemo: "8rem",
  SpiralPortraitHeroDemo: "16rem",
  PerspectivePortraitHeroDemo: "16rem",
  CorridorPortraitHeroDemo: "16rem",
  MobileReelHeroDemo: "20rem",
  MobileOrbitHeroDemo: "20rem",
  MobileLensHeroDemo: "20rem",
  LightBloomDemo: "11rem",
  ParticleTextDemo: "8rem",
  RefineFrameDemo: "12rem",
  FolderFloatDemo: "11rem",
  BotanicalTextDemo: "8rem",
};

/** Loads the interactive demo bundle only when its gallery card approaches view. */
export default function DeferredGalleryDemo({ name }: { name: DemoName }) {
  const ref = useRef<HTMLDivElement>(null);
  const [module, setModule] = useState<DemoModule | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let active = true;
    const load = () => {
      void import("./GalleryDemos").then((loaded) => {
        if (active) setModule(loaded);
      });
    };
    if (typeof IntersectionObserver !== "function") {
      load();
      return () => { active = false; };
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      observer.disconnect();
      load();
    }, { rootMargin: "600px" });
    observer.observe(element);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, []);

  const Demo = module?.[name];
  const minHeight = RESERVED_HEIGHT[name] ?? "2rem";
  return (
    <div ref={ref} style={{ minHeight }}>
      {Demo ? <Demo /> : <div className="w-full animate-pulse rounded-lg bg-surface" style={{ minHeight }} aria-hidden />}
    </div>
  );
}
