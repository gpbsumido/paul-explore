"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// ---- config ----

// Total particles. First STAR_COUNT are bigger "anchor" nodes, rest are small.
const PARTICLE_COUNT = 160;
const STAR_COUNT = 22;

// Particles closer than this get a line drawn between them.
const CONNECT_DIST = 3.6;
const CONNECT_DIST_SQ = CONNECT_DIST * CONNECT_DIST;

// Pre-allocate the line buffer for the worst-case pair count.
// In practice only a fraction of pairs are close enough to draw.
const MAX_PAIRS = (PARTICLE_COUNT * (PARTICLE_COUNT - 1)) / 2;

// Scene half-extents. Particles wrap back around when they leave these bounds.
const HALF_W = 8.5;
const HALF_H = 5.5;
const HALF_D = 3.0;

// Tangential nudge added to each particle per frame. Causes the whole field
// to slowly rotate around the center without any explicit orbit system.
const ORBIT_STRENGTH = 0.0008;

// Base random speed for new particles.
const BASE_SPEED = 0.006;

// Mouse pulls particles within this radius toward the cursor each frame.
const MOUSE_RADIUS = 4.2;
const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;
const MOUSE_FORCE = 0.01;

// How far the camera drifts on mouse move and how quickly it catches up.
const CAM_PARALLAX = 0.55;
const CAM_LERP = 0.045;

// Dot sizes in screen pixels. Not affected by depth (sizeAttenuation: false)
// because we want a crisp pixel look, not a perspective-scaled blob.
const DOT_STAR = 3.5;
const DOT_SMALL = 2.0;

// Color palette: blue, indigo, violet, cyan.
const PALETTE: THREE.Color[] = [
  new THREE.Color("#3b82f6"),
  new THREE.Color("#6366f1"),
  new THREE.Color("#8b5cf6"),
  new THREE.Color("#06b6d4"),
];

// ---- types ----

type Particle = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  isStar: boolean;
};

// ---- helpers ----

/**
 * Wraps a value back into [-half, half]. Same idea as pac-man screen wrapping.
 * Particles that drift off one edge reappear on the opposite side.
 */
function wrap(v: number, half: number): number {
  if (v > half) return -half;
  if (v < -half) return half;
  return v;
}

/**
 * Creates one particle at a random position with a random velocity that has
 * a slight tangential bias, so particles naturally want to orbit the center
 * rather than just drifting in straight lines.
 *
 * Star particles move slower and act as the visible "hub" nodes in the network.
 */
function makeParticle(star: boolean): Particle {
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

  // Tangent to the XY radial direction, so the nudge pushes sideways
  // rather than toward or away from center. That's what creates the swirl.
  const rx = pos.x;
  const ry = pos.y;
  const rLen = Math.sqrt(rx * rx + ry * ry) || 1;
  vel.x += (-ry / rLen) * ORBIT_STRENGTH * (star ? 0.5 : 1);
  vel.y += (rx / rLen) * ORBIT_STRENGTH * (star ? 0.5 : 1);

  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)].clone();

  return { pos, vel, color, isStar: star };
}

/**
 * Builds a Points BufferGeometry from a particle list. Returns the geometry
 * with position and color attributes already filled in. The caller is
 * responsible for disposing it.
 */
