import { Environment } from "@react-three/drei";
import { FLOOR_POSITION_Y } from "../sim/config";
import { Sky } from "./Sky";

// Captures the sky once into a cube map that lights the scene and gives the glossy
// candy and the ball something to reflect. A dark green disc stands in for the
// grass, so reflections facing down aren't sky-coloured.
export const SkyReflections = () => (
  <Environment resolution={256} frames={1} environmentIntensity={0.9}>
    <Sky drift={false} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_POSITION_Y, 0]}>
      <circleGeometry args={[350, 32]} />
      <meshBasicMaterial color="#1f6b3a" fog={false} toneMapped={false} />
    </mesh>
  </Environment>
);
