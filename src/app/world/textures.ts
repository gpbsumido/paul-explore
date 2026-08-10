import * as THREE from "three";

// Canvas-generated textures for the night city. Everything here runs client
// side only — these modules are reached exclusively through the ssr:false
// dynamic import of WorldCanvas.

/** Facade texture: a dark curtain wall with a scattering of lit windows. */
export function makeWindowTexture(
  litChance = 0.4,
  tintHex = "#0e1420",
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = tintHex;
  ctx.fillRect(0, 0, 128, 256);

  const cols = 8;
  const rows = 20;
  const cellW = 128 / cols;
  const cellH = 256 / rows;
  for (let col = 0; col < cols; col += 1) {
    for (let row = 0; row < rows; row += 1) {
      // Hash-based instead of Math.random so every load looks identical.
      const hash =
        Math.abs(Math.sin(col * 127.1 + row * 311.7) * 43758.5453) % 1;
      if (hash > litChance) continue;
      const warm = (hash * 2.5) % 1 > 0.5;
      ctx.fillStyle = warm
        ? "rgba(255, 214, 150, 0.9)"
        : "rgba(170, 210, 255, 0.75)";
      ctx.fillRect(col * cellW + 2, row * cellH + 2, cellW - 4, cellH - 5);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Without anisotropy the window grid shimmers badly at grazing angles.
  texture.anisotropy = 8;
  return texture;
}

type TextTextureOptions = {
  readonly fontSize?: number;
  readonly color?: string;
  readonly background?: string;
  readonly padding?: number;
  // Per-character colors override `color` (used by the TORONTO sign).
  readonly letterColors?: readonly string[];
};

/** Crisp text on a transparent (or pill) background, for signs and labels. */
export function makeTextTexture(
  text: string,
  options: TextTextureOptions = {},
): THREE.CanvasTexture {
  const {
    fontSize = 64,
    color = "#ffffff",
    background,
    padding = 24,
    letterColors,
  } = options;
  const font = `700 ${fontSize}px "Avenir Next", "Helvetica Neue", sans-serif`;

  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = font;
  const textWidth = measure.measureText(text).width;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(textWidth + padding * 2);
  canvas.height = Math.ceil(fontSize * 1.6);
  const ctx = canvas.getContext("2d")!;

  if (background) {
    ctx.fillStyle = background;
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, canvas.height / 2);
    ctx.fill();
  }

  ctx.font = font;
  ctx.textBaseline = "middle";
  if (letterColors) {
    const chars = [...text];
    const offsets = chars.map((c) => measure.measureText(c).width);
    chars.reduce((x, char, i) => {
      ctx.fillStyle = letterColors[i % letterColors.length];
      ctx.fillText(char, x, canvas.height / 2);
      return x + offsets[i];
    }, padding);
  } else {
    ctx.fillStyle = color;
    ctx.fillText(text, padding, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** The OCAD Sharp Centre pixel-checker skin. */
export function makeCheckerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 48;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e8e8e6";
  ctx.fillRect(0, 0, 96, 48);
  const cell = 8;
  for (let x = 0; x < 96 / cell; x += 1) {
    for (let y = 0; y < 48 / cell; y += 1) {
      const hash = Math.abs(Math.sin(x * 91.7 + y * 47.3) * 14741.31) % 1;
      if (hash > 0.45) continue;
      ctx.fillStyle = "#15181d";
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Center-line dashes for the roads, repeated along the strip. */
export function makeDashTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 8;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 64, 8);
  ctx.fillStyle = "rgba(244, 214, 121, 0.85)";
  ctx.fillRect(8, 2, 24, 4);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
