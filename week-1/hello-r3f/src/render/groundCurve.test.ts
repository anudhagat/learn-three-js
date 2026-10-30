import { describe, expect, it } from "vitest";
import {
  GROUND_RADIUS,
  createCurvedGroundGeometry,
  curveDrop,
  groundHeight,
  surfaceNormal,
} from "./groundCurve";

describe("ground curve", () => {
  it("is flat under the ball", () => {
    expect(curveDrop(0, 0)).toBe(0);
    expect(groundHeight(0, 0)).toBeCloseTo(0, 12);
  });

  it("follows the surface of a large ball", () => {
    const d = 20;
    const expected = GROUND_RADIUS - Math.sqrt(GROUND_RADIUS ** 2 - d ** 2);
    expect(curveDrop(d, 0)).toBeCloseTo(expected, 9);
  });

  it("drops further the further away it is", () => {
    let previous = -1;
    for (let d = 0; d <= 40; d += 2) {
      const drop = curveDrop(d, 0);
      expect(drop).toBeGreaterThan(previous);
      previous = drop;
    }
  });

  it("drops the same amount in every direction", () => {
    const drop = curveDrop(5, 0);
    expect(curveDrop(0, 5)).toBeCloseTo(drop, 9);
    expect(curveDrop(-5, 0)).toBeCloseTo(drop, 9);
    expect(curveDrop(3, 4)).toBeCloseTo(drop, 9);
  });

  it("stays finite far past the radius", () => {
    expect(Number.isFinite(curveDrop(1000, 1000))).toBe(true);
  });

  it("puts ground height at the negative of the drop", () => {
    expect(groundHeight(10, -7)).toBeCloseTo(-curveDrop(10, -7), 12);
  });
});

describe("surface normal", () => {
  it("points straight up under the ball", () => {
    expect(surfaceNormal(0, 0)).toEqual([0, 1, 0]);
  });

  it("has unit length", () => {
    for (const [x, z] of [[5, 0], [-9, 4], [20, -20]]) {
      expect(Math.hypot(...surfaceNormal(x, z))).toBeCloseTo(1, 9);
    }
  });

  it("leans away from the centre", () => {
    const [nx, ny, nz] = surfaceNormal(10, -6);
    expect(nx).toBeGreaterThan(0);
    expect(nz).toBeLessThan(0);
    expect(ny).toBeGreaterThan(0);
  });
});

describe("curved ground geometry", () => {
  const size = 60;
  const segments = 40;
  const geometry = createCurvedGroundGeometry(size, segments);
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const vertex = (i: number) => [position.getX(i), position.getY(i), position.getZ(i)];

  it("has a vertex grid of the requested resolution", () => {
    expect(position.count).toBe((segments + 1) ** 2);
  });

  it("is level at the centre and lower at the corners", () => {
    const centre = Math.floor(position.count / 2);
    expect(vertex(centre)[1]).toBeCloseTo(0, 9);
    const heights = Array.from({ length: position.count }, (_, i) => vertex(i)[1]);
    expect(Math.max(...heights)).toBeLessThanOrEqual(1e-9);
    expect(Math.min(...heights)).toBeLessThan(-5);
  });

  it("lies on the same curve as groundHeight", () => {
    for (const i of [0, 123, 400, position.count - 1]) {
      const [x, y, z] = vertex(i);
      // Vertex positions are stored as 32-bit floats
      expect(y).toBeCloseTo(groundHeight(x, z), 4);
    }
  });

  it("faces up at the centre", () => {
    const centre = Math.floor(position.count / 2);
    expect(normal.getY(centre)).toBeGreaterThan(0.99);
  });
});
