"use client";

import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

interface Props {
  cAzimuthAngle?: number;
  cPolarAngle?: number;
}

/** B&W animated shader gradient — used as the hero background.
 *  Loaded behind next/dynamic (ssr: false) so WebGL never runs on the server.
 *  Positioned absolute inset-0 so it fills whatever container it's in.
 *  Accepts live camera angles so the parent can drive mouse-parallax. */
export default function ShaderGradientScene({ cAzimuthAngle = 225, cPolarAngle = 100 }: Props) {
  return (
    <ShaderGradientCanvas
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
      pixelDensity={1}
      fov={45}
      lazyLoad={false}
    >
      <ShaderGradient
        type="waterPlane"
        animate="on"
        uSpeed={0.3}
        uStrength={3.5}
        uDensity={1.8}
        uFrequency={3.0}
        color1="#000000"
        color2="#ffffff"
        color3="#555555"
        brightness={1.8}
        grain="on"
        lightType="3d"
        cDistance={20}
        cPolarAngle={cPolarAngle}
        cAzimuthAngle={cAzimuthAngle}
        enableTransition={true}
        smoothTime={0.18}
      />
    </ShaderGradientCanvas>
  );
}
