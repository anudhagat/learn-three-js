import { describe, expect, it } from "vitest";
import { createRng } from "../sim/rng";
import {
  BLADE_CLEARING,
  BLADE_RADIUS,
  TUFT_RADIUS,
  scatterTufts,
  type Obstacle,
} from "./grassBlades";

const distance = (x: number, z: number) => Math.hypot(x, z);

describe("grass tufts", () => {
  const obstacles: Obstacle[] = [
    { position: [4, 1], size: 1 },
    { position: [-6, -3], size: 1.4 },
  ];
  const tufts = scatterTufts(createRng(3), 1200, obstacles);
  const blades = tufts.flatMap((t) => t.blades);

  it("scatters exactly the requested number of tufts, repeatably", () => {
    expect(tufts).toHaveLength(1200);
    expect(scatterTufts(createRng(3), 1200, obstacles)).toEqual(tufts);
    expect(scatterTufts(createRng(4), 1200, obstacles)).not.toEqual(tufts);
  });

  it("keeps a clearing around the ball and stays within the lawn radius", () => {
    for (const t of tufts) {
      expect(distance(t.x, t.z)).toBeGreaterThanOrEqual(BLADE_CLEARING);
      expect(distance(t.x, t.z)).toBeLessThanOrEqual(BLADE_RADIUS);
    }
  });

  it("keeps every blade out of the candy", () => {
    for (const b of blades) {
      for (const o of obstacles) {
        expect(distance(b.x - o.position[0], b.z - o.position[1])).toBeGreaterThan(
          o.size * 1.05,
        );
      }
    }
  });

  it("thins out towards the clearing instead of stopping abruptly", () => {
    const perArea = (from: number, to: number) =>
      tufts.filter((t) => distance(t.x, t.z) >= from && distance(t.x, t.z) < to).length /
      (Math.PI * (to ** 2 - from ** 2));
    expect(perArea(BLADE_CLEARING, BLADE_CLEARING + 1)).toBeLessThan(
      perArea(BLADE_RADIUS - 5, BLADE_RADIUS - 4),
    );
  });

  it("grows each tuft from three to four blades, spread loosely over a patch", () => {
    for (const t of tufts) {
      expect(t.blades.length).toBeGreaterThanOrEqual(3);
      expect(t.blades.length).toBeLessThanOrEqual(4);
      for (const b of t.blades) {
        expect(distance(b.x - t.x, b.z - t.z)).toBeLessThanOrEqual(TUFT_RADIUS + 1e-9);
      }
    }
  });

  it("puts the tallest blade in the middle and fans the others outwards", () => {
    for (const t of tufts) {
      const [middle, ...ring] = t.blades;
      expect(middle.height).toBeGreaterThan(Math.max(...ring.map((b) => b.height)));
      for (const b of ring) {
        // The blade faces away from the middle of the tuft, and leans that way
        const yaw = Math.atan2(b.x - t.x, b.z - t.z);
        expect(Math.cos(b.yaw - yaw)).toBeGreaterThan(0.99);
        expect(b.lean).toBeGreaterThan(middle.lean);
      }
    }
  });

  it("spreads each tuft's blades out so the lawn doesn't look clumpy", () => {
    for (const t of tufts) {
      for (const b of t.blades.slice(1)) {
        expect(distance(b.x - t.x, b.z - t.z)).toBeGreaterThanOrEqual(TUFT_RADIUS * 0.45);
      }
    }
    expect(TUFT_RADIUS).toBeGreaterThanOrEqual(0.2);
  });

  it("makes short, slim blades that are not needles", () => {
    for (const b of blades) {
      // Short next to the ball, which is 0.75 across, so they read as grass
      expect(b.height).toBeGreaterThanOrEqual(0.14);
      expect(b.height).toBeLessThanOrEqual(0.4);
      expect(b.width).toBeGreaterThanOrEqual(0.055);
      expect(b.width).toBeLessThanOrEqual(0.1);
      // Long thin blades are what read as spikes
      expect(b.height / b.width).toBeLessThanOrEqual(6);
      expect(b.lean).toBeGreaterThanOrEqual(0);
      expect(b.lean).toBeLessThanOrEqual(0.95);
    }
  });

  it("varies tone and wind phase between tufts, but keeps a tuft in step", () => {
    const tones = tufts.map((t) => t.blades[0].tone);
    const phases = tufts.map((t) => t.blades[0].phase);
    expect(Math.max(...tones) - Math.min(...tones)).toBeGreaterThan(0.8);
    expect(Math.max(...phases) - Math.min(...phases)).toBeGreaterThan(5);
    for (const t of tufts) {
      const tuftPhases = t.blades.map((b) => b.phase);
      expect(Math.max(...tuftPhases) - Math.min(...tuftPhases)).toBeLessThan(0.7);
    }
  });

  it("scatters nothing when asked for nothing", () => {
    expect(scatterTufts(createRng(1), 0, [])).toEqual([]);
  });
});
