export const INITIAL_POSITION_Y = 0; // Initial position of the ball
export const FLOOR_POSITION_Y = -2; // Floor position of the ball
export const BALL_RADIUS = 0.5; // Radius of the ball
export const BALL_CENTER_LIMIT = FLOOR_POSITION_Y + BALL_RADIUS; // Limit for the ball's center position
export const GRAVITY = -9.8;
export const RESTITUTION = 0.8; // Coefficient of restitution (bounciness)
export const REST_VELOCITY = 0.1; // Below this bounce speed, the ball stops

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

export const stepBall = (state: BallState, dt: number): BallState => {
  if (state.atRest) return state;

  const v = state.v + GRAVITY * dt;
  const y = state.y + v * dt;

  if (y <= BALL_CENTER_LIMIT) {
    const bounceV = -v * RESTITUTION;
    if (Math.abs(bounceV) < REST_VELOCITY) {
      return { ...state, y: BALL_CENTER_LIMIT, v: 0, atRest: true };
    }
    return { ...state, y: BALL_CENTER_LIMIT, v: bounceV };
  }
  return { ...state, y, v };
};

export const getBallVisual = (state: BallState): BallVisual => ({
  positionY: state.y,
  scale: [1, 1, 1],
});
