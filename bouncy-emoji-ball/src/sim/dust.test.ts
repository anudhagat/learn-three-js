import { describe, expect, it } from "vitest";
import { FLOOR_POSITION_Y, GRAVITY } from "./config";
import {
  getDustView,
  spawnImpactDust,
  spawnLaunchDust,
  stepDust,
  type Particle,
} from "./dust";
import { createRng } from "./rng";

const horizontalSpeed = (p: Particle) => Math.hypot(p.velocity[0], p.velocity[2]);
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

describe("impact dust", () => {
  it("scales the number of stars with impact speed", () => {
    const counts = [1, 2, 3, 4, 6, 9].map(
      (speed) => spawnImpactDust(speed, createRng(1)).length,
    );
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
    }
    expect(counts[counts.length - 1]).toBeGreaterThan(counts[0]);
  });

  it("makes no dust for the tiny last bounces", () => {
    expect(spawnImpactDust(0.8, createRng(1))).toEqual([]);
  });

  it("throws harder impacts out faster", () => {
    const soft = spawnImpactDust(4, createRng(3)).map(horizontalSpeed);
    const hard = spawnImpactDust(9, createRng(3)).map(horizontalSpeed);
    expect(mean(hard)).toBeGreaterThan(mean(soft));
  });

  it("starts at the floor and moves outwards and upwards", () => {
    for (const p of spawnImpactDust(8, createRng(5))) {
      expect(p.position[1]).toBeGreaterThanOrEqual(FLOOR_POSITION_Y);
      expect(p.position[1]).toBeLessThan(FLOOR_POSITION_Y + 0.5);
      expect(p.velocity[1]).toBeGreaterThan(0);
      // Moving away from the centre, not towards it
      const outward = p.position[0] * p.velocity[0] + p.position[2] * p.velocity[2];
      expect(outward).toBeGreaterThan(0);
    }
  });

  it("spreads the stars in different directions", () => {
    const angles = spawnImpactDust(9, createRng(9)).map((p) =>
      Math.atan2(p.velocity[2], p.velocity[0]),
    );
    expect(new Set(angles.map((a) => a.toFixed(3))).size).toBe(angles.length);
  });

  it("gives the same burst for the same random seed", () => {
    expect(spawnImpactDust(7, createRng(11))).toEqual(spawnImpactDust(7, createRng(11)));
  });

  it("starts every star fresh with a positive lifetime", () => {
    for (const p of spawnImpactDust(9, createRng(2))) {
      expect(p.age).toBe(0);
      expect(p.life).toBeGreaterThan(0);
      expect(p.size).toBeGreaterThan(0);
    }
  });
});

describe("launch dust", () => {
  const floorBottom = FLOOR_POSITION_Y; // The bottom of a ball that is on the floor

  it("is a small puff, smaller than a hard landing", () => {
    const puff = spawnLaunchDust(createRng(1), floorBottom).length;
    expect(puff).toBeGreaterThan(0);
    expect(puff).toBeLessThan(spawnImpactDust(9, createRng(1)).length);
  });

  it("starts at the floor when the ball launches from the floor", () => {
    for (const p of spawnLaunchDust(createRng(2), floorBottom)) {
      expect(p.position[1]).toBeGreaterThanOrEqual(floorBottom);
      expect(p.position[1]).toBeLessThan(floorBottom + 0.5);
    }
  });

  it("starts under the ball when it is launched in mid-air", () => {
    const bottom = FLOOR_POSITION_Y + 2.5;
    for (const p of spawnLaunchDust(createRng(2), bottom)) {
      expect(p.position[1]).toBeGreaterThanOrEqual(bottom);
      expect(p.position[1]).toBeLessThan(bottom + 0.5);
    }
  });

  it("still sprays outwards and upwards from there", () => {
    for (const p of spawnLaunchDust(createRng(3), FLOOR_POSITION_Y + 2)) {
      expect(p.velocity[1]).toBeGreaterThan(0);
      const outward = p.position[0] * p.velocity[0] + p.position[2] * p.velocity[2];
      expect(outward).toBeGreaterThan(0);
    }
  });
});

describe("stepping dust", () => {
  const star = (): Particle => ({
    position: [1, 0, 2],
    velocity: [2, 3, -1],
    age: 0,
    life: 1,
    size: 0.2,
  });

  it("moves each star by its velocity", () => {
    const [moved] = stepDust([star()], 0.1);
    expect(moved.position[0]).toBeCloseTo(1.2, 6);
    expect(moved.position[2]).toBeCloseTo(1.9, 6);
  });

  it("pulls the stars down gently", () => {
    const [moved] = stepDust([star()], 0.1);
    expect(moved.velocity[1]).toBeLessThan(3);
    // Lighter than the ball's own gravity, so the stars float
    expect(moved.velocity[1]).toBeGreaterThan(3 + GRAVITY * 0.1);
  });

  it("ages the stars", () => {
    expect(stepDust([star()], 0.25)[0].age).toBeCloseTo(0.25, 6);
  });

  it("removes stars once their life is over", () => {
    expect(stepDust([star()], 1.1)).toEqual([]);
  });

  it("does not change the stars it was given", () => {
    const original = star();
    const before = structuredClone(original);
    stepDust([original], 0.1);
    expect(original).toEqual(before);
  });
});

describe("dust view", () => {
  it("fades the stars out over their life", () => {
    const fresh: Particle = {
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      age: 0,
      life: 1,
      size: 0.2,
    };
    const half = { ...fresh, age: 0.5 };
    const [a, b] = getDustView([fresh, half]);
    expect(a.opacity).toBe(1);
    expect(b.opacity).toBeCloseTo(0.5, 6);
    expect(b.opacity).toBeGreaterThan(0);
  });

  it("exposes position and size for rendering", () => {
    const [view] = getDustView([
      { position: [1, 2, 3], velocity: [0, 0, 0], age: 0, life: 1, size: 0.3 },
    ]);
    expect(view.position).toEqual([1, 2, 3]);
    expect(view.size).toBeGreaterThan(0);
  });
});
