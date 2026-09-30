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
- Cada lectura queda a la caché de Next amb dues etiquetes: `content` i el nom de la taula
  consultada (`sections`, `accommodations`…). Les traduccions i galeries van dins la consulta
  del pare: en desar `section_translations` s'invalida `sections`. `/api/revalidate` expira
  de seguida (`{ expire: 0 }`), no per temps.
- Les funcions de rol (`is_editor`, `is_admin`) viuen a l'esquema `private`, fora de l'API.
- Les polítiques RLS tenen proves pgTAP a `supabase/tests/`. Qualsevol canvi de polítiques
  hi afegeix el seu cas.

## Supabase: local i remot

- Local amb Docker: `pnpm exec supabase start` (ports 556xx, per no xocar amb altres projectes).
  `pnpm db:reset` aplica les migracions, `pnpm seed` hi carrega el contingut, `pnpm db:test` passa les proves RLS.
- Remot: projecte `camping-castellmontgri` (ref `ddnfdulaxrnmapxbsugn`, París). Les migracions s'hi
  apliquen amb el mateix SQL que hi ha a `supabase/migrations/`, i s'hi fa el seed amb
  `pnpm seed .env.preview` (fitxer local amb la clau secreta, fora del git).
- Una migració nova = un fitxer nou. Mai s'edita una migració ja aplicada al remot.

## Plànol interactiu

- Els punts són a `map_points` en % de la il·lustració. La font inicial és
  `scripts/content/map-points.json`, en píxels del plànol (3000×1845): més fàcil de revisar.
- Per comprovar-ne la posició sense navegador: dibuixar-los sobre el plànol amb sharp (crop +
  composite) i mirar-ho ampliat.
- La geometria del visor (límits, zoom al voltant d'un punt, centrar) és a `src/lib/map/viewport.ts`
  amb proves. «Veure al plànol» fa servir un esdeveniment de finestra (`src/lib/map/events.ts`).

## Material de referència

`reference/` conté el contingut extret del web actual (textos en 5 idiomes,
JSON estructurats, marca). `reference/images/` no va al git: les imatges del
client es pugen a Supabase Storage amb el script de seed.

## Portes

- `pnpm check` (typecheck + lint + tests) i `gitleaks` al hook de pre-push
  (`.githooks/`, s'activa sol amb `pnpm install`).
- La CI fa `pnpm build` (contra el Supabase de preproducció, amb variables de repo públiques)
  i, si canvia `supabase/`, les proves RLS contra un Postgres de debò.
- Branca d'integració: `developer`. Preproducció = previsualitzacions de Vercel.
  **Producció només quan ho digui l'usuari, cada vegada.**

## Disseny

- Colors només a través dels tokens de `globals.css` (`paper`, `ink`, `olive`, `terra`…). Les
  franges amb text clar fan servir `band-olive`, `band-terra` i `band-sea`, que no canvien en mode
  fosc: si no, el text crema perd contrast.
- Tipografies: Fraunces (només eix SOFT, sense cursiva) i Lato 400/700. Afegir un pes o una
  cursiva són desenes de KB que endarrereixen el LCP a mòbil.
- Les seccions sota el plec porten `.cv` (`content-visibility: auto`).

## Animacions

Les escenes 3D lligades al scroll segueixen la skill `scroll-3d-scenes` (plantilles i regles de
rendiment). Res de vídeo ni de models externs si es pot modelar per codi.

- Respectar sempre `prefers-reduced-motion`: cada animació ha de tenir un estat
  final estàtic correcte.
- Les animacions de scroll no poden bloquejar el LCP: el hero es pinta primer i
  l'animació s'hi afegeix després.
- Res d'`opacity: 0` en elements visibles a la càrrega (no compten per al LCP i l'auditoria de
  contrast els veu esvaïts). `.reveal` només desplaça.
- Res d'`animation-timeline: view()` (el panell de previsualització deixa de pintar) ni de capes
  fixes a pantalla completa amb `mix-blend-mode` (recomposició a cada fotograma de scroll).
- Sentry del navegador es carrega quan el navegador està ociós (`instrumentation-client.ts`).
