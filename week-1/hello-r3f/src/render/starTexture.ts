import * as THREE from "three";

const SIZE = 128;

// A soft glowing five-pointed star on a transparent background
export const createStarTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const c = SIZE / 2;

  const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.55)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? c * 0.8 : c * 0.35;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(c + Math.cos(angle) * radius, c + Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};
