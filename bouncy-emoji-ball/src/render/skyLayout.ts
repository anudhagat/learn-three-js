import type { Rng } from "../sim/rng";

type Vec3 = [number, number, number];

// Where the sun sits: to the left of the view, low over the horizon
export const SUN_AZIMUTH = -0.55;
export const SUN_ELEVATION = 0.18;

// Unit direction for an azimuth (radians right of the camera's view) and elevation
// (radians above the horizon)
export const skyDirection = (azimuth: number, elevation: number): Vec3 => [
  Math.sin(azimuth) * Math.cos(elevation),
  Math.sin(elevation),
  -Math.cos(azimuth) * Math.cos(elevation),
];

// Where to put a light so that it shines from the sun you see in the sky
export const sunLightPosition = (distance: number): Vec3 => {
  const [x, y, z] = skyDirection(SUN_AZIMUTH, SUN_ELEVATION);
  return [x * distance, y * distance, z * distance];
};

const angleBetween = (a: Vec3, b: Vec3) =>
  Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));

export interface Puff {
  dx: number; // Offset along the cloud, in cloud sizes
  dy: number;
  radius: number;
}

export interface Cloud {
  azimuth: number; // Where the cloud starts; it drifts from here
  speed: number; // Radians per second to the right
  elevation: number;
  size: number;
  puffs: Puff[];
}

const MIN_CLOUD_ELEVATION = 0.12;
const MAX_CLOUD_ELEVATION = 0.4;
const MAX_CLOUD_AZIMUTH = 1.35;
const SUN_CLEARANCE = 0.32; // Radians of sky kept clear around the sun

// Puffs are squashed a little vertically, which flattens the base of the cloud
export const CLOUD_PUFF_SQUASH = 0.8;

// A cumulus: a flat row of big puffs, biggest in the middle, a second tier above
// it, a few small puffs on top, and little wisps along the base. Offsets are in
// cloud sizes; the base sits at dy = 0.
const makePuffs = (rng: Rng): Puff[] => {
  const baseCount = 5 + Math.floor(rng() * 3);
  const base = Array.from({ length: baseCount }, (_, i): Puff => {
    const t = i / (baseCount - 1) - 0.5; // -0.5 to 0.5 along the base
    const fullness = 1 - Math.abs(t) * 1.1;
    const radius = 0.3 + 0.32 * fullness + rng() * 0.06;
    return {
      dx: t * 2.4 + (rng() - 0.5) * 0.1,
      dy: radius * CLOUD_PUFF_SQUASH, // Bottom edge exactly on the base line
      radius,
    };
  });

  const middle = Array.from({ length: 3 + Math.floor(rng() * 2) }, (): Puff => ({
    dx: (rng() - 0.5) * 1.5,
    dy: 0.5 + rng() * 0.12,
    radius: 0.28 + rng() * 0.2,
  }));

  const top = Array.from({ length: 2 + Math.floor(rng() * 2) }, (): Puff => ({
    dx: (rng() - 0.5) * 0.8,
    dy: 1 + rng() * 0.2,
    radius: 0.22 + rng() * 0.16,
  }));

  const wisps = Array.from({ length: 2 + Math.floor(rng() * 2) }, (): Puff => {
    const radius = 0.18 + rng() * 0.1;
    return { dx: (rng() * 2 - 1) * 1.4, dy: radius * CLOUD_PUFF_SQUASH, radius };
  });

  return [...base, ...middle, ...top, ...wisps];
};

// Clouds wrap around at this azimuth, well outside what the camera can see
export const CLOUD_WRAP = 1.5;

// Where a cloud has drifted to after `time` seconds, wrapping at the edges
export const driftAzimuth = (azimuth: number, speed: number, time: number): number => {
  const span = CLOUD_WRAP * 2;
  const shifted = azimuth + speed * time + CLOUD_WRAP;
  return (((shifted % span) + span) % span) - CLOUD_WRAP;
};

export const scatterClouds = (rng: Rng, count: number): Cloud[] => {
  const sun = skyDirection(SUN_AZIMUTH, SUN_ELEVATION);
  const clouds: Cloud[] = [];
  while (clouds.length < count) {
    const azimuth = (rng() * 2 - 1) * MAX_CLOUD_AZIMUTH;
    const elevation =
      MIN_CLOUD_ELEVATION + rng() * (MAX_CLOUD_ELEVATION - MIN_CLOUD_ELEVATION);
    if (angleBetween(skyDirection(azimuth, elevation), sun) < SUN_CLEARANCE) continue;
    clouds.push({
      azimuth,
      elevation,
      speed: 0.012 + rng() * 0.016,
      size: 0.8 + rng() * 0.8,
      puffs: makePuffs(rng),
    });
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
