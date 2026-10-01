// Llegeix la il·lustració del plànol i en treu la maqueta 3D: on és cada arbre i cada casa, i un terra
// «net» (sense llegendes, logo, brúixola, cases ni icones) per posar-hi a sota.
//
//   pnpm map:build                 → src/components/scene/map-scene.data.json + public/map/ground.jpg + public/map/icons.png
//   pnpm map:build --debug <dir>   → a més, imatges de comprovació amb el que ha detectat
//
// Entrades revisades a mà (scripts/content/):
//   map-plots.json      número i posició de cada parcel·la i allotjament (el rètol del dibuix)
//   map-buildings.json  edificis grans i zones on no hi ha d'haver arbres (camps d'esport)
//
// S'executa a mà quan canvia la il·lustració (no a cada build): el resultat va al repositori.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { classify, components, densityPeaks, erode, inpaint, isGround, KIND_INDEX, type Kind } from "./lib/map-detect.ts";
import { placeHouses, type Plot, type Roof } from "./lib/map-plots.ts";
import { sportsSvg, type Sport } from "./lib/map-sports.ts";

const SOURCE = "reference/images/plan/planol-camping-castell-montgri_2026.jpg";
const OUT = "public/map";
const SCENE_JSON = "src/components/scene/map-scene.data.json";
const debugDir = process.argv.includes("--debug") ? process.argv[process.argv.indexOf("--debug") + 1] : null;

type Rect = [number, number, number, number];
type Building = { name: string; x: number; y: number; w: number; d: number; h: number; rot: number; roof: "gable-x" | "gable-y" | "hip" | "flat"; color: string; wall: string };

// Rectangles que no són càmping: llegendes, logo i brúixola (en píxels de la il·lustració).
const BANNERS: Rect[] = [
  [2290, 30, 2990, 930], // llegenda «Serveis»
  [2290, 1520, 2990, 1840], // llegenda «Allotjaments»
  [60, 20, 860, 290], // logo
  [50, 860, 330, 1150], // brúixola
];
const inside = (rects: Rect[], x: number, y: number, margin = 0) => rects.some(([x0, y0, x1, y1]) => x >= x0 - margin && x <= x1 + margin && y >= y0 - margin && y <= y1 + margin);

const {
  buildings,
  colors,
  sports,
  no_trees: noTrees,
} = JSON.parse(await readFile("scripts/content/map-buildings.json", "utf8")) as { buildings: Building[]; colors: Record<string, string>; sports: Sport[]; no_trees: Rect[] };
const color = (key: string) => {
  if (!colors[key]) throw new Error(`map-buildings.json: el color «${key}» no existeix`);
  return colors[key];
};
const { plots } = JSON.parse(await readFile("scripts/content/map-plots.json", "utf8")) as { plots: Plot[] };
// Caixa de cada edifici (sense gir: per excloure-hi arbres i cases n'hi ha prou).
const buildingRects: Rect[] = buildings.map((b) => [b.x - b.w / 2, b.y - b.d / 2, b.x + b.w / 2, b.y + b.d / 2]);

