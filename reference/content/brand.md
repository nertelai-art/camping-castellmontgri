# Marca i estil del web actual

Extret de `/assets/css/app.css` i `/assets/css/app_responsive.css` (versió `?20260920251118`),
del logotip SVG i dels estils en línia de l'HTML. Còpies dels CSS a `reference/css/`.
`dev.css` és buit. No hi ha propietats personalitzades de CSS (`--*`) pròpies: només
sobreescriptures de Bootstrap (`--bs-tooltip-*`). Els colors són valors literals.

## Colors

| Rol | Hex | Ús al CSS actual | Aparicions a `app*.css` |
|---|---|---|---|
| **Verd oliva principal** | `#485328` | Títols h1/h2/h3, text de marca, botó «Reservar» de la capçalera, fons de botons en *hover*, **color únic del logotip** | 83 |
| **Crema / sorra** (fons de secció) | `#F7F0D3` | `.bgMainColor` (seccions alternes), botons secundaris | 42 |
| **Terracota** | `#CA5732` | Accent de les seccions de Gastronomia i Animació (h2, *hover*, botó de cerca) | 31 |
| **Terracota fosc / vermellós** | `#BA380C` | h2 generals, *hover* de la capçalera, `.formMessage` (franja «Temporada 2026») | 22 |
| **Rosa pàl·lid** | `#FFF4F0` | Fons de les seccions de gastronomia/animació (substitueix el crema) | 15 |
| Verd bosc (en línia) | `#066343` | Etiquetes de la fila d'icones de serveis (estil en línia a l'HTML, 43 cops) | — |
| Groc crema (en línia) | `#FFF5CC` | Només el fons del mapa quan les galetes estan blocades (estil en línia al `<head>`) | — |
| Llima | `#DBDC4D` | Primera columna de la taula comparativa d'allotjaments | 1 |
| Verd sàlvia | `rgba(151,189,172,1)` = `#97BDAC` | Detalls puntuals | 2 |
| Neutres | `#FFFFFF`, `#000000` (text base), `#EEEEEE`, `#F3F3F3`, `#CCCCCC` | Fons, text i vores | — |

El gestor de galetes PDCC també fa servir `#485328` per als seus botons (configuració en línia).

Paleta en una línia: **oliva `#485328` · crema `#F7F0D3` · terracota `#CA5732` / `#BA380C` · rosa `#FFF4F0`**.

## Tipografia

- **Família única: Lato** (Google Fonts), amb reserva `Helvetica, sans-serif`.
  - Enllaç: `https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap`
  - Pesos carregats: 100, 300, 400, 700 i 900, en normal i cursiva (10 variants). Al CSS només es fan servir `normal` i `bold`.
- No hi ha cap `@font-face` propi. Les icones de la interfície surten de Font Awesome (`/assets/vendor/fontawesome`) i d'SVG en línia.
- Cos: 16px, color `#000000`.
- Títols: h1 de 25px en negreta, color `#485328`. Els títols de secció (`h1.title`, `h2.title`) van en MAJÚSCULES al contingut i tenen un espaiat de 40px a dalt i 30px a baix.
- Mides més freqüents: 20px (12), 14px (11), 16px (9), 18px (6), 13px (5), 25px, 35px.

## Formes i components

- Botons tipus píndola: `border-radius` de 25, 30 o 50px. El «Reservar» de la capçalera és oliva amb el text blanc i passa a negre en *hover*.
- Botons de fitxa (`a.bookingButton.detail`): fons crema i text oliva, que s'inverteixen en *hover*.
- Patró floral al peu: `/assets/img/footer_floral_pattern.png`. Fletxa de *slider*: `/assets/svg/arrow_green.svg`.
- Llibreries: Bootstrap 5.2.3, Slick carousel 1.8.1, Fancybox 5, hc-offcanvas-nav, DataTables 2 (taula comparativa), SweetAlert2, animate.css.

## Logotips

- Principal: `/assets/svg/logo_natura_village_montgri.svg`, en monocrom `#485328` i amb un *viewBox* de 346×101. La descàrrega és a `images/logos/`.
- Germà: `/assets/svg/logo_natura_village_castellomar.svg` (Natura Village Castellomar = Camping Castell Mar).
- Grup: `logo_grup_mascort.png` i `logo_fundacio_mascort.png`.
- Favicon: `/assets/favicon/` (svg, ico, 96×96, apple-touch-icon).
