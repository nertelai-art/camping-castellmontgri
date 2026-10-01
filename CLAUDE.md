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

## Panell d'administració (`/admin`)

- Fora de `[locale]`, amb el seu document (`src/app/admin/layout.tsx`), en català i sense indexar.
- **Sessió**: Supabase Auth amb correu i contrasenya, en galetes (`@supabase/ssr`). `src/proxy.ts` la refresca a
  cada petició a `/admin`; qui pot entrar ho decideix el layout de `(panel)` amb `currentEditor()` (compte + fila a
  `profiles`). Les accions de servidor ho tornen a comprovar: són endpoints públics.
- **Escriptura**: amb la sessió de l'editor i la clau publicable; RLS és qui deixa escriure. Cap clau secreta al panell.
- **Què s'edita** és a `src/lib/admin/entities.ts`: taula, taula de traduccions i camps de cada entitat. El formulari,
  la validació (`parseContent`, amb proves) i el desat surten d'allà: un camp editable nou és una línia nova.
- En desar s'invaliden les etiquetes de caché de l'entitat (`tags`: les taules des d'on la web la llegeix; els allotjaments,
  per exemple, es llegeixen dins `accommodation_categories`): la web ho ensenya de seguida.
- Tipus de camp: text, número, data, casella, estat i posició al mapa (`MapPositionField`, geometria a `src/lib/map/position.ts`) a la base; text curt, llarg i llista (una línia per element, `text[]`)
  per idioma. `site_settings` és d'una sola fila (`single`) i les seves traduccions no tenen clau forana.
- Els formularis s'envien a mà dins d'una transició, no amb `action={…}`: React buida el formulari en acabar una
  acció i, amb un error de validació, es perdria el que s'ha escrit.
- **Fotos** (`ImageField`, `replaceImageAction`): el navegador redueix la foto a 2400 px i la passa a JPEG abans d'enviar-la
  (Vercel no accepta cossos de més de 4,5 MB); el servidor comprova que és un JPEG i en llegeix la mida de la capçalera
  (`src/lib/admin/image.ts`), la puja a `media/panell/<entitat>/<uuid>.jpg` i crea la fila a `media`. La foto anterior no s'esborra.
- **Registre de canvis** (`change_log`, `/admin/changes`): l'apunta l'acció de servidor després de desar, amb la sessió de l'editor.
  RLS només deixa afegir-hi (signat amb el propi compte) i llegir-lo: no es pot modificar ni esborrar des de l'API.
- **Usuaris**: el compte es crea al tauler de Supabase (la persona hi tria la contrasenya) i `pnpm editor:grant <correu> [editor|admin|cap]`
  li dona o li treu l'accés. No hi ha registre obert.
- **Proves en local**: `pnpm exec supabase start`, `pnpm local pnpm seed`, `pnpm local node scripts/seed-local-editor.ts`
  (usuari de prova, contrasenya a `.env.local-editor`), `pnpm local next build` i la previsualització `web-local` (port 3200).
  `pnpm local <ordre>` executa qualsevol cosa contra el Supabase local sense tocar `.env.local`.

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
- `scripts/content/map-buildings.json`: els edificis grans (restaurants, recepció, església, sanitaris) com a
  volums mesurats a mà sobre retalls amb quadrícula (teulada a dues aigües, a quatre o plana), les pistes
  d'esport (`sports`: es redibuixen netes, `scripts/lib/map-sports.ts`) i les zones sense arbres.
- El terra no es difumina: el que s'esborra del dibuix (cases, icones, rètols) s'omple capa a capa continuant
  el color de la vora (`inpaint` a `map-detect.ts`). Una mitjana de finestra deixava taques grises, sobretot a l'aigua.
- `pnpm map:build` llegeix la il·lustració i aquests fitxers i en treu la maqueta:
  `src/components/scene/map-scene.data.json` (arbres, cases, edificis i números), `public/map/ground.jpg`
  (el dibuix sense rètols, logo, cases ni icones) i `public/map/icons.png` (l'atles d'icones). S'executa a mà;
  el resultat va al git. Cada rètol d'allotjament té la seva casa (`scripts/lib/map-plots.ts`); la detecció
  de colors i arbres és a `scripts/lib/map-detect.ts`. Tot amb proves.
  `pnpm map:build --debug <dir>` pinta el que ha detectat sobre el plànol: mira-ho ampliat abans de donar-ho per bo.
