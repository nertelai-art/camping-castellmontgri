// Executa una ordre contra el Supabase local (Docker) en lloc del del núvol:
//
//   pnpm local pnpm seed                 carrega el contingut a la base local
//   pnpm local node scripts/seed-local-editor.ts
//   pnpm local next build && pnpm local next start -p 3200
//
// Les adreces i claus surten de `supabase status`: no s'escriuen enlloc. Les variables de l'entorn guanyen
// als fitxers .env, així que la resta de la configuració (.env.local) continua valent.

import { execFileSync, spawn } from "node:child_process";

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("Ús: pnpm local <ordre> [arguments]");
  process.exit(2);
}

let status: string;
try {
  status = execFileSync("pnpm", ["exec", "supabase", "status", "-o", "env"], { encoding: "utf8", shell: true, stdio: ["ignore", "pipe", "ignore"] });
} catch {
  console.error("El Supabase local no està engegat. Engega'l amb: pnpm exec supabase start");
  process.exit(1);
}
const local = Object.fromEntries(
  status
    .split(/\r?\n/)
    .map((line) => /^([A-Z0-9_]+)="?(.*?)"?$/.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => [m[1]!, m[2]!]),
);
const url = local.API_URL;
const publishable = local.PUBLISHABLE_KEY ?? local.ANON_KEY;
const secret = local.SECRET_KEY ?? local.SERVICE_ROLE_KEY;
if (!url || !publishable || !secret) {
  console.error("No he pogut llegir l'adreça i les claus de `supabase status`.");
  process.exit(1);
}

const child = spawn(command, args, {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
    SUPABASE_SECRET_KEY: secret,
    // El seed no ha d'anar a buidar la caché de cap web: aquí no n'hi ha cap d'engegada per força.
    REVALIDATE_URL: "",
  },
});
child.on("exit", (code) => process.exit(code ?? 1));
