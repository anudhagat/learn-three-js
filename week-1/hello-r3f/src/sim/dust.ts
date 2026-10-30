import {
  BALL_RADIUS,
  DUST_GRAVITY,
  DUST_LIFE_RANGE,
  DUST_MIN_LIFE,
  FLOOR_POSITION_Y,
  LAUNCH_DUST_PARTICLES,
  MAX_DUST_PARTICLES,
} from "./config";
import { speedIntensity } from "./intensity";
import type { Rng } from "./rng";

type Vec3 = [number, number, number];

export interface Particle {
  position: Vec3;
  velocity: Vec3;
  age: number; // Seconds since it was thrown out
  life: number; // Seconds until it has faded away
  size: number;
}

export interface DustView {
  position: Vec3;
  size: number;
  opacity: number;
}

// A ring of stars thrown out from under the ball, starting at height `baseY`.
// `intensity` (0 to 1) sets how fast.
const burst = (count: number, intensity: number, rng: Rng, baseY: number): Particle[] =>
  Array.from({ length: count }, () => {
    const angle = rng() * Math.PI * 2;
    const [dx, dz] = [Math.cos(angle), Math.sin(angle)];
    const outward = (1 + 3 * intensity) * (0.6 + 0.4 * rng());
    const upward = (1.5 + 2 * intensity) * (0.6 + 0.4 * rng());
    const radius = BALL_RADIUS * 0.6;
    return {
      position: [dx * radius, baseY + 0.05, dz * radius],
      velocity: [dx * outward, upward, dz * outward],
      age: 0,
      life: DUST_MIN_LIFE + rng() * DUST_LIFE_RANGE,
      size: 0.12 + 0.1 * rng(),
    };
  });

// Harder landings throw out more stars, faster; tiny ones throw out none
export const spawnImpactDust = (speed: number, rng: Rng): Particle[] => {
  const intensity = speedIntensity(speed);
  // Landings always happen on the floor
  return burst(Math.round(MAX_DUST_PARTICLES * intensity), intensity, rng, FLOOR_POSITION_Y);
};

// A small puff from the bottom of the ball: on the floor if it launches from there,
// or in mid-air if it is clicked while flying
export const spawnLaunchDust = (rng: Rng, ballBottomY: number): Particle[] =>
  burst(LAUNCH_DUST_PARTICLES, 0.3, rng, ballBottomY);

export const stepDust = (particles: Particle[], dt: number): Particle[] =>
  particles
    .map((p) => ({
      ...p,
      position: [
        p.position[0] + p.velocity[0] * dt,
        p.position[1] + p.velocity[1] * dt,
        p.position[2] + p.velocity[2] * dt,
      ] as Vec3,
      velocity: [p.velocity[0], p.velocity[1] + DUST_GRAVITY * dt, p.velocity[2]] as Vec3,
      age: p.age + dt,
    }))
    .filter((p) => p.age < p.life);

export const getDustView = (particles: Particle[]): DustView[] =>
  particles.map((p) => ({
    position: p.position,
    size: p.size,
    opacity: Math.max(1 - p.age / p.life, 0),
  }));
