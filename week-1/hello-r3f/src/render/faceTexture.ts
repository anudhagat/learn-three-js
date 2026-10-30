import * as THREE from "three";
import { DROWSY_FRAMES, getFaceLook, type FaceLook } from "./faceLook";

const WIDTH = 1024;
const HEIGHT = 512;
// On a sphere, u = 0.25 faces the +z axis, which is where the camera looks from
const FACE_X = WIDTH * 0.25;
const FACE_Y = HEIGHT * 0.5;
const INK = "#5b3a29";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const stroke = (ctx: CanvasRenderingContext2D, width = 12) => {
  ctx.strokeStyle = INK;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
};

// An eye that goes from a round open one, through a drooping lid, to a shut
// downward curve. Two curves meet at the corners: the upper lid and the lower edge.
const drawSleepyEye = (ctx: CanvasRenderingContext2D, dir: -1 | 1, eyeOpen: number) => {
  const x = FACE_X + dir * 70;
  const y = FACE_Y - 30 + 4 * (1 - eyeOpen);
  const halfWidth = lerp(21, 16, eyeOpen);
  const halfHeight = 24 * eyeOpen;
  const sag = 16 * (1 - eyeOpen); // The shut eye curves down like a relaxed smile
  const lid = -(4 / 3) * halfHeight + sag;
  const lower = (4 / 3) * halfHeight + sag;
  ctx.beginPath();
  ctx.moveTo(x - halfWidth, y);
  ctx.bezierCurveTo(x - halfWidth, y + lid, x + halfWidth, y + lid, x + halfWidth, y);
  ctx.bezierCurveTo(x + halfWidth, y + lower, x - halfWidth, y + lower, x - halfWidth, y);
  ctx.fillStyle = INK;
  ctx.fill();
  if (eyeOpen < 1) {
    stroke(ctx, 12 * (1 - eyeOpen));
    ctx.stroke();
  }
};

// A smile that relaxes into a flat mouth
const drawSleepyMouth = (ctx: CanvasRenderingContext2D, smile: number) => {
  const y = FACE_Y + 55;
  const halfWidth = lerp(22, 40, smile);
  const endY = y - 4.6 * smile;
  ctx.beginPath();
  stroke(ctx);
  ctx.moveTo(FACE_X - halfWidth, endY);
  ctx.quadraticCurveTo(FACE_X, endY + 49 * smile, FACE_X + halfWidth, endY);
  ctx.stroke();
};

const drawDizzyEye = (ctx: CanvasRenderingContext2D, dir: -1 | 1) => {
  const x = FACE_X + dir * 70;
  const y = FACE_Y - 30;
  ctx.beginPath();
  stroke(ctx, 7);
  for (let a = 0; a < Math.PI * 6; a += 0.2) {
    const r = 3 + a * 1.9;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.stroke();
};

const drawDizzyMouth = (ctx: CanvasRenderingContext2D) => {
  const y = FACE_Y + 55;
  ctx.beginPath();
  stroke(ctx);
  ctx.moveTo(FACE_X - 50, y);
  for (let i = 0; i < 4; i++) {
    ctx.quadraticCurveTo(
      FACE_X - 50 + i * 25 + 12,
      y + (i % 2 ? 14 : -14),
      FACE_X - 50 + (i + 1) * 25,
      y,
    );
  }
  ctx.stroke();
};

const paintFace = (draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture => {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffd83d";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

const drawSleepyFace = (look: FaceLook) => (ctx: CanvasRenderingContext2D) => {
  if (look.blush > 0) {
    ctx.fillStyle = `rgba(255, 120, 130, ${0.55 * look.blush})`;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(FACE_X + dir * 115, FACE_Y + 25, 32, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  drawSleepyEye(ctx, -1, look.eyeOpen);
  drawSleepyEye(ctx, 1, look.eyeOpen);
  drawSleepyMouth(ctx, look.smile);
};

// The faces, drawn once: DROWSY_FRAMES going from wide awake (the happy face) to fast
// asleep, and the dizzy face
export const createFaceTextures = () => ({
  drowsy: Array.from({ length: DROWSY_FRAMES }, (_, i) =>
    paintFace(drawSleepyFace(getFaceLook(i / (DROWSY_FRAMES - 1)))),
  ),
  dizzy: paintFace((ctx) => {
    drawDizzyEye(ctx, -1);
    drawDizzyEye(ctx, 1);
    drawDizzyMouth(ctx);
  }),
});
