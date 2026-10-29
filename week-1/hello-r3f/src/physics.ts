export const INITIAL_POSITION_Y = 0; // Initial position of the ball
export const FLOOR_POSITION_Y = -2; // Floor position of the ball
export const BALL_RADIUS = 0.5; // Radius of the ball
export const BALL_CENTER_LIMIT = FLOOR_POSITION_Y + BALL_RADIUS; // Limit for the ball's center position
export const GRAVITY = -9.8;
export const RESTITUTION = 0.8; // Coefficient of restitution (bounciness)
export const REST_VELOCITY = 0.5; // Below this bounce speed, the ball stops
export const MAX_DELTA = 1 / 30; // Avoid huge steps after tab switches
export const SQUASH_DURATION = 0.1; // Seconds the ball stays squashed on impact
const REFERENCE_SPEED = 6; // Speed at which squash and stretch reach their maximum
const MAX_SQUASH = 0.4;
const MAX_STRETCH = 0.25;

// Squares the speed ratio so slow late bounces are almost perfectly round
const deformation = (speed: number) => Math.min(speed / REFERENCE_SPEED, 1) ** 2;

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
      squashAmount: MAX_SQUASH * deformation(impactSpeed),
    },
    dt - tHit,
  );
};

export const getBallVisual = (state: BallState): BallVisual => {
  // Squash on impact, otherwise stretch with speed; y scale is `s`, x and z
  // scale by 1/√s so the volume stays constant
  const s =
    state.squashTime >= 0
      ? 1 -
        state.squashAmount * Math.sin(Math.PI * (state.squashTime / SQUASH_DURATION))
      : 1 + MAX_STRETCH * deformation(Math.abs(state.v));
  const xz = 1 / Math.sqrt(s);

  return {
    // Keep the bottom of the ball from sinking into the floor
    positionY: Math.max(state.y, FLOOR_POSITION_Y + BALL_RADIUS * s),
    scale: [xz, s, xz],
  };
};
