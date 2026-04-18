"use client";

import SectionModelScene from "./SectionModelScene";
import Attribution from "./Attribution";
import BasketballModel from "./sections/BasketballModel";

/** NBA section canvas: basketball GLB with Float animation and 3 hotspot dots. */
export default function NbaSectionCanvas() {
  return (
    <div className="relative w-full h-full">
      <SectionModelScene>
        <BasketballModel />
      </SectionModelScene>
      <Attribution
        credit="Basketball by Quaternius · CC BY"
        url="https://poly.pizza"
      />
    </div>
  );
}
