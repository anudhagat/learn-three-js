import type { Expression } from "../sim/expression";

export type Eyes = "open" | "closed" | "spiral";
export type Mouth = "smile" | "flat" | "wavy";

export interface FaceSpec {
  eyes: Eyes;
  mouth: Mouth;
  blush: boolean;
}

export const FACE_SPECS: Record<Expression, FaceSpec> = {
  happy: { eyes: "open", mouth: "smile", blush: true },
  sleepy: { eyes: "closed", mouth: "flat", blush: false },
  dizzy: { eyes: "spiral", mouth: "wavy", blush: false },
};

export const EXPRESSIONS = Object.keys(FACE_SPECS) as Expression[];
