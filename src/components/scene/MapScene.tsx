"use client";

// El mapa del càmping en 3D: cada arbre, cada bungalow i els edificis de la il·lustració, aixecats sobre
// el dibuix net. Les posicions surten de `pnpm map:build` (map-scene.data.json). Tot modelat per codi.

import { MapControls, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree, type RootState, type ThreeEvent } from "@react-three/fiber";
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
  type Mesh,
  type Texture,
} from "three";
import { MapMarker } from "@/components/site/map-marker";
import { findPlot, nearestPlot, PLOTS, type MapPlot } from "@/lib/map/plots";
import type { MapPoint } from "@/lib/supabase/content";
import data from "./map-scene.data.json";
import { seededRandom } from "./random";

export type MapViewerHandle = {
  focus: (point: { x: number; y: number }) => void;
  zoomBy: (factor: number) => void;
  rotateBy: (radians: number) => void;
  reset: () => void;
  /** Busca una parcel·la o allotjament pel número. */
  findPlot: (query: string) => MapPlot | null;
};

export type MapSceneProps = {
  points: MapPoint[];
  selectedId: string | null;
  onSelect: (point: MapPoint) => void;
  /** Parcel·la o allotjament triat (pel cercador o clicant-hi): queda marcat amb el seu número. */
  selectedPlot: MapPlot | null;
  onSelectPlot: (plot: MapPlot) => void;
  /** Com es diu cada mena de número: parcel·la, allotjament del càmping, operador turístic. */
  plotNames: [string, string, string];
  /** Quan passa a `true`, la maqueta creix i la càmera s'inclina. */
  started: boolean;
  reducedMotion: boolean;
  /** El visor rep el ratolí o el dit (mapa obert). Tancat, és un fons: no segresta res. */
  interactive: boolean;
  /** Tancat i a la vista: la càmera es gronxa a poc a poc. */
  drift: boolean;
  handle: Ref<MapViewerHandle>;
  onReady: () => void;
};

// El món fa 100 unitats d'ample, com els % de `map_points`.
const WIDTH = 100;
const DEPTH = WIDTH / data.aspect;
const world = (x: number, y: number) => [x - 50, ((y - 50) / 100) * DEPTH] as const;
const UNIT = WIDTH / 3000; // un píxel de la il·lustració, en unitats del món

const MAX_DELTA = 1 / 30;
const FOV = 32;
const TAN = Math.tan(MathUtils.degToRad(FOV / 2));
const HOME = { phi: 0.92, theta: -0.3 };
const MIN_DISTANCE = 9;
const MARKER_HEIGHT = 2.3;
const GROW_SECONDS = 2.2;
const SPREAD = 1.6; // quant s'esglaona el creixement del centre cap enfora
const LABELS = 70; // números visibles alhora quan s'hi és a prop
const LABEL_DISTANCE = 34;
const HOVER_RADIUS = 0.75; // en % de l'amplada: fins on «s'enganxa» el ratolí a una parcel·la

/** Distància des d'on es veu tot el mapa amb la inclinació `phi`. */
const fitDistance = (aspect: number, phi: number) => Math.max((WIDTH / 2 + 4) / (TAN * aspect), ((DEPTH / 2) * Math.max(0.55, Math.cos(phi)) + 6) / TAN);

const easeOutBack = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

type Goal = { target: Vector3; radius: number; phi: number; theta: number };
type Controls = ComponentRef<typeof MapControls> | null;

/**
 * Càmera i estat que canvia a cada fotograma: vol suau cap a un objectiu (centrar un punt, ampliar, girar),
 * gronxament de fons, creixement de la maqueta i la parcel·la sota el ratolí.
 * És una classe fora de React: tot el que fa és mutar la càmera i els controls de three.
 */
class CameraRig {
  goal: Goal | null = null;
  /** Creixement de la maqueta, de 0 (plana) a 1. */
  grow = 0;
  hover: MapPlot | null = null;
  /** Centre de la vista i distància, per saber quins números s'han d'ensenyar. */
  readonly target = new Vector3();
  distance = Infinity;
  private clock = 0;
  private offset = new Vector3();
  private spherical = new Spherical();

