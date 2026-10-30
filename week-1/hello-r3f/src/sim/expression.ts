import {
  DIZZY_CLICKS,
  DIZZY_DURATION,
  DIZZY_WINDOW,
  SLEEP_DELAY,
  SLEEP_TRANSITION,
} from "./config";
import type { BallState } from "./ball";

export type Expression = "happy" | "sleepy" | "dizzy";

// The timed part of the face: normal until rapid clicking makes the ball dizzy,
// then dizzy until `dizzyUntil`
export interface ExpressionState {
  clicks: number[]; // Times of the most recent clicks
  dizzyUntil: number;
}

export const createExpressionState = (): ExpressionState => ({
  clicks: [],
  dizzyUntil: -Infinity,
});

export const registerClick = (state: ExpressionState, time: number): ExpressionState => {
  const clicks = [...state.clicks, time].slice(-DIZZY_CLICKS);
  const rapid = clicks.length === DIZZY_CLICKS && time - clicks[0] <= DIZZY_WINDOW;
  return { clicks, dizzyUntil: rapid ? time + DIZZY_DURATION : state.dizzyUntil };
};

// Dizzy outranks asleep; otherwise awake until the ball has rested for SLEEP_DELAY
export const getExpression = (
  ball: BallState,
  state: ExpressionState,
  time: number,
): Expression => {
  if (time < state.dizzyUntil) return "dizzy";
  return ball.atRest && ball.restTime >= SLEEP_DELAY ? "sleepy" : "happy";
};

const smoothstep = (t: number) => {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * (3 - 2 * x);
};

// How far gone the ball is, from 0 awake to 1 fast asleep. Once it has rested for
// SLEEP_DELAY it drifts off over SLEEP_TRANSITION, easing in and out.
export const getDrowsiness = (ball: BallState): number =>
  ball.atRest ? smoothstep((ball.restTime - SLEEP_DELAY) / SLEEP_TRANSITION) : 0;
