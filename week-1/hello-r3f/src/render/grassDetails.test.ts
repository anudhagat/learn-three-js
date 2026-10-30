import { describe, expect, it } from "vitest";
import { createRng } from "../sim/rng";
import { scatterGrass } from "./grassDetails";

describe("grass details", () => {
  const details = scatterGrass(createRng(3), 400, 12);

  it("scatters the requested number of blades and flowers", () => {
    expect(details.blades).toHaveLength(400);
    expect(details.flowers).toHaveLength(12);
  });

  it("is repeatable for the same seed", () => {
    expect(scatterGrass(createRng(3), 400, 12)).toEqual(details);
    expect(scatterGrass(createRng(4), 400, 12)).not.toEqual(details);
  });

  it("keeps every position inside the unit tile", () => {
    for (const item of [...details.blades, ...details.flowers]) {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.x).toBeLessThan(1);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeLessThan(1);
    }
  });

  it("grows blades roughly upright, short, and in a range of shades", () => {
    for (const blade of details.blades) {
      expect(Math.abs(blade.lean)).toBeLessThanOrEqual(0.6);
      expect(blade.length).toBeGreaterThan(0);
      expect(blade.length).toBeLessThan(0.08);
      expect(blade.shade).toBeGreaterThanOrEqual(0);
      expect(blade.shade).toBeLessThanOrEqual(1);
    }
    const shades = details.blades.map((b) => b.shade);
    expect(Math.max(...shades) - Math.min(...shades)).toBeGreaterThan(0.5);
  });

  it("makes the flowers small and coloured", () => {
    for (const flower of details.flowers) {
      expect(flower.radius).toBeGreaterThan(0);
      expect(flower.radius).toBeLessThan(0.03);
      expect(flower.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("scatters nothing when asked for nothing", () => {
    expect(scatterGrass(createRng(1), 0, 0)).toEqual({ blades: [], flowers: [] });
  });
});