  private aspect = (state: RootState) => state.size.width / state.size.height;
  maxDistance = (aspect: number) => fitDistance(aspect, 0) * 1.1;
  /** Vista de sortida. En vertical (mòbil) el mapa sencer quedaria minúscul: s'hi entra més a prop, i una mica avall perquè el titular hi càpiga a sobre. */
  home = (state: RootState): Goal => ({ target: new Vector3(0, 0, this.aspect(state) < 1 ? -7 : 3), radius: fitDistance(this.aspect(state), HOME.phi) * (this.aspect(state) < 1 ? 0.42 : 0.86), ...HOME });

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

  setHover(state: RootState, plot: MapPlot | null) {
    if (plot === this.hover) return;
    this.hover = plot;
    state.invalidate();
  }

  step(state: RootState, controls: Controls, delta: number, opts: { started: boolean; reducedMotion: boolean; drift: boolean }) {
    if (opts.started && this.grow < 1) {
      this.grow = opts.reducedMotion ? 1 : Math.min(1, this.grow + delta / GROW_SECONDS);
      state.gl.shadowMap.needsUpdate = true;
      state.invalidate();
    }
    const g = this.goal;
    if (g) {
      const now = this.current(state, controls);
      const lambda = opts.reducedMotion ? 1e3 : 3.2;
      now.target.x = MathUtils.damp(now.target.x, g.target.x, lambda, delta);
      now.target.z = MathUtils.damp(now.target.z, g.target.z, lambda, delta);
      now.radius = MathUtils.damp(now.radius, g.radius, lambda, delta);
      now.phi = MathUtils.damp(now.phi, g.phi, lambda, delta);
      now.theta = MathUtils.damp(now.theta, g.theta, lambda, delta);
      const arrived =
        now.target.distanceTo(g.target) < 0.02 && Math.abs(now.radius - g.radius) < 0.02 && Math.abs(now.phi - g.phi) < 0.002 && Math.abs(now.theta - g.theta) < 0.002;
      this.place(state, controls, arrived ? g : now);
      if (arrived) {
        this.goal = null;
        this.clock = 0; // el gronxament reprèn des d'aquí, sense salt
      }
      state.invalidate();
    } else if (opts.drift && this.grow >= 1 && !opts.reducedMotion) {
      // Fons de la landing: la vista de sortida es gronxa a poc a poc.
      this.clock += delta;
      const home = this.home(state);
      home.theta += Math.sin(this.clock * 0.16) * 0.2;
      home.radius *= 1 - 0.04 * (1 - Math.cos(this.clock * 0.16));
      this.place(state, controls, home);
      state.invalidate();
    }
    const now = this.current(state, controls);
    this.target.copy(now.target);
    this.distance = now.radius;
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
// Cases per tipus: 1 allotjament del càmping (teula vermella, com la píndola del dibuix), 2 operador turístic
// (teulada clara sobre parets fosques), 3 tenda. Colors vius a posta: s'han de distingir de lluny.
const HOUSE = {
  1: { roof: "#d8492a", wall: "#fff4e2" },
  2: { roof: "#f6e6bd", wall: "#8a745c" },
} as const;
const TENT = "#efe3c6";
const BUILDING_ROOF = { tile: "#a8683f", wood: "#a37a45", grey: "#70747c", flat: "#f3efe6" } as const;
const BUILDING_WALL = "#ecdcbc";

type Roof = keyof typeof BUILDING_ROOF;

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
    const r = s * 0.2 * (0.85 + random() * 0.3);
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
    const d = delay(x, z);
    const ry = (random() - 0.5) * 0.24;
    if (t === 3) {
      // Tenda: només el con, fins a terra.
      const side = Math.min(1.1, (s / 3) * 1.3);
      roofs.push({ x, y: 0, z, sx: side, sy: side * 1.4, sz: side, ry, delay: d, color: new Color(TENT) });
      continue;
    }
    // Tots els bungalows fan la mateixa mida: es llegeixen com un conjunt i no es trepitgen.
    const style = HOUSE[t === 1 ? 1 : 2];
    walls.push({ x, y: 0, z, sx: 0.7, sy: 0.34, sz: 0.5, ry, delay: d, color: new Color(style.wall) });
    roofs.push({ x, y: 0.34, z, sx: 0.8, sy: 0.4, sz: 0.6, ry, delay: d, color: new Color(style.roof) });
  }

