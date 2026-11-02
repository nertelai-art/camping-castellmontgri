// Treu de reference/content/site-map.json només el que fan servir les redireccions (clau, tipus i adreça en cada idioma) cap a
// src/lib/seo/old-urls.json. reference/ no puja a Vercel (.vercelignore), i el mapa del web sencer pesa 200 KB de títols i descripcions.
//
//   node scripts/build-old-urls.ts

import { readFile, writeFile } from "node:fs/promises";

type Entry = { url?: string } | null | undefined;
type Page = { key: string; group: string } & Record<string, unknown>;

const LOCALES = ["es", "ca", "fr", "en", "nl"];
const pages = JSON.parse(await readFile("reference/content/site-map.json", "utf8")) as Page[];
const compact = pages.map((page) => ({
  key: page.key,
  group: page.group,
  ...Object.fromEntries(LOCALES.flatMap((locale) => {
    const url = (page[locale] as Entry)?.url;
    return url ? [[locale, { url }]] : [];
  })),
}));
await writeFile("src/lib/seo/old-urls.json", `${JSON.stringify(compact, null, 1)}\n`);
console.log(`✓ ${compact.length} pàgines del web antic`);
