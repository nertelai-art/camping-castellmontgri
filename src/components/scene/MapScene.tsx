"use client";

// El mapa del càmping en 3D: cada arbre i cada casa de la il·lustració, aixecats sobre el terra net.
// Les posicions surten de `pnpm map:build` (map-scene.data.json). Tot modelat per codi i amb instàncies.

import { MapControls, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import { Suspense, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode, type Ref, type RefObject } from "react";
import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  MathUtils,
  Object3D,
  Spherical,
  SRGBColorSpace,
  Vector3,
  type InstancedMesh,
  type Texture,
} from "three";
import { MapMarker } from "@/components/site/map-marker";
import type { MapPoint } from "@/lib/supabase/content";
import data from "./map-scene.data.json";
import { seededRandom } from "./random";

export type MapViewerHandle = {
  focus: (point: { x: number; y: number }) => void;
  zoomBy: (factor: number) => void;
  rotateBy: (radians: number) => void;
  reset: () => void;
};

export type MapSceneProps = {
  points: MapPoint[];
  selectedId: string | null;
  onSelect: (point: MapPoint) => void;
  /** Quan passa a `true`, la maqueta creix i la càmera s'inclina. */
  started: boolean;
  reducedMotion: boolean;
  /** El visor rep el ratolí o el dit. A mòbil només després de «Toca per explorar»: si no, segrestaria el scroll. */
  interactive: boolean;
  /** La roda i el pessic amplien (pantalla completa o mòbil actiu). Si no, Ctrl + roda des de fora. */
  zoomEnabled: boolean;
  handle: Ref<MapViewerHandle>;
  onReady: () => void;
};

// El món fa 100 unitats d'ample, com els % de `map_points`.
const WIDTH = 100;
const DEPTH = WIDTH / data.aspect;
const world = (x: number, y: number) => [x - 50, ((y - 50) / 100) * DEPTH] as const;

const MAX_DELTA = 1 / 30;
const FOV = 32;
const TAN = Math.tan(MathUtils.degToRad(FOV / 2));
const HOME = { phi: 0.92, theta: -0.3 };
const MIN_DISTANCE = 14;
const MARKER_HEIGHT = 1.5;
const GROW_SECONDS = 2.2;
const SPREAD = 1.6; // quant s'esglaona el creixement del centre cap enfora

/** Distància des d'on es veu tot el mapa amb la inclinació `phi`. */
const fitDistance = (aspect: number, phi: number) => Math.max((WIDTH / 2 + 4) / (TAN * aspect), ((DEPTH / 2) * Math.max(0.55, Math.cos(phi)) + 6) / TAN);

const easeOutBack = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

type Goal = { target: Vector3; radius: number; phi: number; theta: number };
type Controls = ComponentRef<typeof MapControls> | null;

/**
 * Càmera: vol suau cap a un objectiu (centrar un punt, ampliar, girar) i límits perquè no surti del mapa.
 * És una classe fora de React: tot el que fa és mutar la càmera i els controls de three.
 */
class CameraRig {
  goal: Goal | null = null;
  /** Creixement de la maqueta, de 0 (plana) a 1. */
  grow = 0;
  private offset = new Vector3();
  private spherical = new Spherical();

  private aspect = (state: RootState) => state.size.width / state.size.height;
  maxDistance = (aspect: number) => fitDistance(aspect, 0) * 1.1;
  /** Vista de sortida. En vertical (mòbil) el mapa sencer quedaria minúscul: s'hi entra més a prop. */
  home = (state: RootState): Goal => ({ target: new Vector3(0, 0, 5), radius: fitDistance(this.aspect(state), HOME.phi) * (this.aspect(state) < 1 ? 0.42 : 0.9), ...HOME });

  place(state: RootState, controls: Controls, g: Goal) {
    this.spherical.set(g.radius, g.phi, g.theta);
    state.camera.position.copy(g.target).add(this.offset.setFromSpherical(this.spherical));
    state.camera.lookAt(g.target);
    controls?.target.copy(g.target);
  }

  /** On és ara la càmera, en les mateixes coordenades que un objectiu. */
  current(state: RootState, controls: Controls): Goal {
    const target = controls?.target.clone() ?? new Vector3();
    this.spherical.setFromVector3(this.offset.copy(state.camera.position).sub(target));
    return { target, radius: this.spherical.radius, phi: this.spherical.phi, theta: this.spherical.theta };
  }

  /** L'objectiu parteix d'on és ara la càmera (o d'on ja anava) i en canvia només el que calgui. */
  flyTo(state: RootState, controls: Controls, change: (g: Goal, home: Goal) => void) {
    const g = this.goal ?? this.current(state, controls);
    change(g, this.home(state));
    g.radius = MathUtils.clamp(g.radius, MIN_DISTANCE, this.maxDistance(this.aspect(state)));
    this.goal = g;
    state.invalidate();
  }

