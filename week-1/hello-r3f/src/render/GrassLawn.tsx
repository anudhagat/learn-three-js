import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createRng } from "../sim/rng";
import { FLOOR_POSITION_Y } from "../sim/config";
import { CANDY_PROPS } from "./candyLayout";
import { scatterTufts } from "./grassBlades";
import { groundHeight } from "./groundCurve";

const TUFT_COUNT = 7000;
const BLADE_SEGMENTS = 4;
const DARK_GREEN = new THREE.Color("#1f6b3a");
const LIGHT_GREEN = new THREE.Color("#86d65c");

// A slim tapering blade, 1 unit wide and 1 tall, scaled per blade. It is darker at the
// base and lighter at the tip, and its normals point up so it shades like the ground.
const createBladeGeometry = () => {
  const positions: number[] = [];
  const colors: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= BLADE_SEGMENTS; i++) {
    const t = i / BLADE_SEGMENTS;
    const halfWidth = 0.5 * (1 - t ** 1.5); // Comes to a point at the tip
    const shade = 0.5 + 0.7 * t;
    positions.push(-halfWidth, t, 0, halfWidth, t, 0);
    colors.push(shade, shade, shade, shade, shade, shade);
    normals.push(0, 1, 0, 0, 1, 0);
    if (i < BLADE_SEGMENTS) {
      const row = i * 2;
      indices.push(row, row + 1, row + 2, row + 1, row + 3, row + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
};

// Lit like the ground, with the tips swaying in a gentle wind. The sway is added in
// world space so the whole lawn leans the same way, rippling with each blade's position.
const createGrassMaterial = (time: { value: number }) => {
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    roughness: 0.9,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
      "#include <project_vertex>",
      /* glsl */ `
        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
          float bladeHeight = length( instanceMatrix[ 1 ].xyz );
          float bladeTip = position.y * position.y;
          vec2 spot = instanceMatrix[ 3 ].xz;
          float sway = sin( uTime * 1.6 + spot.x * 0.35 + spot.y * 0.25 )
                     + 0.4 * sin( uTime * 3.2 + spot.x * 1.1 );
          mvPosition.x += sway * 0.22 * bladeHeight * bladeTip;
          mvPosition.z += sway * 0.09 * bladeHeight * bladeTip;
        #endif
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;
      `,
    );
  };
  return material;
};

// Shader uniforms are plain objects that three.js reads every frame
const setUniform = (uniform: { value: number }, value: number) => {
  uniform.value = value;
};

// A lawn of 3D blades around the ball, following the curve of the ground
export const GrassLawn = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const time = useMemo(() => ({ value: 0 }), []);
  const geometry = useMemo(() => createBladeGeometry(), []);
  const material = useMemo(() => createGrassMaterial(time), [time]);
  const blades = useMemo(
    () =>
      scatterTufts(
        createRng(21),
        TUFT_COUNT,
        CANDY_PROPS.map((p) => ({ position: p.position, size: p.size })),
      ).flatMap((tuft) => tuft.blades),
    [],
  );

  // The instance colour buffer must exist before the first render
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    blades.forEach((blade, i) => {
      dummy.position.set(blade.x, FLOOR_POSITION_Y + groundHeight(blade.x, blade.z), blade.z);
      dummy.rotation.set(blade.lean, blade.yaw, 0, "YXZ");
      dummy.scale.set(blade.width, blade.height, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.lerpColors(DARK_GREEN, LIGHT_GREEN, blade.tone));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [blades]);

  useFrame(({ clock }) => {
    setUniform(time, clock.elapsedTime);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, blades.length]}
      receiveShadow
      frustumCulled={false}
      raycast={() => null} // Blades shouldn't block clicks on the ball
    />
  );
};
