import { describe, expect, it } from "vitest";
import { createBall, stepBall } from "./ball";
import { SLEEP_DELAY } from "./config";
import { getExpression } from "./expression";
import { simulate } from "./testing";

const justSettled = () => {
  let ball = createBall();
  for (let i = 0; i < 60 * 30 && !ball.atRest; i++) ball = stepBall(ball, 1 / 60);
  return ball;
};

describe("expression", () => {
  it("is happy while rising", () => {
    expect(getExpression(createBall(0, 3))).toBe("happy");
  });

  it("stays happy while falling, even fast", () => {
    expect(getExpression(createBall(0, -1))).toBe("happy");
    expect(getExpression(createBall(0, -9))).toBe("happy");
  });

  it("stays happy while squashed on the floor", () => {
    const squashed = { ...createBall(-1.5, 3), squashTime: 0.02, impactSpeed: 5 };
    expect(getExpression(squashed)).toBe("happy");
  });

  it("stays happy for a moment after settling", () => {
    const rested = simulate(justSettled(), SLEEP_DELAY - 0.2, 1 / 60);
    expect(rested.atRest).toBe(true);
    expect(getExpression(rested)).toBe("happy");
  });

  it("falls asleep after resting for a while", () => {
    const rested = simulate(justSettled(), SLEEP_DELAY + 0.1, 1 / 60);
    expect(getExpression(rested)).toBe("sleepy");
  });

  it("wakes up as soon as the ball moves again", () => {
    expect(getExpression({ ...createBall(0, 3), restTime: 10 })).toBe("happy");
  });
});
