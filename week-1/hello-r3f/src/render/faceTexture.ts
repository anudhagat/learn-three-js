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
  if (eyes === "open") {
    ctx.fillStyle = INK;
    ctx.ellipse(x, y, 16, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // A relaxed downward curve
    stroke(ctx);
    ctx.arc(x, y - 6, 22, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
};

const drawMouth = (ctx: CanvasRenderingContext2D, mouth: FaceSpec["mouth"]) => {
  const y = FACE_Y + 55;
  ctx.beginPath();
  stroke(ctx);
  if (mouth === "smile") {
    ctx.arc(FACE_X, y - 25, 45, 0.15 * Math.PI, 0.85 * Math.PI);
  } else {
    ctx.moveTo(FACE_X - 22, y);
    ctx.lineTo(FACE_X + 22, y);
  }
  ctx.stroke();
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
