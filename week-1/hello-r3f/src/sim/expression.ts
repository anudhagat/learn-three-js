import { SLEEP_DELAY } from "./config";
import type { BallState } from "./ball";

export type Expression = "happy" | "sleepy";

// Awake until the ball has been resting for SLEEP_DELAY, then asleep
export const getExpression = (ball: BallState): Expression =>
  ball.atRest && ball.restTime >= SLEEP_DELAY ? "sleepy" : "happy";
