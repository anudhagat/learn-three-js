import { describe, expect, it } from "vitest";
import { FACE_SPECS } from "./faceSpec";
import { DROWSY_FRAMES, drowsyFrameIndex, getFaceLook, pickFace } from "./faceLook";

describe("face look", () => {
  it("is the happy face when wide awake", () => {
    expect(getFaceLook(0)).toEqual({ eyeOpen: 1, smile: 1, blush: 1 });
    // And it matches what the happy spec describes
    expect(FACE_SPECS.happy.eyes).toBe("open");
    expect(FACE_SPECS.happy.mouth).toBe("smile");
    expect(FACE_SPECS.happy.blush).toBe(true);
  });

  it("is the sleepy face when fast asleep", () => {
    expect(getFaceLook(1)).toEqual({ eyeOpen: 0, smile: 0, blush: 0 });
    expect(FACE_SPECS.sleepy.eyes).toBe("closed");
    expect(FACE_SPECS.sleepy.mouth).toBe("flat");
    expect(FACE_SPECS.sleepy.blush).toBe(false);
  });

  it("closes the eyes, flattens the smile and fades the blush as it gets drowsier", () => {
    let previous = getFaceLook(0);
    for (let i = 1; i <= 20; i++) {
      const look = getFaceLook(i / 20);
      expect(look.eyeOpen).toBeLessThanOrEqual(previous.eyeOpen);
      expect(look.smile).toBeLessThanOrEqual(previous.smile);
      expect(look.blush).toBeLessThanOrEqual(previous.blush);
      previous = look;
    }
  });

  it("closes the eyes ahead of the mouth", () => {
    const halfway = getFaceLook(0.5);
    expect(halfway.eyeOpen).toBeLessThan(halfway.smile);
  });

  it("has the eyes fully shut a little before the end", () => {
    expect(getFaceLook(0.9).eyeOpen).toBe(0);
    expect(getFaceLook(0.9).smile).toBeGreaterThan(0);
  });

  it("stays within range, even for out-of-range input", () => {
    for (const d of [-1, 0, 0.3, 1, 5]) {
      for (const value of Object.values(getFaceLook(d))) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("drowsy frames", () => {
  it("uses the first frame when awake and the last when asleep", () => {
    expect(drowsyFrameIndex(0, DROWSY_FRAMES)).toBe(0);
    expect(drowsyFrameIndex(1, DROWSY_FRAMES)).toBe(DROWSY_FRAMES - 1);
  });

  it("moves steadily through the frames", () => {
    let previous = 0;
    const seen = new Set<number>();
    for (let i = 0; i <= 100; i++) {
      const index = drowsyFrameIndex(i / 100, DROWSY_FRAMES);
      expect(Number.isInteger(index)).toBe(true);
      expect(index).toBeGreaterThanOrEqual(previous);
      previous = index;
      seen.add(index);
    }
    expect(seen.size).toBe(DROWSY_FRAMES);
  });

  it("clamps to the available frames", () => {
    expect(drowsyFrameIndex(-3, DROWSY_FRAMES)).toBe(0);
    expect(drowsyFrameIndex(9, DROWSY_FRAMES)).toBe(DROWSY_FRAMES - 1);
  });

  it("has enough frames for a smooth blink-by-blink close", () => {
    expect(DROWSY_FRAMES).toBeGreaterThanOrEqual(8);
  });
});

describe("picking the face to show", () => {
  const faces = {
    drowsy: Array.from({ length: DROWSY_FRAMES }, (_, i) => `drowsy-${i}`),
    dizzy: "dizzy",
  };

  it("shows the first drowsy frame for the happy face", () => {
    expect(pickFace(faces, "happy", 0)).toBe("drowsy-0");
  });

  it("ignores drowsiness unless the ball is sleepy", () => {
    expect(pickFace(faces, "happy", 0.8)).toBe("drowsy-0");
  });

  it("shows the dizzy face whatever the drowsiness", () => {
    expect(pickFace(faces, "dizzy", 0)).toBe("dizzy");
    expect(pickFace(faces, "dizzy", 1)).toBe("dizzy");
  });

  it("walks through the drowsy frames as the sleepy ball nods off", () => {
    expect(pickFace(faces, "sleepy", 0)).toBe("drowsy-0");
    expect(pickFace(faces, "sleepy", 1)).toBe(`drowsy-${DROWSY_FRAMES - 1}`);
    expect(pickFace(faces, "sleepy", 0.5)).toBe(
      `drowsy-${drowsyFrameIndex(0.5, DROWSY_FRAMES)}`,
    );
  });

  it("starts the sleepy face where the happy one is, so nothing jumps", () => {
    expect(pickFace(faces, "sleepy", 0)).toBe(pickFace(faces, "happy", 0));
  });
});
