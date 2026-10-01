import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Client de l'admin: la mateixa clau publicable que la web, però amb la sessió de qui ha iniciat sessió
 * (galetes). El que pot llegir i escriure ho decideix RLS segons el seu rol; aquí no hi ha cap clau secreta.
 */
export async function sessionClient() {
  const store = await cookies();
  return createServerClient<Database>(supabaseEnv.NEXT_PUBLIC_SUPABASE_URL, supabaseEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Des d'un Server Component no es poden escriure galetes: la sessió ja la refresca el proxy.
        }
      },
    },
  });
}

export type Editor = { id: string; email: string; name: string | null; role: Database["public"]["Enums"]["app_role"] };

/**
 * Qui hi ha darrere la petició, si és un editor del panell. `getUser` valida el token contra Supabase
 * (no es fia de la galeta) i el perfil diu el rol. Sense perfil no s'és editor, encara que es tingui compte.
 */
export const currentEditor = cache(async (): Promise<Editor | null> => {
  const supabase = await sessionClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("role, display_name").eq("id", data.user.id).maybeSingle();
  if (!profile) return null;
  return { id: data.user.id, email: data.user.email ?? "", name: profile.display_name, role: profile.role };
});
