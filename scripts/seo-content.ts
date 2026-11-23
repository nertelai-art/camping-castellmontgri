// SEO i GEO dels textos del panell (23/11/2026): les paraules clau de cada secció en **negreta**, en els 5 idiomes, i el títol i la
// descripció per a Google de la portada. Només toca el que encara és com era: si una frase ja no hi és (el càmping ha canviat
// el text), la salta i ho diu.
//
//   node scripts/seo-content.ts                    → ensenya què canviaria al Supabase de .env.local, sense escriure res
//   node scripts/seo-content.ts --apply            → ho escriu
//   pnpm local node scripts/seo-content.ts --apply → al Supabase local

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types.ts";
import { boldPhrases } from "./lib/bold.ts";

type Locale = Database["public"]["Enums"]["locale"];

// Per secció i idioma, les frases que van en negreta: el que algú cercaria (allotjament, servei, lloc), dues o tres per text.
const KEYWORDS: Record<string, Record<Locale, string[]>> = {
  hero: {
    es: ["Camping y bungalows en L'Estartit", "Parque Natural del Montgrí", "Illes Medes"],
    ca: ["Càmping i bungalows a l'Estartit", "Parc Natural del Montgrí", "Illes Medes"],
    fr: ["Camping et bungalows à L'Estartit", "Parc naturel du Montgrí", "îles Medes"],
    en: ["Camping and bungalows in L'Estartit", "Montgrí", "Medes Islands"],
    nl: ["Camping en bungalows in L'Estartit", "Natuurpark Montgrí", "Medes-eilanden"],
  },
  welcome: {
    es: ["familias", "sol, playa y diversión"],
    ca: ["famílies", "sol, platja i diversió"],
    fr: ["familles", "soleil, de plage et de divertissement"],
    en: ["families", "sun, beach and fun"],
    nl: ["gezinnen", "zon, strand en plezier"],
  },
  accommodation: {
    es: ["alojamientos excepcionales en la Costa Brava", "tiendas de campaña", "bungalows"],
    ca: ["allotjaments excepcionals a la Costa Brava", "tendes de campanya", "bungalows"],
    fr: ["hébergements d'exception sur la Costa Brava", "tentes", "bungalows"],
    en: ["exceptional accommodations on the Costa Brava", "tents", "bungalows"],
    nl: ["uitzonderlijke accommodaties aan de Costa Brava", "tenten", "bungalows"],
  },
  services: {
    es: ["piscinas y toboganes", "pista de tenis", "parques infantiles", "supermercado"],
    ca: ["piscines i tobogans", "pista de tennis", "parcs infantils", "supermercat"],
    fr: ["piscines et toboggans", "court de tennis", "aires de jeux", "supermarché"],
    en: ["pools and slides", "tennis court", "playgrounds", "supermarket"],
    nl: ["zwembaden en glijbanen", "tennisbaan", "speeltuinen", "supermarkt"],
  },
  entertainment: {
    es: ["animación", "entretenimiento para todas las edades"],
    ca: ["animació", "entreteniment per a totes les edats"],
    fr: ["animation", "divertissements pour tous les âges"],
    en: ["animation", "entertainment for all ages"],
    nl: ["animatie", "entertainment voor alle leeftijden"],
  },
  gastronomy: {
    es: ["oferta gastronómica", "platos mediterráneos", "restaurantes"],
    ca: ["oferta gastronòmica", "plats mediterranis", "restaurants"],
    fr: ["offre gastronomique", "plats méditerranéens", "restaurants"],
    en: ["gastronomic offer", "Mediterranean dishes", "restaurants"],
    nl: ["gastronomische aanbod", "mediterrane gerechten", "restaurants"],
  },
  surroundings: {
    es: ["Costa Brava", "playas paradisíacas", "senderos"],
    ca: ["Costa Brava", "platges paradisíaques", "senders"],
    fr: ["Costa Brava", "plages paradisiaques", "sentiers"],
    en: ["Costa Brava", "paradisiacal beaches", "trails"],
    nl: ["Costa Brava", "paradijselijke stranden", "wandelpaden"],
  },
};

