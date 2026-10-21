import { Canvas } from "@react-three/fiber";

export default function App() {
  return (
    <Canvas camera={{ position: [0, 2, 6], fov: 50 }}>
      <color attach="background" args={["#06063e"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 2]} intensity={1.8} />
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#a5b2df" />
      </mesh>
    </Canvas>
  );
}
