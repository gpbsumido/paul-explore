"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PauseWhenOffscreen } from "./PauseWhenOffscreen";
import Attribution from "./Attribution";
import ModelFallback from "./ModelFallback";
import SpeedometerModel from "./sections/SpeedometerModel";

type Props = {
  inView: boolean;
  prefersReduced: boolean;
};

/**
 * Vitals section canvas: speedometer GLB with an animated needle.
 *
 * frameloop="always" is required so the useSpring lerp in SpeedometerModel
 * advances continuously while the needle is in motion. PauseWhenOffscreen
 * stops the RAF once the section scrolls away. OrbitControls lets users
 * drag to inspect the model (zoom and pan disabled).
 */
export default function VitalsSectionCanvas({ inView, prefersReduced }: Props) {
  const isMobile = useIsMobile();

  return (
    <div className="relative w-full h-full">
      <Canvas
        frameloop="always"
        dpr={isMobile ? 1 : [1, 1.5]}
        camera={{ position: [0, 0.3, 3.5], fov: 50 }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <PauseWhenOffscreen activeFrameloop="always" />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
        />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.4} />
        <directionalLight
          position={[-4, -2, -4]}
          intensity={0.3}
          color="#fde68a"
        />
        <Suspense fallback={<ModelFallback />}>
          <SpeedometerModel inView={inView} prefersReduced={prefersReduced} />
        </Suspense>
      </Canvas>
      <Attribution
        credit="Speedometer by Quaternius · CC BY"
        url="https://poly.pizza"
      />
    </div>
  );
}
