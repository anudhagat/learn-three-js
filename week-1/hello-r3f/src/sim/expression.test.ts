import { describe, expect, it } from "vitest";
import { createBall, stepBall } from "./ball";
import { DIZZY_CLICKS, DIZZY_DURATION, DIZZY_WINDOW, SLEEP_DELAY } from "./config";
import {
  createExpressionState,
  getExpression,
  registerClick,
  type ExpressionState,
} from "./expression";
import { simulate } from "./testing";

const calm = createExpressionState();

const justSettled = () => {
  let ball = createBall();
  for (let i = 0; i < 60 * 30 && !ball.atRest; i++) ball = stepBall(ball, 1 / 60);
  return ball;
};

describe("expression", () => {
  it("is happy while rising", () => {
    expect(getExpression(createBall(0, 3), calm, 0)).toBe("happy");
  });

  it("stays happy while falling, even fast", () => {
    expect(getExpression(createBall(0, -1), calm, 0)).toBe("happy");
    expect(getExpression(createBall(0, -9), calm, 0)).toBe("happy");
  });

  it("stays happy while squashed on the floor", () => {
    const squashed = { ...createBall(-1.5, 3), squashTime: 0.02, impactSpeed: 5 };
    expect(getExpression(squashed, calm, 0)).toBe("happy");
  });

  it("stays happy for a moment after settling", () => {
    const rested = simulate(justSettled(), SLEEP_DELAY - 0.2, 1 / 60);
    expect(rested.atRest).toBe(true);
    expect(getExpression(rested, calm, 30)).toBe("happy");
  });

  it("falls asleep after resting for a while", () => {
    const rested = simulate(justSettled(), SLEEP_DELAY + 0.1, 1 / 60);
    expect(getExpression(rested, calm, 30)).toBe("sleepy");
  });

  it("wakes up as soon as the ball moves again", () => {
    expect(getExpression({ ...createBall(0, 3), restTime: 10 }, calm, 0)).toBe("happy");
  });
});

describe("dizzy", () => {
  const ball = createBall(0, 3);
  const clickAt = (times: number[]): ExpressionState =>
    times.reduce((state, t) => registerClick(state, t), calm);
  const rapid = Array.from({ length: DIZZY_CLICKS }, (_, i) => i * 0.2);
  const lastRapid = rapid[rapid.length - 1];

  it("starts after enough rapid clicks", () => {
    expect(getExpression(ball, clickAt(rapid), lastRapid)).toBe("dizzy");
  });

  it("does not start with one click too few", () => {
    const fewer = rapid.slice(0, -1);
    expect(getExpression(ball, clickAt(fewer), 1)).not.toBe("dizzy");
  });

  it("does not start when the clicks are spread out", () => {
    const spacing = (DIZZY_WINDOW + 0.5) / (DIZZY_CLICKS - 1);
    const spread = Array.from({ length: DIZZY_CLICKS }, (_, i) => i * spacing);
    expect(getExpression(ball, clickAt(spread), spread[spread.length - 1])).not.toBe(
      "dizzy",
    );
  });

  it("wears off after a while", () => {
    const state = clickAt(rapid);
    expect(getExpression(ball, state, lastRapid + DIZZY_DURATION - 0.1)).toBe("dizzy");
    expect(getExpression(ball, state, lastRapid + DIZZY_DURATION + 0.1)).not.toBe(
      "dizzy",
    );
  });

  it("outranks sleepy", () => {
    const resting = simulate(justSettled(), SLEEP_DELAY + 1, 1 / 60);
    expect(getExpression(resting, clickAt(rapid), lastRapid)).toBe("dizzy");
  });

  it("only keeps recent clicks", () => {
    const many = Array.from({ length: 200 }, (_, i) => i * 10);
    expect(clickAt(many).clicks.length).toBeLessThanOrEqual(DIZZY_CLICKS);
  });
});