  for (const [px, py, pw, pd, h, rot, roof] of data.buildings as [number, number, number, number, number, number, Roof][]) {
    const [x, z] = world(px, py);
    const d = delay(x, z);
    const ry = -MathUtils.degToRad(rot);
    const height = h * UNIT * 0.8;
    walls.push({ x, y: 0, z, sx: pw, sy: height, sz: pd, ry, delay: d, color: new Color(BUILDING_WALL) });
    if (roof === "flat") walls.push({ x, y: height, z, sx: pw * 1.04, sy: 0.12, sz: pd * 1.04, ry, delay: d, color: new Color(BUILDING_ROOF.flat) });
    else roofs.push({ x, y: height, z, sx: pw * 1.03, sy: Math.min(pw, pd) * 0.42, sz: pd * 1.03, ry, delay: d, color: new Color(BUILDING_ROOF[roof]) });
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
      // Piràmide de base 1 × 1 (un con de quatre cares girat 45°): teulada a quatre aigües.
      roof: new ConeGeometry(Math.SQRT1_2, 0.5, 4).rotateY(Math.PI / 4).translate(0, 0.25, 0),
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

/**
 * El terra: la il·lustració neta sobre una llesca de terra, com una maqueta. Les ombres hi cauen a sobre.
 * També és on es llegeix el ratolí: el punt de terra més proper a una parcel·la la marca.
 */
function Ground({ rig, onReady, onSelectPlot }: { rig: CameraRig; onReady: () => void; onSelectPlot: (plot: MapPlot) => void }) {
  const map = useTexture("/map/ground.jpg");
  const gl = useThree((s) => s.gl);
  const get = useThree((s) => s.get);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    prepareGround(map, gl.capabilities.getMaxAnisotropy());
    invalidate();
    onReady();
  }, [map, gl, invalidate, onReady]);

  const plotAt = (e: ThreeEvent<PointerEvent | MouseEvent>) => nearestPlot(e.point.x + 50, (e.point.z / DEPTH) * 100 + 50, HOVER_RADIUS);

