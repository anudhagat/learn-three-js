import { REFERENCE_SPEED } from "./config";

// 0 to 1 strength of an effect for a given speed. Squared, so slow late bounces
// are almost imperceptible.
export const speedIntensity = (speed: number): number =>
  Math.min(speed / REFERENCE_SPEED, 1) ** 2;
