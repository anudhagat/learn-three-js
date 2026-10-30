import type { Expression } from "../sim/expression";

export type Eyes = "open" | "wide" | "closed" | "squeezed" | "spiral";
export type Mouth = "smile" | "open" | "giggle" | "flat" | "wavy";

export interface FaceSpec {
  eyes: Eyes;
  mouth: Mouth;
  blush: boolean;
}

export const FACE_SPECS: Record<Expression, FaceSpec> = {
  sleepy: { eyes: "closed", mouth: "flat", blush: false },
  happy: { eyes: "open", mouth: "smile", blush: true },
  wideEyed: { eyes: "wide", mouth: "open", blush: false },
  squint: { eyes: "squeezed", mouth: "giggle", blush: true },
  dizzy: { eyes: "spiral", mouth: "wavy", blush: false },
};

export const EXPRESSIONS = Object.keys(FACE_SPECS) as Expression[];
