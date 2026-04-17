"use client";

import SectionModelScene from "./SectionModelScene";
import BasketballModel from "./sections/BasketballModel";

/** NBA section canvas: basketball GLB with Float animation and 3 hotspot dots. */
export default function NbaSectionCanvas() {
  return (
    <SectionModelScene>
      <BasketballModel />
    </SectionModelScene>
  );
}
