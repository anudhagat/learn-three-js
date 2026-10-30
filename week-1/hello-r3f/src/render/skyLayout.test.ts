import { describe, expect, it } from "vitest";
import { createRng } from "../sim/rng";
import {
  CLOUD_PUFF_SQUASH,
  CLOUD_WRAP,
  SUN_AZIMUTH,
  SUN_ELEVATION,
  driftAzimuth,
  hillProfile,
  scatterClouds,
  scatterStars,
  skyDirection,
} from "./skyLayout";

const angleBetween = (a: number[], b: number[]) =>
  Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));

describe("sky direction", () => {
  it("looks along the camera's view at zero azimuth and elevation", () => {
    const [x, y, z] = skyDirection(0, 0);
    expect(x).toBeCloseTo(0, 9);
    expect(y).toBeCloseTo(0, 9);
    expect(z).toBeCloseTo(-1, 9);
  });

  it("looks straight up at ninety degrees of elevation", () => {
    const [x, y, z] = skyDirection(0.4, Math.PI / 2);
    expect(x).toBeCloseTo(0, 9);
    expect(y).toBeCloseTo(1, 9);
    expect(z).toBeCloseTo(0, 9);
  });

  it("turns right with positive azimuth", () => {
    expect(skyDirection(Math.PI / 2, 0)[0]).toBeCloseTo(1, 9);
  });

  it("always has unit length", () => {
    for (const [az, el] of [[0.3, 0.2], [-1.2, 0.9], [2.5, -0.4]]) {
      expect(Math.hypot(...skyDirection(az, el))).toBeCloseTo(1, 9);
    }
  });
});

describe("clouds", () => {
  const sun = skyDirection(SUN_AZIMUTH, SUN_ELEVATION);
  const clouds = scatterClouds(createRng(5), 12);

  it("scatters the requested number, repeatably", () => {
    expect(clouds).toHaveLength(12);
    expect(scatterClouds(createRng(5), 12)).toEqual(clouds);
    expect(scatterClouds(createRng(6), 12)).not.toEqual(clouds);
  });

  it("keeps clouds above the horizon and in front of the camera", () => {
    for (const cloud of clouds) {
      // The camera looks slightly down, so only the lower sky is in view
      expect(cloud.elevation).toBeGreaterThanOrEqual(0.1);
      expect(cloud.elevation).toBeLessThanOrEqual(0.4);
      expect(Math.abs(cloud.azimuth)).toBeLessThanOrEqual(1.4);
    }
  });

  it("keeps clouds off the sun", () => {
    for (const cloud of clouds) {
      const direction = skyDirection(cloud.azimuth, cloud.elevation);
      expect(angleBetween(direction, sun)).toBeGreaterThanOrEqual(0.3);
    }
  });

  it("builds each cloud from many positive puffs", () => {
    for (const cloud of clouds) {
      expect(cloud.puffs.length).toBeGreaterThanOrEqual(12);
      expect(cloud.puffs.length).toBeLessThanOrEqual(17);
      for (const puff of cloud.puffs) expect(puff.radius).toBeGreaterThan(0);
    }
  });

  it("makes no clouds when asked for none", () => {
    expect(scatterClouds(createRng(1), 0)).toEqual([]);
  });
});

describe("cloud drift", () => {
  it("gives every cloud a slow rightward speed", () => {
    for (const cloud of scatterClouds(createRng(5), 30)) {
      expect(cloud.speed).toBeGreaterThanOrEqual(0.01);
      expect(cloud.speed).toBeLessThanOrEqual(0.03);
    }
  });

  it("stays put at time zero", () => {
    expect(driftAzimuth(0.4, 0.02, 0)).toBeCloseTo(0.4, 12);
  });

  it("moves by speed times time", () => {
    expect(driftAzimuth(0.4, 0.02, 10)).toBeCloseTo(0.6, 9);
  });

  it("wraps around past the edge, out of sight", () => {
    expect(driftAzimuth(CLOUD_WRAP - 0.01, 0.1, 0.2)).toBeCloseTo(-CLOUD_WRAP + 0.01, 9);
  });

  it("stays within the wrap range however long it runs", () => {
    for (const time of [0, 55, 300, 1e4, 1e6]) {
      const azimuth = driftAzimuth(1.2, 0.025, time);
      expect(azimuth).toBeGreaterThanOrEqual(-CLOUD_WRAP);
      expect(azimuth).toBeLessThan(CLOUD_WRAP);
    }
  });

  it("starts outside the view's wrap edge so clouds never pop in sight", () => {
    // The camera sees about ±0.85 rad; clouds wrap well beyond that
    expect(CLOUD_WRAP).toBeGreaterThan(1.2);
  });
});

