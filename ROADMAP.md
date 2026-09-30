# Roadmap — Natura Village Castell Montgrí

> Estat: **fase 0 feta** (repo, esquelet, idiomes, portes). Actualitzat el 30/09/2026.

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
| Reserves | **Mantenim Thelis** | La landing hi envia amb dates i tipus d'allotjament preomplerts; zero risc sobre la facturació |
| Repo | Públic, `nertelai-art/camping-castellmontgri` | Web de màrqueting; cap secret al codi. Les fotos del client no van al git |
| Animació | Motion (UI) + GSAP ScrollTrigger (scroll) + Lenis (scroll suau) | Motion per a micro-interaccions, GSAP per a seqüències llargues lligades al scroll |
| Animacions il·lustrades | Rive (preferit) o Lottie | Plat → menjar, gelat que es fon… Són fitxers que el client pot substituir des de l'admin |

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
| `accommodations` | categoria, capacitat mín/màx, m², habitacions, banys, PMR, mascotes, codi Thelis, galeria | nom, descripció, equipament |
| `amenities` + `accommodation_amenities` | icona | nom |
| `services` | icona, imatge, punt al plànol | nom, descripció, horari |
| `restaurants` | imatges, carta (PDF), animació, punt al plànol | nom, descripció, horari |
| `map_points` | x, y (% sobre el plànol), tipus, entitat enllaçada | etiqueta |
| `map_zones` | polígon (SVG path), tipus de parcel·la | nom |
| `testimonials` | autor, font, nota, data | text |
| `offers` | dates de validesa, imatge, codi | títol, text |
| `events` | data, imatge | títol, text |
| `media` | camí a Storage, amplada, alçada, blurhash, focus | text alternatiu |
| `profiles` | usuari, rol (`admin` \| `editor`) | — |
| `audit_log` | qui, què, quan, abans/després | — |

## 6. Seccions de la landing

| # | Secció | Idea | Editable |
|---|---|---|---|
| 1 | **Hero** | Vídeo aeri a pantalla completa → el logotip es «dibuixa»; buscador de dates/persones que envia a Thelis | vídeo, títol, CTA |
| 2 | **Benvinguda** | Text curt amb xifres animades (hectàrees, piscines, anys) | tot |
| 3 | **Plànol interactiu** | El plànol il·lustrat amb zoom i arrossegament; punts per a cada servei i zones per tipus de parcel·la. Clic → fitxa lateral amb fotos, text i «Com arribar-hi dins el càmping». Filtres (piscines, restauració, allotjaments…) | punts, zones i fitxes |
| 4 | **Allotjament** | Selector per categoria amb pestanyes animades; targetes amb galeria, icones de capacitat/m²/habitacions; filtres per persones, PMR, mascotes; comparador de fins a 3; «veure'l al plànol»; «reservar» preomplert | tot |
| 5 | **Gastronomia** | Seqüències lligades al scroll: el plat buit s'omple, el gelat es fon, la copa es serveix. Una per restaurant | textos, fotos, animació (fitxer Rive/Lottie) |
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

### Fase 1 — Dades i plataforma
- Projecte Supabase (preproducció) + esquema de la secció 5 amb migracions i RLS.
- Tipus generats de l'esquema; capa de lectura a `src/lib/supabase/`.
- **Seed** des de `reference/`: tots els textos en 5 idiomes i totes les imatges a Storage.
- Revalidació per etiqueta. Sentry. Projecte Vercel amb previsualitzacions.
- **Acabat quan:** la home de l'esquelet mostra dades reals de Supabase en els 5 idiomes.

### Fase 2 — Sistema de disseny i landing estàtica
- Tipografia, colors i components a partir de la marca (logo, verd oliva, llima).
- Totes les seccions de la landing muntades amb dades reals, **sense** animacions grans.
- SEO: metadades per idioma, `hreflang`, sitemap, dades estructurades (`Campground`), redireccions des de les URL antigues.
- **Acabat quan:** Lighthouse ≥ 95 en mòbil i totes les seccions funcionen en 5 idiomes.

### Fase 3 — Plànol interactiu
- Visor amb zoom/arrossegament (tàctil inclòs), punts, zones, filtres i fitxa lateral.
- Enllaços creuats: allotjament → «veure al plànol»; servei → punt.
- **Acabat quan:** es pot trobar qualsevol servei o allotjament des del plànol en mòbil.

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

1. **Plànol en vector** (AI/SVG/PDF) del dibuixant: amb el JPG només podem posar punts; amb el vector, cada parcel·la i zona pot ser clicable.
2. **Manual de marca**: tipografies, colors, usos del logo.
3. **Vídeo aeri / dron** i fotos recents d'alta resolució (les del web són reduïdes).
4. **Il·lustracions per a gastronomia** (o pressupost per encarregar-les): les animacions de plat/gelat necessiten un estil il·lustrat coherent amb el plànol.
5. **Thelis**: documentació dels paràmetres d'enllaç (dates, persones, tipus) i si hi ha API de disponibilitat/preus.
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
