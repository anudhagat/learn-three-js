import { MAX_DELTA } from "./config";
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
import { getExpression, type Expression } from "./expression";

export interface World {
  time: number; // Simulation clock in seconds
  ball: BallState;
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
}

export const createWorld = (): World => ({ time: 0, ball: createBall() });

export const stepWorld = (world: World, rawDelta: number): WorldStep => {
  const dt = Math.min(rawDelta, MAX_DELTA);
  const { ball, events } = stepBallWithEvents(world.ball, dt);
  return { world: { ...world, time: world.time + dt, ball }, events };
};

export const clickWorld = (world: World): WorldStep => {
  const ball = jumpBall(world.ball);
  if (ball.v <= world.ball.v) return { world, events: [] };
  return { world: { ...world, ball }, events: [{ type: "launch" }] };
};

export const getView = (world: World): WorldView => ({
  ...getBallVisual(world.ball),
  pitch: getBallPitch(world.ball),
  mode: getMode(world.ball),
  expression: getExpression(world.ball),
});
