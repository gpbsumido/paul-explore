"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Constants (same physics as HeroScene, now configurable via props)
// ---------------------------------------------------------------------------

const ORBIT_STRENGTH = 0.0008;
const HALF_W = 8.5;
const HALF_H = 5.5;
const HALF_D = 3.0;
const MOUSE_RADIUS = 4.2;
const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;
const MOUSE_FORCE = 0.01;
const CAM_PARALLAX = 0.55;
const CAM_LERP = 0.045;
const BASE_SPEED = 0.006;
const DOT_STAR = 3.5;
const DOT_SMALL = 2.0;

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type Particle = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  isStar: boolean;
};

function wrap(v: number, half: number): number {
  if (v > half) return -half;
  if (v < -half) return half;
  return v;
}

function makeParticle(star: boolean, palette: THREE.Color[]): Particle {
  const pos = new THREE.Vector3(
    (Math.random() - 0.5) * HALF_W * 2,
    (Math.random() - 0.5) * HALF_H * 2,
    (Math.random() - 0.5) * HALF_D * 2,
  );
  const speed = star ? BASE_SPEED * 0.35 : BASE_SPEED;
  const vel = new THREE.Vector3(
    (Math.random() - 0.5) * speed,
    (Math.random() - 0.5) * speed,
    (Math.random() - 0.5) * speed * 0.25,
  );
  const rx = pos.x;
  const ry = pos.y;
  const rLen = Math.sqrt(rx * rx + ry * ry) || 1;
  vel.x += (-ry / rLen) * ORBIT_STRENGTH * (star ? 0.5 : 1);
  vel.y += (rx / rLen) * ORBIT_STRENGTH * (star ? 0.5 : 1);
  const color = palette[Math.floor(Math.random() * palette.length)].clone();
  return { pos, vel, color, isStar: star };
}

