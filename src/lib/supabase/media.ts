import { supabaseEnv } from "./env";

/** Imatge ja resolta al servidor: els components de client reben l'URL i no importen res de Supabase. */
export type MediaRef = { src: string; path: string; width: number | null; height: number | null; alt: string };

/** URL pública d'un fitxer del bucket «media». */
export const mediaUrl = (path: string) => `${supabaseEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
