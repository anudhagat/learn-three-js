import { describe, expect, it } from "vitest";
import { CANDY_PROPS, FLOOR_SIZE, type CandyKind } from "./candyLayout";
import { isInView } from "./grassBlades";

const distance = (a: [number, number], b: [number, number]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);

describe("candy layout", () => {
  it("has a good number of every kind of candy", () => {
    const minimum: Record<CandyKind, number> = {
      lollipop: 2,
      gumdrop: 4,
      cupcake: 2,
      donut: 2,
      candyCane: 2,
      macaron: 2,
    };
    for (const [kind, count] of Object.entries(minimum)) {
      expect(CANDY_PROPS.filter((p) => p.kind === kind).length).toBeGreaterThanOrEqual(count);
    }
  });

  it("keeps every prop where the camera can see it", () => {
    for (const prop of CANDY_PROPS) {
      expect(isInView(prop.position[0], prop.position[1])).toBe(true);
    }
  });

  it("keeps props clear of the ball and its dust", () => {
    for (const prop of CANDY_PROPS) {
      expect(distance(prop.position, [0, 0])).toBeGreaterThanOrEqual(3.5);
    }
  });

  it("keeps props on the floor", () => {
    for (const prop of CANDY_PROPS) {
      expect(Math.abs(prop.position[0])).toBeLessThan(FLOOR_SIZE / 2 - 2);
      expect(Math.abs(prop.position[1])).toBeLessThan(FLOOR_SIZE / 2 - 2);
    }
  });

  it("does not put props behind the camera", () => {
    for (const prop of CANDY_PROPS) {
      expect(prop.position[1]).toBeLessThanOrEqual(2);
    }
  });

  it("does not let props overlap each other", () => {
    CANDY_PROPS.forEach((a, i) => {
      CANDY_PROPS.slice(i + 1).forEach((b) => {
        expect(distance(a.position, b.position)).toBeGreaterThanOrEqual(
          (a.size + b.size) * 0.9,
        );
      });
    });
  });

  it("gives every prop a colour and a positive size", () => {
    for (const prop of CANDY_PROPS) {
      expect(prop.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(prop.size).toBeGreaterThan(0);
    }
  });
});
