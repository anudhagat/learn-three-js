import * as THREE from "three";
import { createRng } from "../sim/rng";
import { scatterGrass } from "./grassDetails";

export const HORIZON_COLOR = "#d8689f"; // Haze at the horizon; also the ground fog


const makeCanvas = (width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext("2d")! };
};

const toTexture = (canvas: HTMLCanvasElement) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

// Dusk bands, from the top of the dome down to the horizon. Positions are fractions
// of the texture height; the horizon is at 0.5 and the view only ever sees the
// middle of the dome, so the colours are packed in around it.
const SKY_BANDS: [number, string][] = [
  [0, "#120d38"],
  [0.22, "#1b1445"],
  [0.31, "#3a2170"],
  [0.37, "#6a3394"],
  [0.42, "#b04c9e"],
  [0.465, "#ff7f9c"],
  [0.5, "#ffb58a"],
  [0.56, "#ffc79a"],
  [1, "#7a3f78"],
];

// A dusk sky in soft stepped bands, wrapped around the whole scene
export const createSkyTexture = () => {
  const height = 1024;
  const { canvas, ctx } = makeCanvas(8, height);
  const blend = 0.012; // Width of the soft edge between bands
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  SKY_BANDS.forEach(([position, color], i) => {
    const next = SKY_BANDS[i + 1];
    gradient.addColorStop(position, color);
    // Hold each colour until just before the next band starts
    if (next) gradient.addColorStop(Math.max(position, next[0] - blend), color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 8, height);
  return toTexture(canvas);
};

// A big soft sun: a bright core, a warm halo and a faint ring
export const createSunTexture = () => {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size, size);
  const c = size / 2;
  const halo = ctx.createRadialGradient(c, c, 0, c, c, c);
  halo.addColorStop(0, "rgba(255, 250, 220, 1)");
  halo.addColorStop(0.2, "rgba(255, 244, 200, 1)");
  halo.addColorStop(0.24, "rgba(255, 200, 140, 0.55)");
  halo.addColorStop(0.55, "rgba(255, 140, 140, 0.18)");
  halo.addColorStop(1, "rgba(255, 140, 140, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255, 230, 190, 0.25)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(c, c, c * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  return toTexture(canvas);
};

const lerpChannel = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
const bladeColor = (shade: number) =>
  `rgb(${lerpChannel(30, 88, shade)}, ${lerpChannel(106, 190, shade)}, ${lerpChannel(56, 96, shade)})`;

// A tiling lawn: a mid green base with blades in many shades and a few tiny flowers.
// Kept fairly dark so the sparkles stand out.
export const createGrassTexture = (repeat: number) => {
  const size = 512;
  const { canvas, ctx } = makeCanvas(size, size);
  ctx.fillStyle = "#2c8745";
  ctx.fillRect(0, 0, size, size);

  const { blades, flowers } = scatterGrass(createRng(7), 2600, 14);
  ctx.lineCap = "round";
  ctx.lineWidth = 2.5;
  // Draw each item at its wrapped neighbours too, so the tile has no visible seams
  const wraps = [-1, 0, 1];
  for (const blade of blades) {
    ctx.strokeStyle = bladeColor(blade.shade);
    for (const dx of wraps) {
      for (const dy of wraps) {
        const x = (blade.x + dx) * size;
        const y = (blade.y + dy) * size;
        const tipX = x + Math.sin(blade.lean) * blade.length * size;
        const tipY = y - Math.cos(blade.lean) * blade.length * size;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x, y - blade.length * size * 0.6, tipX, tipY);
        ctx.stroke();
      }
    }
  }
  for (const flower of flowers) {
    for (const dx of wraps) {
      for (const dy of wraps) {
        const x = (flower.x + dx) * size;
        const y = (flower.y + dy) * size;
        ctx.fillStyle = flower.color;
        ctx.beginPath();
        ctx.arc(x, y, flower.radius * size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f7b733";
        ctx.beginPath();
        ctx.arc(x, y, flower.radius * size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const texture = toTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 8;
  return texture;
};

// A spiral of `color` on white, for the top of a lollipop
export const createSwirlTexture = (color: string) => {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size, size);
  const c = size / 2;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = color;
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  const arms = 3;
  for (let arm = 0; arm < arms; arm++) {
    ctx.beginPath();
    for (let r = 4; r < c; r += 2) {
      const angle = (arm * Math.PI * 2) / arms + r * 0.035;
      ctx.lineTo(c + Math.cos(angle) * r, c + Math.sin(angle) * r);
    }
    ctx.stroke();
  }
  return toTexture(canvas);
};
