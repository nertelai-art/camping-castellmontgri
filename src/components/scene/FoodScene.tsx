"use client";

// Gastronomia: una paella que s'omple, un gelat que es fon i una copa que es serveix.
// Tot modelat per codi (torns, esferes, caixes) i guiat pel scroll (skill scroll-3d-scenes).

import { Environment, Lightformer, PerformanceMonitor, Preload } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  CanvasTexture,
  Color,
  MathUtils,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import { easeInOutCubic, easeOutBounce, easeOutCubic, FOOD_PHASES, range, type Range } from "./phases";
import { seededRandom } from "./random";

export type FoodSceneProps = { progress: RefObject<number>; reducedMotion: boolean };

const SMOOTHING = 5;
const MAX_DELTA = 1 / 30;
const FOV = 30;
const FIT_WIDTH = 3.4;
const SPACING = 4.2; // separació del carrusel

const dummy = new Object3D();
const tmpColor = new Color();

/** Entrada per la dreta, sortida per l'esquerra, dins la fase de cada objecte. */
function carousel([a, b]: Range, p: number, first: boolean, last: boolean) {
  const enter = first ? 1 : easeOutCubic(range(p, [a, a + 0.14]));
  const exit = last ? 0 : easeInOutCubic(range(p, [b - 0.1, b]));
  return { x: (1 - enter) * SPACING - exit * SPACING, spin: (1 - enter) * 1.2 - exit * 0.8, local: range(p, [a, b]) };
}

function useBlobShadow() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(60,30,15,0.45)");
    g.addColorStop(1, "rgba(60,30,15,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new CanvasTexture(canvas);
  }, []);
}

/** Textura de neula (galeta del con) dibuixada una sola vegada. */
function useWaffleTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#d8a15a";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "#a8682c";
    ctx.lineWidth = 10;
    for (let i = -256; i < 512; i += 48) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 256, 256);
      ctx.moveTo(i + 256, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
    }
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(3, 2);
    return t;
  }, []);
}

// ─── Paella ─────────────────────────────────────────────────────────────────
const PAN_PROFILE = [
  new Vector2(0, 0),
  new Vector2(1.18, 0),
  new Vector2(1.24, 0.04),
  new Vector2(1.3, 0.16),
  new Vector2(1.34, 0.17),
  new Vector2(1.28, 0.03),
  new Vector2(1.2, -0.02),
  new Vector2(0, -0.02),
];

type InstRef = RefObject<InstancedMesh | null>;
type PaellaProps = {
  groupRef: RefObject<Group | null>;
  riceRef: RefObject<Mesh | null>;
  prawnsRef: InstRef;
  musselsRef: InstRef;
  peasRef: InstRef;
  lemonsRef: InstRef;
};

