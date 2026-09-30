# Roadmap — Natura Village Castell Montgrí

> Estat: **fases 1, 2 i 3 fetes** (plataforma de contingut, landing i plànol interactiu). Pendent: seed al Supabase remot, projecte Vercel i mesura de rendiment en preproducció. Actualitzat el 30/09/2026.

## 1. Què fem

Una web nova per al Càmping Castell Montgrí (marca **Natura Village**, L'Estartit)
amb dues peces:

1. **Una landing espectacular**: animada, ràpida, en 5 idiomes, que vengui
   l'experiència i porti a reservar.
2. **Un panell d'administració** on el càmping edita gairebé tot: textos,
   imatges, allotjaments, serveis, restaurants, punts del plànol, opinions,
   ofertes i temporada.

**Decisió de base:** el contingut és editable **des del primer dia**. Cada secció
es construeix ja llegint de Supabase, en lloc de fer-la amb textos fixos i
migrar-la després. Costa una mica més al principi, però estalvia refer cada
secció dues vegades, i obliga a dissenyar components que aguantin textos llargs,
cinc idiomes i fotos que no triem nosaltres.

## 2. Què té el web actual (inventari)

Extret a `reference/content/` (70 pàgines × 5 idiomes + JSON estructurats) i
`reference/images/` (327 originals, ~480 MB, fora del git; `manifest.json` diu d'on surt cadascuna).

| Bloc | Contingut |
|---|---|
| Idiomes | `es` (per defecte), `ca`, `fr`, `en`, `nl` |
| Allotjaments | 26 en 4 categories: **mobile homes** (16: MH Medes, Montgrí, Ter, Rocamaura, Pedrosa, Chalets 4/5 · 5/6 · 6 · PMR, Village 4/5 · 6…), **glamping** (4, fora del menú), **tendes** (3: Plis Plas, Nature Habitat, Mont Pla) i **parcel·les** (3: Estàndard, Comodity, Comodity Plus). Els preus no són a l'HTML: els carrega el giny de Thelis |
| Serveis | 19: recepció, excursions, zones lúdiques, sanitaris, piscines, tobogans, restaurants, supermercat, pub, animació, gandules, bicis, neveres i barbacoes de lloguer, bugaderia, seguretat 24 h, bus a la platja, wifi, punt de càrrega |
| Restauració | 12 punts en dues zones. **Ombra**: gelateria, restaurant, pizzeria, take away, cafeteria-creperia, barra. **Panorama**: grill (única carta en PDF), take away, bar, gelateria, pub-discoteca The Seagull, L'Era |
| Altres seccions | Animació (13 activitats), Esdeveniments (4 dossiers PDF), Entorn, Piscines i tobogans, Novetats (un vídeo de Vimeo), Ofertes (ara buit) |
| Plànol | Il·lustració 3000×1845 px (2026) amb llegenda de serveis i tipus de parcel·la |
| Opinions | 5 ressenyes (TripAdvisor) |
| Reserves | Motor extern **Thelis / webcamp** + portal de clients propi |
| Legal | Condicions de reserva, privacitat, cookies, avís legal, canal de denúncies, IRTC KG-000086 |
| Marca | Oliva `#485328` (l'únic color del logo), crema `#F7F0D3`, terracota `#CA5732`/`#BA380C`, rosa pàl·lid `#FFF4F0`; tipografia Lato. Germà Castellomar, Grup Mascort, Fundació Mascort. No hi ha xarxes socials enllaçades |
| Temporada | 2026: 27 d'abril – 27 de setembre |

## 3. Decisions preses

| Tema | Decisió | Per què |
|---|---|---|
| Framework | Next.js 16 App Router + React 19 | SSR/ISR per SEO, imatges optimitzades, admin a la mateixa app |
| Llenguatge | TypeScript 6 | `typescript-eslint` encara no suporta TS 7 |
| Estils | Tailwind 4 + tokens CSS | Temes clar/fosc amb variables; el client podrà ajustar colors |
| Idiomes | next-intl 4, prefix sempre (`/es/...`) | Conserva les URL indexades |
| Dades | Supabase: Postgres + Auth + Storage | Un sol proveïdor per contingut, usuaris i imatges |
| Hosting | Vercel | Previsualització per PR; producció només a mà |
| Errors | **Sentry, sí** | Un panell d'admin sense monitoratge falla en silenci; el pla gratuït n'hi ha prou |
| Reserves | **Mantenim Thelis, sense integrar de moment** | Botó cap al motor actual. L'enllaç amb paràmetres (dates, tipus) queda per més endavant |
| Repo | Públic, `nertelai-art/camping-castellmontgri` | Web de màrqueting; cap secret al codi. Les fotos del client no van al git |
| Animació | Motion per a micro-interaccions + **escenes 3D guiades pel scroll** (skill `scroll-3d-scenes`: three.js + React Three Fiber) | Mètode ja provat: `frameloop="demand"`, `damp`, instàncies, atzar amb llavor, reserva estàtica i `reduced-motion` |
| Gastronomia animada | **Modelada per codi** (plat, gelat, copa amb `LatheGeometry`), no Rive/Lottie | No cal il·lustrador, surt nítid a qualsevol mida i no pesa. Els textos i fotos continuen sortint de l'admin |
| Vídeo aeri | **No n'hi ha: el fem amb el plànol** | Escena 3D: la il·lustració del plànol (3000×1845) com a terreny inclinat, la càmera hi baixa amb el scroll i s'hi aixequen els punts clau |
| Marca | **No hi ha manual**: es deriva del web actual | Oliva, crema, terracota i Lato; el logo SVG ja és a Storage |

## 4. Arquitectura

```
Navegador ──► Vercel (Next.js)
               ├─ /[locale]/…     web pública (Server Components, ISR per etiqueta)
               ├─ /admin/…        panell (Auth Supabase, rols admin/editor)
               └─ /api/revalidate  invalida la caché quan l'admin desa
                         │
                         ▼
                 Supabase ── Postgres (contingut + traduccions, RLS)
                          ├─ Storage  (imatges, Rive/Lottie, PDF de cartes)
                          └─ Auth     (usuaris del càmping)
Sentry ◄── errors de servidor i client, amb source maps
Thelis ◄── botó «Reservar» amb paràmetres
```

Frontera de proveïdors: Supabase només s'importa a `src/lib/supabase/`,
Sentry a `src/lib/monitoring/`, Thelis a `src/lib/booking/`.

## 5. Model de contingut (proposta)

Patró: taula base (el que no depèn de l'idioma) + `*_translations` (el que sí).
Tot amb `status` (`draft` | `published`), `sort_order` i `updated_at`.

| Taula | Camps base | Camps traduïts |
|---|---|---|
| `site_settings` (1 fila) | telèfons, correus, adreça, coordenades, temporada (dates), IRTC, xarxes, URL Thelis, URL portal | eslògan, avís de temporada, SEO per defecte |
| `sections` | clau (`hero`, `gastronomy`…), visible, ordre, imatge/vídeo, animació | títol, subtítol, cos (text ric), CTA |
| `accommodation_categories` | clau, icona, ordre | nom, descripció |
| `accommodations` | categoria, capacitat, m², habitacions, banys, aire condicionat, PMR, categoria de Thelis, portada, galeria (`accommodation_media`) | nom, descripció, equipament (llista) |
| `services` | icona, imatge, punt al plànol | nom, descripció, horari |
| `restaurants` | zona (Ombra/Panorama), horari, portada | nom, descripció, carta (PDF a Storage) |
| `activities` | públic (nens/família/adults), zona, horari, portada | nom, descripció |
| `map_points` | x, y (% sobre el plànol), tipus, servei / restaurant / activitat / allotjament / categoria enllaçats | etiqueta |
| `testimonials` | autor, font, idioma original, nota | — (es mostren en l'idioma original) |
| `media` | camí a Storage, amplada, alçada, blurhash, focus | text alternatiu |
| `profiles` | usuari, rol (`admin` \| `editor`) | — |
| `offers`, `events`, `audit_log` | — | Es creen quan es facin les seves seccions (ofertes ara és buit) i l'admin (fase 5) |

## 6. Seccions de la landing

| # | Secció | Idea | Editable |
|---|---|---|---|
| 1 | **Hero** | «Vol aeri» 3D sobre el plànol il·lustrat (no hi ha vídeo de dron): la càmera baixa des de dalt fins al càmping i el logotip es «dibuixa»; botó «Reservar» cap a Thelis | imatge del plànol, títol, CTA |
| 2 | **Benvinguda** | Text curt amb xifres animades (hectàrees, piscines, anys) | tot |
| 3 | **Plànol interactiu** | El plànol il·lustrat amb zoom i arrossegament; punts per a cada servei i zones per tipus de parcel·la. Clic → fitxa lateral amb fotos, text i «Com arribar-hi dins el càmping». Filtres (piscines, restauració, allotjaments…) | punts, zones i fitxes |
| 4 | **Allotjament** | Selector per categoria amb pestanyes animades; targetes amb galeria, icones de capacitat/m²/habitacions; filtres per persones, PMR, mascotes; comparador de fins a 3; «veure'l al plànol»; «reservar» preomplert | tot |
| 5 | **Gastronomia** | Escenes 3D lligades al scroll: el plat buit s'omple, el gelat es fon, la copa es serveix. Modelades per codi | textos, fotos, escena triada per restaurant |
| 6 | **Piscines i tobogans** | Efecte d'aigua (shader lleuger o vídeo) amb capes en paral·laxi | tot |
| 7 | **Serveis** | Graella d'icones que s'animen en entrar; clic → detall i punt al plànol | tot |
| 8 | **Animació i esdeveniments** | Calendari de la temporada; carrusel d'activitats per edats | tot |
| 9 | **Entorn** | Mapa de la Costa Brava amb les Medes, el Montgrí i platges; recorregut animat | tot |
| 10 | **Opinions** | Carrusel infinit amb notes | tot |
| 11 | **Contacte / peu** | Mapa amb consentiment de galetes, newsletter, acreditacions, legal | tot |

## 7. Fases

Cada fase acaba amb una PR a `developer`, portes en verd i una previsualització
de Vercel revisada al navegador (mòbil i fosc inclosos).

### Fase 0 — Fonaments ✅
- Repo, branca `developer`, `CLAUDE.md`, aquest roadmap.
- Next 16 + TS + Tailwind 4 + next-intl amb els 5 idiomes i prefixos del web actual.
- Hook de pre-push (typecheck, lint, tests, gitleaks) i CI de build amb `concurrency`.
- Contingut del web actual extret a `reference/`.

### Fase 1 — Dades i plataforma ✅ (amb dos pendents)
- ✅ Supabase local (Docker) i remot `camping-castellmontgri` (París, pla gratuït).
- ✅ Esquema amb migracions (`supabase/migrations/`), RLS i proves pgTAP (`pnpm db:test`, 12 proves).
- ✅ Tipus generats de l'esquema (`pnpm db:types`); lectura a `src/lib/supabase/content.ts`.
- ✅ Seed idempotent des de `reference/` (`pnpm seed`): 316 imatges reduïdes a 2400 px (~110 MB), 26 allotjaments, 19 serveis, 12 restaurants, 13 activitats, 7 seccions i 5 opinions, tot en 5 idiomes.
- ✅ Revalidació per etiqueta de taula (`/api/revalidate`, expiració immediata).
- ✅ Sentry (`nertel/camping-castellmontgri`, regió UE), desactivat si no hi ha DSN.
- ✅ Fronteres de proveïdor vigilades per ESLint.
- ⏳ **Seed al Supabase remot**: cal la clau secreta del projecte.
- ⏳ **Projecte Vercel**: el connector no té permís per crear-lo; es fa des del tauler.
- **Acabat quan:** la home de l'esquelet mostra dades reals de Supabase en els 5 idiomes. ✅ en local.

### Fase 2 — Sistema de disseny i landing estàtica ✅ (amb la mesura de rendiment pendent)
- ✅ Direcció visual «guia de natura»: paper crema amb gra, tinta oliva, accents terracota, numeració de secció i la carena del Montgrí amb el castell com a signatura. Fraunces (titulars) + Lato (la del web actual). Tema clar i fosc; les franges de color mantenen el contrast en tots dos.
- ✅ Landing sencera amb dades reals en 5 idiomes: hero (foto aèria real), benvinguda amb xifres comptades del contingut, allotjaments (pestanyes, filtre per persones, fitxa amb galeria i equipament), plànol, gastronomia per zones, piscines i tobogans, serveis desplegables, animació per públics, entorn, opinions i peu amb contacte i acreditacions.
- ✅ SEO: títol i descripció per idioma, canònica, `hreflang` + `x-default`, Open Graph, `sitemap.xml`, `robots.txt` (les previsualitzacions no s'indexen) i JSON-LD `Campground`.
- ✅ Accessibilitat: Lighthouse 100 (contrast, `lang` a les opinions, diàleg amb focus i Escape, menú mòbil sense JS, enllaç «salta al contingut»).
- ✅ Rendiment: Sentry del navegador diferit, tipografies de 320 KB a 89 KB, seccions sota el plec amb `content-visibility`, cap animació que bloquegi el LCP.
- ⏳ **Lighthouse ≥ 95 a mòbil**: en local surt entre 75 i 83, amb una variació enorme (la mateixa build ha donat 27 i 80). La mesura bona es fa amb PageSpeed sobre una previsualització de Vercel.
- ➡️ Redireccions 301 de les URL antigues: passen a la fase 6, quan existeixin les pàgines de destí.

### Fase 3 — Plànol interactiu ✅
- ✅ Visor propi (sense dependències): arrossegar, pessigar, Ctrl + roda, doble clic, teclat (fletxes, + i −), pantalla completa i «veure'l sencer». El plànol a resolució completa (3000 px) només es baixa quan s'amplia.
- ✅ 49 punts col·locats llegint la il·lustració 2026 (`scripts/content/map-points.json`, en píxels del plànol), enllaçats a serveis, restaurants, activitats, allotjaments i categories. Els que no tenen fitxa (aparcament, església, mirador, parc natural…) porten etiqueta pròpia en 5 idiomes.
- ✅ Filtres per tipus (allotjament, menjar i beure, piscines, lleure i esport, serveis, llocs d'interès), llista accessible de tots els llocs i fitxa lateral amb foto, horari i descripció.
- ✅ «Veure al plànol» des dels restaurants, els serveis i la fitxa de cada allotjament (les tres parcel·les porten a la seva zona concreta).
- ⚠️ Sense punt, perquè no se sap on són: *Take Away Ombra* (comparteix icona amb la pizzeria), el Kids Club, la zona de glamping i les tendes. La heladería Ombra està posada a la icona de cafeteria més propera a la piscina Ombra: cal confirmar-ho amb el càmping.

### Fase 4 — Animacions
- Hero, gastronomia (plat, gelat…), piscines, serveis, xifres.
- Tot amb alternativa per a `prefers-reduced-motion` i sense perjudicar el LCP.
- **Acabat quan:** 60 fps en un mòbil mitjà i LCP < 2,5 s.

### Fase 5 — Panell d'administració
- `/admin` amb inici de sessió, rols i registre de canvis.
- Editors per a cada taula: formularis amb pestanyes per idioma, avís de traducció que falta, text ric (Tiptap), pujada d'imatges amb retall i punt focal, ordenació per arrossegament.
- **Editor del plànol:** clicar sobre la il·lustració per col·locar o moure punts.
- Esborrany / publicat i **previsualització** abans de publicar.
- Opcional: botó «traduir des del català/castellà» amb IA, sempre revisable.
- **Acabat quan:** el client canvia un text, una foto i un punt del plànol sense ajuda.

### Fase 6 — Pàgines interiors i llançament
- Fitxa de cada allotjament, restaurant i servei; pàgines legals; treballa amb nosaltres.
- Galetes (consentiment real), accessibilitat (WCAG 2.2 AA), proves E2E dels fluxos clau.
- Migració de domini i redireccions 301. **El pas a producció, quan ho digui l'usuari.**

## 8. Què cal demanar al client

1. **Plànol en vector** (AI/SVG/PDF) del dibuixant: amb el JPG (el que fem servir) només podem posar punts; amb el vector, cada parcel·la seria clicable.
2. ~~Manual de marca~~ — no n'hi ha; es deriva del web.
3. ~~Vídeo aeri~~ — no n'hi ha; el «vol» es fa en 3D sobre el plànol.
4. ~~Il·lustracions de gastronomia~~ — es modelen per codi.
5. **Thelis**: aparcat de moment.
6. Qui editarà el contingut i quants usuaris; quins idiomes tradueixen ells.
7. Accés a Search Console i Analytics actuals, per no perdre posicionament.
8. Domini i DNS: qui els gestiona.

## 9. Riscos

| Risc | Mitigació |
|---|---|
| Animacions pesades en mòbil | Pressupost de rendiment per secció; `reduced-motion`; carregar Rive/GSAP només quan la secció és a prop |
| Traduccions incompletes | L'admin marca els camps que falten; la web cau a l'espanyol, mai deixa un buit |
| Perdre SEO en canviar de web | Mateixos prefixos d'idioma, mapa de redireccions 301 de totes les URL antigues |
| Imatges del client molt grans | Optimització automàtica a la pujada; `next/image` amb mides responsives |
| Dependència de Thelis | L'enllaç viu a `src/lib/booking/`; canviar de motor és tocar un fitxer |
| Textos del web antic amb errors | El seed els copia tal qual: el títol «Encuentra tu alojamiento perfecto» surt en castellà a `ca` (també al web antic); 3 opinions (COVID, queixes) entren com a esborrany. Es revisen a l'admin |
