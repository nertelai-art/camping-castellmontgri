// Imatges que es pugen des del panell. El navegador les redueix i les passa a JPEG abans d'enviar-les (una foto de
// mòbil pesa 5–8 MB i una funció de Vercel no accepta cossos de més de 4,5 MB); el servidor comprova que el que arriba
// és de debò un JPEG i en llegeix la mida de la capçalera, sense fiar-se del que digui el client.

/** Costat llarg màxim, en píxels, de la imatge que es desa. */
export const MAX_SIDE = 2400;
/** Pes màxim del fitxer que accepta el servidor. */
export const MAX_BYTES = 3 * 1024 * 1024;

export type Size = { width: number; height: number };

/** La mida més gran que hi cap dins de `max` px de costat llarg, sense ampliar mai. */
export function fitWithin(size: Size, max = MAX_SIDE): Size {
  const scale = Math.min(1, max / Math.max(size.width, size.height));
  return { width: Math.max(1, Math.round(size.width * scale)), height: Math.max(1, Math.round(size.height * scale)) };
}

/**
 * Mida d'un JPEG llegida dels seus marcadors (SOF0–SOF15, tret de DHT, JPG i DAC), o `null` si no és un JPEG sencer.
 * Serveix alhora de comprovació que el fitxer és una imatge.
 */
export function jpegSize(bytes: Uint8Array): Size | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let at = 2;
  while (at + 9 < bytes.length) {
    if (bytes[at] !== 0xff) return null;
    const marker = bytes[at + 1]!;
    if (marker === 0xff) {
      at += 1; // farciment
      continue;
    }
    const length = (bytes[at + 2]! << 8) | bytes[at + 3]!;
    if (length < 2) return null;
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const height = (bytes[at + 5]! << 8) | bytes[at + 6]!;
      const width = (bytes[at + 7]! << 8) | bytes[at + 8]!;
      return width > 0 && height > 0 ? { width, height } : null;
    }
    at += 2 + length;
  }
  return null;
}
