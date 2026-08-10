"use client";

import { useRef, type ComponentType } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// Small animated 3D dioramas, one per feature, floating above each exhibit.
// Every vignette gets the feature color and an `animate` gate — the gate is
// false when the player is far away or prefers reduced motion, so idle
// exhibits cost nothing per frame.

export type VignetteProps = {
  readonly color: string;
  readonly animate: () => boolean;
};

function ParticlesVignette({ color, animate }: VignetteProps) {
  const swarmRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!swarmRef.current || !animate()) return;
    swarmRef.current.rotation.y = clock.elapsedTime * 0.9;
    swarmRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.6) * 0.4;
  });
  return (
    <group ref={swarmRef}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 6) * Math.PI * 2) * 0.7,
            Math.sin(i * 2.1) * 0.35,
            Math.sin((i / 6) * Math.PI * 2) * 0.7,
          ]}
        >
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function NbaVignette({ color, animate }: VignetteProps) {
  const ballRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ballRef.current || !animate()) return;
    const phase = Math.abs(Math.sin(clock.elapsedTime * 3.4));
    ballRef.current.position.y = phase * 0.9 - 0.3;
    const squash = phase < 0.12 ? 0.75 : 1;
    ballRef.current.scale.set(1 / squash, squash, 1 / squash);
  });
  return (
    <group>
      <mesh ref={ballRef}>
        <sphereGeometry args={[0.38, 16, 12]} />
        <meshStandardMaterial color="#e8742c" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.42, 20]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function WorkPortfolioVignette({ color, animate }: VignetteProps) {
  const rowRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!rowRef.current || !animate()) return;
    rowRef.current.children.forEach((chip, i) => {
      chip.position.x = ((clock.elapsedTime * 0.55 + i * 0.8) % 3.2) - 1.6;
    });
  });
  return (
    <group ref={rowRef}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[i * 0.8 - 1.6, (i % 2) * 0.5 - 0.25, 0]}>
          <boxGeometry args={[0.6, 0.34, 0.08]} />
          <meshStandardMaterial
            color={i % 2 ? "#3a4a63" : color}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function CalendarVignette({ color, animate }: VignetteProps) {
  const cellsRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!cellsRef.current || !animate()) return;
    const highlighted = Math.floor(clock.elapsedTime * 1.4) % 9;
    cellsRef.current.children.forEach((cell, i) => {
      const s = i === highlighted ? 1.35 : 1;
      cell.scale.set(s, s, s);
    });
  });
  return (
    <group>
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[1.5, 1.5, 0.06]} />
        <meshStandardMaterial color="#20242e" roughness={0.7} />
      </mesh>
      <group ref={cellsRef}>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh
            key={i}
            position={[
              ((i % 3) - 1) * 0.44,
              (1 - Math.floor(i / 3)) * 0.44,
              0.02,
            ]}
          >
            <boxGeometry args={[0.3, 0.3, 0.05]} />
            <meshBasicMaterial color={i === 4 ? color : "#39445c"} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function VitalsVignette({ color, animate }: VignetteProps) {
  const barsRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!barsRef.current || !animate()) return;
    barsRef.current.children.forEach((bar, i) => {
      const h =
        0.35 + (Math.sin(clock.elapsedTime * 1.6 + i * 1.4) * 0.5 + 0.5) * 0.75;
      bar.scale.y = h;
      bar.position.y = h / 2 - 0.55;
    });
  });
  return (
    <group ref={barsRef}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[i * 0.42 - 0.63, 0, 0]}>
          <boxGeometry args={[0.28, 1, 0.28]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function DesignSystemVignette({ color, animate }: VignetteProps) {
  const stackRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!stackRef.current || !animate()) return;
    stackRef.current.children.forEach((layer, i) => {
      layer.rotation.y = clock.elapsedTime * 0.8 * (i % 2 ? -1 : 1);
    });
  });
  return (
    <group ref={stackRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, i * 0.34 - 0.34, 0]}>
          <boxGeometry args={[1.2 - i * 0.32, 0.22, 1.2 - i * 0.32]} />
          <meshStandardMaterial
            color={i === 1 ? color : "#e8e8e6"}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function GalleryWallVignette({ color, animate }: VignetteProps) {
  const framesRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!framesRef.current || !animate()) return;
    framesRef.current.children.forEach((frame, i) => {
      frame.position.y =
        Math.sin(clock.elapsedTime * 1.2 + i * 2) * 0.08 +
        (i === 1 ? 0.15 : -0.1);
    });
  });
  return (
    <group ref={framesRef}>
      {[
        { x: -0.55, w: 0.42, h: 0.58 },
        { x: 0, w: 0.55, h: 0.42 },
        { x: 0.55, w: 0.4, h: 0.4 },
      ].map((f, i) => (
        <group key={i} position={[f.x, i === 1 ? 0.15 : -0.1, 0]}>
          <mesh>
            <boxGeometry args={[f.w + 0.08, f.h + 0.08, 0.05]} />
            <meshStandardMaterial color="#e8e2d4" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[f.w, f.h]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PokemonVignette({ color, animate }: VignetteProps) {
  const cardRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!cardRef.current || !animate()) return;
    cardRef.current.rotation.y = clock.elapsedTime * 1.6;
  });
  return (
    <group ref={cardRef}>
      <mesh>
        <boxGeometry args={[0.72, 1, 0.03]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.14, 0.021]}>
        <planeGeometry args={[0.6, 0.55]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.32, 0.021]}>
        <planeGeometry args={[0.6, 0.18]} />
        <meshBasicMaterial color="#c9cfd8" />
      </mesh>
    </group>
  );
}

