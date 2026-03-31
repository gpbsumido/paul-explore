/**
 * Shared 2D wave simulation kernel used by both the WaterRipple component
 * and the rain effect in WeatherCanvas.
 *
 * The physics is the discrete wave equation: each cell's new height is the
 * average of its four neighbors minus its previous height, then damped by
 * h -= h >> dampingShift (multiply by (2^shift - 1) / 2^shift per frame).
 *
 * Two Int32Array buffers double-buffer the simulation, so there are no float
 * allocations in the hot loop. The sim runs at 1/scale canvas resolution and
 * is bilinear-upscaled via drawImage.
 */

export interface WaterColorConfig {
  /** Very dark base (deepest troughs) */
  base: [number, number, number];
  /** Diffuse-lit mid-water */
  diffuse: [number, number, number];
  /** Primary (cool) specular highlight */
  spec1: [number, number, number];
  /** Secondary (warm) specular highlight */
  spec2: [number, number, number];
}

/** Default: deep ocean, cyan moonlight. Used by the hero ripple. */
export const HERO_COLORS: WaterColorConfig = {
  base: [1, 9, 18],
  diffuse: [6, 38, 64],
  spec1: [92, 206, 245],
  spec2: [212, 241, 255],
};

export interface WaveSimConfig {
  /** Downscale factor: sim runs at 1/scale canvas resolution. Default 3. */
  scale?: number;
  /** Damping bit-shift (h -= h >> shift). Default 5 (31/32 per frame). */
  dampingShift?: number;
  /** Disturbance radius in sim cells. Default 6. */
  disturbRadius?: number;
  /** Disturbance strength for mouse interaction. Default 2400. */
  disturbStrength?: number;
}

export class WaveSim {
  simW: number;
  simH: number;
  buf1: Int32Array;
  buf2: Int32Array;
  imgData: ImageData;

  readonly scale: number;
  private dampShift: number;
  private dRadius: number;
  readonly disturbStrength: number;

  // Offscreen buffer for putImageData -> drawImage upscale
  private simCanvas: HTMLCanvasElement;
  private simCtx: CanvasRenderingContext2D;

  constructor(canvasW: number, canvasH: number, config: WaveSimConfig = {}) {
    this.scale = config.scale ?? 3;
    this.dampShift = config.dampingShift ?? 5;
    this.dRadius = config.disturbRadius ?? 6;
    this.disturbStrength = config.disturbStrength ?? 2400;

    this.simW = Math.max(2, Math.floor(canvasW / this.scale));
    this.simH = Math.max(2, Math.floor(canvasH / this.scale));
    this.buf1 = new Int32Array(this.simW * this.simH);
    this.buf2 = new Int32Array(this.simW * this.simH);
    this.imgData = new ImageData(this.simW, this.simH);

    this.simCanvas = document.createElement("canvas");
    this.simCanvas.width = this.simW;
    this.simCanvas.height = this.simH;
    this.simCtx = this.simCanvas.getContext("2d")!;
  }

