// La volta de la maqueta per al mapa flotant (`public/map/teaser.mp4`): obre el mapa de la portada (`pnpm dev` engegat),
// amaga el que hi ha a sobre del canvas i el fa girar amb el botó dret (MapControls sense inèrcia: arrossegar dx px gira
// 2π·dx/alçada), amb una captura quadrada a cada pas. S'executa a mà quan canvia la maqueta:
//   PLAYWRIGHT_CORE=<camí a playwright-core> CHROME=<chrome.exe> node scripts/map-teaser.mjs <carpeta> 240
// (240 fotogrames: 1,5° per pas; a 24 per segon, una volta cada 10 s) i després es fa el vídeo i el fotograma quiet (els noms, amb tres xifres: f000.png…):
//   ffmpeg -framerate 24 -i <carpeta>/f%03d.png -vf "scale=224:224:flags=lanczos,format=yuv420p" -c:v libx264 -preset veryslow
//          -crf 31 -profile:v main -movflags +faststart -an public/map/teaser.mp4
//   ffmpeg -i <carpeta>/f000.png -vf scale=224:224 -quality 78 public/map/teaser-still.webp
import { createRequire } from "node:module";

// playwright-core no és dependència del projecte: es fa servir el d'una altra instal·lació (PLAYWRIGHT_CORE).
const load = createRequire(import.meta.url);
const { chromium } = load(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const out = process.argv[2];
const frames = Number(process.argv[3] || 36);
const probe = process.argv[4] === "probe";

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME,
    args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"],
  });
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 });
  await page.goto("http://localhost:3000/es", { waitUntil: "networkidle", timeout: 120000 });
  await page.mouse.move(10, 10);
  await page.mouse.click(5, 300);
  await page.evaluate(() => window.dispatchEvent(new Event("camping:map-open")));
  await page.waitForSelector(".map-shell canvas", { timeout: 120000 });
  await page.waitForTimeout(9000);
  // Fora tot el que no sigui el canvas: columna, botons, marcadors i etiquetes.
  await page.addStyleTag({
    content: `.map-shell *:not(canvas):not(:has(canvas)) { visibility: hidden !important; }
              nextjs-portal { display: none !important; }`,
  });
  await page.waitForTimeout(500);
  const box = await page.evaluate(() => {
    const r = document.querySelector(".map-shell canvas").getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const size = Math.min(box.w, box.h);
  const clip = { x: box.x + (box.w - size) / 2, y: box.y + (box.h - size) / 2, width: size, height: size };
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  // Més a prop: a la miniatura, la maqueta sencera són cases d'un píxel.
  await page.mouse.move(cx, cy);
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, -120);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(1500);
  const dx = box.h / frames;
  for (let i = 0; i < (probe ? 1 : frames); i++) {
    await page.screenshot({ path: `${out}/f${String(i).padStart(3, "0")}.png`, clip });
    await page.mouse.move(cx, cy);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(cx + dx, cy, { steps: 3 });
    await page.mouse.up({ button: "right" });
    await page.waitForTimeout(700);
  }
  console.log(JSON.stringify({ box, size, dx }));
  await browser.close();
})();