function OperatorVignette({ color, animate }: VignetteProps) {
  const lightRef = useRef<THREE.MeshBasicMaterial>(null);
  const statusColors = useRef({
    good: new THREE.Color("#22c55e"),
    warn: new THREE.Color("#f59e0b"),
  });
  useFrame(({ clock }) => {
    if (!lightRef.current || !animate()) return;
    const warn = Math.sin(clock.elapsedTime * 0.8) > 0.6;
    lightRef.current.color.copy(
      warn ? statusColors.current.warn : statusColors.current.good,
    );
  });
  return (
    <group>
      <mesh>
        <boxGeometry args={[1, 0.9, 0.7]} />
        <meshStandardMaterial color="#3a4150" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.05, 0.36]}>
        <planeGeometry args={[0.5, 0.6]} />
        <meshBasicMaterial color={color} transparent opacity={0.75} />
      </mesh>
      <mesh position={[0.32, 0.32, 0.36]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial ref={lightRef} color="#22c55e" />
      </mesh>
    </group>
  );
}

function CraftVignette({ color, animate }: VignetteProps) {
  const gearRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!gearRef.current || !animate()) return;
    gearRef.current.rotation.z = clock.elapsedTime * 0.9;
  });
  return (
    <group>
      <group ref={gearRef}>
        <mesh>
          <torusGeometry args={[0.42, 0.12, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.5} flatShading />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i / 4) * Math.PI * 2) * 0.58,
              Math.sin((i / 4) * Math.PI * 2) * 0.58,
              0,
            ]}
          >
            <boxGeometry args={[0.14, 0.14, 0.14]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        ))}
      </group>
      <mesh>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function FlagsVignette({ color, animate }: VignetteProps) {
  const flagRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!flagRef.current || !animate()) return;
    flagRef.current.rotation.z = Math.sin(clock.elapsedTime * 2.2) * 0.12;
    flagRef.current.scale.x = 1 + Math.sin(clock.elapsedTime * 4.4) * 0.06;
  });
  return (
    <group>
      <mesh position={[-0.35, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 1.4, 6]} />
        <meshStandardMaterial color="#c9cfd8" roughness={0.5} />
      </mesh>
      <mesh ref={flagRef} position={[0.08, 0.42, 0]}>
        <planeGeometry args={[0.8, 0.5]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function LearnVignette({ color, animate }: VignetteProps) {
  const ideaRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ideaRef.current || !animate()) return;
    ideaRef.current.position.y =
      0.55 + Math.sin(clock.elapsedTime * 1.8) * 0.12;
  });
  return (
    <group>
      <mesh position={[-0.31, 0, 0]} rotation={[0, 0, 0.35]}>
        <boxGeometry args={[0.62, 0.05, 0.85]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.7} />
      </mesh>
      <mesh position={[0.31, 0, 0]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.62, 0.05, 0.85]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.7} />
      </mesh>
      <mesh ref={ideaRef} position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

export const VIGNETTES: Record<string, ComponentType<VignetteProps>> = {
  particles: ParticlesVignette,
  "fantasy-nba": NbaVignette,
  "work-portfolio": WorkPortfolioVignette,
  calendar: CalendarVignette,
  vitals: VitalsVignette,
  "design-system": DesignSystemVignette,
  "gallery-wall": GalleryWallVignette,
  pokemon: PokemonVignette,
  operator: OperatorVignette,
  craft: CraftVignette,
  flags: FlagsVignette,
  learn: LearnVignette,
};