  /** Apply a circular disturbance at sim-space coordinates (sx, sy). */
  disturb(sx: number, sy: number, strength: number) {
    const r = this.dRadius;
    const { buf1, simW, simH } = this;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const d2 = dx * dx + dy * dy;
        if (d2 > r * r) continue;
        const px = sx + dx,
          py = sy + dy;
        if (px < 1 || px >= simW - 1 || py < 1 || py >= simH - 1) continue;
        buf1[py * simW + px] += Math.round(strength * (1 - d2 / (r * r)));
      }
    }
  }

  /** Run one propagation step (integer arithmetic, no floats in the hot loop). */
  propagate() {
    const { simW, simH, dampShift } = this;
    const { buf1, buf2 } = this;
    for (let y = 1; y < simH - 1; y++) {
      for (let x = 1; x < simW - 1; x++) {
        const i = y * simW + x;
        buf2[i] =
          ((buf1[i - 1] + buf1[i + 1] + buf1[i - simW] + buf1[i + simW]) >> 1) -
          buf2[i];
        buf2[i] -= buf2[i] >> dampShift;
      }
    }
    // Swap: buf2 is now the current frame
    this.buf1 = buf2;
    this.buf2 = buf1;
  }

  /**
   * Render the height field to pixels using two-light Phong-ish shading,
   * then draw the result to `targetCtx` at full canvas resolution.
   */
  renderPhong(
    targetCtx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    colors: WaterColorConfig,
  ) {
    const { simW, simH, buf1, imgData } = this;
    const { base, diffuse, spec1, spec2 } = colors;
    const px = imgData.data;

    for (let y = 1; y < simH - 1; y++) {
      for (let x = 1; x < simW - 1; x++) {
        const i = y * simW + x;
        const gx = buf1[i + 1] - buf1[i - 1];
        const gy = buf1[i + simW] - buf1[i - simW];

        // Surface normal (scaled so integer heights ~2000 produce unit-ish normals)
        const nx = -gx * 0.0002,
          ny = -gy * 0.0002,
          nz = 1.0;
        const nlenInv = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);

        // Light 1: cool upper-left (1/sqrt(3) = 0.5774)
        const d1 = Math.max(
          0,
          nx * nlenInv * -0.5774 +
            ny * nlenInv * -0.5774 +
            nz * nlenInv * 0.5774,
        );
        // Light 2: secondary upper-right (rim fill)
        const d2 = Math.max(
          0,
          nx * nlenInv * 0.5 + ny * nlenInv * -0.7 + nz * nlenInv * 0.5099,
        );

        // High-exponent specular for tight, bright glints
        const s1 = d1 * d1 * d1 * d1 * d1 * d1 * d1 * d1; // ^8
        const s2 = d2 * d2 * d2 * d2 * d2; // ^5

        const t1 = s1 > 0.5 ? 1.0 : s1 * 2.0;
        const t2 = s2 > 0.5 ? 1.0 : s2 * 2.0;
        const td = Math.min(1, (d1 + d2) * 0.45);

        // Blend: base -> diffuse -> spec1 -> spec2
        const r =
          base[0] +
          (diffuse[0] - base[0]) * td +
          (spec1[0] - diffuse[0]) * t1 +
          (spec2[0] - spec1[0]) * t2;
        const g =
          base[1] +
          (diffuse[1] - base[1]) * td +
          (spec1[1] - diffuse[1]) * t1 +
          (spec2[1] - spec1[1]) * t2;
        const b =
          base[2] +
          (diffuse[2] - base[2]) * td +
          (spec1[2] - diffuse[2]) * t1 +
          (spec2[2] - spec1[2]) * t2;

        const pi = i * 4;
        px[pi] = r > 255 ? 255 : r < 0 ? 0 : r;
        px[pi + 1] = g > 255 ? 255 : g < 0 ? 0 : g;
        px[pi + 2] = b > 255 ? 255 : b < 0 ? 0 : b;
        px[pi + 3] = 255;
      }
    }

    this.simCtx.putImageData(imgData, 0, 0);
    targetCtx.imageSmoothingEnabled = true;
    targetCtx.imageSmoothingQuality = "high";
    targetCtx.drawImage(this.simCanvas, 0, 0, canvasW, canvasH);
  }

  /** Resize the simulation buffers (clears all wave state). */
  resize(canvasW: number, canvasH: number) {
    this.simW = Math.max(2, Math.floor(canvasW / this.scale));
    this.simH = Math.max(2, Math.floor(canvasH / this.scale));
    this.buf1 = new Int32Array(this.simW * this.simH);
    this.buf2 = new Int32Array(this.simW * this.simH);
    this.imgData = new ImageData(this.simW, this.simH);
    this.simCanvas.width = this.simW;
    this.simCanvas.height = this.simH;
  }
}
