import { Canvas } from "@react-three/fiber";
import { BouncingScene } from "./render/BouncingScene";
import { CandyScene } from "./render/CandyScene";
import { SkyReflections } from "./render/SkyReflections";

export default function App() {
  return (
    <Canvas camera={{ position: [0, 1.5, 8], fov: 70 }}>
      <ambientLight intensity={0.35} color="#cdbdff" />
      <directionalLight position={[-4, 4, 5]} intensity={2.2} color="#ffd2a1" />
      <SkyReflections />
      <CandyScene />
      <BouncingScene />
    </Canvas>
  );
}
