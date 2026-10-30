import { describe, expect, it } from "vitest";
import { BALL_CENTER_LIMIT, BALL_RADIUS, FLOOR_POSITION_Y } from "./config";
import { createBall, stepBall } from "./ball";
import { getBallVisual } from "./deformation";
import { simulate } from "./testing";

describe("squash and stretch", () => {
  const minScaleY = (dropHeight: number) => {
    let min = Infinity;
    simulate(createBall(BALL_CENTER_LIMIT + dropHeight, 0), 1.5, 1 / 120, (s) => {
      min = Math.min(min, getBallVisual(s).scale[1]);
    });
    return min;
  };

  it("is round at the top of a bounce", () => {
    expect(getBallVisual(createBall(0, 0)).scale).toEqual([1, 1, 1]);
  });

  it("stretches along y when moving fast in flight", () => {
    const [x, y, z] = getBallVisual(createBall(0, -8)).scale;
    expect(y).toBeGreaterThan(1);
    expect(x).toBeLessThan(1);
    expect(z).toBeLessThan(1);
  });

  it("squashes the ball when it hits the floor", () => {
    expect(minScaleY(2)).toBeLessThan(0.9);
  });

  it("squashes harder for harder impacts", () => {
    expect(minScaleY(4)).toBeLessThan(minScaleY(1));
  });

  it("barely deforms on the last small bounces", () => {
    expect(minScaleY(0.05)).toBeGreaterThan(0.98);
    expect(getBallVisual(createBall(0, -1)).scale[1]).toBeLessThan(1.02);
  });

  it("preserves volume", () => {
    simulate(createBall(BALL_CENTER_LIMIT + 2, 0), 3, 1 / 60, (s) => {
      const [x, y, z] = getBallVisual(s).scale;
      expect(x * y * z).toBeCloseTo(1, 6);
    });
  });

  it("keeps the bottom of the ball at or above the floor", () => {
    simulate(createBall(BALL_CENTER_LIMIT + 2, 0), 5, 1 / 60, (s) => {
      const { positionY, scale } = getBallVisual(s);
      expect(positionY - BALL_RADIUS * scale[1]).toBeGreaterThanOrEqual(
        FLOOR_POSITION_Y - 1e-9,
      );
    });
  });

  it("recovers its shape shortly after impact", () => {
    let state = createBall(BALL_CENTER_LIMIT + 2, 0);
    let previousV = state.v;
    for (let i = 0; i < 1000 && !(previousV < 0 && state.v > 0); i++) {
      previousV = state.v;
      state = stepBall(state, 1 / 120);
    }
    state = simulate(state, 0.25, 1 / 120);
    expect(getBallVisual(state).scale[1]).toBeGreaterThanOrEqual(1);
  });

  it("is a perfect sphere once at rest", () => {
    const state = simulate(createBall(), 30, 1 / 60);
    expect(getBallVisual(state)).toEqual({
      positionY: BALL_CENTER_LIMIT,
      scale: [1, 1, 1],
    });
  });
});
