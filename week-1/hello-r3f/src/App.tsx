import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const INITIAL_POSITION_Y = 0; // Initial position of the ball
const FLOOR_POSITION_Y = -2; // Floor position of the ball
const BALL_RADIUS = 0.5; // Radius of the ball
const BALL_CENTER_LIMIT = FLOOR_POSITION_Y + BALL_RADIUS; // Limit for the ball's center position
const GRAVITY = -9.8;
const RESTITUTION = 0.8; // Coefficient of restitution (bounciness)

const BouncingBall = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const velocityRef = useRef(0.02); // Initial velocity
  const ballAtRestRef = useRef(false); // Flag to check if the ball is at rest

  useFrame((state, deltaTime) => {
    if (ballAtRestRef.current) {
      return; // Skip the update if the ball is at rest
    }
    if (meshRef.current) {
      // Update the velocity based on gravitational acceleration
      velocityRef.current += GRAVITY * deltaTime;

      // Update the position of the mesh based velocity and the time delta
      meshRef.current.position.y += velocityRef.current * deltaTime;

      // Check if the ball has hit the floor
      if (meshRef.current.position.y <= BALL_CENTER_LIMIT) {
        meshRef.current.position.y = BALL_CENTER_LIMIT;
        velocityRef.current = -velocityRef.current * RESTITUTION; // Bounce with some energy loss
        // If the velocity is very small, consider the ball at rest
        if (Math.abs(velocityRef.current) < 0.1) {
          velocityRef.current = 0;
          ballAtRestRef.current = true; // Set the ball at rest
        }
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[0, INITIAL_POSITION_Y, 0]}>
      <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
      <meshStandardMaterial color="#a5b2df" />
    </mesh>
  );
};
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
    <Canvas camera={{ position: [0, 2, 6], fov: 70 }}>
      <color attach="background" args={["#e99949"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 2]} intensity={1.8} color="#e8e7ad" />
      <BouncingBall />
      <Plane />
    </Canvas>
  );
}
