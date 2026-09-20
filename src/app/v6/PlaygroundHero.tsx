"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Button, ClickSpark, CorridorPortraitHero, PerspectivePortraitHero,
  RubberSegment, SpiralPortraitHero, MobileReelHero, MobileOrbitHero, MobileLensHero,
  type MobileHeroProps,
} from "@paul-portfolio/react";
import { useTheme } from "@/components/ThemeProvider";
import { FEATURES } from "@/app/_shared/featureData.data";
import { previewSrc } from "../v5/featured";
import { ArrowDownRight, ArrowUpRight } from "./arrows";
import styles from "./playground.module.css";

// Phone widths, plus coarse-pointer phones in landscape. No user-agent sniffing.
const MOBILE_QUERY = "(max-width: 700px), (max-width: 1000px) and (hover: none) and (pointer: coarse)";
function subscribeMobile(onChange: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const mobileSnapshot = () => window.matchMedia(MOBILE_QUERY).matches;
const serverSnapshot = (): boolean | null => null;

// A complete static introduction before hydration; neither gallery mounts until
// the viewport is known. This preserves the statically cached home page.
function StaticHero({ heading, description, actions, id }: MobileHeroProps) {
  return <section id={id} className={styles.staticHero}><h1>{heading}</h1><p>{description}</p><div>{actions}</div></section>;
}
const MOBILE_SCENES = ["Reel", "Orbit", "Lens"];
const MOBILE_HERO_COMPONENTS = [MobileReelHero, MobileOrbitHero, MobileLensHero];
const SCENES = ["Spiral", "Perspective", "Corridor"];
const HERO_COMPONENTS = [SpiralPortraitHero, PerspectivePortraitHero, CorridorPortraitHero];

// Every feature that has a captured preview, so the hero gallery shows the whole
// body of work rather than a curated handful.
const HERO_IMAGE_IDS = [
  "work-portfolio", "design-system", "operator", "world", "vitals", "flags",
  "pokemon", "particles", "research", "learn", "budget", "fantasy-nba",
  "gallery-wall", "craft", "zeroproof", "calendar",
];

export default function PlaygroundHero() {
  const [scene, setScene] = useState("Spiral");
  const [mobileScene, setMobileScene] = useState("Reel");
  const isMobile = useSyncExternalStore(subscribeMobile, mobileSnapshot, serverSnapshot);
  const [paused, setPaused] = useState(false);
  const { theme } = useTheme();
  const Hero = isMobile === null ? StaticHero : isMobile
    ? MOBILE_HERO_COMPONENTS[MOBILE_SCENES.indexOf(mobileScene)]
    : HERO_COMPONENTS[SCENES.indexOf(scene)];
  // Match the screenshots to the theme. Dark dashboards on a light page read as
  // heavy, so light mode gets the light captures (the images carry a border).
  const images = HERO_IMAGE_IDS.flatMap((id) => {
    const feature = FEATURES.find((item) => item.id === id);
    return feature ? [{ src: previewSrc(id, theme), alt: feature.title, ...(isMobile ? { href: feature.href } : {}) }] : [];
  });

  const exploreAction = <Button href="#work" variant="primary" size="lg">Explore the work <ArrowDownRight size={15} /></Button>;
  const sceneBar = (
      <div className={styles.sceneBar}>
        <div><span className={styles.eyebrow}>{isMobile ? "Try a scene" : "Same work. Different perspective."}</span><p>Make yourself at home.</p></div>
        <fieldset className={styles.sceneControl}>
          <legend className="sr-only">Hero scene</legend>
          <RubberSegment segments={isMobile ? MOBILE_SCENES : SCENES} value={isMobile ? mobileScene : scene} onChange={isMobile ? setMobileScene : setScene} />
        </fieldset>
        {isMobile === false && <Button variant="ghost" size="sm" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Resume motion" : "Pause motion"}</Button>}
      </div>
  );

  return (
    <div className={styles.heroWrap} data-paused={paused} data-mobile={isMobile ?? "pending"}>
      <div className={styles.heroMeta}>
        <span>01 / The playground</span>
        <span>Toronto, Canada <ArrowUpRight size={12} /></span>
      </div>
      {isMobile && sceneBar}
      <Hero
        id="hero"
        className={isMobile ? styles.mobileHero : styles.hero}
        images={images}
        heading={<><span className={styles.identity}>Paul Sumido <span aria-hidden="true">/</span> Lead Frontend Developer</span><span className={styles.headline}>Ideas into<br /><em>interfaces.</em></span></>}
        description={isMobile ? "Working apps. Little obsessions. A playground of ideas you can get your hands on." : "A collection of things I’ve built, questions I’ve followed, and details I couldn’t leave alone. Come click around."}
        actions={<>{isMobile ? exploreAction : <ClickSpark>{exploreAction}</ClickSpark>}<Button href="/resume" variant="outline" size="lg">Resume <ArrowUpRight size={15} /></Button></>}
      />
      {!isMobile && sceneBar}
    </div>
  );
}
