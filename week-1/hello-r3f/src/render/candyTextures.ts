import * as THREE from "three";
import { createRng } from "../sim/rng";
import { scatterGrass } from "./grassDetails";

export const HORIZON_COLOR = "#ff8f9c";


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

// A dusk sky: deep indigo at the top fading to a rosy glow at the horizon, which
// sits roughly 54% of the way down the view
export const createSkyTexture = () => {
  const { canvas, ctx } = makeCanvas(16, 512);
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#1b1445");
  gradient.addColorStop(0.28, "#4b2a7a");
  gradient.addColorStop(0.54, HORIZON_COLOR);
  gradient.addColorStop(1, "#ffc08a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 512);
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
