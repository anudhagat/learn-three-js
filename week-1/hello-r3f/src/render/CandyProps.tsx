import { useMemo } from "react";
import * as THREE from "three";
import { FLOOR_POSITION_Y } from "../sim/config";
import { CANDY_PROPS, type CandyProp } from "./candyLayout";
import { createStripeTexture, createSwirlTexture } from "./candyTextures";
import { groundHeight, surfaceNormal } from "./groundCurve";

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

// Hard glossy candy: a bright clear coat over a fairly smooth surface
const HARD_CANDY = { roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 };

const Lollipop = ({ position: [x, z], size, color }: CandyProp) => {
  const swirl = useMemo(() => createSwirlTexture(color), [color]);
  const stripes = useMemo(() => createStripeTexture(color), [color]);
  const stickHeight = size * 3.2;
  return (
    <group {...placeOnGround(x, z)}>
      <mesh position={[0, stickHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[size * 0.07, size * 0.07, stickHeight, 12]} />
        <meshPhysicalMaterial map={stripes} {...HARD_CANDY} />
      </mesh>
      <mesh position={[0, stickHeight + size * 0.6, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[size, size, size * 0.22, 40]} />
        <meshPhysicalMaterial attach="material-0" color="#ffffff" {...HARD_CANDY} />
        <meshPhysicalMaterial attach="material-1" map={swirl} {...HARD_CANDY} />
        <meshPhysicalMaterial attach="material-2" color="#ffffff" {...HARD_CANDY} />
      </mesh>
    </group>
  );
};

// Half of the sphere sinks into the floor, leaving a dome. Jelly-like: glossy, with a
// faint glow of its own colour from inside.
const Gumdrop = ({ position: [x, z], size, color }: CandyProp) => (
  <mesh {...placeOnGround(x, z)} scale={[1, 0.85, 1]} castShadow>
    <sphereGeometry args={[size, 32, 24]} />
    <meshPhysicalMaterial
      color={color}
      emissive={color}
      emissiveIntensity={0.12}
      roughness={0.2}
      clearcoat={1}
      clearcoatRoughness={0.06}
    />
  </mesh>
);

export const CandyProps = () => (
  <>
    {CANDY_PROPS.map((prop) =>
      prop.kind === "lollipop" ? (
        <Lollipop key={prop.position.join()} {...prop} />
      ) : (
        <Gumdrop key={prop.position.join()} {...prop} />
      ),
    )}
  </>
);
