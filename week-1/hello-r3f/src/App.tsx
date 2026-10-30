import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BALL_RADIUS, FLOOR_POSITION_Y, INITIAL_POSITION_Y } from "./sim/config";
import { createFaceTextures } from "./render/faceTexture";
import { clickWorld, createWorld, getView, stepWorld } from "./sim/world";

const BouncingBall = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const worldRef = useRef(createWorld());
  const faces = useMemo(() => createFaceTextures(), []);

  useFrame((_, deltaTime) => {
    if (!meshRef.current) return;
    worldRef.current = stepWorld(worldRef.current, deltaTime).world;
    const { positionY, scale, expression } = getView(worldRef.current);
    if (materialRef.current && materialRef.current.map !== faces[expression]) {
      materialRef.current.map = faces[expression];
    }
    meshRef.current.position.y = positionY;
    meshRef.current.scale.set(...scale);
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, INITIAL_POSITION_Y, 0]}
      onClick={() => {
        worldRef.current = clickWorld(worldRef.current).world;
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
      <meshStandardMaterial ref={materialRef} map={faces.happy} />
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
