import { describe, expect, it } from "vitest";
import {
  BALL_CENTER_LIMIT,
  BALL_RADIUS,
  FLOOR_POSITION_Y,
  GRAVITY,
  RESTITUTION,
  createBall,
  getBallVisual,
  stepBall,
  type BallState,
} from "./physics";

const simulate = (
  state: BallState,
  seconds: number,
  dt: number,
  onFrame?: (s: BallState) => void,
) => {
  const frames = Math.round(seconds / dt);
  for (let i = 0; i < frames; i++) {
    state = stepBall(state, dt);
    onFrame?.(state);
  }
  return state;
};

describe("bounce physics", () => {
  it("follows an exact parabola in free flight", () => {
    // Launched at 9.8 m/s the ball peaks after exactly 1s at v0²/2g = 4.9 above the start
    const start = createBall(BALL_CENTER_LIMIT, 9.8);
    const apex = simulate(start, 1, 0.02);
    expect(apex.v).toBeCloseTo(0, 6);
    expect(apex.y - BALL_CENTER_LIMIT).toBeCloseTo(4.9, 6);
  });

  it("gives the same trajectory regardless of frame rate", () => {
    const start = createBall(BALL_CENTER_LIMIT, 9.8);
    const coarse = simulate(start, 0.8, 1 / 25);
    const fine = simulate(start, 0.8, 1 / 100);
    expect(coarse.y).toBeCloseTo(fine.y, 6);
  });

  it("peaks at RESTITUTION² of the drop height after a bounce", () => {
    const dropHeight = 2;
    let bounced = false;
    let peak = -Infinity;
    simulate(createBall(BALL_CENTER_LIMIT + dropHeight, 0), 1.5, 0.002, (s) => {
      if (s.v > 0) bounced = true;
      if (bounced) peak = Math.max(peak, s.y);
    });
    expect(peak - BALL_CENTER_LIMIT).toBeCloseTo(dropHeight * RESTITUTION ** 2, 2);
  });

  it("never goes below the floor, even after a huge time step", () => {
    const state = stepBall(createBall(BALL_CENTER_LIMIT + 1, -5), 3);
    expect(state.y).toBeGreaterThanOrEqual(BALL_CENTER_LIMIT);
    expect(Number.isFinite(state.y)).toBe(true);
    expect(Number.isFinite(state.v)).toBe(true);
  });

  it("comes to rest on the floor", () => {
    const state = simulate(createBall(), 30, 1 / 60);
    expect(state.atRest).toBe(true);
    expect(state.v).toBe(0);
    expect(state.y).toBe(BALL_CENTER_LIMIT);
  });

  it("uses gravity as the only acceleration", () => {
    const next = stepBall(createBall(0, 0), 0.1);
    expect(next.v).toBeCloseTo(GRAVITY * 0.1, 6);
  });
});

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
    while (state.v <= 0 || state.y > BALL_CENTER_LIMIT + 1e-9) {
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
