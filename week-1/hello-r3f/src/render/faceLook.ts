import type { Expression } from "../sim/expression";

// The face as it drifts from happy to asleep, as three continuous amounts. Each runs
// from 1 (the happy face) down to 0 (the sleepy face).
export interface FaceLook {
  eyeOpen: number; // 1 open and round, 0 shut
  smile: number; // 1 a smile, 0 a flat mouth
  blush: number; // 1 rosy cheeks, 0 none
}

export const DROWSY_FRAMES = 9; // Pre-drawn faces along the way from awake to asleep

const smoothstep = (t: number) => {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * (3 - 2 * x);
};

const EYES_SHUT_BY = 0.85; // The eyes finish closing a little before the mouth relaxes

export const getFaceLook = (drowsiness: number): FaceLook => ({
  eyeOpen: 1 - smoothstep(drowsiness / EYES_SHUT_BY),
  smile: 1 - smoothstep(drowsiness),
  blush: 1 - smoothstep(drowsiness),
});

// Which of the pre-drawn faces to show for a drowsiness from 0 to 1
export const drowsyFrameIndex = (drowsiness: number, frames: number): number =>
  Math.round(Math.min(Math.max(drowsiness, 0), 1) * (frames - 1));

// Which face to show: the drowsy sequence for happy and sleepy (happy is its first
// frame, so nothing jumps when the ball starts to nod off), or the dizzy face
export const pickFace = <T>(
  faces: { drowsy: T[]; dizzy: T },
  expression: Expression,
  drowsiness: number,
): T => {
  if (expression === "dizzy") return faces.dizzy;
  const awake = expression === "happy";
  return faces.drowsy[awake ? 0 : drowsyFrameIndex(drowsiness, faces.drowsy.length)];
};
