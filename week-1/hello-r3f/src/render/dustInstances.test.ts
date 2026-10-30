import { describe, expect, it } from "vitest";
import type { DustView } from "../sim/dust";
import { toDustInstances } from "./dustInstances";

const view = (opacity: number, x = 0): DustView => ({
  position: [x, 0, 0],
  size: 0.2,
  opacity,
});

describe("dust instances", () => {
  it("passes position and brightness through", () => {
    const [instance] = toDustInstances([view(0.7, 3)], 10);
    expect(instance.position).toEqual([3, 0, 0]);
    expect(instance.intensity).toBe(0.7);
  });

  it("shrinks the stars as they fade", () => {
    const [fresh, fading] = toDustInstances([view(1), view(0.2)], 10);
    expect(fresh.scale).toBeGreaterThan(fading.scale);
    expect(fading.scale).toBeGreaterThan(0);
  });

  it("keeps the newest stars when over capacity", () => {
    const views = [view(1, 0), view(1, 1), view(1, 2), view(1, 3)];
    const instances = toDustInstances(views, 2);
    expect(instances.map((i) => i.position[0])).toEqual([2, 3]);
  });

  it("returns nothing for no dust", () => {
    expect(toDustInstances([], 10)).toEqual([]);
  });
});
