import { useMemo, useRef, type ComponentType } from "react";
import * as THREE from "three";
import { FLOOR_POSITION_Y } from "../sim/config";
import { CANDY_PROPS, type CandyKind, type CandyProp } from "./candyLayout";
import { createStripeTexture, createSwirlTexture } from "./candyTextures";
import { groundHeight, surfaceNormal } from "./groundCurve";
import {
  DANCE_DURATION,
  JELLY_DURATION,
  SPIN_DURATION,
  danceMotion,
  jellyScale,
  spinAngle,
} from "../sim/propMotion";
import { createRng } from "../sim/rng";
import { useReaction } from "./useReaction";

// Where a prop stands: on the curved ground, tilted to follow the surface
const placeOnGround = (x: number, z: number) => {
  const [nx, ny, nz] = surfaceNormal(x, z);
  const tilt = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(nx, ny, nz),
  );
  return {
    position: [x, FLOOR_POSITION_Y + groundHeight(x, z), z] as [number, number, number],
    quaternion: tilt,
  };
};

// Props you can click show a pointing hand
const clickable = {
  onPointerOver: () => {
    document.body.style.cursor = "pointer";
  },
  onPointerOut: () => {
    document.body.style.cursor = "auto";
  },
};

// Hard glossy candy: a bright clear coat over a fairly smooth surface
const HARD_CANDY = { roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 };

// Click the head and the swirl spins a few turns, then slows to a stop
const Lollipop = ({ position: [x, z], size, color }: CandyProp) => {
  const swirl = useMemo(() => createSwirlTexture(color), [color]);
  const stripes = useMemo(() => createStripeTexture(color), [color]);
  const stickHeight = size * 3.2;
  const headRef = useRef<THREE.Group>(null);
  const turned = useRef(0); // Where the swirl is facing, so a second click carries on from there

  const reaction = useReaction(
    SPIN_DURATION,
    (elapsed) => {
      if (headRef.current) headRef.current.rotation.z = turned.current + spinAngle(elapsed);
    },
    () => {
      // A whole number of turns looks the same as none, so keep the angle small
      turned.current = (turned.current + spinAngle(SPIN_DURATION)) % (Math.PI * 2);
      if (headRef.current) headRef.current.rotation.z = turned.current;
    },
  );

  return (
    <group {...placeOnGround(x, z)}>
      <mesh position={[0, stickHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[size * 0.07, size * 0.07, stickHeight, 12]} />
        <meshPhysicalMaterial map={stripes} {...HARD_CANDY} />
      </mesh>
      <group
        ref={headRef}
        position={[0, stickHeight + size * 0.6, 0]}
        onClick={(event) => {
          event.stopPropagation();
          const elapsed = reaction.elapsed();
          if (elapsed !== null) turned.current += spinAngle(elapsed); // Carry on, don't jump back
          reaction.trigger();
        }}
        {...clickable}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[size, size, size * 0.22, 40]} />
          <meshPhysicalMaterial attach="material-0" color="#ffffff" {...HARD_CANDY} />
          <meshPhysicalMaterial attach="material-1" map={swirl} {...HARD_CANDY} />
          <meshPhysicalMaterial attach="material-2" color="#ffffff" {...HARD_CANDY} />
        </mesh>
      </group>
    </group>
  );
};

// Half of the sphere sinks into the floor, leaving a dome. Jelly-like: glossy, with a
// faint glow of its own colour from inside. Click it and it giggles like jelly.
const GUMDROP_HEIGHT = 0.85; // How squat the dome is

const Gumdrop = ({ position: [x, z], size, color }: CandyProp) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const reaction = useReaction(JELLY_DURATION, (elapsed) => {
    const { y, xz } = jellyScale(elapsed);
    meshRef.current?.scale.set(xz, GUMDROP_HEIGHT * y, xz);
  });

  return (
    <mesh
      ref={meshRef}
      {...placeOnGround(x, z)}
      scale={[1, GUMDROP_HEIGHT, 1]}
      castShadow
      onClick={(event) => {
        event.stopPropagation();
        reaction.trigger();
      }}
      {...clickable}
    >
      <sphereGeometry args={[size, 32, 24]} />
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.12}
        roughness={0.2}
        clearcoat={1}
        clearcoatRoughness={0.06}
      />
    </mesh>
  );
};

const GLOSSY_ICING = { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06 };

