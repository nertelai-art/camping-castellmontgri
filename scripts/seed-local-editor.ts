// Crea un usuari de prova per al panell al Supabase LOCAL. Només per desenvolupar i provar:
//
//   pnpm local node scripts/seed-local-editor.ts
//
// La contrasenya es genera a l'atzar i es desa a `.env.local-editor` (fora del git), d'on la llegeixen les proves.
// Es nega a córrer contra res que no sigui 127.0.0.1 / localhost: els usuaris de debò es conviden, no es creen aquí.

import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const secret = process.env.SUPABASE_SECRET_KEY ?? "";
const host = url ? new URL(url).hostname : "";
if (!["127.0.0.1", "localhost"].includes(host) || !secret) {
  console.error(`Aquest script només funciona contra el Supabase local (ara apunta a «${host || "enlloc"}»). Fes servir: pnpm local node scripts/seed-local-editor.ts`);
  process.exit(1);
}

const EMAIL = "editor@camping.test";
const password = randomBytes(18).toString("base64url");
const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: list, error: listError } = await supabase.auth.admin.listUsers();
if (listError) throw listError;
const existing = list.users.find((u) => u.email === EMAIL);
const user = existing
  ? (await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true })).data.user
  : (await supabase.auth.admin.createUser({ email: EMAIL, password, email_confirm: true })).data.user;
if (!user) throw new Error("No s'ha pogut crear l'usuari de prova.");

const { error } = await supabase.from("profiles").upsert({ id: user.id, role: "admin", display_name: "Editor de prova" });
if (error) throw error;

await writeFile(".env.local-editor", `# Usuari de prova del panell, només al Supabase local. Generat per scripts/seed-local-editor.ts.\nLOCAL_EDITOR_EMAIL=${EMAIL}\nLOCAL_EDITOR_PASSWORD=${password}\n`);
console.log(`✓ Usuari de prova ${EMAIL} (administrador). La contrasenya és a .env.local-editor`);
