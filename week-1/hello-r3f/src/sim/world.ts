import { BALL_RADIUS, MAX_DELTA } from "./config";
import {
  createBall,
  getMode,
  jumpBall,
  stepBallWithEvents,
  type BallMode,
  type BallState,
  type ImpactEvent,
} from "./ball";
import { getBallPitch, getBallVisual } from "./deformation";
import {
  getDustView,
  spawnImpactDust,
  spawnLaunchDust,
  stepDust,
  type DustView,
  type Particle,
} from "./dust";
import type { Rng } from "./rng";
import { getBallShadow, type BallShadow } from "./shadow";
import {
  createExpressionState,
  getDrowsiness,
  getExpression,
  registerClick,
  type Expression,
  type ExpressionState,
} from "./expression";

export interface World {
  time: number; // Simulation clock in seconds
  ball: BallState;
  expression: ExpressionState;
  dust: Particle[];
}

export type WorldEvent = ImpactEvent | { type: "launch" };

export interface WorldStep {
  world: World;
  events: WorldEvent[];
}

export interface WorldView {
  positionY: number;
  scale: [number, number, number];
  pitch: number; // Radians the ball looks up
  mode: BallMode;
  expression: Expression;
  drowsiness: number; // 0 awake to 1 fast asleep
  dust: DustView[];
  shadow: BallShadow;
}

export const createWorld = (): World => ({
  time: 0,
  ball: createBall(),
  expression: createExpressionState(),
  dust: [],
});

export const stepWorld = (world: World, rawDelta: number, rng: Rng): WorldStep => {
  const dt = Math.min(rawDelta, MAX_DELTA);
  const { ball, events } = stepBallWithEvents(world.ball, dt);
  const thrown = events.flatMap((e) => spawnImpactDust(e.speed, rng));
  const dust = [...stepDust(world.dust, dt), ...thrown];
  return { world: { ...world, time: world.time + dt, ball, dust }, events };
};

export const clickWorld = (world: World, rng: Rng): WorldStep => {
  // Every click counts towards getting dizzy, even one the ball ignores
  const clicked = {
    ...world,
    expression: registerClick(world.expression, world.time),
  };
  const ball = jumpBall(world.ball);
  if (ball.v <= world.ball.v) return { world: clicked, events: [] };
  return {
    world: { ...clicked, ball, dust: [...world.dust, ...spawnLaunchDust(rng, world.ball.y - BALL_RADIUS)] },
    events: [{ type: "launch" }],
  };
};

export const getView = (world: World): WorldView => ({
  ...getBallVisual(world.ball),
  pitch: getBallPitch(world.ball),
  mode: getMode(world.ball),
  expression: getExpression(world.ball, world.expression, world.time),
  drowsiness: getDrowsiness(world.ball),
  dust: getDustView(world.dust),
  shadow: getBallShadow(world.ball),
});