describe("cloud shape", () => {
  const clouds = scatterClouds(createRng(21), 40);
  const bottom = (p: { dy: number; radius: number }) => p.dy - p.radius * CLOUD_PUFF_SQUASH;
  const top = (p: { dy: number; radius: number }) => p.dy + p.radius * CLOUD_PUFF_SQUASH;

  it("is a dome, not a flat row: tall relative to its width", () => {
    for (const { puffs } of clouds) {
      const height = Math.max(...puffs.map(top)) - Math.min(...puffs.map(bottom));
      const width =
        Math.max(...puffs.map((p) => p.dx + p.radius)) -
        Math.min(...puffs.map((p) => p.dx - p.radius));
      expect(height / width).toBeGreaterThanOrEqual(0.3);
      expect(height / width).toBeLessThanOrEqual(0.9);
    }
  });

  it("has a flat base", () => {
    for (const { puffs } of clouds) {
      const lowest = Math.min(...puffs.map(bottom));
      expect(puffs.filter((p) => bottom(p) - lowest < 0.05).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("is one connected blob: every puff overlaps another", () => {
    for (const { puffs } of clouds) {
      for (const a of puffs) {
        const touches = puffs.some(
          (b) => b !== a && Math.hypot(a.dx - b.dx, a.dy - b.dy) < a.radius + b.radius,
        );
        expect(touches).toBe(true);
      }
    }
  });

  it("has its biggest puff near the middle", () => {
    for (const { puffs } of clouds) {
      const biggest = puffs.reduce((a, b) => (b.radius > a.radius ? b : a));
      const middle =
        (Math.max(...puffs.map((p) => p.dx)) + Math.min(...puffs.map((p) => p.dx))) / 2;
      expect(Math.abs(biggest.dx - middle)).toBeLessThan(0.6);
    }
  });

  it("mixes big and small puffs", () => {
    for (const { puffs } of clouds) {
      const radii = puffs.map((p) => p.radius);
      expect(Math.max(...radii) / Math.min(...radii)).toBeGreaterThanOrEqual(1.4);
    }
  });

  it("piles smaller puffs on top of the base", () => {
    for (const { puffs } of clouds) {
      const lowest = Math.min(...puffs.map(bottom));
      const raised = puffs.filter((p) => bottom(p) - lowest > 0.2);
      expect(raised.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("stars", () => {
  const stars = scatterStars(createRng(2), 80);

  it("scatters the requested number, repeatably", () => {
    expect(stars).toHaveLength(80);
    expect(scatterStars(createRng(2), 80)).toEqual(stars);
  });

  it("keeps stars above the clouds and in front of the camera", () => {
    for (const star of stars) {
      expect(star.elevation).toBeGreaterThanOrEqual(0.3);
      expect(star.elevation).toBeLessThanOrEqual(1.5);
      expect(Math.abs(star.azimuth)).toBeLessThanOrEqual(1.3);
      expect(star.size).toBeGreaterThan(0);
    }
  });

  it("packs more stars into the lower sky where the camera can see them", () => {
    const many = scatterStars(createRng(3), 1000);
    const low = many.filter((s) => s.elevation < 0.65).length;
    const high = many.filter((s) => s.elevation >= 0.9).length;
    expect(low).toBeGreaterThan(high);
  });
});

describe("hill profile", () => {
  const profile = hillProfile(createRng(9), 64, 4, 6);

  it("has one height per segment, repeatably", () => {
    expect(profile).toHaveLength(64);
    expect(hillProfile(createRng(9), 64, 4, 6)).toEqual(profile);
  });

  it("stays between the base height and base plus amplitude", () => {
    for (const h of profile) {
      expect(h).toBeGreaterThanOrEqual(4);
      expect(h).toBeLessThanOrEqual(10);
    }
  });

  it("wraps around smoothly with no seam", () => {
    const step = Math.abs(profile[1] - profile[0]);
    expect(Math.abs(profile[0] - profile[profile.length - 1])).toBeLessThanOrEqual(
      step * 3 + 0.5,
    );
  });

  it("rolls rather than staying flat", () => {
    expect(Math.max(...profile) - Math.min(...profile)).toBeGreaterThan(1);
  });
});
