import * as THREE from "three";

// Radius of the big ball the ground curves around; smaller rounds the horizon more
export const GROUND_RADIUS = 70;
const MAX_DISTANCE = GROUND_RADIUS * 0.95; // Keeps the maths finite far away

const clampedDistanceSquared = (x: number, z: number) =>
  Math.min(x * x + z * z, MAX_DISTANCE ** 2);

// How far the ground has fallen away from flat at (x, z)
export const curveDrop = (x: number, z: number): number =>
  GROUND_RADIUS - Math.sqrt(GROUND_RADIUS ** 2 - clampedDistanceSquared(x, z));

// Height of the ground relative to the flat floor under the ball
export const groundHeight = (x: number, z: number): number => -curveDrop(x, z);

// Unit vector pointing away from the ground surface, for standing props upright on it
export const surfaceNormal = (x: number, z: number): [number, number, number] => {
  const s = Math.sqrt(GROUND_RADIUS ** 2 - clampedDistanceSquared(x, z));
  const length = Math.hypot(x / s, 1, z / s);
  return [x / s / length, 1 / length, z / s / length];
};

// A square floor whose vertices follow the curve
export const createCurvedGroundGeometry = (size: number, segments: number) => {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i++) {
    position.setY(i, groundHeight(position.getX(i), position.getZ(i)));
  }
  geometry.computeVertexNormals();
  return geometry;
};
