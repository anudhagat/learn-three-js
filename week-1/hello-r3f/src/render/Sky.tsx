import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createRng } from "../sim/rng";
import { HORIZON_COLOR, createSkyTexture, createSunTexture } from "./candyTextures";
import {
  CLOUD_PUFF_SQUASH,
  SUN_AZIMUTH,
  SUN_ELEVATION,
  driftAzimuth,
  hillProfile,
  scatterClouds,
  scatterStars,
  skyDirection,
} from "./skyLayout";
import { createStarTexture } from "./starTexture";

const DOME_RADIUS = 400;
const CLOUD_DISTANCE = 300;
const CLOUD_SCALE = 24; // World size of a cloud of size 1
const SUN_DISTANCE = 350;
const CLOUD_LIGHT = new THREE.Color("#ffd9ea");
const CLOUD_SHADE = new THREE.Color("#b2569f");

const scaled = (direction: [number, number, number], distance: number) =>
  direction.map((v) => v * distance) as [number, number, number];

// Distant ranges of hills, nearest last; each hides the foot of the one behind
const HILL_LAYERS = [
  { distance: 240, base: 5, amplitude: 9, color: "#ff9aa0", seed: 1 },
  { distance: 190, base: 3, amplitude: 7, color: "#e6779f", seed: 2 },
  { distance: 140, base: 1, amplitude: 5, color: "#c25ca0", seed: 3 },
];
const HILL_SEGMENTS = 160;
const HILL_FOOT = -45; // Where a hill has faded fully into the horizon haze

// Each ridge starts close to the glowing sky and fades into purple haze at its
// foot, so the colour changes gradually from the sky down to the ground
const createHillGeometry = (profile: number[], distance: number, ridgeColor: string) => {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const ridge = new THREE.Color(ridgeColor);
  const haze = new THREE.Color(HORIZON_COLOR);
  for (let i = 0; i <= HILL_SEGMENTS; i++) {
    const angle = (i / HILL_SEGMENTS) * Math.PI * 2;
    const [x, z] = [Math.sin(angle) * distance, -Math.cos(angle) * distance];
    positions.push(x, profile[i % HILL_SEGMENTS], z, x, HILL_FOOT, z); // Ridge, then foot
    colors.push(ridge.r, ridge.g, ridge.b, haze.r, haze.g, haze.b);
    if (i < HILL_SEGMENTS) {
      const top = i * 2;
      indices.push(top, top + 1, top + 2, top + 1, top + 3, top + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
};

const CLOUD_RIM = new THREE.Color("#ffd2a0");

// Flat-coloured puffs with a soft warm glow along the edges that face the sun
const cloudMaterial = (sunDirection: THREE.Vector3) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uSunDir: { value: sunDirection },
      uRim: { value: CLOUD_RIM },
    },
    vertexShader: /* glsl */ `
      varying vec3 vColor;
      varying vec3 vNormalW;
      varying vec3 vViewW;
      void main() {
        vColor = instanceColor;
        mat4 m = modelMatrix * instanceMatrix;
        vec4 worldPos = m * vec4(position, 1.0);
        vNormalW = normalize(mat3(m) * normal);
        vViewW = cameraPosition - worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunDir;
      uniform vec3 uRim;
      varying vec3 vColor;
      varying vec3 vNormalW;
      varying vec3 vViewW;
      void main() {
        vec3 n = normalize(vNormalW);
        vec3 v = normalize(vViewW);
        float towardSun = max(dot(n, uSunDir), 0.0);
        float edge = pow(1.0 - max(dot(n, v), 0.0), 2.0);
        float rim = edge * smoothstep(0.0, 0.7, towardSun);
        vec3 color = vColor + uRim * rim * 0.9 + uRim * towardSun * 0.12;
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });

const Clouds = () => {
  const clouds = useMemo(() => scatterClouds(createRng(11), 16), []);
  const puffCount = clouds.reduce((sum, cloud) => sum + cloud.puffs.length, 0);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const material = useMemo(
    () => cloudMaterial(new THREE.Vector3(...skyDirection(SUN_AZIMUTH, SUN_ELEVATION))),
    [],
  );

  // Puffs keep their order, so colours are set once and only positions move
  const place = (time: number) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    let i = 0;
    for (const cloud of clouds) {
      const azimuth = driftAzimuth(cloud.azimuth, cloud.speed, time);
      const [cx, cy, cz] = scaled(skyDirection(azimuth, cloud.elevation), CLOUD_DISTANCE);
      const unit = cloud.size * CLOUD_SCALE;
      for (const puff of cloud.puffs) {
        // Spread along the horizontal direction facing the cloud
        dummy.position.set(
          cx + Math.cos(azimuth) * puff.dx * unit,
          cy + puff.dy * unit,
          cz + Math.sin(azimuth) * puff.dx * unit,
        );
        dummy.scale.set(puff.radius * unit, puff.radius * CLOUD_PUFF_SQUASH * unit, puff.radius * unit);
        dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  // The instance colour buffer must exist before the first render
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const color = new THREE.Color();
    let i = 0;
    for (const cloud of clouds) {
      for (const puff of cloud.puffs) {
        // Lit tops, shaded bases
        const lit = Math.min(Math.max((puff.dy - 0.25) / 0.7, 0), 1);
        mesh.setColorAt(i++, color.lerpColors(CLOUD_SHADE, CLOUD_LIGHT, lit));
      }
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    place(0);
  });

  useFrame(({ clock }) => place(clock.elapsedTime));

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, puffCount]}
      material={material}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 20, 14]} />
    </instancedMesh>
  );
};

const Stars = () => {
  const texture = useMemo(() => createStarTexture(), []);
  const geometry = useMemo(() => {
    const stars = scatterStars(createRng(4), 260);
    const positions = stars.flatMap((s) =>
      scaled(skyDirection(s.azimuth, s.elevation), DOME_RADIUS * 0.95),
    );
    const colors = stars.flatMap((s) => [s.size, s.size, s.size]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geometry;
  }, []);

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={texture}
        size={18}
        sizeAttenuation={false}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
        toneMapped={false}
      />
    </points>
  );
};

const Hills = () => {
  const layers = useMemo(
    () =>
      HILL_LAYERS.map((layer) => ({
        ...layer,
        geometry: createHillGeometry(
          hillProfile(createRng(layer.seed), HILL_SEGMENTS, layer.base, layer.amplitude),
          layer.distance,
          layer.color,
        ),
      })),
    [],
  );
  return (
    <>
      {layers.map((layer) => (
        <mesh key={layer.seed} geometry={layer.geometry} frustumCulled={false}>
          <meshBasicMaterial vertexColors side={THREE.DoubleSide} fog={false} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
};

// A cartoon dusk: banded sky, low sun, stars, puffy clouds and rolling hills
export const Sky = () => {
  const dome = useMemo(() => createSkyTexture(), []);
  const sun = useMemo(() => createSunTexture(), []);

  return (
    <>
      <mesh renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[DOME_RADIUS, 48, 32]} />
        <meshBasicMaterial map={dome} side={THREE.BackSide} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
      <sprite position={scaled(skyDirection(SUN_AZIMUTH, SUN_ELEVATION), SUN_DISTANCE)} scale={[130, 130, 1]}>
        <spriteMaterial map={sun} depthWrite={false} fog={false} toneMapped={false} />
      </sprite>
      <Stars />
      <Clouds />
      <Hills />
    </>
  );
};
