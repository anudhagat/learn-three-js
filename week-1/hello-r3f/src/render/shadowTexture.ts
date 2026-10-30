import * as THREE from "three";

const SIZE = 128;

// A soft dark blob that fades to nothing at its edge
export const createShadowTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const c = SIZE / 2;
  const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
  gradient.addColorStop(0, "rgba(10, 5, 25, 1)");
  gradient.addColorStop(0.45, "rgba(10, 5, 25, 0.75)");
  gradient.addColorStop(1, "rgba(10, 5, 25, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};
