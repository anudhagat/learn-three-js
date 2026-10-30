import { describe, expect, it } from "vitest";
import { createBall } from "./ball";
import { DIZZY_CLICKS, DIZZY_DURATION, DIZZY_WINDOW } from "./config";
import {
  createExpressionState,
  getExpression,
  registerClick,
  type ExpressionState,
} from "./expression";
import { simulate } from "./testing";

const calm = createExpressionState();

const clickAt = (times: number[]): ExpressionState =>
  times.reduce((state, t) => registerClick(state, t), calm);

describe("expression by ball mode", () => {
  it("is sleepy once the ball is resting", () => {
    const resting = simulate(createBall(), 30, 1 / 60);
    expect(getExpression(resting, calm, 30)).toBe("sleepy");
  });

  it("is happy while rising", () => {
    expect(getExpression(createBall(0, 3), calm, 0)).toBe("happy");
  });

  it("is happy while drifting down slowly", () => {
    expect(getExpression(createBall(0, -1), calm, 0)).toBe("happy");
  });

  it("is wide-eyed while falling fast", () => {
    expect(getExpression(createBall(0, -6), calm, 0)).toBe("wideEyed");
  });

  it("squints while squashed on the floor", () => {
    const squashed = { ...createBall(-1.5, 3), squashTime: 0.02, impactSpeed: 5 };
    expect(getExpression(squashed, calm, 0)).toBe("squint");
  });
});

describe("dizzy", () => {
  const ball = createBall(0, 3);

  it("starts after enough rapid clicks", () => {
    const times = Array.from({ length: DIZZY_CLICKS }, (_, i) => i * 0.2);
    const state = clickAt(times);
    expect(getExpression(ball, state, times[times.length - 1])).toBe("dizzy");
  });

  it("does not start with one click too few", () => {
    const times = Array.from({ length: DIZZY_CLICKS - 1 }, (_, i) => i * 0.2);
    expect(getExpression(ball, clickAt(times), 1)).not.toBe("dizzy");
  });

  it("does not start when the clicks are spread out", () => {
    const spacing = (DIZZY_WINDOW + 0.5) / (DIZZY_CLICKS - 1);
    const times = Array.from({ length: DIZZY_CLICKS }, (_, i) => i * spacing);
    expect(getExpression(ball, clickAt(times), times[times.length - 1])).not.toBe(
      "dizzy",
    );
  });

  it("wears off after a while", () => {
    const times = Array.from({ length: DIZZY_CLICKS }, (_, i) => i * 0.2);
    const state = clickAt(times);
    const last = times[times.length - 1];
    expect(getExpression(ball, state, last + DIZZY_DURATION - 0.1)).toBe("dizzy");
    expect(getExpression(ball, state, last + DIZZY_DURATION + 0.1)).not.toBe("dizzy");
  });

  it("outranks every other expression", () => {
    const times = Array.from({ length: DIZZY_CLICKS }, (_, i) => i * 0.2);
    const squashed = { ...createBall(-1.5, 3), squashTime: 0.02, impactSpeed: 5 };
    expect(getExpression(squashed, clickAt(times), 1)).toBe("dizzy");
  });

  it("only keeps recent clicks", () => {
    const times = Array.from({ length: 200 }, (_, i) => i * 10);
    expect(clickAt(times).clicks.length).toBeLessThanOrEqual(DIZZY_CLICKS);
  });
});