function Paella({ groupRef, riceRef, prawnsRef, musselsRef, peasRef, lemonsRef }: PaellaProps) {
  return (
    <group ref={groupRef}>
      <mesh>
        <latheGeometry args={[PAN_PROFILE, 72]} />
        <meshStandardMaterial color="#2f2c29" metalness={0.6} roughness={0.45} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.42, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.13, 0.03, 10, 24]} />
          <meshStandardMaterial color="#2f2c29" metalness={0.6} roughness={0.45} />
        </mesh>
      ))}
      <mesh ref={riceRef} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.1, 64]} />
        <meshStandardMaterial color="#e6a93a" roughness={0.85} />
      </mesh>
      <instancedMesh ref={prawnsRef} args={[undefined, undefined, 8]} frustumCulled={false}>
        <torusGeometry args={[0.13, 0.045, 10, 20, Math.PI * 1.3]} />
        <meshStandardMaterial color="#ec6f4c" roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={musselsRef} args={[undefined, undefined, 8]} frustumCulled={false}>
        <sphereGeometry args={[0.14, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1e2433" roughness={0.3} metalness={0.2} />
      </instancedMesh>
      <instancedMesh ref={peasRef} args={[undefined, undefined, 24]} frustumCulled={false}>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshStandardMaterial color="#6fa53a" roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={lemonsRef} args={[undefined, undefined, 2]} frustumCulled={false}>
        <cylinderGeometry args={[0.2, 0.2, 0.05, 20, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#f5d547" roughness={0.5} />
      </instancedMesh>
    </group>
  );
}

// ─── Gelat ──────────────────────────────────────────────────────────────────
const SCOOP_COLORS = ["#f2a6b8", "#bcd88e", "#f6e6c0"];

// ─── Copa ───────────────────────────────────────────────────────────────────
const GLASS_PROFILE = [
  new Vector2(0, 0),
  new Vector2(0.42, 0),
  new Vector2(0.44, 0.03),
  new Vector2(0.5, 1.35),
  new Vector2(0.47, 1.35),
  new Vector2(0.41, 0.06),
  new Vector2(0, 0.06),
];

function Choreography({ progress, reducedMotion }: FoodSceneProps) {
  const smooth = useRef(reducedMotion ? 1 : (progress.current ?? 0));
  const { invalidate, viewport, camera } = useThree();
  const shadowTexture = useBlobShadow();
  const waffle = useWaffleTexture();

  const paella = useRef<Group>(null);
  const rice = useRef<Mesh>(null);
  const prawns = useRef<InstancedMesh>(null);
  const mussels = useRef<InstancedMesh>(null);
  const peas = useRef<InstancedMesh>(null);
  const lemons = useRef<InstancedMesh>(null);
  const icecream = useRef<Group>(null);
  const scoops = useRef<InstancedMesh>(null);
  const drips = useRef<InstancedMesh>(null);
  const drink = useRef<Group>(null);
  const liquid = useRef<Mesh>(null);
  const ice = useRef<InstancedMesh>(null);
  const garnish = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);

  // Posicions finals i retards amb atzar amb llavor: idèntic a cada visita.
  const layout = useMemo(() => {
    const random = seededRandom(1714);
    const ring = (n: number, r: number, jitter: number) =>
      Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + random() * jitter;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, rot: random() * Math.PI * 2, delay: random() * 0.5 };
      });
    return {
      prawns: ring(8, 0.72, 0.3),
      mussels: ring(8, 0.42, 0.4).map((m, i) => ({ ...m, x: m.x * (i % 2 ? 1.9 : 1), z: m.z * (i % 2 ? 1.9 : 1) })),
      peas: Array.from({ length: 24 }, () => {
        const a = random() * Math.PI * 2;
        const r = 0.2 + random() * 0.85;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, rot: 0, delay: 0.2 + random() * 0.5 };
      }),
      lemons: [
        { x: 0.25, z: -0.15, rot: 0.6, delay: 0.75 },
        { x: -0.3, z: 0.2, rot: 2.4, delay: 0.8 },
      ],
      drips: Array.from({ length: 9 }, (_, i) => ({ scoop: i % 3, angle: (i / 9) * Math.PI * 2 + random() * 0.5, len: 0.5 + random() * 0.7 })),
      cubes: Array.from({ length: 3 }, (_, i) => ({ x: (random() - 0.5) * 0.3, z: (random() - 0.5) * 0.3, rot: random() * 3, delay: i * 0.18 })),
    };
  }, []);

  useEffect(() => {
    const mesh = scoops.current;
    if (!mesh) return;
    SCOOP_COLORS.forEach((c, i) => mesh.setColorAt(i, tmpColor.set(c)));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    const d = drips.current;
    if (!d) return;
    layout.drips.forEach((drip, i) => d.setColorAt(i, tmpColor.set(SCOOP_COLORS[drip.scoop]!)));
    if (d.instanceColor) d.instanceColor.needsUpdate = true;
  }, [layout]);

  useEffect(() => {
    const onScroll = () => invalidate();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [invalidate]);

  /** Peces que cauen i reboten dins un recipient, esglaonades. */
  const drop = (
    mesh: InstancedMesh | null,
    items: { x: number; z: number; rot: number; delay: number }[],
    t: number,
    y: number,
    tiltX = 0,
  ) => {
    if (!mesh) return;
    items.forEach((it, i) => {
      const k = MathUtils.clamp((t - it.delay * 0.6) / 0.4, 0, 1);
      const fall = 1 - easeOutBounce(k);
      dummy.position.set(it.x, y + fall * 2.2, it.z);
      dummy.rotation.set(tiltX, it.rot + fall * 2, 0);
      dummy.scale.setScalar(k <= 0 ? 0 : 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };

  useFrame((state, rawDelta) => {
    const target = reducedMotion ? 1 : (progress.current ?? 0);
    smooth.current = MathUtils.damp(smooth.current, target, SMOOTHING, Math.min(rawDelta, MAX_DELTA));
    if (Math.abs(smooth.current - target) < 0.0005) smooth.current = target;
    else invalidate();
    const p = smooth.current;

    // Càmera que fa cabre l'objecte a qualsevol amplada, amb una òrbita suau.
    const radius = Math.max(7, FIT_WIDTH / 2 / (Math.tan(MathUtils.degToRad(FOV / 2)) * Math.min(viewport.aspect, 1.2)));
    const az = MathUtils.lerp(0.35, -0.35, p);
    state.camera.position.set(Math.sin(az) * radius, radius * 0.48, Math.cos(az) * radius);
    camera.lookAt(0, 0.85, 0); // prou amunt perquè hi càpiguen les tres boles de gelat

    // Paella: l'arròs puja i hi cauen els ingredients.
    const pa = carousel(FOOD_PHASES.paella, p, true, false);
    if (paella.current) {
      paella.current.position.x = pa.x;
      paella.current.rotation.y = pa.spin + p * 0.6;
    }
    const fill = easeOutCubic(range(pa.local, [0.05, 0.35]));
    if (rice.current) rice.current.scale.set(1, Math.max(0.01, fill), 1);
    const toppings = range(pa.local, [0.2, 0.85]);
    drop(prawns.current, layout.prawns, toppings, 0.13, Math.PI / 2);
    drop(mussels.current, layout.mussels, toppings, 0.08);
    drop(peas.current, layout.peas, toppings, 0.1);
    drop(lemons.current, layout.lemons, toppings, 0.12);

    // Gelat: les boles cauen una sobre l'altra i després es fonen (s'aixafen i regalimen).
    const ic = carousel(FOOD_PHASES.icecream, p, false, false);
    if (icecream.current) {
      icecream.current.position.x = ic.x;
      icecream.current.rotation.y = ic.spin + p * 0.5;
    }
    // Tot passa mentre el gelat és al centre (abans que surti per l'esquerra).
    const stack = range(ic.local, [0.12, 0.45]);
    const melt = easeInOutCubic(range(ic.local, [0.45, 0.72]));
    if (scoops.current) {
      SCOOP_COLORS.forEach((_, i) => {
        const k = MathUtils.clamp((stack - i * 0.28) / 0.45, 0, 1);
        const fall = 1 - easeOutBounce(k);
        const squash = 1 - melt * 0.16;
        dummy.position.set(0, 1.12 + i * 0.5 * squash + fall * 2.5, 0);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1 + melt * 0.08, squash, 1 + melt * 0.08);
        if (k <= 0) dummy.scale.setScalar(0);
        dummy.updateMatrix();
        scoops.current!.setMatrixAt(i, dummy.matrix);
      });
      scoops.current.instanceMatrix.needsUpdate = true;
    }
    if (drips.current) {
      layout.drips.forEach((d, i) => {
        const len = melt * d.len;
        dummy.position.set(Math.cos(d.angle) * 0.36, 1.12 + d.scoop * 0.46 - len * 0.25, Math.sin(d.angle) * 0.36);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, Math.max(0.001, len), 1);
        if (len < 0.02) dummy.scale.setScalar(0);
        dummy.updateMatrix();
        drips.current!.setMatrixAt(i, dummy.matrix);
      });
      drips.current.instanceMatrix.needsUpdate = true;
    }

    // Copa: el refresc omple el got, hi cauen glaçons i al final hi arriben la palla i la llimona.
    const dr = carousel(FOOD_PHASES.drink, p, false, true);
    if (drink.current) {
      drink.current.position.x = dr.x;
      drink.current.rotation.y = dr.spin + p * 0.4;
    }
    const pour = easeInOutCubic(range(dr.local, [0.12, 0.6]));
    if (liquid.current) {
      liquid.current.scale.set(1, Math.max(0.001, pour), 1);
      liquid.current.position.y = 0.07 + (1.1 * pour) / 2;
    }
    drop(ice.current, layout.cubes, range(dr.local, [0.35, 0.8]), 0.25 + pour * 0.8);
    if (garnish.current) {
      const g = easeOutCubic(range(dr.local, [0.7, 0.95]));
      garnish.current.position.y = (1 - g) * 1.6;
      garnish.current.scale.setScalar(Math.max(0.001, g));
    }

    // L'ombra segueix l'objecte que hi ha al centre.
    if (shadow.current) {
      const centered = Math.min(Math.abs(pa.x), Math.abs(ic.x), Math.abs(dr.x));
      (shadow.current.material as MeshBasicMaterial).opacity = MathUtils.clamp(1 - centered / 2, 0, 1) * 0.9;
    }
  });

  return (
    <>
      <Paella groupRef={paella} riceRef={rice} prawnsRef={prawns} musselsRef={mussels} peasRef={peas} lemonsRef={lemons} />

      <group ref={icecream} position={[SPACING, 0, 0]}>
        {/* Con de galeta, amb la punta avall */}
        <mesh position={[0, 0.62, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.46, 1.25, 40, 1, true]} />
          <meshStandardMaterial map={waffle} roughness={0.8} side={2} />
        </mesh>
        <instancedMesh ref={scoops} args={[undefined, undefined, 3]} frustumCulled={false}>
          <sphereGeometry args={[0.44, 36, 24]} />
          <meshStandardMaterial roughness={0.55} />
        </instancedMesh>
        <instancedMesh ref={drips} args={[undefined, undefined, 9]} frustumCulled={false}>
          <capsuleGeometry args={[0.055, 0.5, 6, 10]} />
          <meshStandardMaterial roughness={0.45} />
        </instancedMesh>
      </group>

      <group ref={drink} position={[SPACING * 2, 0, 0]}>
        <mesh>
          <latheGeometry args={[GLASS_PROFILE, 64]} />
          {/* Vidre transparent (sense transmission: sobre un canvas transparent no té res a refractar i sortia blanc) */}
          <meshPhysicalMaterial transparent opacity={0.28} roughness={0.05} metalness={0} clearcoat={1} clearcoatRoughness={0.05} color="#eef6f8" depthWrite={false} />
        </mesh>
        <mesh ref={liquid} position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.45, 0.4, 1.1, 48]} />
          <meshStandardMaterial color="#f28c28" roughness={0.2} transparent opacity={0.88} />
        </mesh>
        <instancedMesh ref={ice} args={[undefined, undefined, 3]} frustumCulled={false}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshPhysicalMaterial transparent opacity={0.7} roughness={0.15} clearcoat={1} color="#e8f6fb" />
        </instancedMesh>
        <group ref={garnish}>
          <mesh position={[0.43, 1.33, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.04, 28]} />
            <meshStandardMaterial color="#f5d547" roughness={0.5} />
          </mesh>
          <mesh position={[-0.12, 1.25, 0.05]} rotation={[0.2, 0, 0.22]}>
            <cylinderGeometry args={[0.035, 0.035, 1.5, 12]} />
            <meshStandardMaterial color="#ba380c" roughness={0.4} />
          </mesh>
        </group>
      </group>

      <mesh ref={shadow} rotation-x={-Math.PI / 2} position={[0, -0.03, 0]} scale={[3.4, 3.4, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} opacity={0} />
      </mesh>
    </>
  );
}

export default function FoodScene(props: FoodSceneProps) {
  const [dpr, setDpr] = useState(1.5);
  return (
    <Canvas
      frameloop="demand"
      dpr={dpr}
      camera={{ position: [0, 3, 8], fov: FOV }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 150 } }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} flipflops={3} onFallback={() => setDpr(1)} />
      <hemisphereLight args={["#fff6ea", "#c9a88a", 1.1]} />
      <directionalLight position={[4, 8, 5]} intensity={2} />
      {/* Il·luminació sense xarxa: res de preset (baixaria un HDR d'un CDN) */}
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={2} position={[0, 6, 4]} scale={[10, 5, 1]} rotation-x={-Math.PI / 3} />
        <Lightformer intensity={1.2} position={[-6, 2, 1]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>
      <Choreography {...props} />
      <Preload all />
    </Canvas>
  );
}