  return (
    <>
      <mesh
        rotation-x={-Math.PI / 2}
        onPointerMove={(e) => rig.setHover(get(), e.pointerType === "mouse" ? plotAt(e) : null)}
        onPointerOut={() => rig.setHover(get(), null)}
        onClick={(e) => {
          if (e.delta > 6) return; // era un arrossegament
          const plot = plotAt(e);
          if (plot) onSelectPlot(plot);
        }}
      >
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

function Rig({
  handle,
  started,
  reducedMotion,
  interactive,
  drift,
  rig,
}: Pick<MapSceneProps, "handle" | "started" | "reducedMotion" | "interactive" | "drift"> & { rig: CameraRig }) {
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
          g.radius = Math.min(g.radius, 24);
          g.phi = 1;
        });
      },
      zoomBy: (factor) => fly((g) => (g.radius /= factor)),
      rotateBy: (radians) => fly((g) => (g.theta += radians)),
      reset: () => fly((g, home) => Object.assign(g, home)),
      findPlot: (query) => findPlot(query),
    };
  }, [rig, get]);

  useFrame((state, rawDelta) => {
    rig.step(state, controls.current, Math.min(rawDelta, MAX_DELTA), { started, reducedMotion, drift });
  });

  return (
    <MapControls
      ref={controls}
      enabled={interactive}
      enableDamping={false}
      zoomSpeed={0.9}
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

/** Projecta un punt del món a píxels del canvas. Retorna la distància a la càmera, o -1 si queda fora. */
function project(state: RootState, x: number, y: number, z: number, out: { x: number; y: number }) {
  const distance = state.camera.position.distanceTo(scratch.set(x, y, z));
  scratch.project(state.camera);
  if (scratch.z >= 1 || Math.abs(scratch.x) > 1.05 || scratch.y < -1.05 || scratch.y > 1.2) return -1;
  out.x = ((scratch.x + 1) / 2) * state.size.width;
  out.y = ((1 - scratch.y) / 2) * state.size.height;
  return distance;
}

const screen = { x: 0, y: 0 };

/** Posa cada marcador (botons HTML, fora del canvas) a sobre del seu punt. */
function projectMarkers(el: HTMLElement, points: MapPoint[], state: RootState, shown: boolean) {
  for (const [i, p] of points.entries()) {
    const node = el.children[i] as HTMLElement | undefined;
    if (!node) continue;
    const [x, z] = world(p.x, p.y);
    const distance = shown ? project(state, x, MARKER_HEIGHT, z, screen) : -1;
    node.style.visibility = distance < 0 ? "hidden" : "visible";
    if (distance < 0) continue;
    const scale = MathUtils.clamp(48 / distance, 0.68, 1.25);
    node.style.transform = `translate3d(${screen.x}px, ${screen.y}px, 0) translate(-50%, -100%) scale(${scale.toFixed(3)})`;
    node.style.zIndex = String((node.ariaPressed === "true" ? 5000 : 2000) - Math.round(distance * 4));
  }
}

/** Una etiqueta HTML sobre una parcel·la. `text` només s'escriu si ha canviat. */
function placeLabel(node: HTMLElement, state: RootState, plot: MapPlot | null, text: string | null, height: number) {
  const [x, z] = plot ? world(plot.x, plot.y) : [0, 0];
  const distance = plot ? project(state, x, height, z, screen) : -1;
  node.style.visibility = distance < 0 ? "hidden" : "visible";
  if (distance < 0) return;
  if (text !== null && node.dataset.text !== text) {
    node.dataset.text = text;
    node.textContent = text;
  }
  node.style.transform = `translate3d(${screen.x}px, ${screen.y}px, 0) translate(-50%, -100%)`;
}

// Només els allotjaments porten número flotant: el de les parcel·les ja és pintat a terra.
const LODGINGS = PLOTS.filter((p) => p.kind !== 0);
const nearby: { plot: MapPlot; d: number }[] = [];

/** De prop, el número de cada bungalow a la vista (fins a `LABELS`, els més propers al centre). */
function projectLabels(el: HTMLElement, state: RootState, rig: CameraRig) {
  nearby.length = 0;
  if (rig.grow >= 1 && rig.distance < LABEL_DISTANCE) {
    const reach = rig.distance * 0.6;
    for (const plot of LODGINGS) {
      const [x, z] = world(plot.x, plot.y);
      const d = Math.hypot(x - rig.target.x, z - rig.target.z);
      if (d < reach) nearby.push({ plot, d });
    }
    nearby.sort((a, b) => a.d - b.d);
  }
  for (let i = 0; i < el.children.length; i++) {
    const entry = nearby[i];
    placeLabel(el.children[i] as HTMLElement, state, entry?.plot ?? null, entry?.plot.n ?? null, 0.95);
  }
}

type Overlay = { markers: RefObject<HTMLDivElement | null>; labels: RefObject<HTMLDivElement | null>; hover: RefObject<HTMLDivElement | null>; selected: RefObject<HTMLDivElement | null> };

/** Tot l'HTML que va a sobre del canvas es recol·loca a cada fotograma dibuixat (i quan canvia el que s'ensenya). */
function OverlayProjector({
  overlay,
  points,
  selectedPlot,
  plotNames,
  rig,
}: {
  overlay: Overlay;
  points: MapPoint[];
  selectedPlot: MapPlot | null;
  plotNames: [string, string, string];
  rig: CameraRig;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const hoverRing = useRef<Mesh>(null);
  const selectedRing = useRef<Mesh>(null);
  useEffect(() => invalidate(), [points, selectedPlot, invalidate]);

  useFrame((state) => {
    if (overlay.markers.current) projectMarkers(overlay.markers.current, points, state, rig.grow > 0.75);
    if (overlay.labels.current) projectLabels(overlay.labels.current, state, rig);
    const hover = rig.hover && rig.hover !== selectedPlot ? rig.hover : null;
    if (overlay.hover.current) placeLabel(overlay.hover.current, state, hover, hover && `${plotNames[hover.kind]} ${hover.n}`, 1.5);
    if (overlay.selected.current) placeLabel(overlay.selected.current, state, selectedPlot, null, 1.5);
    for (const [ring, plot] of [
      [hoverRing.current, hover],
      [selectedRing.current, selectedPlot],
    ] as const) {
      if (!ring) continue;
      ring.visible = Boolean(plot);
      if (plot) ring.position.set(world(plot.x, plot.y)[0], 0.06, world(plot.x, plot.y)[1]);
    }
  });

  return (
    <>
      <mesh ref={hoverRing} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.6, 0.72, 40]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <mesh ref={selectedRing} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.62, 0.84, 40]} />
        <meshBasicMaterial color="#ff5a1f" toneMapped={false} />
      </mesh>
    </>
  );
}

