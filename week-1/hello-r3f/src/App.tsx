import { Canvas } from "@react-three/fiber";
import { BouncingScene } from "./render/BouncingScene";
import { FLOOR_POSITION_Y } from "./sim/config";

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
    <Canvas camera={{ position: [0, 1.5, 8], fov: 70 }}>
      <color attach="background" args={["#e99949"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 2]} intensity={1.8} color="#e8e7ad" />
      <BouncingScene />
      <Plane />
    </Canvas>
  );
}
