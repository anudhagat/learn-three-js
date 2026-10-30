import { describe, expect, it } from "vitest";
import { CANDY_PROPS, FLOOR_SIZE } from "./candyLayout";

const distance = (a: [number, number], b: [number, number]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);

describe("candy layout", () => {
  it("has lollipops and gumdrops", () => {
    expect(CANDY_PROPS.filter((p) => p.kind === "lollipop").length).toBeGreaterThanOrEqual(2);
    expect(CANDY_PROPS.filter((p) => p.kind === "gumdrop").length).toBeGreaterThanOrEqual(4);
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
