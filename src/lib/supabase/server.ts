import "server-only";
import { createClient } from "@supabase/supabase-js";
import { tagsForRequest } from "@/lib/content/tags";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Client de lectura per a la web pública: clau publicable + RLS (només es veu el que està publicat).
 * Cada petició queda a la caché de Next amb etiquetes; l'admin les invalida en desar (/api/revalidate).
 */
export function contentClient() {
  return createClient<Database>(supabaseEnv.NEXT_PUBLIC_SUPABASE_URL, supabaseEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, cache: "force-cache", next: { tags: tagsForRequest(input.toString()) } }),
    },
  });
}
