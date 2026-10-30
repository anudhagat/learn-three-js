import { describe, expect, it } from "vitest";
import {
  BALL_CENTER_LIMIT,
  BALL_RADIUS,
  DIZZY_CLICKS,
  FLOOR_POSITION_Y,
  MAX_TILT,
} from "./config";
import { createBall } from "./ball";
import { getBallVisual } from "./deformation";
import { createRng } from "./rng";
import { spawnLaunchDust } from "./dust";
import {
  clickWorld,
  createWorld,
  getView,
  stepWorld,
  type World,
  type WorldEvent,
} from "./world";

const run = (world: World, seconds: number, dt = 1 / 60, rng = createRng(1)) => {
  const events: WorldEvent[] = [];
  for (let i = 0; i < Math.round(seconds / dt); i++) {
    const step = stepWorld(world, dt, rng);
    world = step.world;
    events.push(...step.events);
  }
  return { world, events };
};

describe("world", () => {
  it("advances the clock by each step", () => {
    const { world } = run(createWorld(), 1);
    expect(world.time).toBeCloseTo(1, 6);
  });

  it("caps the clock step like the ball does", () => {
    const { world } = stepWorld(createWorld(), 5, createRng(1));
    expect(world.time).toBeLessThan(0.1);
  });

  it("emits an impact event with the landing speed", () => {
    const start = { ...createWorld(), ball: createBall(BALL_CENTER_LIMIT + 2, 0) };
    const impacts = run(start, 1).events.filter((e) => e.type === "impact");
    expect(impacts.length).toBeGreaterThan(0);
    expect(impacts[0].speed).toBeCloseTo(Math.sqrt(2 * 9.8 * 2), 3);
  });

  it("emits impact events with decreasing speeds as the ball settles", () => {
    const speeds = run(createWorld(), 30)
      .events.filter((e) => e.type === "impact")
      .map((e) => e.speed);
    expect(speeds.length).toBeGreaterThan(5);
    expect(speeds[speeds.length - 1]).toBeLessThan(speeds[0]);
  });

  it("does not mutate the world it was given", () => {
    const world = createWorld();
    const before = structuredClone(world);
    stepWorld(world, 1 / 60, createRng(1));
    expect(world).toEqual(before);
  });
});

describe("clicking the world", () => {
  const resting = () => run(createWorld(), 30).world;

  it("launches a resting ball and emits a launch event", () => {
    const { world, events } = clickWorld(resting(), createRng(1));
    expect(getView(world).mode).toBe("rising");
    expect(events).toEqual([{ type: "launch" }]);
  });

  it("ignores a click while the ball is rising", () => {
    const rising = clickWorld(resting(), createRng(1)).world;
    const { world, events } = clickWorld(rising, createRng(1));
    expect(world.ball).toBe(rising.ball);
    expect(events).toEqual([]);
  });

  it("still counts an ignored click towards getting dizzy", () => {
    let world = clickWorld(resting(), createRng(1)).world;
    for (let i = 0; i < DIZZY_CLICKS; i++) world = clickWorld(world, createRng(1)).world;
    expect(getView(world).expression).toBe("dizzy");
  });

  it("shows the ball's shadow in the view, fainter when it is high", () => {
    const high = getView(createWorld()).shadow;
    const low = getView(resting()).shadow;
    expect(low.opacity).toBeGreaterThan(high.opacity);
    expect(low.radius).toBeGreaterThan(high.radius);
  });

  it("shows the expression in the view", () => {
    expect(getView(resting()).expression).toBe("sleepy");
  });

  it("launches again from a falling ball", () => {
    const falling = { ...createWorld(), ball: createBall(-1, -3) };
    const { world, events } = clickWorld(falling, createRng(1));
    expect(getView(world).mode).not.toBe("falling");
    expect(events).toEqual([{ type: "launch" }]);
  });
});

describe("view", () => {
  it("exposes the tilt, level when resting and tilted up at the top", () => {
    expect(getView(run(createWorld(), 30).world).pitch).toBe(0);
    expect(getView(createWorld()).pitch).toBeGreaterThan(0.9 * MAX_TILT);
  });

  it("exposes the visual and mode for the renderer", () => {
    const world = run(createWorld(), 0.5).world;
    const view = getView(world);
    expect(view.positionY).toBe(getBallVisual(world.ball).positionY);
    expect(view.scale).toEqual(getBallVisual(world.ball).scale);
    expect(["resting", "rising", "falling"]).toContain(view.mode);
  });
});

describe("dust in the world", () => {
  const rng = () => createRng(5);
  const dropped = () => ({ ...createWorld(), ball: createBall(BALL_CENTER_LIMIT + 3, 0) });

  it("throws out stars when the ball lands hard", () => {
    let world = dropped();
    const source = rng();
    let landed = false;
    for (let i = 0; i < 120 && !landed; i++) {
      const step = stepWorld(world, 1 / 60, source);
      world = step.world;
      landed = step.events.some((e) => e.type === "impact");
    }
    expect(landed).toBe(true);
    expect(world.dust.length).toBeGreaterThan(5);
  });

  it("shows the stars in the view", () => {
    const world = { ...createWorld(), dust: spawnLaunchDust(rng(), FLOOR_POSITION_Y) };
    expect(getView(world).dust).toHaveLength(world.dust.length);
  });

  it("lets the stars fade away", () => {
    const afterBounces = run(createWorld(), 30, 1 / 60, rng()).world;
    const later = run(afterBounces, 3, 1 / 60, rng()).world;
    expect(later.dust).toEqual([]);
  });

  it("throws out no stars for the last tiny bounces", () => {
    const resting = run(createWorld(), 30, 1 / 60, rng()).world;
    const { world } = stepWorld(resting, 1 / 60, rng());
    expect(world.dust).toEqual([]);
  });

  it("puffs a few stars when the ball is launched", () => {
    const resting = run(createWorld(), 30, 1 / 60, rng()).world;
    const { world } = clickWorld(resting, rng());
    expect(world.dust.length).toBeGreaterThan(0);
  });

  it("puffs from the floor when a resting ball is launched", () => {
    const resting = run(createWorld(), 30, 1 / 60, rng()).world;
    const { world } = clickWorld(resting, rng());
    for (const p of world.dust) {
      expect(p.position[1]).toBeLessThan(FLOOR_POSITION_Y + 0.5);
    }
  });

  it("puffs from under the ball, not the floor, when it is launched in mid-air", () => {
    const midAir = {
      ...createWorld(),
      ball: createBall(BALL_CENTER_LIMIT + 2.5, -3),
      dust: [],
    };
    const bottom = midAir.ball.y - BALL_RADIUS;
    const { world } = clickWorld(midAir, rng());
    expect(world.dust.length).toBeGreaterThan(0);
    for (const p of world.dust) {
      expect(p.position[1]).toBeGreaterThanOrEqual(bottom);
      expect(p.position[1]).toBeLessThan(bottom + 0.5);
    }
  });

  it("makes no puff for a click that is ignored", () => {
    const rising = clickWorld(run(createWorld(), 30, 1 / 60, rng()).world, rng()).world;
    const cleared = { ...rising, dust: [] };
    expect(clickWorld(cleared, rng()).world.dust).toEqual([]);
  });

  it("is repeatable with the same random seed", () => {
    const a = run(dropped(), 1, 1 / 60, createRng(8)).world;
    const b = run(dropped(), 1, 1 / 60, createRng(8)).world;
    expect(a.dust).toEqual(b.dust);
  });
});
