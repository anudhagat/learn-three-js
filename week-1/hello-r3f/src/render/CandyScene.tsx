import { useMemo } from "react";
import * as THREE from "three";
import { FLOOR_POSITION_Y } from "../sim/config";
import { CANDY_PROPS, FLOOR_SIZE, type CandyProp } from "./candyLayout";
import {
  HORIZON_COLOR,
  createGrassTexture,
  createSwirlTexture,
} from "./candyTextures";
import { GrassLawn } from "./GrassLawn";
import { Sky } from "./Sky";
import { createCurvedGroundGeometry, groundHeight, surfaceNormal } from "./groundCurve";

// Where a prop stands: on the curved ground, tilted to follow the surface
const placeOnGround = (x: number, z: number) => {
  const [nx, ny, nz] = surfaceNormal(x, z);
  const tilt = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(nx, ny, nz),
  );
  return {
    position: [x, FLOOR_POSITION_Y + groundHeight(x, z), z] as [number, number, number],
    quaternion: tilt,
  };
};

const Lollipop = ({ position: [x, z], size, color }: CandyProp) => {
  const swirl = useMemo(() => createSwirlTexture(color), [color]);
  const stickHeight = size * 3.2;
  return (
    <group {...placeOnGround(x, z)}>
      <mesh position={[0, stickHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[size * 0.07, size * 0.07, stickHeight, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[0, stickHeight + size * 0.6, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[size, size, size * 0.22, 40]} />
        <meshStandardMaterial attach="material-0" color="#ffffff" roughness={0.2} />
        <meshStandardMaterial attach="material-1" map={swirl} roughness={0.2} />
        <meshStandardMaterial attach="material-2" color="#ffffff" roughness={0.2} />
      </mesh>
    </group>
  );
};

const Gumdrop = ({ position: [x, z], size, color }: CandyProp) => (
  // Half of the sphere sinks into the floor, leaving a dome
  <mesh {...placeOnGround(x, z)} scale={[1, 0.85, 1]} castShadow>
    <sphereGeometry args={[size, 32, 24]} />
    <meshStandardMaterial color={color} roughness={0.25} />
  </mesh>
);

export const CandyScene = () => {
  const grass = useMemo(() => createGrassTexture(FLOOR_SIZE / 8), []);
  const ground = useMemo(() => createCurvedGroundGeometry(FLOOR_SIZE, 160), []);

  return (
    <>
      <Sky />
      {/* Fades the far floor into the horizon colour */}
      <fog attach="fog" args={[HORIZON_COLOR, 18, 55]} />
      <mesh geometry={ground} position={[0, FLOOR_POSITION_Y, 0]} receiveShadow>
        <meshStandardMaterial map={grass} roughness={0.85} />
      </mesh>
      <GrassLawn />
      {CANDY_PROPS.map((prop) =>
        prop.kind === "lollipop" ? (
          <Lollipop key={prop.position.join()} {...prop} />
        ) : (
          <Gumdrop key={prop.position.join()} {...prop} />
        ),
      )}
    </>
  );
};
