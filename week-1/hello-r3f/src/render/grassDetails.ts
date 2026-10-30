import type { Rng } from "../sim/rng";

// Everything is in unit-tile coordinates (0 to 1), scaled to the canvas when drawn
export interface Blade {
  x: number;
  y: number;
  length: number;
  lean: number; // Radians away from vertical
  shade: number; // 0 is the darkest green, 1 the lightest
}

export interface Flower {
  x: number;
  y: number;
  radius: number;
  color: string;
}

const FLOWER_COLORS = ["#ffffff", "#ffd1e8", "#fff3a0", "#d9c2ff"];

export const scatterGrass = (rng: Rng, bladeCount: number, flowerCount: number) => ({
  blades: Array.from({ length: bladeCount }, (): Blade => ({
    x: rng(),
    y: rng(),
    length: 0.025 + rng() * 0.04,
    lean: (rng() - 0.5) * 1.1,
    shade: rng(),
  })),
  flowers: Array.from({ length: flowerCount }, (): Flower => ({
    x: rng(),
    y: rng(),
    radius: 0.008 + rng() * 0.01,
    color: FLOWER_COLORS[Math.floor(rng() * FLOWER_COLORS.length)],
  })),
});