function buildPointsGeo(pts: Particle[]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const posArr = new Float32Array(pts.length * 3);
  const colArr = new Float32Array(pts.length * 3);
  pts.forEach((p, i) => {
    posArr[i * 3] = p.pos.x;
    posArr[i * 3 + 1] = p.pos.y;
    posArr[i * 3 + 2] = p.pos.z;
    colArr[i * 3] = p.color.r;
    colArr[i * 3 + 1] = p.color.g;
    colArr[i * 3 + 2] = p.color.b;
  });
  geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colArr, 3));
  return geo;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ParticleSceneProps {
  particleCount: number;
  speedMult: number;
  connectDist: number;
  palette: THREE.Color[];
  mouseAttraction: boolean;
  /** NDC mouse position updated by the parent's onPointerMove. */
  mouseNDCRef: React.RefObject<{ x: number; y: number }>;
  /** Camera parallax target updated by the parent's onPointerMove. */
  camTargetRef: React.RefObject<{ x: number; y: number }>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * R3F inner scene — no Canvas. Drop this inside a <Canvas> element.
 * Builds the same particle network as the original HeroScene but declarative:
 * useMemo owns geometry/material lifetime, useFrame drives the animation tick.
 */
export default function ParticleScene({
  particleCount,
  speedMult,
  connectDist,
  palette,
  mouseAttraction,
  mouseNDCRef,
  camTargetRef,
}: ParticleSceneProps) {
  const { camera } = useThree();
  const starCount = Math.max(1, Math.floor(particleCount * 0.14));

  // Refs updated synchronously each render so useFrame always reads fresh values
  // without stale closures. (These are plain assignments, not setState calls.)
  const speedRef = useRef(speedMult);
  speedRef.current = speedMult;
  const connectDistRef = useRef(connectDist);
  connectDistRef.current = connectDist;
  const attractRef = useRef(mouseAttraction);
  attractRef.current = mouseAttraction;

  // Scratch THREE objects reused every frame to avoid per-frame allocations.
  const raycaster = useRef(new THREE.Raycaster());
  const mousePlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const mouseWorld = useRef(new THREE.Vector3());
  const diff = useRef(new THREE.Vector3());

  // Build all THREE scene objects. Rebuilt only when particleCount or palette changes.
  const sceneObj = useMemo(() => {
    const particles: Particle[] = [
      ...Array.from({ length: starCount }, () => makeParticle(true, palette)),
      ...Array.from({ length: particleCount - starCount }, () =>
        makeParticle(false, palette),
      ),
    ];
    const starPs = particles.slice(0, starCount);
    const smallPs = particles.slice(starCount);

    const starGeo = buildPointsGeo(starPs);
    const smallGeo = buildPointsGeo(smallPs);

    const MAX_PAIRS = (particleCount * (particleCount - 1)) / 2;
    const linePosArr = new Float32Array(MAX_PAIRS * 6);
    const lineColArr = new Float32Array(MAX_PAIRS * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(linePosArr, 3).setUsage(THREE.DynamicDrawUsage),
    );
    lineGeo.setAttribute(
      "color",
      new THREE.BufferAttribute(lineColArr, 3).setUsage(THREE.DynamicDrawUsage),
    );
    lineGeo.setDrawRange(0, 0);

    const starMat = new THREE.PointsMaterial({
      size: DOT_STAR,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });
    const smallMat = new THREE.PointsMaterial({
      size: DOT_SMALL,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    });

    const starPoints = new THREE.Points(starGeo, starMat);
    const smallPoints = new THREE.Points(smallGeo, smallMat);
    const lineSegments = new THREE.LineSegments(lineGeo, lineMat);

    return {
      particles,
      starPs,
      smallPs,
      starPoints,
      smallPoints,
      lineSegments,
      lineGeo,
      linePosArr,
      lineColArr,
    };
  }, [particleCount, starCount, palette]);

  // Dispose THREE objects when they're replaced (particleCount/palette change) or unmounted.
  useEffect(() => {
    return () => {
      sceneObj.starPoints.geometry.dispose();
      sceneObj.smallPoints.geometry.dispose();
      sceneObj.lineGeo.dispose();
      (sceneObj.starPoints.material as THREE.Material).dispose();
      (sceneObj.smallPoints.material as THREE.Material).dispose();
      (sceneObj.lineSegments.material as THREE.Material).dispose();
    };
  }, [sceneObj]);

  useFrame(() => {
    const { particles, starPs, smallPs, lineGeo, linePosArr, lineColArr } = sceneObj;
    const cDistSq = connectDistRef.current * connectDistRef.current;
    const spd = speedRef.current;

    // Camera parallax — lerp toward the mouse target.
    const ct = camTargetRef.current;
    if (ct) {
      camera.position.x += (ct.x * CAM_PARALLAX - camera.position.x) * CAM_LERP;
      camera.position.y += (ct.y * CAM_PARALLAX - camera.position.y) * CAM_LERP;
      camera.lookAt(0, 0, 0);
    }

    // Unproject mouse NDC onto the z=0 plane to get world-space attraction point.
    const ndc = mouseNDCRef.current;
    if (ndc) {
      raycaster.current.setFromCamera(
        new THREE.Vector2(ndc.x, ndc.y),
        camera,
      );
      raycaster.current.ray.intersectPlane(mousePlane.current, mouseWorld.current);
    }

    // Particle physics tick.
    for (const p of particles) {
      if (attractRef.current) {
        diff.current.set(
          mouseWorld.current.x - p.pos.x,
          mouseWorld.current.y - p.pos.y,
          0,
        );
        const dSq = diff.current.lengthSq();
        if (dSq < MOUSE_RADIUS_SQ && dSq > 0.01) {
          const strength = (1 - dSq / MOUSE_RADIUS_SQ) * MOUSE_FORCE;
          p.vel.addScaledVector(diff.current.normalize(), strength);
        }
      }

      const vel = p.vel.length();
      const maxSpd = (p.isStar ? BASE_SPEED * 1.8 : BASE_SPEED * 3.5) * spd;
      if (vel > maxSpd) p.vel.multiplyScalar(maxSpd / vel);

      const rx = p.pos.x;
      const ry = p.pos.y;
      const rLen = Math.sqrt(rx * rx + ry * ry);
      if (rLen > 0.1) {
        p.vel.x += (-ry / rLen) * ORBIT_STRENGTH * spd;
        p.vel.y += (rx / rLen) * ORBIT_STRENGTH * spd;
      }

      p.pos.add(p.vel);
      p.pos.x = wrap(p.pos.x, HALF_W);
      p.pos.y = wrap(p.pos.y, HALF_H);
      p.pos.z = wrap(p.pos.z, HALF_D);
    }

    // Sync Points buffer attributes.
    const syncPts = (pts: Particle[], geo: THREE.BufferGeometry) => {
      const attr = geo.attributes.position as THREE.BufferAttribute;
      pts.forEach((p, i) => attr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z));
      attr.needsUpdate = true;
    };
    syncPts(starPs, sceneObj.starPoints.geometry);
    syncPts(smallPs, sceneObj.smallPoints.geometry);

    // Rebuild line buffer.
    let lineCount = 0;
    const pc = particles.length;
    for (let i = 0; i < pc - 1; i++) {
      const pi = particles[i];
      for (let j = i + 1; j < pc; j++) {
        const pj = particles[j];
        const dx = pi.pos.x - pj.pos.x;
        const dy = pi.pos.y - pj.pos.y;
        const dz = pi.pos.z - pj.pos.z;
        const dSq = dx * dx + dy * dy + dz * dz;
        if (dSq >= cDistSq) continue;
        const fade = 1 - dSq / cDistSq;
        const b = lineCount * 6;
        linePosArr[b] = pi.pos.x;
        linePosArr[b + 1] = pi.pos.y;
        linePosArr[b + 2] = pi.pos.z;
        linePosArr[b + 3] = pj.pos.x;
        linePosArr[b + 4] = pj.pos.y;
        linePosArr[b + 5] = pj.pos.z;
        lineColArr[b] = pi.color.r * fade;
        lineColArr[b + 1] = pi.color.g * fade;
        lineColArr[b + 2] = pi.color.b * fade;
        lineColArr[b + 3] = pj.color.r * fade;
        lineColArr[b + 4] = pj.color.g * fade;
        lineColArr[b + 5] = pj.color.b * fade;
        lineCount++;
      }
    }
    (lineGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (lineGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    lineGeo.setDrawRange(0, lineCount * 2);
  });

  return (
    <>
      <primitive object={sceneObj.starPoints} />
      <primitive object={sceneObj.smallPoints} />
      <primitive object={sceneObj.lineSegments} />
    </>
  );
}
