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
- **Com s'hi arriba** és a `src/lib/admin/nav.ts` (amb proves): el menú per pàgines del web i temes (`NAV_GROUPS`: la portada, pàgines del web, allotjaments,
  al càmping, textos legals i dades; una pàgina del web és un enllaç directe a la fitxa de la seva secció), les tasques de la pàgina d'inici
  (`TASKS`) i el que queda per acabar (`pendingWork`: el que no es veu a la web i el que falta traduir). Una entitat nova ha d'anar al menú.
  Només es marca l'opció més concreta (`currentHref`): la fitxa de Gastronomia no marca també «Tots els textos».
- **Carcassa** (`AdminShell`): barra lateral fosca amb icones (lucide-react: al panell i a la pàgina de cada allotjament, que és de servidor i no el porta al navegador; quina icona toca a cada opció és un nom a `nav.ts`
  i el dibuix és a `admin-icons.tsx`), que es plega a l'escriptori (galeta `admin-sidebar`, del panell) i al mòbil és un calaix (tancat, `invisible`:
  fora del teclat); a dalt, «Edita sobre la web», «Veure la web» i el compte. Cada pàgina comença amb `PageHeader`.
- **Tauler** (`/admin`): editar sobre la web, crear contingut nou (`CREATABLE`, `createLabel`), les xifres, les pàgines del web (`SITE_PAGES` i
  `LEGAL_SITE_PAGES`: foto de la secció, si es veu, què falta traduir, i «Sobre la web» o «Textos i fotos»), el que queda per acabar i l'activitat recent.
  L'editor visual s'obre en una pàgina amb `?page=` (`visualPageHref`); `startPage` només hi deixa posar una pàgina del web coneguda.
- **La portada** (`/admin/home`, `HomeBlocks`): els blocs de la pàgina principal amb fletxes i casella. L'ordre és el `sort_order` de les seves seccions
  (`src/lib/content/home.ts`, `HOME_BLOCKS`, amb proves) i si surten, el seu `is_visible`; la portada els pinta en aquest ordre. El hero va sempre primer.
  Les portes a les pàgines, com arribar-hi, el viatge amb la IA i les opinions també són seccions (`explore`, `directions`, `trip`, `testimonials`): el títol s'edita al panell.
