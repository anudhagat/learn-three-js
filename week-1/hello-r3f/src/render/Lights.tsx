import { sunLightPosition } from "./skyLayout";

// The sun sits low behind the scene and casts the shadows, so they fall towards the
// camera. The ball and candy would be backlit, so a soft fill keeps their faces
// readable. It is a hemisphere light, not a second directional light, because any
// directional light also puts its own shiny highlight on the glossy candy.
export const Lights = () => (
  <>
    <ambientLight intensity={0.3} color="#cdbdff" />
    <hemisphereLight args={["#ffd9c4", "#8f78b8", 0.65]} />
    <directionalLight
      position={sunLightPosition(40)}
      intensity={3.4}
      color="#ffb98a"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-22}
      shadow-camera-right={22}
      shadow-camera-top={22}
      shadow-camera-bottom={-22}
      shadow-camera-near={1}
      shadow-camera-far={90}
      shadow-radius={7} // Wider blur makes the edges softer
      shadow-intensity={0.7} // Lets some light through, so shadows are less dark
      shadow-bias={-0.001}
      shadow-normalBias={0.08}
    />
  </>
);
