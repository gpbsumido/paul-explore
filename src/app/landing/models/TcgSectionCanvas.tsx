"use client";

import SectionModelScene from "./SectionModelScene";
import CardModel from "./sections/CardModel";

/**
 * TCG section canvas: five cards in a fanned arc.
 * autoRotate is disabled — cards are stationary until the user drags.
 * Camera is positioned slightly above and closer so the fan fills the frame.
 */
export default function TcgSectionCanvas() {
  return (
    <SectionModelScene
      autoRotate={false}
      camera={{ position: [0, 0.2, 2.4], fov: 52 }}
    >
      <CardModel />
    </SectionModelScene>
  );
}
