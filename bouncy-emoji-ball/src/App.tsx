import { Canvas } from "@react-three/fiber";
import { BouncingScene } from "./render/BouncingScene";
import { CAMERA_FOV, CAMERA_POSITION } from "./render/camera";
import { CandyScene } from "./render/CandyScene";
import { Lights } from "./render/Lights";
import { SkyReflections } from "./render/SkyReflections";

// Drawing every pixel of a Retina screen costs four times as much as a normal one, and
// 1.5 looks almost as sharp while keeping the frame rate up on weaker GPUs
const MAX_PIXEL_RATIO = 1.5;

export default function App() {
  return (
    <Canvas
      dpr={[1, MAX_PIXEL_RATIO]}
      shadows="percentage"
      camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
    >
      <Lights />
      <SkyReflections />
      <CandyScene />
      <BouncingScene />
    </Canvas>
  );
}
