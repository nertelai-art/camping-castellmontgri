"use client";

// Hero: el plànol il·lustrat com una targeta dreta que s'ajeu i esdevé el terra; la càmera hi vola
// per damunt i s'hi aixequen els punts clau. Escena guiada pel scroll (skill scroll-3d-scenes).

import { PerformanceMonitor, Preload } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  CanvasTexture,
  Color,
  MathUtils,
  Object3D,
  SRGBColorSpace,
  Texture,
  Vector3,
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import { easeInOutCubic, easeOutBounce, easeOutCubic, HERO_PHASES, range } from "./phases";
import { seededRandom } from "./random";

export type HeroPin = { x: number; y: number; color: string };
export type HeroSceneProps = {
  progress: RefObject<number>;
  reducedMotion: boolean;
  textureSrc: string;
  pins: HeroPin[];
  /** Es crida quan la il·lustració ja és a la textura: llavors la foto del hero pot marxar. */
  onReady?: () => void;
};

const W = 6; // amplada del plànol en unitats
const H = (W * 1845) / 3000;
const DEPTH = 0.05;
const SMOOTHING = 4.5;
const MAX_DELTA = 1 / 30;
const FOV = 35;
const PAPER = "#f3ead0";

// Temporals reutilitzats: zero objectes nous per fotograma.
const dummy = new Object3D();
const camPos = new Vector3();
const lookAt = new Vector3();
const startPos = new Vector3();
const topPos = new Vector3();
const flyPos = new Vector3();
const startLook = new Vector3(0, H / 2, 0);
const endLook = new Vector3();
const ORIGIN = new Vector3(0, 0, 0);

/** Punt del plànol (en %) → coordenades del terra un cop estirat. */
const toGround = (xPct: number, yPct: number) => [(xPct / 100 - 0.5) * W, (yPct / 100 - 0.5) * H] as const;

/** Textura estable des del primer fotograma: s'omple quan arriba la imatge (sense recompilar el shader). */
function usePlanTexture(src: string, onReady?: () => void) {
  const { gl, invalidate } = useThree();
  const texture = useMemo(() => {
    const t = new Texture();
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = gl.capabilities.getMaxAnisotropy();
    return t;
  }, [gl]);
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      texture.image = img;
      texture.needsUpdate = true;
      invalidate();
      onReady?.();
    };
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src, texture, invalidate, onReady]);
  return texture;
}

/** Ombra difusa pintada una sola vegada (substitueix ContactShadows). */
function useBlobShadow() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(20,26,10,0.55)");
    g.addColorStop(1, "rgba(20,26,10,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new CanvasTexture(canvas);
  }, []);
}

/** Prat al voltant del plànol: verd de les vores de la il·lustració al centre, oliva fosc a la llunyania. */
function useGroundTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
    g.addColorStop(0, "#7f9a3c");
    g.addColorStop(0.18, "#71893a");
    g.addColorStop(0.55, "#4c5a28");
    g.addColorStop(1, "#2f3719");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
}

