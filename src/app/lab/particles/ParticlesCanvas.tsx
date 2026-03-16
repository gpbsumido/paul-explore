import { Canvas } from "@react-three/fiber";
import ParticleScene, { type ParticleSceneProps } from "./ParticleScene";

/**
 * Thin wrapper so the R3F Canvas can be loaded with `ssr: false` while the
 * control-panel state lives in the parent page component.
 */
export default function ParticlesCanvas(props: ParticleSceneProps) {
  return (
    <Canvas
      className="absolute inset-0"
      camera={{ position: [0, 0, 10], fov: 60, near: 0.1, far: 80 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
    >
      <ParticleScene {...props} />
    </Canvas>
  );
}
