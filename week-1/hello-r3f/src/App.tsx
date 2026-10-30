import { Canvas } from "@react-three/fiber";
import { BouncingScene } from "./render/BouncingScene";
import { CandyScene } from "./render/CandyScene";

export default function App() {
  return (
    <Canvas camera={{ position: [0, 1.5, 8], fov: 70 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 6, 4]} intensity={2} color="#fff0f6" />
      <CandyScene />
      <BouncingScene />
    </Canvas>
  );
}
