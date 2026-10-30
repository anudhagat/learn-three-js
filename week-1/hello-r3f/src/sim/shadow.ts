import { BALL_CENTER_LIMIT, BALL_RADIUS } from "./config";
import type { BallState } from "./ball";
import { getBallVisual } from "./deformation";

const FADE_HEIGHT = 4.5; // Height above the floor where the shadow is at its smallest and faintest
const CONTACT_OPACITY = 0.85;
const HIGH_OPACITY = 0.35;
const CONTACT_RADIUS = 1.15; // In ball radii
const HIGH_RADIUS = 0.45;

export interface BallShadow {
  radius: number; // In world units
  opacity: number;
}

// A soft blob under the ball: dark and wide when it touches the floor, small and faint
// when it is high. It widens with the ball while the ball is squashed.
export const getBallShadow = (ball: BallState): BallShadow => {
  const height = Math.max(ball.y - BALL_CENTER_LIMIT, 0);
  const t = Math.min(height / FADE_HEIGHT, 1);
  const widening = getBallVisual(ball).scale[0];
  return {
    opacity: CONTACT_OPACITY + (HIGH_OPACITY - CONTACT_OPACITY) * t,
    radius: BALL_RADIUS * (CONTACT_RADIUS + (HIGH_RADIUS - CONTACT_RADIUS) * t) * widening,
  };
};
