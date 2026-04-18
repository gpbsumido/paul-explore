"use client";

import { useEffect, useRef, Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import type { OrbitControls as ThreeOrbitControls } from "three-stdlib";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PauseWhenOffscreen } from "./PauseWhenOffscreen";
import ModelFallback from "./ModelFallback";

type Props = {
  children?: ReactNode;
  className?: string;
  /** Pass false to disable continuous camera rotation. */
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  /** Override camera position and FOV. Defaults to position [0,0,3.5] fov 50. */
  camera?: { position: [number, number, number]; fov: number };
};

const DEFAULT_CAMERA = {
  position: [0, 0, 3.5] as [number, number, number],
  fov: 50,
};

/** R3F Canvas shared by all section 3D models. Demand-rendered, explicit lights. */
export default function SectionModelScene({
  children,
  className,
  autoRotate = true,
  autoRotateSpeed = 0.8,
  camera = DEFAULT_CAMERA,
}: Props) {
  const prefersReduced = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const orbitRef = useRef<ThreeOrbitControls>(null);

  // Two-finger drag only on touch: map ONE-finger touch to PAN (which is
  // disabled via enablePan=false) so single-touch gestures don't intercept
  // page scrolling. Two-finger gestures use DOLLY_ROTATE (zoom is disabled
  // so only rotation is active). Set imperatively to avoid type issues with
  // the THREE.TOUCH enum in JSX.
  useEffect(() => {
    if (!orbitRef.current) return;
    orbitRef.current.touches.ONE = THREE.TOUCH.PAN;
    orbitRef.current.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
  }, []);

  const shouldAutoRotate = autoRotate && !prefersReduced && !isMobile;

  return (
    <Canvas
      frameloop="demand"
      dpr={isMobile ? 1 : [1, 1.5]}
      camera={camera}
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        overflow: "visible",
      }}
      className={className}
    >
      <PauseWhenOffscreen activeFrameloop="demand" />
      <OrbitControls
        ref={orbitRef}
        enableZoom={false}
        enablePan={false}
        autoRotate={shouldAutoRotate}
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