const LABEL_SLOTS = Array.from({ length: LABELS }, (_, i) => i);
const TIP = "pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold shadow-lg";

export default function MapScene({ points, selectedId, onSelect, selectedPlot, onSelectPlot, plotNames, started, reducedMotion, interactive, drift, handle, onReady }: MapSceneProps) {
  const markers = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const hover = useRef<HTMLDivElement>(null);
  const selected = useRef<HTMLDivElement>(null);
  const [rig] = useState(() => new CameraRig());
  const hidden = { visibility: "hidden" } as const;

  return (
    <div className="absolute inset-0 isolate">
      <Canvas
        flat
        shadows
        frameloop="demand"
        dpr={[1, 1.75]}
        camera={{ fov: FOV, near: 1, far: 900, position: [0, 150, 0.1] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        resize={{ scroll: false, debounce: { scroll: 0, resize: 60 } }}
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
          <Ground rig={rig} onReady={onReady} onSelectPlot={onSelectPlot} />
          <Model rig={rig} />
          <Rig handle={handle} started={started} reducedMotion={reducedMotion} interactive={interactive} drift={drift} rig={rig} />
          <OverlayProjector overlay={{ markers, labels, hover, selected }} points={points} selectedPlot={selectedPlot} plotNames={plotNames} rig={rig} />
        </Suspense>
      </Canvas>
      {/* Tancat, el mapa és un fons: res d'això s'ha de poder enfocar ni clicar. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" inert={!interactive}>
        <div ref={labels} aria-hidden="true">
          {LABEL_SLOTS.map((i) => (
            <span key={i} className="pointer-events-none absolute left-0 top-0 rounded-full bg-white/95 px-1.5 py-px text-xs font-bold text-[#232a14] shadow" style={hidden} />
          ))}
        </div>
        <div ref={markers}>
          {points.map((p) => (
            <MapMarker key={p.id} point={p} selected={p.id === selectedId} onClick={() => onSelect(p)} className="absolute left-0 top-0 origin-bottom" style={hidden} />
          ))}
        </div>
        <div ref={hover} aria-hidden="true" className={`${TIP} z-[6000] bg-ink text-paper`} style={hidden} />
        <div ref={selected} className={`${TIP} z-[6001] bg-terra text-white ring-2 ring-white`} style={hidden}>
          {selectedPlot && `${plotNames[selectedPlot.kind]} ${selectedPlot.n}`}
        </div>
      </div>
    </div>
  );
}
