import { sunLightPosition } from "./skyLayout";

// The sun sits low behind the scene and casts the shadows, so they fall towards the
// camera. The ball and candy would be backlit, so a gentle fill light from the
// front, which casts no shadows, keeps their faces readable.
export const Lights = () => (
  <>
    <ambientLight intensity={0.3} color="#cdbdff" />
    <directionalLight position={[-6, 5, 10]} intensity={1.1} color="#ffdccb" />
    <directionalLight
      position={sunLightPosition(40)}
      intensity={5}
      color="#ffb98a"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-22}
      shadow-camera-right={22}
      shadow-camera-top={22}
      shadow-camera-bottom={-22}
      shadow-camera-near={1}
      shadow-camera-far={90}
      shadow-bias={-0.001}
      shadow-normalBias={0.08}
    />
  </>
);
