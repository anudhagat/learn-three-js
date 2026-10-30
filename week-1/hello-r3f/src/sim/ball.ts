import {
  BALL_CENTER_LIMIT,
  GRAVITY,
  INITIAL_POSITION_Y,
  MAX_DELTA,
  REST_VELOCITY,
  RESTITUTION,
  SQUASH_DURATION,
} from "./config";

export interface BallState {
  y: number; // Height of the ball's center
  v: number; // Vertical velocity
  atRest: boolean;
  squashTime: number; // Time since impact, or -1 when not in contact
  impactSpeed: number; // Speed of the most recent impact
}

export const createBall = (y = INITIAL_POSITION_Y, v = 0.02): BallState => ({
  y,
  v,
  atRest: false,
  squashTime: -1,
  impactSpeed: 0,
});

// Launch the ball upward so it peaks at its starting height. Ignored while the
// ball is already rising, so repeated clicks can't keep boosting it.
export const jumpBall = (state: BallState): BallState =>
  !state.atRest && state.v > 0
    ? state
    : {
        ...state,
        atRest: false,
        v: Math.sqrt(2 * -GRAVITY * Math.max(INITIAL_POSITION_Y - state.y, 0)),
      };

// Exact motion under constant gravity after `t` seconds
const fall = (y: number, v: number, t: number) => ({
  y: y + v * t + 0.5 * GRAVITY * t * t,
  v: v + GRAVITY * t,
});

// Advance the squash timer, ending the squash once it has run its course
const advanceSquash = (state: BallState, dt: number): BallState => {
  if (state.squashTime < 0) return state;
  const squashTime = state.squashTime + dt;
  return { ...state, squashTime: squashTime >= SQUASH_DURATION ? -1 : squashTime };
};

export const stepBall = (state: BallState, rawDelta: number): BallState => {
  if (state.atRest) return state;

  const dt = Math.min(rawDelta, MAX_DELTA);
  const next = fall(state.y, state.v, dt);
  if (next.y > BALL_CENTER_LIMIT) {
    return advanceSquash({ ...state, ...next }, dt);
  }

  // Find when in this frame the ball reaches the floor:
  // solve ½·g·t² + v·t + (y - limit) = 0 for t
  const a = 0.5 * GRAVITY;
  const c = state.y - BALL_CENTER_LIMIT;
  const discriminant = state.v * state.v - 4 * a * c;
  const tHit = Math.min(
    Math.max((-state.v - Math.sqrt(discriminant)) / (2 * a), 0),
    dt,
  );
  const impactSpeed = Math.abs(fall(state.y, state.v, tHit).v);
  const bounceV = impactSpeed * RESTITUTION;

  if (bounceV < REST_VELOCITY) {
    return { ...state, y: BALL_CENTER_LIMIT, v: 0, atRest: true, squashTime: -1 };
  }

  // Spend the rest of the frame on the way back up
  return advanceSquash(
    {
      ...state,
      ...fall(BALL_CENTER_LIMIT, bounceV, dt - tHit),
      squashTime: 0,
      impactSpeed,
    },
    dt - tHit,
  );
};
