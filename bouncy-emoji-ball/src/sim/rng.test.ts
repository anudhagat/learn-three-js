import { describe, expect, it } from "vitest";
import { createRng } from "./rng";

const take = (rng: () => number, n: number) => Array.from({ length: n }, rng);

describe("seeded rng", () => {
  it("repeats the same sequence for the same seed", () => {
    expect(take(createRng(42), 20)).toEqual(take(createRng(42), 20));
  });

  it("gives different sequences for different seeds", () => {
    expect(take(createRng(1), 20)).not.toEqual(take(createRng(2), 20));
  });

  it("stays in [0, 1)", () => {
    for (const value of take(createRng(7), 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
