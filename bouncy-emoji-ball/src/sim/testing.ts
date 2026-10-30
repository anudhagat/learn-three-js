import { stepBall, type BallState } from "./ball";

export const simulate = (
  state: BallState,
  seconds: number,
  dt: number,
  onFrame?: (s: BallState) => void,
) => {
  const frames = Math.round(seconds / dt);
  for (let i = 0; i < frames; i++) {
    state = stepBall(state, dt);
    onFrame?.(state);
  }
  return state;
};
