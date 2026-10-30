import {
  BALL_RADIUS,
  FLOOR_POSITION_Y,
  MAX_SQUASH,
  MAX_STRETCH,
  MAX_TILT,
  REFERENCE_SPEED,
  SQUASH_DURATION,
  TILT_SPEED,
} from "./config";
import type { BallState } from "./ball";

export interface BallVisual {
  positionY: number;
  scale: [number, number, number];
}

// Squares the speed ratio so slow late bounces are almost perfectly round
const deformation = (speed: number) => Math.min(speed / REFERENCE_SPEED, 1) ** 2;

export const getBallVisual = (state: BallState): BallVisual => {
  // Squash on impact, otherwise stretch with speed; y scale is `s`, x and z
  // scale by 1/√s so the volume stays constant
  const squashAmount = MAX_SQUASH * deformation(state.impactSpeed);
  const s =
    state.squashTime >= 0
      ? 1 - squashAmount * Math.sin(Math.PI * (state.squashTime / SQUASH_DURATION))
      : 1 + MAX_STRETCH * deformation(Math.abs(state.v));
  const xz = 1 / Math.sqrt(s);

  return {
    // Keep the bottom of the ball from sinking into the floor
    positionY: Math.max(state.y, FLOOR_POSITION_Y + BALL_RADIUS * s),
    scale: [xz, s, xz],
  };
};

const smoothstep = (t: number) => t * t * (3 - 2 * t);

// Looks up as the ball slows towards the top of a bounce and levels out again
// as it speeds up on the way down. A resting ball stays level.
export const getBallPitch = (state: BallState): number => {
  if (state.atRest) return 0;
  const slowness = 1 - Math.min(Math.abs(state.v) / TILT_SPEED, 1);
  return MAX_TILT * smoothstep(slowness);
};
