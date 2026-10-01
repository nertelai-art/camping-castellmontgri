// Redueix una foto i la passa a JPEG al navegador, abans d'enviar-la: així una foto de mòbil de 8 MB arriba al
// servidor pesant ben poc (una funció de Vercel no accepta cossos de més de 4,5 MB).

import { fitWithin, MAX_BYTES } from "@/lib/admin/image";

export type Picked = { blob: Blob; url: string; width: number; height: number };

export async function toJpeg(file: File): Promise<Picked> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const { width, height } = fitWithin({ width: bitmap.width, height: bitmap.height });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  // Fons blanc: un PNG amb transparència quedaria negre en passar a JPEG.
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  for (const quality of [0.86, 0.75, 0.6]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= MAX_BYTES) return { blob, url: URL.createObjectURL(blob), width, height };
  }
  throw new Error("size");
}
