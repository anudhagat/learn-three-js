import * as THREE from "three";
import { createRng } from "../sim/rng";
import { scatterGrass, wrapOffsets, type Blade, type Flower } from "./grassDetails";
import { tileableNoise } from "./noise";
import { normalsFromHeights } from "./normalMap";

export const HORIZON_COLOR = "#8b4a9f"; // Purple haze the hills and the ground fade into; also the fog


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
  const blend = 0.03; // Width of the soft edge between bands
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

const GRASS_SIZE = 1024;
const WRAP_MARGIN = 0.08; // Items this close to an edge are drawn again on the far side
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const bladeColor = (shade: number) =>
  `rgb(${Math.round(lerp(18, 60, shade))}, ${Math.round(lerp(100, 185, shade))}, ${Math.round(lerp(70, 112, shade))})`;

// Draws each blade and flower, and again on the far side of any edge it crosses
const paintGrass = (
  ctx: CanvasRenderingContext2D,
  blades: Blade[],
  flowers: Flower[],
  bladeStyle: (blade: Blade) => string,
  flowerStyle: (flower: Flower) => [string, string],
) => {
  const size = GRASS_SIZE;
  ctx.lineCap = "round";
  ctx.lineWidth = 3.5;
  for (const blade of blades) {
    ctx.strokeStyle = bladeStyle(blade);
    for (const [dx, dy] of wrapOffsets(blade.x, blade.y, WRAP_MARGIN)) {
      const x = (blade.x + dx) * size;
      const y = (blade.y + dy) * size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(
        x,
        y - blade.length * size * 0.6,
        x + Math.sin(blade.lean) * blade.length * size,
        y - Math.cos(blade.lean) * blade.length * size,
      );
      ctx.stroke();
    }
  }
  for (const flower of flowers) {
    const [petals, centre] = flowerStyle(flower);
    for (const [dx, dy] of wrapOffsets(flower.x, flower.y, WRAP_MARGIN)) {
      const x = (flower.x + dx) * size;
      const y = (flower.y + dy) * size;
      ctx.fillStyle = petals;
      ctx.beginPath();
      ctx.arc(x, y, flower.radius * size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = centre;
      ctx.beginPath();
      ctx.arc(x, y, flower.radius * size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

// A tiling lawn and its normal map. The colour drifts between deeper and brighter
// greens in broad patches, with darker hollows; blades and a few flowers sit on top.
// The blades are also painted into a height map, which becomes the normal map, so
// the sun catches each blade. Kept blue-green, as warm light turns yellow-greens tan.
export const createGrassTextures = (repeat: number) => {
  const size = GRASS_SIZE;
  const rng = createRng(7);
  const patches = tileableNoise(rng, size, 3, 3);
  const hollows = tileableNoise(rng, size, 6, 2);
  const { blades, flowers } = scatterGrass(rng, 7000, 16);

  const { canvas, ctx } = makeCanvas(size, size);
  const base = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const shade = 1 - 0.3 * smoothHollow(hollows[i]);
    base.data[i * 4] = lerp(24, 52, patches[i]) * shade;
    base.data[i * 4 + 1] = lerp(112, 150, patches[i]) * shade;
    base.data[i * 4 + 2] = lerp(66, 80, patches[i]) * shade;
    base.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(base, 0, 0);
  paintGrass(
    ctx,
    blades,
    flowers,
    (blade) => bladeColor(blade.shade),
    (flower) => [flower.color, "#f7b733"],
  );

  // Heights: gentle swells under the blades, which stand taller, and the flowers
  const { ctx: heightCtx } = makeCanvas(size, size);
  const swells = heightCtx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const grey = patches[i] * 60;
    swells.data.set([grey, grey, grey, 255], i * 4);
  }
  heightCtx.putImageData(swells, 0, 0);
  paintGrass(
    heightCtx,
    blades,
    flowers,
    (blade) => {
      const grey = Math.round(lerp(110, 230, blade.shade));
      return `rgb(${grey}, ${grey}, ${grey})`;
    },
    () => ["rgb(255, 255, 255)", "rgb(200, 200, 200)"],
  );
  const pixels = heightCtx.getImageData(0, 0, size, size).data;
  const heights = Float32Array.from({ length: size * size }, (_, i) => pixels[i * 4] / 255);

  const { canvas: normalCanvas, ctx: normalCtx } = makeCanvas(size, size);
  normalCtx.putImageData(new ImageData(normalsFromHeights(heights, size, 3), size, size), 0, 0);

  const tile = (texture: THREE.CanvasTexture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
    texture.anisotropy = 8;
    return texture;
  };
  const normalMap = new THREE.CanvasTexture(normalCanvas); // Data, not colour
  return { map: tile(toTexture(canvas)), normalMap: tile(normalMap) };
};

// Deepens the hollows: noise below the middle counts as shade, above it as none
const smoothHollow = (value: number) => Math.min(Math.max((0.55 - value) / 0.35, 0), 1);

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

// Bands of `color` and white that repeat along the texture. `alongV` runs them up the
// texture (for a cylinder, as rings around it); otherwise across (along a tube).
export const createStripeTexture = (color: string, bands = 6, alongV = true) => {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = color;
  const band = 256 / (bands * 2);
  for (let i = 0; i < bands; i++) {
    if (alongV) ctx.fillRect(0, i * band * 2, 256, band);
    else ctx.fillRect(i * band * 2, 0, band, 256);
  }
  const texture = toTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
};
