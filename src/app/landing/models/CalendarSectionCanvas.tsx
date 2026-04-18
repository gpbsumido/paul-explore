"use client";

import SectionModelScene from "./SectionModelScene";
import CalendarModel from "./sections/CalendarModel";

/**
 * Calendar section canvas: procedural clock face with real-time hands.
 * autoRotate is disabled — clock is meant to be read, not orbited.
 * Clock is scaled up so it bleeds slightly past the canvas edges.
 */
export default function CalendarSectionCanvas() {
  return (
    <SectionModelScene
      autoRotate={false}
      camera={{ position: [0, 0, 3.0], fov: 50 }}
    >
      <CalendarModel />
    </SectionModelScene>
  );
}