// Correccions de lletra que es van colar en passar del web antic (un apòstrof convertit en «?»).
const FIXES: { section: string; locale: Locale; from: string; to: string }[] = [{ section: "accommodation", locale: "ca", from: "l?essència", to: "l'essència" }];

// La portada a Google: què és i on és primer (el que es cerca), i el nom amb què el coneixen. Uns 50-60 caràcters de títol i
// 150-160 de descripció, el que Google ensenya sense tallar.
const SEO: Record<Locale, { title: string; description: string }> = {
  es: {
    title: "Camping en L'Estartit, Costa Brava | Castell Montgrí",
    description: "Camping en L'Estartit con bungalows, mobile homes y parcelas, junto al Parque Natural del Montgrí y las Illes Medes. Piscinas, animación y restaurantes.",
  },
  ca: {
    title: "Càmping a l'Estartit, Costa Brava | Castell Montgrí",
    description: "Càmping a l'Estartit amb bungalows, mobile homes i parcel·les, al costat del Parc Natural del Montgrí i les Illes Medes. Piscines, animació i restaurants.",
  },
  fr: {
    title: "Camping à L'Estartit, Costa Brava | Castell Montgrí",
    description: "Camping à L'Estartit avec bungalows, mobil-homes et emplacements, près du Parc naturel du Montgrí et des îles Medes. Piscines, animation et restaurants.",
  },
  en: {
    title: "Campsite in L'Estartit, Costa Brava | Castell Montgrí",
    description: "Campsite in L'Estartit with bungalows, mobile homes and pitches, next to the Montgrí Natural Park and the Medes Islands. Pools, entertainment and restaurants.",
  },
  nl: {
    title: "Camping in L'Estartit, Costa Brava | Castell Montgrí",
    description: "Camping in L'Estartit met bungalows, stacaravans en kampeerplaatsen, naast het Natuurpark Montgrí en de Medes-eilanden. Zwembaden, animatie en restaurants.",
  },
};

const args = process.argv.slice(2);
const apply = args.includes("--apply");
process.loadEnvFile(args.find((a) => !a.startsWith("--")) ?? ".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "");
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Falten NEXT_PUBLIC_SUPABASE_URL i SUPABASE_SECRET_KEY");
const db = createClient<Database>(url, key, { auth: { persistSession: false } });

const { data: rows, error } = await db.from("section_translations").select("section_key, locale, body").in("section_key", Object.keys(KEYWORDS));
if (error) throw new Error(error.message);

let changes = 0;
for (const row of rows) {
  if (!row.body) continue;
  let body = row.body;
  for (const fix of FIXES) if (fix.section === row.section_key && fix.locale === row.locale) body = body.replaceAll(fix.from, fix.to);
  const { text, missing } = boldPhrases(body, KEYWORDS[row.section_key]?.[row.locale] ?? []);
  for (const phrase of missing) console.warn(`! ${row.section_key}/${row.locale}: no hi ha «${phrase}»`);
  if (text === row.body) continue;
  changes++;
  console.log(`\n${row.section_key}/${row.locale}\n  ${text}`);
  if (apply) {
    const { error } = await db.from("section_translations").update({ body: text }).eq("section_key", row.section_key).eq("locale", row.locale);
    if (error) throw new Error(`${row.section_key}/${row.locale}: ${error.message}`);
  }
}

const { data: seo, error: seoError } = await db.from("site_settings_translations").select("locale, seo_title, seo_description");
if (seoError) throw new Error(seoError.message);
for (const row of seo) {
  const next = SEO[row.locale];
  if (row.seo_title === next.title && row.seo_description === next.description) continue;
  changes++;
  console.log(`\nGoogle/${row.locale}\n  ${next.title} (${next.title.length})\n  ${next.description} (${next.description.length})`);
  if (apply) {
    const { error } = await db.from("site_settings_translations").update({ seo_title: next.title, seo_description: next.description }).eq("locale", row.locale);
    if (error) throw new Error(`Google/${row.locale}: ${error.message}`);
  }
}

console.log(`\n${changes} textos ${apply ? "desats" : "per canviar (res desat: afegeix --apply)"}.`);
if (apply) console.log("La web els ensenya quan s'invaliden les etiquetes «sections» i «site_settings» (desar al panell o /api/revalidate).");
