// Prepara les peces de l'animació de gastronomia: treu el fons blanc de cada imatge generada, la retalla
// i la desa a public/food/ en WebP amb transparència.
//
//   pnpm food:build
//
// Les imatges d'origen (reference/images/food-ai/, fora del git) es generen amb la skill «generar-imatges»
// a partir de scripts/content/food-pieces.prompts.json. Són generades amb IA, no fotos del càmping.

import { mkdir, readdir } from "node:fs/promises";
import { join, parse } from "node:path";
import sharp from "sharp";
import { backgroundMask } from "./lib/cutout.ts";

const SOURCE = "reference/images/food-ai";
const OUT = "public/food";
const MAX = 640; // costat més llarg, en píxels: a pantalla cap peça passa de ~500

await mkdir(OUT, { recursive: true });
for (const file of (await readdir(SOURCE)).filter((f) => /\.(jpe?g|png)$/i.test(f))) {
  const name = parse(file).name;
  const { data, info } = await sharp(join(SOURCE, file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // Canal de transparència, d'un sol byte per píxel.
  let alpha: Buffer;
  if (name === "rice") {
    // L'arròs és una textura que omple el quadre: es retalla en disc, per posar-lo dins la paella.
    const disc = Buffer.from(`<svg width="${width}" height="${height}"><circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 2 - 6}" fill="#fff"/></svg>`);
    alpha = await sharp(disc).resize(width, height).blur(3).toColourspace("b-w").raw().toBuffer();
  } else {
    // Fons: el blanc (i l'ombra grisa clara) que toca la vora de la imatge. El blanc de dins de la peça es queda.
    const background = backgroundMask(data, width, height);
    const mask = Buffer.alloc(width * height);
    for (let p = 0; p < mask.length; p++) mask[p] = background[p] ? 0 : 255;
    alpha = await sharp(mask, { raw: { width, height, channels: 1 } }).blur(1.2).toColourspace("b-w").raw().toBuffer();
  }
  if (alpha.length !== width * height) throw new Error(`${name}: el canal alfa fa ${alpha.length} bytes i n'haurien de ser ${width * height}`);

  // Es munta el RGBA a mà: és més clar que encadenar canals i no depèn de com sharp interpreti cada buffer.
  const rgba = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    rgba[p * 4] = data[p * 3]!;
    rgba[p * 4 + 1] = data[p * 3 + 1]!;
    rgba[p * 4 + 2] = data[p * 3 + 2]!;
    rgba[p * 4 + 3] = alpha[p]!;
  }

  const out = join(OUT, `${name}.webp`);
  const trimmed = await sharp(rgba, { raw: { width, height, channels: 4 } }).trim({ threshold: 8 }).png().toBuffer();
  const result = await sharp(trimmed).resize(MAX, MAX, { fit: "inside", withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 90 }).toFile(out);
  console.log(`✓ ${out} ${result.width}×${result.height} ${Math.round(result.size / 1024)} KB`);
}
