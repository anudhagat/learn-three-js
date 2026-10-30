import type { DustView } from "../sim/dust";

export interface DustInstance {
  position: [number, number, number];
  scale: number;
  intensity: number; // Brightness, 1 when fresh and 0 once faded
}

// Stars shrink to half their size as they fade; the newest win when over capacity
export const toDustInstances = (views: DustView[], capacity: number): DustInstance[] =>
  views.slice(-capacity).map((v) => ({
    position: v.position,
    scale: v.size * (0.5 + 0.5 * v.opacity),
    intensity: v.opacity,
  }));
