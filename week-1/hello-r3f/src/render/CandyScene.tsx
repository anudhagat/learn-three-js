import { useMemo } from "react";
import { FLOOR_POSITION_Y } from "../sim/config";
import { CANDY_PROPS, FLOOR_SIZE, type CandyProp } from "./candyLayout";
import {
  HORIZON_COLOR,
  createCheckerTexture,
  createSkyTexture,
  createSwirlTexture,
} from "./candyTextures";

const Lollipop = ({ position: [x, z], size, color }: CandyProp) => {
  const swirl = useMemo(() => createSwirlTexture(color), [color]);
  const stickHeight = size * 3.2;
  return (
    <group position={[x, FLOOR_POSITION_Y, z]}>
      <mesh position={[0, stickHeight / 2, 0]}>
        <cylinderGeometry args={[size * 0.07, size * 0.07, stickHeight, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[0, stickHeight + size * 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
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
  <mesh position={[x, FLOOR_POSITION_Y, z]} scale={[1, 0.85, 1]}>
    <sphereGeometry args={[size, 32, 24]} />
    <meshStandardMaterial color={color} roughness={0.25} />
  </mesh>
);

export const CandyScene = () => {
  const sky = useMemo(() => createSkyTexture(), []);
  const checker = useMemo(() => createCheckerTexture(FLOOR_SIZE / 3), []);

  return (
    <>
      <primitive object={sky} attach="background" />
      {/* Fades the far floor into the horizon colour */}
      <fog attach="fog" args={[HORIZON_COLOR, 18, 55]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_POSITION_Y, 0]}>
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
        <meshStandardMaterial map={checker} roughness={0.2} metalness={0.05} />
      </mesh>
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
