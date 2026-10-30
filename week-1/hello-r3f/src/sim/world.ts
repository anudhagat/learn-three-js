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
import {
  createExpressionState,
  getExpression,
  registerClick,
  type Expression,
  type ExpressionState,
} from "./expression";

export interface World {
  time: number; // Simulation clock in seconds
  ball: BallState;
  expression: ExpressionState;
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

export const createWorld = (): World => ({
  time: 0,
  ball: createBall(),
  expression: createExpressionState(),
});

export const stepWorld = (world: World, rawDelta: number): WorldStep => {
  const dt = Math.min(rawDelta, MAX_DELTA);
  const { ball, events } = stepBallWithEvents(world.ball, dt);
  return { world: { ...world, time: world.time + dt, ball }, events };
};

export const clickWorld = (world: World): WorldStep => {
  // Every click counts towards getting dizzy, even one the ball ignores
  const clicked = {
    ...world,
    expression: registerClick(world.expression, world.time),
  };
  const ball = jumpBall(world.ball);
  if (ball.v <= world.ball.v) return { world: clicked, events: [] };
  return { world: { ...clicked, ball }, events: [{ type: "launch" }] };
};

export const getView = (world: World): WorldView => ({
  ...getBallVisual(world.ball),
  pitch: getBallPitch(world.ball),
  mode: getMode(world.ball),
  expression: getExpression(world.ball, world.expression, world.time),
});
