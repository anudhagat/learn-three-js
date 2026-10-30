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

// Which copies of an item at (x, y) are needed so it tiles: itself, plus a copy on the
// far side for any edge it is within `margin` of
export const wrapOffsets = (x: number, y: number, margin: number): [number, number][] => {
  const across = [0, ...(x < margin ? [1] : []), ...(x > 1 - margin ? [-1] : [])];
  const down = [0, ...(y < margin ? [1] : []), ...(y > 1 - margin ? [-1] : [])];
  return across.flatMap((dx) => down.map((dy): [number, number] => [dx, dy]));
};
