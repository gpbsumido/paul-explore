"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import NodeClusterModel from "./sections/NodeClusterModel";

/**
 * Full-bleed ambient canvas for the GraphQL section. Sits behind all section
 * content. The Canvas element itself carries 30% CSS opacity so the node
 * cluster reads as a subtle depth layer without competing with the text.
 *
 * alpha: true keeps the WebGL background transparent so the dark section
 * veil and glow show through. frameloop="always" is required because
 * NodeClusterModel drives continuous Y-axis rotation via useFrame.
 *
 * pointer-events: none — the canvas is decorative; interaction targets
 * are the section's HTML content layer.
 */
export default function GraphQLSectionCanvas() {
  return (
    <Canvas
      frameloop="always"
      dpr={[1, 1.5]}
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
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 8, 5]} intensity={1.3} />
      <Suspense fallback={null}>
        <NodeClusterModel />
      </Suspense>
    </Canvas>
  );
}
