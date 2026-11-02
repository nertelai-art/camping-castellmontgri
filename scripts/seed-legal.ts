// Les pàgines legals del web antic (reference/) a Supabase, com a seccions: privacitat, galetes, avís legal i condicions de reserva.
// Només afegeix el que no hi és: si el càmping ja les ha editat al panell, no les toca.
//
//   node scripts/seed-legal.ts               → .env.local
//   pnpm local node scripts/seed-legal.ts    → el Supabase local

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Database } from "../src/lib/supabase/database.types.ts";
import { LEGAL_PAGES, type LegalSlug } from "../src/lib/content/legal.ts";
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
const FIRST_ORDER = 900;

const envFile = process.argv[2] ?? ".env.local";
process.loadEnvFile(envFile);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "");
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error(`Falten NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY a ${envFile}`);
const db = createClient<Database>(url, secret, { auth: { persistSession: false } });
console.log(`▶ Pàgines legals contra ${url}`);

const fail = (what: string, error: { message: string } | null) => {
  if (error) throw new Error(`${what}: ${error.message}`);
};

let order = FIRST_ORDER;
for (const [slug, key] of Object.entries(LEGAL_PAGES) as [LegalSlug, string][]) {
  const { error } = await db.from("sections").upsert({ key, sort_order: order++ }, { onConflict: "key", ignoreDuplicates: true });
  fail(`secció ${key}`, error);
  for (const locale of LOCALES) {
    const { data, content } = parseFrontmatter(await readFile(join("reference", "content", locale, `${SOURCE[slug]}.md`), "utf8"));
    const title = (data.title ?? slug).replace(/\s*::.*$/, "").trim();
    const { error: textError } = await db
      .from("section_translations")
      .upsert({ section_key: key, locale, title, body: content.trim() }, { onConflict: "section_key,locale", ignoreDuplicates: true });
    fail(`text ${key}/${locale}`, textError);
  }
  console.log(`  ✓ ${slug}`);
}
