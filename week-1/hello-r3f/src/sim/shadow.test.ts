import { describe, expect, it } from "vitest";
import { createBall, stepBall } from "./ball";
import { BALL_CENTER_LIMIT, BALL_RADIUS } from "./config";
import { getBallShadow } from "./shadow";
import { simulate } from "./testing";

const atHeight = (height: number) => ({
  ...createBall(BALL_CENTER_LIMIT + height, 0),
});

describe("ball shadow", () => {
  it("is darkest and about the size of the ball when touching the floor", () => {
    const shadow = getBallShadow(atHeight(0));
    expect(shadow.opacity).toBeGreaterThan(0.4);
    expect(shadow.radius).toBeGreaterThan(BALL_RADIUS * 0.9);
    expect(shadow.radius).toBeLessThan(BALL_RADIUS * 1.4);
  });

  it("shrinks and fades as the ball rises", () => {
    let previous = getBallShadow(atHeight(0));
    for (const height of [0.5, 1, 2, 3, 4]) {
      const shadow = getBallShadow(atHeight(height));
      expect(shadow.opacity).toBeLessThan(previous.opacity);
      expect(shadow.radius).toBeLessThan(previous.radius);
      previous = shadow;
    }
  });

  it("stays faintly visible at the top rather than vanishing", () => {
    const top = getBallShadow(atHeight(50));
    expect(top.opacity).toBeGreaterThan(0.05);
    expect(top.radius).toBeGreaterThan(BALL_RADIUS * 0.3);
  });

  it("does not change once the ball is high enough", () => {
    expect(getBallShadow(atHeight(50))).toEqual(getBallShadow(atHeight(500)));
  });

  it("widens while the ball is squashed on landing", () => {
    const flying = getBallShadow({ ...atHeight(0), impactSpeed: 9 });
    const squashed = getBallShadow({
      ...atHeight(0),
      squashTime: 0.05,
      impactSpeed: 9,
    });
    expect(squashed.radius).toBeGreaterThan(flying.radius);
  });

  it("is not affected by the ball resting", () => {
    const resting = simulate(createBall(), 30, 1 / 60);
    expect(getBallShadow(resting).opacity).toBeGreaterThan(0.4);
  });

  it("never goes negative or above one", () => {
    let ball = createBall();
    for (let i = 0; i < 600; i++) {
      ball = stepBall(ball, 1 / 60);
      const { opacity, radius } = getBallShadow(ball);
      expect(opacity).toBeGreaterThanOrEqual(0);
      expect(opacity).toBeLessThanOrEqual(1);
      expect(radius).toBeGreaterThan(0);
    }
  });
});
