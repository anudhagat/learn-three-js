import { describe, expect, it } from "vitest";
import type { Expression } from "../sim/expression";
import { EXPRESSIONS, FACE_SPECS } from "./faceSpec";

describe("face specs", () => {
  it("has a spec for every expression", () => {
    const expected: Expression[] = ["sleepy", "happy", "wideEyed", "squint", "dizzy"];
    expect([...EXPRESSIONS].sort()).toEqual([...expected].sort());
    for (const expression of EXPRESSIONS) {
      expect(FACE_SPECS[expression]).toBeDefined();
    }
  });

  it("gives every expression a distinct face", () => {
    const faces = EXPRESSIONS.map((e) => JSON.stringify(FACE_SPECS[e]));
    expect(new Set(faces).size).toBe(EXPRESSIONS.length);
  });

  it("closes the eyes when sleepy", () => {
    expect(FACE_SPECS.sleepy.eyes).toBe("closed");
  });

  it("opens the eyes wide when falling fast", () => {
    expect(FACE_SPECS.wideEyed.eyes).toBe("wide");
    expect(FACE_SPECS.wideEyed.mouth).toBe("open");
  });

  it("shows spirals when dizzy", () => {
    expect(FACE_SPECS.dizzy.eyes).toBe("spiral");
  });

  it("squeezes the eyes shut and giggles on impact", () => {
    expect(FACE_SPECS.squint.eyes).toBe("squeezed");
    expect(FACE_SPECS.squint.mouth).toBe("giggle");
  });
});
