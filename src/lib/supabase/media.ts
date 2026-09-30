import { supabaseEnv } from "./env";

export type MediaRef = { path: string; width: number | null; height: number | null; alt: string };

/** URL pública d'un fitxer del bucket «media». */
export const mediaUrl = (path: string) => `${supabaseEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
