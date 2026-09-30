# Natura Village Castell Montgrí — web nova

Web del Càmping Castell Montgrí (L'Estartit, Costa Brava; marca «Natura Village»,
Grup Mascort). Landing molt animada + panell d'administració des d'on el client
edita gairebé tot el contingut. El pla és a [ROADMAP.md](ROADMAP.md).

Valen les regles de casa (`~/.claude/CLAUDE.md`). Aquí només les afino.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 6 · Tailwind 4 ·
next-intl 4 · Supabase (Postgres, Auth, Storage) · Vercel · Sentry · pnpm.

Per què TypeScript 6 i ESLint 9 i no l'última major: `typescript-eslint` 8
accepta `typescript <6.1` i `eslint-plugin-react` (dins `eslint-config-next`) no
arriba a ESLint 10. `@types/node` va a 22 perquè correm Node 22 (`.nvmrc`).

## Idiomes

`es` (per defecte), `ca`, `fr`, `en`, `nl` — els mateixos que el web actual i amb
el mateix prefix d'URL (`/es`, `/ca`…), perquè no es perdi el posicionament.

- `messages/*.json`: **només** textos d'interfície (menú, botons, etiquetes).
  Tots els idiomes han de tenir les mateixes claus; ho comprova un test.
- Tot el contingut editable (textos, allotjaments, serveis, imatges…) viu a
  Supabase i s'edita des de `/admin`. No escriguis contingut del client al codi.

## Contingut editable

- Cada entitat té una taula base i una taula `*_translations (locale, …)`.
  Els tipus es generen de l'esquema (`supabase gen types`), mai a mà.
- La web pública llegeix amb la clau publicable i RLS (només files publicades).
  L'admin escriu amb la sessió de l'usuari; RLS ho restringeix per rol.
- La clau secreta de Supabase només en scripts de servidor (seed, migració).
  Supabase només s'importa des de `src/lib/supabase/`: és la seva frontera.
- Després de desar a l'admin es revalida per etiqueta (`revalidateTag`), no per temps.

## Material de referència

`reference/` conté el contingut extret del web actual (textos en 5 idiomes,
JSON estructurats, marca). `reference/images/` no va al git: les imatges del
client es pugen a Supabase Storage amb el script de seed.

## Portes

- `pnpm check` (typecheck + lint + tests) i `gitleaks` al hook de pre-push
  (`.githooks/`, s'activa sol amb `pnpm install`).
- La CI només fa `pnpm build`.
- Branca d'integració: `developer`. Preproducció = previsualitzacions de Vercel.
  **Producció només quan ho digui l'usuari, cada vegada.**

## Animacions

- Respectar sempre `prefers-reduced-motion`: cada animació ha de tenir un estat
  final estàtic correcte.
- Les animacions de scroll no poden bloquejar el LCP: el hero es pinta primer i
  l'animació s'hi afegeix després.
