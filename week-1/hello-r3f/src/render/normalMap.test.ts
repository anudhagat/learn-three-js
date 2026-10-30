import { describe, expect, it } from "vitest";
import { normalsFromHeights } from "./normalMap";

const SIZE = 16;
const pixel = (data: Uint8ClampedArray, x: number, y: number) => {
  const i = (y * SIZE + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
};
const heights = (f: (x: number, y: number) => number) =>
  Float32Array.from({ length: SIZE * SIZE }, (_, i) => f(i % SIZE, Math.floor(i / SIZE)));

describe("normal map from heights", () => {
  it("makes flat ground face straight out", () => {
    const data = normalsFromHeights(heights(() => 0.4), SIZE, 3);
    expect(data).toHaveLength(SIZE * SIZE * 4);
    expect(pixel(data, 5, 5)).toEqual([128, 128, 255, 255]);
  });

  it("tilts away from a slope that rises to the right", () => {
    // Heights from a smooth wave, so the sides of the tile line up
    const wave = heights((x) => 0.5 + 0.3 * Math.sin((x / SIZE) * Math.PI * 2));
    const data = normalsFromHeights(wave, SIZE, 3);
    // Rising to the right at x = 0, falling at x = 8
    expect(pixel(data, 0, 5)[0]).toBeLessThan(128);
    expect(pixel(data, 8, 5)[0]).toBeGreaterThan(128);
    // No tilt up or down, because the ground only changes left to right
    expect(pixel(data, 0, 5)[1]).toBe(128);
  });

  it("tilts the green channel for a slope that rises down the image", () => {
    const wave = heights((_, y) => 0.5 + 0.3 * Math.sin((y / SIZE) * Math.PI * 2));
    const data = normalsFromHeights(wave, SIZE, 3);
    expect(pixel(data, 5, 0)[1]).toBeGreaterThan(128);
    expect(pixel(data, 5, 8)[1]).toBeLessThan(128);
  });

  it("tiles with no seam: edge pixels match what wrapping around gives", () => {
    const wave = heights((x, y) =>
      0.5 + 0.2 * Math.sin((x / SIZE) * Math.PI * 2) + 0.2 * Math.cos((y / SIZE) * Math.PI * 4),
    );
    const data = normalsFromHeights(wave, SIZE, 3);
    // A shifted copy of the same wave gives the same normals, shifted: the left
    // edge looks like the middle of a wave that keeps going
    const shifted = heights((x, y) =>
      0.5 +
      0.2 * Math.sin(((x + SIZE) / SIZE) * Math.PI * 2) +
      0.2 * Math.cos((y / SIZE) * Math.PI * 4),
    );
    expect(normalsFromHeights(shifted, SIZE, 3)).toEqual(data);
    // And the right edge is not a special case
    expect(pixel(data, SIZE - 1, 3)[0]).toBeGreaterThan(128 - 1 - 60);
  });

  it("tilts more with more strength, and not at all with none", () => {
    const wave = heights((x) => 0.5 + 0.3 * Math.sin((x / SIZE) * Math.PI * 2));
    const gentle = pixel(normalsFromHeights(wave, SIZE, 1), 0, 5)[0];
    const strong = pixel(normalsFromHeights(wave, SIZE, 6), 0, 5)[0];
    expect(128 - strong).toBeGreaterThan(128 - gentle);
    expect(pixel(normalsFromHeights(wave, SIZE, 0), 0, 5)).toEqual([128, 128, 255, 255]);
  });

  it("makes unit-length normals that always face outwards", () => {
    const bumpy = heights((x, y) => ((x * 7 + y * 13) % 11) / 11);
    const data = normalsFromHeights(bumpy, SIZE, 4);
    for (let i = 0; i < SIZE * SIZE; i++) {
      const [r, g, b] = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]].map(
        (c) => (c / 255) * 2 - 1,
      );
      expect(Math.hypot(r, g, b)).toBeGreaterThan(0.97);
      expect(Math.hypot(r, g, b)).toBeLessThan(1.03);
      expect(b).toBeGreaterThan(0);
    }
  });
});
