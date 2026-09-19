"use client";

import { useState } from "react";
import {
  Button, ClickSpark, CorridorPortraitHero, PerspectivePortraitHero,
  RubberSegment, SpiralPortraitHero,
} from "@paul-portfolio/react";
import { FEATURES } from "@/app/_shared/featureData.data";
import { FEATURED, previewSrc } from "../v5/featured";
import styles from "./playground.module.css";

const SCENES = ["Spiral", "Perspective", "Corridor"];
const HERO_COMPONENTS = [SpiralPortraitHero, PerspectivePortraitHero, CorridorPortraitHero];
const IMAGES = FEATURED.flatMap(({ id }) => {
  const feature = FEATURES.find((item) => item.id === id);
  return feature ? [{ src: previewSrc(id, "dark"), alt: feature.title }] : [];
});

export default function PlaygroundHero() {
  const [scene, setScene] = useState("Spiral");
  const [paused, setPaused] = useState(false);
  const Hero = HERO_COMPONENTS[SCENES.indexOf(scene)];

  return (
    <div className={styles.heroWrap} data-paused={paused}>
      <div className={styles.heroMeta}>
        <span>01 / The playground</span>
        <span>Toronto, Canada <span aria-hidden="true">↗</span></span>
      </div>
      <Hero
        id="hero"
        className={styles.hero}
        images={[...IMAGES, ...IMAGES]}
        heading={<><span className={styles.identity}>Paul Sumido <span aria-hidden="true">/</span> Lead Frontend Developer</span><span className={styles.headline}>Ideas into<br /><em>interfaces.</em></span></>}
        description="A collection of things I’ve built, questions I’ve followed, and details I couldn’t leave alone. Come click around."
        actions={<><ClickSpark><Button href="#work" variant="primary" size="lg">Explore the work <span aria-hidden="true">↘</span></Button></ClickSpark><Button href="/resume" variant="outline" size="lg">Resume <span aria-hidden="true">↗</span></Button></>}
      />
      <div className={styles.sceneBar}>
        <div><span className={styles.eyebrow}>Same work. Different perspective.</span><p>Make yourself at home.</p></div>
        <fieldset className={styles.sceneControl}>
          <legend className="sr-only">Hero scene</legend>
          <RubberSegment segments={SCENES} value={scene} onChange={setScene} />
        </fieldset>
        <Button variant="ghost" size="sm" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Resume motion" : "Pause motion"}</Button>
      </div>
    </div>
  );
}
