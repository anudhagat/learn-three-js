import { describe, expect, it } from "vitest";
import {
  CHERRY_BOUNCES,
  CHERRY_DURATION,
  DANCE_DURATION,
  JELLY_DURATION,
  MAX_DANCE_TILT,
  SHELLS_DURATION,
  SPIN_DURATION,
  SPIN_TURNS,
  TWIRL_DURATION,
  TWIRL_SETTLE,
  TWIRL_TURNS,
  cherryBounce,
  danceMotion,
  donutTwirl,
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

describe("donut twirl", () => {
  const REST = { stand: 0, spin: 0, rock: 0, lift: 0 };
  const settleStart = TWIRL_DURATION - TWIRL_SETTLE;
  const spinning = samples(settleStart, 800);

  it("is at rest before and after", () => {
    for (const t of [-1, 0, TWIRL_DURATION, TWIRL_DURATION + 4]) {
      expect(donutTwirl(t)).toEqual(REST);
    }
  });

  it("stands up on its edge, stays up while it twirls, then lies down", () => {
    const stands = samples(TWIRL_DURATION).map((t) => donutTwirl(t).stand);
    expect(Math.max(...stands)).toBe(1);
    for (const stand of stands) {
      expect(stand).toBeGreaterThanOrEqual(0);
      expect(stand).toBeLessThanOrEqual(1);
    }
    expect(donutTwirl(0.6).stand).toBe(1); // Quickly up
    expect(donutTwirl(TWIRL_DURATION * 0.4).stand).toBe(1);
    expect(donutTwirl(settleStart).stand).toBe(0); // Flat again before the rocking
  });

  it("spins on the spot a few whole turns, only ever forwards", () => {
    expect(Number.isInteger(TWIRL_TURNS)).toBe(true);
    expect(TWIRL_TURNS).toBeGreaterThanOrEqual(3);
    let previous = 0;
    for (const t of spinning) {
      const { spin } = donutTwirl(t);
      expect(spin).toBeGreaterThanOrEqual(previous);
      previous = spin;
    }
    // Ends on a whole number of turns, so it looks the same as when it began
    expect(donutTwirl(settleStart).spin).toBeCloseTo(TWIRL_TURNS * Math.PI * 2, 6);
  });

  it("starts fast and slows right down, like a spinning coin running out of spin", () => {
    const speed = (t: number) => (donutTwirl(t + 0.01).spin - donutTwirl(t).spin) / 0.01;
    expect(speed(0.5)).toBeGreaterThan(speed(settleStart * 0.5));
    expect(speed(settleStart - 0.4)).toBeLessThan(speed(0.5) * 0.15);
  });

  it("only tips down once the spin has almost died away", () => {
    const liesDown = (t: number) => donutTwirl(t).stand < 1;
    const firstTipping = spinning.find((t) => t > 0.6 && liesDown(t))!;
    const speed = (donutTwirl(firstTipping + 0.01).spin - donutTwirl(firstTipping).spin) / 0.01;
    expect(speed).toBeLessThan(2);
  });

  it("takes a few seconds", () => {
    expect(TWIRL_DURATION).toBeGreaterThanOrEqual(2);
    expect(TWIRL_DURATION).toBeLessThanOrEqual(3.6);
  });
});

describe("donut settling like a coin", () => {
  const settleStart = TWIRL_DURATION - TWIRL_SETTLE;
  const settling = samples(TWIRL_SETTLE, 600).map((s) => settleStart + s * 0.9999);

  it("rocks from side to side a few times", () => {
    let crossings = 0;
    let previous = 0;
    for (const t of settling) {
      const { rock } = donutTwirl(t);
      if (previous !== 0 && rock !== 0 && Math.sign(rock) !== Math.sign(previous)) crossings++;
      if (rock !== 0) previous = rock;
    }
    expect(crossings).toBeGreaterThanOrEqual(2);
    expect(crossings).toBeLessThanOrEqual(8);
  });

  it("rocks less and less until it lies still", () => {
    const peak = (from: number, to: number) =>
      Math.max(
        ...settling.filter((t) => t >= from && t < to).map((t) => Math.abs(donutTwirl(t).rock)),
      );
    const half = settleStart + TWIRL_SETTLE / 2;
    expect(peak(half, TWIRL_DURATION)).toBeLessThan(peak(settleStart, half) * 0.5);
    expect(Math.abs(donutTwirl(TWIRL_DURATION * 0.99999).rock)).toBeLessThan(0.02);
  });

  it("starts the rocking from still, so nothing jumps", () => {
    expect(Math.abs(donutTwirl(settleStart + 0.001).rock)).toBeLessThan(0.01);
  });

  it("never lets an edge sink into the ground: it lifts as much as it tips", () => {
    for (const t of samples(TWIRL_DURATION)) {
      const { rock, lift } = donutTwirl(t);
      expect(lift).toBeGreaterThanOrEqual(0);
      expect(lift).toBeCloseTo(Math.sin(Math.abs(rock)), 9);
    }
  });

  it("only rocks while it lies flat", () => {
    for (const t of samples(settleStart)) expect(donutTwirl(t).rock).toBe(0);
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
