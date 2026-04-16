"use client";

import { Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import ModelFallback from "./ModelFallback";

type Props = {
  children?: ReactNode;
  className?: string;
};

/** R3F Canvas shared by all section 3D models. Demand-rendered, city HDR. */
export default function SectionModelScene({ children, className }: Props) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 3.5], fov: 50 }}
      style={{ width: "100%", height: "100%", pointerEvents: "auto" }}
      className={className}
    >
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.8}
      />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} />
      <directionalLight
        position={[-4, -2, -4]}
        intensity={0.3}
        color="#fde68a"
      />
      <Suspense fallback={<ModelFallback />}>{children}</Suspense>
    </Canvas>
  );
}