- **Opinions** (`testimonials.tsx`, just abans dels allotjaments): a dalt, la nota a cada plataforma (`review_platforms`, «Notes a les plataformes» al panell: nota, escala 5 o 10,
  nombre d'opinions i enllaç); a sota, les opinions (`testimonials`). Les notes de partida (Booking.com i Campings.com) es van comprovar a la pàgina de cada plataforma el 20/11/2026:
  canvien amb el temps i es posen al dia al panell. Google (4,1/5) es va afegir el 20/11/2026; Tripadvisor (3,8/5), en esborrany: és la nota més baixa i ho decideix el càmping.
  Cada targeta porta el logo de la plataforma (`PlatformLogo`; quina és, pel nom, a `src/lib/content/review-platforms.ts`, amb proves): Google i Tripadvisor, dibuixos de
  Simple Icons (CC0); Booking.com i Campings.com, una insígnia amb la inicial i el seu color; la resta, la inicial sobre gris.
  Cap nota al codi; tampoc copiem ressenyes senceres de Google o Tripadvisor (són text de tercers): les opinions les tria i les escriu el client.
  Les opinions van en carrusel (`ReviewCarousel`: tres a la vista a l'escriptori, una i mig al mòbil, fletxes que avancen una targeta i que no surten si totes hi caben)
  i només hi surten les de cinc estrelles (tria de disseny, a `testimonials.tsx`). De les cinc del web antic, les de Roko G i Jasmina T es van publicar retallades amb «[…]»
  (sense una queixa d'un operador i un comentari d'una mascareta); la d'Estepada continua en esborrany (sense la COVID diria una altra cosa).
- **Contacte** (`contact.tsx`, secció `contact`, l'últim bloc de la portada): el menú «Contacte» hi porta (el peu és `#footer`). Títol i frase de la secció;
  telèfon, correus, adreça i temporada de les dades generals, i el botó de reservar.
- **«El teu viatge»** llegeix la web des de `brandSiteUrl` (`src/lib/site-url.ts`): el domini del càmping, no `siteUrl`, que a Vercel sense domini és
  l'adreça interna de cada desplegament (canvia i no es pot llegir de fora).
- **Vídeo promocional** (`promo-video.tsx`, al hero): un botó «Ver el vídeo» amb uns segons en bucle (sense so; es baixen quan el navegador està ociós, i amb moviment
  reduït o «estalvi de dades», només la foto) que obre el vídeo sencer a pantalla completa, amb so i controls. Mai es posa sol: és un anunci amb història i text, no un fons.
  Els fitxers són a Storage, `media/video/<nom>.mp4`, `<nom>-preview.mp4` i `<nom>-poster.jpg`; el nom és `site_settings.promo_video` («Dades generals» al panell). Buit, no surt el botó.
  El vídeo sencer és de 1080p comprimit (11 MB, `-crf 28 -movflags +faststart`: comença a sonar abans d'haver baixat tot). El de 20/11/2026 és en castellà (`promo-es`).
- **Insígnies del peu** (`getAccreditations`): les imatges de `media/accreditations/`, amb enllaç si `media.link_url` en té (ADAC, Tripadvisor i Zoover, com al web antic).
  El panell encara no edita aquest enllaç.
- **Text de sobre el títol** (`section_translations.eyebrow`, «On som», «Planifica l'escapada»…): és contingut de cada secció i s'edita al panell. Buit, no surt.
  El camp principal d'una entitat (el que li dona nom i diu si falta traduir) és el primer obligatori (`mainField`), no el primer del formulari.
  Només el de les piscines (`pools.eyebrow`) continua a `messages/`: aquell bloc surt dels serveis, no d'una secció.
- **Què fa servir cada secció** és a `src/lib/admin/sections.ts` (`SECTION_LAYOUTS`, amb proves): quins textos pinta el seu bloc, si té foto i si té galeria
  (i quantes fotos hi caben: la benvinguda, 7; el panell no en deixa posar més ni pujar-ne cap de sobrant). `editorConfig` ho aplica al formulari i a les accions
  de desar (un camp que no s'ensenya no es toca). Si un bloc de la web comença a pintar un camp o una foto, s'ha d'afegir aquí. Una secció que no pinta cap
  pàgina (`accommodation-intro`) no surt al panell; «Text del botó» (`cta_label`) no el pinta cap bloc i ja no s'edita.
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
  «Treu la foto» (dos clics, `removeImageAction`) la deixa sense foto a totes les entitats que en tenen; el fitxer tampoc s'esborra.
  Clicant la foto es marca el punt que no s'ha de retallar (`media.focus_x/y`, en %): la web el fa servir d'`object-position`
  (`MediaRef.position`). Una imatge de la web amb `object-cover` que no passi per `MediaImage` l'ha de posar a mà.
- **Cartes** (`PdfField`, `pdfFolder` a `entities.ts`): el PDF va directe del navegador a Storage amb la sessió de l'editor
  (`src/lib/supabase/browser.ts`), perquè una carta passa sovint dels 4,5 MB de Vercel. El límit de 20 MB i el tipus els posa el bucket;
  el navegador comprova els primers bytes (`src/lib/admin/pdf.ts`). L'adreça es desa amb «Desa els canvis», com la resta de textos.
- **Galeria** (`GalleryField`, entitats amb `gallery`): cada acció (afegir, treure, moure) es desa a l'instant i refresca
  la pàgina del panell amb `revalidatePath`. Treure una foto de la galeria no esborra el fitxer de `media`.
- **Editor visual** (`/admin/visual`, `VisualShell`): la web pública dins d'un iframe del mateix origen i l'editor al costat.
  La web no carrega cap codi d'edició: només porta `data-edit="entitat:referència"` als blocs (la referència és la clau
  de la secció o el `slug`; `resolveRef` en treu l'identificador). És el panell qui, des de fora, hi posa els ressaltats
  i captura els clics. Els formularis avisen amb l'esdeveniment `admin:saved` i l'iframe es recarrega conservant el scroll.
  Dins d'un bloc, `data-edit-field="camp"` marca on es pinta cada camp mentre s'escriu (esdeveniment `admin:draft`;
  `RichText` el posa amb la prop `field`). És només DOM de l'iframe: si es canvia de bloc sense desar, es recarrega.
  Un bloc nou editable a la web = posar-li `data-edit`. `src/lib/admin/visual.ts` (amb proves) llegeix les marques.
- **Llistes** (`ContentTable`): una taula amb una columna per cada camp base curt (`tableColumns`); cada cel·la es desa sola
  amb `updateFieldAction`, que valida amb les mateixes regles que el formulari (`parseBaseValue`) i només accepta columnes
  que la taula ensenya. `groupBy` agrupa la llista (allotjaments per tipus) i llavors l'ordre es mou dins del grup.
- **Afegir i esborrar**: només les entitats amb `create` a `entities.ts`. Una fila nova neix en esborrany amb els valors per
  defecte (i un `slug` generat si la taula en demana); esborrar demana dos clics. Totes dues coses queden al registre.
- **Programa setmanal** (`activity_sessions`, `/admin/programme`, `ProgrammeDay`): què es fa cada dia, per dates, amb «Copia la setmana anterior».
  El nom surt de l'activitat, en 5 idiomes; el lloc és un sol text. Fora de `ENTITIES` perquè no és una fitxa amb idiomes sinó una graella.
  La web el demana quan s'hi arriba (`WeekProgramme` → `/api/programme?locale=&week=`): la pàgina surt d'una caché que no sap quin dia és.
  Aquest mateix JSON públic serveix per a altres canals. Sense res programat, a la web no surt res.
- **Registre de canvis** (`change_log`, `/admin/changes`): l'apunta l'acció de servidor després de desar, amb la sessió de l'editor.
  RLS només deixa afegir-hi (signat amb el propi compte) i llegir-lo: no es pot modificar ni esborrar des de l'API.
- **Usuaris**: el compte es crea al tauler de Supabase (la persona hi tria la contrasenya) i `pnpm editor:grant <correu> [editor|admin|cap]`
  li dona o li treu l'accés. No hi ha registre obert.
- **Proves en local**: `pnpm exec supabase start`, `pnpm local pnpm seed`, `pnpm local node scripts/seed-local-editor.ts`
  (usuari de prova, contrasenya a `.env.local-editor`), `pnpm local next build` i la previsualització `web-local` (port 3200).
  `pnpm local <ordre>` executa qualsevol cosa contra el Supabase local sense tocar `.env.local`.
  Per mirar canvis en calent contra el local, la previsualització `web-local-dev` (port 3201); només pot córrer un `next dev` per carpeta, així que primer s'atura `web`.

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
- A la maqueta, la fitxa del lloc triat (foto, horari, descripció, «x») surt del seu marcador: és HTML dins del visor,
  i `MapScene` la col·loca a cada fotograma (`placeCard`, `src/lib/map/popover.ts`, amb proves: a sobre si hi cap, a sota
  si no, sempre sencera a dins). Al mòbil, amb una fitxa oberta la columna es plega. Sense 3D (`map-flat`), la fitxa
  continua a la columna. La fletxa de dalt a l'esquerra surt del mapa; Esc tanca primer la fitxa.
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

- `docs/video/guio-anunci-dron.md`: guió i escenes de l'anunci «Des del cel» (dron que arriba del mar al càmping) per fer-lo amb Higgsfield,
  amb la foto real de partida de cada escena i la veu en els 5 idiomes.


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

## Reserves

- El motor és WitBooking (`engine.witbooking.com/{idioma}/property/castellmontgri`), i tot el que se'n sap és a `src/lib/booking/link.ts`:
  `datein` i `dateout` en DD-MM-AAAA, `adults` i `ninos`. En un altre format ignora les dates sense dir res. Els paràmetres es van treure del
  codi del motor, no d'una documentació: si canvien, la barra continua obrint el motor, però sense la cerca.
- `BookingBar` (al hero) és l'única cerca, amb selectors propis: calendari de dos mesos (`BookingCalendar`, lògica a `src/lib/booking/calendar.ts`, amb proves) i comptadors de persones.
  A l'escriptori el panell surt cap amunt, dins de la foto i sense moure la pàgina: el text del hero s'aparta i, si no hi cap, la barra baixa (es mesura en obrir, `translate` al formulari).
  Al mòbil, una làmina (`position: fixed`: per això el contenidor no porta `.rise`, i el `translate` només s'aplica a l'escriptori). Sense JS, el botó porta al motor igualment.
- Els preus «des de» (`accommodations.price_from`) s'escriuen a mà al panell fins que hi hagi l'API.

- **Com arribar-hi** (`directions.tsx`): surt de les dades generals. La ruta és un formulari normal cap a Google Maps (origen i manera d'anar-hi), sense JS ni servidor nostre.
  El mapa és una imatge nostra (`public/map/zona.webp`, feta amb `python scripts/build-directions-map.py <lat> <lng>` a partir de les rajoles d'OpenStreetMap,
  amb el càmping al centre exacte, on va l'agulla): surt a l'instant, sense cap pas d'acceptar (feia nosa i el client no el vol) i sense demanar res a tercers
  en visitar la web. En clicar-hi s'obre Google Maps. La llicència d'OpenStreetMap demana l'atribució: un «© OpenStreetMap» petit al racó, que no es treu.
  Si canvien les coordenades del càmping, es torna a fer la imatge.
  Un cop carregat, no agafa el ratolí fins que s'hi clica (si no, la roda faria zoom en lloc de baixar la pàgina).
- **El teu viatge, amb la IA** (`trip-planner.tsx`, `src/lib/trip/assistants.ts`): nits i tipus de viatge generen un text que s'obre a ChatGPT o Claude per l'adreça;
  Gemini no ho accepta, i es copia abans d'obrir-lo. La salutació i el text de cada assistent s'editen al panell («Assistents d'IA», `trip_assistants`), en 5 idiomes;
  el text porta `{nits}`, `{camping}`, `{lloc}`, `{web}` i `{tipus}` (`fillPrompt`; el panell no deixa desar-ne d'altres). Buit, o sense la taula, el de `messages/`.
  Quins assistents hi ha i com s'hi obre el text continua sent codi: al panell només s'editen o s'amaguen. No passa per cap servidor nostre. La finestra imita l'aplicació de cada assistent (`.trip-chat` a `globals.css`: colors seus, no tokens) i els logos són a `ai-logos.tsx`.

## Pàgines

- La portada és curta, com holacamp.net. Instal·lacions (amb piscines i tobogans), animació (amb el programa setmanal), gastronomia, entorn i galeria tenen pàgina pròpia (`/[locale]/services`, `entertainment`, `gastronomy`, `surroundings`, `gallery`, embolcall a `subpage.tsx`).
  Totes comencen amb `SubpageHero`: la ruta, la foto de la secció en gran amb el títol a sobre (zoom suau en entrar, `.subpage-hero-photo`) i el text a sota.
  Després, targetes netes sobre fons blanc: activitats (`ActivityExplorer`, filtre per a qui són, horari i descripció curta), serveis (amb foto i icona, o només icona),
  restaurants per zona i les fotos de l'entorn. Les descripcions llargues, tres línies i «Leer más» (`ExpandableText`).
  A la portada, cadascuna és un bloc amb foto, descripció curta (el text de la secció, tallat) i enllaç (`explore.tsx`); a la galeria només s'hi arriba pel menú. El menú ho sap a `PAGES` (`site-header.tsx`) i el mapa del web, a `sitemap.ts`.
- `data-scroll-behavior="smooth"` a `<html>` és el que fa que Next desactivi el scroll suau en canviar de pàgina: sense, la pàgina nova es quedava a baix de tot.
- A aquestes pàgines no hi ha mapa: «Veure al mapa» no hi surt.
- **Pàgines legals** (`/[locale]/legal/[slug]`: privacitat, galetes, avís legal i condicions de reserva; `src/lib/content/legal.ts`): cadascuna és una secció del panell (`legal-privacy`…),
  amb títols al text (paràgrafs que comencen amb `#`, `documentBlocks`). `node scripts/seed-legal.ts` les carrega i només afegeix el que no hi és; els enllaços són al peu.
  Privacitat i galetes estan redactades per al web nou (`scripts/content/legal/<idioma>/`): descriuen el que el web fa de veritat (cap galeta en entrar; `NEXT_LOCALE` en canviar d'idioma;
  Vercel, Supabase, Sentry i WitBooking; el mapa de «Com arribar-hi» és una imatge nostra i Google Maps només s'obre si s'hi clica). **Si el web comença a fer servir una galeta, un servei o un formulari nou, s'han d'actualitzar** i tornar a carregar amb `--replace privacy,cookies`.
  L'avís legal i les condicions de reserva continuen sent les del web antic.
- **Redireccions del web antic** (`src/lib/seo/redirects.ts`, amb proves, a `next.config.ts`): cada adreça de `src/lib/seo/old-urls.json` (generat de `reference/content/site-map.json` amb `node scripts/build-old-urls.ts`: `reference/` no puja a Vercel) va a la pàgina nova equivalent, en el mateix idioma;
  el que no en té (esdeveniments, treballa amb nosaltres, canal de denúncies) va a la portada.

## SEO i GEO

- Les metadades de cada pàgina surten de `pageMetadata` (`src/lib/seo/metadata.ts`, amb proves): canònica, `hreflang` dels 5 idiomes, Open Graph i targeta
  de cada pàgina (no la de la portada). La descripció és el primer paràgraf del text de la secció, net de `**` i de títols i tallat a 160 (`metaDescription`).
- Dades estructurades (`json-ld.tsx`): `Campground` a la portada (temporada, serveis, enllaç de reserves, fitxes a Booking i altres plataformes a `sameAs`),
  `Accommodation` a cada allotjament (lligat al càmping per `@id`) i `BreadcrumbList` a les pàgines. Les notes de les plataformes no hi van com a `aggregateRating`.
- `/llms.txt` (`src/app/llms.txt/route.ts`): el web resumit per als assistents d'IA, del contingut del panell en castellà.
- El títol i la descripció de la portada són a «Dades generals» (`seo_title`, `seo_description`). `scripts/seo-content.ts` hi va posar els de 23/11/2026 i les
  paraules clau en negreta dels textos de les seccions (per defecte només ensenya els canvis; `--apply` els escriu).

## Disseny

- Estil de referència: holacamp.net (foto gran amb la cerca a sobre, targetes amb preu i «Reservar», galeria) amb els colors de la marca.
  El fons és blanc (res de crema ni beix, ni gra de paper) i les superfícies, un gris molt clar (`paper-2`); el botó principal és `band-olive`.
  Les capçaleres de secció no porten número ni ratlla, i els botons no porten fletxa.
- Colors només a través dels tokens de `globals.css` (`paper`, `ink`, `olive`, `terra`…). Les
  franges amb text clar fan servir `band-olive`, `band-terra` i `band-sea`.
- **No hi ha mode fosc, i no se n'ha de fer**: el client no el vol. `color-scheme: light` i cap `dark:` ni
  `prefers-color-scheme: dark`; amb el sistema en fosc, la web es veu igual.
- La barra de scroll de la pàgina té el fons de la web i la barra `band-olive` (`globals.css`).
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
- **Benvinguda** (`welcome.tsx`, `.welcome` a `globals.css`): sense animació de scroll. El text entre fotos, amb la carena del Montgrí (`MontgriLine`, la del peu) de paisatge. La primera foto de la galeria de la secció és la del mig; les altres, les del voltant (fins a 6, al mòbil 4): en total, 7. Es canvien des del panell.
- **Allotjaments** (`accommodation-explorer.tsx`): se n'ensenyen 9 (`PAGE_SIZE`) i «Ver más» n'afegeix 9 més fins a l'últim; canviar un filtre torna a començar. Les noves pugen per ordre (`.accommodation-card`)
  i el focus va a la primera nova. Cada targeta porta a la pàgina de l'allotjament (`accommodationHref`).
- **De la targeta a la pàgina de l'allotjament**: la foto de la targeta i la foto gran de la pàgina porten el mateix `<ViewTransition>` de React
  (`accommodationPhotoTransition(slug)`, classe `accommodation-photo`). En clicar, la navegació de Next és una transició i la foto vola fins al seu lloc
  mentre la pàgina es construeix al voltant (`.accommodation-build`). A Next 16.3 no cal cap opció a `next.config.ts`. Amb moviment reduït, sense animació.
- **Pàgina de l'allotjament** (`/[locale]/accommodations/[slug]`, com la d'holacamp): fotos en mosaic (`AccommodationGallery`, obre `Lightbox`), dades amb icona (`accommodation-parts.tsx`),
  distribució dels llits i equipament amb icona (`bedLayout` i `amenities` a `src/lib/content/equipment.ts`, amb proves: paraules clau en els 5 idiomes; el que no reconeix porta la icona genèrica),
  el càmping (text de la benvinguda), els serveis, la zona i altres allotjaments del mateix tipus. La reserva va al costat i fixa a l'escriptori, i en una barra a baix al mòbil.
  Es construeix per ordre (`.accommodation-build`, només desplaçament: la primera foto pot ser l'LCP). És al mapa del web (`sitemap.ts`).
- **«Més que dormir»** (`explore.tsx`, `.explore-*` a `globals.css`): en arribar-hi, la foto s'obre des del centre (`clip-path`) mentre s'aparta el zoom, la ratlla es dibuixa i el text puja per ordre;
  en baixar, la foto es desplaça una mica (`ExploreParallax`: `--shift` només a les que són a la vista, un `requestAnimationFrame` per scroll). Amb moviment reduït, quiet.
- **Mapa flotant** (`map-teaser.tsx`, al layout de `[locale]`: surt a totes les pàgines, sempre): un quadre a baix a la dreta amb la maqueta 3D girant.
  No és three.js (pesaria a cada pàgina) sinó la volta de la maqueta capturada en 360 fotogrames (un per grau) i feta vídeo (`public/map/teaser.mp4`, 160 KB, 18 fps: una volta cada 20 s;
  es posa quan el navegador està ociós; abans i amb moviment reduït, `teaser-still.webp`). Vídeo i no WebP animat: el vídeo el descodifica el xip
  del mòbil; el WebP, el processador fotograma a fotograma, i anava a salts. Es refà amb `scripts/map-teaser.mjs` si canvia la maqueta. Amb el ratolí surt «Explorar mapa»
  (al mòbil, sempre). A la portada obre el mapa (`openMapView`, esdeveniment `camping:map-open`); a les altres pàgines porta a `/<idioma>#explora`, i el mapa
  s'obre en carregar i treu el `#explora` de l'adreça (`src/lib/map/events.ts`). Amb la barra de reservar del mòbil (`.booking-dock`) s'hi posa a sobre.
  El peu deixa espai a baix a la dreta perquè no tapi els textos legals.
- three.js no entra a la càrrega inicial: el mapa es carrega amb `dynamic()` quan és a prop **i** qui visita ja
  ha fet alguna cosa (`useInteracted`). Fins llavors fa de fons el plànol dibuixat.
- El que bloquejava el fil principal i com s'ha resolt (mesurat amb Long Animation Frames i perfil de CPU):
  - Compilar shaders en dibuixar: més de 2 s a Windows (ANGLE tradueix a HLSL). Ara `gl.compileAsync` abans del
    primer fotograma (`frameloop="never"` fins que acaba) i un sol programa per a tota la maqueta (tot `flatShading`).
  - `<Preload>` i `<Environment>` de drei compilen i dibuixen dins d'un efecte de React: no s'han de fer servir.
  - Crear un context WebGL de prova per saber si n'hi ha: car. `useRenderMode` només mira l'API i `WebGLBoundary`
    recull la fallada si el context de debò no es pot crear.
  - La textura del terra (5,5 MP) es descodifica fora del fil principal (`createImageBitmap`); a mòbil, la de 2048 px.
- Després de la primera interacció, i en un moment ociós, `map-explorer` va baixant three.js i el terra (si no hi ha
  «estalvi de dades»): amb 4G lent, el mapa passava de 9 s a 2,5 s a sortir en arribar-hi. A pantalles petites, `dpr`
  fins a 1,5 i ombres de 1024.
- El gronxament del mapa de fons va a uns 30 fps i només mentre és a la vista.
- De fons no hi ha marcadors ni etiquetes HTML (només amb el mapa obert): recol·locats a cada fotograma sobre la vista que
  es gronxa es veien tremolar. I obrir el mapa es fa després d'un fotograma pintat i dins d'una transició: muntar la
  columna i fer créixer el canvas dins del mateix clic donava un INP de més de 280 ms.
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
