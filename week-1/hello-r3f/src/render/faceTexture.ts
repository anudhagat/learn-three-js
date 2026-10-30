import * as THREE from "three";
import type { Expression } from "../sim/expression";
import { EXPRESSIONS, FACE_SPECS, type FaceSpec } from "./faceSpec";

const WIDTH = 1024;
const HEIGHT = 512;
// On a sphere, u = 0.25 faces the +z axis, which is where the camera looks from
const FACE_X = WIDTH * 0.25;
const FACE_Y = HEIGHT * 0.5;
const INK = "#5b3a29";

const stroke = (ctx: CanvasRenderingContext2D, width = 12) => {
  ctx.strokeStyle = INK;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
};

const drawEye = (ctx: CanvasRenderingContext2D, eyes: FaceSpec["eyes"], dir: -1 | 1) => {
  const x = FACE_X + dir * 70;
  const y = FACE_Y - 30;
  ctx.beginPath();
  switch (eyes) {
    case "open":
      ctx.fillStyle = INK;
      ctx.ellipse(x, y, 16, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "wide":
      ctx.fillStyle = "#fff";
      ctx.ellipse(x, y, 30, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      stroke(ctx, 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = INK;
      ctx.arc(x, y + 4, 12, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "closed": // A relaxed downward curve
      stroke(ctx);
      ctx.arc(x, y - 6, 22, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      break;
    case "squeezed": // > < shapes
      stroke(ctx);
      ctx.moveTo(x - dir * 22, y - 20);
      ctx.lineTo(x + dir * 18, y);
      ctx.lineTo(x - dir * 22, y + 20);
      ctx.stroke();
      break;
    case "spiral": {
      stroke(ctx, 7);
      for (let a = 0; a < Math.PI * 6; a += 0.2) {
        const r = 3 + a * 1.9;
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      ctx.stroke();
      break;
    }
  }
};

const drawMouth = (ctx: CanvasRenderingContext2D, mouth: FaceSpec["mouth"]) => {
  const y = FACE_Y + 55;
  ctx.beginPath();
  switch (mouth) {
    case "smile":
      stroke(ctx);
      ctx.arc(FACE_X, y - 25, 45, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      break;
    case "open":
      ctx.fillStyle = INK;
      ctx.ellipse(FACE_X, y + 5, 26, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "giggle": // Wide open grin with a tongue
      ctx.fillStyle = INK;
      ctx.moveTo(FACE_X - 55, y - 20);
      ctx.quadraticCurveTo(FACE_X, y + 75, FACE_X + 55, y - 20);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "#ff8fa3";
      ctx.ellipse(FACE_X, y + 22, 24, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "flat":
      stroke(ctx);
      ctx.moveTo(FACE_X - 22, y);
      ctx.lineTo(FACE_X + 22, y);
      ctx.stroke();
      break;
    case "wavy":
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
      break;
  }
};

const drawFace = (spec: FaceSpec): THREE.CanvasTexture => {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffd83d";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (spec.blush) {
    ctx.fillStyle = "rgba(255, 120, 130, 0.55)";
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(FACE_X + dir * 115, FACE_Y + 25, 32, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  drawEye(ctx, spec.eyes, -1);
  drawEye(ctx, spec.eyes, 1);
  drawMouth(ctx, spec.mouth);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

export const createFaceTextures = (): Record<Expression, THREE.CanvasTexture> =>
  Object.fromEntries(
    EXPRESSIONS.map((e) => [e, drawFace(FACE_SPECS[e])]),
  ) as Record<Expression, THREE.CanvasTexture>;
