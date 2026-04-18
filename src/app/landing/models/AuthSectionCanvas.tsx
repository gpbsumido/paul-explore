"use client";

import SectionModelScene from "./SectionModelScene";
import Attribution from "./Attribution";
import LockModel from "./sections/LockModel";

/**
 * Auth section canvas: padlock GLB with pendulum animation.
 * autoRotate is disabled — LockModel drives its own Y-axis oscillation via useFrame.
 * OrbitControls remains active so users can still drag to inspect the model.
 */
export default function AuthSectionCanvas() {
  // Smaller canvas (260px) needs the camera ~35% closer to keep the model
  // the same visual size: 3.5 * (260/400) ≈ 2.3
  return (
    <div className="relative w-full h-full">
      <SectionModelScene
        autoRotate={false}
        camera={{ position: [0, 0, 2.3], fov: 50 }}
      >
        <LockModel />
      </SectionModelScene>
      <Attribution
        credit="Padlock by Quaternius · CC BY"
        url="https://poly.pizza"
      />
    </div>
  );
}
