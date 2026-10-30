import { Canvas } from "@react-three/fiber";
import { BouncingScene } from "./render/BouncingScene";
import { CandyScene } from "./render/CandyScene";
import { SkyReflections } from "./render/SkyReflections";

export default function App() {
  return (
    <Canvas shadows="soft" camera={{ position: [0, 1.5, 8], fov: 70 }}>
      <ambientLight intensity={0.35} color="#cdbdff" />
      <directionalLight
        position={[-12, 10, 6]}
        intensity={2.2}
        color="#ffd2a1"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0005}
        shadow-normalBias={0.05}
      />
      <SkyReflections />
      <CandyScene />
      <BouncingScene />
    </Canvas>
  );
}
