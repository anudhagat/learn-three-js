import { Canvas } from "@react-three/fiber";
import { BouncingScene } from "./render/BouncingScene";
import { CandyScene } from "./render/CandyScene";
import { Lights } from "./render/Lights";
import { SkyReflections } from "./render/SkyReflections";

export default function App() {
  return (
    <Canvas shadows="percentage" camera={{ position: [0, 1.5, 8], fov: 70 }}>
      <Lights />
      <SkyReflections />
      <CandyScene />
      <BouncingScene />
    </Canvas>
  );
}
