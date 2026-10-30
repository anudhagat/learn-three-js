import { Canvas } from "@react-three/fiber";
import { BouncingScene } from "./render/BouncingScene";
import { CAMERA_FOV, CAMERA_POSITION } from "./render/camera";
import { CandyScene } from "./render/CandyScene";
import { Lights } from "./render/Lights";
import { SkyReflections } from "./render/SkyReflections";

export default function App() {
  return (
    <Canvas shadows="percentage" camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}>
      <Lights />
      <SkyReflections />
      <CandyScene />
      <BouncingScene />
    </Canvas>
  );
}