- `map-explorer.tsx`: tancat, el mapa és el **fons de la secció** (no agafa ni ratolí ni scroll, la càmera es gronxa);
  en clicar-hi s'obre a pantalla completa com un diàleg (`position: fixed`, per això la secció no pot tenir
  `overflow`, `transform` ni `contain`). És el mateix canvas: només canvia de mida.
  A la columna: el cercador de números i un desplegable per tipus de lloc. El desplegable obert fa de filtre
  del mapa, i el lloc triat (a la llista o al mapa) obre la seva fitxa a sota mateix del nom.
  L'obertura i el tancament són animacions CSS (`map-*` a `globals.css`); amb moviment reduït no n'hi ha.
- Un lloc només té foto i descripció si el punt del mapa enllaça un servei, restaurant, activitat o allotjament
  que en tingui. Els punts solts (minigolf, caixer, mirador…) no en tenen fins que s'editin a l'admin.
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

L'única escena 3D és la maqueta del mapa (skill `scroll-3d-scenes`: plantilles i regles de rendiment).
Res de vídeo ni de models externs si es pot modelar per codi.

- `src/components/scene/`: `MapScene` (la maqueta) i `FoodShowcase` (gastronomia). La gastronomia **no és 3D**:
  cada plat es munta peça a peça amb `transform` guiat pel scroll (la paella buida, l'arròs, el marisc; el
  cucurutxo i les boles). Les peces i on va cadascuna són a `food-pieces.ts`; quan arriba cadascuna, a
  `pieceTiming` (`phases.ts`), amb proves. Un pas sense peces ensenya les fotos reals dels seus locals.
- Les peces de menjar (`public/food/*.webp`) són **generades amb IA**, no fotos del càmping: les peticions són a
  `scripts/content/food-pieces.prompts.json`, es generen amb la skill `generar-imatges` cap a
  `reference/images/food-ai/` (fora del git) i `pnpm food:build` en treu el fons blanc i les retalla.
  Falten les del pas «Per beure» (copa, taronja, menta, canya) i la bola de xocolata: el crèdit gratuït
  mensual de Hugging Face es va acabar a la desena imatge.
- three.js no entra a la càrrega inicial: el mapa es carrega amb `dynamic()` quan és a prop **i** qui visita ja
  ha fet alguna cosa (`useInteracted`). Fins llavors fa de fons el plànol dibuixat.
- El que bloquejava el fil principal i com s'ha resolt (mesurat amb Long Animation Frames i perfil de CPU):
  - Compilar shaders en dibuixar: més de 2 s a Windows (ANGLE tradueix a HLSL). Ara `gl.compileAsync` abans del
    primer fotograma (`frameloop="never"` fins que acaba) i un sol programa per a tota la maqueta (tot `flatShading`).
  - `<Preload>` i `<Environment>` de drei compilen i dibuixen dins d'un efecte de React: no s'han de fer servir.
  - Crear un context WebGL de prova per saber si n'hi ha: car. `useRenderMode` només mira l'API i `WebGLBoundary`
    recull la fallada si el context de debò no es pot crear.
  - La textura del terra (5,5 MP) es descodifica fora del fil principal (`createImageBitmap`); a mòbil, la de 2048 px.
- El gronxament del mapa de fons va a uns 30 fps i només mentre és a la vista.
- Per mesurar: `pnpm build` + `pnpm start`, Lighthouse **sense** `--use-angle=swiftshader` (el GL per programari
  infla el TBT i endarrereix la primera pintura un segon) i un Chrome sense cap amb GPU per als fotogrames.
  Referència (portàtil, octubre 2026): escriptori 97-98, mòbil 87-88, TBT 110-140 ms; fotograma més llarg en
  carregar el mapa, 170 ms.
- Per revisar el mapa sense el panell (quan està amagat, `requestAnimationFrame` no corre): Chrome sense cap amb
  playwright-core.

- Respectar sempre `prefers-reduced-motion`: cada animació ha de tenir un estat
  final estàtic correcte.
- Les animacions de scroll no poden bloquejar el LCP: el hero es pinta primer i
  l'animació s'hi afegeix després.
- Res d'`opacity: 0` en elements visibles a la càrrega (no compten per al LCP i l'auditoria de
  contrast els veu esvaïts). `.reveal` només desplaça.
- Res d'`animation-timeline: view()` (el panell de previsualització deixa de pintar) ni de capes
  fixes a pantalla completa amb `mix-blend-mode` (recomposició a cada fotograma de scroll).
- Sentry del navegador es carrega quan el navegador està ociós (`instrumentation-client.ts`).
