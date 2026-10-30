import { describe, expect, it } from "vitest";
import {
  DANCE_DURATION,
  JELLY_DURATION,
  MAX_DANCE_TILT,
  SPIN_DURATION,
  SPIN_TURNS,
  danceMotion,
  jellyScale,
  spinAngle,
} from "./propMotion";

const samples = (duration: number, count = 400) =>
  Array.from({ length: count + 1 }, (_, i) => (duration * i) / count);

describe("lollipop spin", () => {
  it("starts still", () => {
    expect(spinAngle(0)).toBe(0);
    expect(spinAngle(-1)).toBe(0);
  });

  it("does a few full turns", () => {
    expect(SPIN_TURNS).toBeGreaterThanOrEqual(2);
    expect(SPIN_TURNS).toBeLessThanOrEqual(5);
    expect(spinAngle(SPIN_DURATION)).toBeCloseTo(SPIN_TURNS * Math.PI * 2, 9);
  });

  it("ends on a whole number of turns, so the swirl looks as it did before", () => {
    const remainder = spinAngle(SPIN_DURATION) % (Math.PI * 2);
    expect(Math.min(remainder, Math.PI * 2 - remainder)).toBeCloseTo(0, 9);
  });

  it("then stays put", () => {
    expect(spinAngle(SPIN_DURATION + 5)).toBe(spinAngle(SPIN_DURATION));
  });

  it("only ever turns forwards", () => {
    let previous = 0;
    for (const t of samples(SPIN_DURATION + 1)) {
      expect(spinAngle(t)).toBeGreaterThanOrEqual(previous);
      previous = spinAngle(t);
    }
  });

  it("starts fast and slows to a stop", () => {
    const half = spinAngle(SPIN_DURATION / 2);
    expect(half).toBeGreaterThan(spinAngle(SPIN_DURATION) * 0.75);
    const lastBit = spinAngle(SPIN_DURATION) - spinAngle(SPIN_DURATION * 0.97);
    expect(lastBit).toBeLessThan(0.1);
  });

  it("takes a couple of seconds", () => {
    expect(SPIN_DURATION).toBeGreaterThanOrEqual(1.5);
    expect(SPIN_DURATION).toBeLessThanOrEqual(3);
  });
});

describe("candy cane dance", () => {
  it("starts and ends perfectly still", () => {
    for (const t of [0, -1, DANCE_DURATION, DANCE_DURATION + 3]) {
      expect(danceMotion(t)).toEqual({ tilt: 0, twist: 0, hop: 0 });
    }
  });

  it("sways from side to side several times", () => {
    let crossings = 0;
    let previous = 0;
    for (const t of samples(DANCE_DURATION)) {
      const { tilt } = danceMotion(t);
      if (previous !== 0 && tilt !== 0 && Math.sign(tilt) !== Math.sign(previous)) crossings++;
      if (tilt !== 0) previous = tilt;
    }
    expect(crossings).toBeGreaterThanOrEqual(6);
  });

  it("never tips further than the limit", () => {
    for (const t of samples(DANCE_DURATION)) {
      expect(Math.abs(danceMotion(t).tilt)).toBeLessThanOrEqual(MAX_DANCE_TILT + 1e-9);
    }
    const peak = Math.max(...samples(DANCE_DURATION).map((t) => Math.abs(danceMotion(t).tilt)));
    expect(peak).toBeGreaterThan(MAX_DANCE_TILT * 0.5);
  });

  it("calms down as it goes", () => {
    const peak = (from: number, to: number) =>
      Math.max(
        ...samples(DANCE_DURATION)
          .filter((t) => t >= from && t < to)
          .map((t) => Math.abs(danceMotion(t).tilt)),
      );
    expect(peak(DANCE_DURATION / 2, DANCE_DURATION)).toBeLessThan(
      peak(0, DANCE_DURATION / 2),
    );
  });

  it("hops, and never digs into the ground", () => {
    let highest = 0;
    for (const t of samples(DANCE_DURATION)) {
      const { hop } = danceMotion(t);
      expect(hop).toBeGreaterThanOrEqual(0);
      highest = Math.max(highest, hop);
    }
    expect(highest).toBeGreaterThan(0);
  });

  it("twists as well as tilts", () => {
    const peak = Math.max(...samples(DANCE_DURATION).map((t) => Math.abs(danceMotion(t).twist)));
    expect(peak).toBeGreaterThan(0.1);
  });
});

describe("gumdrop jelly giggle", () => {
  it("is back to normal once it is over, and before it starts", () => {
    for (const t of [-1, JELLY_DURATION, JELLY_DURATION + 2]) {
      expect(jellyScale(t)).toEqual({ y: 1, xz: 1 });
    }
  });

  it("is squashed the moment it is poked", () => {
    const { y, xz } = jellyScale(0);
    expect(y).toBeLessThan(0.85);
    expect(xz).toBeGreaterThan(1);
  });

  it("springs back past normal and keeps wobbling", () => {
    const heights = samples(JELLY_DURATION).map((t) => jellyScale(t).y);
    expect(Math.max(...heights)).toBeGreaterThan(1.03);
    let crossings = 0;
    for (let i = 1; i < heights.length; i++) {
      if ((heights[i] - 1) * (heights[i - 1] - 1) < 0) crossings++;
    }
    expect(crossings).toBeGreaterThanOrEqual(3);
  });

  it("settles: the wobble gets smaller", () => {
    const peak = (from: number, to: number) =>
      Math.max(
        ...samples(JELLY_DURATION, 600)
          .filter((t) => t >= from && t < to)
          .map((t) => Math.abs(jellyScale(t).y - 1)),
      );
    expect(peak(JELLY_DURATION / 2, JELLY_DURATION)).toBeLessThan(
      peak(0, JELLY_DURATION / 2) * 0.5,
    );
  });

  it("keeps its volume, so it squashes wide and stretches thin", () => {
    for (const t of samples(JELLY_DURATION)) {
      const { y, xz } = jellyScale(t);
      expect(xz * xz * y).toBeCloseTo(1, 9);
    }
  });

  it("is over in about a second", () => {
    expect(JELLY_DURATION).toBeGreaterThanOrEqual(0.8);
    expect(JELLY_DURATION).toBeLessThanOrEqual(2);
  });
});
