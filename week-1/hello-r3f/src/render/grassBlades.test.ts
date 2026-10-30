import { describe, expect, it } from "vitest";
import { createRng } from "../sim/rng";
import {
  BLADE_CLEARING,
  BLADE_RADIUS,
  FADE_START,
  TUFT_RADIUS,
  VIEW_NEAREST_Z,
  WIND_FAR,
  WIND_NEAR,
  isInView,
  scatterTufts,
  windFactor,
  type Obstacle,
} from "./grassBlades";
import { CAMERA_POSITION } from "./camera";

const distance = (x: number, z: number) => Math.hypot(x, z);

// Number of tufts per unit of the ground in an annulus, counting only the part of it
// the camera can see
const perVisibleArea = (
  tufts: { x: number; z: number }[],
  from: number,
  to: number,
) => {
  const step = 0.1;
  let area = 0;
  for (let x = -to; x < to; x += step) {
    for (let z = -to; z < to + 6; z += step) {
      const r = Math.hypot(x + step / 2, z + step / 2);
      if (r >= from && r < to && isInView(x + step / 2, z + step / 2)) area += step * step;
    }
  }
  const count = tufts.filter((t) => distance(t.x, t.z) >= from && distance(t.x, t.z) < to).length;
  return count / area;
};

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
    expect(perVisibleArea(tufts, BLADE_CLEARING, BLADE_CLEARING + 1)).toBeLessThan(
      perVisibleArea(tufts, FADE_START - 1.5, FADE_START - 0.5),
    );
  });

  it("only grows grass in the part of the ground the camera can see", () => {
    for (const t of tufts) {
      expect(isInView(t.x, t.z)).toBe(true);
      // Nothing nearer than the bottom edge of the view, or behind the camera
      expect(t.z).toBeLessThanOrEqual(VIEW_NEAREST_Z);
    }
  });

  it("reaches about nine units from the ball, not the whole circle", () => {
    expect(BLADE_RADIUS).toBeLessThanOrEqual(10);
    expect(BLADE_RADIUS).toBeGreaterThanOrEqual(8);
  });

  it("fades out gradually with distance, with no visible edge", () => {
    const many = scatterTufts(createRng(8), 6000, []);
    const bands: number[] = [];
    for (let from = FADE_START; from + 1 <= BLADE_RADIUS; from += 1) {
      bands.push(perVisibleArea(many, from, from + 1));
    }
    for (let i = 1; i < bands.length; i++) {
      expect(bands[i]).toBeLessThan(bands[i - 1]);
    }
    // And right at the edge it has almost thinned out completely
    const near = perVisibleArea(many, FADE_START, FADE_START + 1);
    expect(bands[bands.length - 1]).toBeLessThan(near * 0.25);
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

describe("view", () => {
  it("excludes ground behind and just below the camera", () => {
    expect(isInView(0, CAMERA_POSITION[2] + 1)).toBe(false);
    expect(isInView(0, VIEW_NEAREST_Z + 0.5)).toBe(false);
  });

  it("includes ground straight ahead, near and far", () => {
    expect(isInView(0, 0)).toBe(true);
    expect(isInView(0, -9)).toBe(true);
    expect(isInView(0, VIEW_NEAREST_Z)).toBe(true);
  });

  it("excludes ground far off to the side, outside the field of view", () => {
    expect(isInView(30, 0)).toBe(false);
    expect(isInView(-30, 0)).toBe(false);
  });
});

describe("wind", () => {
  const camera = { x: CAMERA_POSITION[0], z: CAMERA_POSITION[2] };

  it("is full strength close to the camera", () => {
    expect(windFactor(0, camera.z - WIND_NEAR + 0.1)).toBe(1);
    expect(windFactor(camera.x, camera.z - 1)).toBe(1);
  });

  it("is gone far from the camera", () => {
    expect(windFactor(0, camera.z - WIND_FAR - 0.1)).toBe(0);
    expect(windFactor(0, -9)).toBe(0);
  });

  it("fades smoothly in between", () => {
    let previous = 1;
    for (let d = WIND_NEAR; d <= WIND_FAR; d += 0.5) {
      const w = windFactor(0, camera.z - d);
      expect(w).toBeLessThanOrEqual(previous);
      previous = w;
    }
    expect(windFactor(0, camera.z - (WIND_NEAR + WIND_FAR) / 2)).toBeGreaterThan(0);
    expect(windFactor(0, camera.z - (WIND_NEAR + WIND_FAR) / 2)).toBeLessThan(1);
  });

  it("gives every blade a wind strength from zero to one, still for the far ones", () => {
    const tufts = scatterTufts(createRng(5), 2000, []);
    for (const t of tufts) {
      for (const b of t.blades) {
        expect(b.wind).toBeGreaterThanOrEqual(0);
        expect(b.wind).toBeLessThanOrEqual(1);
        expect(b.wind).toBeCloseTo(windFactor(b.x, b.z), 9);
      }
    }
    const far = tufts.flatMap((t) => t.blades).filter((b) => b.z < -7);
    expect(far.length).toBeGreaterThan(0);
    for (const b of far) expect(b.wind).toBe(0);
  });
});
