import { useMemo } from "react";
import { FLOOR_POSITION_Y } from "../sim/config";
import { FLOOR_SIZE } from "./candyLayout";
import { CandyProps } from "./CandyProps";
import { HORIZON_COLOR, createGrassTextures } from "./candyTextures";
import { GrassLawn } from "./GrassLawn";
import { Sky } from "./Sky";
import { createCurvedGroundGeometry } from "./groundCurve";

export const CandyScene = () => {
  const grass = useMemo(() => createGrassTextures(FLOOR_SIZE / 8), []);
  const ground = useMemo(() => createCurvedGroundGeometry(FLOOR_SIZE, 160), []);

  return (
    <>
      <Sky />
      {/* Fades the far floor into the horizon colour */}
      <fog attach="fog" args={[HORIZON_COLOR, 18, 55]} />
      <mesh geometry={ground} position={[0, FLOOR_POSITION_Y, 0]} receiveShadow>
        <meshStandardMaterial map={grass.map} normalMap={grass.normalMap} roughness={0.85} />
      </mesh>
      <GrassLawn />
      <CandyProps />
    </>
  );
};