const { data, info } = await sharp(SOURCE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
console.log(`▶ ${SOURCE} (${W}×${H})`);

// 1) Classe de cada píxel.
const kinds = new Uint8Array(W * H);
for (let i = 0, p = 0; p < W * H; i += 3, p++) kinds[p] = classify(data[i]!, data[i + 1]!, data[i + 2]!);

const pct = (v: number, size: number) => Math.round((v / size) * 10000) / 100;

// 2) Teulats: components connexos de cada color de teulat, amb límits de mida raonables.
const ROOF_KINDS: Kind[] = ["roofGrey", "roofSlate", "roofOrange", "tent"];
const roofs: Roof[] = [];
for (const kind of ROOF_KINDS) {
  for (const c of components(kinds, W, H, kind)) {
    if (c.area < 90 || c.area > 2600 || inside(BANNERS, c.cx, c.cy) || inside(buildingRects, c.cx, c.cy, 4)) continue;
    const w = c.x1 - c.x0;
    const h = c.y1 - c.y0;
    if (w > 110 || h > 90 || w < 9 || h < 7) continue; // massa allargat o massa petit: no és un teulat
    if (c.area / (w * h) < 0.33) continue; // forma massa buida: vora d'una altra cosa
    roofs.push({ x: c.cx, y: c.cy + h * 0.25, size: Math.sqrt(c.area), tent: kind === "tent" });
  }
}
// Cada rètol d'allotjament té la seva casa: la del teulat més proper o, si no se n'ha detectat cap, una al costat del rètol.
// Dels teulats sense número només es conserven les tendes: la resta solen ser falsos positius (pistes, camins).
const houses = placeHouses(plots, roofs).filter((h) => h.plot || (h.tent && !inside(noTrees, h.x, h.y)));

// 3) Arbres: on el verd fosc (l'ombra de sota la capçada) és més dens. Una taca de verd fosc uniforme
//    no és un arbre (camp de futbol, tanques): es descarta, igual que les zones marcades a mà.
const trees: { x: number; y: number; s: number; t: number }[] = [];
for (const p of densityPeaks(kinds, W, H, "treeDark", { window: 22, step: 4, minDensity: 0.075, minDistance: 26 })) {
  if (inside(BANNERS, p.x, p.y) || inside(noTrees, p.x, p.y) || inside(buildingRects, p.x, p.y, 6) || p.density > 0.93) continue;
  trees.push({ x: pct(p.x, W), y: pct(p.y + 4, H), s: Math.round(Math.min(26, 14 + p.density * 14)) / 10, t: p.density > 0.8 ? 1 : 0 });
}

console.log(`✓ ${trees.length} arbres, ${houses.length} cases (${houses.filter((h) => h.plot).length} amb número), ${buildings.length} edificis, ${plots.length} números`);

// 4) Terra: la il·lustració sense rètols ni objectes dibuixats, per posar a sota de la maqueta.
//    Els rètols s'omplen estirant cap a la dreta el color del prat que tenen just a l'esquerra, fila per fila.
const rgb = new Uint8Array(data);
const ground = new Uint8Array(W * H);
for (const [x0, y0, x1, y1] of BANNERS) {
  for (let y = y0; y <= Math.min(H - 1, y1); y++) {
    const from = (y * W + Math.max(0, x0 - 14)) * 3;
    for (let x = x0; x <= Math.min(W - 1, x1); x++) rgb.set(rgb.subarray(from, from + 3), (y * W + x) * 3);
  }
}
for (let p = 0; p < W * H; p++) ground[p] = isGround(rgb[p * 3]!, rgb[p * 3 + 1]!, rgb[p * 3 + 2]!) ? 1 : 0;
for (const [x0, y0, x1, y1] of BANNERS) for (let y = y0; y <= Math.min(H - 1, y1); y++) ground.fill(1, y * W + x0, y * W + Math.min(W - 1, x1) + 1);
// Camps d'esport: el seu color es confon amb el d'un teulat; són terra i es deixen com són.
//   (Només els píxels de color de teulat: les icones dibuixades a sobre s'han d'esborrar igualment.)
for (const [x0, y0, x1, y1] of noTrees) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (ROOF_KINDS.some((k) => kinds[y * W + x] === KIND_INDEX[k])) ground[y * W + x] = 1;
}
// Les píndoles de número dels allotjaments s'esborren senceres (la vermella, pel color, es quedava a mitges):
// a la maqueta el número va flotant sobre la casa.
for (const plot of plots) {
  if (plot.k === "text") continue;
  for (let y = Math.max(0, plot.y - 8); y <= Math.min(H - 1, plot.y + 8); y++) ground.fill(0, y * W + Math.max(0, plot.x - 15), y * W + Math.min(W - 1, plot.x + 15) + 1);
}
// Els números de parcel·la pintats a terra (text blanc) es conserven: a la maqueta no hi ha res a sobre.
for (const plot of plots) {
  if (plot.k !== "text") continue;
  for (let y = Math.max(0, plot.y - 9); y <= Math.min(H - 1, plot.y + 9); y++) ground.fill(1, y * W + Math.max(0, plot.x - 16), y * W + Math.min(W - 1, plot.x + 16) + 1);
}

