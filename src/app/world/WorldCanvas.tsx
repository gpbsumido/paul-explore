"use client";

import { Canvas } from "@react-three/fiber";
import { PauseWhenOffscreen } from "@/app/landing/models/PauseWhenOffscreen";
import { SPAWN } from "@/lib/world/cityLayout";
import type { TimeOfDay } from "@/lib/world/daylight";
import { SKY_PRESETS } from "./skyPresets";
import { DetailContext } from "./detail";
import WorldScene, { type WorldSceneProps } from "./WorldScene";

export type WorldCanvasProps = Omit<WorldSceneProps, "preset"> & {
  readonly timeOfDay: TimeOfDay;
  // 0..1 from the HUD fidelity slider.
  readonly fidelity: number;
};

/**
 * The WebGL layer. Always rendering while on screen (it's a game loop), but
 * PauseWhenOffscreen parks the frameloop if the canvas ever leaves the
 * viewport, and the whole module only loads client-side via dynamic import.
 * Sky and fog come from the visitor's local time of day; render resolution
 * scales with the fidelity slider.
 */
export default function WorldCanvas({ timeOfDay, fidelity, ...sceneProps }: WorldCanvasProps) {
  const preset = SKY_PRESETS[timeOfDay];
  return (
    <Canvas
      className="absolute inset-0"
      camera={{ position: [SPAWN.x, 10.5, SPAWN.z + 12.5], fov: 52, far: 420 }}
      dpr={[0.75 + fidelity * 0.5, 1 + fidelity * 0.9]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={[preset.background]} />
      <fog attach="fog" args={[preset.fog[0], preset.fog[1], preset.fog[2]]} />
      <PauseWhenOffscreen />
      <DetailContext.Provider value={fidelity}>
        <WorldScene {...sceneProps} preset={preset} />
      </DetailContext.Provider>
    </Canvas>
  );
}
