import { describe, expect, it } from "vitest";
import {
  BALL_CENTER_LIMIT,
  GRAVITY,
  INITIAL_POSITION_Y,
  RESTITUTION,
} from "./config";
import {
  createBall,
  getMode,
  jumpBall,
  stepBall,
  stepBallWithEvents,
  type BallState,
} from "./ball";
import { simulate } from "./testing";

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
    const coarse = simulate(start, 0.8, 1 / 40);
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
    const next = stepBall(createBall(0, 0), 1 / 60);
    expect(next.v).toBeCloseTo(GRAVITY / 60, 6);
  });
});

describe("jumping", () => {
  const peakAfter = (state: BallState) => {
    let peak = -Infinity;
    // Stop before the first landing so only the jump itself is measured
    simulate(state, 1, 0.002, (s) => {
      if (s.v >= 0) peak = Math.max(peak, s.y);
    });
    return peak;
  };

  it("wakes a resting ball and sends it up to the starting height", () => {
    const resting = simulate(createBall(), 30, 1 / 60);
    const jumping = jumpBall(resting);
    expect(jumping.atRest).toBe(false);
    expect(peakAfter(jumping)).toBeCloseTo(INITIAL_POSITION_Y, 2);
  });

  it("reaches the same height when clicked mid-air", () => {
    const midAir = createBall(BALL_CENTER_LIMIT + 0.5, -3);
    expect(peakAfter(jumpBall(midAir))).toBeCloseTo(INITIAL_POSITION_Y, 2);
  });

  it("does not push a ball already above the starting height", () => {
    const high = jumpBall(createBall(INITIAL_POSITION_Y + 1, -2));
    expect(high.v).toBe(0);
  });

  it("ignores clicks while the ball is rising", () => {
    const rising = createBall(BALL_CENTER_LIMIT + 0.5, 3);
    expect(jumpBall(rising)).toEqual(rising);
  });

  it("still jumps while the ball is falling", () => {
    const falling = jumpBall(createBall(BALL_CENTER_LIMIT + 0.5, -3));
    expect(falling.v).toBeGreaterThan(0);
  });
});

describe("ball mode", () => {
  it("is resting once the ball has settled", () => {
    const resting = simulate(createBall(), 30, 1 / 60);
    expect(getMode(resting)).toBe("resting");
  });

  it("is rising while moving up", () => {
    expect(getMode(createBall(0, 3))).toBe("rising");
  });

  it("is falling while moving down", () => {
    expect(getMode(createBall(0, -3))).toBe("falling");
  });

  it("counts the apex as falling", () => {
    expect(getMode(createBall(0, 0))).toBe("falling");
  });

  it("does not report resting for a ball that is still bouncing", () => {
    const bouncing = simulate(createBall(), 2, 1 / 60);
    expect(getMode(bouncing)).not.toBe("resting");
  });
});

describe("ball events", () => {
  it("reports no events in free flight", () => {
    const { events } = stepBallWithEvents(createBall(0, 0), 1 / 60);
    expect(events).toEqual([]);
  });

  it("reports an impact with its speed when the ball lands", () => {
    // Dropped from 2 above the floor, the ball lands at √(2·g·h)
    let ball = createBall(BALL_CENTER_LIMIT + 2, 0);
    const impacts: number[] = [];
    for (let i = 0; i < 100 && impacts.length === 0; i++) {
      const step = stepBallWithEvents(ball, 1 / 60);
      ball = step.ball;
      for (const e of step.events) impacts.push(e.speed);
    }
    expect(impacts).toHaveLength(1);
    expect(impacts[0]).toBeCloseTo(Math.sqrt(2 * -GRAVITY * 2), 3);
  });

  it("reports the final settling impact too", () => {
    let ball = createBall();
    let impacts = 0;
    for (let i = 0; i < 60 * 30; i++) {
      const step = stepBallWithEvents(ball, 1 / 60);
      ball = step.ball;
      impacts += step.events.length;
    }
    expect(ball.atRest).toBe(true);
    expect(impacts).toBeGreaterThan(5);
  });

  it("reports nothing for a ball at rest", () => {
    const resting = simulate(createBall(), 30, 1 / 60);
    expect(stepBallWithEvents(resting, 1 / 60).events).toEqual([]);
  });

  it("matches stepBall for the ball state", () => {
    const ball = createBall(BALL_CENTER_LIMIT + 0.01, -5);
    expect(stepBallWithEvents(ball, 1 / 60).ball).toEqual(stepBall(ball, 1 / 60));
  });
});
