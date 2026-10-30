import { DIZZY_CLICKS, DIZZY_DURATION, DIZZY_WINDOW, SLEEP_DELAY } from "./config";
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
