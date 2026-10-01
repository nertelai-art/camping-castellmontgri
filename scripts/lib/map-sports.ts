// Pistes d'esport redibuixades: al plànol tenen icones a sobre i, en esborrar-les, quedaria una taca.
// Com que una pista és geometria coneguda, es torna a pintar sencera i queda nítida.

type Point = [number, number];
export type Sport = { type: "football" | "basket" | "tennis" | "apron"; tl: Point; tr: Point; bl: Point };

const LINE = "#f4f1e6";

/** Cada pista es dibuixa en un quadrat d'1 × 1 i una matriu afí el porta al paral·lelogram del plànol. */
const COURTS: Record<Sport["type"], (stroke: number) => string> = {
  apron: () => `<rect width="1" height="1" fill="#4c9f63"/>`,
  football: (s) =>
    `<rect width="1" height="1" fill="#2f6b3a"/>` +
    `<g fill="none" stroke="${LINE}" stroke-width="${s}">` +
    `<rect x="0.03" y="0.06" width="0.94" height="0.88"/><line x1="0.5" y1="0.06" x2="0.5" y2="0.94"/>` +
    `<ellipse cx="0.5" cy="0.5" rx="0.07" ry="0.16"/>` +
    `<rect x="0.03" y="0.25" width="0.14" height="0.5"/><rect x="0.83" y="0.25" width="0.14" height="0.5"/>` +
    `<rect x="0.03" y="0.38" width="0.05" height="0.24"/><rect x="0.92" y="0.38" width="0.05" height="0.24"/></g>`,
  basket: (s) =>
    `<rect width="1" height="1" fill="#c9622f"/>` +
    `<g fill="none" stroke="${LINE}" stroke-width="${s}">` +
    `<rect x="0.06" y="0.04" width="0.88" height="0.92"/><line x1="0.06" y1="0.5" x2="0.94" y2="0.5"/>` +
    `<ellipse cx="0.5" cy="0.5" rx="0.16" ry="0.09"/>` +
    `<rect x="0.34" y="0.04" width="0.32" height="0.2"/><rect x="0.34" y="0.76" width="0.32" height="0.2"/></g>`,
  tennis: (s) =>
    `<rect width="1" height="1" fill="#c9622f"/>` +
    `<g fill="none" stroke="${LINE}" stroke-width="${s}">` +
    `<rect x="0.08" y="0.05" width="0.84" height="0.9"/><line x1="0.2" y1="0.05" x2="0.2" y2="0.95"/><line x1="0.8" y1="0.05" x2="0.8" y2="0.95"/>` +
    `<line x1="0.2" y1="0.27" x2="0.8" y2="0.27"/><line x1="0.2" y1="0.73" x2="0.8" y2="0.73"/><line x1="0.5" y1="0.27" x2="0.5" y2="0.73"/></g>` +
    `<line x1="0.03" y1="0.5" x2="0.97" y2="0.5" stroke="#3a3a36" stroke-width="${s * 1.6}"/>`,
};

/** SVG de la mida del plànol amb totes les pistes, per compondre'l sobre el terra net. */
export function sportsSvg(sports: Sport[], width: number, height: number): string {
  const groups = sports.map(({ type, tl, tr, bl }) => {
    const u: Point = [tr[0] - tl[0], tr[1] - tl[1]];
    const v: Point = [bl[0] - tl[0], bl[1] - tl[1]];
    // Gruix de línia d'un píxel i mig del plànol, expressat en unitats del quadrat.
    const stroke = 1.5 / Math.min(Math.hypot(...u), Math.hypot(...v));
    return `<g transform="matrix(${u[0]} ${u[1]} ${v[0]} ${v[1]} ${tl[0]} ${tl[1]})">${COURTS[type](Number(stroke.toFixed(4)))}</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${groups.join("")}</svg>`;
}
