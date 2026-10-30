import { describe, expect, it } from "vitest";
import { createRng } from "../sim/rng";
import { tileableNoise } from "./noise";

const SIZE = 128;
const at = (field: Float32Array, x: number, y: number) => field[y * SIZE + x];

describe("tileable noise", () => {
  const field = tileableNoise(createRng(4), SIZE, 4, 3);

  it("fills the whole square, repeatably", () => {
    expect(field).toHaveLength(SIZE * SIZE);
    expect(tileableNoise(createRng(4), SIZE, 4, 3)).toEqual(field);
    expect(tileableNoise(createRng(5), SIZE, 4, 3)).not.toEqual(field);
  });

  it("stays between zero and one, using much of the range", () => {
    let min = Infinity;
    let max = -Infinity;
    for (const v of field) {
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThanOrEqual(1);
    expect(max - min).toBeGreaterThan(0.4);
  });

  it("is smooth: neighbouring pixels are close in value", () => {
    let biggest = 0;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE - 1; x++) {
        biggest = Math.max(biggest, Math.abs(at(field, x + 1, y) - at(field, x, y)));
      }
    }
    expect(biggest).toBeLessThan(0.1);
  });

  it("tiles with no seam: the far edge flows into the near edge", () => {
    let biggest = 0;
    for (let i = 0; i < SIZE; i++) {
      biggest = Math.max(
        biggest,
        Math.abs(at(field, SIZE - 1, i) - at(field, 0, i)), // Left and right edges
        Math.abs(at(field, i, SIZE - 1) - at(field, i, 0)), // Top and bottom edges
      );
    }
    expect(biggest).toBeLessThan(0.1);
  });

  it("has more fine detail with more octaves", () => {
    const rough = (octaves: number) => {
      const f = tileableNoise(createRng(4), SIZE, 4, octaves);
      let sum = 0;
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE - 1; x++) sum += Math.abs(at(f, x + 1, y) - at(f, x, y));
      }
      return sum;
    };
    expect(rough(3)).toBeGreaterThan(rough(1));
  });
});
