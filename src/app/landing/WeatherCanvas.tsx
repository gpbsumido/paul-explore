"use client";

import { useRef, useEffect } from "react";
import { useWeatherContext } from "@/contexts/WeatherContext";
import type { WeatherCondition } from "@/hooks/useWeather";
import { WaveSim, HERO_COLORS } from "./waveSim";

// ---------------------------------------------------------------------------
// Shared effect interface
// ---------------------------------------------------------------------------

interface Effect {
  update(frame: number, w: number, h: number): void;
  render(ctx: CanvasRenderingContext2D, w: number, h: number): void;
  setMouse(x: number, y: number): void;
  clearMouse(): void;
  resize(w: number, h: number): void;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// RAIN: full-screen water-ripple simulation (delegates to shared WaveSim)
// ---------------------------------------------------------------------------

const R_DROPS = 4; // automatic drops per frame
const R_DS = 280; // rain-drop disturbance strength

function createRainEffect(w: number, h: number): Effect {
  const sim = new WaveSim(w, h, { disturbRadius: 8 });
  let mx = -1,
    my = -1,
    lx = -1,
    ly = -1;

  return {
    update() {
      // Mouse disturbance
      if (mx >= 0) {
        const sx = Math.floor(mx / sim.scale);
        const sy = Math.floor(my / sim.scale);
        if (sx !== lx || sy !== ly) {
          sim.disturb(sx, sy, sim.disturbStrength);
          lx = sx;
          ly = sy;
        }
      }
      // Rain drops
      for (let i = 0; i < R_DROPS; i++) {
        sim.disturb(
          1 + Math.floor(Math.random() * (sim.simW - 2)),
          1 + Math.floor(Math.random() * (sim.simH - 2)),
          R_DS,
        );
      }
      sim.propagate();
    },
    render(ctx, cw, ch) {
      sim.renderPhong(ctx, cw, ch, HERO_COLORS);
    },
    setMouse(x, y) {
      mx = x;
      my = y;
    },
    clearMouse() {
      mx = -1;
      my = -1;
      lx = -1;
      ly = -1;
    },
    resize(nw, nh) {
      sim.resize(nw, nh);
    },
    dispose() {},
  };
}

// ---------------------------------------------------------------------------
// CLEAR: lens-flare sun that follows the cursor
// ---------------------------------------------------------------------------

function createClearEffect(): Effect {
  let sunX = 0.5,
    sunY = 0.28; // normalised (0-1)
  let tgtX = 0.5,
    tgtY = 0.28;
  let mnx = -1,
    mny = -1; // normalised mouse, -1 = absent
  let idleA = 0;
  let rayA = 0;

  return {
    update() {
      idleA += 0.0015;
      rayA += 0.003;
      if (mnx >= 0) {
        tgtX = mnx;
        tgtY = mny;
      } else {
        tgtX = 0.5 + Math.cos(idleA) * 0.28;
        tgtY = 0.22 + Math.sin(idleA * 0.55) * 0.06;
      }
      sunX += (tgtX - sunX) * 0.04;
      sunY += (tgtY - sunY) * 0.04;
    },
    render(ctx, w, h) {
      // Warm near-black base
      ctx.fillStyle = "#060401";
      ctx.fillRect(0, 0, w, h);

      const sx = sunX * w,
        sy = sunY * h;
      const minD = Math.min(w, h);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // Vast diffuse ambient warmth
      const g0 = ctx.createRadialGradient(sx, sy, 0, sx, sy, minD * 0.9);
      g0.addColorStop(0, "rgba(70, 50, 8, 0.35)");
      g0.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g0;
      ctx.fillRect(0, 0, w, h);

      // Main golden glow
      const g1 = ctx.createRadialGradient(sx, sy, 0, sx, sy, minD * 0.28);
      g1.addColorStop(0, "rgba(200, 150, 30, 0.55)");
      g1.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // Inner bright bloom
      const g2 = ctx.createRadialGradient(sx, sy, 0, sx, sy, 90);
      g2.addColorStop(0, "rgba(255, 220, 120, 0.9)");
      g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // White-hot core
      const g3 = ctx.createRadialGradient(sx, sy, 0, sx, sy, 22);
      g3.addColorStop(0, "rgba(255, 255, 230, 1.0)");
      g3.addColorStop(0.5, "rgba(255, 210, 80, 0.5)");
      g3.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      // Star rays, 12 radiating lines slowly rotating
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(rayA);
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const len = [180, 90, 130, 70, 160, 80, 140, 75, 155, 85, 120, 65][i];
        const grad = ctx.createLinearGradient(
          0,
          0,
          Math.cos(ang) * len,
          Math.sin(ang) * len,
        );
        grad.addColorStop(
          0,
          `rgba(255, 230, 130, ${i % 3 === 0 ? 0.55 : 0.3})`,
        );
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = i % 3 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
        ctx.stroke();
      }
      ctx.restore();

      // Lens-flare axis: secondary glints along the sun -> screen-centre line
      const cx = w * 0.5,
        cy = h * 0.5;
      const ax = cx - sx,
        ay = cy - sy;

      const flares: { d: number; r: number; color: string }[] = [
        { d: 0.25, r: 28, color: "rgba(255, 190, 60, 0.38)" },
        { d: 0.55, r: 70, color: "rgba(60, 100, 255, 0.18)" },
        { d: 0.8, r: 22, color: "rgba(255, 240, 160, 0.45)" },
        { d: 1.1, r: 55, color: "rgba(160, 60, 255, 0.14)" },
        { d: 1.4, r: 18, color: "rgba(255, 255, 200, 0.50)" },
        { d: 1.7, r: 38, color: "rgba(60, 200, 255, 0.20)" },
      ];
      for (const f of flares) {
        const fx = sx + ax * f.d,
          fy = sy + ay * f.d;
        const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, f.r);
        fg.addColorStop(0, f.color);
        fg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    },
    setMouse(x, y) {
      mnx = x / (window.innerWidth ?? 1920);
      mny = y / (window.innerHeight ?? 1080);
    },
    clearMouse() {
      mnx = -1;
      mny = -1;
    },
    resize() {},
    dispose() {},
  };
}

