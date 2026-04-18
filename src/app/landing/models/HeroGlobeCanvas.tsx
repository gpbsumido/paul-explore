"use client";

import { Canvas } from "@react-three/fiber";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PauseWhenOffscreen } from "./PauseWhenOffscreen";
import { GlobeModel } from "./sections/GlobeModel";

/** Full-bleed ambient canvas for the hero section. Sits behind H1 text.
 *  alpha:true so the black page background shows through the wireframe mesh.
 *  GlobeModel drives rotation via useFrame and honours prefers-reduced-motion
 *  internally. PauseWhenOffscreen stops the RAF once the hero scrolls away. */
export default function HeroGlobeCanvas() {
  const isMobile = useIsMobile();

  return (
    <Canvas
      frameloop="always"
      dpr={isMobile ? 1 : [1, 1.5]}
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
      <PauseWhenOffscreen activeFrameloop="always" />
      <ambientLight intensity={0.4} />
      <GlobeModel />
    </Canvas>
  );
}
