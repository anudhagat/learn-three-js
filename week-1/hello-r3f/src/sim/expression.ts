import {
  DIZZY_CLICKS,
  DIZZY_DURATION,
  DIZZY_WINDOW,
  SLEEP_DELAY,
  WIDE_EYED_SPEED,
} from "./config";
import { getMode, type BallMode, type BallState } from "./ball";

export type Expression = "sleepy" | "happy" | "wideEyed" | "squint" | "dizzy";

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

const STEADY_EXPRESSION: Record<BallMode, Expression> = {
  resting: "happy", // Falls asleep only after resting for SLEEP_DELAY
  rising: "happy",
  falling: "happy",
};

export const getExpression = (
  ball: BallState,
  state: ExpressionState,
  time: number,
): Expression => {
  if (time < state.dizzyUntil) return "dizzy";
  if (ball.squashTime >= 0) return "squint";
  const mode = getMode(ball);
  if (mode === "resting" && ball.restTime >= SLEEP_DELAY) return "sleepy";
  if (mode === "falling" && -ball.v >= WIDE_EYED_SPEED) return "wideEyed";
  return STEADY_EXPRESSION[mode];
};
