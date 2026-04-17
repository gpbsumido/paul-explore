"use client";

import { Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import ModelFallback from "./ModelFallback";

type Props = {
  children?: ReactNode;
  className?: string;
  /** Pass false to disable continuous camera rotation (e.g. when the model handles its own animation). */
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  /** Override camera position and FOV. Defaults to position [0,0,3.5] fov 50. */
  camera?: { position: [number, number, number]; fov: number };
};

/** R3F Canvas shared by all section 3D models. Demand-rendered, explicit lights. */
const DEFAULT_CAMERA = {
  position: [0, 0, 3.5] as [number, number, number],
  fov: 50,
};

export default function SectionModelScene({
  children,
  className,
  autoRotate = true,
  autoRotateSpeed = 0.8,
  camera = DEFAULT_CAMERA,
}: Props) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={camera}
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        overflow: "visible",
      }}
      className={className}
    >
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
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
