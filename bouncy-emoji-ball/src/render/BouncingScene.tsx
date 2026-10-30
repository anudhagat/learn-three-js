import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BALL_RADIUS, FLOOR_POSITION_Y, INITIAL_POSITION_Y } from "../sim/config";
import { clickWorld, createWorld, getView, stepWorld } from "../sim/world";
import { toDustInstances } from "./dustInstances";
import { pickFace } from "./faceLook";
import { createFaceTextures } from "./faceTexture";
import { createShadowTexture } from "./shadowTexture";
import { createStarTexture } from "./starTexture";

const MAX_DUST_INSTANCES = 256;
const STAR_SCALE = 3; // Star sprite size relative to a particle's size
const STAR_COLOR = new THREE.Color("#ffe27a");

// Owns the simulation: steps the world each frame and applies the result to the
// ball and the star dust
export const BouncingScene = () => {
  const ballRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const dustRef = useRef<THREE.InstancedMesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const shadowMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const worldRef = useRef(createWorld());
  const faces = useMemo(() => createFaceTextures(), []);
  const star = useMemo(() => createStarTexture(), []);
  const shadowTexture = useMemo(() => createShadowTexture(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  // The instance colour buffer must exist before the first render
  useLayoutEffect(() => {
    dustRef.current?.setColorAt(0, STAR_COLOR);
  }, []);

  useFrame(({ camera }, deltaTime) => {
    const ball = ballRef.current;
    const dust = dustRef.current;
    const shadow = shadowRef.current;
    const shadowMaterial = shadowMaterialRef.current;
    if (!ball || !dust || !shadow || !shadowMaterial) return;

    worldRef.current = stepWorld(worldRef.current, deltaTime, Math.random).world;
    const view = getView(worldRef.current);

    const face = pickFace(faces, view.expression, view.drowsiness);
    if (materialRef.current && materialRef.current.map !== face) {
      materialRef.current.map = face;
    }
    ball.position.y = view.positionY;
    ball.scale.set(...view.scale);
    ball.rotation.x = -view.pitch; // Negative tilts the face up
    shadow.scale.setScalar(view.shadow.radius);
    shadowMaterial.opacity = view.shadow.opacity;

    const instances = toDustInstances(view.dust, MAX_DUST_INSTANCES);
    dust.count = instances.length;
    instances.forEach((instance, i) => {
      dummy.position.set(...instance.position);
      dummy.quaternion.copy(camera.quaternion); // Face the camera
      dummy.scale.setScalar(instance.scale * STAR_SCALE);
      dummy.updateMatrix();
      dust.setMatrixAt(i, dummy.matrix);
      // Additive blending, so a dimmer colour reads as a fainter star
      dust.setColorAt(i, color.copy(STAR_COLOR).multiplyScalar(instance.intensity));
    });
    dust.instanceMatrix.needsUpdate = true;
    if (dust.instanceColor) dust.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <mesh
        ref={ballRef}
        position={[0, INITIAL_POSITION_Y, 0]}
        onClick={() => {
          worldRef.current = clickWorld(worldRef.current, Math.random).world;
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
        <meshStandardMaterial ref={materialRef} map={faces.drowsy[0]} />
      </mesh>
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FLOOR_POSITION_Y + 0.03, 0]}
        raycast={() => null} // The shadow shouldn't block clicks on the ball
      >
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial
          ref={shadowMaterialRef}
          map={shadowTexture}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <instancedMesh
        ref={dustRef}
        args={[undefined, undefined, MAX_DUST_INSTANCES]}
        frustumCulled={false}
        raycast={() => null} // Stars shouldn't block clicks on the ball
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={star}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>
    </>
  );
};
