// Dona accés al panell a un compte que ja existeix a Supabase Auth (o li canvia el rol, o l'hi treu):
//
//   pnpm editor:grant correu@exemple.com            → editor
//   pnpm editor:grant correu@exemple.com admin      → administrador
//   pnpm editor:grant correu@exemple.com cap        → li treu l'accés (el compte continua existint)
//
// El compte es crea abans al tauler de Supabase (Authentication → Users → Add user), on la persona tria la seva
// contrasenya: aquest script no crea comptes ni toca contrasenyes. Fa servir la clau secreta de .env.local.

import { createClient } from "@supabase/supabase-js";

const [email, role = "editor"] = process.argv.slice(2);
if (!email || !["editor", "admin", "cap"].includes(role)) {
  console.error("Ús: pnpm editor:grant <correu> [editor|admin|cap]");
  process.exit(2);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) process.loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "");
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error("Falten NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY a .env.local");

const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
console.log(`▶ ${url}`);

const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (error) throw error;
const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(`No hi ha cap compte amb el correu ${email}. Crea'l primer al tauler de Supabase (Authentication → Users → Add user).`);
  process.exit(1);
}

if (role === "cap") {
  const { error: removeError } = await supabase.from("profiles").delete().eq("id", user.id);
  if (removeError) throw removeError;
  console.log(`✓ ${email} ja no té accés al panell.`);
} else {
  const { error: grantError } = await supabase.from("profiles").upsert({ id: user.id, role: role as "editor" | "admin" });
  if (grantError) throw grantError;
  console.log(`✓ ${email} pot entrar al panell com a ${role === "admin" ? "administrador" : "editor"}.`);
}
