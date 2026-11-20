"""
El mapa de «Com arribar-hi» com a imatge nostra (`public/map/zona.webp`): surt a l'instant i, en visitar la web, no es demana res a
cap servidor de tercers. Es fa una sola vegada amb les rajoles d'OpenStreetMap del voltant del càmping (unes poques, no una descàrrega
massiva) i el càmping queda al centre exacte de la imatge (l'agulla la posa el component). Les dades i les rajoles són © OpenStreetMap
contributors (ODbL i CC BY-SA): la web ha d'ensenyar l'atribució, encara que sigui petita.

    python scripts/build-directions-map.py 42.0511424 3.1827003

Si canvien les coordenades del càmping a les dades generals, es torna a fer.
"""

import io
import math
import sys
import urllib.request

from PIL import Image

ZOOM = 15
WIDTH, HEIGHT = 1200, 900  # 4:3, prou per a una pantalla retina amb el mapa a uns 600 px d'ample
TILE = 256
# Les rajoles d'OpenStreetMap demanen un User-Agent que digui qui és; un nom de projecte, cap dada personal.
HEADERS = {"User-Agent": "camping-castellmontgri-web/1.0 (static map, built once)"}


def pixel(lat: float, lng: float, zoom: int) -> tuple[float, float]:
    """On cau un punt al mapa sencer a aquest zoom, en píxels (projecció de Mercator, com les rajoles)."""
    scale = TILE * 2**zoom
    x = (lng + 180) / 360 * scale
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * scale
    return x, y


def main(lat: float, lng: float, out: str = "public/map/zona.webp") -> None:
    cx, cy = pixel(lat, lng, ZOOM)
    left, top = cx - WIDTH / 2, cy - HEIGHT / 2
    first_x, first_y = int(left // TILE), int(top // TILE)
    last_x, last_y = int((left + WIDTH) // TILE), int((top + HEIGHT) // TILE)
    canvas = Image.new("RGB", ((last_x - first_x + 1) * TILE, (last_y - first_y + 1) * TILE))
    for tx in range(first_x, last_x + 1):
        for ty in range(first_y, last_y + 1):
            url = f"https://tile.openstreetmap.org/{ZOOM}/{tx}/{ty}.png"
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=30) as response:
                tile = Image.open(io.BytesIO(response.read())).convert("RGB")
            canvas.paste(tile, ((tx - first_x) * TILE, (ty - first_y) * TILE))
    ox, oy = round(left - first_x * TILE), round(top - first_y * TILE)
    canvas.crop((ox, oy, ox + WIDTH, oy + HEIGHT)).save(out, quality=80, method=6)
    print(f"{out}: {WIDTH}x{HEIGHT}, zoom {ZOOM}, {(last_x - first_x + 1) * (last_y - first_y + 1)} rajoles")


if __name__ == "__main__":
    main(float(sys.argv[1]), float(sys.argv[2]))
