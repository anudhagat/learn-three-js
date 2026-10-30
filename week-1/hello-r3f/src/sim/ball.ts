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
  restTime: number; // Seconds the ball has been at rest
}

export const createBall = (y = INITIAL_POSITION_Y, v = 0.02): BallState => ({
  y,
  v,
  atRest: false,
  squashTime: -1,
  impactSpeed: 0,
  restTime: 0,
});

export type BallMode = "resting" | "rising" | "falling";

// Derived from the state rather than stored, so it can never drift out of sync
export const getMode = (ball: BallState): BallMode =>
  ball.atRest ? "resting" : ball.v > 0 ? "rising" : "falling";

// Clicks are ignored while the ball is rising, so repeated clicks can't keep boosting it
const CLICK_JUMPS: Record<BallMode, boolean> = {
  resting: true,
  rising: false,
  falling: true,
};

// Launch the ball upward so it peaks at its starting height
export const jumpBall = (state: BallState): BallState =>
  CLICK_JUMPS[getMode(state)]
    ? {
        ...state,
        atRest: false,
        restTime: 0,
        v: Math.sqrt(2 * -GRAVITY * Math.max(INITIAL_POSITION_Y - state.y, 0)),
      }
    : state;

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

export interface ImpactEvent {
  type: "impact";
  speed: number; // Speed at the moment the ball hit the floor
}

export interface BallStep {
  ball: BallState;
  events: ImpactEvent[];
}

export const stepBallWithEvents = (state: BallState, rawDelta: number): BallStep => {
  const dt = Math.min(rawDelta, MAX_DELTA);
  if (state.atRest) {
    return { ball: { ...state, restTime: state.restTime + dt }, events: [] };
  }

  const next = fall(state.y, state.v, dt);
  if (next.y > BALL_CENTER_LIMIT) {
    return { ball: advanceSquash({ ...state, ...next }, dt), events: [] };
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
  const events: ImpactEvent[] = [{ type: "impact", speed: impactSpeed }];

  if (bounceV < REST_VELOCITY) {
    return {
      ball: { ...state, y: BALL_CENTER_LIMIT, v: 0, atRest: true, squashTime: -1, restTime: 0 },
      events,
    };
  }

  // Spend the rest of the frame on the way back up
  return {
    ball: advanceSquash(
      {
        ...state,
        ...fall(BALL_CENTER_LIMIT, bounceV, dt - tHit),
        squashTime: 0,
        impactSpeed,
      },
      dt - tHit,
    ),
    events,
  };
};

export const stepBall = (state: BallState, rawDelta: number): BallState =>
  stepBallWithEvents(state, rawDelta).ball;
