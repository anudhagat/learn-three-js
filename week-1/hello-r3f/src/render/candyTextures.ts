import * as THREE from "three";

export const HORIZON_COLOR = "#ff9ec7";

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

// Deep plum at the top fading to candy pink at the horizon, which sits roughly
// 55% of the way down the view
export const createSkyTexture = () => {
  const { canvas, ctx } = makeCanvas(16, 512);
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#2a1146");
  gradient.addColorStop(0.3, "#6a2c91");
  gradient.addColorStop(0.55, HORIZON_COLOR);
  gradient.addColorStop(1, "#ffc6dd");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 512);
  return toTexture(canvas);
};

// Mint and pink checkers, tiled across the floor
export const createCheckerTexture = (repeat: number) => {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = "#a6f0d6";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#ffb8d6";
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillRect(128, 128, 128, 128);
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
