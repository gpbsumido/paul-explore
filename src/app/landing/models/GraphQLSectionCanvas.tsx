"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PauseWhenOffscreen } from "./PauseWhenOffscreen";
import NodeClusterModel from "./sections/NodeClusterModel";

/**
 * Full-bleed ambient canvas for the GraphQL section. Sits behind all section
 * content at 30% CSS opacity. NodeClusterModel rotates via useFrame and
 * honours prefers-reduced-motion internally. PauseWhenOffscreen stops the
 * RAF once the section scrolls out of view.
 *
 * pointer-events: none — the canvas is decorative only.
 */
export default function GraphQLSectionCanvas() {
  const isMobile = useIsMobile();

  return (
    <Canvas
      frameloop="always"
      dpr={isMobile ? 1 : [1, 1.5]}
      camera={{ position: [0, 0, 3.5], fov: 55 }}
      gl={{ antialias: false, alpha: true }}
      style={{
        width: "100%",
        height: "100%",
        opacity: 0.3,
        pointerEvents: "none",
        display: "block",
      }}
    >
      <PauseWhenOffscreen activeFrameloop="always" />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 8, 5]} intensity={1.3} />
      <Suspense fallback={null}>
        <NodeClusterModel />
      </Suspense>
    </Canvas>
  );
}
