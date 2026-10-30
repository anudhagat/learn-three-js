import { describe, expect, it } from "vitest";
import { EXPRESSIONS, FACE_SPECS } from "./faceSpec";

describe("face specs", () => {
  it("has exactly the awake, asleep and dizzy faces", () => {
    expect([...EXPRESSIONS].sort()).toEqual(["dizzy", "happy", "sleepy"]);
  });

  it("gives each expression a distinct face", () => {
    const faces = EXPRESSIONS.map((e) => JSON.stringify(FACE_SPECS[e]));
    expect(new Set(faces).size).toBe(EXPRESSIONS.length);
  });

  it("closes the eyes when asleep", () => {
    expect(FACE_SPECS.sleepy.eyes).toBe("closed");
  });

  it("opens the eyes and smiles when awake", () => {
    expect(FACE_SPECS.happy.eyes).toBe("open");
    expect(FACE_SPECS.happy.mouth).toBe("smile");
  });

  it("shows spirals when dizzy", () => {
    expect(FACE_SPECS.dizzy.eyes).toBe("spiral");
  });
});