// ---------------------------------------------------------------------------
// STORM: recursive lightning bolts + atmospheric purple glow
// ---------------------------------------------------------------------------

interface BoltSeg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
interface Bolt {
  segs: BoltSeg[];
  life: number;
  maxLife: number;
  isBranch: boolean;
}

function buildBolt(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  depth: number,
  out: BoltSeg[],
  branch = false,
) {
  if (depth === 0) {
    out.push({ x1, y1, x2, y2 });
    return;
  }
  const dx = x2 - x1,
    dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.001) return;
  const nx = -dy / len,
    ny = dx / len; // perpendicular
  const off = (Math.random() - 0.5) * len * 0.5;
  const midx = (x1 + x2) * 0.5 + nx * off;
  const midy = (y1 + y2) * 0.5 + ny * off;
  buildBolt(x1, y1, midx, midy, depth - 1, out, branch);
  buildBolt(midx, midy, x2, y2, depth - 1, out, branch);
  if (!branch && depth >= 3 && Math.random() < 0.38) {
    const bAng = Math.atan2(y2 - y1, x2 - x1) + (Math.random() - 0.5) * 1.6;
    const bLen = len * (0.25 + Math.random() * 0.35);
    buildBolt(
      midx,
      midy,
      midx + Math.cos(bAng) * bLen,
      midy + Math.sin(bAng) * bLen,
      depth - 2,
      out,
      true,
    );
  }
}

