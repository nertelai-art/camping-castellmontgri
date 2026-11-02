// Les pàgines legals a Supabase, com a seccions: privacitat, galetes, avís legal i condicions de reserva.
// El text surt de scripts/content/legal/<idioma>/<pàgina>.md si n'hi ha (els redactats per al web nou) i, si no, del web antic (reference/).
// Per defecte només afegeix el que no hi és: si el càmping ja les ha editat al panell, no les toca.
//
//   node scripts/seed-legal.ts                              → .env.local
//   pnpm local node scripts/seed-legal.ts                   → el Supabase local
//   node scripts/seed-legal.ts .env.local --replace privacy,cookies
//                                                           → substitueix aquestes pàgines pel text de scripts/content/legal
//                                                             (s'esborra el que s'hi hagi editat: només quan es vol)

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Database } from "../src/lib/supabase/database.types.ts";
import { isLegalSlug, LEGAL_PAGES, type LegalSlug } from "../src/lib/content/legal.ts";
import { parseFrontmatter } from "./lib/markdown.ts";

type Locale = Database["public"]["Enums"]["locale"];
const LOCALES: Locale[] = ["es", "ca", "fr", "en", "nl"];
// D'on surt cada pàgina al web antic.
const SOURCE: Record<LegalSlug, string> = {
  privacy: "politica-de-privacidad",
  cookies: "politica-de-cookies",
  "legal-notice": "aviso-legal",
  "booking-conditions": "condiciones-de-reservas",
};
// El títol dels textos nous (els antics el porten a la capçalera del fitxer).
const TITLES: Partial<Record<LegalSlug, Record<Locale, string>>> = {
  privacy: { es: "Política de privacidad", ca: "Política de privacitat", fr: "Politique de confidentialité", en: "Privacy policy", nl: "Privacybeleid" },
  cookies: { es: "Política de cookies", ca: "Política de galetes", fr: "Politique de cookies", en: "Cookie policy", nl: "Cookiebeleid" },
};
const FIRST_ORDER = 900;

const args = process.argv.slice(2);
const replaceAt = args.indexOf("--replace");
const replace = replaceAt >= 0 ? (args[replaceAt + 1] ?? "").split(",").filter(Boolean) : [];
for (const slug of replace) if (!isLegalSlug(slug)) throw new Error(`--replace: «${slug}» no és cap pàgina legal`);
const envFile = args.find((a, i) => !a.startsWith("--") && i !== replaceAt + 1) ?? ".env.local";

process.loadEnvFile(envFile);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "");
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error(`Falten NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY a ${envFile}`);
const db = createClient<Database>(url, secret, { auth: { persistSession: false } });
console.log(`▶ Pàgines legals contra ${url}${replace.length ? ` (substitueix: ${replace.join(", ")})` : ""}`);

const fail = (what: string, error: { message: string } | null) => {
  if (error) throw new Error(`${what}: ${error.message}`);
};

async function text(slug: LegalSlug, locale: Locale): Promise<{ title: string; body: string; fresh: boolean }> {
  try {
    const body = await readFile(join("scripts", "content", "legal", locale, `${slug}.md`), "utf8");
    const title = TITLES[slug]?.[locale];
    if (!title) throw new Error(`Falta el títol de ${slug}/${locale} a TITLES`);
    return { title, body: body.trim(), fresh: true };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const { data, content } = parseFrontmatter(await readFile(join("reference", "content", locale, `${SOURCE[slug]}.md`), "utf8"));
  return { title: (data.title ?? slug).replace(/\s*::.*$/, "").trim(), body: content.trim(), fresh: false };
}

let order = FIRST_ORDER;
for (const [slug, key] of Object.entries(LEGAL_PAGES) as [LegalSlug, string][]) {
  const { error } = await db.from("sections").upsert({ key, sort_order: order++ }, { onConflict: "key", ignoreDuplicates: true });
  fail(`secció ${key}`, error);
  const overwrite = replace.includes(slug);
  for (const locale of LOCALES) {
    const { title, body, fresh } = await text(slug, locale);
    if (overwrite && !fresh) throw new Error(`--replace ${slug}: no hi ha text nou a scripts/content/legal/${locale}/${slug}.md`);
    const { error: textError } = await db
      .from("section_translations")
      .upsert({ section_key: key, locale, title, body }, { onConflict: "section_key,locale", ignoreDuplicates: !overwrite });
    fail(`text ${key}/${locale}`, textError);
  }
  console.log(`  ✓ ${slug}${overwrite ? " (substituïda)" : ""}`);
}
