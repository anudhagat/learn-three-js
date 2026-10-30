import type { Rng } from "../sim/rng";

type Vec3 = [number, number, number];

// Where the sun sits: to the left of the view, low over the horizon
export const SUN_AZIMUTH = -0.55;
export const SUN_ELEVATION = 0.13;

// Unit direction for an azimuth (radians right of the camera's view) and elevation
// (radians above the horizon)
export const skyDirection = (azimuth: number, elevation: number): Vec3 => [
  Math.sin(azimuth) * Math.cos(elevation),
  Math.sin(elevation),
  -Math.cos(azimuth) * Math.cos(elevation),
];

const angleBetween = (a: Vec3, b: Vec3) =>
  Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));

export interface Puff {
  dx: number; // Offset along the cloud, in cloud sizes
  dy: number;
  radius: number;
}

export interface Cloud {
  azimuth: number;
  elevation: number;
  size: number;
  puffs: Puff[];
}

const MIN_CLOUD_ELEVATION = 0.12;
const MAX_CLOUD_ELEVATION = 0.4;
const MAX_CLOUD_AZIMUTH = 1.35;
const SUN_CLEARANCE = 0.32; // Radians of sky kept clear around the sun

const makePuffs = (rng: Rng): Puff[] => {
  const count = 4 + Math.floor(rng() * 5);
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : i / (count - 1) - 0.5; // -0.5 to 0.5 along the cloud
    // Fuller in the middle so the cloud reads as a dome with a flat base
    const fullness = 1 - Math.abs(t) * 0.9;
    return {
      dx: t * 2.2 + (rng() - 0.5) * 0.2,
      dy: fullness * 0.25 * rng(),
      radius: (0.45 + 0.5 * rng()) * fullness + 0.2,
    };
  });
};

export const scatterClouds = (rng: Rng, count: number): Cloud[] => {
  const sun = skyDirection(SUN_AZIMUTH, SUN_ELEVATION);
  const clouds: Cloud[] = [];
  while (clouds.length < count) {
    const azimuth = (rng() * 2 - 1) * MAX_CLOUD_AZIMUTH;
    const elevation =
      MIN_CLOUD_ELEVATION + rng() * (MAX_CLOUD_ELEVATION - MIN_CLOUD_ELEVATION);
    if (angleBetween(skyDirection(azimuth, elevation), sun) < SUN_CLEARANCE) continue;
    clouds.push({ azimuth, elevation, size: 0.8 + rng() * 0.8, puffs: makePuffs(rng) });
  }
  return clouds;
};

export interface Star {
  azimuth: number;
  elevation: number;
  size: number;
}

// Stars only show in the darker upper sky. The camera looks slightly down, so the
// squared random number packs them towards the bottom of what it can see.
export const scatterStars = (rng: Rng, count: number): Star[] =>
  Array.from({ length: count }, () => ({
    azimuth: (rng() * 2 - 1) * 1.3,
    elevation: 0.3 + rng() ** 2 * 1.2,
    size: 0.4 + rng() * 0.8,
  }));

// Rolling hill heights around a full circle. Built from whole-number waves, so the
// end meets the start and the ring has no seam.
export const hillProfile = (
  rng: Rng,
  segments: number,
  base: number,
  amplitude: number,
): number[] => {
  const waves = [
    { frequency: 2, weight: 1, phase: rng() * Math.PI * 2 },
    { frequency: 5, weight: 0.55, phase: rng() * Math.PI * 2 },
    { frequency: 11, weight: 0.25, phase: rng() * Math.PI * 2 },
  ];
  const total = waves.reduce((sum, w) => sum + w.weight, 0);
  return Array.from({ length: segments }, (_, i) => {
    const angle = (i / segments) * Math.PI * 2;
    const wave = waves.reduce(
      (sum, w) => sum + w.weight * Math.sin(w.frequency * angle + w.phase),
      0,
    );
    return base + amplitude * (0.5 + (0.5 * wave) / total);
  });
};
