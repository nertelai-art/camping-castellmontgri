import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";
import { mediaUrl } from "./media";

/**
 * Puja un PDF directament del navegador al bucket, amb la sessió de l'editor (RLS decideix). Només per al que no cap
 * al cos d'una funció de Vercel. Retorna l'adreça pública del fitxer.
 */
export async function uploadPdf(file: Blob, folder: string): Promise<{ url: string } | { error: string }> {
  const supabase = createBrowserClient<Database>(supabaseEnv.NEXT_PUBLIC_SUPABASE_URL, supabaseEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const path = `panell/${folder}/${crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: "application/pdf", cacheControl: "31536000" });
  return error ? { error: error.message } : { url: mediaUrl(path) };
}
