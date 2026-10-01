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
- Remot: projecte «Camping Castell montgri» (ref `rfgmpwefytrksswrcuvm`, París), a l'organització de
  la CLI de Supabase de l'usuari. La CLI ja hi està enllaçada: migracions amb
  `pnpm exec supabase db push --linked` (primer `--dry-run`) i seed amb `pnpm seed` (claus a `.env.local`).
- El projecte `ddnfdulaxrnmapxbsugn` (organització Demos_Nertel, el del connector MCP) va ser el primer
  intent i ja no s'usa.
- Una migració nova = un fitxer nou. Mai s'edita una migració ja aplicada al remot.

## Mapa interactiu (maqueta 3D)

- Els punts són a `map_points` en % de la il·lustració, amb `icon` (clau de `src/lib/map/icons.ts`:
  les 39 icones de la llegenda del dibuix). La font inicial és `scripts/content/map-points.json`,
  en píxels del plànol (3000×1845): més fàcil de revisar.
- `scripts/content/map-plots.json`: el número i la posició de les 966 parcel·les i allotjaments del dibuix
  (`text` = número pintat a la parcel·la, `red` = allotjament del càmping, `cream` = operador turístic).
  Es van llegir a mà sobre retalls ampliats amb quadrícula, en dues passades independents que van coincidir:
  l'OCR (tesseract) no arriba al 30 % amb lletra de 7 px. Si canvia el plànol, s'han de tornar a llegir.
- `scripts/content/map-buildings.json`: els edificis grans (restaurants, recepció, església, sanitaris),
  col·locats a mà, i les zones on no hi ha d'haver arbres (camps d'esport).
- `pnpm map:build` llegeix la il·lustració i aquests fitxers i en treu la maqueta:
  `src/components/scene/map-scene.data.json` (arbres, cases, edificis i números), `public/map/ground.jpg`
  (el dibuix sense rètols, logo, cases ni icones) i `public/map/icons.png` (l'atles d'icones). S'executa a mà;
  el resultat va al git. Cada rètol d'allotjament té la seva casa (`scripts/lib/map-plots.ts`); la detecció
  de colors i arbres és a `scripts/lib/map-detect.ts`. Tot amb proves.
  `pnpm map:build --debug <dir>` pinta el que ha detectat sobre el plànol: mira-ho ampliat abans de donar-ho per bo.
- `map-explorer.tsx`: tancat, el mapa és el **fons de la secció** (no agafa ni ratolí ni scroll, la càmera es gronxa);
  en clicar-hi s'obre a pantalla completa com un diàleg (`position: fixed`, per això la secció no pot tenir
  `overflow`, `transform` ni `contain`), amb la columna del cercador de números, els filtres i la fitxa.
  És el mateix canvas: només canvia de mida.
- `src/components/scene/MapScene.tsx`: arbres, cases i edificis instanciats, ombres calculades un sol cop
  (`shadowMap.autoUpdate = false`), `frameloop="demand"`. La càmera és la classe `CameraRig`, fora de React:
  el lint del compilador de React no deixa mutar el que retornen els hooks (`camera`, `gl`).
- Marcadors, números i etiquetes són HTML sobre el canvas, projectats a cada fotograma: accessibles i nítids.
  De prop surten els números dels bungalows a la vista; el ratolí marca la parcel·la més propera.
- `src/lib/map/plots.ts` pesa (un miler de números): només l'importen els visors, que es carreguen amb `dynamic()`.
- Sense WebGL es veu `map-flat.tsx` (la il·lustració amb zoom); la seva geometria és a `src/lib/map/viewport.ts`.
- «Veure al mapa» fa servir un esdeveniment de finestra (`src/lib/map/events.ts`) i obre el mapa.

## Material de referència

`reference/` conté el contingut extret del web actual (textos en 5 idiomes,
JSON estructurats, marca). `reference/images/` no va al git: les imatges del
client es pugen a Supabase Storage amb el script de seed.

## Portes

- `pnpm check` (typecheck + lint + tests) i `gitleaks` al hook de pre-push
  (`.githooks/`, s'activa sol amb `pnpm install`).
- La CI fa `pnpm build` (contra el Supabase de preproducció, amb variables de repo públiques)
  i, si canvia `supabase/`, les proves RLS contra un Postgres de debò.
## Branques i desplegament

- `main` = producció. A Vercel és la branca de producció (cada commit a `main` desplega a
  producció). Protegida a GitHub: només per PR, sense `--force` ni esborrat.
  **Hi arriba només quan l'usuari ho diu, cada vegada**, per PR des de `developer`.
- `developer` = integració, on es fusionen les PR (merge commit). Protegida contra `--force` i esborrat.
- `feature/<nom>` = feina en curs. Surten de `developer` (o d'una altra `feature/` si van apilades)
  i s'hi tornen per PR. Cada push a una `feature/` té la seva previsualització a Vercel.
- **No reanomenis una branca que tingui una PR oberta**: GitHub tanca la PR i no es pot reobrir.
- Projecte Vercel: `camping-castellmontgri` (equip `nertelai-7298s-projects`). Els builds llegeixen
  els valors públics de `.env.production` (URL i clau publicable de Supabase, DSN de Sentry).

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

- Escenes a `src/components/scene/`: `MapScene` (la maqueta del mapa) i `FoodShowcase` + `FoodScene`
  (paella, gelat, copa). Fases a `phases.ts`, amb proves. El hero és una foto, sense 3D.
- three.js no ha d'entrar a la càrrega inicial: les escenes es carreguen amb `dynamic()` quan la secció
  s'acosta a la pantalla (`useNearViewport`).
- Textures d'imatges de Storage: a través de l'optimitzador de Next (`/_next/image?...&w=2048&q=75`),
  mateix origen. Next 16 només accepta la qualitat 75 si no se'n configuren més.
- Vidre sobre canvas transparent: material transparent, no `transmission` (sortia blanc).
- Per revisar les escenes sense el panell (quan està amagat, `requestAnimationFrame` no corre):
  Chrome sense cap amb playwright-core i captures al 0/25/50/75/100 %.

- Respectar sempre `prefers-reduced-motion`: cada animació ha de tenir un estat
  final estàtic correcte.
- Les animacions de scroll no poden bloquejar el LCP: el hero es pinta primer i
  l'animació s'hi afegeix després.
- Res d'`opacity: 0` en elements visibles a la càrrega (no compten per al LCP i l'auditoria de
  contrast els veu esvaïts). `.reveal` només desplaça.
- Res d'`animation-timeline: view()` (el panell de previsualització deixa de pintar) ni de capes
  fixes a pantalla completa amb `mix-blend-mode` (recomposició a cada fotograma de scroll).
- Sentry del navegador es carrega quan el navegador està ociós (`instrumentation-client.ts`).