await mkdir(OUT, { recursive: true });
const raw = { raw: { width: W, height: H, channels: 3 as const } };
// Tot el que no és terra (i la seva vora, dos píxels) es torna a pintar continuant el color del voltant.
const cleaned = Buffer.from(inpaint(rgb, W, H, erode(ground, W, H, 2)));
// On hi havia rètols, el farciment fila per fila deixa ratlles: s'hi posa a sobre el mateix tros molt difuminat.
const patches = await Promise.all(
  BANNERS.map(async ([x0, y0, x1, y1]) => {
    const m = 40; // marge perquè el difuminat agafi color del voltant
    const left = Math.max(0, x0 - m);
    const top = Math.max(0, y0 - m);
    const width = Math.min(W, x1 + m) - left;
    const height = Math.min(H, y1 + m) - top;
    const feather = Buffer.from(
      `<svg width="${width}" height="${height}"><rect x="${m / 2}" y="${m / 2}" width="${width - m}" height="${height - m}" rx="20" fill="#fff" filter="blur(12px)"/></svg>`,
    );
    const input = await sharp(cleaned, raw).extract({ left, top, width, height }).blur(38).ensureAlpha().composite([{ input: feather, blend: "dest-in" }]).png().toBuffer();
    return { input, left, top };
  }),
);
// A sota de cada edifici gran, una llosa llisa: el dibuix (que és en perspectiva) no ha de sobresortir del volum 3D.
// I les pistes d'esport, redibuixades: tenien icones a sobre.
const pads = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><g fill="#d6c9a8" filter="blur(1.5px)">${buildings
    .map((b) => `<rect x="${b.x - b.w / 2 - 6}" y="${b.y - b.d / 2 - 6}" width="${b.w + 12}" height="${b.d + 22}" rx="4" transform="rotate(${b.rot} ${b.x} ${b.y})"/>`)
    .join("")}</g></svg>`,
);
const patched = await sharp(cleaned, raw)
  .composite([...patches, { input: pads }, { input: Buffer.from(sportsSvg(sports, W, H)) }])
  .removeAlpha()
  .raw()
  .toBuffer();
await sharp(patched, raw).jpeg({ quality: 80, mozjpeg: true }).toFile(join(OUT, "ground.jpg"));

const KIND_CODE = { text: 0, red: 1, cream: 2 } as const;
await writeFile(
  SCENE_JSON,
  JSON.stringify({
    aspect: W / H,
    trees: trees.map((t) => [t.x, t.y, t.s, t.t]),
    // [x %, y %, mida, tipus (0 sense número, 1 allotjament del càmping, 2 operador turístic, 3 tenda)]
    houses: houses.map((h) => [pct(h.x, W), pct(h.y, H), Math.round(h.size) / 10, h.tent ? 3 : h.plot ? KIND_CODE[h.plot.k] : 0]),
    // [x %, y %, amplada %, fondària % (de l'amplada), alçada, gir en graus, teulada, color de teulada, color de paret]
    buildings: buildings.map((b) => [pct(b.x, W), pct(b.y, H), pct(b.w, W), pct(b.d, W), b.h, b.rot, b.roof, color(b.color), color(b.wall)]),
    // [número, x %, y %, tipus (0 parcel·la, 1 allotjament del càmping, 2 operador turístic), x i y de la casa si en té]
    plots: plots.map((p) => {
      const house = houses.find((h) => h.plot === p);
      return [p.n, pct(p.x, W), pct(p.y, H), KIND_CODE[p.k], ...(house ? [pct(house.x, W), pct(house.y, H)] : [])];
    }),
  }),
);
console.log(`✓ ${SCENE_JSON} i ${OUT}/ground.jpg`);

// 5) Icones de la llegenda: 13 files × 3 columnes al dibuix → un atles de 13 columnes × 3 files.
//    Cada icona és un cercle de ~44 px; es retalla en quadrat i s'arrodoneix amb una màscara.
const ICON = { x: [2383, 2578, 2773], y0: 190, dy: 52.4, size: 48, out: 96 };
const mask = Buffer.from(`<svg width="${ICON.out}" height="${ICON.out}"><circle cx="${ICON.out / 2}" cy="${ICON.out / 2}" r="${ICON.out / 2 - 2}" fill="#fff"/></svg>`);
const cells = await Promise.all(
  ICON.x.flatMap((cx, col) =>
    Array.from({ length: 13 }, async (_, row) => ({
      input: await sharp(SOURCE)
        .extract({ left: Math.round(cx - ICON.size / 2), top: Math.round(ICON.y0 + row * ICON.dy - ICON.size / 2), width: ICON.size, height: ICON.size })
        .resize(ICON.out, ICON.out, { kernel: "lanczos3" })
        .composite([{ input: mask, blend: "dest-in" }])
        .png()
        .toBuffer(),
      left: row * ICON.out,
      top: col * ICON.out,
    })),
  ),
);
await sharp({ create: { width: 13 * ICON.out, height: 3 * ICON.out, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(cells)
  .png({ compressionLevel: 9, palette: true })
  .toFile(join(OUT, "icons.png"));
console.log(`✓ ${OUT}/icons.png (${cells.length} icones)`);

// 6) Comprovació visual: tot el que s'ha detectat, pintat sobre la il·lustració.
if (debugDir) {
  await mkdir(debugDir, { recursive: true });
  const dot = (x: number, y: number, r: number, fill: string) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#000" stroke-width="1"/>`;
  const COLORS = ["#9aa0a6", "#ff2d2d", "#ffe14d", "#ff9f1c"];
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${trees.map((t) => dot((t.x / 100) * W, (t.y / 100) * H, 5, t.t ? "#007a33" : "#00ff6a")).join("")}${houses
      .map((h) => dot(h.x, h.y, 8, COLORS[h.tent ? 3 : h.plot ? KIND_CODE[h.plot.k] : 0]!))
      .join("")}${buildings
      .map((b) => `<g transform="rotate(${b.rot} ${b.x} ${b.y})"><rect x="${b.x - b.w / 2}" y="${b.y - b.d / 2}" width="${b.w}" height="${b.d}" fill="none" stroke="#f0f" stroke-width="3"/></g>`)
      .join("")}${plots.map((p) => `<text x="${p.x}" y="${p.y + 22}" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="2.5" paint-order="stroke">${p.n}</text>`).join("")}</svg>`,
  );
  await sharp(SOURCE).composite([{ input: svg }]).jpeg({ quality: 82 }).toFile(join(debugDir, "detected.jpg"));
  console.log(`✓ ${debugDir}/detected.jpg`);
}
