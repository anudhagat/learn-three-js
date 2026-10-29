import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import {
  BALL_RADIUS,
  FLOOR_POSITION_Y,
  INITIAL_POSITION_Y,
  createBall,
  getBallVisual,
  stepBall,
} from "./physics";

const BouncingBall = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ballRef = useRef(createBall());

  useFrame((_, deltaTime) => {
    if (!meshRef.current) return;
    ballRef.current = stepBall(ballRef.current, deltaTime);
    const { positionY, scale } = getBallVisual(ballRef.current);
    meshRef.current.position.y = positionY;
    meshRef.current.scale.set(...scale);
  });

  return (
    <mesh ref={meshRef} position={[0, INITIAL_POSITION_Y, 0]}>
      <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
      <meshStandardMaterial color="#a5b2df" />
    </mesh>
  );
};
const Plane = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_POSITION_Y, 0]}>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#d3dbf9" />
    </mesh>
  );
};

export default function App() {
  return (
    <Canvas camera={{ position: [0, 2, 6], fov: 70 }}>
      <color attach="background" args={["#e99949"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 2]} intensity={1.8} color="#e8e7ad" />
      <BouncingBall />
      <Plane />
    </Canvas>
  );
}
