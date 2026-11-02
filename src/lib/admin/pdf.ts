// Els PDF que es pugen des del panell (les cartes). Van directes del navegador a Storage: una funció de Vercel no accepta
// cossos de més de 4,5 MB i una carta amb fotos en fa sovint més. El límit de 20 MB és el del bucket.

export const MAX_PDF_BYTES = 20 * 1024 * 1024;

/** Si els primers bytes són els d'un PDF. */
export const isPdf = (bytes: Uint8Array) => [0x25, 0x50, 0x44, 0x46, 0x2d].every((byte, i) => bytes[i] === byte);

/** Per què no es pot pujar aquest fitxer, o `null` si es pot. */
export function pdfProblem(file: { size: number }, firstBytes: Uint8Array): string | null {
  if (!isPdf(firstBytes)) return "Aquest fitxer no és un PDF.";
  if (file.size > MAX_PDF_BYTES) return "El PDF pesa més de 20 MB. Redueix-lo abans de pujar-lo.";
  return null;
}