function buildPointsGeo(pts: Particle[]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(pts.length * 3);
  const colors = new Float32Array(pts.length * 3);
  pts.forEach((p, i) => {
    positions[i * 3] = p.pos.x;
    positions[i * 3 + 1] = p.pos.y;
    positions[i * 3 + 2] = p.pos.z;
    colors[i * 3] = p.color.r;
    colors[i * 3 + 1] = p.color.g;
    colors[i * 3 + 2] = p.color.b;
  });
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

// ---- component ----

/**
 * Full-viewport Three.js canvas placed absolutely behind the hero text.
 * Renders a particle network where nodes orbit the center and connect to
 * nearby neighbors with fading lines. Moving the mouse pulls particles
 * toward the cursor, clustering them into a dense web of connections.
 *
 * Pointer events are off so it never interferes with hero button clicks.
 */
export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      80,
    );
    camera.position.z = 10;

    const syncSize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    syncSize();

    // Build the particle list. Stars come first so their index range is predictable.
    const particles: Particle[] = [
      ...Array.from({ length: STAR_COUNT }, () => makeParticle(true)),
      ...Array.from({ length: PARTICLE_COUNT - STAR_COUNT }, () => makeParticle(false)),
    ];
    const starParticles = particles.slice(0, STAR_COUNT);
    const smallParticles = particles.slice(STAR_COUNT);

    // Two separate Points objects so stars can have a bigger dot size.
    const starGeo = buildPointsGeo(starParticles);
    const smallGeo = buildPointsGeo(smallParticles);

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

    scene.add(new THREE.Points(starGeo, starMat));
    scene.add(new THREE.Points(smallGeo, smallMat));

    // Pre-allocated line buffers. We write into these every frame and update
    // drawRange so the GPU only draws the lines that actually exist this tick.
    // DynamicDrawUsage tells the driver to expect frequent writes.
    const linePosArr = new Float32Array(MAX_PAIRS * 6); // 2 verts * 3 floats
    const lineColArr = new Float32Array(MAX_PAIRS * 6);
    const lineGeo = new THREE.BufferGeometry();
    const linePosAttr = new THREE.BufferAttribute(linePosArr, 3).setUsage(
      THREE.DynamicDrawUsage,
    );
    const lineColAttr = new THREE.BufferAttribute(lineColArr, 3).setUsage(
      THREE.DynamicDrawUsage,
    );
    lineGeo.setAttribute("position", linePosAttr);
    lineGeo.setAttribute("color", lineColAttr);
    lineGeo.setDrawRange(0, 0);

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    // Mouse world position. We unproject the cursor onto a plane at z=0 so
    // the attraction radius is in the same coordinate space as the particles.
    const mouseWorld = new THREE.Vector3(0, 0, 0);
    const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const raycaster = new THREE.Raycaster();
    const _diff = new THREE.Vector3(); // reused every frame, avoids allocations

    let camTargetX = 0;
    let camTargetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const ndc = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1),
      );
      raycaster.setFromCamera(ndc, camera);
      raycaster.ray.intersectPlane(mousePlane, mouseWorld);
      camTargetX = (e.clientX / window.innerWidth - 0.5) * CAM_PARALLAX;
      camTargetY = -((e.clientY / window.innerHeight) - 0.5) * CAM_PARALLAX;
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const ndc = new THREE.Vector2(
        (t.clientX / window.innerWidth) * 2 - 1,
        -((t.clientY / window.innerHeight) * 2 - 1),
      );
      raycaster.setFromCamera(ndc, camera);
      raycaster.ray.intersectPlane(mousePlane, mouseWorld);
      camTargetX = (t.clientX / window.innerWidth - 0.5) * CAM_PARALLAX;
      camTargetY = -((t.clientY / window.innerHeight) - 0.5) * CAM_PARALLAX;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("resize", syncSize);

    let rafId = 0;

    const tick = () => {
      rafId = requestAnimationFrame(tick);

      // Camera parallax, eased toward the mouse target.
      camera.position.x += (camTargetX - camera.position.x) * CAM_LERP;
      camera.position.y += (camTargetY - camera.position.y) * CAM_LERP;
      camera.lookAt(scene.position);

      // Update each particle position.
      for (const p of particles) {
        // Pull toward mouse cursor if within radius.
        _diff.set(mouseWorld.x - p.pos.x, mouseWorld.y - p.pos.y, 0);
        const distSq = _diff.lengthSq();
        if (distSq < MOUSE_RADIUS_SQ && distSq > 0.01) {
          const strength = (1 - distSq / MOUSE_RADIUS_SQ) * MOUSE_FORCE;
          p.vel.addScaledVector(_diff.normalize(), strength);
        }

        // Speed cap so particles don't shoot off into space after being
        // pulled hard by the mouse.
        const spd = p.vel.length();
        const maxSpd = p.isStar ? BASE_SPEED * 1.8 : BASE_SPEED * 3.5;
        if (spd > maxSpd) p.vel.multiplyScalar(maxSpd / spd);

        // Orbital tangent nudge, applied every frame to maintain the swirl.
        const rx = p.pos.x;
        const ry = p.pos.y;
        const rLen = Math.sqrt(rx * rx + ry * ry);
        if (rLen > 0.1) {
          p.vel.x += (-ry / rLen) * ORBIT_STRENGTH;
          p.vel.y += (rx / rLen) * ORBIT_STRENGTH;
        }

        p.pos.add(p.vel);
        p.pos.x = wrap(p.pos.x, HALF_W);
        p.pos.y = wrap(p.pos.y, HALF_H);
        p.pos.z = wrap(p.pos.z, HALF_D);
      }

      // Sync Points buffer attributes to the new particle positions.
      const syncPoints = (pts: Particle[], geo: THREE.BufferGeometry) => {
        const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
        pts.forEach((p, i) => posAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z));
        posAttr.needsUpdate = true;
      };
      syncPoints(starParticles, starGeo);
      syncPoints(smallParticles, smallGeo);

      // Rebuild the line buffer for this frame. We check all N*(N-1)/2 pairs
      // and write positions and fade-adjusted colors for nearby ones.
      let lineCount = 0;
      for (let i = 0; i < PARTICLE_COUNT - 1; i++) {
        const pi = particles[i];
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          const pj = particles[j];
          const dx = pi.pos.x - pj.pos.x;
          const dy = pi.pos.y - pj.pos.y;
          const dz = pi.pos.z - pj.pos.z;
          const dSq = dx * dx + dy * dy + dz * dz;
          if (dSq >= CONNECT_DIST_SQ) continue;

          // The line fades to black as the particles drift apart, so
          // connections look bright when particles cluster and dim as they separate.
          const fade = 1 - dSq / CONNECT_DIST_SQ;
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

      linePosAttr.needsUpdate = true;
      lineColAttr.needsUpdate = true;
      lineGeo.setDrawRange(0, lineCount * 2);

      renderer.render(scene, camera);
    };

    tick();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", syncSize);
      [starGeo, smallGeo, lineGeo].forEach((g) => g.dispose());
      [starMat, smallMat, lineMat].forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