function createStormEffect(): Effect {
  let bolts: Bolt[] = [];
  let flash = 0;
  let mnx = 0.5,
    mny = 0.6;
  let nextStrikeAt = 80;
  let pulseT = 0;

  return {
    update(frame) {
      pulseT += 0.018;
      flash *= 0.82;
      bolts = bolts.filter((b) => b.life-- > 0);

      if (frame >= nextStrikeAt) {
        const startX = 0.15 + Math.random() * 0.7;
        const endX = mnx + (Math.random() - 0.5) * 0.25;
        const endY = mny + Math.random() * 0.15;
        const segs: BoltSeg[] = [];
        buildBolt(startX, -0.02, endX, Math.min(endY, 0.92), 5, segs);
        bolts.push({ segs, life: 14, maxLife: 14, isBranch: false });
        flash = 1.0;
        nextStrikeAt = frame + 100 + Math.floor(Math.random() * 180);
      }
    },
    render(ctx, w, h) {
      // Background: deep violet-black, slightly transparent for trail
      ctx.fillStyle =
        flash > 0.08
          ? `rgba(6, 2, 18, ${0.5 - flash * 0.3})`
          : "rgba(6, 2, 18, 0.92)";
      ctx.fillRect(0, 0, w, h);

      // Atmospheric flash overlay
      if (flash > 0.04) {
        ctx.fillStyle = `rgba(160, 140, 255, ${flash * 0.22})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Pulsing ambient purple glow
      const pulse = 0.025 + Math.sin(pulseT) * 0.012;
      const ag = ctx.createRadialGradient(
        w * mnx,
        h * mny,
        0,
        w * mnx,
        h * mny,
        Math.min(w, h) * 0.65,
      );
      ag.addColorStop(0, `rgba(80, 50, 200, ${pulse})`);
      ag.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ag;
      ctx.fillRect(0, 0, w, h);

      // Lightning bolts
      for (const bolt of bolts) {
        const t = bolt.life / bolt.maxLife;
        ctx.save();
        ctx.globalAlpha = t;

        // Outer glow
        ctx.strokeStyle = `rgba(140, 110, 255, 0.3)`;
        ctx.lineWidth = bolt.isBranch ? 4 : 8;
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#7060ff";
        ctx.beginPath();
        for (const s of bolt.segs) {
          ctx.moveTo(s.x1 * w, s.y1 * h);
          ctx.lineTo(s.x2 * w, s.y2 * h);
        }
        ctx.stroke();

        // Inner bright core
        ctx.strokeStyle = `rgba(220, 210, 255, 0.95)`;
        ctx.lineWidth = bolt.isBranch ? 1 : 1.5;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#e0d8ff";
        ctx.beginPath();
        for (const s of bolt.segs) {
          ctx.moveTo(s.x1 * w, s.y1 * h);
          ctx.lineTo(s.x2 * w, s.y2 * h);
        }
        ctx.stroke();

        ctx.restore();
      }
    },
    setMouse(x, y) {
      mnx = x / (window.innerWidth ?? 1920);
      mny = y / (window.innerHeight ?? 1080);
    },
    clearMouse() {},
    resize() {},
    dispose() {},
  };
}

// ---------------------------------------------------------------------------
// SNOW: layered particle snowfall with pre-rendered sprites
// ---------------------------------------------------------------------------

interface Flake {
  x: number;
  y: number;
  size: number;
  vy: number;
  driftFreq: number;
  driftAmp: number;
  phase: number;
  bucket: number; // index into the sprite array
}

// Size buckets for snowflake sprites, avoids per-frame gradient allocation.
const SNOW_BUCKETS = [1.2, 2.0, 3.0, 4.5, 5.5];

/** Pre-renders a soft radial dot of `radius` px onto an offscreen canvas. */
function makeFlakeSprite(radius: number): HTMLCanvasElement {
  const size = Math.ceil(radius * 2 + 2);
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const cx = size / 2,
    cy = size / 2;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0, "rgba(230, 240, 255, 1)");
  g.addColorStop(1, "rgba(180, 200, 255, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

function createSnowEffect(w: number, h: number): Effect {
  const sprites = SNOW_BUCKETS.map(makeFlakeSprite);

  function mkFlake(): Flake {
    const layer = Math.random();
    const size =
      layer < 0.33
        ? 1 + Math.random() * 1.2
        : layer < 0.66
          ? 1.5 + Math.random() * 2
          : 2.5 + Math.random() * 3;
    // Map to nearest bucket
    let bucket = 0;
    let bestDist = Math.abs(size - SNOW_BUCKETS[0]);
    for (let i = 1; i < SNOW_BUCKETS.length; i++) {
      const d = Math.abs(size - SNOW_BUCKETS[i]);
      if (d < bestDist) {
        bestDist = d;
        bucket = i;
      }
    }
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      size,
      vy: 0.3 + size * 0.35,
      driftFreq: 0.006 + Math.random() * 0.008,
      driftAmp: 0.3 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      bucket,
    };
  }

  let flakes: Flake[] = Array.from({ length: 260 }, mkFlake);
  let time = 0;

  return {
    update(_frame, cw, ch) {
      time++;
      for (const f of flakes) {
        f.y += f.vy;
        f.x += Math.sin(time * f.driftFreq + f.phase) * f.driftAmp;
        f.x += 0.12; // gentle rightward wind
        if (f.y > ch + f.size) {
          f.y = -f.size;
          f.x = Math.random() * cw;
        }
        if (f.x > cw + f.size) f.x = -f.size;
        if (f.x < -f.size) f.x = cw + f.size;
      }
    },
    render(ctx, w, h) {
      // Deep cold night sky
      ctx.fillStyle = "rgba(2, 5, 18, 0.92)";
      ctx.fillRect(0, 0, w, h);

      // Subtle pale moonlight from upper right
      const mg = ctx.createRadialGradient(
        w * 0.82,
        h * 0.08,
        0,
        w * 0.82,
        h * 0.08,
        Math.min(w, h) * 0.55,
      );
      mg.addColorStop(0, "rgba(190, 210, 255, 0.055)");
      mg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = mg;
      ctx.fillRect(0, 0, w, h);

      // Snowflakes via pre-rendered sprites
      for (const f of flakes) {
        const alpha = 0.55 + Math.min(f.size / 6, 1) * 0.4;
        const sprite = sprites[f.bucket];
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, f.x - sprite.width / 2, f.y - sprite.height / 2);
      }
      ctx.globalAlpha = 1;
    },
    setMouse() {},
    clearMouse() {},
    resize(nw, nh) {
      flakes = flakes.map((f) => ({
        ...f,
        x: Math.random() * nw,
        y: Math.random() * nh,
      }));
    },
    dispose() {},
  };
}

// ---------------------------------------------------------------------------
// PARTLY-CLOUDY: drifting soft cloud wisps with pre-rendered sprites
// ---------------------------------------------------------------------------

interface Cloud {
  x: number;
  y: number;
  rx: number;
  ry: number;
  alpha: number;
  speed: number;
  sprite: HTMLCanvasElement;
}

/** Pre-renders a single elliptical cloud wisp to an offscreen canvas. */
function makeCloudSprite(
  rx: number,
  ry: number,
  alpha: number,
): HTMLCanvasElement {
  const pad = 4;
  const cw = Math.ceil(rx * 2 + pad * 2);
  const ch = Math.ceil(ry * 2 + pad * 2);
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d")!;
  const cx = cw / 2,
    cy = ch / 2;

  // Scale to make an ellipse from a circle
  ctx.save();
  ctx.scale(1, ry / rx);
  const scaledCy = cy * (rx / ry);

  // Outer soft halo
  const outer = ctx.createRadialGradient(
    cx,
    scaledCy,
    rx * 0.3,
    cx,
    scaledCy,
    rx,
  );
  outer.addColorStop(0, `rgba(160, 175, 210, ${alpha * 0.5})`);
  outer.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(cx, scaledCy, rx, 0, Math.PI * 2);
  ctx.fill();

  // Bright inner core
  const inner = ctx.createRadialGradient(
    cx,
    scaledCy,
    0,
    cx,
    scaledCy,
    rx * 0.55,
  );
  inner.addColorStop(0, `rgba(210, 220, 240, ${alpha})`);
  inner.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.arc(cx, scaledCy, rx * 0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  return c;
}

function createCloudEffect(w: number, h: number): Effect {
  function mkCloud(): Cloud {
    const rx = w * (0.15 + Math.random() * 0.3);
    const ry = h * (0.07 + Math.random() * 0.1);
    const alpha = 0.18 + Math.random() * 0.22;
    return {
      x: Math.random() * w,
      y: h * (0.08 + Math.random() * 0.55),
      rx,
      ry,
      alpha,
      speed: 0.04 + Math.random() * 0.1,
      sprite: makeCloudSprite(rx, ry, alpha),
    };
  }

  let clouds: Cloud[] = Array.from({ length: 14 }, mkCloud);

  return {
    update(_frame, cw) {
      for (const c of clouds) {
        c.x += c.speed;
        if (c.x - c.rx > cw * 1.2) c.x = -c.rx * 1.5;
      }
    },
    render(ctx, w, h) {
      ctx.fillStyle = "rgba(3, 6, 14, 0.92)";
      ctx.fillRect(0, 0, w, h);

      // Moonlit sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
      sky.addColorStop(0, "rgba(14, 22, 45, 0.6)");
      sky.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Draw pre-rendered cloud sprites
      for (const c of clouds) {
        ctx.drawImage(
          c.sprite,
          c.x - c.sprite.width / 2,
          c.y - c.sprite.height / 2,
        );
      }
    },
    setMouse() {},
    clearMouse() {},
    resize(nw, nh) {
      clouds = Array.from({ length: 14 }, () => {
        const rx = nw * (0.15 + Math.random() * 0.3);
        const ry = nh * (0.07 + Math.random() * 0.1);
        const alpha = 0.18 + Math.random() * 0.22;
        return {
          x: Math.random() * nw,
          y: nh * (0.08 + Math.random() * 0.55),
          rx,
          ry,
          alpha,
          speed: 0.04 + Math.random() * 0.1,
          sprite: makeCloudSprite(rx, ry, alpha),
        };
      });
    },
    dispose() {},
  };
}

// ---------------------------------------------------------------------------
// FOG: layered horizontal mist bands
// ---------------------------------------------------------------------------

function createFogEffect(): Effect {
  const BANDS = 10;
  const bands = Array.from({ length: BANDS }, (_, i) => ({
    y: 0.05 + (i / BANDS) * 1.0,
    // denser toward the middle and bottom
    alpha: 0.1 + (i / BANDS) * 0.18,
    speed: (i % 2 === 0 ? 1 : -1) * (0.0002 + Math.random() * 0.0003),
    offsetX: Math.random() * Math.PI * 2,
    wave: 0.0008 + Math.random() * 0.0012,
    widthMul: 0.9 + Math.random() * 0.5,
  }));
  let time = 0;

  return {
    update() {
      time++;
    },
    render(ctx, w, h) {
      // Dark blue-grey base, foggy night
      ctx.fillStyle = "rgba(14, 17, 22, 0.95)";
      ctx.fillRect(0, 0, w, h);

      // Diffuse ambient haze
      const ambient = ctx.createLinearGradient(0, 0, 0, h);
      ambient.addColorStop(0, "rgba(110, 120, 135, 0.07)");
      ambient.addColorStop(0.4, "rgba(130, 140, 155, 0.12)");
      ambient.addColorStop(1, "rgba(150, 158, 170, 0.18)");
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, w, h);

      // Fog bands
      for (const b of bands) {
        const cx = w / 2 + Math.sin(time * b.wave + b.offsetX) * w * 0.25;
        const cy = b.y * h;
        const rw = w * b.widthMul;
        const rh = h * 0.22;

        const scaleY = rh / (rw * 0.5);
        const cyScaled = cy / scaleY;

        const fg = ctx.createRadialGradient(
          cx,
          cyScaled,
          0,
          cx,
          cyScaled,
          rw * 0.5,
        );
        fg.addColorStop(0, `rgba(165, 175, 188, ${b.alpha})`);
        fg.addColorStop(0.5, `rgba(140, 150, 165, ${b.alpha * 0.5})`);
        fg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = fg;
        ctx.save();
        ctx.scale(1, scaleY);
        ctx.beginPath();
        ctx.arc(cx, cyScaled, rw * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Thin bright streak near the horizon to suggest filtered light
      const horizon = ctx.createLinearGradient(0, h * 0.38, 0, h * 0.52);
      horizon.addColorStop(0, "rgba(0,0,0,0)");
      horizon.addColorStop(0.5, "rgba(180, 190, 200, 0.05)");
      horizon.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = horizon;
      ctx.fillRect(0, h * 0.38, w, h * 0.14);
    },
    setMouse() {},
    clearMouse() {},
    resize() {},
    dispose() {},
  };
}

// ---------------------------------------------------------------------------
// Factory: pick the right effect for the current weather condition
// ---------------------------------------------------------------------------

function createEffect(
  condition: WeatherCondition,
  w: number,
  h: number,
): Effect {
  switch (condition) {
    case "clear":
      return createClearEffect();
    case "partly-cloudy":
      return createCloudEffect(w, h);
    case "fog":
      return createFogEffect();
    case "snow":
      return createSnowEffect(w, h);
    case "storm":
      return createStormEffect();
    case "rain":
    case "unknown":
    default:
      return createRainEffect(w, h);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WeatherCanvas({ className }: { className?: string }) {
  const { activeCondition, enabled, loading, selectedEffect } =
    useWeatherContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!enabled || (loading && selectedEffect === "auto")) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Size the canvas to the viewport
    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    const effect = createEffect(activeCondition, canvas.width, canvas.height);
    let frame = 0;
    let animId: number;

    const onResize = () => {
      setSize();
      effect.resize(canvas.width, canvas.height);
    };
    window.addEventListener("resize", onResize, { passive: true });

    // Visibility gating: pause the RAF loop when scrolled out of view.
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onMouse = (e: MouseEvent) => effect.setMouse(e.clientX, e.clientY);
    const onLeave = () => effect.clearMouse();
    window.addEventListener("mousemove", onMouse, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    const loop = () => {
      animId = requestAnimationFrame(loop);
      if (document.hidden || !isVisibleRef.current) return;
      frame++;
      const { width: w, height: h } = canvas;
      effect.update(frame, w, h);
      effect.render(ctx, w, h);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      document.removeEventListener("mouseleave", onLeave);
      effect.dispose();
    };
  }, [activeCondition, enabled, loading, selectedEffect]);

  return <canvas ref={canvasRef} className={className} />;
}
