import { describe, expect, it } from "vitest";
import { CAMERA_FOV, CAMERA_POSITION } from "./camera";

describe("camera", () => {
  it("sits in front of the scene, above the ground, looking towards it", () => {
    const [x, y, z] = CAMERA_POSITION;
    expect(x).toBe(0);
    expect(y).toBeGreaterThan(0);
    expect(z).toBeGreaterThan(0);
  });

  it("has a sensible field of view", () => {
    expect(CAMERA_FOV).toBeGreaterThan(30);
    expect(CAMERA_FOV).toBeLessThan(110);
  });
});