  /** Vista inicial: zenital (com el plànol) si després ha de fer l'entrada; si no, ja inclinada. Les ombres només es calculen quan canvien. */
  init(state: RootState, controls: Controls, tilted: boolean) {
    if (tilted) this.grow = 1;
    state.gl.shadowMap.autoUpdate = false;
    state.gl.shadowMap.needsUpdate = true;
    this.place(state, controls, tilted ? this.home(state) : { target: new Vector3(), radius: fitDistance(this.aspect(state), 0), phi: 0.001, theta: 0 });
    state.invalidate();
  }

  cancel() {
    this.goal = null;
  }

  step(state: RootState, controls: Controls, delta: number, started: boolean, reducedMotion: boolean) {
    if (started && this.grow < 1) {
      this.grow = reducedMotion ? 1 : Math.min(1, this.grow + delta / GROW_SECONDS);
      state.gl.shadowMap.needsUpdate = true;
      state.invalidate();
    }
    const g = this.goal;
    if (!g) return;
    const now = this.current(state, controls);
    const lambda = reducedMotion ? 1e3 : 3.2;
    now.target.x = MathUtils.damp(now.target.x, g.target.x, lambda, delta);
    now.target.z = MathUtils.damp(now.target.z, g.target.z, lambda, delta);
    now.radius = MathUtils.damp(now.radius, g.radius, lambda, delta);
    now.phi = MathUtils.damp(now.phi, g.phi, lambda, delta);
    now.theta = MathUtils.damp(now.theta, g.theta, lambda, delta);
    const arrived =
      now.target.distanceTo(g.target) < 0.02 && Math.abs(now.radius - g.radius) < 0.02 && Math.abs(now.phi - g.phi) < 0.002 && Math.abs(now.theta - g.theta) < 0.002;
    this.place(state, controls, arrived ? g : now);
    if (arrived) this.goal = null;
    else state.invalidate();
  }

  /** Que el centre de la vista no surti del mapa. */
  clamp(state: RootState, controls: Controls) {
    if (!controls) return;
    const x = MathUtils.clamp(controls.target.x, -WIDTH / 2, WIDTH / 2);
    const z = MathUtils.clamp(controls.target.z, -DEPTH / 2, DEPTH / 2);
    state.camera.position.x += x - controls.target.x;
    state.camera.position.z += z - controls.target.z;
    state.camera.position.y -= controls.target.y;
    controls.target.set(x, 0, z);
  }
}

type Item = { x: number; y: number; z: number; sx: number; sy: number; sz: number; ry: number; delay: number; color: Color };

/** Malla instanciada que creix des de terra segons `grow` (0-1). Només recalcula matrius mentre creix. */
function Instances({ items, rig, children }: { items: Item[]; rig: CameraRig; children: ReactNode }) {
  const mesh = useRef<InstancedMesh>(null);
  const drawn = useRef(-1);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    items.forEach((item, i) => mesh.current!.setColorAt(i, item.color));
    mesh.current!.instanceColor!.needsUpdate = true;
    drawn.current = -1;
  }, [items]);

  useFrame(() => {
    const g = rig.grow;
    if (g === drawn.current) return;
    drawn.current = g;
    for (const [i, item] of items.entries()) {
      const k = g >= 1 ? 1 : easeOutBack(MathUtils.clamp(g * (1 + SPREAD) - item.delay * SPREAD, 0, 1));
      dummy.position.set(item.x, item.y * k, item.z);
      dummy.rotation.set(0, item.ry, 0);
      dummy.scale.set(item.sx * k, item.sy * k, item.sz * k);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    }
    mesh.current!.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, items.length]} castShadow frustumCulled={false}>
      {children}
    </instancedMesh>
  );
}

const TREE_GREENS = ["#4f7a2a", "#5d8a30", "#3f6b2a", "#6b9838", "#567f2c"];
const PINE_GREENS = ["#35602a", "#2f5626", "#3c6a2c"];
const ROOFS = ["#a3a199", "#55627a", "#c8682c", "#eadfc4"];
const WALLS = ["#f1ece0", "#e9e4d6", "#f6efe2"];

