"use client";

import { Canvas } from "@react-three/fiber";
import { PauseWhenOffscreen } from "@/app/landing/models/PauseWhenOffscreen";
import { SPAWN } from "@/lib/world/cityLayout";
import WorldScene, { type WorldSceneProps } from "./WorldScene";

/**
 * The WebGL layer. Always rendering while on screen (it's a game loop), but
 * PauseWhenOffscreen parks the frameloop if the canvas ever leaves the
 * viewport, and the whole module only loads client-side via dynamic import.
 */
export default function WorldCanvas(props: WorldSceneProps) {
  return (
    <Canvas
      className="absolute inset-0"
      camera={{ position: [SPAWN.x, 10.5, SPAWN.z + 12.5], fov: 52, far: 420 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={["#070a12"]} />
      <fog attach="fog" args={["#070a12", 70, 155]} />
      <PauseWhenOffscreen />
      <WorldScene {...props} />
    </Canvas>
  );
}
