"use client";

import { Canvas } from "@react-three/fiber";
import { GlobeModel } from "./sections/GlobeModel";

/** Full-bleed ambient canvas for the hero section. Sits behind H1 text.
 *  Uses frameloop="always" because GlobeModel drives rotation via useFrame.
 *  alpha:true so the black page background shows through the wireframe mesh. */
export default function HeroGlobeCanvas() {
  return (
    <Canvas
      frameloop="always"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 2.5], fov: 60 }}
      gl={{ antialias: false, alpha: true }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <ambientLight intensity={0.4} />
      <GlobeModel />
    </Canvas>
  );
}