function buildItems() {
  const random = seededRandom(7);
  const pick = (list: string[]) => list[Math.floor(random() * list.length)]!;
  const delay = (x: number, z: number) => Math.min(1, Math.hypot(x / 50, z / (DEPTH / 2)) * 0.8 + random() * 0.2);
  const trunks: Item[] = [];
  const crowns: Item[] = [];
  const walls: Item[] = [];
  const roofs: Item[] = [];

  for (const [px, py, s, t] of data.trees as [number, number, number, number][]) {
    const [x, z] = world(px, py);
    const r = s * 0.21 * (0.85 + random() * 0.3);
    const h = r * (1.1 + random() * 0.5);
    const d = delay(x, z);
    trunks.push({ x, y: 0, z, sx: r, sy: h + r * 0.4, sz: r, ry: 0, delay: d, color: new Color("#6b4a2c") });
    crowns.push({
      x,
      y: h,
      z,
      sx: r,
      sy: r * (0.7 + random() * 0.25),
      sz: r,
      ry: random() * Math.PI,
      delay: d,
      color: new Color(pick(t === 1 ? PINE_GREENS : TREE_GREENS)).offsetHSL(0, 0, (random() - 0.5) * 0.06),
    });
  }

  for (const [px, py, s, t] of data.houses as [number, number, number, number][]) {
    const [x, z] = world(px, py);
    const side = (s / 3) * 1.45;
    const d = delay(x, z);
    const ry = (random() - 0.5) * 0.3;
    if (t === 3) {
      // Tenda: només el con, fins a terra.
      roofs.push({ x, y: 0, z, sx: side, sy: side * 1.5, sz: side, ry, delay: d, color: new Color(ROOFS[3]) });
      continue;
    }
    const height = side * 0.5;
    walls.push({ x, y: 0, z, sx: side, sy: height, sz: side * 0.8, ry, delay: d, color: new Color(WALLS[t]) });
    roofs.push({ x, y: height, z, sx: side, sy: side * 0.75, sz: side * 0.8, ry, delay: d, color: new Color(ROOFS[t]) });
  }
  return { trunks, crowns, walls, roofs };
}

function Model({ rig }: { rig: CameraRig }) {
  const items = useMemo(() => buildItems(), []);
  // Geometries amb la base a y = 0: en escalar, creixen des de terra.
  const geometry = useMemo(
    () => ({
      trunk: new CylinderGeometry(0.16, 0.22, 1, 5).translate(0, 0.5, 0),
      crown: new IcosahedronGeometry(1, 1).translate(0, 0.55, 0),
      wall: new BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
      roof: new ConeGeometry(0.76, 0.5, 4).rotateY(Math.PI / 4).translate(0, 0.25, 0),
    }),
    [],
  );
  useEffect(() => () => Object.values(geometry).forEach((g) => g.dispose()), [geometry]);

  return (
    <>
      <Instances items={items.trunks} rig={rig}>
        <primitive object={geometry.trunk} attach="geometry" />
        <meshLambertMaterial />
      </Instances>
      <Instances items={items.crowns} rig={rig}>
        <primitive object={geometry.crown} attach="geometry" />
        <meshLambertMaterial flatShading />
      </Instances>
      <Instances items={items.walls} rig={rig}>
        <primitive object={geometry.wall} attach="geometry" />
        <meshLambertMaterial />
      </Instances>
      <Instances items={items.roofs} rig={rig}>
        <primitive object={geometry.roof} attach="geometry" />
        <meshLambertMaterial flatShading />
      </Instances>
    </>
  );
}

function prepareGround(map: Texture, maxAnisotropy: number) {
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = Math.min(8, maxAnisotropy);
  map.needsUpdate = true;
}

/** El terra: la il·lustració neta sobre una llesca de terra, com una maqueta. Les ombres hi cauen a sobre. */
function Ground({ onReady }: { onReady: () => void }) {
  const map = useTexture("/map/ground.jpg");
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    prepareGround(map, gl.capabilities.getMaxAnisotropy());
    invalidate();
    onReady();
  }, [map, gl, invalidate, onReady]);
  return (
    <>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[WIDTH, DEPTH]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03} receiveShadow>
        <planeGeometry args={[WIDTH, DEPTH]} />
        <shadowMaterial transparent opacity={0.32} />
      </mesh>
      <mesh position-y={-1.26}>
        <boxGeometry args={[WIDTH, 2.5, DEPTH]} />
        <meshLambertMaterial color="#5a4630" />
      </mesh>
    </>
  );
}