// A paper case, swirls of icing and a cherry on top
const Cupcake = ({ position: [x, z], size, color }: CandyProp) => {
  const caseHeight = size * 0.9;
  return (
    <group {...placeOnGround(x, z)}>
      <mesh position={[0, caseHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[size * 0.85, size * 0.62, caseHeight, 24]} />
        <meshStandardMaterial color="#f6dcb0" roughness={0.75} />
      </mesh>
      {[
        [0.9, 0.55, 0.12],
        [0.68, 0.5, 0.52],
        [0.45, 0.45, 0.86],
      ].map(([radius, squash, lift]) => (
        <mesh
          key={lift}
          position={[0, caseHeight + size * lift * 0.9, 0]}
          scale={[1, squash, 1]}
          castShadow
        >
          <sphereGeometry args={[size * radius, 28, 20]} />
          <meshPhysicalMaterial color={color} {...GLOSSY_ICING} />
        </mesh>
      ))}
      <mesh position={[0, caseHeight + size * 1.28, 0]} castShadow>
        <sphereGeometry args={[size * 0.18, 16, 12]} />
        <meshPhysicalMaterial color="#e0102f" {...GLOSSY_ICING} />
      </mesh>
    </group>
  );
};

// A ring of dough with a cap of glossy icing and sprinkles, lying on the grass
const SPRINKLE_COLORS = ["#ffffff", "#ffe14d", "#4dc3ff", "#7dff9a", "#ff4d6d"];

const Donut = ({ position: [x, z], size, color }: CandyProp) => {
  const tube = size * 0.45;
  const sprinkles = useMemo(() => {
    const rng = createRng(Math.round(x * 100 + z * 10));
    return Array.from({ length: 16 }, () => ({
      angle: rng() * Math.PI * 2,
      across: (rng() - 0.5) * 0.7, // How far round the tube, so they stay on the icing
      turn: rng() * Math.PI,
      color: SPRINKLE_COLORS[Math.floor(rng() * SPRINKLE_COLORS.length)],
    }));
  }, [x, z]);
  return (
    <group {...placeOnGround(x, z)}>
      <group position={[0, tube * 0.85, 0]} rotation={[0.18, 0, 0.1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[size, tube, 20, 48]} />
          <meshStandardMaterial color="#e8b27a" roughness={0.65} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, tube * 0.28, 0]} scale={[1, 1, 0.6]}>
          <torusGeometry args={[size, tube * 1.02, 20, 48]} />
          <meshPhysicalMaterial color={color} {...GLOSSY_ICING} />
        </mesh>
        {sprinkles.map((sprinkle, i) => (
          <mesh
            key={i}
            position={[
              Math.cos(sprinkle.angle) * (size + sprinkle.across * tube),
              tube * 0.9,
              Math.sin(sprinkle.angle) * (size + sprinkle.across * tube),
            ]}
            rotation={[Math.PI / 2, 0, sprinkle.turn]}
          >
            <capsuleGeometry args={[size * 0.025, size * 0.12, 4, 8]} />
            <meshStandardMaterial color={sprinkle.color} roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// A striped cane with a hooked top: a tube along a straight stem and a half circle
const caneCurve = (height: number, hookRadius: number) => {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 8; i++) points.push(new THREE.Vector3(0, (height * i) / 8, 0));
  for (let i = 1; i <= 12; i++) {
    const angle = (i / 12) * Math.PI;
    points.push(
      new THREE.Vector3(hookRadius - hookRadius * Math.cos(angle), height + hookRadius * Math.sin(angle), 0),
    );
  }
  return new THREE.CatmullRomCurve3(points);
};

// Click the cane and it does a wiggle dance: swaying, twisting and little hops
const CANE_TURN = 0.5; // How the cane faces, so the hook points at an angle

const CandyCane = ({ position: [x, z], size, color }: CandyProp) => {
  const stripes = useMemo(() => createStripeTexture(color, 12, false), [color]);
  const geometry = useMemo(
    () => new THREE.TubeGeometry(caneCurve(size * 2.2, size * 0.5), 60, size * 0.14, 14, false),
    [size],
  );
  const danceRef = useRef<THREE.Group>(null);
  const reaction = useReaction(DANCE_DURATION, (elapsed) => {
    const dance = danceMotion(elapsed);
    if (!danceRef.current) return;
    danceRef.current.rotation.set(0, CANE_TURN + dance.twist, dance.tilt);
    danceRef.current.position.y = dance.hop * size;
  });

  return (
    <group {...placeOnGround(x, z)}>
      <group ref={danceRef} rotation-y={CANE_TURN}>
        <mesh
          geometry={geometry}
          castShadow
          onClick={(event) => {
            event.stopPropagation();
            reaction.trigger();
          }}
          {...clickable}
        >
          <meshPhysicalMaterial map={stripes} {...HARD_CANDY} />
        </mesh>
      </group>
    </group>
  );
};

// Two satin shells with a layer of cream between them
const Macaron = ({ position: [x, z], size, color }: CandyProp) => (
  <group {...placeOnGround(x, z)} rotation={[0.12, 0, 0]}>
    {[0.2, 0.8].map((height) => (
      <mesh key={height} position={[0, size * height, 0]} scale={[1, 0.42, 1]} castShadow>
        <sphereGeometry args={[size, 28, 20]} />
        <meshPhysicalMaterial color={color} roughness={0.45} sheen={0.8} sheenColor="#ffffff" />
      </mesh>
    ))}
    <mesh position={[0, size * 0.5, 0]}>
      <cylinderGeometry args={[size * 0.92, size * 0.92, size * 0.26, 28]} />
      <meshStandardMaterial color="#fff6e8" roughness={0.55} />
    </mesh>
  </group>
);

const PROP_COMPONENTS: Record<CandyKind, ComponentType<CandyProp>> = {
  lollipop: Lollipop,
  gumdrop: Gumdrop,
  cupcake: Cupcake,
  donut: Donut,
  candyCane: CandyCane,
  macaron: Macaron,
};

export const CandyProps = () => (
  <>
    {CANDY_PROPS.map((prop) => {
      const Prop = PROP_COMPONENTS[prop.kind];
      return <Prop key={prop.position.join()} {...prop} />;
    })}
  </>
);
