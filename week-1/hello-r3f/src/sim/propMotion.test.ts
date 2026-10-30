import { describe, expect, it } from "vitest";
import {
  CHERRY_BOUNCES,
  CHERRY_DURATION,
  DANCE_DURATION,
  JELLY_DURATION,
  MAX_DANCE_TILT,
  ROLL_DURATION,
  ROLL_RADIUS,
  ROLL_TURNS,
  SHELLS_DURATION,
  SPIN_DURATION,
  SPIN_TURNS,
  cherryBounce,
  danceMotion,
  donutRoll,
  jellyScale,
  shellsWobble,
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

describe("donut roll", () => {
  const REST = { x: 0, z: 0, heading: 0, stand: 0, roll: 0 };

  it("is at rest before and after", () => {
    for (const t of [-1, 0, ROLL_DURATION, ROLL_DURATION + 4]) {
      expect(donutRoll(t)).toEqual(REST);
    }
  });

  it("stands up on its edge, stays up while rolling, then lies down", () => {
    const stands = samples(ROLL_DURATION).map((t) => donutRoll(t).stand);
    expect(Math.max(...stands)).toBe(1);
    for (const stand of stands) {
      expect(stand).toBeGreaterThanOrEqual(0);
      expect(stand).toBeLessThanOrEqual(1);
    }
    // Up for the middle stretch of the roll, flat again just before the end
    expect(donutRoll(ROLL_DURATION * 0.5).stand).toBe(1);
    expect(donutRoll(ROLL_DURATION * 0.999).stand).toBeLessThan(0.05);
    // Stands up quickly rather than slowly leaning
    expect(donutRoll(ROLL_DURATION * 0.2).stand).toBeGreaterThan(0.5);
  });

  it("rolls round a circle, not a straight line", () => {
    // Every point on the path is ROLL_RADIUS from the circle's centre
    for (const t of samples(ROLL_DURATION * 0.999)) {
      const { x, z } = donutRoll(t);
      expect(Math.hypot(x, z - ROLL_RADIUS)).toBeCloseTo(ROLL_RADIUS, 6);
    }
  });

  it("comes back to where it started", () => {
    const { x, z } = donutRoll(ROLL_DURATION * 0.9999);
    expect(Math.hypot(x, z)).toBeLessThan(0.05);
  });

  it("travels a good way, so it is clearly a roll", () => {
    const furthest = Math.max(
      ...samples(ROLL_DURATION).map((t) => Math.hypot(donutRoll(t).x, donutRoll(t).z)),
    );
    expect(furthest).toBeGreaterThan(ROLL_RADIUS * 1.5);
    expect(ROLL_RADIUS).toBeGreaterThanOrEqual(1);
    expect(ROLL_RADIUS).toBeLessThanOrEqual(3);
  });

  it("faces the way it is going and only ever turns one way", () => {
    let previous = -1;
    for (const t of samples(ROLL_DURATION * 0.999)) {
      const { x, z, heading } = donutRoll(t);
      expect(heading).toBeGreaterThanOrEqual(previous);
      previous = heading;
      // While it is moving, the next bit of the path leads off the way it faces
      const ahead = donutRoll(t + 0.001);
      if (Math.hypot(ahead.x - x, ahead.z - z) > 1e-5) {
        const direction = Math.atan2(ahead.z - z, ahead.x - x);
        expect(Math.cos(direction - heading)).toBeGreaterThan(0.99);
      }
    }
    expect(donutRoll(ROLL_DURATION * 0.9999).heading).toBeCloseTo(Math.PI * 2, 2);
  });

  it("rolls a whole number of turns, so it ends looking just as it started", () => {
    expect(Number.isInteger(ROLL_TURNS)).toBe(true);
    expect(donutRoll(ROLL_DURATION * 0.9999).roll).toBeCloseTo(ROLL_TURNS * Math.PI * 2, 2);
  });

  it("rolls forwards at a steady, decent speed while standing", () => {
    let previous = 0;
    for (const t of samples(ROLL_DURATION * 0.999)) {
      const { roll } = donutRoll(t);
      expect(roll).toBeGreaterThanOrEqual(previous);
      previous = roll;
    }
  });

  it("takes a couple of seconds", () => {
    expect(ROLL_DURATION).toBeGreaterThanOrEqual(1.8);
    expect(ROLL_DURATION).toBeLessThanOrEqual(3.5);
  });
});

describe("cupcake cherry bounce", () => {
  const REST = { y: 0, scaleY: 1, scaleXZ: 1 };
  const frames = samples(CHERRY_DURATION, 3000);

  it("is still before and after", () => {
    for (const t of [-1, CHERRY_DURATION, CHERRY_DURATION + 2]) {
      expect(cherryBounce(t)).toEqual(REST);
    }
  });

  it("never goes below its seat on the icing", () => {
    for (const t of frames) expect(cherryBounce(t).y).toBeGreaterThanOrEqual(0);
  });

  it("hops several times, each lower than the last", () => {
    expect(CHERRY_BOUNCES).toBeGreaterThanOrEqual(3);
    const peaks: number[] = [];
    let rising = false;
    let last = 0;
    for (const t of frames) {
      const { y } = cherryBounce(t);
      if (y < last && rising) peaks.push(last);
      rising = y > last;
      last = y;
    }
    expect(peaks.length).toBeGreaterThanOrEqual(CHERRY_BOUNCES - 1);
    for (let i = 1; i < peaks.length; i++) expect(peaks[i]).toBeLessThan(peaks[i - 1]);
    expect(peaks[0]).toBeGreaterThan(0.3);
  });

  it("gets quicker as it settles, like a ball coming to rest", () => {
    const touchdowns: number[] = [];
    let wasAir = false;
    for (const t of frames) {
      const air = cherryBounce(t).y > 0.002;
      if (wasAir && !air) touchdowns.push(t);
      wasAir = air;
    }
    expect(touchdowns.length).toBeGreaterThanOrEqual(CHERRY_BOUNCES - 1);
    const gaps = touchdowns.slice(1).map((t, i) => t - touchdowns[i]);
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeLessThan(gaps[i - 1]);
  });

  it("squashes where it lands, but not as it first takes off or in mid-air", () => {
    // Find the first landing: the moment it comes back down to its seat
    let landed = 0;
    let wasAir = false;
    for (const t of frames) {
      const air = cherryBounce(t).y > 0.002;
      if (wasAir && !air) {
        landed = t;
        break;
      }
      wasAir = air;
    }
    expect(landed).toBeGreaterThan(0);
    const justLanded = cherryBounce(landed + 0.003);
    expect(justLanded.scaleY).toBeLessThan(0.9);
    expect(justLanded.scaleXZ).toBeGreaterThan(1.02);

    // No squash as it first sets off, so it does not pop out of rest
    expect(cherryBounce(0.002).scaleY).toBeCloseTo(1, 1);

    // At the top of its first hop it is round
    const top = Math.max(...frames.map((t) => cherryBounce(t).y));
    const topTime = frames.find((t) => cherryBounce(t).y === top)!;
    expect(cherryBounce(topTime).scaleY).toBeCloseTo(1, 1);
  });

  it("settles without a last squash, so it doesn't pop when it stops", () => {
    const { scaleY } = cherryBounce(CHERRY_DURATION * 0.9999);
    expect(scaleY).toBeCloseTo(1, 2);
  });

  it("keeps its volume", () => {
    for (const t of frames) {
      const { scaleY, scaleXZ } = cherryBounce(t);
      expect(scaleXZ * scaleXZ * scaleY).toBeCloseTo(1, 9);
    }
  });

  it("is over in about a second", () => {
    expect(CHERRY_DURATION).toBeGreaterThanOrEqual(0.8);
    expect(CHERRY_DURATION).toBeLessThanOrEqual(1.8);
  });
});

describe("macaron shells wobbling apart", () => {
  const REST = { topLift: 0, bottomLift: 0, topTilt: 0, bottomTilt: 0 };
  const frames = samples(SHELLS_DURATION, 1500);

  it("is still before and after", () => {
    for (const t of [-1, SHELLS_DURATION, SHELLS_DURATION + 2]) {
      expect(shellsWobble(t)).toEqual(REST);
    }
  });

  it("starts from rest, with no sudden jump", () => {
    const { topLift, topTilt, bottomTilt } = shellsWobble(0.001);
    expect(topLift).toBeLessThan(0.01);
    expect(Math.abs(topTilt)).toBeLessThan(0.02);
    expect(Math.abs(bottomTilt)).toBeLessThan(0.02);
  });

  it("opens a gap: the top shell rises above the bottom one, never into it", () => {
    let widest = 0;
    for (const t of frames) {
      const { topLift, bottomLift } = shellsWobble(t);
      expect(bottomLift).toBeGreaterThanOrEqual(0);
      expect(topLift - bottomLift).toBeGreaterThanOrEqual(-1e-9);
      widest = Math.max(widest, topLift - bottomLift);
    }
    expect(widest).toBeGreaterThan(0.15);
  });

  it("wobbles the shells in opposite directions", () => {
    let opposite = 0;
    let both = 0;
    for (const t of frames) {
      const { topTilt, bottomTilt } = shellsWobble(t);
      if (Math.abs(topTilt) > 0.02 && Math.abs(bottomTilt) > 0.02) {
        both++;
        if (Math.sign(topTilt) !== Math.sign(bottomTilt)) opposite++;
      }
    }
    expect(both).toBeGreaterThan(100);
    expect(opposite / both).toBeGreaterThan(0.95);
  });

  it("wobbles back and forth several times", () => {
    let crossings = 0;
    let previous = 0;
    for (const t of frames) {
      const { topTilt } = shellsWobble(t);
      if (previous !== 0 && topTilt !== 0 && Math.sign(topTilt) !== Math.sign(previous)) crossings++;
      if (topTilt !== 0) previous = topTilt;
    }
    expect(crossings).toBeGreaterThanOrEqual(5);
  });

  it("settles down", () => {
    const peak = (from: number, to: number) =>
      Math.max(
        ...frames
          .filter((t) => t >= from && t < to)
          .map((t) => Math.abs(shellsWobble(t).topTilt)),
      );
    expect(peak(SHELLS_DURATION / 2, SHELLS_DURATION)).toBeLessThan(
      peak(0, SHELLS_DURATION / 2) * 0.5,
    );
  });

  it("is over in about a second and a half", () => {
    expect(SHELLS_DURATION).toBeGreaterThanOrEqual(1);
    expect(SHELLS_DURATION).toBeLessThanOrEqual(2.2);
  });
});
