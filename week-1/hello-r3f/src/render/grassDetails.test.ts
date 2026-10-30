import { describe, expect, it } from "vitest";
import { createRng } from "../sim/rng";
import { scatterGrass, wrapOffsets } from "./grassDetails";

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

describe("wrap offsets", () => {
  const has = (offsets: number[][], dx: number, dy: number) =>
    offsets.some(([x, y]) => x === dx && y === dy);

  it("needs only the item itself in the middle of the tile", () => {
    expect(wrapOffsets(0.5, 0.5, 0.1)).toEqual([[0, 0]]);
  });

  it("adds a copy on the far side near the left or right edge", () => {
    expect(has(wrapOffsets(0.03, 0.5, 0.1), 1, 0)).toBe(true);
    expect(has(wrapOffsets(0.97, 0.5, 0.1), -1, 0)).toBe(true);
  });

  it("adds a copy near the top or bottom edge", () => {
    expect(has(wrapOffsets(0.5, 0.03, 0.1), 0, 1)).toBe(true);
    expect(has(wrapOffsets(0.5, 0.97, 0.1), 0, -1)).toBe(true);
  });

  it("adds all four copies in a corner", () => {
    const corner = wrapOffsets(0.02, 0.02, 0.1);
    expect(corner).toHaveLength(4);
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      expect(has(corner, dx, dy)).toBe(true);
    }
  });

  it("always includes the original", () => {
    for (const [x, y] of [[0.01, 0.99], [0.5, 0.02], [0.99, 0.5], [0.3, 0.3]]) {
      expect(has(wrapOffsets(x, y, 0.1), 0, 0)).toBe(true);
    }
  });

  it("adds no copies with no margin", () => {
    expect(wrapOffsets(0.001, 0.999, 0)).toEqual([[0, 0]]);
  });
});
