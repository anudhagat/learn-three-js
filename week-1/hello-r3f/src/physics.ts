export const INITIAL_POSITION_Y = 0; // Initial position of the ball
export const FLOOR_POSITION_Y = -2; // Floor position of the ball
export const BALL_RADIUS = 0.5; // Radius of the ball
export const BALL_CENTER_LIMIT = FLOOR_POSITION_Y + BALL_RADIUS; // Limit for the ball's center position
export const GRAVITY = -9.8;
export const RESTITUTION = 0.8; // Coefficient of restitution (bounciness)
export const REST_VELOCITY = 0.5; // Below this bounce speed, the ball stops
export const MAX_DELTA = 1 / 30; // Avoid huge steps after tab switches

export interface BallState {
  y: number; // Height of the ball's center
  v: number; // Vertical velocity
  atRest: boolean;
  squashTime: number; // Time since impact, or -1 when not in contact
  squashAmount: number; // How strongly the current impact squashes the ball
}

export interface BallVisual {
  positionY: number;
  scale: [number, number, number];
}

export const createBall = (y = INITIAL_POSITION_Y, v = 0.02): BallState => ({
  y,
  v,
  atRest: false,
  squashTime: -1,
  squashAmount: 0,
});

// Exact motion under constant gravity after `t` seconds
const fall = (y: number, v: number, t: number) => ({
  y: y + v * t + 0.5 * GRAVITY * t * t,
  v: v + GRAVITY * t,
});

export const stepBall = (state: BallState, rawDelta: number): BallState => {
  if (state.atRest) return state;

  const dt = Math.min(rawDelta, MAX_DELTA);
  const next = fall(state.y, state.v, dt);
  if (next.y > BALL_CENTER_LIMIT) return { ...state, ...next };

  // Find when in this frame the ball reaches the floor:
  // solve ½·g·t² + v·t + (y - limit) = 0 for t
  const a = 0.5 * GRAVITY;
  const c = state.y - BALL_CENTER_LIMIT;
  const discriminant = state.v * state.v - 4 * a * c;
  const tHit = Math.min(
    Math.max((-state.v - Math.sqrt(discriminant)) / (2 * a), 0),
    dt,
  );
  const bounceV = -fall(state.y, state.v, tHit).v * RESTITUTION;

  if (Math.abs(bounceV) < REST_VELOCITY) {
    return { ...state, y: BALL_CENTER_LIMIT, v: 0, atRest: true };
  }

  // Spend the rest of the frame on the way back up
  return {
    ...state,
    ...fall(BALL_CENTER_LIMIT, bounceV, dt - tHit),
  };
};

export const getBallVisual = (state: BallState): BallVisual => ({
  positionY: state.y,
  scale: [1, 1, 1],
});
