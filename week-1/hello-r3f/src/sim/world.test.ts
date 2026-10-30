import { describe, expect, it } from "vitest";
import { BALL_CENTER_LIMIT, DIZZY_CLICKS, MAX_TILT } from "./config";
import { createBall } from "./ball";
import { getBallVisual } from "./deformation";
import {
  clickWorld,
  createWorld,
  getView,
  stepWorld,
  type World,
  type WorldEvent,
} from "./world";

const run = (world: World, seconds: number, dt = 1 / 60) => {
  const events: WorldEvent[] = [];
  for (let i = 0; i < Math.round(seconds / dt); i++) {
    const step = stepWorld(world, dt);
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
    const { world } = stepWorld(createWorld(), 5);
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
    stepWorld(world, 1 / 60);
    expect(world).toEqual(before);
  });
});

describe("clicking the world", () => {
  const resting = () => run(createWorld(), 30).world;

  it("launches a resting ball and emits a launch event", () => {
    const { world, events } = clickWorld(resting());
    expect(getView(world).mode).toBe("rising");
    expect(events).toEqual([{ type: "launch" }]);
  });

  it("ignores a click while the ball is rising", () => {
    const rising = clickWorld(resting()).world;
    const { world, events } = clickWorld(rising);
    expect(world.ball).toBe(rising.ball);
    expect(events).toEqual([]);
  });

  it("still counts an ignored click towards getting dizzy", () => {
    let world = clickWorld(resting()).world;
    for (let i = 0; i < DIZZY_CLICKS; i++) world = clickWorld(world).world;
    expect(getView(world).expression).toBe("dizzy");
  });

  it("shows the expression in the view", () => {
    expect(getView(resting()).expression).toBe("sleepy");
  });

  it("launches again from a falling ball", () => {
    const falling = { ...createWorld(), ball: createBall(-1, -3) };
    const { world, events } = clickWorld(falling);
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
