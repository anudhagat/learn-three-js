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

const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

// Donut: it stands up on its edge, rolls once round a circle like a wheel, and lies
// down flat again where it started. Distances are in donut sizes (its outer radius).
export const ROLL_RADIUS = 1.8; // Radius of the circle it rolls round
export const ROLL_DURATION = 2.6;
export const ROLL_TURNS = 3; // Whole turns of its own, so it ends looking as it began
const STAND_TIME = 0.35; // Seconds to stand up, and to lie down again

export interface DonutRoll {
  x: number;
  z: number;
  heading: number; // Radians, the way it is facing as it travels
  stand: number; // 0 lying flat, 1 standing on its edge
  roll: number; // Radians turned round its own axis
}

export const donutRoll = (elapsed: number): DonutRoll => {
  if (elapsed <= 0 || elapsed >= ROLL_DURATION) {
    return { x: 0, z: 0, heading: 0, stand: 0, roll: 0 };
  }
  const stand = Math.min(
    smoothstep(elapsed / STAND_TIME),
    smoothstep((ROLL_DURATION - elapsed) / STAND_TIME),
  );
  // It only travels while it stands, speeding up and slowing down
  const progress = smoothstep((elapsed - STAND_TIME) / (ROLL_DURATION - 2 * STAND_TIME));
  const heading = Math.PI * 2 * progress;
  return {
    x: ROLL_RADIUS * Math.sin(heading),
    z: ROLL_RADIUS * (1 - Math.cos(heading)),
    heading,
    stand,
    roll: Math.PI * 2 * ROLL_TURNS * progress,
  };
};

// Cupcake: the cherry bounces like a ball coming to rest. Each hop is quicker and lower
// than the last, and it squashes a little on each landing.
export const CHERRY_BOUNCES = 5;
const CHERRY_FIRST_HOP = 0.4; // Seconds
const CHERRY_HOP_RATIO = 0.72; // Each hop lasts this much of the one before
const CHERRY_HEIGHT = 0.6; // Of the first hop, in cupcake sizes
const CHERRY_SQUASH = 0.35;

const hopSeconds = (hop: number) => CHERRY_FIRST_HOP * CHERRY_HOP_RATIO ** hop;
export const CHERRY_DURATION = Array.from({ length: CHERRY_BOUNCES }, (_, hop) =>
  hopSeconds(hop),
).reduce((sum, seconds) => sum + seconds, 0);

export interface CherryBounce {
  y: number; // Lift above its seat, in cupcake sizes
  scaleY: number;
  scaleXZ: number; // Chosen so the volume stays the same
}

// How hard the cherry hit the icing when it landed after `hop`. The last landing is the
// cherry coming to rest, so it doesn't squash.
const landingSquash = (hop: number) =>
  hop < 0 || hop >= CHERRY_BOUNCES - 1 ? 0 : CHERRY_SQUASH * CHERRY_HOP_RATIO ** hop;

export const cherryBounce = (elapsed: number): CherryBounce => {
  if (elapsed <= 0 || elapsed >= CHERRY_DURATION) return { y: 0, scaleY: 1, scaleXZ: 1 };
  let hop = 0;
  let start = 0;
  while (hop < CHERRY_BOUNCES - 1 && elapsed >= start + hopSeconds(hop)) {
    start += hopSeconds(hop);
    hop++;
  }
  const u = (elapsed - start) / hopSeconds(hop);
  const arc = 4 * u * (1 - u); // A parabola: 0 on the ground, 1 at the top
  const height = CHERRY_HEIGHT * (hopSeconds(hop) / CHERRY_FIRST_HOP) ** 2;
  // Squashed by the landing that ended the last hop, and by the one about to end this one
  const flat = (1 - arc) ** 8;
  const squash = Math.max(landingSquash(hop - 1) * (u < 0.5 ? flat : 0), landingSquash(hop) * (u >= 0.5 ? flat : 0));
  const scaleY = 1 - squash;
  return { y: height * arc, scaleY, scaleXZ: 1 / Math.sqrt(scaleY) };
};

// Macaron: the top shell lifts and wobbles one way and the bottom shell the other, with
// the cream staying put, as if they are shaking apart and settling back together
export const SHELLS_DURATION = 1.6;
const SHELLS_WOBBLES_PER_SECOND = 3.2;
const SHELLS_DAMPING = 2.6;
const MAX_SHELL_TILT = 0.4; // Radians
const MAX_SHELL_GAP = 0.35; // In macaron sizes

export interface ShellsWobble {
  topLift: number;
  bottomLift: number;
  topTilt: number; // Radians
  bottomTilt: number; // Opposite to the top
}

export const shellsWobble = (elapsed: number): ShellsWobble => {
  if (elapsed <= 0 || elapsed >= SHELLS_DURATION) {
    return { topLift: 0, bottomLift: 0, topTilt: 0, bottomTilt: 0 };
  }
  const settle = Math.exp(-SHELLS_DAMPING * elapsed);
  const phase = Math.PI * 2 * SHELLS_WOBBLES_PER_SECOND * elapsed;
  const topLift = MAX_SHELL_GAP * settle * ((1 - Math.cos(phase)) / 2);
  return {
    topLift,
    bottomLift: topLift * 0.25,
    topTilt: MAX_SHELL_TILT * settle * Math.sin(phase),
    bottomTilt: -0.7 * MAX_SHELL_TILT * settle * Math.sin(phase),
  };
};
