// Prepara les peces de l'animació de gastronomia: treu el fons blanc de cada imatge generada, la retalla
// i la desa a public/food/ en WebP amb transparència.
//
//   pnpm food:build
//
// Les imatges d'origen (reference/images/food-ai/, fora del git) es generen amb la skill «generar-imatges»
// a partir de scripts/content/food-pieces.prompts.json. Són generades amb IA, no fotos del càmping.

import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join, parse } from "node:path";
import sharp from "sharp";
import { backgroundMask, clipToColouredEllipse, mainCircle } from "./lib/cutout.ts";

const SOURCE = "reference/images/food-ai";
const OUT = "public/food";
const DATA = "src/components/scene/food-pieces.data.json";
const MAX = 640; // costat més llarg, en píxels: a pantalla cap peça passa de ~500

// Peces on el blanc tancat a dins també és fons: els forats de les nanses de la paella.
const HOLES = new Set(["pan"]);
// Peces rodones: tot el que sobresurt de la rodona (ombres tenyides, reflexos) es retalla.
const ROUND = new Set(["lemon", "scoop-pistachio", "scoop-strawberry", "scoop-chocolate", "orange"]);
const sizes: Record<string, [number, number]> = {};
let pan: { cx: number; cy: number; r: number } | undefined;

await mkdir(OUT, { recursive: true });
for (const file of (await readdir(SOURCE)).filter((f) => /\.(jpe?g|png)$/i.test(f))) {
  const name = parse(file).name;
  const { data, info } = await sharp(join(SOURCE, file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // Canal de transparència, d'un sol byte per píxel.
  let alpha: Buffer;
  let rgb: Buffer = data;
  if (name === "rice") {
    // L'arròs és una textura que omple el quadre: es retalla en disc, per posar-lo dins la paella, i se li
    // enfosqueix la vora perquè sembli que puja per la paret de la paella en lloc d'un adhesiu pla.
    const r = Math.min(width, height) / 2 - 6;
    const disc = Buffer.from(`<svg width="${width}" height="${height}"><circle cx="${width / 2}" cy="${height / 2}" r="${r}" fill="#fff"/></svg>`);
    alpha = await sharp(disc).resize(width, height).blur(5).toColourspace("b-w").raw().toBuffer();
    const rim = Buffer.from(
      `<svg width="${width}" height="${height}"><defs><radialGradient id="g"><stop offset="0.72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a1206" stop-opacity="0.62"/></radialGradient></defs><circle cx="${width / 2}" cy="${height / 2}" r="${r + 6}" fill="url(#g)"/></svg>`,
    );
    rgb = await sharp(data, { raw: { width, height, channels: 3 } }).composite([{ input: rim }]).removeAlpha().raw().toBuffer();
  } else {
    // Fons: el blanc (i l'ombra grisa) que toca la vora de la imatge. El blanc de dins de la peça es queda,
    // tret de les peces de HOLES, on el blanc tancat a dins també és fons.
    const background = backgroundMask(data, width, height, HOLES.has(name) ? 600 : Infinity);
    // La llimona és d'un groc molt viu: amb un llindar alt, l'ombra tenyida de sota queda fora de la rodona.
    if (ROUND.has(name)) clipToColouredEllipse(data, width, height, background, name === "lemon" ? 90 : 26);
    const mask = Buffer.alloc(width * height);
    for (let p = 0; p < mask.length; p++) mask[p] = background[p] ? 0 : 255;
    // Es difumina i es torna a endurir cap endins: la vora perd el serrell blanc d'un píxel que deixa el fons.
    alpha = await sharp(mask, { raw: { width, height, channels: 1 } }).blur(1.6).linear(2.4, -230).toColourspace("b-w").raw().toBuffer();
    // El cercle de la paella (sense nanses), per saber on hi va l'arròs. Encara en coordenades de la imatge sencera.
    if (name === "pan") pan = mainCircle(Uint8Array.from(alpha, (a) => (a > 128 ? 1 : 0)), width, height);
  }
  if (alpha.length !== width * height) throw new Error(`${name}: el canal alfa fa ${alpha.length} bytes i n'haurien de ser ${width * height}`);

  // Es munta el RGBA a mà: és més clar que encadenar canals i no depèn de com sharp interpreti cada buffer.
  const rgba = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    rgba[p * 4] = rgb[p * 3]!;
    rgba[p * 4 + 1] = rgb[p * 3 + 1]!;
    rgba[p * 4 + 2] = rgb[p * 3 + 2]!;
    rgba[p * 4 + 3] = alpha[p]!;
  }

  const out = join(OUT, `${name}.webp`);
  const { data: trimmed, info: box } = await sharp(rgba, { raw: { width, height, channels: 4 } }).trim({ threshold: 8 }).png().toBuffer({ resolveWithObject: true });
  if (name === "pan" && pan) {
    // Passa el cercle a fraccions de la imatge ja retallada, que és la que es pinta.
    const left = -(box.trimOffsetLeft ?? 0);
    const top = -(box.trimOffsetTop ?? 0);
    const round = (v: number) => Math.round(v * 10000) / 10000;
    pan = { cx: round((pan.cx * width - left) / box.width), cy: round((pan.cy * height - top) / box.height), r: round((pan.r * width) / box.width) };
  }
  const result = await sharp(trimmed).resize(MAX, MAX, { fit: "inside", withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 90 }).toFile(out);
  sizes[name] = [result.width, result.height];
  console.log(`✓ ${out} ${result.width}×${result.height} ${Math.round(result.size / 1024)} KB`);
}

// Mides de cada peça i el cercle de la paella: el component col·loca les peces a partir d'això.
await writeFile(DATA, `${JSON.stringify({ sizes, pan }, null, 2)}\n`);
console.log(`✓ ${DATA}`);