function Rig({ handle, started, reducedMotion, interactive, zoomEnabled, rig }: Pick<MapSceneProps, "handle" | "started" | "reducedMotion" | "interactive" | "zoomEnabled"> & { rig: CameraRig }) {
  const controls = useRef<Controls>(null);
  const get = useThree((s) => s.get);
  const aspect = useThree((s) => s.size.width / s.size.height);

  useLayoutEffect(() => {
    rig.init(get(), controls.current, started || reducedMotion);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- només en muntar
  }, []);

  useEffect(() => {
    if (started && rig.grow < 1) rig.flyTo(get(), controls.current, (g, home) => Object.assign(g, home));
  }, [started, rig, get]);

  useImperativeHandle(handle, () => {
    const fly = (change: (g: Goal, home: Goal) => void) => rig.flyTo(get(), controls.current, change);
    return {
      focus: ({ x, y }) => {
        const [wx, wz] = world(x, y);
        fly((g) => {
          g.target.set(wx, 0, wz);
          g.radius = Math.min(g.radius, 30);
          g.phi = 1;
        });
      },
      zoomBy: (factor) => fly((g) => (g.radius /= factor)),
      rotateBy: (radians) => fly((g) => (g.theta += radians)),
      reset: () => fly((g, home) => Object.assign(g, home)),
    };
  }, [rig, get]);

  useFrame((state, rawDelta) => {
    rig.step(state, controls.current, Math.min(rawDelta, MAX_DELTA), started, reducedMotion);
  });

  return (
    <MapControls
      ref={controls}
      enabled={interactive}
      enableDamping={false}
      enableZoom={zoomEnabled}
      zoomSpeed={0.8}
      minDistance={MIN_DISTANCE}
      maxDistance={rig.maxDistance(aspect)}
      minPolarAngle={0}
      maxPolarAngle={1.3}
      onStart={() => rig.cancel()}
      onChange={() => rig.clamp(get(), controls.current)}
    />
  );
}

const scratch = new Vector3();

/** Posa cada marcador (botons HTML, fora del canvas) a sobre del seu punt. */
function projectMarkers(el: HTMLElement, points: MapPoint[], state: RootState, shown: boolean) {
  for (const [i, p] of points.entries()) {
    const node = el.children[i] as HTMLElement | undefined;
    if (!node) continue;
    const [x, z] = world(p.x, p.y);
    const distance = state.camera.position.distanceTo(scratch.set(x, MARKER_HEIGHT, z));
    scratch.project(state.camera);
    const visible = shown && scratch.z < 1 && Math.abs(scratch.x) < 1.05 && scratch.y > -1.05 && scratch.y < 1.2;
    node.style.visibility = visible ? "visible" : "hidden";
    if (!visible) continue;
    const scale = MathUtils.clamp(48 / distance, 0.68, 1.25);
    node.style.transform = `translate3d(${((scratch.x + 1) / 2) * state.size.width}px, ${((1 - scratch.y) / 2) * state.size.height}px, 0) translate(-50%, -100%) scale(${scale.toFixed(3)})`;
    node.style.zIndex = String((node.ariaPressed === "true" ? 5000 : 2000) - Math.round(distance * 4));
  }
}

/** Els marcadors es recol·loquen a cada fotograma dibuixat (i quan canvia el filtre). */
function MarkerProjector({ layer, points, rig }: { layer: RefObject<HTMLDivElement | null>; points: MapPoint[]; rig: CameraRig }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [points, invalidate]);
  useFrame((state) => {
    if (layer.current) projectMarkers(layer.current, points, state, rig.grow > 0.75);
  });
  return null;
}

export default function MapScene({ points, selectedId, onSelect, started, reducedMotion, interactive, zoomEnabled, handle, onReady }: MapSceneProps) {
  const layer = useRef<HTMLDivElement>(null);
  const [rig] = useState(() => new CameraRig());

  return (
    <div className="absolute inset-0 isolate">
      <Canvas
        flat
        shadows
        frameloop="demand"
        dpr={[1, 1.75]}
        camera={{ fov: FOV, near: 1, far: 900, position: [0, 150, 0.1] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        resize={{ scroll: false, debounce: { scroll: 0, resize: 150 } }}
        className={interactive ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}
        aria-hidden="true"
      >
        <hemisphereLight args={["#fff8e6", "#6b7a45", 1.5]} />
        <directionalLight
          position={[-38, 70, 34]}
          intensity={2.1}
          color="#fff0d2"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-62}
          shadow-camera-right={62}
          shadow-camera-top={45}
          shadow-camera-bottom={-45}
          shadow-camera-near={10}
          shadow-camera-far={200}
          shadow-bias={-0.0006}
        />
        <Suspense fallback={null}>
          <Ground onReady={onReady} />
          <Model rig={rig} />
          <Rig handle={handle} started={started} reducedMotion={reducedMotion} interactive={interactive} zoomEnabled={zoomEnabled} rig={rig} />
          <MarkerProjector layer={layer} points={points} rig={rig} />
        </Suspense>
      </Canvas>
      <div ref={layer} className="pointer-events-none absolute inset-0 overflow-hidden">
        {points.map((p) => (
          <MapMarker key={p.id} point={p} selected={p.id === selectedId} onClick={() => onSelect(p)} className="absolute left-0 top-0 origin-bottom" style={{ visibility: "hidden" }} />
        ))}
      </div>
    </div>
  );
}
