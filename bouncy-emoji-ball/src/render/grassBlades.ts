import type { Rng } from "../sim/rng";
import { CAMERA_POSITION } from "./camera";

export const BLADE_CLEARING = 1.3; // Bare ground under the ball, so its shadow stays visible
export const BLADE_RADIUS = 9; // How far the lawn of blades reaches
export const FADE_START = 5; // Beyond this the blades thin out until they stop at BLADE_RADIUS
const RAMP = 2.5; // Distance over which the blades thicken up from the clearing

// The camera looks slightly down, so ground nearer than this is below the bottom of
// the view, and the sides are limited by the field of view (with a margin)
export const VIEW_NEAREST_Z = 4.6;
const VIEW_HALF_ANGLE = 0.95; // Radians

export const isInView = (x: number, z: number): boolean =>
  z <= VIEW_NEAREST_Z &&
  Math.abs(x) <= (CAMERA_POSITION[2] - z) * Math.tan(VIEW_HALF_ANGLE);

// Blades sway fully near the camera and not at all far from it, where the motion
// can't be seen anyway
export const WIND_NEAR = 7;
export const WIND_FAR = 15;

export interface Obstacle {
  position: [number, number]; // x and z
  size: number;
}

export interface Blade {
  x: number;
  z: number;
  height: number;
  width: number;
  lean: number; // Radians the blade tips over
  yaw: number; // Radians the blade is turned around
  tone: number; // 0 for the darkest green, 1 for the lightest
  phase: number; // Offsets the wind sway so the field doesn't move in lockstep
  wind: number; // 1 sways fully, 0 stays still
}

const smoothstep = (t: number) => {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * (3 - 2 * x);
};

export const windFactor = (x: number, z: number): number =>
  1 -
  smoothstep(
    (Math.hypot(x - CAMERA_POSITION[0], z - CAMERA_POSITION[2]) - WIND_NEAR) /
      (WIND_FAR - WIND_NEAR),
  );

export interface Tuft {
  x: number;
  z: number;
  blades: Blade[]; // The first is the tall one in the middle
}

export const TUFT_RADIUS = 0.25; // How far the blades of a tuft spread from its middle

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

// A loose tuft: one taller blade in the middle with a couple of shorter ones leaning
// away from it, spread over a small patch so the lawn looks evenly grown
const growTuft = (x: number, z: number, rng: Rng): Tuft => {
  const tone = rng();
  const phase = rng() * Math.PI * 2;
  const blade = (
    bx: number,
    bz: number,
    height: number,
    width: number,
    yaw: number,
    lean: number,
  ): Blade => ({
    x: bx,
    z: bz,
    height,
    width,
    lean,
    yaw,
    tone: clamp01(tone + (rng() - 0.5) * 0.2),
    phase: phase + rng() * 0.4, // A tuft sways together
    wind: windFactor(bx, bz),
  });

  const middle = blade(
    x,
    z,
    0.24 + rng() * 0.16,
    0.07 + rng() * 0.03,
    rng() * Math.PI * 2,
    0.05 + rng() * 0.15,
  );
  const ringCount = 2 + Math.floor(rng() * 2);
  const ring = Array.from({ length: ringCount }, (_, i) => {
    const angle = (i / ringCount) * Math.PI * 2 + (rng() - 0.5) * 0.5;
    const offset = TUFT_RADIUS * (0.5 + rng() * 0.5); // Spread loosely over the patch
    const [dx, dz] = [Math.sin(angle) * offset, Math.cos(angle) * offset];
    return blade(
      x + dx,
      z + dz,
      0.14 + rng() * 0.09,
      0.055 + rng() * 0.03,
      Math.atan2(dx, dz), // Faces, and so leans, away from the middle
      0.25 + rng() * 0.25,
    );
  });
  return { x, z, blades: [middle, ...ring] };
};

// Scatters tufts over the part of the lawn the camera can see: thin by the clearing,
// full in the middle, fading out towards the edge, and clear of the candy
export const scatterTufts = (rng: Rng, count: number, obstacles: Obstacle[]): Tuft[] => {
  const tufts: Tuft[] = [];
  const innerSquared = BLADE_CLEARING ** 2;
  const outerSquared = BLADE_RADIUS ** 2;
  while (tufts.length < count) {
    // The square root keeps the tufts evenly spread over the area
    const radius = Math.sqrt(innerSquared + rng() * (outerSquared - innerSquared));
    const angle = rng() * Math.PI * 2;
    const [x, z] = [Math.cos(angle) * radius, Math.sin(angle) * radius];

    if (!isInView(x, z)) continue;
    const thickness =
      smoothstep((radius - BLADE_CLEARING) / RAMP) *
      (1 - smoothstep((radius - FADE_START) / (BLADE_RADIUS - FADE_START)));
    if (rng() > thickness) continue;
    const blocked = obstacles.some(
      (o) =>
        Math.hypot(x - o.position[0], z - o.position[1]) <= o.size * 1.15 + TUFT_RADIUS,
    );
    if (blocked) continue;

    tufts.push(growTuft(x, z, rng));
  }
  return tufts;
};