function Choreography({ progress, reducedMotion, textureSrc, pins, onReady }: HeroSceneProps) {
  const pivot = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const ground = useRef<Mesh>(null);
  const heads = useRef<InstancedMesh>(null);
  const stems = useRef<InstancedMesh>(null);
  const smooth = useRef(reducedMotion ? 1 : (progress.current ?? 0));
  const { invalidate, viewport, camera } = useThree();
  const texture = usePlanTexture(textureSrc, onReady);
  const shadowTexture = useBlobShadow();
  const groundTexture = useGroundTexture();

  // Punts: posició al terra i retard de caiguda amb atzar amb llavor (idèntic a cada visita).
  const drops = useMemo(() => {
    const random = seededRandom(2026);
    return pins.map((p) => {
      const [x, z] = toGround(p.x, p.y);
      return { x, z, delay: random() * 0.55, color: new Color(p.color) };
    });
  }, [pins]);

  useEffect(() => {
    const mesh = heads.current;
    if (!mesh) return;
    drops.forEach((d, i) => mesh.setColorAt(i, d.color));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [drops]);

  // Pintem només quan hi ha scroll (frameloop="demand").
  useEffect(() => {
    const onScroll = () => invalidate();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [invalidate]);

  useFrame((_, rawDelta) => {
    const target = reducedMotion ? 1 : (progress.current ?? 0);
    smooth.current = MathUtils.damp(smooth.current, target, SMOOTHING, Math.min(rawDelta, MAX_DELTA));
    if (Math.abs(smooth.current - target) < 0.0005) smooth.current = target;
    else invalidate();
    const p = smooth.current;

    // Distància que fa cabre el plànol sencer, calculada per l'amplada visible (mòbil inclòs).
    const aspect = viewport.aspect;
    const radius = (W * 1.08) / 2 / (Math.tan(MathUtils.degToRad(FOV / 2)) * Math.min(aspect, 1.4));

    // 1) La targeta puja des de baix i s'ajeu cap enrere (gira sobre la vora inferior).
    const rise = easeOutCubic(range(p, [0, 0.18]));
    const unfold = easeInOutCubic(range(p, HERO_PHASES.unfold));
    if (pivot.current) {
      pivot.current.position.set(0, MathUtils.lerp(-H * 1.4, 0, rise), (H / 2) * unfold);
      pivot.current.rotation.x = (-Math.PI / 2) * unfold;
    }
    if (shadow.current) (shadow.current.material as MeshBasicMaterial).opacity = rise * (1 - unfold) * 0.9;
    // El prat que envolta el plànol apareix quan la targeta s'ajeu: així el paisatge no s'acaba a la vora.
    if (ground.current) (ground.current.material as MeshBasicMaterial).opacity = unfold;

    // 2) Càmera: de davant la targeta, a dalt del plànol estirat, i després en vol rasant cap al centre.
    const fly = easeInOutCubic(range(p, HERO_PHASES.fly));
    startPos.set(0, H / 2, radius);
    topPos.set(0, radius * 0.92, radius * 0.42);
    const [fx, fz] = toGround(52, 62); // entre les zones Panorama i Ombra
    const az = MathUtils.lerp(0.35, -0.2, fly);
    // En vertical (mòbil) la càmera baixa més i s'acosta: si no, el plànol només ocupa una franja.
    const portrait = aspect < 1;
    const r2 = radius * (portrait ? 0.34 : 0.5);
    flyPos.set(fx + Math.sin(az) * r2, r2 * (portrait ? 0.85 : 0.62), fz + Math.cos(az) * r2);
    camPos.lerpVectors(startPos, topPos, unfold).lerp(flyPos, fly);
    endLook.set(fx, 0, fz - 0.2);
    lookAt.lerpVectors(startLook, ORIGIN, unfold).lerp(endLook, fly);
    camera.position.copy(camPos);
    camera.lookAt(lookAt);

    // 3) Els punts cauen del cel i reboten, esglaonats.
    const drop = range(p, HERO_PHASES.pins);
    const head = heads.current;
    const stem = stems.current;
    if (head && stem) {
      drops.forEach((d, i) => {
        const t = MathUtils.clamp((drop - d.delay) / 0.4, 0, 1);
        const s = t <= 0 ? 0 : 1;
        const fall = 1 - easeOutBounce(t);
        const y = fall * 2.5;
        dummy.position.set(d.x, 0.15 + y, d.z);
        dummy.scale.setScalar(s);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        head.setMatrixAt(i, dummy.matrix);
        dummy.position.set(d.x, 0.055 + y, d.z);
        dummy.rotation.set(Math.PI, 0, 0);
        dummy.updateMatrix();
        stem.setMatrixAt(i, dummy.matrix);
      });
      head.instanceMatrix.needsUpdate = true;
      stem.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <group ref={pivot}>
        {/* La targeta: gruix de paper i la il·lustració a la cara del davant (+z). */}
        <mesh position={[0, H / 2, 0]}>
          <boxGeometry args={[W, H, DEPTH]} />
          <meshStandardMaterial attach="material-0" color={PAPER} roughness={0.95} />
          <meshStandardMaterial attach="material-1" color={PAPER} roughness={0.95} />
          <meshStandardMaterial attach="material-2" color={PAPER} roughness={0.95} />
          <meshStandardMaterial attach="material-3" color={PAPER} roughness={0.95} />
          <meshStandardMaterial attach="material-4" map={texture} roughness={0.9} />
          <meshStandardMaterial attach="material-5" color="#d9cfae" roughness={0.95} />
        </mesh>
      </group>
      <mesh ref={ground} rotation-x={-Math.PI / 2} position={[0, -DEPTH, 0]} scale={[60, 60, 1]} renderOrder={-1}>
        <planeGeometry />
        <meshBasicMaterial map={groundTexture} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={shadow} rotation-x={-Math.PI / 2} position={[0, -0.001, 0.2]} scale={[W * 1.2, 1.4, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} opacity={0} />
      </mesh>
      {/* Un sol draw call per als caps i un per a les tiges */}
      <instancedMesh ref={heads} args={[undefined, undefined, drops.length]} frustumCulled={false}>
        <sphereGeometry args={[0.055, 20, 16]} />
        <meshStandardMaterial roughness={0.45} />
      </instancedMesh>
      <instancedMesh ref={stems} args={[undefined, undefined, drops.length]} frustumCulled={false}>
        <coneGeometry args={[0.034, 0.11, 12]} />
        <meshStandardMaterial color="#f7f0d3" roughness={0.6} />
      </instancedMesh>
    </>
  );
}

export default function HeroScene(props: HeroSceneProps) {
  const [dpr, setDpr] = useState(1.5);
  return (
    <Canvas
      frameloop="demand"
      dpr={dpr}
      camera={{ position: [0, 2, 8], fov: FOV, near: 0.05, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 150 } }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} flipflops={3} onFallback={() => setDpr(1)} />
      <hemisphereLight args={["#fff8e6", "#556b2f", 1.6]} />
      <directionalLight position={[3, 6, 4]} intensity={1.4} />
      <Choreography {...props} />
      <Preload all />
    </Canvas>
  );
}
