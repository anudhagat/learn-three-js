// Little reactions when you click the candy. Each is a function of the seconds since
// the click, so it is the same however fast the screen refreshes, and is exactly at
// rest again once it is over.

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

// Lollipop: the swirl spins a few full turns, quickly at first, then slows to a stop
export const SPIN_TURNS = 3;
export const SPIN_DURATION = 2.2;

export const spinAngle = (elapsed: number): number => {
  const u = clamp01(elapsed / SPIN_DURATION);
  const easedOut = 1 - (1 - u) ** 3;
  return Math.PI * 2 * SPIN_TURNS * easedOut;
};

// Candy cane: a wiggle dance of swaying, twisting and little hops that dies away
export const DANCE_DURATION = 1.6;
export const MAX_DANCE_TILT = 0.45; // Radians
const DANCE_SWAYS_PER_SECOND = 3;
const MAX_DANCE_TWIST = 0.35;
const MAX_DANCE_HOP = 0.18; // Fraction of the cane's size

export interface DanceMotion {
  tilt: number; // Radians, side to side
  twist: number; // Radians, round the cane
  hop: number; // Lift off the ground, in cane sizes
}

export const danceMotion = (elapsed: number): DanceMotion => {
  if (elapsed <= 0 || elapsed >= DANCE_DURATION) return { tilt: 0, twist: 0, hop: 0 };
  const calm = (1 - elapsed / DANCE_DURATION) ** 1.5; // Starts lively, settles down
  const phase = Math.PI * 2 * DANCE_SWAYS_PER_SECOND * elapsed;
  return {
    tilt: MAX_DANCE_TILT * calm * Math.sin(phase),
    twist: MAX_DANCE_TWIST * calm * Math.sin(phase * 2),
    hop: MAX_DANCE_HOP * calm * Math.abs(Math.sin(phase)),
  };
};

// Gumdrop: squashed by the poke, then wobbling like jelly on a damped spring
export const JELLY_DURATION = 1.4;
const JELLY_SQUASH = 0.3;
const JELLY_DAMPING = 4.2;
const JELLY_WOBBLES_PER_SECOND = 3;

export interface JellyScale {
  y: number;
  xz: number; // Sideways, chosen so the volume stays the same
}

export const jellyScale = (elapsed: number): JellyScale => {
  // Time zero is the poke itself, which is already squashed
  if (elapsed < 0 || elapsed >= JELLY_DURATION) return { y: 1, xz: 1 };
  const wobble =
    Math.exp(-JELLY_DAMPING * elapsed) *
    Math.cos(Math.PI * 2 * JELLY_WOBBLES_PER_SECOND * elapsed);
  const y = 1 - JELLY_SQUASH * wobble;
  return { y, xz: 1 / Math.sqrt(y) };
};
