// Llegeix la il·lustració del plànol i en treu la maqueta 3D: on és cada arbre i cada casa, i un terra
// «net» (sense llegendes, logo ni brúixola) per posar-hi a sota.
//
//   pnpm map:build                 → src/components/scene/map-scene.data.json + public/map/ground.jpg + public/map/icons.png
//   pnpm map:build --debug <dir>   → a més, imatges de comprovació amb el que ha detectat
//
// S'executa a mà quan canvia la il·lustració (no a cada build): el resultat va al repositori.

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { classify, cleanGround, components, densityPeaks, isGround, type Kind } from "./lib/map-detect.ts";

const SOURCE = "reference/images/plan/planol-camping-castell-montgri_2026.jpg";
const OUT = "public/map";
const SCENE_JSON = "src/components/scene/map-scene.data.json";
const debugDir = process.argv.includes("--debug") ? process.argv[process.argv.indexOf("--debug") + 1] : null;

// Rectangles que no són càmping: llegendes, logo i brúixola (en píxels de la il·lustració).
const BANNERS: [number, number, number, number][] = [
  [2290, 30, 2990, 930], // llegenda «Serveis»
  [2290, 1520, 2990, 1840], // llegenda «Allotjaments»
  [60, 20, 860, 290], // logo
  [50, 860, 330, 1150], // brúixola
];
const inBanner = (x: number, y: number) => BANNERS.some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);

const { data, info } = await sharp(SOURCE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
console.log(`▶ ${SOURCE} (${W}×${H})`);

// 1) Classe de cada píxel.
const kinds = new Uint8Array(W * H);
for (let i = 0, p = 0; p < W * H; i += 3, p++) kinds[p] = classify(data[i]!, data[i + 1]!, data[i + 2]!);

// 2) Objectes: components connexos de cada classe, amb límits de mida raonables.
type Item = { x: number; y: number; s: number; t: number };
const pct = (v: number, size: number) => Math.round((v / size) * 10000) / 100;
const items = { trees: [] as Item[], houses: [] as Item[] };

const HOUSE_TYPES: Kind[] = ["roofGrey", "roofSlate", "roofOrange", "tent"];
for (const [type, kind] of HOUSE_TYPES.entries()) {
  for (const c of components(kinds, W, H, kind)) {
    if (c.area < 90 || c.area > 2600 || inBanner(c.cx, c.cy)) continue;
    const w = c.x1 - c.x0;
    const h = c.y1 - c.y0;
    if (w > 110 || h > 90 || w < 9 || h < 7) continue; // massa allargat o massa petit: no és un teulat
    if (c.area / (w * h) < 0.33) continue; // forma massa buida: vora d'una altra cosa
    items.houses.push({ x: pct(c.cx, W), y: pct(c.cy + h * 0.25, H), s: Math.round(Math.sqrt(c.area)) / 10, t: type });
  }
}

// Arbres: on el verd fosc (l'ombra de sota la capçada) és més dens. A les masses de bosc en surten molts.
for (const p of densityPeaks(kinds, W, H, "treeDark", { window: 22, step: 4, minDensity: 0.075, minDistance: 26 })) {
  if (inBanner(p.x, p.y)) continue;
  items.trees.push({ x: pct(p.x, W), y: pct(p.y + 4, H), s: Math.round(Math.min(26, 14 + p.density * 14)) / 10, t: p.density > 0.8 ? 1 : 0 });
}

console.log(`✓ ${items.trees.length} arbres, ${items.houses.length} cases`);

// 3) Terra: la il·lustració sense rètols ni objectes dibuixats, per posar a sota de la maqueta.
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

await mkdir(OUT, { recursive: true });
const raw = { raw: { width: W, height: H, channels: 3 as const } };
const cleaned = Buffer.from(cleanGround(rgb, W, H, ground, 9, 2));
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
const patched = await sharp(cleaned, raw).composite(patches).removeAlpha().raw().toBuffer();
await sharp(patched, raw)
  .resize(2560)
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(join(OUT, "ground.jpg"));

await writeFile(
  SCENE_JSON,
  JSON.stringify({ aspect: W / H, trees: items.trees.map((t) => [t.x, t.y, t.s, t.t]), houses: items.houses.map((h) => [h.x, h.y, h.s, h.t]) }),
);
console.log(`✓ ${SCENE_JSON} i ${OUT}/ground.jpg`);

// 4) Icones de la llegenda: 13 files × 3 columnes al dibuix → un atles de 13 columnes × 3 files.
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

// 5) Comprovació visual.
if (debugDir) {
  await mkdir(debugDir, { recursive: true });
  const dot = (x: number, y: number, r: number, fill: string) => `<circle cx="${(x / 100) * W}" cy="${(y / 100) * H}" r="${r}" fill="${fill}" stroke="#000" stroke-width="1"/>`;
  const COLORS = ["#ff2d2d", "#2d6bff", "#ff9f1c", "#ffe14d"];
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${items.trees.map((t) => dot(t.x, t.y, 5, "#00ff6a")).join("")}${items.houses
      .map((h) => dot(h.x, h.y, 8, COLORS[h.t]!))
      .join("")}</svg>`,
  );
  await sharp(SOURCE).composite([{ input: svg }]).jpeg({ quality: 80 }).toFile(join(debugDir, "detected.jpg"));
  console.log(`✓ ${debugDir}/detected.jpg`);
}
