import * as THREE from "three";

const SIZE = 128;

// Rays of the sparkle: long thin ones along the axes, shorter ones on the diagonals
const RAYS = Array.from({ length: 8 }, (_, i) => ({
  angle: (i * Math.PI) / 4,
  length: i % 2 === 0 ? 0.95 : 0.5,
  width: i % 2 === 0 ? 0.07 : 0.05,
}));

// A magical twinkle: a bright core and a soft halo with eight tapering rays
export const createStarTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const c = SIZE / 2;
  ctx.globalCompositeOperation = "lighter"; // Layers add up, like light

  const halo = ctx.createRadialGradient(c, c, 0, c, c, c * 0.6);
  halo.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  halo.addColorStop(0.25, "rgba(255, 255, 255, 0.35)");
  halo.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, SIZE, SIZE);

  for (const { angle, length, width } of RAYS) {
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(angle);
    const ray = ctx.createLinearGradient(0, 0, c * length, 0);
    ray.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    ray.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = ray;
    ctx.beginPath();
    ctx.moveTo(0, -c * width);
    ctx.lineTo(c * length, 0); // Tapers to a point
    ctx.lineTo(0, c * width);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};
